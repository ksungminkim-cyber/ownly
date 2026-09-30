/**
 * 전세·보증금 위험 + 등록임대사업자 점검 — 순수 계산 (React·Supabase 의존 없음)
 * 금액 단위: 만원. 날짜: "YYYY-MM-DD" 문자열. today 는 테스트를 위해 주입 가능.
 * 등급·법 규정 문구는 일반 참고용이며 확정 판단이 아님 — 화면에 면책을 함께 표시한다.
 */

export const RISK_BASIS = "2026년 9월 기준";
export const RISK_DISCLAIMER = "2026년 9월 기준 일반 안내입니다. 세부 요건·예외는 렌트홈(renthome.go.kr)·관할 지자체·세무사에게 확인하세요.";
/* 전세가율 등급 기준(참고) — 업계에서 흔히 쓰는 경계값이며 법정 기준이 아님 */
export const RATIO_DANGER = 80;
export const RATIO_CAUTION = 70;
export const INSURANCE_WARN_DAYS = 60;
export const URGENT_RETURN_DAYS = 90;
export const RENT_REPORT_MONTHS = 3;

const DAY = 86400000;

/* "YYYY-MM-DD" 또는 Date → UTC 자정 타임스탬프 (시간대 영향 제거) */
function toUtc(v) {
  if (!v) return null;
  if (v instanceof Date) return Date.UTC(v.getFullYear(), v.getMonth(), v.getDate());
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function iso(ts) { return new Date(ts).toISOString().slice(0, 10); }
export function daysUntil(date, today = new Date()) {
  const a = toUtc(date), b = toUtc(today);
  if (a == null || b == null) return null;
  return Math.round((a - b) / DAY);
}
/* 월 더하기 — 말일 넘침은 그 달 말일로 맞춤 (11-30 + 3개월 → 02-28/29) */
export function addMonthsIso(date, months) {
  const ts = toUtc(date);
  if (ts == null) return null;
  const d = new Date(ts);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + months, day = d.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return iso(Date.UTC(y, m, Math.min(day, last)));
}

const depOf = (t) => Number(t?.dep ?? t?.deposit ?? 0) || 0;
const endOf = (t) => t?.end_date || t?.contract_end || "";
const isVacant = (t) => t?.status === "공실";

export function ratioLevel(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return null;
  if (ratio >= RATIO_DANGER) return "danger";
  if (ratio >= RATIO_CAUTION) return "caution";
  return "good";
}

/**
 * 전세가율 = 보증금 ÷ 기준가. 기준가 우선순위: 시세 추정 → 매입가 → 공시가격.
 * 공시가격은 보통 시세보다 낮아 전세가율이 실제보다 높게 계산된다.
 */
export function jeonseRatio(t) {
  const dep = depOf(t);
  const candidates = [
    ["market", Number(t?.market_value) || 0, "시세 추정 기준"],
    ["purchase", Number(t?.purchase_price) || 0, "매입가 기준"],
    ["public", Number(t?.public_price) || 0, "공시가격 기준(실제 전세가율은 더 낮을 수 있음)"],
  ];
  const hit = candidates.find(([, v]) => v > 0);
  if (dep <= 0) return { deposit: 0, base: hit ? hit[1] : null, basis: hit ? hit[0] : null, basisLabel: hit ? hit[2] : "", ratio: null, level: null, reason: "no_deposit" };
  if (!hit) return { deposit: dep, base: null, basis: null, basisLabel: "", ratio: null, level: null, reason: "no_base" };
  const ratio = Math.round((dep / hit[1]) * 1000) / 10;
  return { deposit: dep, base: hit[1], basis: hit[0], basisLabel: hit[2], ratio, level: ratioLevel(ratio), reason: null };
}

/**
 * 보증보험 상태
 *  none     보증금 없음(해당 없음)
 *  missing  보증금 > 0 인데 만기일 미입력 → 미가입(또는 미입력)
 *  expired  만기 지남
 *  expiring 만기 60일 이내
 *  short    만기가 계약 만료일보다 이름
 *  ok
 */
export function insuranceStatus(t, today = new Date()) {
  const dep = depOf(t);
  if (dep <= 0) return { status: "none", until: null, daysLeft: null, warn: false };
  const until = t?.guarantee_insurance_until || null;
  if (!until) return { status: "missing", until: null, daysLeft: null, warn: true };
  const dl = daysUntil(until, today);
  const end = endOf(t);
  let status = "ok";
  if (dl < 0) status = "expired";
  else if (dl <= INSURANCE_WARN_DAYS) status = "expiring";
  else if (end && toUtc(until) < toUtc(end)) status = "short";
  return { status, until, daysLeft: dl, warn: status !== "ok" };
}

/**
 * 보증금 반환 일정 — 계약 만료일이 오늘~12개월 내인 물건 (공실·보증금 0 제외)
 * months: 이번 달부터 13칸(12개월 뒤 같은 날이 속한 달까지) [{ key:"2026-10", label:"10월", total, items }]
 */
export function returnSchedule(tenants, today = new Date(), monthsAhead = 12) {
  const t0 = toUtc(today);
  const d0 = new Date(t0);
  const limit = toUtc(addMonthsIso(iso(t0), monthsAhead));
  const months = [];
  for (let i = 0; i <= monthsAhead; i++) { /* 오늘+12개월이 속한 달까지 포함 */
    const d = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + i, 1));
    const key = iso(d.getTime()).slice(0, 7);
    months.push({ key, label: `${d.getUTCMonth() + 1}월`, year: d.getUTCFullYear(), total: 0, items: [] });
  }
  const items = [];
  (tenants || []).forEach((t) => {
    const dep = depOf(t);
    const end = endOf(t);
    const ts = toUtc(end);
    if (dep <= 0 || isVacant(t) || ts == null || ts < t0 || ts > limit) return;
    const dl = Math.round((ts - t0) / DAY);
    const item = { tenant: t, deposit: dep, end, daysLeft: dl, urgent: dl <= URGENT_RETURN_DAYS };
    items.push(item);
    const bucket = months.find((m) => m.key === end.slice(0, 7));
    if (bucket) { bucket.total += dep; bucket.items.push(item); }
  });
  items.sort((a, b) => a.daysLeft - b.daysLeft);
  return {
    months,
    items,
    total: items.reduce((s, i) => s + i.deposit, 0),
    urgentTotal: items.filter((i) => i.urgent).reduce((s, i) => s + i.deposit, 0),
    urgentCount: items.filter((i) => i.urgent).length,
  };
}

