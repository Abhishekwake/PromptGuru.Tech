import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { postSoloChallenge } from "../controllers/practiceController.js";

const router = express.Router();

router.post("/solo/challenge", protect, postSoloChallenge);

export default router;
