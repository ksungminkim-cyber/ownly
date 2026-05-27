// 카카오페이 정기결제 공통 헬퍼
// 가맹점 CID: CT75680604 (정기결제 전용, 2026-05-27 심사 통과)
// 공식 가이드: https://developers.kakaopay.com/docs/payment/online/common

import { createClient } from "@supabase/supabase-js";

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
