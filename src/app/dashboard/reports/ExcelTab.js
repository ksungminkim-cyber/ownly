"use client";
import { useState } from "react";
import { useApp } from "../../../context/AppContext";

const C = {
  navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a",
  amber:"#e8960a", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4",
};

// ExcelJS 로더 — public/exceljs.min.js (로컬)
async function loadExcelJS() {
  if (window.ExcelJS) return window.ExcelJS;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "/exceljs.min.js";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.ExcelJS;
}

// ── 스타일 헬퍼 ──────────────────────────────────────────────────────
const P = {
  navy:  { argb:"FF1A2744" }, white: { argb:"FFFFFFFF" },
  green: { argb:"FF0FA573" }, lgreen:{ argb:"FFE8F7F2" },
  amber: { argb:"FFE8960A" }, lamber:{ argb:"FFFFF8E6" },
  red:   { argb:"FFE8445A" }, lred:  { argb:"FFFEF2F4" },
  gray:  { argb:"FF8A8A9A" }, lgray: { argb:"FFF8F7F4" },
  border:{ argb:"FFE8E6E0" },
};

function applyBorder(ws, range) {
  const thin = { style:"thin", color:{ argb:P.border.argb } };
  const med  = { style:"medium", color:{ argb:"FF1A2744" } };
  ws.getCell(range).border = {
    top:thin, bottom:med, left:thin, right:thin,
  };
}

function headerRow(ws, cols, text, bgColor=P.navy, sz=13) {
  ws.mergeCells(1, 1, 1, cols);
  const cell = ws.getCell("A1");
  cell.value = text;
  cell.font = { bold:true, size:sz, color:P.white };
  cell.fill = { type:"pattern", pattern:"solid", fgColor:bgColor };
  cell.alignment = { horizontal:"center", vertical:"middle" };
  ws.getRow(1).height = 32;
}

function colHdr(ws, r, arr, bgColor=P.navy) {
  arr.forEach((v,i) => {
    const cell = ws.getCell(r, i+1);
    cell.value = v;
    cell.font = { bold:true, size:10, color:P.white };
    cell.fill = { type:"pattern", pattern:"solid", fgColor:bgColor };
    cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
    cell.border = {
      top:{ style:"thin", color:P.border },
      bottom:{ style:"medium", color:P.navy },
      left:{ style:"thin", color:P.border },
      right:{ style:"thin", color:P.border },
    };
  });
  ws.getRow(r).height = 26;
}

function dataRow(ws, r, cells) {
  cells.forEach(({ v, align="left", numFmt, bgColor, color, bold, sz }) => {
    const col = cells.indexOf({ v, align, numFmt, bgColor, color, bold, sz }) + 1;
  });
  // 직접 인덱스로 처리
  cells.forEach((cell, i) => {
    const c = ws.getCell(r, i+1);
    c.value = cell.v !== undefined ? cell.v : cell;
    if (cell.align) c.alignment = { horizontal:cell.align, vertical:"middle" };
    if (cell.numFmt) c.numFmt = cell.numFmt;
    if (cell.bgColor) c.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:cell.bgColor } };
    if (cell.color) c.font = { color:{ argb:cell.color }, bold:cell.bold||false, size:cell.sz||9 };
    c.border = {
      top:{ style:"thin", color:P.border },
      bottom:{ style:"thin", color:P.border },
      left:{ style:"thin", color:P.border },
      right:{ style:"thin", color:P.border },
    };
  });
  ws.getRow(r).height = 26;
}

function sumRow(ws, r, cols, cells) {
  cells.forEach((cell, i) => {
    const c = ws.getCell(r, i+1);
    c.value = cell.v !== undefined ? cell.v : cell;
    if (cell.align) c.alignment = { horizontal:cell.align };
    if (cell.numFmt) c.numFmt = cell.numFmt;
    c.font = { bold:true, size:10, color:{ argb: cell.color || "FF1A2744" } };
    c.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFF0EFE9" } };
    c.border = {
      top:{ style:"medium", color:P.navy },
      bottom:{ style:"thin", color:P.border },
      left:{ style:"thin", color:P.border },
      right:{ style:"thin", color:P.border },
    };
  });
  ws.getRow(r).height = 26;
}

