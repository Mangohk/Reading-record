import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1 className="brand">學生閱讀記錄</h1>
      <p className="lede">
        小學生用 Google 帳戶登記讀過嘅書；老師同管理員可睇紀錄、報表同計分設定。
        呢個係 MVP 骨架（DAL + Google Sheets）。
      </p>

      <section className="panel">
        <h2>開始</h2>
        <p>Google 登入同完整學生表單會喺下一步接上；而家可以試 API 同舊版介面。</p>
        <div className="cta-row">
          <Link className="btn" href="/student">
            學生頁面（殼）
          </Link>
          <Link className="btn secondary" href="/legacy/my_reading_record_cloud_edition.html">
            開啟舊版學生介面
          </Link>
          <Link className="btn secondary" href="/api/health">
            API 健康檢查
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>呢輪已建</h2>
        <ul>
          <li>Next.js App Router + TypeScript</li>
          <li>Data Access Layer 介面（之後可換 Firebase）</li>
          <li>Google Sheets adapter（Users / Profiles / ReadingRecords / Settings）</li>
          <li>
            Bootstrap admin：<code>mangohk@gmail.com</code>
          </li>
        </ul>
      </section>

      <p className="meta">
        設定說明見 repo 根目錄 <code>README.md</code> 同 <code>.env.example</code>。
      </p>
    </main>
  );
}
