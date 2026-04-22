"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { SectionLabel, EmptyState } from "../../../../components/shared";
import { daysLeft, buildingKey } from "../../../../lib/constants";

const SORT_OPTIONS = [
  { key: "units", label: "호실 수" },
  { key: "vacancyRate", label: "공실률" },
  { key: "monthlyRent", label: "월 수입" },
  { key: "yield", label: "수익률" },
  { key: "issues", label: "문제 건수" },
];

export default function BuildingCompare() {
  const router = useRouter();
  const { buildings, tenants, repairs, loading } = useApp();
  const [sortKey, setSortKey] = useState("monthlyRent");
  const [desc, setDesc] = useState(true);

  const cards = useMemo(() => {
    const realBuildings = (buildings || []).map(b => ({
      id: b.id,
      name: b.name || b.address,
      address: b.address,
      virtual: false,
      units: tenants.filter(t => t.building_id === b.id),
    }));

    // 미등록 건물(주소 기반) 포함
    const unassigned = tenants.filter(t => !t.building_id);
    const vmap = new Map();
    unassigned.forEach(t => {
      const key = buildingKey(t.addr);
      if (!key) return;
      if (!vmap.has(key)) vmap.set(key, { id: `virtual:${key}`, name: key, address: key, virtual: true, units: [] });
      vmap.get(key).units.push(t);
    });

    return [...realBuildings, ...Array.from(vmap.values())].map(b => {
      const totalUnits = b.units.length;
      const occupied = b.units.filter(u => u.status !== "공실");
      const vacant = totalUnits - occupied.length;
      const vacancyRate = totalUnits > 0 ? Math.round((vacant / totalUnits) * 100) : 0;
      const monthlyRent = occupied.reduce((s, u) => s + (Number(u.rent) || 0), 0);
      const annualRent = monthlyRent * 12;
      const totalDeposit = b.units.reduce((s, u) => s + (Number(u.dep) || 0), 0);
      const yieldRate = totalDeposit > 0 ? ((annualRent / totalDeposit) * 100) : null;
      const expiring = occupied.filter(u => { const dl = daysLeft(u.end_date || u.end); return dl > 0 && dl <= 90; }).length;
      const unpaid = occupied.filter(u => u.status === "미납").length;
      const buildingUnitIds = new Set(b.units.map(u => u.id));
      const openRepairs = (repairs || []).filter(r => buildingUnitIds.has(r.tenant_id) && (r.status === "open" || r.status === "in_progress")).length;
      const issues = expiring + unpaid + openRepairs;
      return { ...b, totalUnits, vacant, vacancyRate, monthlyRent, annualRent, totalDeposit, yieldRate, expiring, unpaid, openRepairs, issues };
    });
  }, [buildings, tenants, repairs]);

  const sorted = useMemo(() => {
    const arr = [...cards];
    arr.sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      return desc ? bv - av : av - bv;
    });
    return arr;
  }, [cards, sortKey, desc]);

  const totalMonthly = cards.reduce((s, c) => s + c.monthlyRent, 0);
  const totalUnits = cards.reduce((s, c) => s + c.totalUnits, 0);
  const totalVacant = cards.reduce((s, c) => s + c.vacant, 0);
  const avgVacancy = totalUnits > 0 ? Math.round((totalVacant / totalUnits) * 100) : 0;

  if (loading) return <div className="page-in page-padding" style={{ textAlign: "center", padding: 40, color: "#8a8a9a" }}>불러오는 중...</div>;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 22 }}>
        <button onClick={() => router.push("/dashboard/buildings")} style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← 건물 관리</button>
        <SectionLabel>BUILDING COMPARE</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>건물별 비교</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>공실률·수익률·문제 건수를 한눈에 비교하고 문제 건물을 식별하세요</p>
      </div>

      {cards.length === 0 ? (
        <EmptyState icon="🏢" title="비교할 건물이 없습니다" desc="건물을 등록하면 비교 분석을 할 수 있습니다" />
      ) : (
        <>
          {/* 전체 KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
            {[
              { l: "총 건물", v: `${cards.length}개`, c: "#1a2744" },
              { l: "총 호실", v: `${totalUnits}개`, c: "#1a2744" },
              { l: "총 공실", v: `${totalVacant}개 (${avgVacancy}%)`, c: totalVacant > 0 ? "#e8445a" : "#0fa573" },
              { l: "전체 월 수입", v: `${totalMonthly.toLocaleString()}만`, c: "#0fa573" },
            ].map(k => (
              <div key={k.l} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>{k.l}</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: k.c }}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* 정렬 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, alignSelf: "center", marginRight: 4 }}>정렬:</span>
            {SORT_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => { if (sortKey === opt.key) setDesc(!desc); else { setSortKey(opt.key); setDesc(true); } }}
                style={{ padding: "4px 11px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${sortKey === opt.key ? "#1a2744" : "#ebe9e3"}`, background: sortKey === opt.key ? "#1a2744" : "transparent", color: sortKey === opt.key ? "#fff" : "#8a8a9a" }}>
                {opt.label}{sortKey === opt.key && (desc ? " ↓" : " ↑")}
              </button>
            ))}
          </div>

          {/* 비교 테이블 */}
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 110px 110px 100px 110px", padding: "10px 16px", background: "#f8f7f4", borderBottom: "1px solid #ebe9e3", fontSize: 10, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", gap: 8 }}>
              <span>건물 / 주소</span>
              <span style={{ textAlign: "right" }}>호실 / 공실</span>
              <span style={{ textAlign: "right" }}>월 수입</span>
              <span style={{ textAlign: "right" }}>수익률</span>
              <span style={{ textAlign: "right" }}>문제</span>
              <span style={{ textAlign: "right" }}>액션</span>
            </div>
            {sorted.map((b, i) => {
              const isProblematic = b.vacancyRate > 20 || b.issues >= 3;
              return (
                <div key={b.id}
                  style={{ display: "grid", gridTemplateColumns: "2fr 90px 110px 110px 100px 110px", padding: "14px 16px", borderBottom: i < sorted.length - 1 ? "1px solid #f4f3f0" : "none", gap: 8, alignItems: "center", background: isProblematic ? "rgba(232,68,90,0.03)" : "transparent" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{b.name}</span>
                      {b.virtual && <span style={{ fontSize: 9, fontWeight: 700, color: "#8a8a9a", background: "#f0efe9", padding: "1px 6px", borderRadius: 4 }}>미등록</span>}
                    </div>
                    <p style={{ fontSize: 11, color: "#8a8a9a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.address}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{b.totalUnits}</p>
                    {b.vacant > 0 && <p style={{ fontSize: 10, color: "#e8445a", fontWeight: 700 }}>공실 {b.vacant} ({b.vacancyRate}%)</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#0fa573" }}>{b.monthlyRent.toLocaleString()}</p>
                    <p style={{ fontSize: 10, color: "#a0a0b0" }}>연 {b.annualRent.toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {b.yieldRate !== null ? (
                      <>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#5b4fcf" }}>{b.yieldRate.toFixed(1)}%</p>
                        <p style={{ fontSize: 10, color: "#a0a0b0" }}>연/보증금</p>
                      </>
                    ) : <p style={{ fontSize: 11, color: "#a0a0b0" }}>—</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {b.issues === 0 ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#0fa573" }}>✅ 정상</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
                        {b.unpaid > 0 && <span style={{ fontSize: 10, color: "#e8445a", fontWeight: 700 }}>미납 {b.unpaid}</span>}
                        {b.expiring > 0 && <span style={{ fontSize: 10, color: "#e8960a", fontWeight: 700 }}>만료 {b.expiring}</span>}
                        {b.openRepairs > 0 && <span style={{ fontSize: 10, color: "#5b4fcf", fontWeight: 700 }}>수리 {b.openRepairs}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {!b.virtual ? (
                      <button onClick={() => router.push(`/dashboard/buildings/${b.id}`)}
                        style={{ padding: "5px 10px", borderRadius: 7, background: "rgba(26,39,68,0.06)", border: "1px solid #ebe9e3", color: "#1a2744", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>상세 →</button>
                    ) : (
                      <span style={{ fontSize: 10, color: "#a0a0b0" }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, padding: "13px 18px", background: "#f8f7f4", borderRadius: 10, fontSize: 11, color: "#6a6a7a", lineHeight: 1.7 }}>
            💡 <b>공실률 20%+ 또는 문제 3건 이상</b> 건물은 빨간 배경으로 강조됩니다. 우선 관리 대상으로 확인하세요.
          </div>
        </>
      )}
    </div>
  );
}
