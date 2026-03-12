// src/app/opengraph-image.js
// Next.js가 자동으로 /og-image.png 생성
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ownly - 개인 임대인을 위한 스마트 임대 관리";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #07070e 0%, #0d0d1f 50%, #12122a 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "sans-serif", position: "relative",
        }}
      >
        {/* 배경 원 */}
        <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)", display: "flex" }} />

        {/* 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏠</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>Ownly</span>
            <span style={{ fontSize: 18, color: "#6366f1", fontWeight: 600 }}>by McLean</span>
          </div>
        </div>

        {/* 헤드라인 */}
        <h1 style={{ fontSize: 52, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 16px", lineHeight: 1.2 }}>
          개인 임대인을 위한<br />
          <span style={{ background: "linear-gradient(135deg, #818cf8, #a855f7)", WebkitBackgroundClip: "text", color: "transparent" }}>
            스마트 임대 관리
          </span>
        </h1>

        {/* 서브 */}
        <p style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", textAlign: "center", margin: 0 }}>
          수금 · 계약 · 세금 · 내용증명 — 하나의 앱으로
        </p>

        {/* URL */}
        <div style={{ marginTop: 40, padding: "10px 28px", borderRadius: 50, border: "1px solid rgba(99,102,241,0.4)", display: "flex" }}>
          <span style={{ fontSize: 20, color: "#6366f1", fontWeight: 700 }}>ownly.kr</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
