// 이번 달 미납 판정 — 대시보드 KPI·알림·네비 배지·세입자 필터가 공통으로 사용
//
// 배경: tenants.status 에 "미납" 을 쓰는 코드는 샘플 데이터뿐이라, 실제 임대인은 대시보드에서
// 미납이 절대 표시되지 않았다(수금 페이지만 payments 기준으로 정확). 여기서 payments 기준으로 통일한다.
// 규칙(서버 크론 /api/notify 의 computeUnpaid 와 동일): 공실·퇴거 제외, 월세 > 0, 납부일(pay_day, 기본 5일)이 지났고,
// 이번 달 paid 기록이 없음. 부분납부(status "partial")는 잔액이 남았으므로 완납이 아니라 미납으로 잡는다.
export function getUnpaidTenantIds(tenants = [], payments = [], now = new Date()) {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = now.getDate();
  const paidSet = new Set(
    payments
      .filter((p) => p.status === "paid" && (p.month || 0) === month && (p.year || year) === year)
      .map((p) => p.tid ?? p.tenant_id)
  );
  const ids = new Set();
  for (const t of tenants) {
    if (t.status === "공실" || t.status === "퇴거") continue;
    if (!(Number(t.rent) > 0)) continue;
    const payDay = Number(t.pay_day ?? t.payment_day ?? 5);
    if (today <= payDay) continue;
    if (!paidSet.has(t.id)) ids.add(t.id);
  }
  return ids;
}

// 해당 연·월 납부일로부터 지난 일수 (연체 표시용, 저장하지 않음). 납부일 전이면 0
export function overdueDays(t, year, month, now = new Date()) {
  const payDay = Number(t.pay_day ?? t.payment_day ?? 5);
  const due = new Date(year, month - 1, payDay);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - due) / 86400000);
  return days > 0 ? days : 0;
}

// 화면 표시용 상태: 실제 미납이면 "미납", 아니면 저장된 상태
export function displayStatus(t, unpaidIds) {
  if (unpaidIds && unpaidIds.has(t.id) && t.status !== "공실" && t.status !== "퇴거") return "미납";
  return t.status;
}
