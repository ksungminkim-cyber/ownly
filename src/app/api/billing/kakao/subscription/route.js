// 카카오페이 정기결제 — 매월 자동 청구 (3단계, sid 사용)
// 호출 주체:
//   - Supabase Edge Function 의 billing-renewal (cron, 매일 00:30 KST)
//   - 또는 운영자 어드민 페이지 수동 호출
//
// 보안: SERVICE_ROLE_KEY 또는 BILLING_RENEWAL_TOKEN 헤더로 인증

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { KAKAOPAY_BASE, KAKAOPAY_CID, KAKAOPAY_SECRET, authHeaders, adminClient, PLAN_PRICE_KRW, PLAN_NAME, fmtKakaoError, nextMonthlyDate } from "../_helpers";

const RENEWAL_TOKEN = process.env.BILLING_RENEWAL_TOKEN || "";

function isAuthorized(req) {
  // cron job 인증: x-billing-token 헤더 또는 Bearer SERVICE_ROLE_KEY
  const token = req.headers.get("x-billing-token");
  if (RENEWAL_TOKEN && token === RENEWAL_TOKEN) return true;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) return true;
  return false;
}

export async function POST(req) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "권한 없음" }, { status: 401 });
  if (!KAKAOPAY_SECRET) return NextResponse.json({ error: "KAKAOPAY_SECRET_KEY 미설정" }, { status: 500 });

  let body = {};
  try { body = await req.json(); } catch {}
  const onlyUserId = body.userId; // 특정 사용자만 청구 (테스트용)
  const force = body.force === true; // next_payment_at 무시 (어드민 강제 청구)

  const admin = adminClient();
  const now = new Date();

  // 청구 대상: pg=kakao, status=active, sid 존재, next_payment_at <= now
  let q = admin
    .from("subscriptions")
    .select("*")
    .eq("pg", "kakao")
    .eq("status", "active")
    .not("kakao_sid", "is", null);
  if (onlyUserId) q = q.eq("user_id", onlyUserId);
  if (!force) q = q.lte("next_payment_at", now.toISOString());

  const { data: subs, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const sub of subs || []) {
    const planId = sub.plan;
    const amount = PLAN_PRICE_KRW[planId];
    if (!amount) { results.push({ user_id: sub.user_id, skipped: "unknown plan" }); continue; }
    const orderId = `ownly_renew_${planId}_${sub.user_id.slice(0,8)}_${Date.now()}`;

    try {
      const resp = await fetch(`${KAKAOPAY_BASE}/online/v1/payment/subscription`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          cid: KAKAOPAY_CID,
          sid: sub.kakao_sid,
          partner_order_id: orderId,
          partner_user_id: sub.user_id,
          item_name: PLAN_NAME[planId] + " (자동결제)",
          quantity: 1,
          total_amount: amount,
          tax_free_amount: 0,
        }),
      });
      const k = await resp.json();

      if (!resp.ok) {
        // 실패 처리: status를 'past_due'로 표시하고 다음날 재시도
        const retry = new Date(now); retry.setDate(retry.getDate() + 1);
        await admin.from("subscriptions").update({
          status: "past_due",
          next_payment_at: retry.toISOString(),
          cancel_reason: `kakao_renew_fail: ${k?.error_code || resp.status} ${k?.error_message || ""}`,
          updated_at: new Date().toISOString(),
        }).eq("user_id", sub.user_id);
        await admin.from("billing_history").insert({
          user_id: sub.user_id,
          plan: planId,
          amount,
          status: "failed",
          method: "card",
          pg: "kakao",
          paid_at: new Date().toISOString(),
        });
        results.push({ user_id: sub.user_id, ok: false, ...fmtKakaoError(resp, k) });
        continue;
      }

      // 성공: 다음 결제 예정 갱신
      const next = nextMonthlyDate(now);
      await admin.from("subscriptions").update({
        status: "active",
        current_period_end: next.toISOString(),
        next_payment_at: next.toISOString(),
        last_payment_at: new Date().toISOString(),
        toss_order_id: orderId,
        cancel_reason: null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", sub.user_id);

      await admin.from("billing_history").insert({
        user_id: sub.user_id,
        plan: planId,
        amount: k?.amount?.total ?? amount,
        status: "paid",
        method: k?.payment_method_type === "MONEY" ? "money" : "card",
        pg: "kakao",
        kakao_tid: k?.tid || null,
        kakao_aid: k?.aid || null,
        paid_at: k?.approved_at || new Date().toISOString(),
      });

      results.push({ user_id: sub.user_id, ok: true, amount });
    } catch (e) {
      results.push({ user_id: sub.user_id, ok: false, error: e.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
