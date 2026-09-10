"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { track } from "../lib/track";
import { PLANS, PAID_PLAN_ID, LEGACY_FREE_UNTIL_LABEL, LEGACY_LIMITS } from "../lib/constants";

// 대시보드 상단 플랜 배너
// - 체험(trial) 중: D-N 카운트다운
// - 기존 가입자(2026-09-10 이전) 무료 이용 중: 종료일 + 플러스 구독 CTA (7일 숨김 가능)
// - 그 외(무료·유료 구독): 표시 없음
export default function TrialBanner() {
  const { isLegacyFree, subscription, planLoading } = useApp();
  if (planLoading) return null; // 구독 정보 로딩 전엔 잘못된 배너가 잠깐 보이는 깜빡임 방지
  if (subscription?.status === "trial") return <TrialCountdown subscription={subscription} />;
  if (isLegacyFree) return <LegacyBar />;
  return null;
}

const DISMISS_KEY = "ownly_legacy_bar_dismissed";
const plus = PLANS[PAID_PLAN_ID];

function LegacyBar() {
  const router = useRouter();
  const [hidden, setHidden] = useState(() => {
    try {
      const v = localStorage.getItem(DISMISS_KEY);
      return v ? Date.now() - Number(v) < 7 * 86400000 : false;
    } catch { return false; }
  });
  if (hidden) return null;

  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {} setHidden(true); };
  const goPlus = () => { track("upsell_click", { from: "dashboard_bar" }); router.push(`/dashboard/checkout/${PAID_PLAN_ID}`); };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 14, borderRadius: 12, background: "var(--accent-light, rgba(79,70,229,0.06))", border: "1px solid var(--accent-border, rgba(79,70,229,0.18))" }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          기존 가입자 혜택 · 플러스 기능을 무료로 이용 중
          <span style={{ fontWeight: 600, color: "var(--text-muted)" }}> · {LEGACY_FREE_UNTIL_LABEL}까지</span>
        </p>
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 0", lineHeight: 1.6 }}>
          내용증명 월 {LEGACY_LIMITS.certified}건 · 알림톡 월 {LEGACY_LIMITS.kakaoMonthly}건 · AI 분석 월 {LEGACY_LIMITS.aiPricing}회 한도. 플러스 구독(월 {plus.price.toLocaleString()}원)은 내용증명 무제한 · 알림톡 월 {plus.limits.kakaoMonthly}건 · AI 월 {plus.limits.aiPricing}회
        </p>
      </div>
      <button onClick={goPlus} className="btn btn-accent btn-sm" style={{ whiteSpace: "nowrap" }}>
        플러스 시작 →
      </button>
      <button onClick={dismiss} aria-label="7일간 숨기기" style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
    </div>
  );
}

function TrialCountdown({ subscription }) {
  const router = useRouter();
  if (!subscription.current_period_end) return null;

  const end = new Date(subscription.current_period_end);
  const days = Math.ceil((end - new Date()) / 86400000);
  if (days <= 0) return null;

  const urgent = days <= 3;

  return (
    <div style={{ background: urgent ? "linear-gradient(135deg,#e8960a,#e8445a)" : "linear-gradient(135deg,#5b4fcf,#7c3aed)", color: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 4px 16px rgba(91,79,207,0.2)" }}>
      <span style={{ fontSize: 22 }}>{urgent ? "⏰" : "🎁"}</span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>
          {urgent ? `플러스 체험 종료까지 D-${days}` : `플러스 체험 중 · D-${days}`}
        </p>
        <p style={{ fontSize: 11, opacity: .85, lineHeight: 1.5 }}>
          {urgent
            ? `체험이 끝나면 무료 플랜으로 전환됩니다. 계속 쓰시려면 월 ${plus.price.toLocaleString()}원으로 구독하세요.`
            : "플러스 플랜의 모든 기능을 체험 중입니다. 만족스러우면 그대로 구독하세요."}
        </p>
      </div>
      <button onClick={() => router.push(`/dashboard/checkout/${PAID_PLAN_ID}`)}
        style={{ padding: "8px 16px", borderRadius: 9, background: "#fff", color: urgent ? "#e8445a" : "#5b4fcf", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
        {urgent ? "지금 구독하기 →" : "플러스 구독 →"}
      </button>
    </div>
  );
}
