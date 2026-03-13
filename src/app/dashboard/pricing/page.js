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

    // Toss 클라이언트 키가 없으면 준비 중 안내
    if (!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY) {
      toast("결제 서비스 준비 중입니다. 곧 오픈 예정이에요! 문의: support@ownly.kr", "info");
      return;
    }

    setLoading(planId);
    try {
      const plan = PLANS[planId];
      // Toss Payments 정기결제(빌링) 플로우
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
    <div className="page-padding" style={{ fontFamily: "'Outfit','Noto Sans KR',sans-serif", maxWidth: 900, margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.indigo, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>PRICING</p>
        <h1 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, color: "#fff", lineHeight: 1.2, margin: "0 0 12px" }}>
          나에게 맞는 플랜을 선택하세요
        </h1>
        <p style={{ color: C.muted, fontSize: 15 }}>언제든지 업그레이드·다운그레이드 가능합니다</p>
      </div>

      {/* 플랜 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        {Object.values(PLANS).map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isStarter = plan.id === "starter";
          return (
            <div
              key={plan.id}
              style={{
                background: isStarter ? `linear-gradient(160deg, ${C.indigo}22, ${C.surface})` : C.surface,
                border: `1.5px solid ${isCurrent ? plan.color : isStarter ? C.indigo + "66" : C.border}`,
                borderRadius: 20,
                padding: "28px 24px",
                position: "relative",
                transition: "transform .2s",
              }}
            >
              {/* 배지 */}
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 20, letterSpacing: "1px" }}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div style={{ position: "absolute", top: -12, right: 20, background: C.emerald + "22", color: C.emerald, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: `1px solid ${C.emerald}44` }}>
                  현재 플랜
                </div>
              )}

              {/* 플랜명 & 가격 */}
              <p style={{ fontSize: 13, fontWeight: 700, color: plan.color, marginBottom: 6, letterSpacing: "1px" }}>{plan.name.toUpperCase()}</p>
              <p style={{ fontSize: plan.price === 0 ? 32 : 28, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>
                {plan.price === 0 ? "무료" : `₩${plan.price.toLocaleString()}`}
              </p>
              {plan.price > 0 && <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>월 구독 · VAT 포함</p>}
              {plan.price === 0 && <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>영구 무료</p>}

              {/* 기능 목록 */}
              <div style={{ marginBottom: 24 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: C.emerald, fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 13, color: C.text }}>{f}</span>
                  </div>
                ))}
                {plan.locked.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, opacity: 0.35 }}>
                    <span style={{ fontSize: 14 }}>✗</span>
                    <span style={{ fontSize: 13, color: C.muted }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA 버튼 */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || loading === plan.id}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: isCurrent ? "default" : "pointer",
                  background: isCurrent ? C.faint : isStarter ? `linear-gradient(135deg,${C.indigo},${C.purple})` : plan.id === "pro" ? `linear-gradient(135deg,${C.amber},${C.gold})` : C.border,
                  color: isCurrent ? C.muted : "#fff", fontWeight: 800, fontSize: 14,
                  opacity: loading && loading !== plan.id ? 0.5 : 1,
                  transition: "all .15s",
                }}
              >
                {loading === plan.id ? "처리 중..." : isCurrent ? "현재 플랜" : plan.price === 0 ? "무료로 시작" : "업그레이드"}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div style={{ marginTop: 56, borderTop: `1px solid ${C.border}`, paddingTop: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 24 }}>자주 묻는 질문</h2>
        {[
          { q: "언제든지 취소할 수 있나요?", a: "네, 구독은 언제든지 취소 가능합니다. 취소 시 현재 결제 기간 종료일까지 서비스가 유지됩니다." },
          { q: "결제는 어떻게 이루어지나요?", a: "Toss Payments를 통한 카드 자동 결제입니다. 매월 구독 시작일에 자동으로 청구됩니다." },
          { q: "무료 플랜에서 업그레이드 시 데이터는 유지되나요?", a: "네, 모든 데이터는 그대로 유지됩니다." },
          { q: "세금계산서 발행이 가능한가요?", a: "스타터·프로 플랜은 요청 시 세금계산서를 발행해드립니다. 설정 > 고객지원으로 문의해주세요." },
        ].map((faq) => (
          <div key={faq.q} style={{ marginBottom: 20, padding: "18px 20px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 6 }}>Q. {faq.q}</p>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>A. {faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Toss Payments SDK 동적 로드
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
