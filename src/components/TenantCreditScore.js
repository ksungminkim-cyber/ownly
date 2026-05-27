"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useApp } from "../context/AppContext";
import { calcTenantCredit } from "../lib/tenantCredit";

// 세입자 신뢰도 종합 점수 카드 — 납부/소통/유지보수/재임 4개 요소 합산

export default function TenantCreditScore({ tenant, compact = false }) {
  const { payments, repairs } = useApp();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!tenant?.id) return;
    supabase.from("tenant_notes").select("id, type, tenant_id").eq("tenant_id", tenant.id)
      .then(({ data }) => setNotes(data || []));
  }, [tenant?.id]);

  const credit = calcTenantCredit(tenant, payments || [], notes, repairs || [], tenant.start_date);

  // 컴팩트 모드: 뱃지만
  if (compact) {
    return (
      <span title={`${credit.label} · ${credit.total}점`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: credit.color, background: credit.bg, padding: "3px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
        {credit.grade} · {credit.total}
      </span>
    );
  }

  // 도넛 게이지: 둘레 = 2πr, 점수 비율만큼 stroke-dasharray
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const dashLen = (credit.total / 100) * circ;

  return (
    <div className="surface-card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>🏆 신뢰도 크레딧</p>
          <p style={{ fontSize: 10, color: "#a0a0b0", marginTop: 2 }}>납부·소통·유지보수·재임 4개 요소 종합</p>
        </div>
        <span className="chip" style={{ color: credit.color, background: credit.bg, borderColor: credit.color + "33", fontSize: 11 }}>{credit.label}</span>
      </div>

      {/* SVG 도넛 게이지 + 우측 그리드 */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ flexShrink: 0, filter: `drop-shadow(0 6px 12px ${credit.color}40)` }} aria-label={`신뢰도 ${credit.total}점`}>
          <defs>
            <linearGradient id={`grad-${credit.grade}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={credit.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={credit.color} />
            </linearGradient>
          </defs>
          {/* 트랙 */}
          <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--surface3)" strokeWidth="9" />
          {/* 진행 */}
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke={`url(#grad-${credit.grade})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dashLen} ${circ}`}
            transform="rotate(-90 48 48)"
            style={{ transition: "stroke-dasharray 0.7s var(--ease)" }}
          />
        </svg>
        <div>
          <p className="num" style={{ fontSize: 32, fontWeight: 900, color: credit.color, lineHeight: 1, letterSpacing: "-1px" }}>
            {credit.grade}
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>
            <span className="num">{credit.total}</span><span style={{ color: "var(--text-muted)", fontWeight: 500 }}>/100점</span>
          </p>
        </div>
      </div>

      {/* 세부 항목 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { key: "payment", icon: "💰", label: "납부 신뢰도", b: credit.breakdown.payment },
          { key: "engagement", icon: "💬", label: "소통 참여도", b: credit.breakdown.engagement },
          { key: "maintenance", icon: "🔧", label: "유지보수 부담", b: credit.breakdown.maintenance },
          { key: "tenure", icon: "🏠", label: "재임 기간", b: credit.breakdown.tenure },
        ].map(({ key, icon, label, b }) => {
          const pct = (b.score / b.max) * 100;
          const color = pct >= 75 ? "#0fa573" : pct >= 50 ? "#5b4fcf" : pct >= 25 ? "#e8960a" : "#e8445a";
          return (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3, alignItems: "center" }}>
                <span style={{ color: "#6a6a7a" }}>{icon} {label}</span>
                <span style={{ fontWeight: 800, color: "#1a2744" }}>
                  {b.score}<span style={{ color: "#c0c0cc", fontWeight: 600 }}>/{b.max}</span>
                </span>
              </div>
              <div style={{ height: 5, background: "#f4f3f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
              </div>
              <p style={{ fontSize: 10, color: "#a0a0b0", marginTop: 3 }}>{b.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
