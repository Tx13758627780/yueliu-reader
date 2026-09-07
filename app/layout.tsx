import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "阅流 · RSS AI 阅读器",
  description: "订阅、阅读、翻译，用你自己的 AI 看懂世界。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
