import type { Metadata } from "next";
import { Fraunces, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  weight: ["600"],
});

const body = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  weight: ["400", "600"],
});

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
    <html lang="zh-HK" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
