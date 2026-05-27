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

  // 위험 비율을 도넛으로 시각화 (전체 활성 세입자 대비)
  const totalActive = tenants.filter(t => t.status !== "공실").length;
  const riskPct = totalActive > 0 ? Math.round(((critical * 2 + high) / (totalActive * 2)) * 100) : 0;
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dashLen = Math.min(1, riskPct / 100) * circ;
  const ringColor = critical > 0 ? "#e8445a" : "#e8960a";

  return (
    <div className="surface-card" style={{ borderColor: "rgba(232,68,90,0.2)", marginBottom: 14, overflow: "hidden", padding: 0 }}>
      <div onClick={() => setExpanded(e => !e)} role="button" tabIndex={0}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }}>
        {/* 위험 비율 도넛 */}
        <svg width="58" height="58" viewBox="0 0 58 58" style={{ flexShrink: 0, filter: `drop-shadow(0 4px 10px ${ringColor}55)` }} aria-label={`위험 ${riskPct}%`}>
          <circle cx="29" cy="29" r={radius} fill="none" stroke="var(--surface3)" strokeWidth="5" />
          <circle cx="29" cy="29" r={radius} fill="none" stroke={ringColor} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${dashLen} ${circ}`} transform="rotate(-90 29 29)"
            style={{ transition: "stroke-dasharray 0.6s var(--ease)" }} />
          <text x="29" y="33" textAnchor="middle" fontSize="13" fontWeight="900" fill={ringColor} fontFamily="inherit">{riskPct}%</text>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
            이번 달 미납 주의 세입자 <span className="num">{scored.length}</span>명
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {critical > 0 && <span className="chip chip-danger" style={{ fontSize: 10 }}>🚨 고위험 {critical}</span>}
            {high > 0 && <span className="chip chip-warn" style={{ fontSize: 10 }}>⚠ 주의 {high}</span>}
            <span className="chip" style={{ fontSize: 10 }}>최근 6개월 패턴</span>
          </div>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s var(--ease)" }}>▾</span>
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
