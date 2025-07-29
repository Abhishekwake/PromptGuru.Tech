import express from "express";
import { analyzePrompt, getPromptHistory,deletePrompt,getPromptById,savePromptToLibrary,improvePrompt } from "../controllers/promptController.js"
import { protect } from "../middleware/authMiddleware.js"


const router = express.Router();
router.post("/analyze", protect, analyzePrompt);
router.post("/history", protect, getPromptHistory);
router.post("/delete", protect, deletePrompt); // ✅ Add this
router.get("/:id", protect, getPromptById); // ✅ New Route
router.post("/save", protect, savePromptToLibrary);
router.post("/improve", protect, improvePrompt);


export default router;  