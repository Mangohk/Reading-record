import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Role } from "@/lib/domain/types";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export interface AppSessionUser {
  email: string;
  name: string;
  userId: string;
  role: Role;
  googleSub?: string;
  dalError?: string;
}

/**
 * Require a signed-in session with DAL-backed userId + role.
 * Throws AuthError (401/403/503) for Route Handlers to map to JSON.
 */
export async function requireSessionUser(): Promise<AppSessionUser> {
  const session = await auth();
  const email = session?.user?.email?.trim();
  if (!session?.user || !email) {
    throw new AuthError("請先用 Google 帳戶登入。", 401);
  }

  const userId = session.user.userId;
  const role = session.user.role;
  if (session.user.dalError || !userId || !role) {
    throw new AuthError(
      session.user.dalError ||
        "帳戶資料尚未寫入試算表。請確認 service account 已設定並共用試算表。",
      503,
    );
  }

  return {
    email,
    name: session.user.name ?? email,
    userId,
    role,
    googleSub: session.user.googleSub,
    dalError: session.user.dalError,
  };
}

export async function requireRoles(
  allowed: Role[],
): Promise<AppSessionUser> {
  const user = await requireSessionUser();
  if (!allowed.includes(user.role)) {
    throw new AuthError("你冇權限存取呢個資源。", 403);
  }
  return user;
}

/** Student may only access their own userId. Teachers/admins may access any. */
export function assertStudentOwnsResource(
  actor: AppSessionUser,
  resourceUserId: string,
): void {
  if (actor.role === "student" && actor.userId !== resourceUserId) {
    throw new AuthError("學生只可以存取自己嘅閱讀紀錄。", 403);
  }
}

export function authErrorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Unexpected auth error";
  return NextResponse.json({ error: message }, { status: 500 });
}
