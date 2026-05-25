import jwt from "jsonwebtoken";
import BattleRoom from "../models/BattleRoom.js";
import BattleResult from "../models/BattleResult.js";
import User from "../models/User.js";
import connectToDatabase from "../utils/db.js";
import {
  ROOM_STATES,
  ROUND_DURATION_MS,
  TOTAL_ROUNDS,
  MIN_PLAYERS_TO_START,
  MAX_PLAYERS_PER_ROOM,
  generateRoomCode,
  buildQuizChallengeForRound,
  scoreQuizSubmission,
  ROUND_END_PAUSE_MS,
} from "../controllers/battleController.js";
import { updateGlobalLeaderboardForBattle } from "../controllers/leaderboardController.js";
import { broadcastAdminEvent } from "../utils/adminEvents.js";

const roomTimers = new Map();
const advancingRooms = new Set();

async function authenticateBattleSocket(socket) {
  await connectToDatabase();
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

  if (!token || typeof token !== "string") {
    throw new Error("UNAUTHORIZED_NO_TOKEN");
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("SERVER_MISCONFIGURED_JWT");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new Error("UNAUTHORIZED_INVALID_TOKEN");
  }

  const user = await User.findById(decoded.id).select("name email").lean();
  if (!user) {
    throw new Error("UNAUTHORIZED_USER_NOT_FOUND");
  }

  const displayName = (
    typeof user.name === "string" && user.name.trim() ? user.name.trim() : user.email?.split("@")[0] || "Player"
  ).slice(0, 48);

  return {
    userId: user._id,
    displayName,
  };
}

function getLeaderboard(players = []) {
  return [...players]
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ username: p.username, score: p.score, socketId: p.socketId }));
}

