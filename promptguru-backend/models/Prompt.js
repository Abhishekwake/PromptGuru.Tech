import mongoose from "mongoose";
const promptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  prompt: String,
  
  feedback: {
    Clarity: { type: Number, required: true },
    Specificity: { type: Number, required: true },
    Usefulness: { type: Number, required: true },
    score: { type: Number, required: true },
    suggested_prompts: { type: [String], required: true },
    tips: { type: [String], required: true },
  }
}, { 
  timestamps: true 
  // ✅ Optional TTL cleanup
  // , expires: 60 * 60 * 24 // This would expire docs, only add if you want auto cleanup
});

export default mongoose.model("Prompt", promptSchema);
