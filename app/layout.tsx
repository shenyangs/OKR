import type { Metadata } from "next";
import "./globals.css";
import { IdentityProvider } from "@/components/identity-context";
import { OkrDataProvider } from "@/components/okr-data-context";

export const metadata: Metadata = {
  title: "OKR 协同管理工作台",
  description: "跨部门团队目标拉齐、责任到人、进度极度透明的内部 OKR 工作台。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-background font-sans text-foreground antialiased">
        <IdentityProvider>
          <OkrDataProvider>{children}</OkrDataProvider>
        </IdentityProvider>
      </body>
    </html>
  );
}
