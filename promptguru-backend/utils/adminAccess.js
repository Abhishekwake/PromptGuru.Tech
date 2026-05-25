/**
 * Admin access: DB role === 'admin' OR email listed in ADMIN_EMAILS (comma-separated).
 */
export function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user) {
  if (!user?.email) return false;
  if (user.role === "admin") return true;
  const emails = parseAdminEmails();
  return emails.includes(String(user.email).toLowerCase());
}
