import mongoose from "mongoose";
import GlobalLeaderboard from "../models/GlobalLeaderboard.js";
import User from "../models/User.js";

function startOfCurrentWeek(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfCurrentMonth(date = new Date()) {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function ensurePeriodWindows(entry, now = new Date()) {
  const weekStart = startOfCurrentWeek(now);
  const monthStart = startOfCurrentMonth(now);

  if (!entry.periodStartWeek || entry.periodStartWeek.getTime() !== weekStart.getTime()) {
    entry.periodStartWeek = weekStart;
    entry.weeklyGamesPlayed = 0;
    entry.weeklyWins = 0;
    entry.weeklyScore = 0;
  }

  if (!entry.periodStartMonth || entry.periodStartMonth.getTime() !== monthStart.getTime()) {
    entry.periodStartMonth = monthStart;
    entry.monthlyGamesPlayed = 0;
    entry.monthlyWins = 0;
    entry.monthlyScore = 0;
  }
}

export async function updateGlobalLeaderboardForBattle({
  roomCode,
  winner,
  playerScores,
}) {
  if (!Array.isArray(playerScores) || playerScores.length === 0) return;

  const mongoIdFromEntry = (p) => {
    const raw = p.userId ?? p.accountId;
    if (!raw) return null;
    try {
      return String(raw);
    } catch {
      return null;
    }
  };

  const userIdByName = new Map();
  const needNames = [];

  for (const p of playerScores) {
    const id = mongoIdFromEntry(p);
    if (id) continue;
    if (p.username) needNames.push(p.username);
  }

  if (needNames.length) {
    const users = await User.find({
      name: { $in: needNames },
    }).select("_id name");
    for (const user of users) {
      userIdByName.set(user.name, user._id);
    }
  }

  for (const player of playerScores) {
    let userId = mongoIdFromEntry(player);
    if (!userId && player.username) {
      const byName = userIdByName.get(player.username);
      if (byName) userId = String(byName);
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) continue;

    let entry = await GlobalLeaderboard.findOne({ userId });
    if (!entry) {
      entry = await GlobalLeaderboard.create({
        userId,
        username: player.username,
        totalGamesPlayed: 0,
        wins: 0,
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        recentScores: [],
      });
    }

    ensurePeriodWindows(entry);
    const score = Number(player.score) || 0;

    entry.username = player.username;
    entry.totalGamesPlayed += 1;
    entry.totalScore += score;
    entry.averageScore = Number((entry.totalScore / Math.max(entry.totalGamesPlayed, 1)).toFixed(2));
    entry.highestScore = Math.max(entry.highestScore || 0, score);
    entry.recentScores = [...(entry.recentScores || []), score].slice(-20);

    entry.weeklyGamesPlayed += 1;
    entry.weeklyScore += score;
    entry.monthlyGamesPlayed += 1;
    entry.monthlyScore += score;

    if (winner && winner === player.username) {
      entry.wins += 1;
      entry.weeklyWins += 1;
      entry.monthlyWins += 1;
    }

    await entry.save();
  }

  await recalculateGlobalRanks();
}

export async function recalculateGlobalRanks() {
  const entries = await GlobalLeaderboard.find({}).sort({ totalScore: -1, wins: -1, updatedAt: 1 });
  for (let i = 0; i < entries.length; i += 1) {
    entries[i].rank = i + 1;
    await entries[i].save();
  }
}

export async function getGlobalLeaderboard(req, res) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const timeframe = String(req.query.timeframe || "all").toLowerCase();

    let sort = { totalScore: -1, wins: -1, updatedAt: 1 };
    if (timeframe === "week") {
      sort = { weeklyScore: -1, weeklyWins: -1, updatedAt: 1 };
    } else if (timeframe === "month") {
      sort = { monthlyScore: -1, monthlyWins: -1, updatedAt: 1 };
    }

    const entries = await GlobalLeaderboard.find({})
      .sort(sort)
      .limit(limit)
      .lean();

    const normalized = entries.map((entry, index) => {
      if (timeframe === "week") {
        const avg = entry.weeklyGamesPlayed > 0 ? entry.weeklyScore / entry.weeklyGamesPlayed : 0;
        return {
          userId: entry.userId,
          username: entry.username,
          rank: index + 1,
          totalGamesPlayed: entry.weeklyGamesPlayed,
          wins: entry.weeklyWins,
          totalScore: entry.weeklyScore,
          averageScore: Number(avg.toFixed(2)),
          highestScore: entry.highestScore,
          recentScores: entry.recentScores || [],
        };
      }

      if (timeframe === "month") {
        const avg = entry.monthlyGamesPlayed > 0 ? entry.monthlyScore / entry.monthlyGamesPlayed : 0;
        return {
          userId: entry.userId,
          username: entry.username,
          rank: index + 1,
          totalGamesPlayed: entry.monthlyGamesPlayed,
          wins: entry.monthlyWins,
          totalScore: entry.monthlyScore,
          averageScore: Number(avg.toFixed(2)),
          highestScore: entry.highestScore,
          recentScores: entry.recentScores || [],
        };
      }

      return {
        userId: entry.userId,
        username: entry.username,
        rank: entry.rank || index + 1,
        totalGamesPlayed: entry.totalGamesPlayed,
        wins: entry.wins,
        totalScore: entry.totalScore,
        averageScore: entry.averageScore,
        highestScore: entry.highestScore,
        recentScores: entry.recentScores || [],
      };
    });

    return res.status(200).json({
      timeframe,
      count: normalized.length,
      data: normalized,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch global leaderboard." });
  }
}

export async function getUserBattleStats(req, res) {
  try {
    const { userId } = req.params;
    const entry = await GlobalLeaderboard.findOne({ userId }).lean();
    if (!entry) {
      return res.status(404).json({ message: "No battle stats found for this user." });
    }

    const winRate = entry.totalGamesPlayed > 0 ? (entry.wins / entry.totalGamesPlayed) * 100 : 0;
    return res.status(200).json({
      userId: entry.userId,
      username: entry.username,
      rank: entry.rank,
      totalGamesPlayed: entry.totalGamesPlayed,
      wins: entry.wins,
      winRate: Number(winRate.toFixed(2)),
      totalScore: entry.totalScore,
      averageScore: entry.averageScore,
      highestScore: entry.highestScore,
      recentScores: entry.recentScores || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user battle stats." });
  }
}
