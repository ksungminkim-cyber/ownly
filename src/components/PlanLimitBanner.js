"use client";
import { useRouter } from "next/navigation";

// 플랜 한도 진행률 배너 — 한도 가까울 때 부드러운 업그레이드 프롬프트
// used / limit 기준 75%+ 에서 노란색, 100% 도달 시 빨간색 + 업그레이드 CTA

export default function PlanLimitBanner({ used, limit, featureLabel, currentPlan }) {
  const router = useRouter();

  if (!limit || limit === Infinity || used < Math.floor(limit * 0.75)) return null;

  const remaining = Math.max(0, limit - used);
  const pct = Math.min(100, (used / limit) * 100);
  const atLimit = used >= limit;
  const color = atLimit ? "#e8445a" : "#e8960a";
  const bg = atLimit ? "rgba(232,68,90,0.05)" : "rgba(232,150,10,0.05)";
  const nextPlan = currentPlan === "free" ? "플러스" : "프로";

  return (
    <div style={{ background: bg, border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 11, padding: "12px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: ".5px" }}>
              {atLimit ? "⚠️ 한도 도달" : "⚡ 한도 임박"}
            </span>
            <span style={{ fontSize: 11, color: "#1a2744", fontWeight: 700 }}>
              {featureLabel} {used}/{limit}
              {!atLimit && <span style={{ color: "#8a8a9a", marginLeft: 4 }}>· 남은 슬롯 {remaining}개</span>}
            </span>
          </div>
          <div style={{ height: 5, background: "#f0efe9", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width .4s" }} />
          </div>
          <p style={{ fontSize: 11, color: "#6a6a7a", lineHeight: 1.6 }}>
            {atLimit
              ? `더 추가하려면 ${nextPlan} 플랜으로 업그레이드하세요. 기존 데이터는 그대로 유지됩니다.`
              : `${nextPlan} 플랜으로 업그레이드하면 무제한 등록 가능해요.`}
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/pricing")}
          style={{ padding: "9px 18px", borderRadius: 9, background: atLimit ? color : `linear-gradient(135deg,#5b4fcf,#7c3aed)`, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          {atLimit ? "업그레이드 →" : `${nextPlan} 살펴보기 →`}
        </button>
      </div>
    </div>
  );
}
