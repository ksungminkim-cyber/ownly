"use client";
import { useState } from "react";
import { useApp } from "../../../context/AppContext";

const C = {
  navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a",
  amber:"#e8960a", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4",
};

// ── SheetJS xlsx 생성 ─────────────────────────────────────────────
async function loadXLSX() {
  if (window.XLSX) return window.XLSX;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.XLSX;
}

// 스타일 헬퍼
const S = {
  titleFill:  { patternType:"solid", fgColor:{ rgb:"1A2744" } },
  subFill:    { patternType:"solid", fgColor:{ rgb:"F8F7F4" } },
  hdrFill:    { patternType:"solid", fgColor:{ rgb:"2D4270" } },
  greenFill:  { patternType:"solid", fgColor:{ rgb:"E8F5F0" } },
  redFill:    { patternType:"solid", fgColor:{ rgb:"FEF0F0" } },
  amberFill:  { patternType:"solid", fgColor:{ rgb:"FFFBEB" } },
  lgrayFill:  { patternType:"solid", fgColor:{ rgb:"F8F7F4" } },
  blueFill:   { patternType:"solid", fgColor:{ rgb:"EEF2FF" } },
  comBgFill:  { patternType:"solid", fgColor:{ rgb:"FFF0CC" } },
  resBgFill:  { patternType:"solid", fgColor:{ rgb:"C5D4E8" } },

  titleFont:  (sz=13) => ({ name:"Arial", sz, bold:true, color:{ rgb:"FFFFFF" } }),
  subFont:    () => ({ name:"Arial", sz:9, italic:true, color:{ rgb:"8A8A9A" } }),
  hdrFont:    () => ({ name:"Arial", sz:9, bold:true, color:{ rgb:"FFFFFF" } }),
  navyBold:   (sz=10) => ({ name:"Arial", sz, bold:true, color:{ rgb:"1A2744" } }),
  navyNorm:   (sz=9) => ({ name:"Arial", sz, color:{ rgb:"1A2744" } }),
  greenBold:  (sz=10) => ({ name:"Arial", sz, bold:true, color:{ rgb:"0FA573" } }),
  redBold:    (sz=10) => ({ name:"Arial", sz, bold:true, color:{ rgb:"E8445A" } }),
  amberBold:  (sz=9) => ({ name:"Arial", sz, bold:true, color:{ rgb:"E8960A" } }),
  grayNorm:   (sz=8) => ({ name:"Arial", sz, color:{ rgb:"8A8A9A" }, italic:true }),

  thinBorder: {
    top:    { style:"thin", color:{ rgb:"CCCCCC" } },
    bottom: { style:"thin", color:{ rgb:"CCCCCC" } },
    left:   { style:"thin", color:{ rgb:"CCCCCC" } },
    right:  { style:"thin", color:{ rgb:"CCCCCC" } },
  },
  thickBtm: {
    top:    { style:"thin",   color:{ rgb:"CCCCCC" } },
    bottom: { style:"medium", color:{ rgb:"999999" } },
    left:   { style:"thin",   color:{ rgb:"CCCCCC" } },
    right:  { style:"thin",   color:{ rgb:"CCCCCC" } },
  },

  center: { horizontal:"center", vertical:"center", wrapText:true },
  left:   { horizontal:"left",   vertical:"center" },
  right:  { horizontal:"right",  vertical:"center" },
};

function cell(v, font, fill, alignment, border, numFmt) {
  const c = { v, t: typeof v === "number" ? "n" : "s" };
  const s = {};
  if (font)      s.font      = font;
  if (fill)      s.fill      = fill;
  if (alignment) s.alignment = alignment;
  if (border)    s.border    = border;
  if (numFmt)    s.numFmt    = numFmt;
  c.s = s;
  return c;
}

