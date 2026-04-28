"use client";
import { useState } from "react";
import { calcPaymentRisk, RISK_CONFIG } from "../lib/paymentRisk";
import { getInitial } from "../lib/initial";

// 수금 위험 대시보드 위젯 — 주의/고위험 세입자 조기 경보
export default function PaymentRiskWidget({ tenants = [], payments = [], onNavigate }) {
  const [expanded, setExpanded] = useState(false);

  const scored = tenants
    .filter(t => t.status !== "공실")
    .map(t => ({ t, risk: calcPaymentRisk(t, payments) }))
    .filter(x => x.risk.level === "high" || x.risk.level === "critical")
    .sort((a, b) => b.risk.score - a.risk.score);

  if (scored.length === 0) return null;

  const critical = scored.filter(x => x.risk.level === "critical").length;
  const high = scored.filter(x => x.risk.level === "high").length;

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 14, marginBottom: 14, overflow: "hidden" }}>
      <div onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(232,68,90,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🔮</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 2 }}>
            이번 달 미납 주의 세입자 {scored.length}명
          </p>
          <p style={{ fontSize: 11, color: "#8a8a9a" }}>
            {critical > 0 && <><b style={{ color: "#e8445a" }}>고위험 {critical}명</b>{high > 0 && " · "}</>}
            {high > 0 && <>주의 {high}명</>}
            {" "}· 최근 6개월 패턴 기반 AI 예측
          </p>
        </div>
        <span style={{ fontSize: 12, color: "#8a8a9a", flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #f0efe9", padding: "10px 18px 14px" }}>
          {scored.slice(0, 5).map(({ t, risk }) => {
            const cfg = RISK_CONFIG[risk.level];
            return (
              <div key={t.id} onClick={() => onNavigate?.("/dashboard/payments")}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f4f3f0", cursor: "pointer" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: (t.color || "#1a2744") + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: t.color || "#1a2744", flexShrink: 0 }}>{getInitial(t.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>{t.name} <span style={{ fontSize: 10, color: "#a0a0b0", fontWeight: 400 }}>· {Number(t.rent).toLocaleString()}만</span></p>
                  <p style={{ fontSize: 10, color: "#8a8a9a", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{risk.reason}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, background: cfg.bg, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                  {cfg.label} {risk.score}
                </span>
              </div>
            );
          })}
          {scored.length > 5 && (
            <p style={{ fontSize: 11, color: "#a0a0b0", textAlign: "center", paddingTop: 8 }}>+ {scored.length - 5}명 더 보기</p>
          )}
          <button onClick={() => onNavigate?.("/dashboard/payments")}
            style={{ width: "100%", marginTop: 10, padding: "9px", borderRadius: 9, background: "rgba(232,68,90,0.06)", border: "1px solid rgba(232,68,90,0.2)", color: "#e8445a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            수금 페이지에서 선제 대응하기 →
          </button>
        </div>
      )}
    </div>
  );
}
