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

// ── 색상 팔레트 ──────────────────────────────────────────────────
const P = {
  navy:   "FF1A2744", white:  "FFFFFFFF", gray:   "FF8A8A9A",
  navy2:  "FF2D4270", lgray:  "FFF8F7F4", green:  "FF0FA573",
  red:    "FFE8445A", amber:  "FFE8960A", lgreen: "FFE8F5F0",
  lred:   "FFFEF0F0", amberL: "FFFFBEB",  blue:   "FFEEF2FF",
  comBg:  "FFFFF0CC", resBg:  "FFC5D4E8", border: "FFCCCCCC",
};

function argb(hex) { return hex; } // 이미 ARGB 형식

// ── 셀 스타일 헬퍼 ───────────────────────────────────────────────
function applyStyle(cell, {
  bold=false, sz=10, color=P.navy, italic=false,
  bgColor=null, align="left", valign="middle",
  wrapText=false, numFmt=null,
  borderAll=false, borderBottom=false,
}) {
  cell.font = { name:"Arial", size:sz, bold, italic, color:{ argb: color } };
  cell.alignment = { horizontal:align, vertical:valign, wrapText };
  if (bgColor) cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:bgColor } };
  if (numFmt) cell.numFmt = numFmt;
  if (borderAll) {
    const bs = { style:"thin", color:{ argb:P.border } };
    cell.border = { top:bs, bottom:bs, left:bs, right:bs };
  }
  if (borderBottom) {
    const thin = { style:"thin", color:{ argb:P.border } };
    const med  = { style:"medium", color:{ argb:"FF999999" } };
    cell.border = { top:thin, bottom:med, left:thin, right:thin };
  }
}

function titleRow(ws, cols, text, bgColor=P.navy, sz=13) {
  ws.mergeCells(1, 1, 1, cols);
  const cell = ws.getCell("A1");
  cell.value = text;
  applyStyle(cell, { bold:true, sz, color:P.white, bgColor, align:"center", wrapText:true });
  ws.getRow(1).height = 40;
}

function subRow(ws, cols, text, row=2, bgColor=P.lgray, color=P.gray) {
  ws.mergeCells(row, 1, row, cols);
  const cell = ws.getCell(`A${row}`);
  cell.value = text;
  applyStyle(cell, { sz:9, italic:true, color, bgColor, align:"center" });
  ws.getRow(row).height = 16;
}

function colHdr(ws, row, headers, bgColor=P.navy2) {
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i+1);
    cell.value = h;
    applyStyle(cell, { bold:true, sz:9, color:P.white, bgColor, align:"center", borderBottom:true });
  });
  ws.getRow(row).height = 24;
}

function sectionHdr(ws, row, cols, text, bgColor=P.navy2) {
  ws.mergeCells(row, 1, row, cols);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  applyStyle(cell, { bold:true, sz:10, color:P.white, bgColor, align:"left" });
  ws.getRow(row).height = 22;
}

function dataRow(ws, row, values) {
  // values: [{ v, bold, sz, color, bgColor, align, numFmt }]
  values.forEach((d, i) => {
    const cell = ws.getCell(row, i+1);
    cell.value = d.v ?? "";
    applyStyle(cell, {
      bold: d.bold||false, sz: d.sz||9, color: d.color||P.navy,
      bgColor: d.bgColor||null, align: d.align||"left",
      numFmt: d.numFmt||null, borderAll: true,
    });
  });
  ws.getRow(row).height = d => 22;
}

function sumRow(ws, row, cols, values) {
  values.forEach((d, i) => {
    const cell = ws.getCell(row, i+1);
    cell.value = d.v ?? "";
    applyStyle(cell, {
      bold: d.bold !== false, sz: d.sz||10, color: d.color||P.navy,
      bgColor: P.lgray, align: d.align||"left", numFmt: d.numFmt||null, borderAll: true,
    });
  });
  ws.getRow(row).height = 26;
}

