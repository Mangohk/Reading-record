import Link from "next/link";
import { auth } from "@/auth";
import { GoogleSignInButton, SignOutButton } from "@/components/auth-buttons";
import { hasGoogleOAuthConfigured } from "@/lib/auth/credentials";
import { getDataAccessLayer } from "@/lib/dal";
import type { ReadingRecord } from "@/lib/domain/types";

/**
 * Student shell — requires Google login.
 * Students only see scaffolding for their own records path.
 */
export default async function StudentShellPage() {
  const session = await auth();
  const oauthReady = hasGoogleOAuthConfigured();

  if (!session?.user?.email) {
    return (
      <main>
        <h1 className="brand">我的閱讀</h1>
        <p className="lede">請先用 Google 帳戶登入。</p>
        <section className="panel">
          {oauthReady ? (
            <div className="cta-row">
              <GoogleSignInButton callbackUrl="/student" />
              <Link className="btn secondary" href="/">
                返回首頁
              </Link>
            </div>
          ) : (
            <p>
              OAuth 未設定。請喺 <code>.env.local</code> 填入 Google client 同
              secret（見 README）。
            </p>
          )}
        </section>
      </main>
    );
  }

  const role = session.user.role;
  const userId = session.user.userId;
  const dalError = session.user.dalError;

  // Non-students: brief notice (teacher/admin UIs come later).
  if (role && role !== "student") {
    return (
      <main>
        <h1 className="brand">我的閱讀</h1>
        <p className="lede">
          你而家嘅角色係 <code>{role}</code>
          。學生專用頁面稍後會引導老師／管理員去對應後台；而家可以睇自己帳戶資料。
        </p>
        <section className="panel">
          <p>
            登入：{session.user.email}
            {userId ? (
              <>
                {" "}
                · userId：<code>{userId}</code>
              </>
            ) : null}
          </p>
          {dalError ? <p className="warn">DAL：{dalError}</p> : null}
          <div className="cta-row">
            <Link className="btn secondary" href="/">
              返回首頁
            </Link>
            <SignOutButton />
          </div>
        </section>
      </main>
    );
  }

  if (!role) {
    return (
      <main>
        <h1 className="brand">我的閱讀</h1>
        <p className="lede">帳戶角色尚未就緒。</p>
        <section className="panel">
          {dalError ? (
            <p className="warn">{dalError}</p>
          ) : (
            <p>請稍候或聯絡管理員開通。</p>
          )}
          <div className="cta-row">
            <Link className="btn secondary" href="/">
              返回首頁
            </Link>
            <SignOutButton />
          </div>
        </section>
      </main>
    );
  }

  // Student path scaffolding — own records only
  let records: ReadingRecord[] = [];
  let loadError: string | null = dalError ?? null;

  if (userId && !dalError) {
    try {
      const dal = getDataAccessLayer();
      records = await dal.listReadingRecordsByUser(userId);
    } catch (err) {
      loadError = err instanceof Error ? err.message : "無法載入閱讀紀錄";
    }
  } else if (!userId) {
    loadError =
      loadError ||
      "尚未建立 User 列。請確認 service account 已共用試算表（Editor）。";
  }

  const totalPoints = records.reduce((sum, r) => sum + (r.points || 0), 0);

  return (
    <main>
      <h1 className="brand">我的閱讀</h1>
      <p className="lede">
        你好，{session.user.name || session.user.email}
        。呢度只會顯示<strong>你自己</strong>嘅閱讀紀錄（路徑骨架）。
      </p>

      <section className="panel">
        <h2>帳戶</h2>
        <p>
          Email：{session.user.email} · 角色：<code>student</code>
          {userId ? (
            <>
              {" "}
              · ID：<code>{userId}</code>
            </>
          ) : null}
        </p>
        <div className="cta-row">
          <SignOutButton />
          <Link className="btn secondary" href="/">
            返回首頁
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>我的紀錄</h2>
        {loadError ? (
          <p className="warn">{loadError}</p>
        ) : records.length === 0 ? (
          <p>
            暫時未有紀錄。下一步會加兒童友善「新增紀錄」表單（書名、語種、頁數、摘要）。
          </p>
        ) : (
          <>
            <p>
              共 {records.length} 本 · 累計 {totalPoints} 分
            </p>
            <ul>
              {records.map((r) => (
                <li key={r.recordId}>
                  {r.title}（{r.language}）· {r.pageCount} 頁 · {r.points} 分 ·{" "}
                  {r.readDate}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <h2>之後會有</h2>
        <ul>
          <li>書名、作者、中／英語種大掣、頁數、摘要</li>
          <li>儲存時寫入當前 Settings 計出嘅分數（舊分唔重算）</li>
          <li>只可改自己嘅紀錄（API 已強制擁有者檢查）</li>
        </ul>
      </section>
    </main>
  );
}
