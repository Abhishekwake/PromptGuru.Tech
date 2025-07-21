import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const startServer = async () => {
  try {
    console.log("🟡 Connecting to MongoDB...");
    console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    app.use("/api/auth", authRoutes);
    app.use("/api/prompts", promptRoutes);

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // stop the app
  }
};

// ❗ VERY IMPORTANT: Don’t forget to call the function
startServer();
