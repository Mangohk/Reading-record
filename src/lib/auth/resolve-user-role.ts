import { BOOTSTRAP_ADMIN_EMAIL, resolveRole } from "@/lib/auth/roles";
import { getDataAccessLayer } from "@/lib/dal";
import type { Role } from "@/lib/domain/types";

export interface SessionIdentity {
  email: string;
  googleSub: string;
  displayName: string;
}

/**
 * Sketch of role resolution for a signed-in Google user.
 * Full NextAuth / OAuth session wiring comes in a later step.
 */
export async function resolveUserRole(identity: SessionIdentity): Promise<{
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
