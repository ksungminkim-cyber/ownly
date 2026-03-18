"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { C, PLANS } from "../lib/constants";

export default function LandingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("plus");

  const features = [
    { icon: "🏠", title: "주거·상가 통합 관리", desc: "아파트·빌라·오피스텔·상가·토지 등 모든 임대 유형을 한 플랫폼에서 관리합니다." },
    { icon: "💰", title: "임대료 수금 자동화",  desc: "월세·보증금 수금 현황을 자동 추적하고 미납 즉시 알림. 임대료 관리가 쉬워집니다." },
    { icon: "📊", title: "임대 수익률 분석",    desc: "물건별 연 수익률 자동 계산, 월별 수익 차트. 임대 자산 수익 현황을 한눈에 파악합니다." },
    { icon: "📝", title: "계약서·내용증명",     desc: "임대차 계약서 관리부터 법적 효력의 내용증명 PDF 발행까지 원스톱으로 처리합니다." },
    { icon: "🧾", title: "세금 신고 시뮬레이터", desc: "임대소득 종합소득세·부가세를 자동 추정합니다. 임대사업자 세금 신고에 도움이 됩니다." },
    { icon: "🤖", title: "AI 입지·임대료 분석", desc: "국토부 실거래가 기반으로 지역 적정 임대료와 입지를 AI가 분석합니다." },
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
            <span style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.5px" }}>온리</span>
            <span style={{ fontSize: 11, color: "#a0a0b0", fontWeight: 500, marginLeft: 6, letterSpacing: "0.5px" }}>Ownly</span>
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          <span className="gradient-text">내 임대 물건,</span><br />
          <span style={{ color: "#1a2744" }}>온리 하나로.</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          수금부터 계약·세금·내용증명까지. 임대 관리에 필요한 모든 것, 하나의 앱에서.
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
        <div style={{ marginTop: 16 }}>
          <Link href="/features" style={{ fontSize: 13, color: "#8a8a9a", textDecoration: "none", borderBottom: "1px solid #d0cfc8", paddingBottom: 1 }}>
            모든 기능 살펴보기 →
          </Link>
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

          {/* 월간 / 연간 토글 */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 20, background: "#f5f4f0", borderRadius: 40, padding: "5px 6px" }}>
            <button onClick={() => setIsAnnual(false)}
              style={{ padding: "7px 20px", borderRadius: 30, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s",
                background: !isAnnual ? "#fff" : "transparent",
                color: !isAnnual ? "#1a2744" : "#8a8a9a",
                boxShadow: !isAnnual ? "0 2px 8px rgba(26,39,68,0.1)" : "none" }}>
              월간 결제
            </button>
            <button onClick={() => setIsAnnual(true)}
              style={{ padding: "7px 20px", borderRadius: 30, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s", display: "flex", alignItems: "center", gap: 6,
                background: isAnnual ? "#1a2744" : "transparent",
                color: isAnnual ? "#fff" : "#8a8a9a",
                boxShadow: isAnnual ? "0 2px 8px rgba(26,39,68,0.2)" : "none" }}>
              연간 결제
              <span style={{ fontSize: 10, fontWeight: 800, background: isAnnual ? "rgba(255,255,255,0.2)" : "#0fa573", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>20% 할인</span>
            </button>
          </div>
          {isAnnual && (
            <p style={{ fontSize: 12, color: "#0fa573", fontWeight: 600, marginTop: 8 }}>
              🎉 연간 결제 시 2.4개월치 무료 — 12개월 한 번에 결제
            </p>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20, padding: "0 0 20px", alignItems: "stretch" }}>
          {Object.values(PLANS).map((plan) => {
            const isPlus = plan.id === "plus";
            const isPro         = plan.id === "pro";
            return (
              <div key={plan.id} style={{
                background: isPlus ? "linear-gradient(160deg, rgba(79,70,229,0.04), #ffffff)" : "#ffffff",
                border: `1.5px solid ${isPlus ? "rgba(79,70,229,0.25)" : isPro ? "rgba(201,146,10,0.25)" : "#ebe9e3"}`,
                borderRadius: 20, padding: "28px 24px 24px",
                position: "relative", display: "flex", flexDirection: "column",
                boxShadow: isPlus ? "0 8px 32px rgba(79,70,229,0.12)" : "0 2px 10px rgba(26,39,68,0.05)"
              }}>
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: isPlus ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "linear-gradient(135deg,#c9920a,#e8960a)",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap"
                  }}>{plan.badge}</div>
                )}

                {/* 플랜명 & 가격 */}
                <p style={{ fontSize: 13, fontWeight: 800, color: isPro ? "#c9920a" : isPlus ? "#4f46e5" : "#8a8a9a", marginBottom: 6, letterSpacing: "1px" }}>{plan.name.toUpperCase()}</p>
                {(() => {
                  const monthly  = plan.price;
                  const annual   = Math.round(monthly * 0.8);
                  const showPrice = isAnnual && monthly > 0 ? annual : monthly;
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "0 0 4px" }}>
                        <p style={{ fontSize: monthly === 0 ? 32 : 28, fontWeight: 900, color: "#1a2744", margin: 0 }}>
                          {monthly === 0 ? "무료" : `₩${showPrice.toLocaleString()}`}
                        </p>
                        {isAnnual && monthly > 0 && (
                          <span style={{ fontSize: 13, color: "#8a8a9a", textDecoration: "line-through" }}>₩{monthly.toLocaleString()}</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 20 }}>
                        {monthly === 0 ? "영구 무료" : isAnnual ? `연 ₩${(annual*12).toLocaleString()} · VAT 포함` : "월 구독 · VAT 포함"}
                      </p>
                    </>
                  );
                })()}

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
                    background: isPlus
                      ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                      : isPro
                        ? "linear-gradient(135deg, #c9920a, #e8960a)"
                        : "#f0efe9",
                    color: plan.price === 0 ? "#6a6a7a" : "#fff",
                    boxShadow: isPlus ? "0 4px 16px rgba(79,70,229,0.25)" : isPro ? "0 4px 16px rgba(201,146,10,0.25)" : "none",
                  }}
                >
                  {plan.price === 0 ? "무료로 시작" : "구독 시작하기"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 임대인 커뮤니티 ─── */}
      <div style={{ width: "100%", background: "#ffffff", padding: "60px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>COMMUNITY</p>
              <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, color: "#1a2744", lineHeight: 1.2 }}>임대인들의 실제 이야기</h2>
              <p style={{ fontSize: 15, color: "#8a8a9a", marginTop: 8 }}>온리를 사용하는 임대인들이 나누는 경험과 노하우</p>
            </div>
            <a href="/login" style={{ fontSize: 13, fontWeight: 700, color: "#5b4fcf", textDecoration: "none", background: "rgba(91,79,207,0.08)", padding: "9px 18px", borderRadius: 10, flexShrink: 0 }}>무료로 시작하기 →</a>
          </div>

          {/* 커뮤니티 피드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { avatar: "🏢", name: "서울 강남 임대인", time: "방금 전", tag: "수금 관리", content: "월세 미납 알림이 바로 와서 세입자한테 문자 보내니까 다음날 바로 입금됐어요. 예전엔 수기로 체크하다 까먹었는데 이제 완전 편해졌습니다 👍", likes: 24 },
              { avatar: "🏠", name: "인천 다세대 2채 운영", time: "1시간 전", tag: "세금 시뮬", content: "종합소득세 신고 전에 세금 시뮬레이터 돌려봤는데 세무사 견적이랑 거의 비슷하게 나왔어요. 사전에 준비할 수 있어서 너무 좋습니다", likes: 18 },
              { avatar: "🏪", name: "부산 상가 임대", time: "3시간 전", tag: "내용증명", content: "퇴거 요청 내용증명을 앱에서 바로 뽑아서 등기로 보냈어요. 변호사 통하면 50만원인데 직접 하니까 딱 우편료만 들었습니다 💪", likes: 31 },
              { avatar: "🏗️", name: "경기 빌라 3채", time: "어제", tag: "계약 관리", content: "계약 만료일 90일 전부터 알림이 오니까 미리미리 세입자한테 연락할 수 있어요. 공실 없이 계속 유지 중입니다!", likes: 15 },
              { avatar: "🌱", name: "충남 토지 임대", time: "이틀 전", tag: "토지 관리", content: "토지 임대도 관리 가능해서 좋아요. 농지 임대료 수금 내역을 월별로 정리할 수 있고, 세금 계산도 따로 나와서 편하네요", likes: 9 },
              { avatar: "💼", name: "서울 오피스텔 5채", time: "3일 전", tag: "리포트", content: "연말에 세무신고 자료 준비할 때 리포트 뽑으니까 1년치 수입·지출이 한눈에 보여요. 세무사 상담 시간도 절반으로 줄었어요", likes: 27 },
            ].map((post, i) => (
              <div key={i} style={{ background: "#f8f7f4", borderRadius: 16, padding: "18px 20px", border: "1px solid #ebe9e3" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{post.avatar}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{post.name}</p>
                      <p style={{ fontSize: 11, color: "#a0a0b0" }}>{post.time}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#5b4fcf", background: "rgba(91,79,207,0.1)", padding: "3px 9px", borderRadius: 6 }}>{post.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: "#3a3a4e", lineHeight: 1.7, marginBottom: 14 }}>{post.content}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>❤️</span>
                  <span style={{ fontSize: 12, color: "#a0a0b0", fontWeight: 600 }}>{post.likes}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 32, textAlign: "center", padding: "32px", background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(91,79,207,0.04))", borderRadius: 20, border: "1px solid rgba(91,79,207,0.1)" }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>지금 바로 시작해보세요</p>
            <p style={{ fontSize: 14, color: "#8a8a9a", marginBottom: 20 }}>무료 플랜으로 시작, 언제든 업그레이드 가능</p>
            <a href="/login" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>무료로 온리 시작하기 →</a>
          </div>
        </div>
      </div>

      {/* ─── B2B 문의 섹션 ─── */}
      <div style={{ width: "100%", background: "#1a2744", padding: "48px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>ENTERPRISE</p>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: "-.3px" }}>
              법인·공인중개사·자산관리사 대상 별도 문의
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              다수 물건 보유 법인 · 공인중개사 사무소 · 자산관리회사<br/>
              세금계산서 발행 · 연간 계약 · 팀 계정 협의 가능
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <a href="mailto:inquiry@mclean21.com?subject=온리 기업 구독 문의"
              style={{ padding: "14px 28px", borderRadius: 12, background: "#fff", color: "#1a2744", fontWeight: 800, fontSize: 14, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap" }}>
              영업팀에 문의하기 →
            </a>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>inquiry@mclean21.com</p>
          </div>
        </div>
      </div>

      {/* ─── 법적 푸터 ─── */}
      <footer style={{
        width: "100%", borderTop: "1px solid #e8e6e0",
        marginTop: 60, padding: "40px 20px 32px",
        position: "relative", zIndex: 1
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* 푸터 상단 — 로고 + 링크 그리드 */}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
            {/* 로고 + 설명 */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #1a2744, #2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.9"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 16, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.3px" }}>온리</span>
              </div>
              <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7, maxWidth: 200 }}>내 임대 물건, 온리 하나로.<br/>수금·계약·세금·내용증명</p>
            </div>

            {/* 링크 그룹들 */}
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>서비스</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/features" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    기능 소개
                  </Link>
                  <Link href="/login" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    무료 시작하기
                  </Link>
                  <Link href="/dashboard/pricing" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    요금제
                  </Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>지원</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/legal/faq" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    자주 묻는 질문
                  </Link>
                  <Link href="/legal/notice" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    공지사항
                  </Link>
                  <a href="mailto:inquiry@mclean21.com" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    문의하기
                  </a>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>법적</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/legal/terms" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    서비스 이용약관
                  </Link>
                  <Link href="/legal/privacy" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    개인정보처리방침
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 푸터 하단 — 사업자 정보 */}
          <div style={{ borderTop: "1px solid #ebe9e3", paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.9, display: "flex", flexWrap: "wrap", gap: "0 20px" }}>
              <span>상호명: (주)맥클린</span>
              <span>대표: 김성민</span>
              <span>사업자등록번호: 137-81-52231</span>
              <span>통신판매업신고: 제0000-서울00-0000호</span>
              <span>이메일: inquiry@mclean21.com</span>
            </div>
            <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 8 }}>© 2025 McLean Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ─── 하단 고정 결제 바 ─── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #e8e6e0", padding: "12px 20px", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select onChange={(e) => setSelectedPlan(e.target.value)} value={selectedPlan}
            style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid #e8e6e0", fontSize: 13, fontWeight: 600, color: "#1a2744", background: "#fff", cursor: "pointer" }}>
            {Object.values(PLANS).filter(p => p.price > 0).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => setIsAnnual(!isAnnual)}
            style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #e8e6e0", fontSize: 13, fontWeight: 600, cursor: "pointer", background: isAnnual ? "#1a2744" : "#fff", color: isAnnual ? "#fff" : "#1a2744", whiteSpace: "nowrap" }}>
            {isAnnual ? "연간 (20% 할인)" : "월간"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {(() => {
            const plan = Object.values(PLANS).find(p => p.id === selectedPlan) || Object.values(PLANS)[1];
            const monthly = plan?.price || 0;
            const price = isAnnual ? Math.round(monthly * 0.8) : monthly;
            return (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#1a2744", lineHeight: 1.1 }}>
                  ₩{price.toLocaleString()}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#8a8a9a" }}> / 월</span>
                  {isAnnual && <span style={{ fontSize: 10, fontWeight: 800, color: "#0fa573", marginLeft: 4 }}>-20%</span>}
                </p>
                <p style={{ fontSize: 10, color: "#8a8a9a" }}>{isAnnual ? `연 ₩${(price * 12).toLocaleString()} · VAT 포함` : "VAT 포함"}</p>
              </div>
            );
          })()}
          <button onClick={() => router.push("/login")}
            style={{ padding: "10px 24px", borderRadius: 11, background: "linear-gradient(135deg, #1a2744, #2d4270)", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(26,39,68,0.25)" }}>
            구독 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