/**
 * 등록임대사업자 점검 (registered_rental=true 인 물건만, 아니면 null)
 * 각 항목 level: ok | info | warn | danger
 */
export function registeredRentalChecks(t, today = new Date()) {
  if (!t?.registered_rental) return null;
  const checks = [];

  // 1) 의무임대기간
  if (t.mandatory_until) {
    const dl = daysUntil(t.mandatory_until, today);
    checks.push(dl < 0
      ? { key: "mandatory", label: "의무임대기간", level: "info", text: `${t.mandatory_until} 종료 — 말소·양도 전 요건(세제 혜택 유지 조건 등)을 확인하세요` }
      : { key: "mandatory", label: "의무임대기간", level: "info", text: `${t.mandatory_until} 종료까지 ${dl}일 남음 — 기간 중 임의 양도·말소는 과태료 대상이 될 수 있습니다`, daysLeft: dl });
  } else {
    checks.push({ key: "mandatory", label: "의무임대기간", level: "warn", text: "의무임대기간 종료일이 입력되지 않았어요 (등록증·렌트홈에서 확인)" });
  }

  // 2) 임대료 증액 5% 상한
  const endDl = daysUntil(endOf(t), today);
  const renewalSoon = endDl != null && endDl >= 0 && endDl <= 180;
  checks.push({
    key: "rentcap", label: "임대료 증액 5% 상한", level: renewalSoon ? "warn" : "info",
    text: `${renewalSoon ? `계약 만료 D-${endDl} — ` : ""}갱신·재계약 시 임대료(보증금 포함) 증액은 5% 이내가 원칙입니다. 증액 후 1년 이내 재증액 제한 등 세부 요건을 확인하세요`,
  });

  // 3) 임대보증금 보증 가입 의무
  const ins = insuranceStatus(t, today);
  if (ins.status === "none") checks.push({ key: "insurance", label: "임대보증금 보증", level: "info", text: "보증금이 없어 해당 없음" });
  else if (ins.status === "missing") checks.push({ key: "insurance", label: "임대보증금 보증", level: "danger", text: "등록임대주택은 임대보증금 보증 가입 의무가 있습니다 — 가입 기록(만기일)이 없어요. 예외 요건 해당 여부도 확인하세요" });
  else if (ins.status === "expired") checks.push({ key: "insurance", label: "임대보증금 보증", level: "danger", text: `보증 만기(${ins.until})가 지났어요 — 갱신 여부 확인` });
  else if (ins.status === "expiring") checks.push({ key: "insurance", label: "임대보증금 보증", level: "warn", text: `보증 만기 D-${ins.daysLeft} (${ins.until}) — 갱신 준비` });
  else if (ins.status === "short") checks.push({ key: "insurance", label: "임대보증금 보증", level: "warn", text: `보증 만기(${ins.until})가 계약 만료일보다 빨라요 — 계약기간 전체를 보장하는지 확인` });
  else checks.push({ key: "insurance", label: "임대보증금 보증", level: "ok", text: `가입 · 만기 ${ins.until}` });

  // 4) 임대차계약 신고 (렌트홈) — 계약일로부터 3개월 이내. 체결일 대신 계약 시작일로 추정
  if (t.rent_report_filed_at) {
    checks.push({ key: "report", label: "렌트홈 계약 신고", level: "ok", text: `신고 완료 (${t.rent_report_filed_at})`, filed: true });
  } else if (!t.start_date) {
    checks.push({ key: "report", label: "렌트홈 계약 신고", level: "warn", text: "계약 시작일이 없어 신고 기한을 계산할 수 없어요" });
  } else {
    const deadline = addMonthsIso(t.start_date, RENT_REPORT_MONTHS);
    const dl = daysUntil(deadline, today);
    checks.push(dl < 0
      ? { key: "report", label: "렌트홈 계약 신고", level: "danger", text: `신고 기록 없음 — 추정 기한(${deadline}) ${-dl}일 경과. 이미 신고했다면 완료 표시하세요`, deadline, daysLeft: dl }
      : { key: "report", label: "렌트홈 계약 신고", level: dl <= 30 ? "warn" : "info", text: `추정 기한 ${deadline} (D-${dl}) — 계약 시작일 기준 3개월`, deadline, daysLeft: dl });
  }

  const needsAttention = checks.some((c) => c.level === "warn" || c.level === "danger");
  return { checks, needsAttention };
}

/* 상단 KPI 집계 */
export function summarizeRisk(tenants, today = new Date()) {
  const list = tenants || [];
  let danger = 0, caution = 0, insuranceMissing = 0, registeredAttention = 0, registeredCount = 0, missingBase = 0;
  list.forEach((t) => {
    if (isVacant(t)) return;
    const r = jeonseRatio(t);
    if (r.level === "danger") danger++;
    else if (r.level === "caution") caution++;
    if (r.reason === "no_base") missingBase++;
    if (insuranceStatus(t, today).status === "missing") insuranceMissing++;
    const rc = registeredRentalChecks(t, today);
    if (rc) { registeredCount++; if (rc.needsAttention) registeredAttention++; }
  });
  const sched = returnSchedule(list, today);
  return { danger, caution, insuranceMissing, registeredAttention, registeredCount, missingBase, returnTotal: sched.total, urgentReturnTotal: sched.urgentTotal };
}
