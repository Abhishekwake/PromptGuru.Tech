import jwt from "jsonwebtoken";
import User from "../models/User.js";
import connectToDatabase from "../utils/db.js";
import { assertAdminFromUser } from "../middleware/adminMiddleware.js";
import { getRecentEvents, setAdminIo } from "../utils/adminEvents.js";

async function authenticateAdminSocket(socket) {
  await connectToDatabase();
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) throw new Error("UNAUTHORIZED_NO_TOKEN");

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("SERVER_MISCONFIGURED");

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new Error("UNAUTHORIZED_INVALID_TOKEN");
  }

  const user = await User.findById(decoded.id).select("name email role");
  if (!user) throw new Error("UNAUTHORIZED_USER_NOT_FOUND");

  assertAdminFromUser(user);
  return user;
}

export default function initializeAdminSocket(io) {
  setAdminIo(io);

  io.on("connection", (socket) => {
    socket.on("admin:subscribe", async () => {
      try {
        const adminUser = await authenticateAdminSocket(socket);
        socket.adminUserId = adminUser._id.toString();
        socket.join("admin:monitor");
        socket.emit("admin:subscribed", {
          admin: { name: adminUser.name, email: adminUser.email },
          recentEvents: getRecentEvents(80),
        });
      } catch (err) {
        const code = String(err?.message || "");
        socket.emit("admin:error", {
          message:
            code === "FORBIDDEN_NOT_ADMIN"
              ? "Admin access required"
              : "Not authorized",
        });
      }
    });

    socket.on("admin:unsubscribe", () => {
      socket.leave("admin:monitor");
    });
  });
}
