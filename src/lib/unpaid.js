// 이번 달 미납 판정 — 대시보드 KPI·알림·네비 배지·세입자 필터가 공통으로 사용
//
// 배경: tenants.status 에 "미납" 을 쓰는 코드는 샘플 데이터뿐이라, 실제 임대인은 대시보드에서
// 미납이 절대 표시되지 않았다(수금 페이지만 payments 기준으로 정확). 여기서 payments 기준으로 통일한다.
// 규칙(서버 크론 /api/notify 의 computeUnpaid 와 동일): 공실·퇴거 제외, 월세 > 0, 판정 회차(dueCycle — 보통 이번 달,
// 납부일이 월말이면 지난달)의 납부일이 지났고 그 회차 paid 기록이 없음. 부분납부(status "partial")는 잔액이 남았으므로 완납이 아니라 미납으로 잡는다.
// 납부일(1~31, 99=말일)을 해당 월의 실제 날짜로 — 짧은 달에서는 그달 마지막 날
export function effectivePayDay(payDay, year, month1) {
  const last = new Date(year, month1, 0).getDate();
  const d = Number(payDay) || 5;
  return Math.min(d >= 99 ? last : d, last);
}

/**
 * 판정 대상 회차(연·월). 납부일이 그달 마지막 날(말일·31일 등)이면 이번 달 몫은 월말이 지나야 연체이므로
 * 지난달 몫을 본다 — 예전엔 "오늘 ≤ 납부일"이 한 달 내내 참이라 말일 납부자가 미납으로 잡히지 않았다.
 * 반환 null = 아직 판정할 회차 없음(이번 달 납부일 전).
 */
export function dueCycle(t, now = new Date()) {
  const year = now.getFullYear(), month = now.getMonth() + 1, today = now.getDate();
  const raw = t.pay_day ?? t.payment_day ?? 5;
  const lastDay = new Date(year, month, 0).getDate();
  const eff = effectivePayDay(raw, year, month);
  if (eff < lastDay) return today > eff ? { year, month } : null;
  const py = month === 1 ? year - 1 : year, pm = month === 1 ? 12 : month - 1;
  // 지난달 말 이후에 등록된 물건은 지난달 몫을 미납으로 보지 않는다
  const created = t.created_at ? new Date(t.created_at) : null;
  if (created && created > new Date(year, month - 1, 1)) return null;
  return { year: py, month: pm };
}

export function getUnpaidTenantIds(tenants = [], payments = [], now = new Date()) {
  const ids = new Set();
  for (const t of tenants) {
    if (t.status === "공실" || t.status === "퇴거") continue;
    if (!(Number(t.rent) > 0)) continue;
    const c = dueCycle(t, now);
    if (!c) continue;
    const paid = payments.some((p) => (p.tid ?? p.tenant_id) === t.id && p.status === "paid" && (p.month || 0) === c.month && (p.year || c.year) === c.year);
    if (!paid) ids.add(t.id);
  }
  return ids;
}

// 해당 연·월 납부일로부터 지난 일수 (연체 표시용, 저장하지 않음). 납부일 전이면 0
export function overdueDays(t, year, month, now = new Date()) {
  const due = new Date(year, month - 1, effectivePayDay(t.pay_day ?? t.payment_day ?? 5, year, month)); // 말일(99)·31일도 그달 실제 날짜로
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - due) / 86400000);
  return days > 0 ? days : 0;
}

// 화면 표시용 상태: 실제 미납이면 "미납", 아니면 저장된 상태
export function displayStatus(t, unpaidIds) {
  if (unpaidIds && unpaidIds.has(t.id) && t.status !== "공실" && t.status !== "퇴거") return "미납";
  return t.status;
}
