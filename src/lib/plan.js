// 구독 상태 → 실제 "유료 플랜" 판정 (클라이언트 AppContext 와 서버 라우트가 같은 규칙을 쓴다)
//
// 유료로 인정하는 조건 (전부 만족):
//  - 결제 수단이 실제로 등록된 구독: kakao_sid(카카오 정기결제) 또는 billing_key(구 Toss)
//  - status 가 active, 또는 cancelled(해지 예약 — 기간 종료일까지 이용 보장), 또는 past_due(갱신 실패 — 짧은 유예)
//  - current_period_end 가 아직 지나지 않음 (유예 GRACE_DAYS 포함)
// trial(무료 체험·초대 보상)·pending(결제창 이탈)은 유료가 아니다 → 얼리 서포터 혜택 대상 아님.
export const GRACE_DAYS = 3;

export function paidPlanOf(sub, now = new Date()) {
  if (!sub) return "free";
  const plan = sub.plan || "free";
  if (plan === "free") return "free";
  const hasMethod = Boolean(sub.kakao_sid || sub.billing_key);
  if (!hasMethod) return "free";
  if (!["active", "cancelled", "past_due"].includes(sub.status)) return "free";
  if (sub.current_period_end) {
    const end = new Date(sub.current_period_end).getTime() + GRACE_DAYS * 86400000;
    if (end <= now.getTime()) return "free";
  }
  return plan;
}

// 정식 과금 후 기능 게이트용 "활성 플랜" — trial 도 인정 (14일 체험·초대 보상), 해지 예약도 기간 종료일까지 인정
export function activePlanOf(sub, now = new Date()) {
  if (!sub) return "free";
  const plan = sub.plan || "free";
  const periodOk = !sub.current_period_end || new Date(sub.current_period_end) > now;
  const statusOk = sub.status === "active" || sub.status === "trial" || (sub.status === "cancelled" && !!sub.current_period_end);
  return statusOk && periodOk ? plan : "free";
}
