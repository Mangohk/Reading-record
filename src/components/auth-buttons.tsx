import {
  signInWithGoogleForm,
  signOutForm,
} from "@/app/actions/auth";

export function GoogleSignInButton({
  label = "用 Google 登入",
  callbackUrl = "/student",
}: {
  label?: string;
  callbackUrl?: string;
}) {
  return (
    <form action={signInWithGoogleForm}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <button type="submit" className="btn">
        {label}
      </button>
    </form>
  );
}

export function SignOutButton({ label = "登出" }: { label?: string }) {
  return (
    <form action={signOutForm}>
      <button type="submit" className="btn secondary">
        {label}
      </button>
    </form>
  );
}
