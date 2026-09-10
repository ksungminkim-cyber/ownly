"use client";
import { useApp } from "../context/AppContext";
import { C, PLANS, PAID_PLAN_ID } from "../lib/constants";

const FEATURE_LABELS = {
  reports:       "수익 리포트",
  tax:           "세금 시뮬레이터",
  certified:     "내용증명",
  vacancy:       "공실 관리",
  export:        "PDF 내보내기",
  globalReports: "글로벌 부동산 리포트",
};

// 사용법: <PlanGate feature="reports"> ... 콘텐츠 ... </PlanGate>
// 앱 경로: src/components/PlanGate.js
export default function PlanGate({ feature, children }) {
  const { canUse, userPlan, planLoading } = useApp();

  if (planLoading) return null;
  if (canUse(feature)) return children;

  const label = FEATURE_LABELS[feature] || "이 기능";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "62vh", gap: 20, padding: 40,
    }}>
      {/* 아이콘 박스 */}
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: `linear-gradient(135deg, ${C.indigo}22, ${C.purple}22)`,
        border: `1.5px solid ${C.indigo}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36,
      }}>
        🔒
      </div>

      {/* 텍스트 */}
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <p style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
          {label}은 플러스 플랜 기능이에요
        </p>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>
          플러스 플랜(월 {PLANS[PAID_PLAN_ID].price.toLocaleString()}원)에서 모든 기능을<br />
          제한 없이 사용할 수 있어요. 언제든 해지 가능합니다.
        </p>
      </div>

      {/* 업그레이드 버튼 */}
      <a
        href="/dashboard/pricing"
        style={{
          display: "inline-block",
          padding: "13px 32px",
          borderRadius: 14,
          background: `linear-gradient(135deg, ${C.indigo}, ${C.purple})`,
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
          boxShadow: `0 8px 32px ${C.indigo}44`,
          marginTop: 4,
        }}
      >
        플러스 시작하기 →
      </a>

      <p style={{ color: C.muted, fontSize: 12 }}>
        현재 플랜:{" "}
        <strong style={{ color: C.text }}>
          {userPlan === "free" ? "무료" : "플러스"}
        </strong>
      </p>
    </div>
  );
}
