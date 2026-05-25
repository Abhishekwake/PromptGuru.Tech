import express from "express";
import { getGlobalLeaderboard, getUserBattleStats } from "../controllers/leaderboardController.js";

const router = express.Router();

router.get("/leaderboard", getGlobalLeaderboard);
router.get("/user-stats/:userId", getUserBattleStats);

export default router;
