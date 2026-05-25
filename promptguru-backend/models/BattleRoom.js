import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    socketId: { type: String, required: true },
    score: { type: Number, default: 0 },
    submissionTime: { type: Date, default: null },
    currentPrompt: { type: String, default: "" },
  },
  { _id: false }
);

const challengeSubmissionSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    socketId: { type: String, required: true },
    choiceIndex: { type: Number, default: -1 },
    prompt: { type: String, required: true },
    submissionTime: { type: Date, required: true },
    baseScore: { type: Number, required: true },
    speedBonus: { type: Number, default: 0 },
    totalScore: { type: Number, required: true },
    judge: {
      clarity: { type: Number, required: true },
      creativity: { type: Number, required: true },
      effectiveness: { type: Number, required: true },
      feedback: { type: String, default: "" },
    },
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
  {
    round: { type: Number, required: true },
    category: { type: String, required: true },
    lesson: { type: String, default: "" },
    prompt: { type: String, required: true },
    choices: { type: [String], default: [] },
    correctChoiceIndex: { type: Number, default: 0 },
    explainCorrect: { type: String, default: "" },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    submissions: { type: [challengeSubmissionSchema], default: [] },
  },
  { _id: false }
);

const battleRoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, index: true },
    players: { type: [playerSchema], default: [] },
    state: {
      type: String,
      enum: ["WAITING", "ACTIVE", "FINISHED"],
      default: "WAITING",
    },
    currentRound: { type: Number, default: 0 },
    challenges: { type: [challengeSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.BattleRoom || mongoose.model("BattleRoom", battleRoomSchema);
