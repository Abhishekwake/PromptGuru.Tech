import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import promptRoutes from "./routes/promptRoutes.js"

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connect error:", err.message));

app.use("/api/auth",authRoutes);
app.use("/api/prompts",promptRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT,()=> console.log(`Server running on ${PORT}`)
)