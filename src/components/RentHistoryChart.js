"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useApp } from "../context/AppContext";

// 세입자 임대료 히스토리 — 계약별 월세·보증금 추이 그래프
export default function RentHistoryChart({ tenant }) {
  const { contracts } = useApp();

  const tenantContracts = (contracts || [])
    .filter(c => c.tenant_id === tenant.id)
    .sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0));

  // 현재 계약 정보도 포함
  const currentStart = tenant.start_date;
  const currentRent = Number(tenant.rent) || 0;
  const hasCurrentInContracts = tenantContracts.some(c => c.start_date === currentStart);
  const allPoints = [
    ...tenantContracts.map(c => ({
      date: c.start_date || "",
      rent: Number(c.rent) || 0,
      deposit: Number(c.deposit) || 0,
      label: c.start_date?.slice(0, 7) || "",
    })),
    ...(!hasCurrentInContracts && currentStart ? [{
      date: currentStart,
      rent: currentRent,
      deposit: Number(tenant.dep) || 0,
      label: currentStart.slice(0, 7) + " (현재)",
      isCurrent: true,
    }] : []),
  ].filter(p => p.date);

  if (allPoints.length < 2) {
    return (
      <div style={{ padding: 14, textAlign: "center", fontSize: 11, color: "#a0a0b0", background: "#f8f7f4", borderRadius: 8 }}>
        📈 갱신·재계약 이력이 쌓이면 임대료 추이 그래프가 표시됩니다
      </div>
    );
  }

  // 변동률
  const firstRent = allPoints[0].rent;
  const lastRent = allPoints[allPoints.length - 1].rent;
  const totalChange = firstRent > 0 ? Math.round(((lastRent - firstRent) / firstRent) * 100) : 0;

  // 연평균 상승률 (CAGR 단순화 버전)
  const firstDate = new Date(allPoints[0].date);
  const lastDate = new Date(allPoints[allPoints.length - 1].date);
  const years = Math.max(1, (lastDate - firstDate) / (365.25 * 86400000));
  const cagr = firstRent > 0 && years > 0 ? (((lastRent / firstRent) ** (1 / years) - 1) * 100).toFixed(1) : 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px" }}>📈 임대료 변동 이력</p>
        <div style={{ display: "flex", gap: 10, fontSize: 10 }}>
          <span style={{ color: "#8a8a9a" }}>총 변동 <b style={{ color: totalChange >= 0 ? "#0fa573" : "#e8445a" }}>{totalChange >= 0 ? "+" : ""}{totalChange}%</b></span>
          <span style={{ color: "#8a8a9a" }}>연평균 <b style={{ color: "#5b4fcf" }}>{cagr}%</b></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={allPoints} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5b4fcf" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#5b4fcf" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f3f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#a0a0b0", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#a0a0b0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 8, fontSize: 11 }}
            formatter={(v, name) => [`${Number(v).toLocaleString()}만원`, name === "rent" ? "월세" : "보증금"]}
          />
          <Area type="stepAfter" dataKey="rent" stroke="#5b4fcf" strokeWidth={2.5} fill="url(#rentGrad)" dot={{ fill: "#5b4fcf", r: 3, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 6, padding: "8px 10px", background: "#f8f7f4", borderRadius: 6 }}>
        <p style={{ fontSize: 10, color: "#6a6a7a", lineHeight: 1.6 }}>
          📋 {allPoints.length}개 계약 · {allPoints[0].label} ~ {allPoints[allPoints.length - 1].label}{" "}
          · 최초 {firstRent.toLocaleString()}만 → 현재 {lastRent.toLocaleString()}만원
        </p>
      </div>
    </div>
  );
}
