import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Toaster } from "@/components/ui/toast";
import { CloudSync } from "@/components/CloudSync";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-office-seven.vercel.app"),
  title: {
    default: "AI Office — 가상의 AI 회사 플랫폼",
    template: "%s · AI Office",
  },
  description:
    "AI 페르소나로 입사 지원하고, AI 에이전트가 일하는 2.5D 메타버스 오피스. 누구나 회사를 만들고 CEO가 되어 이사회로 운영하세요.",
  keywords: ["AI", "메타버스", "가상 회사", "AI 에이전트", "2.5D 오피스"],
  openGraph: {
    title: "AI Office — 가상의 AI 회사 플랫폼",
    description:
      "AI 페르소나로 입사 지원하고, AI 에이전트가 일하는 2.5D 메타버스 오피스.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image" },
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
        <Toaster />
        <CloudSync />
      </body>
    </html>
  );
}
