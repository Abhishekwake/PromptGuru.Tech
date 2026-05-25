import express from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAdminOverview,
  getAdminActivityChart,
  getAdminScoreDistribution,
  getAdminUsers,
  getAdminUserDetail,
  patchAdminUserRole,
  getAdminPrompts,
  getAdminActiveBattles,
  getAdminLeaderboardSnapshot,
  postPromptDraftTelemetry,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/overview", requireAdmin, getAdminOverview);
router.get("/activity", requireAdmin, getAdminActivityChart);
router.get("/distribution", requireAdmin, getAdminScoreDistribution);
router.get("/users", requireAdmin, getAdminUsers);
router.get("/users/:userId", requireAdmin, getAdminUserDetail);
router.patch("/users/:userId/role", requireAdmin, patchAdminUserRole);
router.get("/prompts", requireAdmin, getAdminPrompts);
router.get("/battles/active", requireAdmin, getAdminActiveBattles);
router.get("/leaderboard", requireAdmin, getAdminLeaderboardSnapshot);

export default router;

/** Typing telemetry — any logged-in user; admins consume via live feed */
export const telemetryRouter = express.Router();
telemetryRouter.post("/prompt-draft", protect, postPromptDraftTelemetry);
