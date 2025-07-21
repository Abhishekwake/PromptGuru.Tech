import mongoose from "mongoose";

const promptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  prompt: String,
  feedback: Object,
}, { timestamps: true });

export default mongoose.model("Prompt", promptSchema);
