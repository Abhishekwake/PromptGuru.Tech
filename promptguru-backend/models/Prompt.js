import mongoose from "mongoose";

const promptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  prompt: String,

  // 🔧 MODIFIED: Structured feedback schema instead of generic Object
  feedback: {
    Clarity: { type: Number, required: true },
    Specificity: { type: Number, required: true },
    Usefulness: { type: Number, required: true },
    suggested_prompt: { type: String, required: true }
  }

}, { timestamps: true });

export default mongoose.model("Prompt", promptSchema);
