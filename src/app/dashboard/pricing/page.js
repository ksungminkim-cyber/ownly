"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { C, PLANS } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import { toast } from "../../../components/shared";

const PLAN_ORDER = { free: 0, starter: 1, starter_plus: 2, pro: 3 };

export default function PricingPage() {
  const router   = useRouter();
  const { user, userPlan } = useApp();
  const [loading, setLoading] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);

  const currentPlan = userPlan || "free";
  const currentLevel = PLAN_ORDER[currentPlan] ?? 0;

  const handleUpgrade = async (planId) => {
    if (!user) { router.push("/login"); return; }
    if (planId === currentPlan) return;
    if (planId === "free") {
      toast("무료 플랜으로 변경은 고객센터로 문의해주세요.", "info");
      return;
    }
    if (!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY) {
      toast("결제 서비스 준비 중입니다. 곧 오픈 예정이에요! 문의: inquiry@mclean21.com", "info");
      return;
    }
    setLoading(planId);
    try {
      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
      await tossPayments.requestBillingAuth("카드", {
        customerKey: user.id,
        successUrl: `${window.location.origin}/dashboard/pricing/success?plan=${planId}`,
        failUrl:    `${window.location.origin}/dashboard/pricing/fail`,
      });
    } catch (e) {
      if (e?.code !== "USER_CANCEL") toast("결제 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(null);
    }
  };

  const planList = Object.values(PLANS);

  const FAQS = [
    { q: "언제든지 취소할 수 있나요?", a: "네, 구독은 언제든지 취소 가능합니다. 취소 시 현재 결제 기간 종료일까지 서비스가 유지됩니다." },
    { q: "스타터 → 스타터+ 업그레이드 시 차액만 내나요?", a: "네, 업그레이드 시 남은 기간의 차액만 비례 청구됩니다. 데이터는 모두 유지됩니다." },
    { q: "결제는 어떻게 이루어지나요?", a: "Toss Payments를 통한 카드 자동 결제입니다. 매월 구독 시작일에 자동으로 청구됩니다." },
    { q: "물건 수가 플랜 한도를 초과하면?", a: "기존 등록 물건은 유지되지만 새 물건을 추가할 수 없게 됩니다. 업그레이드 후 정상 이용 가능합니다." },
    { q: "세금계산서 발행이 가능한가요?", a: "스타터 이상 플랜은 요청 시 세금계산서를 발행해드립니다. 설정 > 고객지원으로 문의해주세요." },
  ];

  return (
    <div style={{ fontFamily: "'Pretendard','DM Sans',sans-serif", maxWidth: 1060, margin: "0 auto", padding: "36px 24px 60px" }}>

      {/* 헤더 */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>PRICING</p>
        <h1 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 900, color: "#1a2744", lineHeight: 1.2, margin: "0 0 12px" }}>
          나에게 맞는 플랜을 선택하세요
        </h1>
        <p style={{ color: "#8a8a9a", fontSize: 14 }}>언제든지 업그레이드 · 다운그레이드 가능 · VAT 포함</p>
      </div>

      {/* 플랜 카드 4개 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "stretch", marginBottom: 56 }}>
        {planList.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const planLevel = PLAN_ORDER[plan.id] ?? 0;
          const isUpgrade = planLevel > currentLevel;
          const isDowngrade = planLevel < currentLevel && plan.id !== "free";

          // 플랜별 색상 테마
          const theme = {
            free:         { accent: "#8a8a9a", bg: "#ffffff", border: "#ebe9e3", btnBg: "#f0efe9", btnColor: "#6a6a7a", shadow: "none" },
            starter:      { accent: "#3b6bca", bg: "#ffffff", border: "#dce6f5", btnBg: "linear-gradient(135deg,#3b6bca,#2d5ab8)", btnColor: "#fff", shadow: "0 6px 24px rgba(59,107,202,0.2)" },
            starter_plus: { accent: "#0fa573", bg: "linear-gradient(160deg,rgba(15,165,115,0.03),#ffffff)", border: "#b8e8d6", btnBg: "linear-gradient(135deg,#0fa573,#0d8a60)", btnColor: "#fff", shadow: "0 8px 32px rgba(15,165,115,0.2)" },
            pro:          { accent: "#c9920a", bg: "linear-gradient(160deg,rgba(201,146,10,0.04),#ffffff)", border: "#f0d88a", btnBg: "linear-gradient(135deg,#c9920a,#e8960a)", btnColor: "#fff", shadow: "0 8px 32px rgba(201,146,10,0.22)" },
          }[plan.id];

          const isHighlighted = plan.id === "starter_plus";

          return (
            <div key={plan.id}
              style={{
                background: theme.bg, border: `1.5px solid ${isCurrent ? theme.accent : theme.border}`,
                borderRadius: 20, padding: "28px 20px 22px",
                position: "relative", display: "flex", flexDirection: "column",
                boxShadow: isCurrent ? theme.shadow : isHighlighted ? "0 8px 32px rgba(15,165,115,0.15)" : "0 2px 10px rgba(26,39,68,0.04)",
                transform: isHighlighted ? "translateY(-6px)" : "none",
                transition: "box-shadow .2s, transform .2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = theme.shadow || "0 6px 24px rgba(26,39,68,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = isCurrent ? theme.shadow : isHighlighted ? "0 8px 32px rgba(15,165,115,0.15)" : "0 2px 10px rgba(26,39,68,0.04)"; }}
            >
              {/* 추천 배지 */}
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                  background: plan.id === "starter_plus"
                    ? "linear-gradient(135deg,#0fa573,#0d8a60)"
                    : "linear-gradient(135deg,#c9920a,#e8960a)",
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: "0.5px",
                }}>⭐ {plan.badge}</div>
              )}

              {/* 이모지 + 플랜명 */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{plan.emoji}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: theme.accent, letterSpacing: "0.5px", margin: 0 }}>
                    {plan.name.toUpperCase()}
                  </p>
                  {isCurrent && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#0fa573",
                      background: "rgba(15,165,115,0.1)", border: "1px solid rgba(15,165,115,0.25)",
                      padding: "2px 8px", borderRadius: 20 }}>현재</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 4, lineHeight: 1.4 }}>{plan.tagline}</p>
              </div>

              {/* 가격 */}
              <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid #f0efe9" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  {plan.price === 0 ? (
                    <span style={{ fontSize: 30, fontWeight: 900, color: "#1a2744" }}>무료</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 2 }}>₩</span>
                      <span style={{ fontSize: 28, fontWeight: 900, color: "#1a2744", letterSpacing: "-1px" }}>
                        {plan.price.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>/월</span>
                    </>
                  )}
                </div>
                {plan.price > 0 && (
                  <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 3 }}>
                    연간 결제 시 {Math.round(plan.price * 10 / 1000)}만원 절약
                  </p>
                )}
              </div>

              {/* 기능 목록 */}
              <div style={{ flex: 1, marginBottom: 20 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, flexShrink: 0, marginTop: 0.5,
                      color: f.ok ? theme.accent : "#d0d0d8" }}>{f.ok ? "✓" : "✗"}</span>
                    <span style={{ fontSize: 12, color: f.ok ? "#1a2744" : "#b0b0c0",
                      fontWeight: f.ok ? 600 : 400, lineHeight: 1.4 }}>{f.t}</span>
                  </div>
                ))}
              </div>

              {/* CTA 버튼 */}
              <button onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || !!loading}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none",
                  cursor: isCurrent || loading ? "default" : "pointer",
                  fontWeight: 800, fontSize: 13, transition: "all .15s",
                  opacity: loading && loading !== plan.id ? 0.5 : 1,
                  background: isCurrent ? "#f0efe9" : theme.btnBg,
                  color: isCurrent ? "#8a8a9a" : theme.btnColor,
                  boxShadow: isCurrent ? "none" : theme.shadow,
                }}
                onMouseEnter={(e) => { if (!isCurrent && !loading) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {loading === plan.id ? "처리 중..." :
                 isCurrent ? "✓ 현재 플랜" :
                 plan.id === "free" ? "무료로 시작" :
                 isDowngrade ? "다운그레이드" : "업그레이드 →"}
              </button>
            </div>
          );
        })}
      </div>

      {/* 기능 비교표 */}
      <div style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 6, textAlign: "center" }}>플랜별 기능 비교</h2>
        <p style={{ fontSize: 13, color: "#8a8a9a", textAlign: "center", marginBottom: 28 }}>어떤 기능이 포함되어 있는지 한눈에 확인하세요</p>

        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}>
          {/* 헤더 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(4, 100px)", borderBottom: "2px solid #ebe9e3" }}>
            <div style={{ padding: "14px 20px", fontSize: 11, color: "#a0a0b0", fontWeight: 800, textTransform: "uppercase" }}>기능</div>
            {planList.map((p) => (
              <div key={p.id} style={{ padding: "14px 0", textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{p.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: {free:"#8a8a9a",starter:"#3b6bca",starter_plus:"#0fa573",pro:"#c9920a"}[p.id] }}>{p.name}</div>
              </div>
            ))}
          </div>

          {/* 비교 행 */}
          {[
            { label: "물건 수", vals: ["2개", "5개", "15개", "무제한"] },
            { label: "세입자 수", vals: ["3명", "10명", "30명", "무제한"] },
            { label: "리포트 / 세금", vals: [false, true, true, true] },
            { label: "내용증명", vals: [false, "3건/월", "10건/월", "무제한"] },
            { label: "PDF 내보내기", vals: [false, true, true, true] },
            { label: "💰 수익률 계산기", vals: [false, false, true, true] },
            { label: "📊 공실 손실 계산기", vals: [false, false, true, true] },
            { label: "📋 임대차 3법 체크", vals: [false, false, true, true] },
            { label: "🗺️ 주변 매물 조회", vals: [false, false, false, true] },
            { label: "🤖 AI 입지 분석", vals: [false, false, false, true] },
            { label: "📱 카카오톡 알림", vals: [false, false, false, true] },
          ].map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr repeat(4, 100px)",
              borderBottom: i < 10 ? "1px solid #f4f3f0" : "none",
              background: i % 2 === 0 ? "#faf9f6" : "#ffffff" }}>
              <div style={{ padding: "12px 20px", fontSize: 13, color: "#1a2744", fontWeight: 600 }}>{row.label}</div>
              {row.vals.map((v, j) => (
                <div key={j} style={{ padding: "12px 0", textAlign: "center", fontSize: 13 }}>
                  {v === true  ? <span style={{ color: "#0fa573", fontWeight: 800 }}>✓</span> :
                   v === false ? <span style={{ color: "#d0d0d8" }}>—</span> :
                   <span style={{ color: "#1a2744", fontWeight: 700 }}>{v}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 20, textAlign: "center" }}>자주 묻는 질문</h2>
        {FAQS.map((faq, i) => (
          <div key={i} onClick={() => setFaqOpen(faqOpen === i ? null : i)}
            style={{ marginBottom: 10, background: "#ffffff", borderRadius: 14,
              border: `1px solid ${faqOpen === i ? "#1a2744" : "#ebe9e3"}`, overflow: "hidden", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
              <p style={{ fontWeight: 700, color: "#1a2744", fontSize: 13, margin: 0 }}>Q. {faq.q}</p>
              <span style={{ fontSize: 14, color: "#8a8a9a", transition: "transform .2s",
                transform: faqOpen === i ? "rotate(180deg)" : "none" }}>▾</span>
            </div>
            {faqOpen === i && (
              <div style={{ padding: "0 20px 16px" }}>
                <p style={{ color: "#6a6a7a", fontSize: 13, lineHeight: 1.7, margin: 0 }}>A. {faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 CTA */}
      <div style={{ textAlign: "center", marginTop: 56, padding: "36px", background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(15,165,115,0.04))", borderRadius: 20, border: "1px solid #ebe9e3" }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>아직 고민 중이신가요?</p>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 20 }}>무료 플랜으로 먼저 시작해보세요. 언제든지 업그레이드 가능합니다.</p>
        <button onClick={() => router.push("/dashboard")}
          style={{ padding: "12px 28px", borderRadius: 12, background: "#1a2744", color: "#fff",
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          대시보드로 이동 →
        </button>
      </div>
    </div>
  );
}

async function loadTossPayments(clientKey) {
  if (window.TossPayments) return window.TossPayments(clientKey);
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://js.tosspayments.com/v1/payment";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.TossPayments(clientKey);
}
