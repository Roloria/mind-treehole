import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "心灵树洞 - 一个愿意倾听的朋友",
  description: "一个安全的空间，你可以倾诉心事、分享日常。我会安静地听，给你温暖的回应。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
