"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { track } from "../lib/track";
import { EARLY_ACCESS_FREE, EARLY_ACCESS_END_LABEL, EARLY_SUPPORTER } from "../lib/constants";

// 대시보드 상단 플랜 배너
// - 얼리 액세스 기간: "프로 기능 무료 이용 중 · 종료 예정일" + 얼리 서포터 구독 CTA (기존 카카오페이 정기결제)
//   이미 서포터면 가격 고정 만료일 표시
// - 정식 과금 후: 체험(trial) 유저에게 D-N 카운트다운
export default function TrialBanner() {
  return EARLY_ACCESS_FREE ? <EarlyAccessBar /> : <TrialCountdown />;
}

const DISMISS_KEY = "ownly_ea_bar_dismissed";

function EarlyAccessBar() {
  const router = useRouter();
  const { isSupporter, subscription } = useApp();
  const [hidden, setHidden] = useState(() => {
    try {
      const v = localStorage.getItem(DISMISS_KEY);
      return v ? Date.now() - Number(v) < 7 * 86400000 : false;
    } catch { return false; }
  });

  if (hidden) return null;

  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {} setHidden(true); };
  const goSupporter = () => { track("upsell_click", { from: "dashboard_bar" }); router.push(`/dashboard/checkout/${EARLY_SUPPORTER.planId}`); };
  const lockedUntil = subscription?.price_locked_until ? new Date(subscription.price_locked_until).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : null;

  if (isSupporter) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 14, borderRadius: 12, background: "rgba(15,165,115,0.06)", border: "1px solid rgba(15,165,115,0.2)" }}>
        <span className="chip chip-success" style={{ whiteSpace: "nowrap" }}>얼리 서포터 ✓</span>
        <p style={{ flex: 1, minWidth: 220, fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          내용증명 무제한 · 알림톡 월 {EARLY_SUPPORTER.kakaoMonthly}건 · AI 분석 월 {EARLY_SUPPORTER.aiMonthly}회
          {lockedUntil && <> · 월 {(subscription?.monthly_amount || EARLY_SUPPORTER.price).toLocaleString()}원 가격 고정 <b style={{ color: "var(--text)" }}>{lockedUntil}</b>까지</>}
        </p>
        <button onClick={dismiss} aria-label="7일간 숨기기" style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 14, borderRadius: 12, background: "var(--accent-light, rgba(79,70,229,0.06))", border: "1px solid var(--accent-border, rgba(79,70,229,0.18))" }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          얼리 액세스 · 프로 기능 전체를 무료로 이용 중
          <span style={{ fontWeight: 600, color: "var(--text-muted)" }}> · {EARLY_ACCESS_END_LABEL}까지</span>
        </p>
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 0", lineHeight: 1.6 }}>
          얼리 서포터: 플러스 플랜을 <s>월 {EARLY_SUPPORTER.listPrice.toLocaleString()}원</s> <b style={{ color: "var(--text)" }}>월 {EARLY_SUPPORTER.price.toLocaleString()}원</b>에 {EARLY_SUPPORTER.lockMonths}개월 고정 · 내용증명 무제한 · 알림톡 월 {EARLY_SUPPORTER.kakaoMonthly}건
        </p>
      </div>
      <button onClick={goSupporter} className="btn btn-accent btn-sm" style={{ whiteSpace: "nowrap" }}>
        얼리 서포터 시작 →
      </button>
      <button onClick={dismiss} aria-label="7일간 숨기기" style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
    </div>
  );
}

function TrialCountdown() {
  const router = useRouter();
  const { subscription } = useApp();

  if (!subscription || subscription.status !== "trial") return null;
  if (!subscription.current_period_end) return null;

  const end = new Date(subscription.current_period_end);
  const now = new Date();
  const days = Math.ceil((end - now) / 86400000);
  if (days <= 0) return null;

  const urgent = days <= 3;

  return (
    <div style={{ background: urgent ? "linear-gradient(135deg,#e8960a,#e8445a)" : "linear-gradient(135deg,#5b4fcf,#7c3aed)", color: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 4px 16px rgba(91,79,207,0.2)" }}>
      <span style={{ fontSize: 22 }}>{urgent ? "⏰" : "🎁"}</span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>
          {urgent ? `체험 종료까지 D-${days}` : `무료 체험 중 · D-${days}`}
        </p>
        <p style={{ fontSize: 11, opacity: .85, lineHeight: 1.5 }}>
          {urgent
            ? "지금 구독하지 않으면 무료 플랜으로 전환됩니다. 모든 프리미엄 기능을 계속 이용하려면 업그레이드하세요."
            : "플러스 플랜의 모든 기능을 무료로 사용 중이에요. 만족스러우면 그대로 구독하세요."}
        </p>
      </div>
      <button onClick={() => router.push("/dashboard/pricing")}
        style={{ padding: "8px 16px", borderRadius: 9, background: "#fff", color: urgent ? "#e8445a" : "#5b4fcf", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
        {urgent ? "지금 구독하기 →" : "플랜 보기 →"}
      </button>
    </div>
  );
}
