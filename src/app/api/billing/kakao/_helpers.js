// 카카오페이 정기결제 공통 헬퍼
// 가맹점 CID: CT75680604 (정기결제 전용, 2026-05-27 심사 통과)
// 공식 가이드: https://developers.kakaopay.com/docs/payment/online/common

import { createClient } from "@supabase/supabase-js";
import { PLANS, PAID_PLAN_ID } from "../../../../lib/constants";

export const KAKAOPAY_BASE = "https://open-api.kakaopay.com";
export const KAKAOPAY_CID = process.env.KAKAOPAY_CID || "CT75680604";
export const KAKAOPAY_SECRET = process.env.KAKAOPAY_SECRET_KEY || "";

export function authHeaders() {
  return {
    Authorization: `SECRET_KEY ${KAKAOPAY_SECRET}`,
    // ⚠️ 한글 item_name 이 깨지지 않도록 charset 명시 (이거 없으면 -400 "item_name has invalid value")
    "Content-Type": "application/json; charset=utf-8",
  };
}

export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Authorization header → user 확인용 클라이언트
export function userClientFrom(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// 판매 중인 유료 플랜은 플러스 하나 (원 단위). 가격은 PLANS 에서만 정의한다.
export const PLAN_PRICE_KRW = {
  [PAID_PLAN_ID]: PLANS[PAID_PLAN_ID].price,
};
export const PLAN_NAME = {
  [PAID_PLAN_ID]: "온리 플러스 월 구독",
};

// 이번 주기에 청구할 금액 — 신규 결제는 월간만 받지만, 과거 연간 레코드가 남아 있을 수 있어 크론이 주기별로 계산
export function cycleAmount(monthly, cycle) {
  return cycle === "annual" ? Math.round(monthly * 12 * 0.8) : monthly;
}
export function itemNameFor(planId, cycle) {
  return (PLAN_NAME[planId] || "온리 구독") + (cycle === "annual" ? " (연간)" : "");
}
// 월 더하기 — 말일 오버플로 방지 (1/31 + 1개월 = 2/28, 3/3 아님)
export function addMonths(from, months) {
  const d = new Date(from);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

// 다음 결제 예정일 — 주기별
export function nextPeriodDate(cycle, from = new Date()) {
  return addMonths(from, cycle === "annual" ? 12 : 1);
}

// 카카오페이 응답 에러를 통일된 형태로
export function fmtKakaoError(resp, body) {
  return {
    error: body?.error_message || body?.msg || `카카오페이 오류 (HTTP ${resp.status})`,
    code: body?.error_code || body?.code || resp.status,
    detail: body,
  };
}

// 다음 자동 결제 예정일 계산 (한국 시간 기준 1개월 후)
export function nextMonthlyDate(from = new Date()) {
  return addMonths(from, 1);
}
