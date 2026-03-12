"use client";
import { useRouter } from "next/navigation";
import { C } from "../lib/constants";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    { icon: "🏠", title: "주거·상가 통합 관리", desc: "아파트·빌라·오피스텔·상가 유형별 맞춤 계약 관리." },
    { icon: "💰", title: "수금 자동 추적",      desc: "매월 자동 레코드, 미납 즉시 감지, 클릭 하나로 처리." },
    { icon: "📊", title: "수익률 리포트",       desc: "물건별 연 수익률 자동 계산, 월별 차트 분석." },
    { icon: "📝", title: "계약·내용증명",       desc: "계약서 관리부터 내용증명 PDF 발행까지 원스톱." },
    { icon: "🧾", title: "세금 시뮬레이터",     desc: "종합소득세·부가세 자동 추정. 2025년 세법 기준." },
    { icon: "📅", title: "만료 알림",           desc: "만료 D-90/60/30, 미납 즉시 감지 알림." },
  ];

  const stats = [
    { v: "100%", l: "무료로 시작" },
    { v: "6+",   l: "핵심 기능" },
    { v: "0",    l: "엑셀 불필요" },
  ];

  return (
    <div
      className="grid-bg"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden", fontFamily: "'Outfit','Noto Sans KR',sans-serif" }}
    >
      {/* 배경 장식 */}
      <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle,${C.indigo}15,transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${C.purple}10,transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ textAlign: "center", maxWidth: 700, position: "relative", zIndex: 1 }}>
        {/* 로고 */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 6px 24px ${C.indigo}55` }}>🏠</div>
          <div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff" }}>Ownly</span>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginLeft: 8 }}>by McLean</span>
          </div>
        </div>

        {/* 메인 헤드라인 — SEO h1 */}
        <h1 style={{ fontFamily: "'Outfit','Noto Sans KR',sans-serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          <span className="gradient-text">개인 임대인을 위한</span>
          <br />
          <span style={{ color: "#fff" }}>스마트 임대 관리 앱</span>
        </h1>

        {/* 서브 카피 — SEO description 보조 */}
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 12, maxWidth: 500, margin: "0 auto 12px" }}>
          주거·상가 임대 물건을 한 앱으로. 수금 추적, 계약 관리, 세금 시뮬레이션, 내용증명까지.
        </p>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          엑셀 없이, 복잡한 설정 없이 — 지금 바로 시작하세요.
        </p>

        {/* CTA 버튼 */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary"
            style={{ padding: "15px 44px", borderRadius: 14, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 8px 32px ${C.indigo}55` }}
          >
            무료로 시작하기
          </button>
          <button
            onClick={() => router.push("/login")}
            style={{ padding: "15px 28px", borderRadius: 14, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          >
            로그인
          </button>
        </div>

        {/* 통계 */}
        <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
          {stats.map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{s.v}</p>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 기능 카드 — SEO 키워드 포함 */}
      <div
        className="stagger"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, maxWidth: 960, width: "100%", marginTop: 56, position: "relative", zIndex: 1 }}
      >
        {features.map((f) => (
          <div key={f.title} className="hover-lift" style={{ background: `${C.surface}cc`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 20px", backdropFilter: "blur(12px)" }}>
            <span style={{ fontSize: 26, marginBottom: 10, display: "block" }}>{f.icon}</span>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{f.title}</h2>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* 푸터 */}
      <footer style={{ marginTop: 60, textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 11, color: C.muted }}>
          © 2025 Ownly by McLean · <span style={{ color: C.indigo }}>ownly.kr</span>
        </p>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
          개인 임대인을 위한 임대장부 · 수금관리 · 계약관리 앱
        </p>
      </footer>
    </div>
  );
}
