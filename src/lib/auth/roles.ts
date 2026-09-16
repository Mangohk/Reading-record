/**
 * Hardcoded bootstrap admin — locked product decision.
 * First / ongoing login for this Google email is treated as admin
 * (not solely dependent on the Users sheet).
 */
export const BOOTSTRAP_ADMIN_EMAIL = "mangohk@gmail.com";

export type Role = "student" | "teacher" | "admin";

/**
 * Resolve effective role for a signed-in Google account.
 *
 * - Bootstrap email always resolves to `admin`.
 * - Otherwise use the role stored in Users (via DAL), if any.
 * - If no stored role: returns `null` (default onboarding still undecided in PRD).
 */
export function resolveRole(
  email: string,
  storedRole: Role | null | undefined,
): Role | null {
  const normalized = email.trim().toLowerCase();
  if (normalized === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    return "admin";
  }
  if (storedRole === "student" || storedRole === "teacher" || storedRole === "admin") {
    return storedRole;
  }
  return null;
}

export function isBootstrapAdmin(email: string): boolean {
  return email.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
}
