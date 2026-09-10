// 플랜 판정 — 클라이언트(AppContext)와 서버 라우트(kakao/send · ai-pricing · billing)가 같은 규칙을 쓴다.
//
// 요금제는 무료 / 플러스(월 9,900원) 두 가지 (2026-09-10 단순화). DB 에 남은 과거 값('pro'·'starter')은 모두 플러스로 정규화한다.
//
// 유료로 인정하는 조건 (전부 만족):
//  - 결제 수단이 실제로 등록된 구독: kakao_sid(카카오 정기결제) 또는 billing_key(범용 컬럼)
//  - status 가 active, 또는 cancelled(해지 예약 — 기간 종료일까지 이용 보장), 또는 past_due(갱신 실패 — 짧은 유예)
//  - current_period_end 가 아직 지나지 않음 (유예 GRACE_DAYS 포함)
// trial(친구 초대 체험)·pending(결제창 이탈)은 유료가 아니다.
import { PLANS, PAID_PLAN_ID, LEGACY_SIGNUP_BEFORE, LEGACY_FREE_UNTIL, LEGACY_LIMITS } from "./constants";

export const GRACE_DAYS = 3;

export function normalizePlan(plan) {
  return !plan || plan === "free" ? "free" : PAID_PLAN_ID;
}

export function paidPlanOf(sub, now = new Date()) {
  if (!sub) return "free";
  const plan = normalizePlan(sub.plan);
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

// 기능 게이트용 "활성 플랜" — trial 도 인정 (초대 체험), 해지 예약도 기간 종료일까지 인정
export function activePlanOf(sub, now = new Date()) {
  if (!sub) return "free";
  const plan = normalizePlan(sub.plan);
  const periodOk = !sub.current_period_end || new Date(sub.current_period_end) > now;
  const statusOk = sub.status === "active" || sub.status === "trial" || (sub.status === "cancelled" && !!sub.current_period_end);
  return statusOk && periodOk ? plan : "free";
}

// 기존 가입자 보호 — 2026-09-10 이전 가입 계정은 공개 약속대로 LEGACY_FREE_UNTIL 까지 플러스 기능을 무료로 쓴다
export function isLegacyFreeUser(user, now = new Date()) {
  const created = user?.created_at ? new Date(user.created_at) : null;
  if (!created || Number.isNaN(created.getTime())) return false;
  return created < new Date(LEGACY_SIGNUP_BEFORE) && now < new Date(LEGACY_FREE_UNTIL);
}

// 유저가 지금 쓸 수 있는 플랜과 한도 (화면·서버 공통의 단일 판정)
//  1) 유료·체험 구독이 살아 있으면 그 플랜의 한도
//  2) 아니지만 기존 가입자 무료 기간이면 플러스 한도에 실비 항목(내용증명·알림톡·AI)만 LEGACY_LIMITS
//  3) 그 외 무료 플랜 한도
export function entitlementsOf(user, sub, now = new Date()) {
  const active = activePlanOf(sub, now);
  if (active !== "free") {
    return { plan: active, limits: PLANS[active].limits, legacy: false, paid: paidPlanOf(sub, now) !== "free" };
  }
  if (isLegacyFreeUser(user, now)) {
    return { plan: PAID_PLAN_ID, limits: { ...PLANS[PAID_PLAN_ID].limits, ...LEGACY_LIMITS }, legacy: true, paid: false };
  }
  return { plan: "free", limits: PLANS.free.limits, legacy: false, paid: false };
}
