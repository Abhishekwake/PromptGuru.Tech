import User from "../models/User.js";
import Prompt from "../models/Prompt.js";
import BattleRoom from "../models/BattleRoom.js";
import BattleResult from "../models/BattleResult.js";
import GlobalLeaderboard from "../models/GlobalLeaderboard.js";
import connectToDatabase from "../utils/db.js";
import { isAdminUser } from "../utils/adminAccess.js";
import { getRecentEvents } from "../utils/adminEvents.js";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n) {
  const d = startOfDay();
  d.setDate(d.getDate() - n);
  return d;
}

export async function getAdminOverview(req, res) {
  try {
    await connectToDatabase();
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = daysAgo(6);

    const [
      totalUsers,
      newUsersToday,
      totalPrompts,
      promptsToday,
      activeBattles,
      finishedBattlesToday,
      avgScoreAgg,
      liveEvents,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Prompt.countDocuments(),
      Prompt.countDocuments({ createdAt: { $gte: today } }),
      BattleRoom.countDocuments({ state: { $in: ["WAITING", "ACTIVE"] } }),
      BattleResult.countDocuments({ completedAt: { $gte: today } }),
      Prompt.aggregate([
        { $group: { _id: null, avg: { $avg: "$feedback.score" } } },
      ]),
      Promise.resolve(getRecentEvents(60)),
    ]);

    const avgPromptScore = avgScoreAgg[0]?.avg
      ? Number(avgScoreAgg[0].avg.toFixed(1))
      : 0;

    return res.json({
      kpis: {
        totalUsers,
        newUsersToday,
        totalPrompts,
        promptsToday,
        activeBattles,
        finishedBattlesToday,
        avgPromptScore,
      },
      liveEvents,
    });
  } catch (err) {
    console.error("getAdminOverview:", err);
    return res.status(500).json({ message: "Failed to load admin overview" });
  }
}