async function emitRoomsList(io, targetSocket = null) {
  const rooms = await BattleRoom.find(
    { state: { $in: [ROOM_STATES.WAITING, ROOM_STATES.ACTIVE] } },
    { roomCode: 1, players: 1, state: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const payload = {
    rooms: rooms.map((room) => ({
      roomCode: room.roomCode,
      playerCount: room.players.length,
      state: room.state,
    })),
  };

  if (targetSocket) {
    targetSocket.emit("rooms:list", payload);
    return;
  }

  io.emit("rooms:list", payload);
}

function clearRoomTimer(roomCode) {
  const timer = roomTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    roomTimers.delete(roomCode);
  }
}

async function generateUniqueRoomCode() {
  let roomCode = generateRoomCode();
  while (await BattleRoom.exists({ roomCode })) {
    roomCode = generateRoomCode();
  }
  return roomCode;
}

async function emitPlayerList(io, roomCode) {
  const room = await BattleRoom.findOne({ roomCode }).lean();
  if (!room) return;
  io.to(roomCode).emit("room:player_list", {
    roomCode,
    state: room.state,
    currentRound: room.currentRound,
    players: room.players.map((p) => ({
      username: p.username,
      score: p.score,
      socketId: p.socketId,
    })),
  });
}

async function finishGame(io, roomCode) {
  clearRoomTimer(roomCode);
  const room = await BattleRoom.findOne({ roomCode });
  if (!room) return;

  room.state = ROOM_STATES.FINISHED;
  await room.save();

  const leaderboard = getLeaderboard(room.players);
  const winner = leaderboard[0]?.username || "No winner";

  const playerScoresForLb = leaderboard.map((entry) => {
    const p = room.players.find((x) => x.username === entry.username);
    return {
      username: entry.username,
      score: entry.score,
      userId: p?.accountId ?? null,
    };
  });

  const rounds = room.challenges.map((challenge) => ({
    round: challenge.round,
    category: challenge.category,
    challengePrompt: challenge.prompt,
    submissions: challenge.submissions.map((submission) => ({
      username: submission.username,
      score: submission.totalScore,
      baseScore: submission.baseScore,
      speedBonus: submission.speedBonus,
      feedback: submission.judge.feedback,
    })),
  }));

  await BattleResult.create({
    roomCode,
    winner,
    playerScores: playerScoresForLb.map((p) => ({ username: p.username, score: p.score })),
    rounds,
    completedAt: new Date(),
  });

  await updateGlobalLeaderboardForBattle({
    roomCode,
    winner,
    playerScores: playerScoresForLb,
  });

  io.to(roomCode).emit("leaderboard:updated", { roomCode, leaderboard });
  io.to(roomCode).emit("game:ended", {
    roomCode,
    winner,
    leaderboard,
    rounds,
  });

  broadcastAdminEvent({
    type: "battle",
    action: "game_ended",
    roomCode,
    winner,
    playerCount: leaderboard.length,
  });
}

async function finalizeRound(io, roomCode, roundNumber) {
  clearRoomTimer(roomCode);

  const advanceKey = `${roomCode}:${roundNumber}`;
  if (advancingRooms.has(advanceKey)) return;
  advancingRooms.add(advanceKey);

  try {
    const room = await BattleRoom.findOne({ roomCode });
    if (!room || room.state !== ROOM_STATES.ACTIVE) {
      advancingRooms.delete(advanceKey);
      return;
    }
    if (room.currentRound !== roundNumber) {
      advancingRooms.delete(advanceKey);
      return;
    }

    const challenge = room.challenges.find((item) => item.round === roundNumber);
    if (!challenge) {
      advancingRooms.delete(advanceKey);
      return;
    }
    if (challenge.endedAt) {
      advancingRooms.delete(advanceKey);
      return;
    }

    challenge.endedAt = new Date();

    for (const player of room.players) {
      const hasRow = challenge.submissions.some((s) => s.socketId === player.socketId);
      if (!hasRow) {
        const judge = scoreQuizSubmission({
          choiceIndex: -999,
          correctChoiceIndex: challenge.correctChoiceIndex,
          explainCorrect: challenge.explainCorrect,
        });
        challenge.submissions.push({
          username: player.username,
          socketId: player.socketId,
          choiceIndex: -1,
          prompt: "(no answer)",
          submissionTime: new Date(),
          baseScore: 0,
          speedBonus: 0,
          totalScore: 0,
          judge: {
            clarity: judge.clarity,
            creativity: judge.creativity,
            effectiveness: judge.effectiveness,
            feedback: judge.feedback,
          },
        });
      }
    }

    await room.save();

    const leaderboard = getLeaderboard(room.players);
    const results = challenge.submissions.map((s) => ({
      username: s.username,
      choiceIndex: typeof s.choiceIndex === "number" ? s.choiceIndex : -1,
      selectedLabel: s.prompt,
      score: s.totalScore,
      baseScore: s.baseScore,
      speedBonus: s.speedBonus,
      judge: {
        clarity: s.judge.clarity,
        creativity: s.judge.creativity,
        effectiveness: s.judge.effectiveness,
        feedback: s.judge.feedback,
      },
    }));

    const maxLessonScore = results.reduce((m, r) => Math.max(m, r.score), 0);
    const roundHeroes = results.filter((r) => r.score === maxLessonScore).map((r) => r.username);

    io.to(roomCode).emit("round:ended", {
      roomCode,
      round: roundNumber,
      leaderboard,
      results,
      roundHeroes,
      totalRounds: TOTAL_ROUNDS,
      quizReveal: {
        question: challenge.prompt,
        choices: challenge.choices || [],
        correctIndex: challenge.correctChoiceIndex,
        explainCorrect: challenge.explainCorrect || "",
        lesson: challenge.lesson || challenge.category || "",
      },
    });

    io.to(roomCode).emit("leaderboard:updated", {
      roomCode,
      leaderboard,
    });

    if (roundNumber >= TOTAL_ROUNDS) {
      advancingRooms.delete(advanceKey);
      await finishGame(io, roomCode);
      return;
    }

    setTimeout(async () => {
      try {
        const fresh = await BattleRoom.findOne({ roomCode });
        if (!fresh || fresh.state !== ROOM_STATES.ACTIVE || fresh.currentRound !== roundNumber) return;

        fresh.currentRound += 1;
        await fresh.save();
        await startRound(io, roomCode);
      } catch (err) {
        console.error("finalizeRound advance error:", err);
      } finally {
        advancingRooms.delete(advanceKey);
      }
    }, ROUND_END_PAUSE_MS);
  } catch (err) {
    advancingRooms.delete(advanceKey);
    console.error("finalizeRound error:", err);
  }
}

async function startRound(io, roomCode) {
  const room = await BattleRoom.findOne({ roomCode });
  if (!room || room.state !== ROOM_STATES.ACTIVE) return;

  const roundNumber = room.currentRound;
  if (!roundNumber || roundNumber > TOTAL_ROUNDS) {
    await finishGame(io, roomCode);
    return;
  }

  const challenge = await buildQuizChallengeForRound(roundNumber, room.challenges);

  room.challenges.push(challenge);

  room.players.forEach((player) => {
    player.submissionTime = null;
    player.currentPrompt = "";
  });

  await room.save();

  io.to(roomCode).emit("challenge:new", {
    roomCode,
    round: roundNumber,
    category: challenge.category,
    lesson: challenge.lesson,
    quizMode: true,
    prompt: challenge.prompt,
    choices: challenge.choices || [],
    durationMs: ROUND_DURATION_MS,
    totalRounds: TOTAL_ROUNDS,
    roundsLeft: TOTAL_ROUNDS - roundNumber + 1,
  });

  clearRoomTimer(roomCode);
  const timer = setTimeout(async () => {
    await finalizeRound(io, roomCode, roundNumber);
  }, ROUND_DURATION_MS);
  roomTimers.set(roomCode, timer);
}

async function maybeStartGame(io, roomCode) {
  const room = await BattleRoom.findOne({ roomCode });
  if (!room) return;

  if (room.state === ROOM_STATES.WAITING && room.players.length >= MIN_PLAYERS_TO_START) {
    room.state = ROOM_STATES.ACTIVE;
    room.currentRound = 1;
    await room.save();

    io.to(roomCode).emit("game:started", {
      roomCode,
      totalRounds: TOTAL_ROUNDS,
      roundDurationMs: ROUND_DURATION_MS,
      players: room.players.map((p) => ({ username: p.username, score: p.score })),
    });

    await startRound(io, roomCode);
  }
}

export default function initializeBattleSocket(io) {
  io.use(async (socket, next) => {
    try {
      const auth = await authenticateBattleSocket(socket);
      socket.battleUserId = auth.userId;
      socket.battleDisplayName = auth.displayName;
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error("UNAUTHORIZED_UNKNOWN"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:create", async () => {
      try {
        const displayName = socket.battleDisplayName;
        const accountId = socket.battleUserId;

        const roomCode = await generateUniqueRoomCode();
        const prev = socket.battleRoomCode;
        if (prev) socket.leave(prev);
        socket.battleRoomCode = roomCode;

        const room = await BattleRoom.create({
          roomCode,
          players: [
            {
              username: displayName,
              accountId,
              socketId: socket.id,
              score: 0,
            },
          ],
          state: ROOM_STATES.WAITING,
          currentRound: 0,
          challenges: [],
        });

        socket.join(roomCode);
        socket.emit("room:created", {
          roomCode,
          roomId: room._id.toString(),
          username: displayName,
        });
        broadcastAdminEvent({
          type: "battle",
          action: "room_created",
          roomCode,
          user: { name: displayName, id: String(accountId) },
          playerCount: 1,
        });
        await emitPlayerList(io, roomCode);
        await emitRoomsList(io);
      } catch (error) {
        console.error("room:create error:", error);
        socket.emit("error", { message: "Failed to create room." });
      }
    });

    const handleRoomJoin = async ({ roomCode: rawCode }) => {
      try {
        if (!rawCode || !rawCode.trim()) {
          socket.emit("error", { message: "roomCode is required." });
          return;
        }

        const displayName = socket.battleDisplayName;
        const accountId = socket.battleUserId;

        const room = await BattleRoom.findOne({ roomCode: rawCode.toUpperCase().trim() });
        if (!room) {
          socket.emit("error", { message: "Room not found." });
          return;
        }

        const existing = room.players.find(
          (player) => player.accountId && player.accountId.toString() === accountId.toString()
        );

        if (existing) {
          const prev = socket.battleRoomCode;
          if (prev && prev !== room.roomCode) socket.leave(prev);
          socket.battleRoomCode = room.roomCode;
          existing.username = displayName;
          if (existing.socketId !== socket.id) {
            existing.socketId = socket.id;
          }
          await room.save();
          socket.join(room.roomCode);
          socket.emit("room:joined", { roomCode: room.roomCode });
          await emitPlayerList(io, room.roomCode);
          await emitRoomsList(io);
          return;
        }

        if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
          socket.emit("error", { message: "Room is full (max 10 players)." });
          return;
        }
        if (room.state !== ROOM_STATES.WAITING) {
          socket.emit("error", { message: "Game already started in this room." });
          return;
        }

        const prev = socket.battleRoomCode;
        if (prev && prev !== room.roomCode) socket.leave(prev);
        socket.battleRoomCode = room.roomCode;

        room.players.push({
          username: displayName,
          accountId,
          socketId: socket.id,
          score: 0,
        });
        await room.save();

        socket.join(room.roomCode);
        socket.emit("room:joined", { roomCode: room.roomCode });
        await emitPlayerList(io, room.roomCode);
        await emitRoomsList(io);
        await maybeStartGame(io, room.roomCode);
      } catch {
        socket.emit("error", { message: "Failed to join room." });
      }
    };

    socket.on("room:join", handleRoomJoin);
    socket.on("join_room", handleRoomJoin);

    const handleQuizSubmit = async ({ roomCode: rawRoom, choiceIndex: rawChoice, answerIndex }) => {
      try {
        const roomCodeNormalized = typeof rawRoom === "string" ? rawRoom.toUpperCase() : "";
        const choiceIndex =
          typeof rawChoice === "number"
            ? rawChoice
            : typeof answerIndex === "number"
              ? answerIndex
              : Number(rawChoice ?? answerIndex);

        if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex > 3) {
          socket.emit("error", { message: "Pick answer A–D (choiceIndex 0–3)." });
          return;
        }

        const room = await BattleRoom.findOne({ roomCode: roomCodeNormalized });
        if (!room || room.state !== ROOM_STATES.ACTIVE) {
          socket.emit("error", { message: "No active game for this room." });
          return;
        }

        const player = room.players.find((p) => p.socketId === socket.id);
        if (!player) {
          socket.emit("error", { message: "Player not found in room." });
          return;
        }

        const challenge = room.challenges.find((item) => item.round === room.currentRound);
        if (!challenge) {
          socket.emit("error", { message: "No active question found." });
          return;
        }

        const choices = challenge.choices || [];
        if (choices.length !== 4) {
          socket.emit("error", { message: "Malformed quiz challenge on server." });
          return;
        }

        const alreadySubmitted = challenge.submissions.some((s) => s.socketId === socket.id);
        if (alreadySubmitted) {
          socket.emit("error", { message: "Already answered this round." });
          return;
        }

        const submissionTime = new Date();
        const judge = scoreQuizSubmission({
          choiceIndex,
          correctChoiceIndex: challenge.correctChoiceIndex,
          explainCorrect: challenge.explainCorrect,
        });

        const speedBonus = challenge.submissions.length === 0 ? 10 : 0;
        const totalScore = Math.max(0, Math.min(102, judge.baseScore + speedBonus));

        const promptLabel = choices[choiceIndex]?.slice(0, 480) || `Option ${choiceIndex + 1}`;

        challenge.submissions.push({
          username: player.username,
          socketId: socket.id,
          choiceIndex,
          prompt: promptLabel,
          submissionTime,
          baseScore: judge.baseScore,
          speedBonus,
          totalScore,
          judge: {
            clarity: judge.clarity,
            creativity: judge.creativity,
            effectiveness: judge.effectiveness,
            feedback: judge.feedback,
          },
        });

        player.submissionTime = submissionTime;
        player.currentPrompt = promptLabel;
        player.score += totalScore;

        await room.save();

        const leaderboard = getLeaderboard(room.players);
        const isCorrect = choiceIndex === challenge.correctChoiceIndex;
        const awaitingOpponent = challenge.submissions.length < room.players.length;

        io.to(room.roomCode).emit("round:scored", {
          roomCode: room.roomCode,
          round: room.currentRound,
          username: player.username,
          choiceIndex,
          isCorrect,
          awaitingOpponent,
          score: totalScore,
          baseScore: judge.baseScore,
          speedBonus,
          judge: {
            clarity: judge.clarity,
            creativity: judge.creativity,
            effectiveness: judge.effectiveness,
            feedback: judge.feedback,
          },
        });
        broadcastAdminEvent({
          type: "battle",
          action: "answer_submitted",
          roomCode: room.roomCode,
          round: room.currentRound,
          user: { name: player.username },
          text: promptLabel,
          isCorrect,
          score: totalScore,
        });
        io.to(room.roomCode).emit("leaderboard:updated", {
          roomCode: room.roomCode,
          leaderboard,
        });

        if (challenge.submissions.length >= room.players.length) {
          await finalizeRound(io, room.roomCode, room.currentRound);
        }
      } catch (error) {
        console.error("quiz submit:", error);
        socket.emit("error", { message: "Failed to submit answer." });
      }
    };

    socket.on("challenge:submit", handleQuizSubmit);
    socket.on("submit_prompt", handleQuizSubmit);

    socket.on("start_game", async ({ roomCode }) => {
      if (!roomCode) return;
      await maybeStartGame(io, roomCode.toUpperCase());
    });

    socket.on("rooms:list", async () => {
      await emitRoomsList(io, socket);
    });

    socket.on("disconnect", async () => {
      const room = await BattleRoom.findOne({ "players.socketId": socket.id });
      if (!room) return;

      room.players = room.players.filter((player) => player.socketId !== socket.id);

      if (room.players.length === 0) {
        clearRoomTimer(room.roomCode);
        await BattleRoom.deleteOne({ _id: room._id });
        await emitRoomsList(io);
        return;
      }

      await room.save();
      await emitPlayerList(io, room.roomCode);
      await emitRoomsList(io);
    });
  });
}
