"use client";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";

// 무료 체험 D-N 배너 — trial 상태 유저에게만 노출
export default function TrialBanner() {
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
