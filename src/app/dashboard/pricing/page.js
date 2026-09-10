"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PLANS, PAID_PLAN_ID, PLAN_COMPARE, fmtLimit, LEGACY_FREE_UNTIL_LABEL, LEGACY_LIMITS } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import DotText from "../../../components/DotText";

// 요금제 — 무료 / 플러스(월 9,900원) 두 가지. 카드·비교표·FAQ 의 숫자는 전부 PLANS 에서 읽는다 (공개 /pricing 과 동일 출처).
const plus = PLANS[PAID_PLAN_ID];
const planList = [PLANS.free, plus];

const FAQS = [
  { q: "언제든지 해지할 수 있나요?", a: "네. 설정 → 결제 관리에서 언제든 해지할 수 있고, 해지해도 이미 결제한 기간이 끝날 때까지 플러스 기능이 유지됩니다. 이후 자동으로 무료 플랜으로 전환되며 데이터는 그대로 남습니다." },
  { q: "결제는 어떻게 이루어지나요?", a: `카카오페이 정기결제입니다. 카카오톡 간편결제로 한 번 등록하면 매월 같은 날짜에 ${plus.price.toLocaleString()}원이 자동 청구됩니다. 카드번호는 온리에 저장되지 않습니다.` },
  { q: "무료 플랜은 계속 무료인가요?", a: `네. 물건 ${PLANS.free.limits.properties}개·세입자 ${PLANS.free.limits.tenants}명까지는 기간 제한 없이 무료이고 카드 등록도 필요 없습니다.` },
  { q: "무료 플랜에서 물건 수가 한도를 넘으면?", a: "이미 등록한 물건과 데이터는 그대로 유지되고, 새 물건만 추가할 수 없게 됩니다. 플러스로 전환하면 바로 이어서 등록할 수 있습니다." },
  { q: "2026년 9월 10일 이전에 가입했는데 어떻게 되나요?", a: `그 전에 가입한 계정은 안내드린 대로 ${LEGACY_FREE_UNTIL_LABEL}까지 플러스 기능을 무료로 쓰실 수 있습니다 (내용증명 월 ${LEGACY_LIMITS.certified}건·알림톡 월 ${LEGACY_LIMITS.kakaoMonthly}건·AI 분석 월 ${LEGACY_LIMITS.aiPricing}회 한도). 그 이후에는 무료 플랜으로 전환되며, 계속 쓰시려면 플러스를 구독하시면 됩니다.` },
  { q: "세금계산서 발행이 가능한가요?", a: "네. 법인·개인사업자 모두 결제 후 설정 → 결제 관리에서 요청하시면 발행해 드립니다." },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, userPlan, paidPlan, subscription, isLegacyFree, planLoading } = useApp();
  const [faqOpen, setFaqOpen] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isPaid = paidPlan === PAID_PLAN_ID;
  const isTrial = !isPaid && subscription?.status === "trial" && subscription?.current_period_end && new Date(subscription.current_period_end) > new Date();
  const trialDays = isTrial ? Math.max(0, Math.ceil((new Date(subscription.current_period_end) - new Date()) / 86400000)) : 0;
  // 결제 없이 플러스가 열려 있는 계정 (관리자 수동 부여) — 사이드바 "플러스 플랜" 표시와 어긋나지 않게 이용 중으로 취급
  const grantedPlus = !isPaid && !isTrial && !isLegacyFree && userPlan === PAID_PLAN_ID;

  const goCheckout = () => {
    if (!user) { router.push(`/login?mode=signup&next=/dashboard/checkout/${PAID_PLAN_ID}`); return; }
    router.push(`/dashboard/checkout/${PAID_PLAN_ID}`);
  };

  // 현재 상태 한 줄 — 유저가 "지금 내가 어떤 상태인지"를 한 번에 알 수 있게
  const statusNote = planLoading ? null
    : isPaid ? { tone: "ok", text: "플러스 구독 중입니다. 해지·결제 이력은 설정 → 결제 관리에서 확인하세요." }
    : isTrial ? { tone: "info", text: `플러스 체험 중 (D-${trialDays}). 체험이 끝나면 무료 플랜으로 전환됩니다.` }
    : grantedPlus ? { tone: "ok", text: "플러스 기능이 열려 있는 계정입니다 (운영자 부여). 결제 정보는 등록되어 있지 않습니다." }
    : isLegacyFree ? { tone: "info", text: `기존 가입자 혜택으로 ${LEGACY_FREE_UNTIL_LABEL}까지 플러스 기능을 무료로 쓰고 계십니다 (내용증명 월 ${LEGACY_LIMITS.certified}건·알림톡 월 ${LEGACY_LIMITS.kakaoMonthly}건·AI 월 ${LEGACY_LIMITS.aiPricing}회 한도). 지금 구독하면 한도가 바로 플러스 기준으로 늘어납니다.` }
    : null;

  const btnFor = (plan) => {
    if (plan.id === "free") {
      if (isPaid) return { label: "해지는 결제 관리에서", onClick: () => router.push("/dashboard/billing"), muted: true };
      if (grantedPlus) return { label: "기본 플랜", disabled: true };
      return { label: "✓ 현재 플랜", disabled: true };
    }
    if (isPaid) return { label: "✓ 구독 중", disabled: true };
    if (grantedPlus) return { label: "✓ 이용 중", disabled: true };
    return { label: isTrial ? "체험 후 계속 쓰기 →" : "플러스 시작하기 →", onClick: goCheckout };
  };

  return (
    <div style={{ fontFamily: "'Pretendard','DM Sans',sans-serif", maxWidth: 900, margin: "0 auto", padding: isMobile ? "24px 16px 80px" : "36px 24px 60px", overflowX: "hidden", boxSizing: "border-box" }}>
      {/* 헤더 */}
      <div style={{ textAlign: "center", marginBottom: isMobile ? 24 : 36 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>PRICING</p>
        <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 900, color: "var(--text)", lineHeight: 1.2, margin: "0 0 10px", wordBreak: "keep-all" }}>무료로 시작, 필요할 때 플러스</h1>
        <p style={{ color: "#8a8a9a", fontSize: 13 }}>유료 플랜은 하나뿐입니다. <DotText text={`월 ${plus.price.toLocaleString()}원 · 카카오페이 정기결제 · 언제든 해지`} /></p>
        {statusNote && (
          <div style={{ maxWidth: 620, margin: "16px auto 0", background: statusNote.tone === "ok" ? "rgba(15,165,115,0.07)" : "rgba(79,70,229,0.06)", border: `1px solid ${statusNote.tone === "ok" ? "rgba(15,165,115,0.3)" : "rgba(79,70,229,0.2)"}`, borderRadius: 12, padding: "11px 16px", fontSize: 12.5, color: "var(--text)", lineHeight: 1.7, textAlign: "left", wordBreak: "keep-all" }}>
            {statusNote.text}
          </div>
        )}
      </div>

      {/* 플랜 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 720, margin: "0 auto 44px", alignItems: "stretch" }}>
        {planList.map((plan) => {
          const isPlus = plan.id === PAID_PLAN_ID;
          const accent = isPlus ? "#4f46e5" : "#8a8a9a";
          const btn = btnFor(plan);
          return (
            <div key={plan.id} style={{ background: "var(--surface)", border: `1.5px solid ${isPlus ? "#c4c1fa" : "var(--border)"}`, borderRadius: 20, padding: isMobile ? "24px 18px 20px" : "28px 22px 22px", position: "relative", display: "flex", flexDirection: "column", boxShadow: isPlus ? "0 8px 32px rgba(79,70,229,0.14)" : "0 2px 10px rgba(26,39,68,0.04)" }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>{plan.badge}</div>
              )}
              <div style={{ fontSize: 26, marginBottom: 6 }}>{plan.emoji}</div>
              <p style={{ fontSize: 13, fontWeight: 900, color: accent, margin: 0, letterSpacing: "1px" }}>{plan.name.toUpperCase()}</p>
              <p style={{ fontSize: 11.5, color: "#8a8a9a", marginTop: 4, lineHeight: 1.4, wordBreak: "keep-all" }}>{plan.tagline}</p>
              <div style={{ margin: "14px 0 18px", paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                {plan.price === 0 ? (
                  <>
                    <span style={{ fontSize: 30, fontWeight: 900, color: "var(--text)" }}>무료</span>
                    <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 4 }}><DotText text="기간 제한 없음 · 카드 등록 불필요" /></p>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a" }}>₩</span>
                      <span style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", letterSpacing: "-1px" }}>{plan.price.toLocaleString()}</span>
                      <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>/월</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 4 }}><DotText text="VAT 포함 · 매월 자동 결제 · 언제든 해지" /></p>
                  </>
                )}
              </div>
              <div style={{ flex: 1, marginBottom: 18 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, flexShrink: 0, color: f.ok ? accent : "#d0d0d8" }}>{f.ok ? "✓" : "✗"}</span>
                    <span style={{ fontSize: 12.5, color: f.ok ? "var(--text)" : "#b0b0c0", fontWeight: f.ok ? 600 : 400, lineHeight: 1.45, wordBreak: "keep-all" }}>{f.t}</span>
                  </div>
                ))}
              </div>
              <button onClick={btn.onClick} disabled={btn.disabled || planLoading}
                style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: btn.disabled ? "default" : "pointer", fontWeight: 800, fontSize: 13,
                  background: btn.disabled || btn.muted ? "#f0efe9" : isPlus ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#f0efe9",
                  color: btn.disabled || btn.muted ? "#8a8a9a" : isPlus ? "#fff" : "#6a6a7a",
                  boxShadow: !btn.disabled && isPlus ? "0 8px 24px rgba(79,70,229,0.22)" : "none" }}>
                {btn.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* 기능 비교표 — PLAN_COMPARE(constants) 에서 한도를 읽어 렌더 */}
      <div style={{ maxWidth: 720, margin: "0 auto 44px" }}>
        <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "var(--text)", marginBottom: 6, textAlign: "center" }}>플랜별 기능 비교</h2>
        <p style={{ fontSize: 12.5, color: "#8a8a9a", textAlign: "center", marginBottom: 18 }}>어디까지 무료이고 무엇이 플러스에서 열리는지 한눈에</p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1.4fr 1fr 1fr" : "1.8fr 1fr 1fr", borderBottom: "2px solid var(--border)", background: "var(--surface2)" }}>
            <div style={{ padding: isMobile ? "10px 12px" : "14px 20px", fontSize: 10, color: "#a0a0b0", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>기능</div>
            {planList.map((p) => (
              <div key={p.id} style={{ padding: "10px 4px", textAlign: "center", fontSize: isMobile ? 11 : 12, fontWeight: 800, color: p.id === PAID_PLAN_ID ? "#4f46e5" : "#6a6a7a" }}>{p.name}</div>
            ))}
          </div>
          {PLAN_COMPARE.map((row, i) => (
            <div key={row.key} style={{ display: "grid", gridTemplateColumns: isMobile ? "1.4fr 1fr 1fr" : "1.8fr 1fr 1fr", borderBottom: i < PLAN_COMPARE.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)" }}>
              <div style={{ padding: isMobile ? "10px 12px" : "12px 20px", fontSize: isMobile ? 11.5 : 13, color: "var(--text)", fontWeight: 600, lineHeight: 1.35, wordBreak: "keep-all" }}>{row.label}</div>
              {planList.map((p) => {
                const v = fmtLimit(p.limits[row.key], row.unit);
                return (
                  <div key={p.id} style={{ padding: isMobile ? "10px 4px" : "12px 4px", textAlign: "center", fontSize: isMobile ? 11.5 : 13, wordBreak: "keep-all" }}>
                    {v === true ? <span style={{ color: "#0fa573", fontWeight: 800 }}>✓</span>
                      : v === false ? <span style={{ color: "#d0d0d8" }}>—</span>
                      : <span style={{ color: "var(--text)", fontWeight: 700 }}>{v}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: "0 auto 44px" }}>
        <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "var(--text)", marginBottom: 18, textAlign: "center" }}>자주 묻는 질문</h2>
        {FAQS.map((faq, i) => (
          <div key={i} onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ marginBottom: 10, background: "var(--surface)", borderRadius: 14, border: `1px solid ${faqOpen === i ? "#1a2744" : "var(--border)"}`, overflow: "hidden", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "14px 16px" : "16px 20px", gap: 12 }}>
              <p style={{ fontWeight: 700, color: "var(--text)", fontSize: isMobile ? 12 : 13, margin: 0, wordBreak: "keep-all" }}>Q. {faq.q}</p>
              <span style={{ fontSize: 14, color: "#8a8a9a", flexShrink: 0, transition: "transform .2s", transform: faqOpen === i ? "rotate(180deg)" : "none" }}>▾</span>
            </div>
            {faqOpen === i && (
              <div style={{ padding: isMobile ? "0 16px 14px" : "0 20px 16px" }}>
                <p style={{ color: "#6a6a7a", fontSize: isMobile ? 12 : 13, lineHeight: 1.7, margin: 0, wordBreak: "keep-all" }}>A. {faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 CTA */}
      <div style={{ textAlign: "center", padding: isMobile ? "24px 16px" : "32px", background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(79,70,229,0.05))", borderRadius: 20, border: "1px solid var(--border)" }}>
        <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "var(--text)", marginBottom: 8, wordBreak: "keep-all" }}>{isPaid ? "이용해 주셔서 감사합니다" : "아직 고민 중이신가요?"}</p>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 18, wordBreak: "keep-all" }}>{isPaid ? "필요한 기능이 있으면 inquiry@mclean21.com 으로 언제든 알려주세요." : "무료 플랜으로 먼저 써 보고, 한도가 부족해질 때 올리셔도 됩니다."}</p>
        <button onClick={() => router.push("/dashboard")} style={{ padding: "12px 28px", borderRadius: 12, background: "#1a2744", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>대시보드로 이동 →</button>
      </div>
    </div>
  );
}
