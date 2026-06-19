import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Office — 가상의 AI 회사 플랫폼";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #12121f 0%, #0a0a12 100%)",
          color: "#e7e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 24 }}>🏢</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
          AI로 구성되는
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            background: "linear-gradient(90deg,#7c6cff,#38e8c6)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          가상의 회사
        </div>
        <div style={{ fontSize: 30, color: "#9396b3", marginTop: 28 }}>
          메타버스 × AI · 2.5D 오피스 플랫폼
        </div>
      </div>
    ),
    { ...size }
  );
}
