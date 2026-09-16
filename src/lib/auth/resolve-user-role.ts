import type { Role } from "@/lib/domain/types";
import {
  ensureUserAndProfile,
  type GoogleIdentity,
} from "@/lib/auth/ensure-user";
import { BOOTSTRAP_ADMIN_EMAIL, resolveRole } from "@/lib/auth/roles";
import { getDataAccessLayer } from "@/lib/dal";

export type { GoogleIdentity as SessionIdentity };

/**
 * Resolve role for a signed-in Google user (read-only; does not create rows).
 * Prefer `ensureUserAndProfile` on login to create/ensure User + Profile.
 */
export async function resolveUserRole(identity: GoogleIdentity): Promise<{
  role: Role | null;
  userId: string | null;
  isBootstrapAdmin: boolean;
}> {
  const dal = getDataAccessLayer();
  const existing = await dal.getUserByEmail(identity.email);
  const role = resolveRole(identity.email, existing?.role ?? null);

  return {
    role,
    userId: existing?.userId ?? null,
    isBootstrapAdmin:
      identity.email.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),
  };
}

/** First-login helper used by Auth.js callbacks. */
export { ensureUserAndProfile };
