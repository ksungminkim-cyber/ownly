"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../context/AppContext";
import { SectionLabel } from "../../../components/shared";

const C = { navy:"#1a2744", purple:"#5b4fcf", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", indigo:"#3b5bdb", border:"#e8e6e0", surface:"#ffffff", faint:"#f8f7f4", muted:"#8a8a9a" };

export default function ReportPDFPage() {
  const { tenants, payments } = useApp();
  const [year, setYear] = useState(new Date().getFullYear());
  const [repairs, setRepairs] = useState([]);
  const [ledger, setLedger] = useState([]);
  const printRef = useRef();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [r, l] = await Promise.all([
        supabase.from("repairs").select("*").eq("user_id", user.id),
        supabase.from("ledger").select("*").eq("user_id", user.id),
      ]);
      setRepairs(r.data || []);
      setLedger(l.data || []);
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

  // 연도 필터
  const yearPayments = payments.filter(p => (p.year || new Date().getFullYear()) === year);
  const yearLedger   = ledger.filter(l => new Date(l.date).getFullYear() === year);
  const yearRepairs  = repairs.filter(r => new Date(r.date).getFullYear() === year);

  // 수입 계산
  const rentIncome    = yearPayments.filter(p=>p.status==="paid").reduce((s,p)=>s+(p.amt||p.amount||0),0);
  const ledgerIncome  = yearLedger.filter(l=>l.type==="income").reduce((s,l)=>s+(l.amount||0),0);
  const totalIncome   = rentIncome + ledgerIncome;

  // 지출 계산
  const repairCost    = yearRepairs.reduce((s,r)=>s+(r.cost||0),0);
  const ledgerExpense = yearLedger.filter(l=>l.type==="expense").reduce((s,l)=>s+(l.amount||0),0);
  const totalExpense  = repairCost + ledgerExpense;
  const netIncome     = totalIncome - totalExpense;

  // 월별 수입
  const monthlyIncome = Array.from({length:12},(_,i)=>{
    const m = i+1;
    const rent = yearPayments.filter(p=>p.status==="paid"&&(p.month||0)===m).reduce((s,p)=>s+(p.amt||p.amount||0),0);
    const other = yearLedger.filter(l=>l.type==="income"&&new Date(l.date).getMonth()+1===m).reduce((s,l)=>s+(l.amount||0),0);
    return { m, rent, other, total:rent+other };
  });

  // 임차인별 수금 현황
  const tenantSummary = tenants.map(t => {
    const paid = yearPayments.filter(p=>p.tid===t.id&&p.status==="paid");
    const paidAmt = paid.reduce((s,p)=>s+(p.amt||p.amount||0),0);
    const expectedAmt = (t.rent||0) * 12;
    const rate = expectedAmt > 0 ? Math.round((paidAmt/expectedAmt)*100) : 0;
    return { ...t, paidAmt, paidMonths:paid.length, expectedAmt, rate };
  });

  // 지출 카테고리별
  const expenseByCategory = {};
  yearRepairs.forEach(r => { expenseByCategory[r.category] = (expenseByCategory[r.category]||0) + (r.cost||0); });
  yearLedger.filter(l=>l.type==="expense").forEach(l => { expenseByCategory[l.category] = (expenseByCategory[l.category]||0) + (l.amount||0); });

  const maxMonthly = Math.max(...monthlyIncome.map(m=>m.total), 1);

  return (
    <div className="page-in page-padding" style={{ maxWidth:900 }}>
      {/* 컨트롤 (인쇄 제외) */}
      <div className="no-print" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:26, flexWrap:"wrap", gap:12 }}>
        <div>
          <SectionLabel>ANNUAL REPORT</SectionLabel>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, letterSpacing:"-.4px" }}>건물 수익 리포트</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:3 }}>연간 수입·지출·수익을 한 장으로 정리해 PDF로 출력하세요</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"7px 11px" }}>
            <button onClick={()=>setYear(y=>y-1)} style={{ width:26,height:26,borderRadius:7,border:"none",background:C.faint,cursor:"pointer",fontSize:14 }}>‹</button>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy, minWidth:58, textAlign:"center" }}>{year}년</span>
            <button onClick={()=>setYear(y=>y+1)} style={{ width:26,height:26,borderRadius:7,border:"none",background:C.faint,cursor:"pointer",fontSize:14 }}>›</button>
          </div>
          <button onClick={handlePrint}
            style={{ padding:"10px 22px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:`0 4px 16px ${C.navy}30` }}>
            🖨️ PDF 출력
          </button>
        </div>
      </div>

      {/* === 인쇄 영역 === */}
      <div id="report-print-area" ref={printRef}>

        {/* 리포트 헤더 */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, paddingBottom:16, borderBottom:`2px solid ${C.navy}` }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:900, color:C.navy, marginBottom:3 }}>Ownly by McLean — 임대 수익 보고서</h2>
            <p style={{ fontSize:13, color:C.muted }}>{year}년 1월 1일 ~ {year}년 12월 31일 · 임차인 {tenants.length}명</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:11, color:C.muted }}>출력일: {new Date().toLocaleDateString("ko-KR")}</p>
            <p style={{ fontSize:11, color:C.muted }}>ownly.kr</p>
          </div>
        </div>

        {/* 핵심 지표 3개 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:13, marginBottom:20 }}>
          {[
            { label:"연간 총 수입", value:`${totalIncome.toLocaleString()}만원`, color:C.emerald, bg:"rgba(15,165,115,0.08)", border:C.emerald },
            { label:"연간 총 지출", value:`${totalExpense.toLocaleString()}만원`, color:C.rose, bg:"rgba(232,68,90,0.08)", border:C.rose },
            { label:"연간 순수익", value:`${netIncome.toLocaleString()}만원`, color:netIncome>=0?C.indigo:C.rose, bg:netIncome>=0?"rgba(59,91,219,0.08)":"rgba(232,68,90,0.08)", border:netIncome>=0?C.indigo:C.rose },
          ].map(k=>(
            <div key={k.label} style={{ background:k.bg, border:`1.5px solid ${k.border}30`, borderRadius:14, padding:"18px 20px" }}>
              <p style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>{k.label}</p>
              <p style={{ fontSize:24, fontWeight:900, color:k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* 월별 수입 차트 */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px", marginBottom:16 }}>
          <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>월별 수입 현황</p>
          <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:90, marginBottom:8 }}>
            {monthlyIncome.map(d=>(
              <div key={d.m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <span style={{ fontSize:9, color:C.navy, fontWeight:700 }}>{d.total>0?d.total:""}</span>
                <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:64 }}>
                  {d.rent>0&&<div style={{ width:"100%", height:`${(d.rent/maxMonthly)*60}px`, background:C.emerald, borderRadius:"3px 3px 0 0", minHeight:2 }} />}
                  {d.other>0&&<div style={{ width:"100%", height:`${(d.other/maxMonthly)*60}px`, background:C.indigo, borderRadius:"3px 3px 0 0", minHeight:2 }} />}
                </div>
                <span style={{ fontSize:9, color:C.muted }}>{d.m}월</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:16 }}>
            <span style={{ fontSize:11, color:C.emerald }}>■ 월세수입</span>
            <span style={{ fontSize:11, color:C.indigo }}>■ 기타수입</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          {/* 임차인별 수금 현황 */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
            <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>임차인별 수금 현황</p>
            {tenantSummary.length === 0
              ? <p style={{ fontSize:13, color:C.muted }}>임차인 없음</p>
              : tenantSummary.map(t=>(
                <div key={t.id} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.navy }}>{t.name}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:t.rate>=80?C.emerald:C.rose }}>{t.rate}%</span>
                  </div>
                  <div style={{ height:6, background:"#f0efe9", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${t.rate}%`, background:t.rate>=80?C.emerald:C.rose, borderRadius:6, transition:"width .3s" }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
                    <span style={{ fontSize:10, color:C.muted }}>{t.paidAmt.toLocaleString()}만원 수금</span>
                    <span style={{ fontSize:10, color:C.muted }}>{t.paidMonths}개월</span>
                  </div>
                </div>
              ))
            }
          </div>

          {/* 지출 항목별 */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
            <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>지출 항목별</p>
            {Object.entries(expenseByCategory).length === 0
              ? <p style={{ fontSize:13, color:C.muted }}>지출 내역 없음</p>
              : Object.entries(expenseByCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
                <div key={cat} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:13, color:C.muted }}>{cat}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.rose }}>{amt.toLocaleString()}만원</span>
                </div>
              ))
            }
            <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", marginTop:4 }}>
              <span style={{ fontSize:13, fontWeight:800, color:C.navy }}>합계</span>
              <span style={{ fontSize:14, fontWeight:900, color:C.rose }}>{totalExpense.toLocaleString()}만원</span>
            </div>
          </div>
        </div>

        {/* 수리이력 요약 */}
        {yearRepairs.length > 0 && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px", marginBottom:16 }}>
            <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>수리·유지보수 내역 ({yearRepairs.length}건)</p>
            <div style={{ display:"grid", gridTemplateColumns:"80px 80px 1fr 80px 80px", gap:8, padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
              {["날짜","분류","물건/메모","업체","비용"].map(h=><span key={h} style={{ fontSize:10, color:C.muted, fontWeight:700 }}>{h}</span>)}
            </div>
            {yearRepairs.slice(0,10).map(r=>(
              <div key={r.id} style={{ display:"grid", gridTemplateColumns:"80px 80px 1fr 80px 80px", gap:8, padding:"7px 0", borderBottom:`1px solid ${C.faint}`, alignItems:"center" }}>
                <span style={{ fontSize:11, color:C.muted }}>{r.date}</span>
                <span style={{ fontSize:11, color:C.navy, fontWeight:600 }}>{r.category}</span>
                <span style={{ fontSize:12, color:C.navy }}>{r.property_name||""}{r.memo?` — ${r.memo}`:""}</span>
                <span style={{ fontSize:11, color:C.muted }}>{r.vendor||"-"}</span>
                <span style={{ fontSize:12, fontWeight:700, color:C.rose }}>{(r.cost||0).toLocaleString()}만원</span>
              </div>
            ))}
            {yearRepairs.length > 10 && <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>외 {yearRepairs.length-10}건 생략</p>}
          </div>
        )}

        {/* 푸터 */}
        <div style={{ textAlign:"center", padding:"16px 0 0", borderTop:`1px solid ${C.border}` }}>
          <p style={{ fontSize:11, color:C.muted }}>본 보고서는 Ownly by McLean에서 자동 생성됐습니다 · ownly.kr · {new Date().toLocaleDateString("ko-KR")} 출력</p>
          <p style={{ fontSize:10, color:C.muted, marginTop:3 }}>※ 이 보고서는 참고용이며, 정확한 세무 신고는 전문가와 상담하시기 바랍니다</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          #report-print-area { display: block !important; }
          body { background: white !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>
  );
}
