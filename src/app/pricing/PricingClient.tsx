"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS, PAID_PLAN_ID, PLAN_COMPARE, fmtLimit, FREE_TAGLINE } from "../../lib/constants";

// 공개 요금제 — 무료 / 플러스(월 9,900원). 카드·비교표·FAQ 의 숫자는 전부 PLANS 에서 읽는다 (대시보드 요금제와 동일 출처).
const plus = PLANS[PAID_PLAN_ID];
const SIGNUP = "/login?mode=signup&next=%2Fdashboard";

const CARDS = [
  {
    id: "free",
    name: PLANS.free.name,
    price: 0,
    description: PLANS.free.tagline,
    cta: "무료로 시작",
    ctaHref: SIGNUP,
    features: PLANS.free.features.map((f) => ({ text: f.t, included: f.ok })),
  },
  {
    id: PAID_PLAN_ID,
    name: plus.name,
    badge: plus.badge,
    price: plus.price,
    description: plus.tagline,
    cta: "무료로 시작 후 업그레이드 →",
    ctaHref: SIGNUP,
    features: plus.features.map((f) => ({ text: f.t, included: f.ok })),
  },
];

const FAQ = [
  {
    q: "무료 플랜은 정말 계속 무료인가요?",
    a: `네. 물건 ${PLANS.free.limits.properties}개·세입자 ${PLANS.free.limits.tenants}명까지는 기간 제한 없이 무료이고, 신용카드 등록도 필요 없습니다.`,
  },
  {
    q: "플러스는 무엇이 달라지나요?",
    a: `물건·세입자 무제한, 내용증명 정식 발급 무제한, 카카오 알림톡 월 ${plus.limits.kakaoMonthly}건, AI 임대료 분석 월 ${plus.limits.aiPricing}회, 세금 시뮬레이터·수익 분석·공실 관리·주변 매물 조회·PDF 내보내기까지 전부 열립니다. 월 ${plus.price.toLocaleString()}원 하나로 추가 요금은 없습니다.`,
  },
  {
    q: "결제는 어떻게 하나요?",
    a: "카카오페이 정기결제입니다. 카카오톡 간편결제로 한 번 등록하면 매월 같은 날짜에 자동 청구되고, 카드번호는 온리에 저장되지 않습니다.",
  },
  {
    q: "언제든지 해지할 수 있나요?",
    a: "네. 설정 → 결제 관리에서 언제든 해지할 수 있습니다. 해지해도 이미 결제한 기간이 끝날 때까지 기능이 유지되고, 이후 자동으로 무료 플랜으로 전환되며 데이터는 그대로 남습니다.",
  },
  {
    q: "카카오 알림톡은 어떻게 작동하나요?",
    a: "플러스의 카카오 수금 알림 화면에서 세입자를 선택하면 미납·납부 안내가 카카오 알림톡으로 발송됩니다. 발송 이력은 세입자별로 남습니다.",
  },
  {
    q: "세금계산서 발행이 필요합니다.",
    a: "법인·개인사업자 모두 결제 후 설정 → 결제 관리에서 요청하시면 발행해 드립니다. 다수 계정·연간 계약은 inquiry@mclean21.com 으로 문의해 주세요.",
  },
];

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

