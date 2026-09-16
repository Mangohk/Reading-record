import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Node-only imports).
 * Full Google provider + DAL callbacks live in `src/auth.ts`.
 */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      // Public routes
      if (
        pathname === "/" ||
        pathname.startsWith("/api/health") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/legacy")
      ) {
        return true;
      }

      // Student UI + student APIs require a session
      if (
        pathname.startsWith("/student") ||
        pathname.startsWith("/api/student") ||
        pathname.startsWith("/api/me") ||
        pathname.startsWith("/api/settings")
      ) {
        return !!auth?.user;
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
