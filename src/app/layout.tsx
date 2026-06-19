import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "AI Office — 가상의 AI 회사 플랫폼",
  description:
    "AI 페르소나로 입사 지원하고, AI 에이전트가 일하는 2.5D 메타버스 오피스.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <NavBar />
        <main className="mx-auto max-w-7xl px-4 pb-20 pt-6">{children}</main>
      </body>
    </html>
  );
}