export default function PricingClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary, #faf9f7)",
        fontFamily: "'Noto Sans KR', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "var(--text-primary, #1a1a1a)",
      }}
    >
      {/* 상단 네비 */}
      <nav style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color, #e8e4de)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit", fontSize: "14px", opacity: 0.6 }}>
          ← 홈으로
        </Link>
      </nav>

      {/* 히어로 */}
      <section style={{ textAlign: "center", padding: "60px 24px 36px", maxWidth: "800px", margin: "0 auto" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", color: "#6366f1", textTransform: "uppercase", marginBottom: "16px" }}>PRICING</p>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 800, lineHeight: 1.2, marginBottom: "16px", letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
          무료로 시작, 필요할 때 플러스
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-secondary, #666)", marginBottom: "8px", wordBreak: "keep-all" }}>{FREE_TAGLINE}</p>
        <p style={{ fontSize: "13px", color: "var(--text-secondary, #888)", wordBreak: "keep-all" }}>유료 플랜은 하나뿐입니다. 카카오페이 정기결제 · VAT 포함 · 언제든 해지</p>
      </section>

      {/* 플랜 카드 */}
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "0 16px 56px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", alignItems: "stretch" }}>
        {CARDS.map((plan) => {
          const isPrimary = plan.id === PAID_PLAN_ID;
          return (
            <div
              key={plan.id}
              style={{
                background: isPrimary ? "#fff" : "var(--bg-secondary, #f5f2ee)",
                border: isPrimary ? "2px solid #6366f1" : "1.5px solid var(--border-color, #e8e4de)",
                borderRadius: "20px",
                padding: "28px 24px",
                position: "relative",
                boxShadow: isPrimary ? "0 8px 32px rgba(99,102,241,0.15)" : "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {plan.badge && (
                <span style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#6366f1", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "100px", whiteSpace: "nowrap" }}>
                  {plan.badge}
                </span>
              )}

              <span style={{ fontSize: "13px", fontWeight: 700, color: isPrimary ? "#6366f1" : "var(--text-secondary, #888)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                {plan.name}
              </span>

              <div style={{ marginBottom: "8px", display: "flex", alignItems: "baseline", gap: "4px" }}>
                {plan.price === 0 ? (
                  <span style={{ fontSize: "36px", fontWeight: 800 }}>무료</span>
                ) : (
                  <>
                    <span style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em" }}>₩{formatPrice(plan.price)}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary, #888)" }}>/월</span>
                  </>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary, #888)", marginBottom: "20px" }}>
                {plan.price === 0 ? "기간 제한 없음 · 카드 등록 불필요" : "월 구독 · VAT 포함 · 언제든 해지"}
              </p>

              <p style={{ fontSize: "13px", color: "var(--text-secondary, #666)", marginBottom: "24px", lineHeight: 1.5, wordBreak: "keep-all" }}>{plan.description}</p>

              <Link
                href={plan.ctaHref}
                style={{
                  display: "block", width: "100%", padding: "13px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "14px", textDecoration: "none", marginBottom: "24px",
                  border: isPrimary ? "none" : "1.5px solid var(--border-color, #d4cfc8)",
                  background: isPrimary ? "linear-gradient(135deg, #6366f1, #a855f7)" : "transparent",
                  color: isPrimary ? "#fff" : "var(--text-primary, #1a1a1a)",
                  boxShadow: isPrimary ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
                }}
              >
                {plan.cta}
              </Link>

              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "7px 0", fontSize: "13px", color: f.included ? "var(--text-primary, #1a1a1a)" : "var(--text-secondary, #bbb)", borderBottom: i < plan.features.length - 1 ? "1px solid var(--border-color, #f0ede8)" : "none", wordBreak: "keep-all" }}>
                    <span style={{ flexShrink: 0, color: f.included ? "#22c55e" : "#d1d5db", marginTop: "1px" }}>{f.included ? "✓" : "✗"}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* 기능 비교표 */}
      <section style={{ maxWidth: "760px", margin: "0 auto 60px", padding: "0 16px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "6px", textAlign: "center" }}>플랜별 기능 비교</h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary, #888)", textAlign: "center", marginBottom: "20px" }}>어디까지 무료이고 무엇이 플러스에서 열리는지 한눈에</p>
        <div style={{ background: "#fff", border: "1.5px solid var(--border-color, #e8e4de)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr", borderBottom: "2px solid var(--border-color, #e8e4de)", background: "var(--bg-secondary, #f5f2ee)" }}>
            <div style={{ padding: "12px 18px", fontSize: "11px", color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>기능</div>
            <div style={{ padding: "12px 4px", textAlign: "center", fontSize: "13px", fontWeight: 800, color: "#666" }}>{PLANS.free.name}</div>
            <div style={{ padding: "12px 4px", textAlign: "center", fontSize: "13px", fontWeight: 800, color: "#6366f1" }}>{plus.name}</div>
          </div>
          {PLAN_COMPARE.map((row, i) => (
            <div key={row.key} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr", borderBottom: i < PLAN_COMPARE.length - 1 ? "1px solid var(--border-color, #f0ede8)" : "none" }}>
              <div style={{ padding: "11px 18px", fontSize: "13px", fontWeight: 600, wordBreak: "keep-all" }}>{row.label}</div>
              {[PLANS.free, plus].map((p) => {
                const v = fmtLimit((p.limits as Record<string, number | boolean>)[row.key], row.unit);
                return (
                  <div key={p.id} style={{ padding: "11px 4px", textAlign: "center", fontSize: "13px", wordBreak: "keep-all" }}>
                    {v === true ? <span style={{ color: "#22c55e", fontWeight: 800 }}>✓</span>
                      : v === false ? <span style={{ color: "#d1d5db" }}>—</span>
                      : <span style={{ fontWeight: 700 }}>{v}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* 기업 문의 */}
      <section style={{ maxWidth: "800px", margin: "0 auto 60px", padding: "0 16px" }}>
        <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", borderRadius: "20px", padding: "36px 32px", textAlign: "center", color: "#fff" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px", opacity: 0.8 }}>ENTERPRISE</p>
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "12px", lineHeight: 1.3, wordBreak: "keep-all" }}>
            법인·공인중개사·자산관리사 대상<br />별도 문의
          </h2>
          <p style={{ fontSize: "14px", opacity: 0.85, marginBottom: "24px", lineHeight: 1.6, wordBreak: "keep-all" }}>
            다수 물건 보유 법인 · 공인중개사 사무소 · 자산관리회사<br />세금계산서 발행 · 연간 계약 · 팀 계정 협의 가능
          </p>
          <a href="mailto:inquiry@mclean21.com" style={{ display: "inline-block", padding: "12px 28px", background: "#fff", color: "#6366f1", borderRadius: "100px", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>
            영업팀에 문의하기 →
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: "680px", margin: "0 auto 80px", padding: "0 16px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "24px", textAlign: "center" }}>자주 묻는 질문</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ background: "var(--bg-secondary, #f5f2ee)", borderRadius: "14px", overflow: "hidden", border: "1.5px solid var(--border-color, #e8e4de)" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary, #1a1a1a)", fontFamily: "inherit" }}
              >
                {item.q}
                <span style={{ flexShrink: 0, fontSize: "18px", color: "#6366f1", transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "14px 20px 18px", fontSize: "13px", color: "var(--text-secondary, #666)", lineHeight: 1.7, borderTop: "1px solid var(--border-color, #e8e4de)", wordBreak: "keep-all" }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 하단 CTA */}
      <section style={{ textAlign: "center", padding: "0 24px 100px" }}>
        <p style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>지금 바로 시작해보세요</p>
        <p style={{ fontSize: "14px", color: "var(--text-secondary, #888)", marginBottom: "24px" }}>무료 플랜으로 시작, 필요할 때 플러스로</p>
        <Link href={SIGNUP} style={{ display: "inline-block", padding: "14px 36px", background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#fff", borderRadius: "100px", fontWeight: 700, fontSize: "15px", textDecoration: "none", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
          무료로 온리 시작하기 →
        </Link>
        <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-secondary, #aaa)" }}>신용카드 불필요 · 언제든 해지 가능</p>
      </section>
    </main>
  );
}
