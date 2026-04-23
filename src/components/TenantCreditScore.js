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

  return (
    <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px" }}>🏆 신뢰도 크레딧</p>
          <p style={{ fontSize: 10, color: "#a0a0b0", marginTop: 2 }}>납부·소통·유지보수·재임 4개 요소 종합</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 26, fontWeight: 900, color: credit.color, lineHeight: 1 }}>
            {credit.grade}
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6a6a7a", marginLeft: 6 }}>{credit.total}/100</span>
          </p>
          <span style={{ fontSize: 10, fontWeight: 800, color: credit.color, background: credit.bg, padding: "2px 9px", borderRadius: 10, marginTop: 3, display: "inline-block" }}>{credit.label}</span>
        </div>
      </div>

      {/* 총점 막대 */}
      <div style={{ height: 8, background: "#f0efe9", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${credit.total}%`, background: `linear-gradient(90deg, ${credit.color}88, ${credit.color})`, borderRadius: 4, transition: "width .5s" }} />
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
