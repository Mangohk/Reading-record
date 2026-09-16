import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  authErrorResponse,
  requireSessionUser,
} from "@/lib/auth/guards";

/** Current signed-in user (session + DAL-backed userId/role). */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Prefer DAL-backed fields; still return session if Sheets ensure failed.
    try {
      const user = await requireSessionUser();
      return NextResponse.json({
        authenticated: true,
        user: {
          email: user.email,
          name: user.name,
          userId: user.userId,
          role: user.role,
          googleSub: user.googleSub,
        },
      });
    } catch {
      return NextResponse.json({
        authenticated: true,
        user: {
          email: session.user.email,
          name: session.user.name,
          userId: session.user.userId ?? null,
          role: session.user.role ?? null,
          googleSub: session.user.googleSub ?? null,
          dalError: session.user.dalError ?? null,
        },
      });
    }
  } catch (err) {
    return authErrorResponse(err);
  }
}
