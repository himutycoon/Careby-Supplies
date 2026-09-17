/**
 * Single-operator admin allowlist. This is a small business with one admin
 * team, not a multi-tenant app — an env var allowlist is the boring, right
 * fit here rather than a roles table.
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
