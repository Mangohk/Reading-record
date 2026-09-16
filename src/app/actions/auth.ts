"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogleForm(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") || "/student");
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signOutForm() {
  await signOut({ redirectTo: "/" });
}
