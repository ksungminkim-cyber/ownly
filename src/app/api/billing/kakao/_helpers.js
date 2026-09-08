// 카카오페이 정기결제 공통 헬퍼
// 가맹점 CID: CT75680604 (정기결제 전용, 2026-05-27 심사 통과)
// 공식 가이드: https://developers.kakaopay.com/docs/payment/online/common

import { createClient } from "@supabase/supabase-js";
import { EARLY_ACCESS_FREE, EARLY_SUPPORTER } from "../../../../lib/constants";

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

// 플랜별 가격 (만원 단위 X, 원 단위)
export const PLAN_PRICE_KRW = {
  plus: 19900,
  pro: 32900,
};
export const PLAN_NAME = {
  plus: "온리 플러스 월 구독",
  pro: "온리 프로 월 구독",
};

// 얼리 서포터 — 얼리 액세스 기간의 플러스 플랜은 50% 가격(월 9,900원)으로 결제되고 12개월 고정
export function isSupporterOffer(planId) {
  return EARLY_ACCESS_FREE && planId === EARLY_SUPPORTER.planId;
}
// 이번 주기에 청구할 금액. monthly 기준가 → 연간이면 12개월 20% 할인
export function cycleAmount(monthly, cycle) {
  return cycle === "annual" ? Math.round(monthly * 12 * 0.8) : monthly;
}
export function itemNameFor(planId, cycle) {
  const base = isSupporterOffer(planId) ? "온리 플러스 얼리 서포터 구독" : PLAN_NAME[planId];
  return base + (cycle === "annual" ? " (연간)" : "");
}
// 다음 결제 예정일 — 주기별
export function nextPeriodDate(cycle, from = new Date()) {
  const d = new Date(from);
  if (cycle === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
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
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}
