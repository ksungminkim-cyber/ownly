"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import { track } from "../lib/track";
import { toast } from "./shared";
import { EARLY_ACCESS_FREE, EARLY_ACCESS_END_LABEL, EARLY_ACCESS_PERK } from "../lib/constants";

// 대시보드 상단 플랜 배너
// - 얼리 액세스 기간: "프로 기능 무료 이용 중 · 종료 예정일 · 얼리 혜택" + 관심 등록(지불 의사 측정)
// - 정식 과금 후: 체험(trial) 유저에게 D-N 카운트다운
export default function TrialBanner() {
  return EARLY_ACCESS_FREE ? <EarlyAccessBar /> : <TrialCountdown />;
}

const DISMISS_KEY = "ownly_ea_bar_dismissed";

function EarlyAccessBar() {
  const { user } = useApp();
  const [state, setState] = useState("idle"); // idle | saving | done
  const [hidden, setHidden] = useState(() => {
    try {
      const v = localStorage.getItem(DISMISS_KEY);
      return v ? Date.now() - Number(v) < 7 * 86400000 : false;
    } catch { return false; }
  });

  // 이미 관심 등록한 유저는 완료 상태로 표시
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("billing_waitlist").select("status").eq("user_id", user.id).maybeSingle();
      if (!cancelled && data) setState("done");
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (hidden) return null;

  const register = async () => {
    if (!user?.id || state !== "idle") return;
    setState("saving");
    const { error } = await supabase.from("billing_waitlist").upsert({
      user_id: user.id, email: user.email || null, plan: "plus", cycle: "monthly", pg: "kakao", status: "waiting",
    }, { onConflict: "user_id" });
    if (error) { toast("등록 실패: " + error.message, "error"); setState("idle"); return; }
    track("interest_registered", { plan: "plus" });
    setState("done");
    toast("관심 등록 완료 — 정식 출시 시 얼리 가입자 혜택과 함께 가장 먼저 안내드릴게요");
  };

  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {} setHidden(true); };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 14, borderRadius: 12, background: "var(--accent-light, rgba(79,70,229,0.06))", border: "1px solid var(--accent-border, rgba(79,70,229,0.18))" }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          얼리 액세스 · 프로 기능 전체를 무료로 이용 중
          <span style={{ fontWeight: 600, color: "var(--text-muted)" }}> · {EARLY_ACCESS_END_LABEL}까지</span>
        </p>
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 0", lineHeight: 1.6 }}>
          얼리 가입자 혜택: <b style={{ color: "var(--text)" }}>{EARLY_ACCESS_PERK}</b> · 유료 전환 30일 전 이메일로 안내
        </p>
      </div>
      {state === "done" ? (
        <span className="chip chip-success" style={{ whiteSpace: "nowrap" }}>관심 등록 완료 ✓</span>
      ) : (
        <button onClick={register} disabled={state === "saving"} className="btn btn-accent btn-sm" style={{ whiteSpace: "nowrap" }}>
          {state === "saving" ? "등록 중…" : "정식 출시 후에도 계속 쓰기"}
        </button>
      )}
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
