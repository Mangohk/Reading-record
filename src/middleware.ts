import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Middleware uses the edge-safe config only (no Sheets / googleapis).
 * Route Handlers and Server Components use `auth` from `@/auth`.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/student/:path*",
    "/api/student/:path*",
    "/api/me",
    "/api/settings",
  ],
};
