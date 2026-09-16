import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "學生閱讀記錄",
  description: "小學生閱讀紀錄 — MVP（Google Sheets + DAL）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body>{children}</body>
    </html>
  );
}
