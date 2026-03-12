"use client";
import { useRouter } from "next/navigation";
import { C } from "../lib/constants";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    { icon: "🏠", title: "주거·상가 통합", desc: "아파트·빌라·오피스텔·상가 유형별 맞춤 계약 관리." },
    { icon: "💰", title: "수금 자동 추적", desc: "매월 자동 레코드, 미납 즉시 감지, 클릭 하나로 처리." },
    { icon: "📊", title: "수익률 리포트", desc: "물건별 연 수익률 자동 계산, 월별 차트 분석." },
    { icon: "🔔", title: "스마트 알림", desc: "만료 D-90/60/30, 미납, 부가세 일정 자동 알림." },
  ];

  return (
    <div
      className="grid-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Outfit','Noto Sans KR',sans-serif",
      }}
    >
      {/* 배경 장식 */}
      <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle,${C.indigo}15,transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${C.purple}10,transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ textAlign: "center", maxWidth: 700, position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 6px 24px ${C.indigo}55` }}>🏠</div>
          <div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff" }}>Ownly</span>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginLeft: 8 }}>by McLean</span>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Outfit','Noto Sans KR',sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          <span className="gradient-text">Own your rentals.</span>
          <br />
          <span style={{ color: "#fff" }}>하나의 앱으로.</span>
        </h1>

        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          Properties, tenants, payments, reports — all in one place. No more spreadsheets.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="btn-primary"
          style={{ padding: "15px 44px", borderRadius: 14, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 8px 32px ${C.indigo}55`, letterSpacing: "-.3px" }}
        >
          Get Started Free
        </button>
      </div>

      <div
        className="stagger"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, maxWidth: 900, width: "100%", marginTop: 56, position: "relative", zIndex: 1 }}
      >
        {features.map((f) => (
          <div key={f.title} className="hover-lift" style={{ background: `${C.surface}cc`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 20px", backdropFilter: "blur(12px)" }}>
            <span style={{ fontSize: 26, marginBottom: 10, display: "block" }}>{f.icon}</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{f.title}</p>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
