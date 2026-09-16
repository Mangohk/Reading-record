import Link from "next/link";

/**
 * Thin student shell — placeholder until Google OAuth + PRD-aligned form replace the legacy UI.
 * Legacy prototype remains available at /legacy/...
 */
export default function StudentShellPage() {
  return (
    <main>
      <h1 className="brand">我的閱讀</h1>
      <p className="lede">
        學生端殼頁。之後會接 Google 登入、Profile（年級／班號）、同按語種＋頁數計分嘅新增紀錄表單。
      </p>

      <section className="panel">
        <h2>暫時狀態</h2>
        <p>登入同寫入 Sheets 尚未接通呢個頁面。開發期間可用舊版介面參考互動流程。</p>
        <div className="cta-row">
          <Link className="btn secondary" href="/">
            返回首頁
          </Link>
          <Link className="btn" href="/legacy/my_reading_record_cloud_edition.html">
            開啟舊版原型
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>之後會有</h2>
        <ul>
          <li>書名、作者、中／英語種大掣、頁數、摘要</li>
          <li>儲存時寫入當前 Settings 計出嘅分數（舊分唔重算）</li>
          <li>只可改自己嘅紀錄</li>
        </ul>
      </section>
    </main>
  );
}
