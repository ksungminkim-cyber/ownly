"use client"; import ExcelTab from "./ExcelTab";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../context/AppContext";
import { SectionLabel } from "../../../components/shared";
import PlanGate from "../../../components/PlanGate";

const C = {
  navy:"#1a2744", purple:"#5b4fcf", emerald:"#0fa573",
  rose:"#e8445a", amber:"#e8960a", indigo:"#3b5bdb",
  border:"#e8e6e0", surface:"#ffffff", faint:"#f8f7f4", muted:"#8a8a9a",
};

const TABS = [
  { key:"chart", label:"📊 수익 차트" },
  { key:"pdf",   label:"📄 PDF 출력" }, { key:"excel", label:"📥 엑셀 내보내기" },
];

// ── 수익 차트 탭 (기존 reports/page.js 내용) ──────────────────────
function ChartTab() {
  const { tenants, payments } = useApp();
  const [period, setPeriod] = useState("3m");

  const now = new Date();
  const periodMonths = period === "3m" ? 3 : period === "6m" ? 6 : 12;

  const monthlyData = Array.from({ length: periodMonths }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (periodMonths - 1 - i), 1);
    const y = d.getFullYear(); const m = d.getMonth() + 1;
    const paid = payments.filter(p => (p.year || y) === y && (p.month || 0) === m && p.status === "paid");
    const income = paid.reduce((s, p) => s + (p.amt || p.amount || 0), 0);
    const unpaid = payments.filter(p => (p.year || y) === y && (p.month || 0) === m && p.status !== "paid");
    const missed = unpaid.reduce((s, p) => s + (p.amt || p.amount || 0), 0);
    return { label: `${m}월`, year: y, month: m, income, missed };
  });

  const maxVal = Math.max(...monthlyData.map(d => d.income + d.missed), 1);
  const totalIncome  = monthlyData.reduce((s, d) => s + d.income, 0);
  const totalMissed  = monthlyData.reduce((s, d) => s + d.missed, 0);
  const avgMonthly   = Math.round(totalIncome / periodMonths);
  const paidRate     = totalIncome + totalMissed > 0 ? Math.round((totalIncome / (totalIncome + totalMissed)) * 100) : 100;

  // 세입자별 수금률
  const tenantStats = tenants.map(t => {
    const paid = payments.filter(p => p.tid === t.id && p.status === "paid");
    const total = payments.filter(p => p.tid === t.id);
    const rate  = total.length > 0 ? Math.round((paid.length / total.length) * 100) : 100;
    const amt   = paid.reduce((s, p) => s + (p.amt || p.amount || 0), 0);
    return { ...t, paidCount: paid.length, totalCount: total.length, rate, amt };
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* 기간 선택 */}
      <div style={{ display:"flex", gap:8 }}>
        {[{ k:"3m", l:"3개월" }, { k:"6m", l:"6개월" }, { k:"1y", l:"1년" }].map(p => (
          <button key={p.k} onClick={() => setPeriod(p.k)}
            style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", border:`2px solid ${period===p.k ? C.navy : C.border}`, background: period===p.k ? "rgba(26,39,68,0.07)" : "transparent", color: period===p.k ? C.navy : C.muted }}>
            {p.l}
          </button>
        ))}
      </div>

      {/* KPI 카드 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {[
          { label:"총 수금액",   value:`${totalIncome.toLocaleString()}만원`,  color:C.emerald, bg:"rgba(15,165,115,0.08)" },
          { label:"미수금",      value:`${totalMissed.toLocaleString()}만원`,  color:C.rose,    bg:"rgba(232,68,90,0.08)"  },
          { label:"월 평균 수금", value:`${avgMonthly.toLocaleString()}만원`,  color:C.navy,    bg:"rgba(26,39,68,0.06)"  },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, borderRadius:16, padding:"18px 20px" }}>
            <p style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>{k.label}</p>
            <p style={{ fontSize:22, fontWeight:900, color:k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* 바 차트 */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <p style={{ fontSize:13, fontWeight:800, color:C.navy }}>월별 수금 현황</p>
          <div style={{ display:"flex", gap:14, fontSize:11, color:C.muted }}>
            <span>■ <span style={{ color:C.emerald }}>수금</span></span>
            <span>■ <span style={{ color:C.rose }}>미수금</span></span>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:140 }}>
          {monthlyData.map(d => (
            <div key={d.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:10, color:C.navy, fontWeight:700 }}>{d.income > 0 ? d.income.toLocaleString() : ""}</span>
              <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:100, gap:2 }}>
                {d.missed > 0 && <div style={{ width:"100%", height:`${(d.missed/maxVal)*90}px`, background:C.rose, borderRadius:"3px 3px 0 0", minHeight:2 }} />}
                {d.income > 0 && <div style={{ width:"100%", height:`${(d.income/maxVal)*90}px`, background:C.emerald, borderRadius:"3px 3px 0 0", minHeight:2 }} />}
              </div>
              <span style={{ fontSize:10, color:C.muted }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 수납률 */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <p style={{ fontSize:13, fontWeight:800, color:C.navy }}>전체 수납률</p>
          <p style={{ fontSize:22, fontWeight:900, color: paidRate>=90?C.emerald:paidRate>=70?C.amber:C.rose }}>{paidRate}%</p>
        </div>
        <div style={{ height:8, background:"#f0efe9", borderRadius:8, overflow:"hidden", marginBottom:20 }}>
          <div style={{ height:"100%", width:`${paidRate}%`, background: paidRate>=90?C.emerald:paidRate>=70?C.amber:C.rose, borderRadius:8 }} />
        </div>
        <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:12 }}>세입자별 수금 현황</p>
        {tenantStats.map(t => (
          <div key={t.id} style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{t.name}</span>
                <span style={{ fontSize:11, color:C.muted }}>{t.addr}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:800, color: t.rate>=80?C.emerald:C.rose }}>{t.rate}%</span>
            </div>
            <div style={{ height:6, background:"#f0efe9", borderRadius:6, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${t.rate}%`, background: t.rate>=80?C.emerald:C.rose, borderRadius:6 }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
              <span style={{ fontSize:11, color:C.muted }}>{t.amt.toLocaleString()}만원 수금</span>
              <span style={{ fontSize:11, color:C.muted }}>{t.paidCount}/{t.totalCount}개월</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PDF 출력 탭 (기존 report-pdf/page.js 내용) ────────────────────
function PDFTab() {
  const { tenants, payments } = useApp();
  const [year, setYear] = useState(new Date().getFullYear());
  const [repairs, setRepairs] = useState([]);
  const [ledger,  setLedger]  = useState([]);
  const printRef = useRef();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [r, l] = await Promise.all([
        supabase.from("repairs").select("*").eq("user_id", user.id),
        supabase.from("ledger").select("*").eq("user_id",  user.id),
      ]);
      setRepairs(r.data || []);
      setLedger(l.data  || []);
    };
    load();
  }, []);

  const handlePrint = () => {
    const style = document.createElement("style");
    style.innerHTML = `@media print { body > *:not(#report-print-area) { display:none!important; } #report-print-area { display:block!important; } @page { margin: 20mm; } }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const yearPayments = payments.filter(p => (p.year || new Date().getFullYear()) === year);
  const yearLedger   = ledger.filter(l => new Date(l.date).getFullYear() === year);
  const yearRepairs  = repairs.filter(r => new Date(r.date).getFullYear() === year);

  const rentIncome   = yearPayments.filter(p => p.status === "paid").reduce((s,p) => s+(p.amt||p.amount||0), 0);
  const ledgerIncome = yearLedger.filter(l => l.type === "income").reduce((s,l) => s+(l.amount||0), 0);
  const totalIncome  = rentIncome + ledgerIncome;
  const repairCost   = yearRepairs.reduce((s,r) => s+(r.cost||0), 0);
  const ledgerExpense = yearLedger.filter(l => l.type === "expense").reduce((s,l) => s+(l.amount||0), 0);
  const totalExpense = repairCost + ledgerExpense;
  const netIncome    = totalIncome - totalExpense;

  const currentMonth = new Date().getMonth() + 1;
  const tenantSummary = tenants.map(t => {
    const paid    = yearPayments.filter(p => p.tid === t.id && p.status === "paid");
    const paidAmt = paid.reduce((s,p) => s+(p.amt||p.amount||0), 0);
    const startDate = t.start_date ? new Date(t.start_date) : null;
    const endDate   = t.end_date   ? new Date(t.end_date)   : null;
    const yearStart = new Date(year, 0, 1); const yearEnd = new Date(year, 11, 31);
    const effectiveStart = startDate && startDate > yearStart ? startDate : yearStart;
    const effectiveEnd   = endDate   && endDate   < yearEnd   ? endDate   : new Date(year, currentMonth-1, 1);
    const validMonths = Math.max(1, (effectiveEnd.getFullYear()-effectiveStart.getFullYear())*12+effectiveEnd.getMonth()-effectiveStart.getMonth()+1);
    const expectedAmt = (t.rent||0) * validMonths;
    const rate = expectedAmt > 0 ? Math.min(100, Math.round((paidAmt/expectedAmt)*100)) : 0;
    return { ...t, paidAmt, paidMonths: paid.length, expectedAmt, validMonths, rate };
  });

  const monthlyIncome = Array.from({ length:12 }, (_,i) => {
    const m = i+1;
    const rent  = yearPayments.filter(p => p.status==="paid" && (p.month||0)===m).reduce((s,p) => s+(p.amt||p.amount||0), 0);
    const other = yearLedger.filter(l => l.type==="income" && new Date(l.date).getMonth()+1===m).reduce((s,l) => s+(l.amount||0), 0);
    return { m, rent, other, total: rent+other };
  });
  const maxMonthly = Math.max(...monthlyIncome.map(m => m.total), 1);

  const expenseByCategory = {};
  yearRepairs.forEach(r => { expenseByCategory[r.category] = (expenseByCategory[r.category]||0)+(r.cost||0); });
  yearLedger.filter(l => l.type==="expense").forEach(l => { expenseByCategory[l.category] = (expenseByCategory[l.category]||0)+(l.amount||0); });

  return (
    <div>
      {/* 컨트롤 */}
      <div className="no-print" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <p style={{ fontSize:13, color:C.muted }}>연도를 선택하고 PDF로 출력하세요</p>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"7px 11px" }}>
            <button onClick={() => setYear(y => y-1)} style={{ width:26, height:26, borderRadius:7, border:"none", background:C.faint, cursor:"pointer", fontSize:14 }}>‹</button>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy, minWidth:58, textAlign:"center" }}>{year}년</span>
            <button onClick={() => setYear(y => y+1)} style={{ width:26, height:26, borderRadius:7, border:"none", background:C.faint, cursor:"pointer", fontSize:14 }}>›</button>
          </div>
          <button onClick={handlePrint}
            style={{ padding:"10px 22px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            🖨️ PDF 출력
          </button>
        </div>
      </div>

      <div id="report-print-area" ref={printRef}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, paddingBottom:16, borderBottom:`2px solid ${C.navy}` }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:900, color:C.navy, marginBottom:3 }}>Ownly — 임대 수익 보고서</h2>
            <p style={{ fontSize:13, color:C.muted }}>{year}년 1월 1일 ~ {year}년 12월 31일 · 임차인 {tenants.length}명</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:11, color:C.muted }}>출력일: {new Date().toLocaleDateString("ko-KR")}</p>
            <p style={{ fontSize:11, color:C.muted }}>ownly.kr</p>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:13, marginBottom:20 }}>
          {[
            { label:"연간 총 수입", value:`${totalIncome.toLocaleString()}만원`, color:C.emerald, bg:"rgba(15,165,115,0.08)", border:C.emerald },
            { label:"연간 총 지출", value:`${totalExpense.toLocaleString()}만원`, color:C.rose,    bg:"rgba(232,68,90,0.08)",  border:C.rose    },
            { label:"연간 순수익",  value:`${netIncome.toLocaleString()}만원`,   color:netIncome>=0?C.indigo:C.rose, bg:netIncome>=0?"rgba(59,91,219,0.08)":"rgba(232,68,90,0.08)", border:netIncome>=0?C.indigo:C.rose },
          ].map(k => (
            <div key={k.label} style={{ background:k.bg, border:`1.5px solid ${k.border}30`, borderRadius:14, padding:"18px 20px" }}>
              <p style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>{k.label}</p>
              <p style={{ fontSize:24, fontWeight:900, color:k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px", marginBottom:16 }}>
          <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>월별 수입 현황</p>
          <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:90, marginBottom:8 }}>
            {monthlyIncome.map(d => (
              <div key={d.m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <span style={{ fontSize:9, color:C.navy, fontWeight:700 }}>{d.total > 0 ? d.total : ""}</span>
                <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:64 }}>
                  {d.rent  > 0 && <div style={{ width:"100%", height:`${(d.rent /maxMonthly)*60}px`, background:C.emerald, borderRadius:"3px 3px 0 0", minHeight:2 }} />}
                  {d.other > 0 && <div style={{ width:"100%", height:`${(d.other/maxMonthly)*60}px`, background:C.indigo,  borderRadius:"3px 3px 0 0", minHeight:2 }} />}
                </div>
                <span style={{ fontSize:9, color:C.muted }}>{d.m}월</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
            <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>임차인별 수금 현황</p>
            {tenantSummary.length === 0 ? <p style={{ fontSize:13, color:C.muted }}>임차인 없음</p> :
              tenantSummary.map(t => (
                <div key={t.id} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.navy }}>{t.name}</span>
                    <span style={{ fontSize:12, fontWeight:700, color: t.rate>=80?C.emerald:C.rose }}>{t.rate}%</span>
                  </div>
                  <div style={{ height:6, background:"#f0efe9", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${t.rate}%`, background: t.rate>=80?C.emerald:C.rose, borderRadius:6 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
                    <span style={{ fontSize:10, color:C.muted }}>{t.paidAmt.toLocaleString()}만원</span>
                    <span style={{ fontSize:10, color:C.muted }}>{t.paidMonths}/{t.validMonths}개월</span>
                  </div>
                </div>
              ))}
          </div>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
            <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>지출 항목별</p>
            {Object.entries(expenseByCategory).length === 0 ? <p style={{ fontSize:13, color:C.muted }}>지출 내역 없음</p> :
              Object.entries(expenseByCategory).sort((a,b) => b[1]-a[1]).map(([cat,amt]) => (
                <div key={cat} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:13, color:C.muted }}>{cat}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.rose }}>{amt.toLocaleString()}만원</span>
                </div>
              ))}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", marginTop:4 }}>
              <span style={{ fontSize:13, fontWeight:800, color:C.navy }}>합계</span>
              <span style={{ fontSize:14, fontWeight:900, color:C.rose }}>{totalExpense.toLocaleString()}만원</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign:"center", padding:"16px 0 0", borderTop:`1px solid ${C.border}` }}>
          <p style={{ fontSize:11, color:C.muted }}>본 보고서는 Ownly에서 자동 생성됐습니다 · ownly.kr · {new Date().toLocaleDateString("ko-KR")} 출력</p>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } #report-print-area { display: block !important; } body { background: white !important; } @page { margin: 15mm; } }`}</style>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function ReportsPage() {
  return (
    <PlanGate feature="reports">
      <Suspense fallback={<div className="page-in page-padding" style={{ color:"#8a8a9a", fontSize:13 }}>불러오는 중...</div>}>
        <ReportsContent />
      </Suspense>
    </PlanGate>
  );
}

function ReportsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState(params?.get("tab") === "pdf" ? "pdf" : "chart");

  return (
    <div className="page-in page-padding" style={{ maxWidth:960 }}>
      <div style={{ marginBottom:22 }}>
        <SectionLabel>REPORTS</SectionLabel>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#1a2744" }}>리포트</h1>
        <p style={{ fontSize:13, color:"#8a8a9a", marginTop:3 }}>수익 현황 분석 및 연간 PDF 보고서 출력</p>
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", gap:8, marginBottom:28 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:"10px 20px", borderRadius:11, fontSize:13, fontWeight:700, cursor:"pointer", border:`2px solid ${tab===t.key ? "#1a2744" : "#ebe9e3"}`, background: tab===t.key ? "rgba(26,39,68,0.07)" : "transparent", color: tab===t.key ? "#1a2744" : "#8a8a9a" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "chart" && <ChartTab />}
      {tab === "pdf"   && <PDFTab />} {tab === "excel" && <ExcelTab />}
    </div>
  );
}
