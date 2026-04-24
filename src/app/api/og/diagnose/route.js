// 진단 결과 OG 이미지 (카톡·SNS 공유용 1200x630 카드)
import { ImageResponse } from "next/og";

export const runtime = "edge";

const GRADE_COLORS = {
  A: { bg: "#10b981", light: "#d1fae5", label: "최우수 입지" },
  B: { bg: "#3b82f6", light: "#dbeafe", label: "우수 입지" },
  C: { bg: "#f59e0b", light: "#fef3c7", label: "보통 입지" },
  D: { bg: "#ef4444", light: "#fecaca", label: "주의 입지" },
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const addr = searchParams.get("addr") || "내 부동산";
  const grade = (searchParams.get("grade") || "B").toUpperCase();
  const score = searchParams.get("score") || "70";
  const pType = searchParams.get("pType") || "주거";
  const g = GRADE_COLORS[grade] || GRADE_COLORS.B;

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        background: "linear-gradient(135deg, #1a2744 0%, #2d4270 55%, #5b4fcf 100%)",
        padding: "60px 72px",
        fontFamily: "sans-serif", color: "#fff",
      }}>
        {/* 상단 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30 }}>
          <div style={{ width: 50, height: 50, borderRadius: 13, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🏠</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>온리 Ownly</span>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>실거래 + AI 입지 진단</span>
          </div>
        </div>

        {/* 메인 (등급 큰 원 + 주소·점수) */}
        <div style={{ display: "flex", alignItems: "center", gap: 40, flex: 1, marginBottom: 20 }}>
          {/* 등급 */}
          <div style={{
            width: 260, height: 260, borderRadius: "50%",
            background: g.bg,
            boxShadow: `0 0 120px ${g.bg}90`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            border: "6px solid rgba(255,255,255,0.2)", flexShrink: 0,
          }}>
            <span style={{ fontSize: 170, fontWeight: 900, color: "#fff", lineHeight: 0.9 }}>{grade}</span>
          </div>

          {/* 텍스트 */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: 18, fontWeight: 700, color: g.light,
              background: "rgba(255,255,255,0.1)", padding: "6px 14px",
              borderRadius: 22, alignSelf: "flex-start", marginBottom: 16,
            }}>
              {pType} · {g.label}
            </span>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.2, marginBottom: 14, display: "flex" }}>
              {addr.length > 22 ? addr.slice(0, 22) + "..." : addr}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>종합 점수</span>
              <span style={{ fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.4)" }}>/100</span>
            </div>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", display: "flex" }}>
              국토부 실거래 데이터 + AI 분석
            </span>
          </div>
        </div>

        {/* 하단 CTA */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.15)",
        }}>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
            🎯 내 물건도 즉시 진단받기
          </span>
          <span style={{
            fontSize: 18, fontWeight: 800, color: "#1a2744",
            background: "#fff", padding: "11px 22px", borderRadius: 10,
          }}>
            ownly.kr/diagnose →
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