function buildWorkbook(XLSX, { year, tenants, payments, repairs, ledger }) {
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString("ko-KR");

  // ── 수치 계산 ────────────────────────────────────────────────
  const yp = (payments||[]).filter(p => (p.year||new Date().getFullYear()) === year);
  const yr = (repairs||[]).filter(r => new Date(r.date||"").getFullYear() === year);
  const yl = (ledger||[]).filter(l => new Date(l.date||"").getFullYear() === year && l.type==="expense");

  const totalAnnual   = tenants.reduce((s,t) => s+(t.rent||0)*12, 0);
  const totalPaid     = yp.filter(p=>p.status==="paid").reduce((s,p) => s+(p.amount||p.amt||0), 0);
  const totalRepair   = yr.reduce((s,r) => s+(r.cost||0), 0);
  const totalLedgerE  = yl.reduce((s,l) => s+(l.amount||0), 0);
  const totalExp      = totalRepair + totalLedgerE;
  const taxBase       = Math.max(0, totalAnnual - totalExp);

  const B = S.thinBorder;
  const BH = S.thickBtm;

  // ════════════════════════════════════════════════════════════
  // 시트1 — 임대수입현황
  // ════════════════════════════════════════════════════════════
  const ws1Data = [];

  // 제목
  ws1Data.push([
    cell(`임대 수입 현황  ·  ${year}년 귀속  ·  종합소득세 신고 참고자료`,
      S.titleFont(13), S.titleFill, S.center, B),
    ...Array(7).fill(cell("", null, S.titleFill, null, B)),
  ]);
  ws1Data.push([
    cell(`온리(Ownly) 자동 생성  ·  작성일: ${today}`,
      S.subFont(), S.subFill, S.center, B),
    ...Array(7).fill(cell("", null, S.subFill, null, B)),
  ]);
  ws1Data.push(Array(8).fill(cell("")));

  // 헤더
  const h1 = ["No.","세입자명","물건 주소","유형","월세(만원)","연간수입(만원)","연간수입(원)","비고"];
  ws1Data.push(h1.map(v => cell(v, S.hdrFont(), S.hdrFill, S.center, BH)));

  // 데이터
  tenants.forEach((t,i) => {
    const ann  = (t.rent||0) * 12;
    const isCom = t.type==="상가" || t.pType==="상가";
    const note  = isCom ? "부가세 별도 과세" : ann<=2000 ? "분리과세 검토" : "";
    const typeBg = isCom ? S.comBgFill : t.pType==="주거"||t.type==="주거" ? S.resBgFill : S.lgrayFill;
    ws1Data.push([
      cell(i+1,         S.navyNorm(), null,     S.center, B, "0"),
      cell(t.name||"",  S.navyBold(), null,     S.left,   B),
      cell(t.address||t.addr||"", S.navyNorm(), null, S.left, B),
      cell(t.pType||t.type||"", S.navyNorm(), typeBg, S.center, B),
      cell(t.rent||0,   S.navyNorm(), null,     S.right,  B, "#,##0"),
      cell(ann,         S.greenBold(), null,    S.right,  B, "#,##0"),
      cell(ann*10000,   { name:"Arial",sz:9,color:{rgb:"555555"} }, null, S.right, B, "#,##0"),
      cell(note,        S.amberBold(8), note?S.amberFill:null, S.left, B),
    ]);
  });

  // 합계
  ws1Data.push([
    cell("합계", S.navyBold(), S.lgrayFill, S.right, B),
    cell("", null, S.lgrayFill, null, B),
    cell("", null, S.lgrayFill, null, B),
    cell("", null, S.lgrayFill, null, B),
    cell(tenants.reduce((s,t)=>s+(t.rent||0),0), S.navyBold(), S.lgrayFill, S.right, B, "#,##0"),
    cell(totalAnnual, { name:"Arial",sz:11,bold:true,color:{rgb:"1A2744"} }, S.lgrayFill, S.right, B, "#,##0"),
    cell(totalAnnual*10000, { name:"Arial",sz:9,bold:true,color:{rgb:"555555"} }, S.lgrayFill, S.right, B, "#,##0"),
    cell("", null, S.lgrayFill, null, B),
  ]);
  ws1Data.push(Array(8).fill(cell("")));
  ws1Data.push([
    cell("▶ 주거 임대 연 2천만원 이하: 분리과세(14%) 또는 종합과세 선택 가능 / 상가 임대: 부가세(10%) 별도 신고 필요",
      { name:"Arial",sz:8,color:{rgb:"E8960A"},italic:true }, null, S.left, null),
    ...Array(7).fill(cell("")),
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  ws1["!merges"] = [
    {s:{r:0,c:0},e:{r:0,c:7}},
    {s:{r:1,c:0},e:{r:1,c:7}},
    {s:{r:ws1Data.length-1,c:0},e:{r:ws1Data.length-1,c:7}},
  ];
  ws1["!cols"] = [5,18,28,10,14,16,14,16].map(w=>({wch:w}));
  ws1["!rows"] = ws1Data.map((_,i) => ({ hpt: i===0?40:i===1?16:i===2?6:i===3?24:i===ws1Data.length-2?6:22 }));
  XLSX.utils.book_append_sheet(wb, ws1, "① 임대수입현황");

  // ════════════════════════════════════════════════════════════
  // 시트2 — 월별수금내역
  // ════════════════════════════════════════════════════════════
  const ws2Data = [];
  ws2Data.push([
    cell(`월별 수금 내역  ·  ${year}년  ·  실제 납부 기록`, S.titleFont(13), S.titleFill, S.center, B),
    ...Array(6).fill(cell("", null, S.titleFill, null, B)),
  ]);
  ws2Data.push([
    cell("수금 현황 페이지에서 납부완료 처리된 내역 기준", S.subFont(), S.subFill, S.center, B),
    ...Array(6).fill(cell("", null, S.subFill, null, B)),
  ]);
  ws2Data.push(Array(7).fill(cell("")));

  const h2 = ["No.","월","세입자명","납부금액(만원)","납부일","상태","비고"];
  ws2Data.push(h2.map(v => cell(v, S.hdrFont(), S.hdrFill, S.center, BH)));

  yp.forEach((p,i) => {
    const paid = p.status==="paid";
    const bg   = paid ? S.greenFill : S.redFill;
    const tenant = tenants.find(t => t.id===(p.tenant_id||p.tid));
    ws2Data.push([
      cell(i+1,          S.navyNorm(9), bg, S.center, B, "0"),
      cell(`${p.month||""}월`, S.navyBold(), bg, S.center, B),
      cell(tenant?.name||p.tenant_name||"", S.navyBold(), bg, S.left, B),
      cell(p.amount||p.amt||0, paid?S.greenBold():S.redBold(), bg, S.right, B, "#,##0"),
      cell(p.paid_date||p.paid||"", { name:"Arial",sz:9,color:{rgb:"555555"} }, bg, S.center, B),
      cell(paid?"✅ 납부완료":"❌ 미납", paid?{ name:"Arial",sz:9,bold:true,color:{rgb:"0FA573"} }:{ name:"Arial",sz:9,bold:true,color:{rgb:"E8445A"} }, bg, S.center, B),
      cell("", null, bg, null, B),
    ]);
  });

  if (yp.length === 0) {
    ws2Data.push([
      cell("— 수금 내역 없음 —", S.grayNorm(9), S.lgrayFill, S.center, B),
      ...Array(6).fill(cell("", null, S.lgrayFill, null, B)),
    ]);
  }

  // 합계
  ws2Data.push([
    cell("납부완료 합계", S.navyBold(), S.lgrayFill, S.right, B),
    cell("", null, S.lgrayFill, null, B),
    cell("", null, S.lgrayFill, null, B),
    cell(totalPaid, { name:"Arial",sz:11,bold:true,color:{rgb:"1A2744"} }, S.lgrayFill, S.right, B, "#,##0"),
    cell("", null, S.lgrayFill, null, B),
    cell("", null, S.lgrayFill, null, B),
    cell("", null, S.lgrayFill, null, B),
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2["!merges"] = [
    {s:{r:0,c:0},e:{r:0,c:6}},
    {s:{r:1,c:0},e:{r:1,c:6}},
  ];
  ws2["!cols"] = [5,8,18,16,14,14,14].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws2, "② 월별수금내역");

  // ════════════════════════════════════════════════════════════
  // 시트3 — 필요경비
  // ════════════════════════════════════════════════════════════
  const ws3Data = [];
  ws3Data.push([
    cell(`필요경비 내역  ·  ${year}년  ·  세금 신고 시 공제 가능 항목`, S.titleFont(13), S.titleFill, S.center, B),
    ...Array(6).fill(cell("", null, S.titleFill, null, B)),
  ]);
  ws3Data.push([
    cell("⚠ 실제 신고 시 영수증·간이영수증·세금계산서 등 증빙서류 반드시 보관",
      { name:"Arial",sz:9,color:{rgb:"E8445A"},italic:true }, S.redFill, S.center, B),
    ...Array(6).fill(cell("", null, S.redFill, null, B)),
  ]);
  ws3Data.push(Array(7).fill(cell("")));

  const h3 = ["No.","날짜","분류","내용","금액(만원)","물건","비고"];
  ws3Data.push(h3.map(v => cell(v, S.hdrFont(), S.hdrFill, S.center, BH)));

  const allExp = [
    ...yr.map(r => ({ date:r.date, cat:r.category||"수리비", memo:r.memo||"", amt:r.cost||0, prop:r.property_name||"", note:r.vendor||"" })),
    ...yl.map(l => ({ date:l.date, cat:l.category||"기타지출", memo:l.memo||l.description||"", amt:l.amount||0, prop:"", note:"" })),
  ].sort((a,b) => (a.date||"").localeCompare(b.date||""));

  if (allExp.length === 0) {
    ws3Data.push([
      cell("— 수리비·경비 내역 없음 (수리이력 또는 간편장부에 입력하면 자동 반영됩니다) —",
        S.grayNorm(9), S.lgrayFill, S.center, B),
      ...Array(6).fill(cell("", null, S.lgrayFill, null, B)),
    ]);
  } else {
    allExp.forEach((e,i) => {
      ws3Data.push([
        cell(i+1,    S.navyNorm(), null, S.center, B, "0"),
        cell(e.date, S.navyNorm(), null, S.center, B),
        cell(e.cat,  S.navyNorm(), null, S.center, B),
        cell(e.memo, S.navyNorm(), null, S.left,   B),
        cell(e.amt,  S.redBold(),  null, S.right,  B, "#,##0"),
        cell(e.prop, S.navyNorm(), null, S.left,   B),
        cell(e.note, S.grayNorm(), null, S.left,   B),
      ]);
    });
  }

  // 합계
  ws3Data.push([
    cell("합계", S.navyBold(), S.lgrayFill, S.right, B),
    cell("", null, S.lgrayFill, null, B),
    cell("", null, S.lgrayFill, null, B),
    cell("", null, S.lgrayFill, null, B),
    cell(totalExp, { name:"Arial",sz:11,bold:true,color:{rgb:"E8445A"} }, S.lgrayFill, S.right, B, "#,##0"),
    cell("", null, S.lgrayFill, null, B),
    cell("", null, S.lgrayFill, null, B),
  ]);

  ws3Data.push(Array(7).fill(cell("")));
  [
    "▶ 주요 공제 가능 경비 항목 (세무사 확인 후 적용)",
    "  · 수리비·유지보수비 (도배, 배관, 전기 등)  /  감가상각비  /  화재보험료",
    "  · 임대차 관련 법무·세무 수수료  /  광고비  /  청소·관리비",
    "  · 대출이자 (임대용 부동산 취득 관련 분)",
  ].forEach((txt,i) => {
    ws3Data.push([
      cell(txt, i===0 ? S.navyBold(8) : S.grayNorm(8), null, S.left, null),
      ...Array(6).fill(cell("")),
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
  ws3["!merges"] = [
    {s:{r:0,c:0},e:{r:0,c:6}},
    {s:{r:1,c:0},e:{r:1,c:6}},
    ...(allExp.length===0 ? [{s:{r:4,c:0},e:{r:4,c:6}}] : []),
    {s:{r:ws3Data.length-4,c:0},e:{r:ws3Data.length-4,c:6}},
    {s:{r:ws3Data.length-3,c:0},e:{r:ws3Data.length-3,c:6}},
    {s:{r:ws3Data.length-2,c:0},e:{r:ws3Data.length-2,c:6}},
    {s:{r:ws3Data.length-1,c:0},e:{r:ws3Data.length-1,c:6}},
  ];
  ws3["!cols"] = [5,12,14,28,14,18,14].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws3, "③ 필요경비");

  // ════════════════════════════════════════════════════════════
  // 시트4 — 세금신고요약
  // ════════════════════════════════════════════════════════════
  const ws4Data = [];
  ws4Data.push([
    cell(`세금 신고 참고 요약  ·  ${year}년 귀속 임대소득`, S.titleFont(14), S.titleFill, S.center, B),
    cell("", null, S.titleFill, null, B),
    cell("", null, S.titleFill, null, B),
  ]);
  ws4Data.push([
    cell("⚠ 본 요약은 추정치이며, 실제 세금 신고는 반드시 세무사에게 확인하시기 바랍니다.",
      { name:"Arial",sz:9,color:{rgb:"E8445A"},italic:true }, S.redFill, S.center, B),
    cell("", null, S.redFill, null, B),
    cell("", null, S.redFill, null, B),
  ]);
  ws4Data.push(Array(3).fill(cell("")));

  // 섹션 헤더 helper
  const secHdr = (txt) => [
    cell(txt, { name:"Arial",sz:10,bold:true,color:{rgb:"FFFFFF"} }, S.hdrFill, S.left, B),
    cell("", null, S.hdrFill, null, B),
    cell("", null, S.hdrFill, null, B),
  ];
  const colHdr3 = () => ["항목","금액(만원)","비고"].map(v =>
    cell(v, S.hdrFont(), { patternType:"solid",fgColor:{rgb:"2D4270"} }, S.center, BH));

  // ① 임대 수입
  ws4Data.push(secHdr("  📋 임대 수입"));
  ws4Data.push(colHdr3());
  [
    ["연간 임대 수입 합계", totalAnnual,      "월세 합산 기준 (연간)", S.greenBold(10), S.greenFill],
    ["실제 수금액 (납부완료)", totalPaid,     "수금 현황 기준",       S.greenBold(),  S.greenFill],
    ["미수금",  Math.max(0,totalAnnual-totalPaid), "수입-수금",       S.redBold(),    S.redFill],
  ].forEach(([a,b,c_,font,bg]) => {
    ws4Data.push([
      cell(a, font, bg||null, S.left, B),
      cell(b, font, bg||null, S.right, B, "#,##0"),
      cell(c_, S.grayNorm(), bg||null, S.left, B),
    ]);
  });

  ws4Data.push(Array(3).fill(cell("")));

  // ② 필요경비
  ws4Data.push(secHdr("  🔧 필요경비 (공제)"));
  ws4Data.push(colHdr3());
  [
    ["수리비·유지보수비",  totalRepair,  "영수증 필수",      S.navyNorm(10), null],
    ["기타 경비",          totalLedgerE, "장부 입력 기준",   S.navyNorm(10), null],
    ["총 필요경비",        totalExp,     "수리비+기타",      S.redBold(10),  S.lgrayFill],
  ].forEach(([a,b,c_,font,bg]) => {
    ws4Data.push([
      cell(a, font, bg||null, S.left, B),
      cell(b, font, bg||null, S.right, B, "#,##0"),
      cell(c_, S.grayNorm(), bg||null, S.left, B),
    ]);
  });

  ws4Data.push(Array(3).fill(cell("")));

  // ③ 과세표준
  ws4Data.push(secHdr("  📊 과세표준 및 세금 (추정)"));
  ws4Data.push(colHdr3());
  const isSmallResidential = totalAnnual <= 2000;
  [
    ["과세표준 (추정)", taxBase, "수입-총경비",
      { name:"Arial",sz:11,bold:true,color:{rgb:"1A2744"} }, S.blueFill],
    ["", "", "", S.navyNorm(), null],
    ["주거임대 분리과세(14%) 적용 시",
      isSmallResidential ? Math.round(taxBase*0.14) : "해당없음 (연 2천만원 초과)",
      "연 2천만원 이하 주거임대", S.navyNorm(), S.blueFill],
    ["상가임대 부가세 (10%) 추정",
      Math.round(totalAnnual*0.1),
      "공급가액 기준 추정", S.amberBold(), S.amberFill],
  ].forEach(([a,b,c_,font,bg]) => {
    ws4Data.push([
      cell(a, font, bg||null, S.left, B),
      cell(typeof b==="number"? b : b, font, bg||null, S.right, B,
        typeof b==="number" ? "#,##0" : null),
      cell(c_, S.grayNorm(), bg||null, S.left, B),
    ]);
  });

  ws4Data.push(Array(3).fill(cell("")));

  // ④ 신고 일정
  ws4Data.push(secHdr("  📅 신고·납부 일정"));
  ws4Data.push(colHdr3());
  [
    ["종합소득세 신고·납부",     `${year}년 5월 31일`,     "매년 (연간 임대소득)"],
    ["부가세 1기 확정신고",       `${year}년 7월 25일`,     "상가 임대인 (1~6월분)"],
    ["부가세 2기 확정신고",       `${year+1}년 1월 25일`,   "상가 임대인 (7~12월분)"],
    ["건강보험료 정산",           "매년 6~7월",             "피부양자 자격 변동 확인"],
  ].forEach(([a,b,c_]) => {
    ws4Data.push([
      cell(a, S.navyBold(), null, S.left, B),
      cell(b, S.amberBold(), null, S.right, B),
      cell(c_, S.grayNorm(), null, S.left, B),
    ]);
  });

  ws4Data.push(Array(3).fill(cell("")));
  ws4Data.push([
    cell(`작성일: ${today}  ·  온리(Ownly) 자동 생성  ·  ownly.kr`,
      S.grayNorm(8), null, S.center, null),
    cell("", null, null, null, null),
    cell("", null, null, null, null),
  ]);

  const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
  // merges: 제목, 부제, 섹션 헤더들
  const merges4 = [
    {s:{r:0,c:0},e:{r:0,c:2}},
    {s:{r:1,c:0},e:{r:1,c:2}},
    {s:{r:ws4Data.length-1,c:0},e:{r:ws4Data.length-1,c:2}},
  ];
  ws4["!merges"] = merges4;
  ws4["!cols"] = [30,18,24].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws4, "④ 세금신고요약");

  return wb;
}

// ── 컴포넌트 ─────────────────────────────────────────────────────
export default function ExcelTab() {
  const { tenants, payments, repairs, ledger } = useApp();
  const [year,    setYear]    = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const yp = (payments||[]).filter(p => (p.year||new Date().getFullYear())===year);
  const yr = (repairs ||[]).filter(r => new Date(r.date||"").getFullYear()===year);
  const yl = (ledger  ||[]).filter(l => new Date(l.date||"").getFullYear()===year && l.type==="expense");

  const totalAnnual = tenants.reduce((s,t)=>s+(t.rent||0)*12, 0);
  const totalPaid   = yp.filter(p=>p.status==="paid").reduce((s,p)=>s+(p.amount||p.amt||0),0);
  const totalExp    = yr.reduce((s,r)=>s+(r.cost||0),0) + yl.reduce((s,l)=>s+(l.amount||0),0);
  const taxBase     = Math.max(0, totalAnnual - totalExp);

  const handleExport = async () => {
    setLoading(true);
    try {
      const XLSX = await loadXLSX();
      const wb = buildWorkbook(XLSX, { year, tenants, payments, repairs: repairs||[], ledger: ledger||[] });
      XLSX.writeFile(wb, `온리_세금신고자료_${year}.xlsx`);
    } catch(e) {
      alert("내보내기 오류: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth:720, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>

      {/* 안내 */}
      <div style={{ background:"rgba(26,39,68,0.04)", border:"1px solid rgba(26,39,68,0.12)", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
        <p style={{ fontSize:14, fontWeight:800, color:C.navy, marginBottom:4 }}>📊 세금 신고 참고자료 엑셀 다운로드</p>
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.8 }}>
          임대 수입·수금 내역·필요경비를 <strong>실제 .xlsx 엑셀 파일</strong>로 내보냅니다.<br/>
          세무사에게 전달하거나 종합소득세 신고 시 참고자료로 활용하세요.<br/>
          <span style={{ color:C.amber }}>※ 실제 세금 신고는 반드시 세무사에게 확인하세요.</span>
        </p>
      </div>

      {/* 연도 선택 */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:12 }}>신고 연도 선택</p>
        <div style={{ display:"flex", gap:8 }}>
          {[year-1, year].map(y => (
            <button key={y} onClick={() => setYear(y)}
              style={{ padding:"10px 24px", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer",
                border:`2px solid ${year===y ? C.navy : C.border}`,
                background: year===y ? "rgba(26,39,68,0.07)" : "transparent",
                color: year===y ? C.navy : C.muted }}>
              {y}년 {y===new Date().getFullYear()-1 ? "(전년도)" : "(올해)"}
            </button>
          ))}
        </div>
      </div>

      {/* 미리보기 */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
        <p style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:14 }}>{year}년 데이터 요약</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:14 }}>
          {[
            { l:"세입자",    v:`${tenants.length}명`,  c:C.navy },
            { l:"수금 기록", v:`${yp.length}건`,        c:C.navy },
            { l:"수리비",    v:`${yr.length}건`,        c:C.navy },
            { l:"장부 지출", v:`${yl.length}건`,        c:C.navy },
          ].map(k => (
            <div key={k.l} style={{ background:C.faint, borderRadius:10, padding:"12px 14px" }}>
              <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{k.l}</p>
              <p style={{ fontSize:18, fontWeight:800, color:k.c }}>{k.v}</p>
            </div>
          ))}
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
          {[
            { l:"연간 임대 수입 (추정)", v:`${totalAnnual.toLocaleString()}만원`, c:C.emerald },
            { l:"실제 수금액",           v:`${totalPaid.toLocaleString()}만원`,   c:C.emerald },
            { l:"필요경비 합계",         v:`${totalExp.toLocaleString()}만원`,    c:C.rose    },
            { l:"과세표준 (추정)",       v:`${taxBase.toLocaleString()}만원`,     c:C.navy, bold:true },
          ].map(k => (
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
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { icon:"📋", title:"① 임대수입현황", desc:`세입자별 월세·연간수입·원단위 병기, 유형별 색상 구분` },
            { icon:"💰", title:"② 월별수금내역",  desc:"납부완료(녹색)/미납(빨간) 색상 구분, 합계 수식 자동" },
            { icon:"🔧", title:"③ 필요경비",      desc:"수리비+장부지출, 공제 가능 항목 안내 포함" },
            { icon:"📊", title:"④ 세금신고요약",  desc:"과세표준·부가세·분리과세 추정액, 신고 일정 4개" },
          ].map(item => (
            <div key={item.title} style={{ display:"flex", gap:12, padding:"10px 14px", background:C.faint, borderRadius:10 }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:2 }}>{item.title}</p>
                <p style={{ fontSize:11, color:C.muted }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 다운로드 버튼 */}
      <button onClick={handleExport} disabled={loading}
        style={{ width:"100%", padding:"16px", borderRadius:14,
          background: loading ? "#b0b0c0" : `linear-gradient(135deg,${C.navy},#2d4270)`,
          color:"#fff", border:"none", fontWeight:800, fontSize:15,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 4px 20px rgba(26,39,68,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
        {loading
          ? <><span>⏳</span> 생성 중...</>
          : <><span>📥</span> {year}년 세금 신고 자료 다운로드 (.xlsx)</>}
      </button>

      <p style={{ fontSize:11, color:C.muted, marginTop:12, textAlign:"center", lineHeight:1.7 }}>
        실제 .xlsx 파일로 저장됩니다 · 엑셀·구글스프레드시트 모두 지원<br/>
        수식이 포함되어 있어 데이터 수정 시 자동 재계산됩니다
      </p>
    </div>
  );
}
