// 카카오페이 정기결제 — 결제 승인 (2단계)
// success 페이지에서 pg_token 받아 호출 → sid(빌링키) 발급 → 구독 활성화

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { KAKAOPAY_BASE, KAKAOPAY_CID, KAKAOPAY_SECRET, authHeaders, adminClient, userClientFrom, PLAN_PRICE_KRW, fmtKakaoError, nextMonthlyDate } from "../_helpers";

export async function POST(req) {
  if (!KAKAOPAY_SECRET) {
    return NextResponse.json({ error: "KAKAOPAY_SECRET_KEY 환경변수가 설정되지 않았습니다" }, { status: 500 });
  }

  const userClient = userClientFrom(req);
  if (!userClient) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  const user = userData.user;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const { pg_token, planId, cycle = "monthly", orderId } = body;
  if (!pg_token || !planId || !orderId) {
    return NextResponse.json({ error: "pg_token / planId / orderId 가 필요합니다" }, { status: 400 });
  }

  const admin = adminClient();

  // 1) pending 구독에서 tid 조회
  const { data: pending } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("toss_order_id", orderId)
    .single();
  if (!pending?.kakao_tid) {
    return NextResponse.json({ error: "결제 준비 정보를 찾을 수 없습니다. 처음부터 다시 시도해주세요." }, { status: 400 });
  }

  // 2) 카카오페이 승인 호출
  let resp, kbody;
  try {
    resp = await fetch(`${KAKAOPAY_BASE}/online/v1/payment/approve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        cid: KAKAOPAY_CID,
        tid: pending.kakao_tid,
        partner_order_id: orderId,
        partner_user_id: user.id,
        pg_token,
      }),
    });
    kbody = await resp.json();
  } catch (e) {
    return NextResponse.json({ error: "카카오페이 승인 호출 실패: " + e.message }, { status: 502 });
  }

  if (!resp.ok) return NextResponse.json(fmtKakaoError(resp, kbody), { status: resp.status });

  // 카카오페이 응답 주요 필드
  // - aid: 결제 승인 ID (취소·환불 시 필요)
  // - sid: 정기결제 빌링키 (매월 자동 청구에 사용)
  // - payment_method_type: "MONEY" | "CARD"
  // - amount.total, approved_at
  // - card_info: { issuer_corp, kakaopay_purchase_corp, ... }
  const sid = kbody.sid;
  const aid = kbody.aid;
  const approvedAmount = kbody?.amount?.total ?? PLAN_PRICE_KRW[planId];
  const methodLabel = kbody?.card_info?.kakaopay_purchase_corp
    ? `카드 (${kbody.card_info.kakaopay_purchase_corp})`
    : kbody?.payment_method_type === "MONEY" ? "카카오페이 머니" : "카카오페이";

  // 3) 구독 활성화
  const periodEnd = nextMonthlyDate(new Date());
  try {
    await admin.from("subscriptions").upsert({
      user_id: user.id,
      plan: planId,
      pg: "kakao",
      status: "active",
      kakao_cid: KAKAOPAY_CID,
      kakao_tid: pending.kakao_tid,
      kakao_sid: sid,
      payment_method_label: methodLabel,
      current_period_end: periodEnd.toISOString(),
      next_payment_at: periodEnd.toISOString(),
      last_payment_at: new Date().toISOString(),
      toss_order_id: orderId,
      cancelled_at: null,
      cancel_reason: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  } catch (e) {
    console.error("subscription activate failed:", e?.message);
    return NextResponse.json({ error: "구독 활성화 저장 실패: " + e.message }, { status: 500 });
  }

  // 4) 결제 이력 기록
  try {
    await admin.from("billing_history").insert({
      user_id: user.id,
      plan: planId,
      amount: approvedAmount,
      status: "paid",
      method: kbody?.payment_method_type === "MONEY" ? "money" : "card",
      pg: "kakao",
      kakao_tid: pending.kakao_tid,
      kakao_aid: aid,
      receipt_url: null,
      paid_at: kbody?.approved_at || new Date().toISOString(),
    });
  } catch (e) {
    console.warn("billing_history insert failed:", e?.message);
  }

  // 5) billing_waitlist 정리 (있으면 converted 로 변경)
  try {
    await admin.from("billing_waitlist").update({ status: "converted" }).eq("user_id", user.id);
  } catch {}

  return NextResponse.json({
    ok: true,
    sid,
    plan: planId,
    cycle,
    amount: approvedAmount,
    next_payment_at: periodEnd.toISOString(),
  });
}
