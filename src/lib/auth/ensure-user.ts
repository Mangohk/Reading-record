import { randomUUID } from "crypto";
import { isBootstrapAdmin, resolveRole } from "@/lib/auth/roles";
import { getDataAccessLayer } from "@/lib/dal";
import type { Profile, Role, User } from "@/lib/domain/types";

export interface GoogleIdentity {
  email: string;
  googleSub: string;
  displayName: string;
}

export interface EnsuredAppUser {
  user: User;
  profile: Profile;
  role: Role;
  createdUser: boolean;
  createdProfile: boolean;
}

/**
 * Create or refresh User + Profile rows on (first) login via DAL.
 *
 * Role rules:
 * - BOOTSTRAP_ADMIN_EMAIL → always `admin` (written back to Users).
 * - Existing Users.role otherwise.
 * - New non-bootstrap users: provisional MVP default `student`
 *   (PRD still undecided on waitlist vs default — documented in README).
 */
export async function ensureUserAndProfile(
  identity: GoogleIdentity,
): Promise<EnsuredAppUser> {
  const email = identity.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Google account has no email; cannot create User.");
  }

  const dal = getDataAccessLayer();
  const existing = await dal.getUserByEmail(email);

  const provisionalDefault: Role = "student";
  const effectiveRole =
    resolveRole(email, existing?.role ?? null) ?? provisionalDefault;

  let createdUser = false;
  let user: User;

  if (existing) {
    user = {
      ...existing,
      googleSub: identity.googleSub || existing.googleSub,
      email,
      displayName: identity.displayName || existing.displayName,
      // Persist bootstrap / resolved role so Sheets stays consistent.
      role: effectiveRole,
    };
    const needsWrite =
      user.googleSub !== existing.googleSub ||
      user.displayName !== existing.displayName ||
      user.role !== existing.role ||
      user.email !== existing.email;
    if (needsWrite) {
      user = await dal.upsertUser(user);
    }
  } else {
    createdUser = true;
    user = await dal.upsertUser({
      userId: randomUUID(),
      googleSub: identity.googleSub,
      email,
      displayName: identity.displayName || email,
      role: effectiveRole,
    });
  }

  let createdProfile = false;
  let profile = await dal.getProfile(user.userId);
  if (!profile) {
    createdProfile = true;
    profile = await dal.upsertProfile({
      userId: user.userId,
      grade: "",
      classNumber: "",
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    user,
    profile,
    role: isBootstrapAdmin(email) ? "admin" : effectiveRole,
    createdUser,
    createdProfile,
  };
}
