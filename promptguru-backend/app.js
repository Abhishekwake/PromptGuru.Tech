import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";

dotenv.config();

const app = express();

// ✅ Allow both local + deployed frontend
app.use(cors({
  origin: ["http://localhost:3000", "https://prompt-guru-tech.vercel.app"],
  credentials: true,
}));

app.use(express.json());

// ✅ Health Check route for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const startServer = async () => {
  try {
    console.log("🟡 Connecting to MongoDB...");
    console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // ✅ Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/prompt", promptRoutes);

    // ✅ Use Render-assigned port
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

startServer();
