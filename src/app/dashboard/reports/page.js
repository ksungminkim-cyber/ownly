"use client";
import { useState } from "react";
import { SectionLabel, CustomTooltip } from "../../../components/shared";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { C, REVENUE } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import PlanGate from "../../../components/PlanGate";

export default function ReportsPage() {
  const { tenants } = useApp();
  const [period, setPeriod] = useState("6m");

  return <PlanGate feature="reports"><ReportsContent tenants={tenants} period={period} setPeriod={setPeriod} /></PlanGate>;
}

function downloadReportPDF(tenants, total, expense, net, period) {
  const periodLabel = { "3m": "최근 3개월", "6m": "최근 6개월", "1y": "최근 1년" }[period] || period;
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const rows = tenants.map((t) => {
    const annualRent = t.rent * 12;
    const yld = t.dep > 0 ? ((annualRent / t.dep) * 100).toFixed(1) : "N/A";
    return `<tr><td>${t.sub || ""}</td><td>${t.addr || ""}</td><td>${t.name}</td><td>${t.rent}만원</td><td>${(t.dep / 10000).toFixed(1)}억</td><td>${yld}%</td></tr>`;
  }).join("");

  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8"><title>수익 리포트</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  body { font-family: 'Pretendard', sans-serif; max-width: 720px; margin: 60px auto; padding: 0 40px; color: #1a1a2e; }
  .header { border-bottom: 3px double #1a2744; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
  .title { font-size: 26px; font-weight: 900; color: #1a2744; }
  .subtitle { font-size: 12px; color: #8a8a9a; margin-top: 4px; }
  .date { font-size: 12px; color: #8a8a9a; }
  .summary { display: flex; gap: 16px; margin-bottom: 28px; }
  .card { flex: 1; border: 1px solid #e8e6e0; border-radius: 12px; padding: 16px 20px; }
  .card-label { font-size: 10px; font-weight: 700; color: #8a8a9a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .card-value { font-size: 22px; font-weight: 900; }
  .income { color: #1a2744; } .expense { color: #e8445a; } .profit { color: #0fa573; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1a2744; color: #fff; font-size: 11px; font-weight: 700; padding: 10px 14px; text-align: left; letter-spacing: .5px; }
  td { padding: 11px 14px; font-size: 13px; border-bottom: 1px solid #f0efe9; color: #1a2744; }
  tr:last-child td { border-bottom: none; }
  h3 { font-size: 14px; font-weight: 800; color: #1a2744; margin-bottom: 12px; }
  .footer { margin-top: 40px; text-align: right; font-size: 11px; color: #8a8a9a; }
  @media print { body { margin: 20px; } }
</style>
</head><body>
<div class="header">
  <div><div class="title">수익 리포트</div><div class="subtitle">${periodLabel} · Ownly by McLean</div></div>
  <div class="date">${today}</div>
</div>
<div class="summary">
  <div class="card"><div class="card-label">총 수입</div><div class="card-value income">${total}만원</div></div>
  <div class="card"><div class="card-label">총 지출</div><div class="card-value expense">${expense}만원</div></div>
  <div class="card"><div class="card-label">순수익</div><div class="card-value profit">${net}만원</div></div>
</div>
<h3>물건별 수익 분석</h3>
<table>
  <thead><tr><th>유형</th><th>주소</th><th>세입자</th><th>월세</th><th>보증금</th><th>수익률</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">본 리포트는 Ownly(온리)에서 자동 생성되었습니다.</div>
<script>window.onload = () => { window.print(); }<\/script>
</body></html>`);
  w.document.close();
}

function ReportsContent({ tenants, period, setPeriod }) {

  const total   = REVENUE.reduce((s, m) => s + m.income,  0);
  const expense = REVENUE.reduce((s, m) => s + m.expense, 0);
  const net     = total - expense;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>REVENUE REPORT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>수익 리포트</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>최근 6개월 · 순수익 <span style={{ color: "#0fa573", fontWeight: 700 }}>{net}만원</span></p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[{ k: "3m", l: "3개월" }, { k: "6m", l: "6개월" }, { k: "1y", l: "1년" }].map((p) => (
            <button key={p.k} onClick={() => setPeriod(p.k)} style={{ padding: "6px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${period === p.k ? C.indigo : "#ebe9e3"}`, background: period === p.k ? C.indigo + "20" : "transparent", color: period === p.k ? C.indigo : C.muted }}>
              {p.l}
            </button>
          ))}
          <button onClick={() => downloadReportPDF(tenants, total, expense, net, period)} style={{ padding: "6px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.indigo}`, background: C.indigo, color: "#fff" }}>
            📄 PDF
          </button>
        </div>
      </div>

      {/* 요약 카드 3개 */}
      <div className="dash-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13, marginBottom: 22 }}>
        {[
          { l: "총 수입", v: total   + "만원", c: C.indigo,  sub: "6개월 합산" },
          { l: "총 지출", v: expense + "만원", c: C.rose,    sub: "수리·관리비 등" },
          { l: "순수익",  v: net     + "만원", c: C.emerald, sub: "수익률 " + (total > 0 ? Math.round((net / total) * 100) : 0) + "%" },
        ].map((k) => (
          <div key={k.l} style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 15, padding: "19px 22px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 7 }}>{k.l}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: k.c }}>{k.v}</p>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 3 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* 차트 */}
      <div className="dash-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 17, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", marginBottom: 16 }}>월별 수입 vs 지출</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke={"#ebe9e3"} vertical={false} />
              <XAxis dataKey="m" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income"  name="수입" fill={C.indigo} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="지출" fill={C.rose}   radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 17, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", marginBottom: 16 }}>순수익 추이</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REVENUE.map((m) => ({ ...m, net: m.income - m.expense }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={"#ebe9e3"} vertical={false} />
              <XAxis dataKey="m" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="net" name="순수익" stroke={C.emerald} strokeWidth={2.5} dot={{ fill: C.emerald, r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 물건별 수익 테이블 */}
      <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 17, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #ebe9e3" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>물건별 수익 분석</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0a0a10" }}>
              {["물건", "세입자", "월세", "보증금", "연 수익률"].map((h) => (
                <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const annualRent = t.rent * 12;
              const yld = t.dep > 0 ? ((annualRent / t.dep) * 100).toFixed(1) : "N/A";
              return (
                <tr key={t.id} className="trow" style={{ borderTop: "1px solid #ebe9e3" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: t.pType === "상가" ? C.amber : C.indigo, background: t.pType === "상가" ? C.amber + "18" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span>
                    <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{t.addr}</p>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{t.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{t.rent}만원</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#8a8a9a" }}>{(t.dep / 10000).toFixed(1)}억</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: yld !== "N/A" && parseFloat(yld) >= 5 ? C.emerald : C.amber }}>{yld}%</span>
                      <div style={{ width: 64, height: 4, borderRadius: 4, background: "#f8f7f4", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: Math.min(100, yld !== "N/A" ? parseFloat(yld) * 7 : 0) + "%", borderRadius: 4, background: t.c }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
