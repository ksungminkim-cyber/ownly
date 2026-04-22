"use client"; import ExcelTab from "./ExcelTab"; import { useState, useEffect, useRef, Suspense } from "react"; import { useRouter, useSearchParams } from "next/navigation"; import { supabase } from "../../../lib/supabase"; import { useApp } from "../../../context/AppContext"; import { SectionLabel } from "../../../components/shared"; import PlanGate from "../../../components/PlanGate"; const C = { navy:"#1a2744", purple:"#5b4fcf", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", indigo:"#3b5bdb", border:"#e8e6e0", surface:"#ffffff", faint:"#f8f7f4", muted:"#8a8a9a" }; const TABS = [ { key:"chart", label:"📊 수익 차트" }, { key:"property", label:"🏢 물건별 비교" }, { key:"pdf", label:"📄 PDF 출력" }, { key:"taxannual", label:"📋 세무사용 연간" }, { key:"excel", label:"📥 엑셀 내보내기" } ];

// ✅ 물건별 수익률 비교 탭
function PropertyCompareTab() {
  const { tenants, payments } = useApp();
  const router = useRouter();
  const [sortBy, setSortBy] = useState("yield"); // yield | income | vacancy

  // 물건별 통계 계산
  const propertyStats = tenants.map(t => {
    const paid = payments.filter(p => p.tid === t.id && p.status === "paid");
    const totalPaid = paid.reduce((s, p) => s + (p.amt || p.amount || 0), 0);
    const monthCount = paid.length;
    const monthlyAvg = monthCount > 0 ? Math.round(totalPaid / monthCount) : (t.rent || 0);

    // 연 수익률: (월세 × 12) / 보증금 × 100
    const annualRent = (t.rent || 0) * 12;
    const dep = t.dep || 0;
    const yieldRate = dep > 0 ? ((annualRent / dep) * 100).toFixed(1) : null;

    // 관리비 포함 연 수익
    const annualWithMaint = annualRent + ((t.maintenance || 0) * 12);

    // 공실 여부
    const isVacant = t.status === "공실";

    // 계약 잔여일
    const endDate = t.end_date || t.end;
    const daysLeft = endDate ? Math.ceil((new Date(endDate) - new Date()) / 86400000) : null;

    // 수납률
    const allPayments = payments.filter(p => p.tid === t.id);
    const payRate = allPayments.length > 0 ? Math.round((paid.length / allPayments.length) * 100) : 100;

    return {
      ...t, totalPaid, monthCount, monthlyAvg,
      annualRent, annualWithMaint, dep,
      yieldRate: yieldRate ? parseFloat(yieldRate) : null,
      isVacant, daysLeft, payRate,
    };
  });

  const sorted = [...propertyStats].sort((a, b) => {
    if (sortBy === "yield") return (b.yieldRate || 0) - (a.yieldRate || 0);
    if (sortBy === "income") return b.annualRent - a.annualRent;
    if (sortBy === "vacancy") return (a.isVacant ? -1 : 1);
    return 0;
  });

  const totalAnnual = propertyStats.reduce((s, p) => s + p.annualRent, 0);
  const avgYield = propertyStats.filter(p => p.yieldRate).length > 0
    ? (propertyStats.filter(p => p.yieldRate).reduce((s, p) => s + (p.yieldRate || 0), 0) / propertyStats.filter(p => p.yieldRate).length).toFixed(1)
    : null;
  const vacantCount = propertyStats.filter(p => p.isVacant).length;
  const maxAnnual = Math.max(...propertyStats.map(p => p.annualRent), 1);

  if (propertyStats.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"60px 20px" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🏢</div>
        <p style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:6 }}>물건이 없습니다</p>
        <p style={{ fontSize:13, color:C.muted, marginBottom:16 }}>물건을 등록하면 수익률을 비교할 수 있습니다</p>
        <button onClick={() => router.push("/dashboard/properties")} style={{ padding:"10px 24px", borderRadius:10, background:C.navy, color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>물건 등록하기 →</button>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 전체 요약 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
        {[
          { label:"보유 물건", value:`${propertyStats.length}개`, color:C.navy, bg:"rgba(26,39,68,0.06)" },
          { label:"연 임대 수입 합계", value:`${totalAnnual.toLocaleString()}만원`, color:C.emerald, bg:"rgba(15,165,115,0.08)" },
          { label:"평균 수익률", value:avgYield ? `${avgYield}%` : "—", color:C.indigo, bg:"rgba(59,91,219,0.08)" },
          { label:"공실 물건", value:`${vacantCount}개`, color:vacantCount > 0 ? C.rose : C.emerald, bg:vacantCount > 0 ? "rgba(232,68,90,0.08)" : "rgba(15,165,115,0.08)" },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, borderRadius:14, padding:"16px 18px" }}>
            <p style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>{k.label}</p>
            <p style={{ fontSize:22, fontWeight:900, color:k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* 정렬 */}
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>정렬:</span>
        {[
          { k:"yield", l:"수익률 순" },
          { k:"income", l:"수입 순" },
          { k:"vacancy", l:"공실 우선" },
        ].map(s => (
          <button key={s.k} onClick={() => setSortBy(s.k)} style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${sortBy===s.k ? C.navy : C.border}`, background:sortBy===s.k ? C.navy : "transparent", color:sortBy===s.k ? "#fff" : C.muted }}>{s.l}</button>
        ))}
      </div>

      {/* 물건별 카드 */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {sorted.map((p, idx) => {
          const typeColor = p.pType === "상가" ? C.amber : p.pType === "토지" ? "#0d9488" : C.indigo;
          const barPct = maxAnnual > 0 ? Math.round((p.annualRent / maxAnnual) * 100) : 0;
          const yieldColor = !p.yieldRate ? C.muted : p.yieldRate >= 6 ? C.emerald : p.yieldRate >= 4 ? C.amber : C.rose;

          return (
            <div key={p.id} style={{ background:"#fff", border:`1.5px solid ${p.isVacant ? C.rose+"40" : C.border}`, borderRadius:16, padding:"18px 20px", borderLeft:`4px solid ${p.isVacant ? C.rose : typeColor}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:14 }}>
                {/* 왼쪽: 물건 정보 */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, background:"#f5f4f0", color:C.muted, padding:"2px 8px", borderRadius:5 }}>#{idx + 1}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:typeColor, background:typeColor+"18", padding:"2px 8px", borderRadius:5 }}>{p.sub || p.pType}</span>
                    {p.isVacant && <span style={{ fontSize:11, fontWeight:700, color:C.rose, background:C.rose+"18", padding:"2px 8px", borderRadius:5 }}>🚨 공실 중</span>}
                    {p.daysLeft !== null && p.daysLeft <= 90 && !p.isVacant && <span style={{ fontSize:11, fontWeight:700, color:C.amber, background:C.amber+"18", padding:"2px 8px", borderRadius:5 }}>⏰ D-{p.daysLeft}</span>}
                  </div>
                  <p style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:4 }}>{p.addr}</p>
                  <p style={{ fontSize:12, color:C.muted }}>{p.name && `${p.name} · `}보증금 {(p.dep||0).toLocaleString()}만원</p>
                </div>

                {/* 오른쪽: 수익률 뱃지 */}
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:28, fontWeight:900, color:yieldColor, lineHeight:1 }}>
                    {p.yieldRate !== null ? `${p.yieldRate}%` : "—"}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>연 수익률</div>
                  {p.yieldRate !== null && (
                    <div style={{ fontSize:10, fontWeight:700, marginTop:3, color:
                      p.yieldRate >= 6 ? C.emerald : p.yieldRate >= 4 ? C.amber : C.rose
                    }}>
                      {p.yieldRate >= 6 ? "✅ 우수" : p.yieldRate >= 4 ? "⚠️ 보통" : "🔴 저조"}
                    </div>
                  )}
                </div>
              </div>

              {/* 수치 그리드 */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:8, marginBottom:14 }}>
                {[
                  { l:"월 임대료", v:`${(p.rent||0).toLocaleString()}만원`, c:C.navy },
                  { l:"관리비", v:p.maintenance ? `${p.maintenance.toLocaleString()}만원` : "—", c:C.amber },
                  { l:"연 수입 합계", v:`${p.annualWithMaint.toLocaleString()}만원`, c:C.emerald },
                  { l:"수납률", v:`${p.payRate}%`, c:p.payRate >= 80 ? C.emerald : C.rose },
                ].map(k => (
                  <div key={k.l} style={{ background:"#f8f7f4", borderRadius:10, padding:"9px 12px" }}>
                    <p style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:3 }}>{k.l}</p>
                    <p style={{ fontSize:14, fontWeight:800, color:k.c }}>{k.v}</p>
                  </div>
                ))}
              </div>

              {/* 수입 비중 바 */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:11, color:C.muted }}>전체 수입 중 비중</span>
                  <span style={{ fontSize:11, fontWeight:700, color:C.navy }}>{barPct}%</span>
                </div>
                <div style={{ height:6, background:"#f0efe9", borderRadius:6, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${barPct}%`, background:p.isVacant ? C.rose : typeColor, borderRadius:6, transition:"width .5s" }} />
                </div>
              </div>

              {/* 공실 중이면 액션 */}
              {p.isVacant && (
                <div style={{ marginTop:12, display:"flex", gap:8 }}>
                  <button onClick={() => router.push("/dashboard/vacancy")} style={{ flex:1, padding:"8px", borderRadius:9, background:C.rose+"12", border:`1px solid ${C.rose}30`, color:C.rose, fontSize:12, fontWeight:700, cursor:"pointer" }}>🚨 공실 관리 →</button>
                  <button onClick={() => router.push("/dashboard/premium/ai-report")} style={{ flex:1, padding:"8px", borderRadius:9, background:"rgba(15,165,115,0.08)", border:"1px solid rgba(15,165,115,0.25)", color:C.emerald, fontSize:12, fontWeight:700, cursor:"pointer" }}>🤖 AI 시세 분석</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 수익률 분포 요약 */}
      {propertyStats.filter(p => p.yieldRate).length > 0 && (
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
          <p style={{ fontSize:13, fontWeight:800, color:C.navy, marginBottom:14 }}>수익률 분포</p>
          <div style={{ display:"flex", gap:8 }}>
            {[
              { label:"6% 이상 (우수)", count:propertyStats.filter(p => (p.yieldRate||0) >= 6).length, color:C.emerald },
              { label:"4~6% (보통)", count:propertyStats.filter(p => (p.yieldRate||0) >= 4 && (p.yieldRate||0) < 6).length, color:C.amber },
              { label:"4% 미만 (저조)", count:propertyStats.filter(p => p.yieldRate && (p.yieldRate||0) < 4).length, color:C.rose },
              { label:"수익률 미산정", count:propertyStats.filter(p => !p.yieldRate).length, color:C.muted },
            ].map(g => (
              <div key={g.label} style={{ flex:1, background:g.color+"10", borderRadius:10, padding:"10px 12px", border:`1px solid ${g.color}25` }}>
                <p style={{ fontSize:20, fontWeight:900, color:g.color, margin:0 }}>{g.count}</p>
                <p style={{ fontSize:10, color:C.muted, marginTop:3, lineHeight:1.4 }}>{g.label}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize:11, color:C.muted, marginTop:12 }}>
            * 수익률 = 연 임대료 ÷ 보증금 × 100. 보증금이 0이거나 미입력 시 산정 불가.
          </p>
        </div>
      )}
    </div>
  );
}

function ChartTab() { const { tenants, payments } = useApp(); const router = useRouter(); const [period, setPeriod] = useState("3m"); const now = new Date(); const periodMonths = period === "3m" ? 3 : period === "6m" ? 6 : 12; const monthlyData = Array.from({ length: periodMonths }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - (periodMonths - 1 - i), 1); const y = d.getFullYear(); const m = d.getMonth() + 1; const paid = payments.filter(p => (p.year || y) === y && (p.month || 0) === m && p.status === "paid"); const income = paid.reduce((s, p) => s + (p.amt || p.amount || 0), 0); const unpaid = payments.filter(p => (p.year || y) === y && (p.month || 0) === m && p.status !== "paid"); const missed = unpaid.reduce((s, p) => s + (p.amt || p.amount || 0), 0); return { label: `${m}월`, year: y, month: m, income, missed }; }); const maxVal = Math.max(...monthlyData.map(d => d.income + d.missed), 1); const totalIncome = monthlyData.reduce((s, d) => s + d.income, 0); const totalMissed = monthlyData.reduce((s, d) => s + d.missed, 0); const avgMonthly = Math.round(totalIncome / periodMonths); const paidRate = totalIncome + totalMissed > 0 ? Math.round((totalIncome / (totalIncome + totalMissed)) * 100) : 100; const hasChartData = monthlyData.some(d => d.income > 0 || d.missed > 0); const tenantStats = tenants.map(t => { const paid = payments.filter(p => p.tid === t.id && p.status === "paid"); const total = payments.filter(p => p.tid === t.id); const rate = total.length > 0 ? Math.round((paid.length / total.length) * 100) : 100; const amt = paid.reduce((s, p) => s + (p.amt || p.amount || 0), 0); return { ...t, paidCount: paid.length, totalCount: total.length, rate, amt }; }); return ( <div style={{ display:"flex", flexDirection:"column", gap:20 }}> <div style={{ display:"flex", gap:8 }}> {[{ k:"3m", l:"3개월" }, { k:"6m", l:"6개월" }, { k:"1y", l:"1년" }].map(p => ( <button key={p.k} onClick={() => setPeriod(p.k)} style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", border:`2px solid ${period===p.k ? C.navy : C.border}`, background: period===p.k ? "rgba(26,39,68,0.07)" : "transparent", color: period===p.k ? C.navy : C.muted }}>{p.l}</button> ))} </div> <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}> {[ { label:"총 수금액", value:`${totalIncome.toLocaleString()}만원`, color:C.emerald, bg:"rgba(15,165,115,0.08)" }, { label:"미수금", value:`${totalMissed.toLocaleString()}만원`, color:C.rose, bg:"rgba(232,68,90,0.08)" }, { label:"월 평균 수금", value:`${avgMonthly.toLocaleString()}만원`, color:C.navy, bg:"rgba(26,39,68,0.06)" }, ].map(k => ( <div key={k.label} style={{ background:k.bg, borderRadius:16, padding:"18px 20px" }}> <p style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>{k.label}</p> <p style={{ fontSize:22, fontWeight:900, color:k.color }}>{k.value}</p> </div> ))} </div> <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px" }}> <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}> <p style={{ fontSize:13, fontWeight:800, color:C.navy }}>월별 수금 현황</p> <div style={{ display:"flex", gap:14, fontSize:11, color:C.muted }}> <span>■ <span style={{ color:C.emerald }}>수금</span></span> <span>■ <span style={{ color:C.rose }}>미수금</span></span> </div> </div> {!hasChartData ? ( <div style={{ height:140, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, background:"rgba(26,39,68,0.02)", borderRadius:10 }}> <span style={{ fontSize:32 }}>📊</span> <p style={{ fontSize:13, color:C.muted, fontWeight:600 }}>아직 수금 데이터가 없어요</p> <p style={{ fontSize:11, color:"#c0c0cc" }}>수금 현황에서 납부 처리하면 차트가 표시됩니다</p> <button onClick={() => router.push("/dashboard/payments")} style={{ marginTop:4, padding:"6px 14px", borderRadius:8, background:C.navy, color:"#fff", border:"none", fontSize:11, fontWeight:700, cursor:"pointer" }}>수금 현황 가기 →</button> </div> ) : ( <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:140 }}> {monthlyData.map(d => ( <div key={d.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}> <span style={{ fontSize:10, color:C.navy, fontWeight:700 }}>{d.income > 0 ? d.income.toLocaleString() : ""}</span> <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:100, gap:2 }}> {d.missed > 0 && <div style={{ width:"100%", height:`${(d.missed/maxVal)*90}px`, background:C.rose, borderRadius:"3px 3px 0 0", minHeight:2 }} />} {d.income > 0 && <div style={{ width:"100%", height:`${(d.income/maxVal)*90}px`, background:C.emerald, borderRadius:"3px 3px 0 0", minHeight:2 }} />} </div> <span style={{ fontSize:10, color:C.muted }}>{d.label}</span> </div> ))} </div> )} </div> <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px" }}> <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}> <p style={{ fontSize:13, fontWeight:800, color:C.navy }}>전체 수납률</p> <p style={{ fontSize:22, fontWeight:900, color: paidRate>=90?C.emerald:paidRate>=70?C.amber:C.rose }}>{paidRate}%</p> </div> <div style={{ height:8, background:"#f0efe9", borderRadius:8, overflow:"hidden", marginBottom:20 }}> <div style={{ height:"100%", width:`${paidRate}%`, background: paidRate>=90?C.emerald:paidRate>=70?C.amber:C.rose, borderRadius:8 }} /> </div> <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:12 }}>세입자별 수금 현황</p> {tenantStats.map(t => ( <div key={t.id} style={{ marginBottom:14 }}> <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}> <div style={{ display:"flex", alignItems:"center", gap:8 }}> <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{t.name}</span> <span style={{ fontSize:11, color:C.muted }}>{t.addr}</span> </div> <span style={{ fontSize:13, fontWeight:800, color: t.rate>=80?C.emerald:C.rose }}>{t.rate}%</span> </div> <div style={{ height:6, background:"#f0efe9", borderRadius:6, overflow:"hidden" }}> <div style={{ height:"100%", width:`${t.rate}%`, background: t.rate>=80?C.emerald:C.rose, borderRadius:6 }} /> </div> <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}> <span style={{ fontSize:11, color:C.muted }}>{t.amt.toLocaleString()}만원 수금</span> <span style={{ fontSize:11, color:C.muted }}>{t.paidCount}/{t.totalCount}개월</span> </div> </div> ))} </div> </div> ); }

function PDFTab() { const { tenants, payments } = useApp(); const [year, setYear] = useState(new Date().getFullYear()); const [repairs, setRepairs] = useState([]); const [ledger, setLedger] = useState([]); const printRef = useRef(); useEffect(() => { const load = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const [r, l] = await Promise.all([ supabase.from("repairs").select("*").eq("user_id", user.id), supabase.from("ledger").select("*").eq("user_id", user.id), ]); setRepairs(r.data || []); setLedger(l.data || []); }; load(); }, []); const handlePrint = () => { const style = document.createElement("style"); style.innerHTML = `@media print { body > *:not(#report-print-area) { display:none!important; } #report-print-area { display:block!important; } @page { margin: 20mm; } }`; document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000); }; const yearPayments = payments.filter(p => (p.year || new Date().getFullYear()) === year); const yearLedger = ledger.filter(l => new Date(l.date).getFullYear() === year); const yearRepairs = repairs.filter(r => new Date(r.date).getFullYear() === year); const rentIncome = yearPayments.filter(p => p.status === "paid").reduce((s,p) => s+(p.amt||p.amount||0), 0); const ledgerIncome = yearLedger.filter(l => l.type === "income").reduce((s,l) => s+(l.amount||0), 0); const totalIncome = rentIncome + ledgerIncome; const repairCost = yearRepairs.reduce((s,r) => s+(r.cost||0), 0); const ledgerExpense = yearLedger.filter(l => l.type === "expense").reduce((s,l) => s+(l.amount||0), 0); const totalExpense = repairCost + ledgerExpense; const netIncome = totalIncome - totalExpense; const currentMonth = new Date().getMonth() + 1; const tenantSummary = tenants.map(t => { const paid = yearPayments.filter(p => p.tid === t.id && p.status === "paid"); const paidAmt = paid.reduce((s,p) => s+(p.amt||p.amount||0), 0); const startDate = t.start_date ? new Date(t.start_date) : null; const endDate = t.end_date ? new Date(t.end_date) : null; const yearStart = new Date(year, 0, 1); const yearEnd = new Date(year, 11, 31); const effectiveStart = startDate && startDate > yearStart ? startDate : yearStart; const effectiveEnd = endDate && endDate < yearEnd ? endDate : new Date(year, currentMonth-1, 1); const validMonths = Math.max(1, (effectiveEnd.getFullYear()-effectiveStart.getFullYear())*12+effectiveEnd.getMonth()-effectiveStart.getMonth()+1); const expectedAmt = (t.rent||0) * validMonths; const rate = expectedAmt > 0 ? Math.min(100, Math.round((paidAmt/expectedAmt)*100)) : 0; return { ...t, paidAmt, paidMonths: paid.length, expectedAmt, validMonths, rate }; }); const monthlyIncome = Array.from({ length:12 }, (_,i) => { const m = i+1; const rent = yearPayments.filter(p => p.status==="paid" && (p.month||0)===m).reduce((s,p) => s+(p.amt||p.amount||0), 0); const other = yearLedger.filter(l => l.type==="income" && new Date(l.date).getMonth()+1===m).reduce((s,l) => s+(l.amount||0), 0); return { m, rent, other, total: rent+other }; }); const maxMonthly = Math.max(...monthlyIncome.map(m => m.total), 1); const expenseByCategory = {}; yearRepairs.forEach(r => { expenseByCategory[r.category] = (expenseByCategory[r.category]||0)+(r.cost||0); }); yearLedger.filter(l => l.type === "expense").forEach(l => { expenseByCategory[l.category] = (expenseByCategory[l.category]||0)+(l.amount||0); }); return ( <div> <div className="no-print" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}> <p style={{ fontSize:13, color:C.muted }}>연도를 선택하고 PDF로 출력하세요</p> <div style={{ display:"flex", gap:8, alignItems:"center" }}> <div style={{ display:"flex", alignItems:"center", gap:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"7px 11px" }}> <button onClick={() => setYear(y => y-1)} style={{ width:26, height:26, borderRadius:7, border:"none", background:C.faint, cursor:"pointer", fontSize:14 }}>‹</button> <span style={{ fontSize:13, fontWeight:700, color:C.navy, minWidth:58, textAlign:"center" }}>{year}년</span> <button onClick={() => setYear(y => y+1)} style={{ width:26, height:26, borderRadius:7, border:"none", background:C.faint, cursor:"pointer", fontSize:14 }}>›</button> </div> <button onClick={handlePrint} style={{ padding:"10px 22px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>🖨️ PDF 출력</button> </div> </div> <div id="report-print-area" ref={printRef}> <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, paddingBottom:16, borderBottom:`2px solid ${C.navy}` }}> <div> <h2 style={{ fontSize:22, fontWeight:900, color:C.navy, marginBottom:3 }}>Ownly — 임대 수익 보고서</h2> <p style={{ fontSize:13, color:C.muted }}>{year}년 1월 1일 ~ {year}년 12월 31일 · 임차인 {tenants.length}명</p> </div> <div style={{ textAlign:"right" }}> <p style={{ fontSize:11, color:C.muted }}>출력일: {new Date().toLocaleDateString("ko-KR")}</p> <p style={{ fontSize:11, color:C.muted }}>ownly.kr</p> </div> </div> <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:13, marginBottom:20 }}> {[ { label:"연간 총 수입", value:`${totalIncome.toLocaleString()}만원`, color:C.emerald, bg:"rgba(15,165,115,0.08)", border:C.emerald }, { label:"연간 총 지출", value:`${totalExpense.toLocaleString()}만원`, color:C.rose, bg:"rgba(232,68,90,0.08)", border:C.rose }, { label:"연간 순수익", value:`${netIncome.toLocaleString()}만원`, color:netIncome>=0?C.indigo:C.rose, bg:netIncome>=0?"rgba(59,91,219,0.08)":"rgba(232,68,90,0.08)", border:netIncome>=0?C.indigo:C.rose }, ].map(k => ( <div key={k.label} style={{ background:k.bg, border:`1.5px solid ${k.border}30`, borderRadius:14, padding:"18px 20px" }}> <p style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>{k.label}</p> <p style={{ fontSize:24, fontWeight:900, color:k.color }}>{k.value}</p> </div> ))} </div> <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px", marginBottom:16 }}> <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>월별 수입 현황</p> <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:90, marginBottom:8 }}> {monthlyIncome.map(d => ( <div key={d.m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}> <span style={{ fontSize:9, color:C.navy, fontWeight:700 }}>{d.total > 0 ? d.total : ""}</span> <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:64 }}> {d.rent > 0 && <div style={{ width:"100%", height:`${(d.rent/maxMonthly)*60}px`, background:C.emerald, borderRadius:"3px 3px 0 0", minHeight:2 }} />} {d.other > 0 && <div style={{ width:"100%", height:`${(d.other/maxMonthly)*60}px`, background:C.indigo, borderRadius:"3px 3px 0 0", minHeight:2 }} />} </div> <span style={{ fontSize:9, color:C.muted }}>{d.m}월</span> </div> ))} </div> </div> <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}> <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}> <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>임차인별 수금 현황</p> {tenantSummary.length === 0 ? <p style={{ fontSize:13, color:C.muted }}>임차인 없음</p> : tenantSummary.map(t => ( <div key={t.id} style={{ marginBottom:12 }}> <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}> <span style={{ fontSize:12, fontWeight:700, color:C.navy }}>{t.name}</span> <span style={{ fontSize:12, fontWeight:700, color: t.rate>=80?C.emerald:C.rose }}>{t.rate}%</span> </div> <div style={{ height:6, background:"#f0efe9", borderRadius:6, overflow:"hidden" }}> <div style={{ height:"100%", width:`${t.rate}%`, background: t.rate>=80?C.emerald:C.rose, borderRadius:6 }} /> </div> <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}> <span style={{ fontSize:10, color:C.muted }}>{t.paidAmt.toLocaleString()}만원</span> <span style={{ fontSize:10, color:C.muted }}>{t.paidMonths}/{t.validMonths}개월</span> </div> </div> ))} </div> <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}> <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>지출 항목별</p> {Object.entries(expenseByCategory).length === 0 ? <p style={{ fontSize:13, color:C.muted }}>지출 내역 없음</p> : Object.entries(expenseByCategory).sort((a,b) => b[1]-a[1]).map(([cat,amt]) => ( <div key={cat} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}> <span style={{ fontSize:13, color:C.muted }}>{cat}</span> <span style={{ fontSize:13, fontWeight:700, color:C.rose }}>{amt.toLocaleString()}만원</span> </div> ))} <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", marginTop:4 }}> <span style={{ fontSize:13, fontWeight:800, color:C.navy }}>합계</span> <span style={{ fontSize:14, fontWeight:900, color:C.rose }}>{totalExpense.toLocaleString()}만원</span> </div> </div> </div> <div style={{ textAlign:"center", padding:"16px 0 0", borderTop:`1px solid ${C.border}` }}> <p style={{ fontSize:11, color:C.muted }}>본 보고서는 Ownly에서 자동 생성됐습니다 · ownly.kr · {new Date().toLocaleDateString("ko-KR")} 출력</p> </div> </div> <style>{`@media print { .no-print { display: none !important; } #report-print-area { display: block !important; } body { background: white !important; } @page { margin: 15mm; } }`}</style> </div> ); }

export default function ReportsPage() { return ( <PlanGate feature="reports"> <Suspense fallback={<div className="page-in page-padding" style={{ color:"#8a8a9a", fontSize:13 }}>불러오는 중...</div>}> <ReportsContent /> </Suspense> </PlanGate> ); }

function TaxAnnualTab() {
  const router = useRouter();
  return (
    <div style={{ background: "linear-gradient(135deg,rgba(91,79,207,0.04),rgba(26,39,68,0.04))", border: "1.5px solid rgba(91,79,207,0.2)", borderRadius: 18, padding: "36px 32px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>📋</div>
      <h3 style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>세무사 제출용 연간 결산 보고서</h3>
      <p style={{ fontSize: 13, color: "#6a6a7a", lineHeight: 1.8, marginBottom: 20, maxWidth: 480, margin: "0 auto 20px" }}>
        1년치 임대 수입·경비·예상 세액을 <b style={{ color: "#1a2744" }}>공식 손익계산서 양식</b>으로 자동 작성합니다.<br/>
        세무사에게 바로 제출할 수 있는 A4 PDF로 출력 가능해요.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360, margin: "0 auto 20px", fontSize: 12, color: "#6a6a7a", textAlign: "left" }}>
        {[
          "임대인 기본 정보 + 사업자번호",
          "총수입 · 필요경비 · 순임대소득 요약",
          "물건/임차인별 월별 매트릭스 (12개월)",
          "필요경비 항목별 분류 (수선비·이자·재산세 등)",
          "종합소득세 참고 추정치 + 법적 고지",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <span style={{ color: "#0fa573", fontWeight: 800 }}>✓</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      <button onClick={() => router.push("/dashboard/reports/tax-annual")}
        style={{ padding: "12px 28px", borderRadius: 11, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 20px rgba(91,79,207,0.25)" }}>
        세무사용 리포트 열기 →
      </button>
      <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 16 }}>
        💡 설정 → 임대인 정보에서 성명·주소·사업자번호를 입력하면 리포트에 자동 채워집니다
      </p>
    </div>
  );
}

function ReportsContent() { const router = useRouter(); const params = useSearchParams(); const [tab, setTab] = useState(params?.get("tab") === "pdf" ? "pdf" : params?.get("tab") === "property" ? "property" : "chart"); return ( <div className="page-in page-padding" style={{ maxWidth:960 }}> <div style={{ marginBottom:22 }}> <SectionLabel>REPORTS</SectionLabel> <h1 style={{ fontSize:24, fontWeight:800, color:"#1a2744" }}>리포트</h1> <p style={{ fontSize:13, color:"#8a8a9a", marginTop:3 }}>수익 현황 분석 및 연간 PDF 보고서 출력</p> </div> <div style={{ display:"flex", gap:8, marginBottom:28, flexWrap:"wrap" }}> {TABS.map(t => ( <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:"10px 20px", borderRadius:11, fontSize:13, fontWeight:700, cursor:"pointer", border:`2px solid ${tab===t.key ? "#1a2744" : "#ebe9e3"}`, background: tab===t.key ? "rgba(26,39,68,0.07)" : "transparent", color: tab===t.key ? "#1a2744" : "#8a8a9a" }}> {t.label} </button> ))} </div> {tab === "chart" && <ChartTab />} {tab === "property" && <PropertyCompareTab />} {tab === "pdf" && <PDFTab />} {tab === "taxannual" && <TaxAnnualTab />} {tab === "excel" && <ExcelTab />} </div> ); }
