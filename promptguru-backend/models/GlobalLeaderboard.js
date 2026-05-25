import mongoose from "mongoose";

const globalLeaderboardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    username: { type: String, required: true, trim: true },
    totalGamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    rank: { type: Number, default: null, index: true },
    recentScores: { type: [Number], default: [] },
    weeklyGamesPlayed: { type: Number, default: 0 },
    weeklyWins: { type: Number, default: 0 },
    weeklyScore: { type: Number, default: 0 },
    monthlyGamesPlayed: { type: Number, default: 0 },
    monthlyWins: { type: Number, default: 0 },
    monthlyScore: { type: Number, default: 0 },
    periodStartWeek: { type: Date, default: null },
    periodStartMonth: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.GlobalLeaderboard || mongoose.model("GlobalLeaderboard", globalLeaderboardSchema);
