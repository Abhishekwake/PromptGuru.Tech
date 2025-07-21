import express from "express";
import { analyzePrompt, getPromptHistory } from "../controllers/promptController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router();
router.post("/analyze", protect, analyzePrompt);
router.post("/history", protect, getPromptHistory);

export default router;