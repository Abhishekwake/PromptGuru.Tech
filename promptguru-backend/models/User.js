import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String }, // This is now optional
  firebaseUid: { type: String, required: true, unique: true }, // Added required and unique
  isEmailVerified: { type: Boolean, default: false },
  googleUser: { type: Boolean, default: false },
  avatar: { type: String },
  emailVerificationToken: { type: String },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);