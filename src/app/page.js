"use client";
import { useRouter } from "next/navigation";
import { C, PLANS } from "../lib/constants";

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

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px 0", position: "relative", overflow: "hidden", fontFamily: "'Outfit','Noto Sans KR',sans-serif" }}>
      {/* 배경 장식 */}
      <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle,${C.indigo}15,transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${C.purple}10,transparent 70%)`, pointerEvents: "none" }} />

      {/* 히어로 섹션 */}
      <div style={{ textAlign: "center", maxWidth: 700, position: "relative", zIndex: 1, paddingTop: 40 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 6px 24px ${C.indigo}55` }}>🏠</div>
          <div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff" }}>Ownly</span>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginLeft: 8 }}>by McLean</span>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Outfit','Noto Sans KR',sans-serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          <span className="gradient-text">개인 임대인을 위한</span><br />
          <span style={{ color: "#fff" }}>스마트 임대 관리 앱</span>
        </h1>
        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          주거·상가 임대 물건을 한 앱으로. 수금 추적, 계약 관리, 세금 시뮬레이션, 내용증명까지.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/login")} className="btn-primary" style={{ padding: "15px 44px", borderRadius: 14, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 8px 32px ${C.indigo}55` }}>
            무료로 시작하기
          </button>
          <button onClick={() => router.push("/login")} style={{ padding: "15px 28px", borderRadius: 14, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
            로그인
          </button>
        </div>
      </div>

      {/* 기능 카드 */}
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, maxWidth: 960, width: "100%", marginTop: 56, position: "relative", zIndex: 1 }}>
        {features.map((f) => (
          <div key={f.title} className="hover-lift" style={{ background: `${C.surface}cc`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 20px", backdropFilter: "blur(12px)" }}>
            <span style={{ fontSize: 26, marginBottom: 10, display: "block" }}>{f.icon}</span>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{f.title}</h2>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ─── 구독 플랜 섹션 (토스 심사용 + 실제 판매) ─── */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 80, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.indigo, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>PRICING</p>
          <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 900, color: "#fff", margin: 0 }}>나에게 맞는 플랜 선택</h2>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>모든 플랜은 언제든지 변경·취소 가능합니다</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20, padding: "0 0 20px" }}>
          {Object.values(PLANS).map((plan) => {
            const isStarter = plan.id === "starter";
            return (
              <div key={plan.id} style={{ background: isStarter ? `linear-gradient(160deg,${C.indigo}22,${C.surface})` : C.surface, border: `1.5px solid ${isStarter ? C.indigo + "66" : C.border}`, borderRadius: 20, padding: "28px 24px", position: "relative" }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
                    {plan.badge}
                  </div>
                )}
                <p style={{ fontSize: 12, fontWeight: 700, color: plan.color, marginBottom: 6, letterSpacing: "1px" }}>{plan.name.toUpperCase()}</p>
                <p style={{ fontSize: 30, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>
                  {plan.price === 0 ? "무료" : `₩${plan.price.toLocaleString()}`}
                </p>
                <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>{plan.price === 0 ? "영구 무료" : "월 구독 · VAT 포함"}</p>
                <div style={{ marginBottom: 24 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
                      <span style={{ color: C.emerald, fontSize: 13, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: C.text }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push("/login")}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", background: isStarter ? `linear-gradient(135deg,${C.indigo},${C.purple})` : plan.id === "pro" ? `linear-gradient(135deg,${C.amber},${C.gold || "#f5c542"})` : C.border, color: "#fff", fontWeight: 800, fontSize: 14 }}
                >
                  {plan.price === 0 ? "무료로 시작" : "구독 시작하기"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 법적 푸터 (토스 심사 필수) ─── */}
      <footer style={{ width: "100%", borderTop: `1px solid ${C.border}`, marginTop: 60, padding: "32px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏠</div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 800, color: "#fff" }}>Ownly</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 2, display: "flex", flexWrap: "wrap", gap: "0 24px" }}>
            <span>상호명: (주)맥클린</span>
            <span>대표: 김성민</span>
            <span>사업자등록번호: 137-81-52231</span>
            <span>통신판매업신고: 제0000-서울00-0000호</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 2, display: "flex", flexWrap: "wrap", gap: "0 24px", marginTop: 4 }}>
            <span>이메일: inquiry@mclean21.com</span>
            <span>서비스 이용약관</span>
            <span>개인정보처리방침</span>
          </div>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 12, opacity: 0.6 }}>© 2025 McLean Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
