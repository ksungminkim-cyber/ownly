// CSV 내보내기 유틸 — 한글 Excel 호환 (BOM 포함)

function escapeCsvField(v) {
  if (v === null || v === undefined) return "";
  const str = String(v);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function rowsToCsv(headers, rows) {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map(r => r.map(escapeCsvField).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function downloadCsv(filename, csv) {
  // UTF-8 BOM + Excel 한글 호환
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

// ─── 세입자 목록 ───
export function exportTenants(tenants) {
  const headers = ["이름", "전화번호", "유형", "세부유형", "주소", "보증금(만원)", "월세(만원)", "관리비(만원)", "납부일", "계약시작", "계약종료", "상태", "공시가(만원)"];
  const rows = (tenants || []).map(t => [
    t.name || "", t.phone || "", t.pType || t.p_type || "",
    t.sub || t.sub_type || "", t.addr || t.address || "",
    t.dep || t.deposit || 0, t.rent || 0, t.maintenance || 0,
    t.pay_day === 99 ? "말일" : (t.pay_day || ""),
    t.start_date || "", t.end_date || "", t.status || "",
    t.public_price || 0,
  ]);
  downloadCsv(`세입자_목록_${today()}.csv`, rowsToCsv(headers, rows));
}

// ─── 수금 이력 ───
export function exportPayments(payments, tenants) {
  const tenantMap = Object.fromEntries((tenants || []).map(t => [t.id, t]));
  const headers = ["연도", "월", "세입자", "주소", "월세(만원)", "납부일", "상태", "관리비 납부", "비고"];
  const rows = (payments || []).map(p => {
    const t = tenantMap[p.tid] || {};
    return [
      p.year || "", p.month || "", t.name || "", t.addr || "",
      p.amt || p.amount || 0, p.paid || p.paid_date || "",
      p.status || "", p.maintenance_paid ? "Y" : "N", p.memo || "",
    ];
  });
  downloadCsv(`수금_이력_${today()}.csv`, rowsToCsv(headers, rows));
}

// ─── 계약서 목록 ───
export function exportContracts(contracts, tenants) {
  const tenantMap = Object.fromEntries((tenants || []).map(t => [t.id, t]));
  const headers = ["세입자", "주소", "계약시작", "계약종료", "월세(만원)", "보증금(만원)", "특약사항"];
  const rows = (contracts || []).map(c => {
    const t = tenantMap[c.tenant_id] || {};
    return [
      t.name || c.tenant_name || "", t.addr || "",
      c.start_date || "", c.end_date || "",
      c.rent || 0, c.deposit || 0, c.special_terms || "",
    ];
  });
  downloadCsv(`계약서_목록_${today()}.csv`, rowsToCsv(headers, rows));
}

// ─── 장부 (수입·지출) ───
export function exportLedger(ledger) {
  const headers = ["날짜", "유형", "분류", "금액(만원)", "메모", "자동기록"];
  const rows = (ledger || []).map(l => [
    l.date || "", l.type === "income" ? "수입" : "지출",
    l.category || "", l.amount || 0, l.memo || "",
    l.auto_generated ? "Y" : "N",
  ]);
  downloadCsv(`장부_${today()}.csv`, rowsToCsv(headers, rows));
}

// ─── 전체 압축 ───
export function exportAll({ tenants, payments, contracts, ledger }) {
  exportTenants(tenants);
  setTimeout(() => exportPayments(payments, tenants), 200);
  setTimeout(() => exportContracts(contracts, tenants), 400);
  setTimeout(() => exportLedger(ledger), 600);
}
