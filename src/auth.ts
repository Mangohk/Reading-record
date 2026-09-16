import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { ensureUserAndProfile } from "@/lib/auth/ensure-user";
import { isBootstrapAdmin } from "@/lib/auth/roles";
import type { Role } from "@/lib/domain/types";

function googleClientId(): string | undefined {
  return (
    process.env.AUTH_GOOGLE_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    undefined
  );
}

function googleClientSecret(): string | undefined {
  return (
    process.env.AUTH_GOOGLE_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    undefined
  );
}

function authSecret(): string | undefined {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    undefined
  );
}

const googleId = googleClientId();
const googleSecret = googleClientSecret();
const googleProvider =
  googleId && googleSecret
    ? [
        Google({
          clientId: googleId,
          clientSecret: googleSecret,
          allowDangerousEmailAccountLinking: false,
        }),
      ]
    : [];

/**
 * Auth.js (NextAuth v5) — Google OAuth for student / teacher / admin.
 * On login, ensure User + Profile via DAL; bootstrap email → admin.
 * Starts without OAuth/Sheets secrets; login fails until env is filled.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: googleProvider,
  secret: authSecret(),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, profile }) {
      const email = (
        (typeof profile?.email === "string" ? profile.email : "") ||
        (typeof token.email === "string" ? token.email : "") ||
        ""
      )
        .trim()
        .toLowerCase();
      if (email) {
        token.email = email;
      }

      const googleSub: string =
        (typeof profile?.sub === "string" ? profile.sub : "") ||
        (typeof token.googleSub === "string" ? token.googleSub : "") ||
        "";
      if (googleSub) {
        token.googleSub = googleSub;
      }

      const displayName: string =
        (typeof profile?.name === "string" ? profile.name : "") ||
        (typeof token.name === "string" ? token.name : "") ||
        email;

      // Fresh Google sign-in, or retry if previous DAL ensure failed / missing.
      const shouldEnsure =
        Boolean(email) &&
        (Boolean(account) || !token.userId || Boolean(token.dalError));

      if (shouldEnsure) {
        try {
          const ensured = await ensureUserAndProfile({
            email,
            googleSub: googleSub || `email:${email}`,
            displayName,
          });
          token.userId = ensured.user.userId;
          token.role = ensured.role;
          token.googleSub = ensured.user.googleSub;
          delete token.dalError;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to ensure User/Profile";
          token.dalError = message;
          // Keep bootstrap admin role in JWT even if Sheets is down.
          if (email && isBootstrapAdmin(email)) {
            token.role = "admin";
          }
        }
      } else if (email && isBootstrapAdmin(email)) {
        token.role = "admin";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
        session.user.userId =
          typeof token.userId === "string" ? token.userId : undefined;
        session.user.role =
          token.role === "student" ||
          token.role === "teacher" ||
          token.role === "admin"
            ? (token.role as Role)
            : undefined;
        session.user.googleSub =
          typeof token.googleSub === "string" ? token.googleSub : undefined;
        session.user.dalError =
          typeof token.dalError === "string" ? token.dalError : undefined;
      }
      return session;
    },
  },
});