// ── 메인 빌더 ────────────────────────────────────────────────────
async function buildXlsx({ year, tenants, payments, repairs, ledger }) {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ownly"; wb.created = new Date();
  const today = new Date().toLocaleDateString("ko-KR");

  const yp = (payments||[]).filter(p=>(p.year||new Date().getFullYear())===year);
  const yr = (repairs||[]).filter(r=>new Date(r.date||"").getFullYear()===year);
  const yl = (ledger||[]).filter(l=>new Date(l.date||"").getFullYear()===year&&l.type==="expense");
  const totalAnnual = tenants.reduce((s,t)=>s+(t.rent||0)*12,0);
  const totalPaid   = yp.filter(p=>p.status==="paid").reduce((s,p)=>s+(p.amount||p.amt||0),0);
  const totalRepair = yr.reduce((s,r)=>s+(r.cost||0),0);
  const totalLedE   = yl.reduce((s,l)=>s+(l.amount||0),0);
  const totalExp    = totalRepair + totalLedE;
  const taxBase     = Math.max(0, totalAnnual - totalExp);

  // ════════════════════════════════════════════════════════════
  // ① 임대수입현황
  // ════════════════════════════════════════════════════════════
  const w1 = wb.addWorksheet("① 임대수입현황");
  w1.views = [{ showGridLines:false }];
  w1.columns = [
    {width:5},{width:18},{width:28},{width:10},
    {width:14},{width:16},{width:16},{width:16},
  ];

  titleRow(w1, 8, `임대 수입 현황  ·  ${year}년 귀속  ·  종합소득세 신고 참고자료`);
  subRow(w1, 8, `온리(Ownly) 자동 생성  ·  작성일: ${today}`);

  // 빈 행
  w1.getRow(3).height = 6;

  colHdr(w1, 4, ["No.","세입자명","물건 주소","유형","월세(만원)","연간수입(만원)","연간수입(원)","비고"]);

  let r = 5;
  tenants.forEach((t, i) => {
    const pType = t.pType || t.type || "주거";
    const ann   = (t.rent||0) * 12;
    const isCom = pType === "상가";
    const typeBg = isCom ? P.comBg : pType==="주거" ? P.resBg : P.lgray;
    const note   = isCom ? "부가세 별도 과세" : ann<=2000 ? "분리과세 검토" : "";
    dataRow(w1, r, [
      { v:i+1, align:"center", color:P.gray, sz:8 },
      { v:t.name||"", bold:true },
      { v:t.address||t.addr||"" },
      { v:pType, align:"center", bgColor:typeBg },
      { v:t.rent||0, align:"right", numFmt:'#,##0', color:P.navy },
      { v:ann, align:"right", numFmt:'#,##0', bold:true, color:P.green },
      { v:ann*10000, align:"right", numFmt:'#,##0', color:"FF555555", sz:8 },
      { v:note, color:note?P.amber:P.gray, sz:8 },
    ]);
    r++;
  });

  // 합계행
  sumRow(w1, r, 8, [
    { v:"합계", align:"right" },
    { v:"" }, { v:"" }, { v:"" },
    { v:tenants.reduce((s,t)=>s+(t.rent||0),0), align:"right", numFmt:'#,##0' },
    { v:totalAnnual, align:"right", numFmt:'#,##0', sz:11, color:P.navy },
    { v:totalAnnual*10000, align:"right", numFmt:'#,##0', sz:9, color:"FF555555" },
    { v:"" },
  ]);
  r++;

  // 안내
  w1.getRow(r).height = 6; r++;
  w1.mergeCells(r,1,r,8);
  const noteCell = w1.getCell(r,1);
  noteCell.value = "▶ 주거 임대 연 2천만원 이하: 분리과세(14%) 또는 종합과세 선택 가능  /  상가 임대: 부가세(10%) 별도 신고 필요";
  applyStyle(noteCell, { sz:8, italic:true, color:P.amber, align:"left" });

  // ════════════════════════════════════════════════════════════
  // ② 월별수금내역
  // ════════════════════════════════════════════════════════════
  const w2 = wb.addWorksheet("② 월별수금내역");
  w2.views = [{ showGridLines:false }];
  w2.columns = [{width:5},{width:8},{width:18},{width:16},{width:14},{width:14},{width:14}];

  titleRow(w2, 7, `월별 수금 내역  ·  ${year}년  ·  실제 납부 기록`);
  subRow(w2, 7, "납부완료 처리된 내역 기준  ·  녹색=완료 / 빨간=미납");
  w2.getRow(3).height = 6;
  colHdr(w2, 4, ["No.","월","세입자명","납부금액(만원)","납부일","상태","비고"]);

  r = 5;
  if (yp.length === 0) {
    w2.mergeCells(r,1,r,7);
    const ec = w2.getCell(r,1);
    ec.value = "— 수금 내역 없음 —";
    applyStyle(ec, { sz:9, italic:true, color:P.gray, bgColor:P.lgray, align:"center", borderAll:true });
    r++;
  } else {
    yp.forEach((p, i) => {
      const paid   = p.status==="paid";
      const bg     = paid ? P.lgreen : P.lred;
      const tenant = tenants.find(t=>t.id===(p.tenant_id||p.tid));
      dataRow(w2, r, [
        { v:i+1, align:"center", color:P.gray, sz:8, bgColor:bg },
        { v:`${p.month||""}월`, align:"center", bold:true, bgColor:bg },
        { v:tenant?.name||p.tenant_name||"", bold:true, bgColor:bg },
        { v:p.amount||p.amt||0, align:"right", numFmt:'#,##0', bold:true, color:paid?P.green:P.red, bgColor:bg },
        { v:p.paid_date||p.paid||"", align:"center", color:"FF555555", sz:8, bgColor:bg },
        { v:paid?"✅ 납부완료":"❌ 미납", align:"center", bold:true, color:paid?P.green:P.red, bgColor:bg },
        { v:"", bgColor:bg },
      ]);
      r++;
    });
  }

  sumRow(w2, r, 7, [
    { v:"납부완료 합계", align:"right" },
    { v:"" }, { v:"" },
    { v:totalPaid, align:"right", numFmt:'#,##0', sz:11 },
    { v:"" }, { v:"" }, { v:"" },
  ]);

  // ════════════════════════════════════════════════════════════
  // ③ 필요경비
  // ════════════════════════════════════════════════════════════
  const w3 = wb.addWorksheet("③ 필요경비");
  w3.views = [{ showGridLines:false }];
  w3.columns = [{width:5},{width:12},{width:14},{width:28},{width:14},{width:18},{width:14}];

  titleRow(w3, 7, `필요경비 내역  ·  ${year}년  ·  세금 신고 시 공제 가능 항목`);
  // 경고 서브헤더
  w3.mergeCells(2,1,2,7);
  const warnCell = w3.getCell("A2");
  warnCell.value = "⚠ 실제 신고 시 영수증·간이영수증·세금계산서 등 증빙서류 반드시 보관";
  applyStyle(warnCell, { sz:9, italic:true, color:P.red, bgColor:P.lred, align:"center" });
  w3.getRow(2).height = 16;
  w3.getRow(3).height = 6;
  colHdr(w3, 4, ["No.","날짜","분류","내용","금액(만원)","물건","비고"]);

  const allExp = [
    ...yr.map(x=>({ date:x.date, cat:x.category||"수리비", memo:x.memo||"", amt:x.cost||0, prop:x.property_name||"", note:x.vendor||"" })),
    ...yl.map(x=>({ date:x.date, cat:x.category||"기타지출", memo:x.memo||x.description||"", amt:x.amount||0, prop:"", note:"" })),
  ].sort((a,b)=>(a.date||"").localeCompare(b.date||""));

  r = 5;
  if (allExp.length === 0) {
    w3.mergeCells(r,1,r,7);
    const ec = w3.getCell(r,1);
    ec.value = "— 수리비·경비 내역 없음 (수리이력 또는 간편장부에 입력하면 자동 반영됩니다) —";
    applyStyle(ec, { sz:9, italic:true, color:P.gray, bgColor:P.lgray, align:"center", borderAll:true });
    r++;
  } else {
    allExp.forEach((e,i) => {
      dataRow(w3, r, [
        { v:i+1, align:"center", color:P.gray, sz:8 },
        { v:e.date, align:"center", sz:8 },
        { v:e.cat, align:"center" },
        { v:e.memo },
        { v:e.amt, align:"right", numFmt:'#,##0', bold:true, color:P.red },
        { v:e.prop },
        { v:e.note, color:P.gray, sz:8 },
      ]);
      r++;
    });
  }

  sumRow(w3, r, 7, [
    { v:"합계", align:"right" },
    { v:"" }, { v:"" }, { v:"" },
    { v:totalExp, align:"right", numFmt:'#,##0', sz:11, color:P.red },
    { v:"" }, { v:"" },
  ]);
  r++;

  // 공제 항목 안내
  w3.getRow(r).height = 6; r++;
  [
    { txt:"▶ 주요 공제 가능 경비 항목 (세무사 확인 후 적용)", bold:true, color:P.navy },
    { txt:"  · 수리비·유지보수비 (도배, 배관, 전기 등)  /  감가상각비  /  화재보험료", color:P.gray },
    { txt:"  · 임대차 관련 법무·세무 수수료  /  광고비  /  청소·관리비", color:P.gray },
    { txt:"  · 대출이자 (임대용 부동산 취득 관련 분)", color:P.gray },
  ].forEach(({ txt, bold, color }) => {
    w3.mergeCells(r,1,r,7);
    const c = w3.getCell(r,1);
    c.value = txt;
    applyStyle(c, { sz:8, bold:bold||false, color, align:"left" });
    w3.getRow(r).height = 14;
    r++;
  });

  // ════════════════════════════════════════════════════════════
  // ④ 세금신고요약
  // ════════════════════════════════════════════════════════════
  const w4 = wb.addWorksheet("④ 세금신고요약");
  w4.views = [{ showGridLines:false }];
  w4.columns = [{width:32},{width:18},{width:26}];

  titleRow(w4, 3, `세금 신고 참고 요약  ·  ${year}년 귀속 임대소득`, P.navy, 14);
  w4.mergeCells(2,1,2,3);
  const wc4 = w4.getCell("A2");
  wc4.value = "⚠ 본 요약은 추정치이며, 실제 세금 신고는 반드시 세무사에게 확인하시기 바랍니다.";
  applyStyle(wc4, { sz:9, italic:true, color:P.red, bgColor:P.lred, align:"center" });
  w4.getRow(2).height = 16;
  w4.getRow(3).height = 8;

  r = 4;

  // ① 임대 수입 섹션
  sectionHdr(w4, r, 3, "  📋 임대 수입"); r++;
  colHdr(w4, r, ["항목","금액(만원)","비고"]); r++;
  [
    ["연간 임대 수입 합계", totalAnnual,   "월세 합산 기준 (연간)", P.green, P.lgreen],
    ["실제 수금액 (납부완료)", totalPaid,  "수금 현황 기준",       P.green, P.lgreen],
    ["미수금", Math.max(0,totalAnnual-totalPaid), "수입-수금",  P.red,   P.lred],
  ].forEach(([a,b,c_,col,bg]) => {
    const cells = [
      { v:a, bold:true, color:col, bgColor:bg },
      { v:b, align:"right", numFmt:'#,##0', bold:true, color:col, bgColor:bg, sz:11 },
      { v:c_, color:P.gray, sz:8, bgColor:bg },
    ];
    dataRow(w4, r, cells); r++;
  });

  w4.getRow(r).height = 8; r++;

  // ② 필요경비 섹션
  sectionHdr(w4, r, 3, "  🔧 필요경비 (공제)"); r++;
  colHdr(w4, r, ["항목","금액(만원)","비고"]); r++;
  [
    ["수리비·유지보수비",  totalRepair,  "영수증 필수",     P.navy, null, false],
    ["기타 경비",          totalLedE,    "장부 입력 기준",  P.navy, null, false],
    ["총 필요경비",        totalExp,     "수리비+기타",     P.red,  P.lgray, true],
  ].forEach(([a,b,c_,col,bg,bold]) => {
    dataRow(w4, r, [
      { v:a, bold, color:col, bgColor:bg||null },
      { v:b, align:"right", numFmt:'#,##0', bold, color:col, sz:bold?11:10, bgColor:bg||null },
      { v:c_, color:P.gray, sz:8, bgColor:bg||null },
    ]);
    r++;
  });

  w4.getRow(r).height = 8; r++;

  // ③ 과세표준 섹션
  sectionHdr(w4, r, 3, "  📊 과세표준 및 세금 (추정)"); r++;
  colHdr(w4, r, ["항목","금액(만원)","비고"]); r++;

  const isSmall = totalAnnual <= 2000;
  [
    ["과세표준 (추정)", taxBase, "수입-총경비", P.navy, P.blue, true, 12],
    ["", "", "", P.gray, null, false, 9],
    ["주거임대 분리과세(14%) 추정",
      isSmall ? Math.round(taxBase*0.14) : "해당없음",
      "연 2천만원 이하 주거 기준", P.navy, P.blue, false, 9],
    ["상가임대 부가세(10%) 추정",
      Math.round(totalAnnual*0.1),
      "공급가액 기준 추정", P.amber, "FFFFFFBEB", false, 9],
  ].forEach(([a,b,c_,col,bg,bold,sz]) => {
    dataRow(w4, r, [
      { v:a, bold, color:col, bgColor:bg||null, sz:sz||9 },
      { v:b, align:"right", numFmt:typeof b==="number"?'#,##0':null, bold, color:col, sz:sz||9, bgColor:bg||null },
      { v:c_, color:P.gray, sz:8, bgColor:bg||null },
    ]);
    r++;
  });

  w4.getRow(r).height = 8; r++;

  // ④ 신고 일정 섹션
  sectionHdr(w4, r, 3, "  📅 신고·납부 일정"); r++;
  colHdr(w4, r, ["항목","날짜","비고"]); r++;
  [
    ["종합소득세 신고·납부",   `${year}년 5월 31일`,   "매년 (연간 임대소득)"],
    ["부가세 1기 확정신고",     `${year}년 7월 25일`,   "상가 임대인 (1~6월분)"],
    ["부가세 2기 확정신고",     `${year+1}년 1월 25일`, "상가 임대인 (7~12월분)"],
    ["건강보험료 정산",         "매년 6~7월",           "피부양자 자격 변동 확인"],
  ].forEach(([a,b,c_]) => {
    dataRow(w4, r, [
      { v:a, bold:true },
      { v:b, align:"right", bold:true, color:P.amber },
      { v:c_, color:P.gray, sz:8 },
    ]);
    r++;
  });

  w4.getRow(r).height = 10; r++;
  w4.mergeCells(r,1,r,3);
  const footer = w4.getCell(r,1);
  footer.value = `작성일: ${today}  ·  온리(Ownly) 자동 생성  ·  ownly.kr`;
  applyStyle(footer, { sz:8, italic:true, color:P.gray, align:"center" });

  // ── 파일 저장 ────────────────────────────────────────────────
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `온리_세금신고자료_${year}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── 컴포넌트 ─────────────────────────────────────────────────────
export default function ExcelTab() {
  const { tenants, payments, repairs, ledger, userPlan } = useApp(); const isPlus = ["plus","pro"].includes(userPlan || "free");
  const [year,    setYear]    = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const yp = (payments||[]).filter(p=>(p.year||new Date().getFullYear())===year);
  const yr = (repairs||[]).filter(r=>new Date(r.date||"").getFullYear()===year);
  const yl = (ledger||[]).filter(l=>new Date(l.date||"").getFullYear()===year&&l.type==="expense");

  const totalAnnual = tenants.reduce((s,t)=>s+(t.rent||0)*12,0);
  const totalPaid   = yp.filter(p=>p.status==="paid").reduce((s,p)=>s+(p.amount||p.amt||0),0);
  const totalExp    = yr.reduce((s,r)=>s+(r.cost||0),0)+yl.reduce((s,l)=>s+(l.amount||0),0);
  const taxBase     = Math.max(0,totalAnnual-totalExp);

  const handleExport = async () => {
    setLoading(true);
    try {
      await buildXlsx({ year, tenants, payments, repairs:repairs||[], ledger:ledger||[] });
    } catch(e) {
      console.error(e);
      alert("내보내기 오류: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth:720, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ background:"rgba(26,39,68,0.04)", border:"1px solid rgba(26,39,68,0.12)", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
        <p style={{ fontSize:14, fontWeight:800, color:C.navy, marginBottom:4 }}>📊 세금 신고 참고자료 엑셀 다운로드</p>
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.8 }}>
          임대 수입·수금 내역·필요경비를 <strong>실제 .xlsx 파일 (헤더 색상·테두리·서식 완비)</strong>로 내보냅니다.<br/>
          세무사에게 전달하거나 종합소득세 신고 시 참고자료로 활용하세요.<br/>
          <span style={{ color:C.amber }}>※ 실제 세금 신고는 반드시 세무사에게 확인하세요.</span>
        </p>
      </div>

      {/* 연도 선택 */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:12 }}>신고 연도 선택</p>
        <div style={{ display:"flex", gap:8 }}>
          {[year-1, year].map(y=>(
            <button key={y} onClick={()=>setYear(y)}
              style={{ padding:"10px 24px", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer",
                border:`2px solid ${year===y?C.navy:C.border}`,
                background:year===y?"rgba(26,39,68,0.07)":"transparent",
                color:year===y?C.navy:C.muted }}>
              {y}년 {y===new Date().getFullYear()-1?"(전년도)":"(올해)"}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
        <p style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:14 }}>{year}년 데이터 요약</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:14 }}>
          {[
            {l:"세입자",v:`${tenants.length}명`},{l:"수금 기록",v:`${yp.length}건`},
            {l:"수리비",v:`${yr.length}건`},{l:"장부 지출",v:`${yl.length}건`},
          ].map(k=>(
            <div key={k.l} style={{ background:C.faint, borderRadius:10, padding:"12px 14px" }}>
              <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{k.l}</p>
              <p style={{ fontSize:18, fontWeight:800, color:C.navy }}>{k.v}</p>
            </div>
          ))}
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
          {[
            {l:"연간 임대 수입 (추정)",v:`${totalAnnual.toLocaleString()}만원`,c:C.emerald},
            {l:"실제 수금액",v:`${totalPaid.toLocaleString()}만원`,c:C.emerald},
            {l:"필요경비 합계",v:`${totalExp.toLocaleString()}만원`,c:C.rose},
            {l:"과세표준 (추정)",v:`${taxBase.toLocaleString()}만원`,c:C.navy,bold:true},
          ].map(k=>(
            <div key={k.l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:13, color:C.muted }}>{k.l}</span>
              <span style={{ fontSize:14, fontWeight:k.bold?900:700, color:k.c }}>{k.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 포함 내용 */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
        <p style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:12 }}>파일 포함 내용 (4개 시트)</p>
        {[
          {icon:"📋",title:"① 임대수입현황",desc:"유형별 색상 구분 · 만원+원 단위 병기 · 합계 수식"},
          {icon:"💰",title:"② 월별수금내역",desc:"납부완료 녹색 / 미납 빨간 행 색상"},
          {icon:"🔧",title:"③ 필요경비",   desc:"수리비+장부지출 · 공제 가능 항목 안내"},
          {icon:"📊",title:"④ 세금신고요약",desc:"과세표준·분리과세·부가세 추정 · 신고일정"},
        ].map(item=>(
          <div key={item.title} style={{ display:"flex", gap:12, padding:"10px 14px", background:C.faint, borderRadius:10, marginBottom:8 }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:2 }}>{item.title}</p>
              <p style={{ fontSize:11, color:C.muted }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {isPlus ? (
        <button onClick={handleExport} disabled={loading}
          style={{ width:"100%", padding:"16px", borderRadius:14,
            background:loading?"#b0b0c0":`linear-gradient(135deg,${C.navy},#2d4270)`,
            color:"#fff", border:"none", fontWeight:800, fontSize:15,
            cursor:loading?"not-allowed":"pointer",
            boxShadow:loading?"none":"0 4px 20px rgba(26,39,68,0.25)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          {loading ? <><span>⏳</span> 생성 중...</> : <><span>📥</span> {year}년 세금 신고 자료 다운로드 (.xlsx)</>}
        </button>
      ) : (
        <div onClick={() => router.push("/dashboard/pricing")}
          style={{ width:"100%", padding:"16px", borderRadius:14,
            background:"linear-gradient(135deg,#4f46e5,#6d63f5)",
            color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            boxShadow:"0 4px 20px rgba(79,70,229,0.3)" }}>
          <span>🔒</span> 플러스 플랜에서 엑셀 내보내기 · 업그레이드 →
        </div>
      )}

      <p style={{ fontSize:11, color:C.muted, marginTop:12, textAlign:"center", lineHeight:1.7 }}>
        헤더 색상 · 테두리 · 행 서식이 완전히 적용된 실제 xlsx 파일입니다<br/>
        엑셀 · 구글스프레드시트 모두 지원
      </p>
    </div>
  );
}