// ── 수금 내역 시트 ──────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────
async function buildXlsx({ year, tenants, payments, repairs, ledger }) {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = "온리(Ownly)";
  wb.created = new Date();

  // ── ① 임대수입현황 ──────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────
  const w1 = wb.addWorksheet("① 임대수입현황");
  w1.views = [{ showGridLines:false }];
  w1.columns = [{width:5},{width:14},{width:20},{width:12},{width:12},{width:12},{width:14}];

  headerRow(w1, 7, `${year}년 임대수입 현황 — 온리(Ownly)`);
  colHdr(w1, 2, ["No.","세입자","주소","임대유형","월세(만)","관리비(만)","연간수입(만)"]);

  const yp = (payments||[]).filter(p=>(p.year||new Date().getFullYear())===year);
  let r = 3;
  let totalAnnual = 0;

  tenants.forEach((t, i) => {
    const pType = t.pType || t.type || "월세";
    const ann   = (t.rent||0) * 12;
    const isCom = pType === "관리비";
    totalAnnual += ann;
    dataRow(w1, r, [
      { v:i+1, align:"center" },
      { v:t.name, bold:true },
      { v:t.addr || t.address || "" },
      { v:pType, align:"center",
        bgColor: isCom ? "FFFFF8E6" : pType==="전세" ? "FFE8F7F2" : undefined,
        color:   isCom ? "FFB8860B" : pType==="전세" ? "FF0FA573" : undefined },
      { v:t.rent||0, align:"right", numFmt:'#,##0"만"' },
      { v:t.mgmt||0, align:"right", numFmt:'#,##0"만"' },
      { v:ann, align:"right", numFmt:'#,##0"만"', bold:true, color:"FF1A2744" },
    ]);
    r++;
  });

  sumRow(w1, r, 7, [
    { v:"합계", align:"right" },
    { v:"" }, { v:"" }, { v:"" }, { v:"" },
    { v:totalAnnual, align:"right", numFmt:'#,##0"만"', color:P.green.argb },
    { v:"" },
  ]);
  r++;

  // 연간 절약 (10% 할인)
  dataRow(w1, r, [
    { v:"", align:"right" },
    { v:"" }, { v:"" },
    { v:`연간 할인 적용 시 (10%) 절약`, bgColor:"FFFFFFBE" },
    Math.round(totalAnnual*0.1),
    { v:"연간 할인 절약", align:"right" }, { v:P.amber, false:9 },
  ]);
  r++;

  // ── ② 수금내역 ─────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────
  const w2 = wb.addWorksheet("② 수금내역");
  w2.views = [{ showGridLines:false }];
  w2.columns = [{width:5},{width:8},{width:18},{width:16},{width:14},{width:14},{width:14}];

  titleRow(w2, 7, `${year}년 수금내역`);
  colHdr(w2, 2, ["No.","월","세입자","주소","금액(만)","상태","납부일"]);

  const paidRows = yp.sort((a,b)=>(a.month||0)-(b.month||0));
  let totalPaid = 0, totalUnpaid = 0;
  let rr = 3;
  paidRows.forEach((p, i) => {
    const t2 = tenants.find(t=>t.id===p.tenant_id)||{};
    const isPaid = p.status==="paid";
    totalPaid += isPaid ? (p.amount||0) : 0;
    totalUnpaid += !isPaid ? (p.amount||0) : 0;
    dataRow(w2, rr, [
      { v:i+1, align:"center" },
      { v:`${p.month||""}월`, align:"center" },
      { v:t2.name||"" },
      { v:t2.addr||t2.address||"" },
      { v:p.amount||0, align:"right", numFmt:'#,##0"만"' },
      { v:isPaid?"납부":"미납", align:"center",
        bgColor: isPaid?"FFE8F7F2":"FFFEF2F4",
        color:   isPaid? P.green.argb : P.red.argb, bold:true },
      { v:p.paid_at ? p.paid_at.slice(0,10) : "", align:"center" },
    ]);
    rr++;
  });
  sumRow(w2, rr, 7, [
    { v:"합계", align:"right" },
    { v:"" },{ v:"" },{ v:"" },
    { v:totalPaid, align:"right", numFmt:'#,##0"만"', color:P.green.argb },
    { v:`미납: ${totalUnpaid.toLocaleString()}만` },
    { v:"" },
  ]);

  // ── ③ 수리비 ───────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────
  const w3 = wb.addWorksheet("③ 수리비·지출");
  w3.views = [{ showGridLines:false }];
  w3.columns = [{width:5},{width:10},{width:20},{width:18},{width:14},{width:14},{width:12}];
  titleRow(w3, 7, `${year}년 수리비·지출`);
  colHdr(w3, 2, ["No.","날짜","세입자","내용","금액(만)","업체","영수증"]);

  const yr = (repairs||[]).filter(x=>{
    const d=new Date(x.date||x.created_at||""); return d.getFullYear()===year;
  });
  let totalExp = 0;
  yr.forEach((rep, i) => {
    const t3 = tenants.find(t=>t.id===rep.tenant_id)||{};
    totalExp += rep.cost||0;
    dataRow(w3, 3+i, [
      { v:i+1, align:"center" },
      { v:(rep.date||"").slice(0,10), align:"center" },
      { v:t3.name||"" },
      { v:rep.desc||rep.description||"" },
      { v:rep.cost||0, align:"right", numFmt:'#,##0"만"' },
      { v:rep.vendor||"" },
      { v:rep.receipt?"O":"", align:"center" },
    ]);
  });
  sumRow(w3, r, 7, [
    { v:"합계", align:"right" },
    { v:"" },{ v:"" },{ v:"" },
    { v:totalExp, align:"right", numFmt:'#,##0"만"', color:P.red.argb },
    { v:"" },{ v:"" },
  ]);
  r++;

  // 공백 빈 행
  w3.getRow(r).height = 6; r++;

  // ── ④ 세금 시뮬레이션 요약 ─────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────
  const w4 = wb.addWorksheet("④ 세금신고참고");
  w4.views = [{ showGridLines:false }];
  w4.columns = [{width:28},{width:20},{width:20},{width:8}];

  titleRow(w4, 4, `${year}년 세금 신고 참고자료`);

  colHdr(w4, r, 3, "  🌿 세금 신고 참고자료");  r++;
  colHdr(w4, r, ["항목","금액(만원)","비고"]);  r++;
  [
    ["임대 수입현황 (연간)", totalAnnual, "임대수입 시트 참조", P.green, P.lgreen],
    ["실제 수금액 (납부됨)", totalPaid,   "수금내역 시트 참조", P.green, P.lgreen],
    ["수리비·필요경비 (10% 할인)",
      Math.round(totalAnnual*0.1),
      "연간 할인 절약", P.amber, "FFFFFFBE", false, 9],
  ].forEach(([a,b,c_,col,bg,bold,sz]) => {
    dataRow(w4, r, [
      { v:a, bold, color:col?.argb, bgColor:bg||null, sz:sz||9 },
      { v:b, align:"right", numFmt:'#,##0', color:col?.argb },
      { v:c_, align:"left" },
      { v:"" },
    ]);
    r++;
  });

  // 순수익
  const netIncome = totalPaid - totalExp;
  colHdr(w4, r, ["순수익 (수금-지출)", netIncome, "세금 신고 기준 참고", P.navy]);
  r++;

  // 저장
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `온리_세금신고자료_${year}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────
export default function ExcelTab() {
  const { tenants, payments, repairs, ledger } = useApp();
  const [year,    setYear]    = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const yp = (payments||[]).filter(p=>(p.year||new Date().getFullYear())===year);
  const yr = (repairs||[]).filter(x=>new Date(x.date||x.created_at||"").getFullYear()===year);
  const yl = (ledger||[]).filter(x=>new Date(x.date||"").getFullYear()===year);

  const totalPaid   = yp.filter(p=>p.status==="paid").reduce((s,p)=>s+(p.amount||0),0);
  const totalExp    = yr.reduce((s,r)=>s+(r.cost||0),0)+yl.reduce((s,l)=>s+(l.amount||0),0);
  const totalAnnual = tenants.reduce((s,t)=>s+(t.rent||0)*12,0);

  async function handleExport() {
    setLoading(true);
    try {
      await buildXlsx({ year, tenants, payments, repairs, ledger });
    } catch(e) {
      alert("엑셀 생성 오류: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const kvs = [
    { l:"수금 완료",      v:`${totalPaid.toLocaleString()}만원`,   c:C.emerald, bold:true },
    { l:"미수금",         v:`${(totalAnnual-totalPaid).toLocaleString()}만원`, c:C.rose },
    { l:"수리비·지출",   v:`${totalExp.toLocaleString()}만원`,    c:C.amber },
    { l:"순수익 (추정)", v:`${(totalPaid-totalExp).toLocaleString()}만원`, c:C.navy, bold:true },
  ];

  return (
    <div style={{ maxWidth:720, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ background:"rgba(26,39,68,0.04)", border:"1px solid rgba(26,39,68,0.12)", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
        <p style={{ fontSize:14, fontWeight:800, color:C.navy, marginBottom:4 }}>📊 세금 신고 참고자료 엑셀 다운로드</p>
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.8 }}>
          임대 수입·수금 내역·수리비·세금 요약을 한 파일로 내보냅니다.<br/>
          <span style={{ color:C.amber }}>» 매년 5월 종합소득세 신고 시 참고 자료로 활용하세요.</span>
        </p>
      </div>

      {/* 연도 선택 */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {[year-1, year, year+1].map(y => (
          <button key={y} onClick={() => setYear(y)}
            style={{ padding:"8px 20px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer",
              background: y===year ? C.navy : "transparent",
              color: y===year ? "#fff" : C.muted,
              border:`1.5px solid ${y===year ? C.navy : C.border}` }}>
            {y}년
          </button>
        ))}
      </div>

      {/* KPI 카드 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:20 }}>
        {kvs.map(k => (
          <div key={k.l} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
            <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{k.l}</p>
            <span className="num" style={{ fontSize:20, fontWeight:k.bold?900:700, color:k.c }}>{k.v}</span>
          </div>
        ))}
      </div>

      {/* 포함 내용 */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
        <p style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:12 }}>파일 포함 내용 (4개 시트)</p>
        {[
          { icon:"📋", title:"① 임대수입현황", desc:"유형별 색상 구분 · 만원+원 단위 병기 · 합계 수식" },
          { icon:"💰", title:"② 수금내역",     desc:"월별 납부/미납 현황 · 납부일 기록" },
          { icon:"🔧", title:"③ 수리비·지출", desc:"수리 내역 · 업체명 · 영수증 여부" },
          { icon:"📑", title:"④ 세금신고참고", desc:"수입·지출 요약 · 순수익 · 신고 참고용" },
        ].map(item => (
          <div key={item.title} style={{ display:"flex", gap:10, padding:"10px 14px", background:C.faint, borderRadius:10, marginBottom:8 }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:2 }}>{item.title}</p>
              <p style={{ fontSize:11, color:C.muted }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleExport} disabled={loading}
        style={{ width:"100%", padding:"16px", borderRadius:14,
          background:loading?"#b0b0c0":`linear-gradient(135deg,${C.navy},#2d4270)`,
          color:"#fff", border:"none", fontWeight:800, fontSize:15,
          cursor:loading?"not-allowed":"pointer",
          boxShadow:loading?"none":"0 4px 20px rgba(26,39,68,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
        {loading ? <><span>⏳</span> 생성 중...</> : <><span>📥</span> {year}년 세금 신고 자료 다운로드 (.xlsx)</>}
      </button>

      <p style={{ fontSize:11, color:C.muted, marginTop:12, textAlign:"center", lineHeight:1.7 }}>
        헤더 색상 · 테두리 · 행 서식이 완전히 적용된 실제 xlsx 파일입니다<br/>
        엑셀 · 구글스프레드시트 모두 지원
      </p>
    </div>
  );
}
