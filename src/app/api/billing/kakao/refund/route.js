// 카카오페이 결제 취소(환불)
// 본인의 billing_history 행을 찾아 카카오페이 cancel API 호출 → 카드사로 환불
//
// 사용처: /dashboard/billing 페이지의 "환불 요청" 버튼 또는 관리자 직접 호출
//
// 동작 흐름:
//   1) 본인 인증 → access_token 으로 user 확인
//   2) billing_history.id (또는 kakao_tid) 로 거래 조회 + 본인 소유 검증
//   3) 카카오페이 /online/v1/payment/cancel 호출
//   4) billing_history.status = "refunded", refunded_at 갱신
//   5) 옵션: 환불 사유에 따라 구독도 cancelled 로 함께 처리

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { KAKAOPAY_BASE, KAKAOPAY_CID, KAKAOPAY_SECRET, authHeaders, adminClient, userClientFrom, fmtKakaoError } from "../_helpers";

export async function POST(req) {
  if (!KAKAOPAY_SECRET) {
    return NextResponse.json({ error: "KAKAOPAY_SECRET_KEY 미설정" }, { status: 500 });
  }

  const userClient = userClientFrom(req);
  if (!userClient) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  const userId = userData.user.id;

  let body = {};
  try { body = await req.json(); } catch {}
  const billingHistoryId = body.id;        // 선택 (billing_history.id)
  const explicitTid = body.tid;            // 선택 (직접 tid 지정)
  const reason = (body.reason || "사용자 요청").toString().slice(0, 200);
  const alsoCancelSubscription = body.cancelSubscription !== false; // 기본 true

  const admin = adminClient();

  // 1) 환불 대상 거래 조회
  let target;
  if (billingHistoryId) {
    const { data, error } = await admin.from("billing_history")
      .select("*").eq("id", billingHistoryId).eq("user_id", userId).single();
    if (error || !data) return NextResponse.json({ error: "거래를 찾을 수 없습니다" }, { status: 404 });
    target = data;
  } else if (explicitTid) {
    const { data, error } = await admin.from("billing_history")
      .select("*").eq("kakao_tid", explicitTid).eq("user_id", userId).single();
    if (error || !data) return NextResponse.json({ error: "tid 거래를 찾을 수 없습니다" }, { status: 404 });
    target = data;
  } else {
    // 최근 paid 거래 (기본값)
    const { data, error } = await admin.from("billing_history")
      .select("*").eq("user_id", userId).eq("status", "paid")
      .order("paid_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "환불 가능한 거래가 없습니다" }, { status: 404 });
    target = data;
  }

  if (target.status === "refunded") {
    return NextResponse.json({ error: "이미 환불된 거래입니다" }, { status: 400 });
  }
  if (target.pg !== "kakao" || !target.kakao_tid) {
    return NextResponse.json({ error: "카카오페이 거래가 아닙니다 (수동 처리 필요)" }, { status: 400 });
  }

  const amount = Number(target.amount) || 0;
  if (amount <= 0) {
    return NextResponse.json({ error: "환불 금액이 유효하지 않습니다" }, { status: 400 });
  }

  // 2) 카카오페이 cancel API 호출
  let resp, kbody;
  try {
    resp = await fetch(`${KAKAOPAY_BASE}/online/v1/payment/cancel`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        cid: KAKAOPAY_CID,
        tid: target.kakao_tid,
        cancel_amount: amount,
        cancel_tax_free_amount: 0,
        // payload_data 는 옵션
      }),
    });
    kbody = await resp.json();
  } catch (e) {
    return NextResponse.json({ error: "카카오페이 취소 호출 실패: " + e.message }, { status: 502 });
  }

  if (!resp.ok) {
    return NextResponse.json(fmtKakaoError(resp, kbody), { status: resp.status });
  }

  // 3) billing_history 업데이트
  try {
    await admin.from("billing_history").update({
      status: "refunded",
      // 'refunded_at' 컬럼이 있으면 갱신, 없으면 무시 (try/catch)
      refunded_at: new Date().toISOString(),
      refund_reason: reason,
    }).eq("id", target.id);
  } catch (e) {
    // refunded_at·refund_reason 컬럼이 없는 경우 — status 만 갱신
    console.warn("billing_history update partial:", e?.message);
    await admin.from("billing_history").update({ status: "refunded" }).eq("id", target.id);
  }

  // 4) 옵션: 구독도 함께 취소
  let subscriptionCancelled = false;
  if (alsoCancelSubscription) {
    const { data: sub } = await admin.from("subscriptions").select("*").eq("user_id", userId).single();
    if (sub && sub.status !== "cancelled" && sub.pg === "kakao" && sub.kakao_sid) {
      try {
        await fetch(`${KAKAOPAY_BASE}/online/v1/payment/manage/subscription/inactive`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ cid: KAKAOPAY_CID, sid: sub.kakao_sid }),
        });
      } catch (e) { console.warn("subscription inactive call failed:", e?.message); }
      await admin.from("subscriptions").update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: `refund: ${reason}`,
        next_payment_at: null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
      subscriptionCancelled = true;
    }
  }

  return NextResponse.json({
    ok: true,
    refunded_amount: amount,
    kakao_tid: target.kakao_tid,
    subscription_cancelled: subscriptionCancelled,
    message: subscriptionCancelled
      ? "환불 완료 + 구독 해지 처리되었습니다. 카드사 환불은 1~3영업일 소요됩니다."
      : "환불 완료. 카드사 환불은 1~3영업일 소요됩니다.",
  });
}
