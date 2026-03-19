"use client";
import { useState, useMemo } from "react";
import { SectionLabel, CustomTooltip } from "../../../components/shared";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import PlanGate from "../../../components/PlanGate";

export default function ReportsPage() {
  const { tenants, payments } = useApp();
  const [period, setPeriod] = useState("6m");
  return <PlanGate feature="reports"><ReportsContent tenants={tenants} payments={payments} period={period} setPeriod={setPeriod} /></PlanGate>;
}

function getPeriodMonths(period) {
  const n = period === "3m" ? 3 : period === "1y" ? 12 : 6;
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

function monthLabel(year, month) { return `${month}월`; }

function downloadReportPDF(tenants, chartData, total, net, period) {
  const periodLabel = { "3m": "최근 3개월", "6m": "최근 6개월", "1y": "최근 1년" }[period] || period;
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const expense = total - net;
  const rows = tenants.map(t => {
    const annualRent = (t.rent || 0) * 12;
    const yld = t.dep > 0 ? ((annualRent / t.dep) * 100).toFixed(1) : "N/A";
    return `<tr><td>${t.sub || ""}</td><td>${t.addr || ""}</td><td>${t.name}</td><td>${t.rent || 0}만원</td><td>${((t.dep || 0) / 10000).toFixed(1)}억</td><td>${yld}%</td></tr>`;
  }).join("");
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>수익 리포트</title><style>body{font-family:'Apple SD Gothic Neo',sans-serif;max-width:720px;margin:60px auto;padding:0 40px;color:#1a1a2e}.header{border-bottom:3px double #1a2744;padding-bottom:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-end}.title{font-size:26px;font-weight:900;color:#1a2744}.subtitle{font-size:12px;color:#8a8a9a;margin-top:4px}.summary{display:flex;gap:16px;margin-bottom:28px}.card{flex:1;border:1px solid #e8e6e0;border-radius:12px;padding:16px 20px}.card-label{font-size:10px;font-weight:700;color:#8a8a9a;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}.card-value{font-size:22px;font-weight:900}.income{color:#1a2744}.expense{color:#e8445a}.profit{color:#0fa573}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#1a2744;color:#fff;font-size:11px;font-weight:700;padding:10px 14px;text-align:left}td{padding:11px 14px;font-size:13px;border-bottom:1px solid #f0efe9}h3{font-size:14px;font-weight:800;color:#1a2744;margin-bottom:12px}.footer{margin-top:40px;text-align:right;font-size:11px;color:#8a8a9a}</style></head><body><div class="header"><div><div class="title">수익 리포트</div><div class="subtitle">${periodLabel} · Ownly</div></div><div style="font-size:12px;color:#8a8a9a">${today}</div></div><div class="summary"><div class="card"><div class="card-label">총 수입</div><div class="card-value income">${total}만원</div></div><div class="card"><div class="card-label">총 지출</div><div class="card-value expense">${expense}만원</div></div><div class="card"><div class="card-label">순수익</div><div class="card-value profit">${net}만원</div></div></div><h3>물건별 수익 분석</h3><table><thead><tr><th>유형</th><th>주소</th><th>세입자</th><th>월세</th><th>보증금</th><th>수익률</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">본 리포트는 Ownly(온리)에서 자동 생성되었습니다.</div><script>window.onload=()=>{window.print();}<\/script></body></html>`);
  w.document.close();
}

function ReportsContent({ tenants, payments, period, setPeriod }) {
  const periodMonths = useMemo(() => getPeriodMonths(period), [period]);

  const chartData = useMemo(() => {
    return periodMonths.map(({ year, month }) => {
      const monthPayments = payments.filter(p =>
        p.month === month && (p.year === year || !p.year) && p.status === "paid"
      );
      const rentIncome = monthPayments.reduce((s, p) => s + (p.amt || 0), 0);
      const maintIncome = payments
        .filter(p => p.month === month && (p.year === year || !p.year) && p.maintenance_paid)
        .reduce((s, p) => {
          const tenant = tenants.find(t => t.id === p.tid);
          return s + (tenant?.maintenance || 0);
        }, 0);
      const income = rentIncome + maintIncome;
      return { m: monthLabel(year, month), income, rentIncome, maintIncome, expense: 0, net: income, year, month };
    });
  }, [payments, periodMonths]);

  const total   = chartData.reduce((s, m) => s + m.income, 0);
  const expense = chartData.reduce((s, m) => s + m.expense, 0);
  const net     = total - expense;
  const periodLabel = { "3m": "최근 3개월", "6m": "최근 6개월", "1y": "최근 1년" }[period];

  // ✅ 수납률 버그 수정
  // 기존: 기간 전체 예상 수입 대비 → 미래 포함해서 분모가 커짐
  // 수정: 기간 내 실제 청구 가능 개월(과거+현재만) × 월세 대비 실제 수납액
  const collectRate = useMemo(() => {
    if (tenants.length === 0) return 0;
    let actualTotal   = 0;
    let expectedTotal = 0;
    tenants.forEach(t => {
      const monthlyExpected = (t.rent || 0) + (t.maintenance || 0);
      periodMonths.forEach(({ year, month }) => {
        // 과거 또는 현재 월만 포함 (미래 제외)
        const now = new Date();
        const isNotFuture = new Date(year, month - 1) <= new Date(now.getFullYear(), now.getMonth());
        if (!isNotFuture) return;
        expectedTotal += monthlyExpected;
        // 해당 월 수납 여부
        const paid = payments.find(p => p.tid === t.id && p.month === month && (p.year === year || !p.year) && p.status === "paid");
        if (paid) actualTotal += (paid.amt || 0) + (paid.maintenance_paid ? (t.maintenance || 0) : 0);
      });
    });
    return expectedTotal > 0 ? Math.round((actualTotal / expectedTotal) * 100) : 0;
  }, [tenants, payments, periodMonths]);

  const expectedMonthly = tenants.reduce((s, t) => s + (t.rent || 0) + (t.maintenance || 0), 0);
  const hasData = total > 0;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 960 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>REVENUE REPORT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>수익 리포트</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>
            {periodLabel} · {hasData ? <><span style={{ color: "#0fa573", fontWeight: 700 }}>순수익 {net.toLocaleString()}만원</span></> : "수납 데이터 없음"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[{ k: "3m", l: "3개월" }, { k: "6m", l: "6개월" }, { k: "1y", l: "1년" }].map(p => (
            <button key={p.k} onClick={() => setPeriod(p.k)}
              style={{ padding: "6px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${period === p.k ? C.indigo : "#ebe9e3"}`, background: period === p.k ? C.indigo + "20" : "transparent", color: period === p.k ? C.indigo : C.muted }}>
              {p.l}
            </button>
          ))}
          <button onClick={() => downloadReportPDF(tenants, chartData, total, net, period)}
            style={{ padding: "6px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.indigo}`, background: C.indigo, color: "#fff" }}>
            📄 PDF
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13, marginBottom: 22 }}>
        {[
          { l: "총 수입", v: `${total.toLocaleString()}만원`, c: C.indigo,
            sub: (() => { const m = chartData.reduce((s,x)=>s+x.maintIncome,0); return m > 0 ? `월세+관리비 합산 (관리비 ${m}만원 포함)` : `${periodLabel} 월세 수납 합산`; })() },
          { l: "수납률", v: `${collectRate}%`, c: collectRate >= 90 ? C.emerald : collectRate >= 70 ? C.amber : C.rose,
            sub: `실제 납부 기간 기준` },
          { l: "순수익", v: `${net.toLocaleString()}만원`, c: C.emerald,
            sub: `월평균 ${periodMonths.length > 0 ? Math.round(net / periodMonths.length).toLocaleString() : 0}만원` },
        ].map(k => (
          <div key={k.l} style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 15, padding: "19px 22px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 7 }}>{k.l}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: k.c }}>{k.v}</p>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 3 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {!hasData && (
        <div style={{ background: "#fffbf0", border: "1px solid #f0d070", borderRadius: 14, padding: "16px 20px", marginBottom: 18, display: "flex", gap: 10 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 3 }}>수납 기록이 없습니다</p>
            <p style={{ fontSize: 12, color: "#78350f", lineHeight: 1.7 }}>수금 현황 페이지에서 월세를 수납 처리하면 여기에 차트와 통계가 자동으로 표시됩니다.</p>
          </div>
        </div>
      )}

      {/* 차트 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 17, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", marginBottom: 16 }}>월별 수납 현황</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ebe9e3" vertical={false} />
              <XAxis dataKey="m" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rentIncome"  name="월세"   fill={C.indigo} radius={[4,4,0,0]} stackId="a" />
              <Bar dataKey="maintIncome" name="관리비" fill="#a78bfa" radius={[4,4,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 17, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", marginBottom: 16 }}>누적 수입 추이</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.map((m, i) => ({ ...m, cumulative: chartData.slice(0, i + 1).reduce((s, x) => s + x.income, 0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ebe9e3" vertical={false} />
              <XAxis dataKey="m" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="cumulative" name="누적 수입" stroke={C.emerald} strokeWidth={2.5} dot={{ fill: C.emerald, r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 물건별 수익 테이블 */}
      <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 17, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #ebe9e3" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>물건별 수익 분석</h3>
        </div>
        {tenants.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>등록된 세입자가 없습니다.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0a0a10" }}>
                {["물건","세입자","월세","보증금","연 수익률"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => {
                const annualRent = (t.rent || 0) * 12;
                const yld = t.dep > 0 ? ((annualRent / t.dep) * 100).toFixed(1) : "N/A";
                const rentCollected = payments
                  .filter(p => p.tid === t.id && p.status === "paid" && periodMonths.some(pm => pm.month === p.month && (pm.year === p.year || !p.year)))
                  .reduce((s, p) => s + (p.amt || 0), 0);
                const maintCollected = payments
                  .filter(p => p.tid === t.id && p.maintenance_paid && periodMonths.some(pm => pm.month === p.month && (pm.year === p.year || !p.year)))
                  .reduce((s, p) => s + (t.maintenance || 0), 0);
                const actualCollected = rentCollected + maintCollected;
                const now = new Date();
                const validPeriodMonths = periodMonths.filter(({ year, month }) => new Date(year, month - 1) <= new Date(now.getFullYear(), now.getMonth()));
                const expectedInPeriod = ((t.rent || 0) + (t.maintenance || 0)) * validPeriodMonths.length;
                const pRate = expectedInPeriod > 0 ? Math.round(actualCollected / expectedInPeriod * 100) : 0;
                return (
                  <tr key={t.id} style={{ borderTop: "1px solid #ebe9e3" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.pType === "상가" ? C.amber : C.indigo, background: t.pType === "상가" ? C.amber + "18" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span>
                      <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{t.addr}</p>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{t.name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{(t.rent || 0).toLocaleString()}만원</p>
                      {t.maintenance > 0 && <p style={{ fontSize: 10, color: "#a78bfa", marginTop: 1 }}>관리비 {t.maintenance}만원 별도</p>}
                      {actualCollected > 0 && <p style={{ fontSize: 10, color: C.emerald, marginTop: 1 }}>실 수납 {actualCollected.toLocaleString()}만원</p>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#8a8a9a" }}>{((t.dep || 0) / 10000).toFixed(1)}억</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: yld !== "N/A" && parseFloat(yld) >= 5 ? C.emerald : C.amber }}>{yld}%</span>
                        <div style={{ width: 64, height: 4, borderRadius: 4, background: "#f8f7f4", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: Math.min(100, yld !== "N/A" ? parseFloat(yld) * 7 : 0) + "%", borderRadius: 4, background: yld !== "N/A" && parseFloat(yld) >= 5 ? C.emerald : C.amber }} />
                        </div>
                        {expectedInPeriod > 0 && (
                          <span style={{ fontSize: 10, color: pRate >= 90 ? C.emerald : pRate >= 70 ? C.amber : C.rose }}>수납 {pRate}%</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
