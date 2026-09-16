import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/domain/types";

declare module "next-auth" {
  interface Session {
    user: {
      userId?: string;
      role?: Role;
      googleSub?: string;
      dalError?: string;
    } & DefaultSession["user"];
  }

  interface User {
    userId?: string;
    role?: Role;
    googleSub?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: Role;
    googleSub?: string;
    email?: string;
    dalError?: string;
  }
}