export async function getAdminActivityChart(req, res) {
  try {
    await connectToDatabase();
    const since = daysAgo(6);

    const [userBuckets, promptBuckets, battleBuckets] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Prompt.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
            avgScore: { $avg: "$feedback.score" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      BattleResult.aggregate([
        { $match: { completedAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$completedAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = daysAgo(i);
      days.push(d.toISOString().slice(0, 10));
    }

    const toMap = (rows) =>
      Object.fromEntries(rows.map((r) => [r._id, r]));

    const usersMap = toMap(userBuckets);
    const promptsMap = toMap(promptBuckets);
    const battlesMap = toMap(battleBuckets);

    const series = days.map((date) => ({
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      signups: usersMap[date]?.count || 0,
      prompts: promptsMap[date]?.count || 0,
      avgScore: promptsMap[date]?.avgScore
        ? Number(promptsMap[date].avgScore.toFixed(1))
        : 0,
      battles: battlesMap[date]?.count || 0,
    }));

    return res.json({ series });
  } catch (err) {
    console.error("getAdminActivityChart:", err);
    return res.status(500).json({ message: "Failed to load activity chart" });
  }
}

export async function getAdminScoreDistribution(req, res) {
  try {
    await connectToDatabase();
    const buckets = await Prompt.aggregate([
      {
        $bucket: {
          groupBy: "$feedback.score",
          boundaries: [0, 3, 5, 7, 8.5, 10.01],
          default: "other",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const labels = {
      0: "0–2.9",
      3: "3–4.9",
      5: "5–6.9",
      7: "7–8.4",
      8.5: "8.5–10",
    };

    const data = buckets
      .filter((b) => b._id !== "other")
      .map((b) => ({
        range: labels[b._id] || String(b._id),
        count: b.count,
      }));

    const sourceSplit = await User.aggregate([
      {
        $group: {
          _id: { $cond: ["$googleUser", "Google", "Email"] },
          count: { $sum: 1 },
        },
      },
    ]);

    return res.json({
      scoreBuckets: data,
      userSources: sourceSplit.map((s) => ({
        name: s._id,
        value: s.count,
      })),
    });
  } catch (err) {
    console.error("getAdminScoreDistribution:", err);
    return res.status(500).json({ message: "Failed to load distribution" });
  }
}

export async function getAdminUsers(req, res) {
  try {
    await connectToDatabase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const search = (req.query.q || "").trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name email role googleUser isEmailVerified createdAt")
        .lean(),
      User.countDocuments(filter),
    ]);

    const promptCounts = await Prompt.aggregate([
      { $match: { user: { $in: users.map((u) => u._id) } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(
      promptCounts.map((p) => [String(p._id), p.count])
    );

    return res.json({
      page,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role || "user",
        isAdmin: isAdminUser(u),
        googleUser: !!u.googleUser,
        isEmailVerified: !!u.isEmailVerified,
        promptCount: countMap[String(u._id)] || 0,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error("getAdminUsers:", err);
    return res.status(500).json({ message: "Failed to load users" });
  }
}

export async function getAdminUserDetail(req, res) {
  try {
    await connectToDatabase();
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .select("name email role googleUser isEmailVerified avatar createdAt updatedAt")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const [promptTotal, promptStats, prompts, battleStats] = await Promise.all([
      Prompt.countDocuments({ user: userId }),
      Prompt.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: "$feedback.score" },
            avgClarity: { $avg: "$feedback.Clarity" },
            avgSpecificity: { $avg: "$feedback.Specificity" },
            avgUsefulness: { $avg: "$feedback.Usefulness" },
          },
        },
      ]),
      Prompt.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GlobalLeaderboard.findOne({ userId }).lean(),
    ]);

    const stats = promptStats[0] || {};

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        isAdmin: isAdminUser(user),
        googleUser: !!user.googleUser,
        isEmailVerified: !!user.isEmailVerified,
        avatar: user.avatar || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: {
        promptCount: promptTotal,
        avgScore: stats.avgScore ? Number(stats.avgScore.toFixed(1)) : 0,
        avgClarity: stats.avgClarity ? Number(stats.avgClarity.toFixed(1)) : 0,
        avgSpecificity: stats.avgSpecificity ? Number(stats.avgSpecificity.toFixed(1)) : 0,
        avgUsefulness: stats.avgUsefulness ? Number(stats.avgUsefulness.toFixed(1)) : 0,
        battle: battleStats
          ? {
              rank: battleStats.rank,
              totalGamesPlayed: battleStats.totalGamesPlayed,
              wins: battleStats.wins,
              totalScore: battleStats.totalScore,
              averageScore: battleStats.averageScore,
              highestScore: battleStats.highestScore,
            }
          : null,
      },
      prompts: {
        page,
        total: promptTotal,
        totalPages: Math.ceil(promptTotal / limit) || 1,
        items: prompts.map((p) => ({
          id: p._id,
          prompt: p.prompt,
          score: p.feedback?.score ?? null,
          clarity: p.feedback?.Clarity ?? null,
          specificity: p.feedback?.Specificity ?? null,
          usefulness: p.feedback?.Usefulness ?? null,
          tips: p.feedback?.tips ?? [],
          suggestedPrompts: p.feedback?.suggested_prompts ?? [],
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error("getAdminUserDetail:", err);
    return res.status(500).json({ message: "Failed to load user detail" });
  }
}

export async function patchAdminUserRole(req, res) {
  try {
    await connectToDatabase();
    const { userId } = req.params;
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "role must be user or admin" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("name email role");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: isAdminUser(user),
    });
  } catch (err) {
    console.error("patchAdminUserRole:", err);
    return res.status(500).json({ message: "Failed to update role" });
  }
}

export async function getAdminPrompts(req, res) {
  try {
    await connectToDatabase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      Prompt.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      Prompt.countDocuments(),
    ]);

    return res.json({
      page,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      prompts: rows.map((p) => ({
        id: p._id,
        prompt: p.prompt,
        score: p.feedback?.score ?? null,
        clarity: p.feedback?.Clarity ?? null,
        user: p.user
          ? { id: p.user._id, name: p.user.name, email: p.user.email }
          : null,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("getAdminPrompts:", err);
    return res.status(500).json({ message: "Failed to load prompts" });
  }
}

export async function getAdminActiveBattles(req, res) {
  try {
    await connectToDatabase();
    const rooms = await BattleRoom.find({
      state: { $in: ["WAITING", "ACTIVE"] },
    })
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    return res.json({
      rooms: rooms.map((r) => ({
        roomCode: r.roomCode,
        state: r.state,
        playerCount: r.players.length,
        currentRound: r.currentRound,
        players: r.players.map((p) => ({
          username: p.username,
          score: p.score,
          currentPrompt: p.currentPrompt || "",
        })),
        updatedAt: r.updatedAt,
      })),
    });
  } catch (err) {
    console.error("getAdminActiveBattles:", err);
    return res.status(500).json({ message: "Failed to load battles" });
  }
}

export async function getAdminLeaderboardSnapshot(req, res) {
  try {
    await connectToDatabase();
    const top = await GlobalLeaderboard.find()
      .sort({ rank: 1 })
      .limit(10)
      .lean();

    return res.json({
      entries: top.map((e) => ({
        username: e.username,
        rank: e.rank,
        totalGamesPlayed: e.totalGamesPlayed,
        wins: e.wins,
        totalScore: e.totalScore,
        averageScore: e.averageScore,
      })),
    });
  } catch (err) {
    console.error("getAdminLeaderboardSnapshot:", err);
    return res.status(500).json({ message: "Failed to load leaderboard" });
  }
}

export async function postPromptDraftTelemetry(req, res) {
  try {
    const { draft, source = "dashboard" } = req.body;
    if (typeof draft !== "string") {
      return res.status(400).json({ message: "draft required" });
    }
    const trimmed = draft.trim().slice(0, 200);
    if (!trimmed) {
      return res.status(204).end();
    }

    const { broadcastAdminEvent } = await import("../utils/adminEvents.js");
    broadcastAdminEvent({
      type: "typing",
      source,
      user: {
        id: String(req.user._id),
        name: req.user.name,
        email: req.user.email,
      },
      text: trimmed,
    });

    return res.status(204).end();
  } catch (err) {
    console.error("postPromptDraftTelemetry:", err);
    return res.status(500).json({ message: "Telemetry failed" });
  }
}
