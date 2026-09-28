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
export function exportTenants(tenants, buildings) {
  const buildingMap = Object.fromEntries((buildings || []).map(b => [b.id, b]));
  const headers = ["이름", "전화번호", "유형", "세부유형", "주소", "건물", "보증금(만원)", "월세(만원)", "관리비(만원)", "납부일", "계약시작", "계약종료", "상태", "공시가(만원)", "매입가(만원)", "전월세신고일"];
  const rows = (tenants || []).map(t => [
    t.name || "", t.phone || "", t.pType || t.p_type || "",
    t.sub || t.sub_type || "", t.addr || t.address || "",
    (buildingMap[t.building_id] || {}).name || (buildingMap[t.building_id] || {}).address || "",
    t.dep || t.deposit || 0, t.rent || 0, t.maintenance || 0,
    t.pay_day === 99 ? "말일" : (t.pay_day || ""),
    t.start_date || "", t.end_date || "", t.status || "",
    t.public_price || 0, t.purchase_price ?? "", t.report_filed_at || "",
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
  const headers = ["세입자", "주소", "계약시작", "계약종료", "월세(만원)", "보증금(만원)", "특약사항", "갱신청구권 사용", "갱신 전 월세(만원)", "갱신 전 보증금(만원)"];
  const rows = (contracts || []).map(c => {
    const t = tenantMap[c.tenant_id] || {};
    return [
      t.name || c.tenant_name || "", t.addr || "",
      c.start_date || "", c.end_date || "",
      c.rent || 0, c.deposit || 0, c.special_terms || "",
      c.renewal_right_used == null ? "" : (c.renewal_right_used ? "Y" : "N"),
      c.prev_rent ?? "", c.prev_deposit ?? "",
    ];
  });
  downloadCsv(`계약서_목록_${today()}.csv`, rowsToCsv(headers, rows));
}

// ─── 장부 (수입·지출) ───
export function exportLedger(ledger, tenants) {
  const tenantMap = Object.fromEntries((tenants || []).map(t => [t.id, t]));
  const headers = ["날짜", "유형", "분류", "금액(만원)", "메모", "연결 세입자", "자동기록", "영수증 첨부"];
  const rows = (ledger || []).map(l => [
    l.date || "", l.type === "income" ? "수입" : "지출",
    l.category || "", l.amount || 0, l.memo || "",
    (tenantMap[l.tenant_id] || {}).name || "",
    l.auto_generated ? "Y" : "N",
    l.receipt_path ? "Y" : "N",
  ]);
  downloadCsv(`장부_${today()}.csv`, rowsToCsv(headers, rows));
}

const REPAIR_STATUS = { open: "접수", in_progress: "진행중", done: "완료" };

// ─── 수리 이력 ───
export function exportRepairs(repairs, tenants) {
  const tenantMap = Object.fromEntries((tenants || []).map(t => [t.id, t]));
  const headers = ["날짜", "세입자", "물건", "분류", "내용", "비용(만원)", "업체", "영수증", "상태", "긴급", "요청자", "처리 메모", "완료일시"];
  const rows = (repairs || []).map(r => {
    const t = tenantMap[r.tenant_id] || {};
    return [
      r.date || "", t.name || "", r.property_name || t.addr || "",
      r.category || "", r.memo || "", r.cost || 0, r.vendor || "",
      r.receipt_yn ? "Y" : "N", REPAIR_STATUS[r.status] || r.status || "",
      r.priority === "urgent" ? "Y" : "N", r.source === "tenant" ? "세입자" : "임대인",
      r.response_memo || "", r.completed_at || "",
    ];
  });
  downloadCsv(`수리_이력_${today()}.csv`, rowsToCsv(headers, rows));
}

// ─── 건물 ───
export function exportBuildings(buildings) {
  const headers = ["건물명", "주소", "준공연도", "층수", "주차대수", "대지면적", "메모"];
  const rows = (buildings || []).map(b => [
    b.name || "", b.address || "", b.built_year ?? "", b.total_floors ?? "",
    b.parking_spots ?? "", b.land_area ?? "", b.memo || "",
  ]);
  downloadCsv(`건물_${today()}.csv`, rowsToCsv(headers, rows));
}

// ─── 공실 ───
export function exportVacancies(vacancies) {
  const headers = ["주소", "유형", "세부유형", "공실 시작일", "희망 월세(만원)", "보증금(만원)", "관리비(만원)", "메모"];
  const rows = (vacancies || []).map(v => [
    v.addr || "", v.p_type || "", v.sub_type || "", v.vacant_since || "",
    v.expected_rent || 0, v.deposit || 0, v.maintenance || 0, v.note || "",
  ]);
  downloadCsv(`공실_${today()}.csv`, rowsToCsv(headers, rows));
}

const MAIL_STATUS = { drafted: "작성됨", sent: "발송완료", received: "수령확인", completed: "종결" };
const POST_METHOD = { postal: "우체국 방문", epost: "우체국 전자내용증명", other: "기타" };
const NOTE_TYPE = { call: "전화", visit: "방문", negotiate: "협상", complaint: "민원", memo: "메모", other: "기타" };

// ─── 내용증명 ───
export function exportCertifiedMail(mails) {
  const headers = ["작성일", "수신인", "사유", "상태", "발송일", "등기번호", "수령일", "발송 방법", "본문"];
  const rows = (mails || []).map(m => [
    (m.created_at || "").slice(0, 10), m.tenant_name || "", m.reason || "",
    MAIL_STATUS[m.status] || m.status || "", m.sent_at || "", m.tracking_no || "",
    m.received_at || "", POST_METHOD[m.post_method] || m.post_method || "", m.content || "",
  ]);
  downloadCsv(`내용증명_${today()}.csv`, rowsToCsv(headers, rows));
}

// ─── 세입자 메모 (소통 기록) ───
export function exportTenantNotes(notes, tenants) {
  const tenantMap = Object.fromEntries((tenants || []).map(t => [t.id, t]));
  const headers = ["일시", "세입자", "유형", "제목", "내용", "첨부파일명"];
  const rows = (notes || []).map(n => [
    n.occurred_at || "", (tenantMap[n.tenant_id] || {}).name || "", NOTE_TYPE[n.type] || n.type || "",
    n.title || "", n.content || "", n.file_name || "",
  ]);
  downloadCsv(`세입자_메모_${today()}.csv`, rowsToCsv(headers, rows));
}

// ─── 전체 일괄 (파일별 CSV 연속 다운로드 — 브라우저가 "여러 파일 다운로드" 허용을 물을 수 있음) ───
export function exportAll({ tenants, payments, contracts, ledger, repairs, buildings, vacancies, certifiedMail, tenantNotes }) {
  const jobs = [
    () => exportTenants(tenants, buildings),
    () => exportPayments(payments, tenants),
    () => exportContracts(contracts, tenants),
    () => exportLedger(ledger, tenants),
    () => exportRepairs(repairs, tenants),
    () => exportBuildings(buildings),
    () => exportVacancies(vacancies),
    () => exportCertifiedMail(certifiedMail),
    () => exportTenantNotes(tenantNotes, tenants),
  ];
  jobs.forEach((job, i) => setTimeout(job, i * 300));
  return jobs.length;
}
