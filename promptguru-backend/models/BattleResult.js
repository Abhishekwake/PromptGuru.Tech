import mongoose from "mongoose";

const roundResultSchema = new mongoose.Schema(
  {
    round: { type: Number, required: true },
    category: { type: String, required: true },
    challengePrompt: { type: String, required: true },
    submissions: {
      type: [
        {
          username: { type: String, required: true },
          score: { type: Number, required: true },
          baseScore: { type: Number, required: true },
          speedBonus: { type: Number, default: 0 },
          feedback: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const battleResultSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, index: true },
    winner: { type: String, required: true },
    playerScores: {
      type: [
        {
          username: { type: String, required: true },
          score: { type: Number, required: true },
        },
      ],
      default: [],
    },
    rounds: { type: [roundResultSchema], default: [] },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.BattleResult || mongoose.model("BattleResult", battleResultSchema);
