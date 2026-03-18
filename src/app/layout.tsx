import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "心灵树洞 - 一个愿意倾听的朋友",
  description: "一个安全的空间，你可以倾诉心事、分享日常。我会安静地听，给你温暖的回应。",
  keywords: ["情感陪伴", "心理倾听", "AI聊天", "情绪日记", "心灵树洞"],
  authors: [{ name: "心灵树洞" }],
  openGraph: {
    title: "心灵树洞 - 一个愿意倾听的朋友",
    description: "这里是一个安全的空间，你可以倾诉心事、分享日常。",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fdf4ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌳</text></svg>" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
