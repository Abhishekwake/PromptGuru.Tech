import { protect } from "./authMiddleware.js";
import { isAdminUser } from "../utils/adminAccess.js";

export function requireAdmin(req, res, next) {
  protect(req, res, () => {
    if (!req.user || !isAdminUser(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}

export function assertAdminFromUser(user) {
  if (!user) throw new Error("UNAUTHORIZED");
  if (!isAdminUser(user)) throw new Error("FORBIDDEN_NOT_ADMIN");
  return user;
}
