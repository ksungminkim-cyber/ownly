"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { C, PLANS } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import { toast } from "../../../components/shared";

export default function PricingPage() {
  const router = useRouter();
  const { user, userPlan } = useApp();
  const [loading, setLoading] = useState(null);

  const currentPlan = userPlan || "free";

  const handleUpgrade = async (planId) => {
    if (!user) { router.push("/login"); return; }
    if (planId === currentPlan) return;
    if (planId === "free") {
      toast("무료 플랜으로 다운그레이드는 고객센터를 통해 문의해주세요.", "info");
      return;
    }
    if (!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY) {
      toast("결제 서비스 준비 중입니다. 곧 오픈 예정이에요! 문의: support@ownly.kr", "info");
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

  return (
    <div className="page-padding" style={{ fontFamily: "'Pretendard','DM Sans',sans-serif", maxWidth: 900, margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>PRICING</p>
        <h1 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, color: "#1a2744", lineHeight: 1.2, margin: "0 0 12px" }}>
          나에게 맞는 플랜을 선택하세요
        </h1>
        <p style={{ color: "#8a8a9a", fontSize: 15 }}>언제든지 업그레이드·다운그레이드 가능합니다</p>
      </div>

      {/* 플랜 카드 — alignItems: stretch 로 동일 높이 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, alignItems: "stretch" }}>
        {Object.values(PLANS).map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isStarter = plan.id === "starter";
          const isPro = plan.id === "pro";

          return (
            <div key={plan.id} style={{
              background: isStarter ? "linear-gradient(160deg, rgba(26,39,68,0.04), #ffffff)" : "#ffffff",
              border: `1.5px solid ${isCurrent ? (isPro ? "#c9920a" : "#1a2744") : isStarter ? "rgba(26,39,68,0.18)" : isPro ? "rgba(201,146,10,0.2)" : "#ebe9e3"}`,
              borderRadius: 20, padding: "32px 24px 24px",
              position: "relative", display: "flex", flexDirection: "column",
              boxShadow: isStarter ? "0 8px 32px rgba(26,39,68,0.1)" : "0 2px 10px rgba(26,39,68,0.05)",
              transition: "transform .2s",
            }}>

              {/* 배지 (인기/최고) — 상단 중앙 */}
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                  background: isStarter ? "linear-gradient(135deg,#1a2744,#2d4270)" : "linear-gradient(135deg,#c9920a,#e8960a)",
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap",
                  letterSpacing: "0.5px"
                }}>{plan.badge}</div>
              )}

              {/* 현재 플랜 뱃지 — 플랜명 옆 인라인으로 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: isPro ? "#c9920a" : isStarter ? "#1a2744" : "#8a8a9a", letterSpacing: "1px", margin: 0 }}>
                  {plan.name.toUpperCase()}
                </p>
                {isCurrent && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: "#0fa573",
                    background: "rgba(15,165,115,0.1)", border: "1px solid rgba(15,165,115,0.25)",
                    padding: "2px 9px", borderRadius: 20, letterSpacing: "0.3px"
                  }}>현재 플랜</span>
                )}
              </div>

              {/* 가격 */}
              <p style={{ fontSize: plan.price === 0 ? 32 : 28, fontWeight: 900, color: "#1a2744", margin: "0 0 4px" }}>
                {plan.price === 0 ? "무료" : `₩${plan.price.toLocaleString()}`}
              </p>
              <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 20 }}>
                {plan.price === 0 ? "영구 무료" : "월 구독 · VAT 포함"}
              </p>

              {/* 기능 목록 — flex:1 로 늘려서 버튼을 항상 하단에 */}
              <div style={{ flex: 1, marginBottom: 24 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: "#0fa573", fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: "#1a2744" }}>{f}</span>
                  </div>
                ))}
                {(plan.locked || []).map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, opacity: 0.3 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>✗</span>
                    <span style={{ fontSize: 13, color: "#8a8a9a" }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA 버튼 — 항상 카드 최하단 */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || !!loading}
                style={{
                  width: "100%", padding: "13px", borderRadius: 12, border: "none",
                  cursor: isCurrent ? "default" : "pointer",
                  fontWeight: 800, fontSize: 14, transition: "all .15s",
                  opacity: loading && loading !== plan.id ? 0.6 : 1,
                  background: isCurrent
                    ? "#f0efe9"
                    : isStarter
                      ? "linear-gradient(135deg, #1a2744, #2d4270)"
                      : isPro
                        ? "linear-gradient(135deg, #c9920a, #e8960a)"
                        : "#f0efe9",
                  color: isCurrent ? "#8a8a9a" : plan.price === 0 ? "#6a6a7a" : "#fff",
                  boxShadow: isCurrent ? "none" : isStarter ? "0 4px 16px rgba(26,39,68,0.25)" : isPro ? "0 4px 16px rgba(201,146,10,0.25)" : "none",
                }}
              >
                {loading === plan.id ? "처리 중..." : isCurrent ? "현재 플랜" : plan.price === 0 ? "무료로 시작" : "업그레이드"}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div style={{ marginTop: 56, borderTop: "1px solid #ebe9e3", paddingTop: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 24 }}>자주 묻는 질문</h2>
        {[
          { q: "언제든지 취소할 수 있나요?", a: "네, 구독은 언제든지 취소 가능합니다. 취소 시 현재 결제 기간 종료일까지 서비스가 유지됩니다." },
          { q: "결제는 어떻게 이루어지나요?", a: "Toss Payments를 통한 카드 자동 결제입니다. 매월 구독 시작일에 자동으로 청구됩니다." },
          { q: "무료 플랜에서 업그레이드 시 데이터는 유지되나요?", a: "네, 모든 데이터는 그대로 유지됩니다." },
          { q: "세금계산서 발행이 가능한가요?", a: "스타터·프로 플랜은 요청 시 세금계산서를 발행해드립니다. 설정 > 고객지원으로 문의해주세요." },
        ].map((faq) => (
          <div key={faq.q} style={{ marginBottom: 12, padding: "18px 20px", background: "#ffffff", borderRadius: 14, border: "1px solid #ebe9e3" }}>
            <p style={{ fontWeight: 700, color: "#1a2744", fontSize: 14, marginBottom: 6 }}>Q. {faq.q}</p>
            <p style={{ color: "#8a8a9a", fontSize: 13, lineHeight: 1.6 }}>A. {faq.a}</p>
          </div>
        ))}
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
