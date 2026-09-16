import Link from "next/link";
import { auth } from "@/auth";
import { GoogleSignInButton, SignOutButton } from "@/components/auth-buttons";
import { hasGoogleOAuthConfigured } from "@/lib/auth/credentials";

export default async function HomePage() {
  const session = await auth();
  const oauthReady = hasGoogleOAuthConfigured();
  const email = session?.user?.email;
  const role = session?.user?.role;

  return (
    <main>
      <h1 className="brand">學生閱讀記錄</h1>
      <p className="lede">
        小學生用 Google 帳戶登記讀過嘅書；老師同管理員可睇紀錄、報表同計分設定。
      </p>

      <section className="panel">
        <h2>登入</h2>
        {email ? (
          <>
            <p>
              已登入：<strong>{email}</strong>
              {role ? (
                <>
                  {" "}
                  （角色：<code>{role}</code>）
                </>
              ) : null}
            </p>
            {session?.user?.dalError ? (
              <p className="warn">
                試算表同步未成功：{session.user.dalError}
              </p>
            ) : null}
            <div className="cta-row">
              <Link className="btn" href="/student">
                前往我的閱讀
              </Link>
              <SignOutButton />
            </div>
          </>
        ) : oauthReady ? (
          <>
            <p>用學校／個人 Google 帳戶登入。首次登入會建立用戶同 Profile。</p>
            <div className="cta-row">
              <GoogleSignInButton callbackUrl="/student" />
              <Link className="btn secondary" href="/api/health">
                API 健康檢查
              </Link>
            </div>
          </>
        ) : (
          <>
            <p>
              Google OAuth 未設定（缺少 client id／secret 或{" "}
              <code>AUTH_SECRET</code>／<code>NEXTAUTH_SECRET</code>
              ）。App 仍可啟動；請跟 README 同 <code>.env.example</code>{" "}
              填好環境變數。
            </p>
            <div className="cta-row">
              <Link className="btn secondary" href="/api/health">
                API 健康檢查
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <h2>連結</h2>
        <div className="cta-row">
          <Link className="btn secondary" href="/student">
            學生頁面
          </Link>
          <Link
            className="btn secondary"
            href="/legacy/my_reading_record_cloud_edition.html"
          >
            舊版學生介面
          </Link>
        </div>
      </section>

      <p className="meta">
        Bootstrap admin：<code>mangohk@gmail.com</code>。設定說明見{" "}
        <code>README.md</code>。
      </p>
    </main>
  );
}
