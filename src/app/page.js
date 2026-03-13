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
    <div className="grid-bg" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "40px 20px 0",
      position: "relative", overflow: "hidden",
      fontFamily: "'Pretendard','DM Sans',sans-serif",
      background: "#f5f4f0"
    }}>

      {/* 배경 장식 */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,39,68,0.05), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,79,207,0.04), transparent 70%)", pointerEvents: "none" }} />

      {/* 히어로 섹션 */}
      <div style={{ textAlign: "center", maxWidth: 700, position: "relative", zIndex: 1, paddingTop: 40 }}>
        {/* 로고 */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: "linear-gradient(145deg, #1a2744, #2d4270)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 24px rgba(26,39,68,0.3)"
          }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
              <rect x="7.5" y="12" width="5" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
            </svg>
          </div>
          <div>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 800, color: "#1a2744" }}>Ownly</span>
            <span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 500, marginLeft: 8 }}>by McLean</span>
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          <span className="gradient-text">개인 임대인을 위한</span><br />
          <span style={{ color: "#1a2744" }}>스마트 임대 관리 앱</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          주거·상가 임대 물건을 한 앱으로. 수금 추적, 계약 관리, 세금 시뮬레이션, 내용증명까지.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary"
            style={{
              padding: "15px 44px", borderRadius: 14,
              background: "linear-gradient(135deg, #1a2744, #2d4270)",
              border: "none", color: "#fff", fontWeight: 800, fontSize: 16,
              cursor: "pointer", boxShadow: "0 8px 32px rgba(26,39,68,0.3)"
            }}
          >무료로 시작하기</button>
          <button
            onClick={() => router.push("/login")}
            style={{
              padding: "15px 28px", borderRadius: 14,
              background: "#ffffff", border: "1.5px solid #e8e6e0",
              color: "#6a6a7a", fontWeight: 600, fontSize: 15, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(26,39,68,0.06)"
            }}
          >로그인</button>
        </div>
      </div>

      {/* 기능 카드 */}
      <div className="stagger" style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        gap: 14, maxWidth: 960, width: "100%", marginTop: 56, position: "relative", zIndex: 1
      }}>
        {features.map((f) => (
          <div key={f.title} className="hover-lift" style={{
            background: "#ffffff", border: "1px solid #ebe9e3",
            borderRadius: 16, padding: "22px 20px",
            boxShadow: "0 2px 10px rgba(26,39,68,0.05)"
          }}>
            <span style={{ fontSize: 26, marginBottom: 10, display: "block" }}>{f.icon}</span>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", marginBottom: 5 }}>{f.title}</h2>
            <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ─── 구독 플랜 섹션 ─── */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 80, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, opacity: 0.5 }}>PRICING</p>
          <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 900, color: "#1a2744", margin: 0 }}>나에게 맞는 플랜 선택</h2>
          <p style={{ color: "#8a8a9a", fontSize: 14, marginTop: 8 }}>모든 플랜은 언제든지 변경·취소 가능합니다</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20, padding: "0 0 20px", alignItems: "stretch" }}>
          {Object.values(PLANS).map((plan) => {
            const isStarter = plan.id === "starter";
            const isPro = plan.id === "pro";
            return (
              <div key={plan.id} style={{
                background: isStarter ? "linear-gradient(160deg, rgba(26,39,68,0.04), #ffffff)" : "#ffffff",
                border: `1.5px solid ${isStarter ? "rgba(26,39,68,0.2)" : isPro ? "rgba(201,146,10,0.25)" : "#ebe9e3"}`,
                borderRadius: 20, padding: "28px 24px 24px",
                position: "relative", display: "flex", flexDirection: "column",
                boxShadow: isStarter ? "0 8px 32px rgba(26,39,68,0.1)" : "0 2px 10px rgba(26,39,68,0.05)"
              }}>
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: isStarter ? "linear-gradient(135deg,#1a2744,#2d4270)" : "linear-gradient(135deg,#c9920a,#e8960a)",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap"
                  }}>{plan.badge}</div>
                )}

                {/* 플랜명 & 가격 */}
                <p style={{ fontSize: 13, fontWeight: 800, color: isPro ? "#c9920a" : isStarter ? "#1a2744" : "#8a8a9a", marginBottom: 6, letterSpacing: "1px" }}>{plan.name.toUpperCase()}</p>
                <p style={{ fontSize: plan.price === 0 ? 32 : 28, fontWeight: 900, color: "#1a2744", margin: "0 0 4px" }}>
                  {plan.price === 0 ? "무료" : `₩${plan.price.toLocaleString()}`}
                </p>
                <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 20 }}>{plan.price === 0 ? "영구 무료" : "월 구독 · VAT 포함"}</p>

                {/* 기능 목록 — flex: 1 로 늘여서 버튼을 항상 하단에 */}
                <div style={{ marginBottom: 24, flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start", opacity: f.ok ? 1 : 0.35 }}>
                      <span style={{ color: f.ok ? "#0fa573" : "#8a8a9a", fontSize: 13, marginTop: 1, flexShrink: 0 }}>{f.ok ? "✓" : "✗"}</span>
                      <span style={{ fontSize: 13, color: f.ok ? "#1a2744" : "#8a8a9a" }}>{f.t}</span>
                    </div>
                  ))}
                </div>

                {/* CTA 버튼 — marginTop: auto 로 항상 하단 정렬 */}
                <button
                  onClick={() => router.push("/login")}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 12, border: "none",
                    cursor: "pointer", fontWeight: 800, fontSize: 14, marginTop: "auto",
                    background: isStarter
                      ? "linear-gradient(135deg, #1a2744, #2d4270)"
                      : isPro
                        ? "linear-gradient(135deg, #c9920a, #e8960a)"
                        : "#f0efe9",
                    color: plan.price === 0 ? "#6a6a7a" : "#fff",
                    boxShadow: isStarter ? "0 4px 16px rgba(26,39,68,0.25)" : isPro ? "0 4px 16px rgba(201,146,10,0.25)" : "none",
                  }}
                >
                  {plan.price === 0 ? "무료로 시작" : "구독 시작하기"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 법적 푸터 ─── */}
      <footer style={{
        width: "100%", borderTop: "1px solid #e8e6e0",
        marginTop: 60, padding: "32px 20px",
        position: "relative", zIndex: 1
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #1a2744, #2d4270)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1a2744" }}>Ownly</span>
          </div>
          <div style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 2, display: "flex", flexWrap: "wrap", gap: "0 24px" }}>
            <span>상호명: (주)맥클린</span>
            <span>대표: 김성민</span>
            <span>사업자등록번호: 137-81-52231</span>
            <span>통신판매업신고: 제0000-서울00-0000호</span>
          </div>
          <div style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 2, display: "flex", flexWrap: "wrap", gap: "0 24px", marginTop: 4 }}>
            <span>이메일: inquiry@mclean21.com</span>
            <span style={{ cursor: "pointer", textDecoration: "underline" }}>서비스 이용약관</span>
            <span style={{ cursor: "pointer", textDecoration: "underline" }}>개인정보처리방침</span>
          </div>
          <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 12, opacity: 0.6 }}>© 2025 McLean Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
