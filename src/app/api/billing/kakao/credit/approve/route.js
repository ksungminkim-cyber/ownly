// 카카오페이 단건 결제 — 내용증명 추가 발급권 승인 (2단계)
// POST { pg_token, orderId } → 승인 → certified_credits.balance += qty

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { KAKAOPAY_BASE, KAKAOPAY_SECRET, authHeaders, adminClient, userClientFrom, fmtKakaoError } from "../../_helpers";

// ⚠️ 정기결제 CID(CT75680604)로 폴백하지 않는다 — 정기 CID 는 결제창에 정기결제 동의가 뜨고 빌링키가 발급되어 단건 구매에 부적합
const ONETIME_CID = process.env.KAKAOPAY_ONETIME_CID || "";

export async function POST(req) {
  if (!KAKAOPAY_SECRET) {
    return NextResponse.json({ error: "KAKAOPAY_SECRET_KEY 환경변수가 설정되지 않았습니다" }, { status: 500 });
  }
  if (!ONETIME_CID) {
    return NextResponse.json({ error: "단건결제 CID(KAKAOPAY_ONETIME_CID)가 설정되지 않았습니다" }, { status: 503 });
  }

  const userClient = userClientFrom(req);
  if (!userClient) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  const user = userData.user;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const { pg_token, orderId } = body;
  if (!pg_token || !orderId) return NextResponse.json({ error: "pg_token / orderId 가 필요합니다" }, { status: 400 });

  const admin = adminClient();
  const { data: purchase } = await admin.from("credit_purchases").select("*")
    .eq("user_id", user.id).eq("order_id", orderId).single();
  if (!purchase?.kakao_tid) {
    return NextResponse.json({ error: "결제 준비 정보를 찾을 수 없습니다. 다시 시도해주세요." }, { status: 400 });
  }
  // 중복 승인(새로고침 등) 방어 — 이미 처리된 주문은 현재 잔액만 돌려준다
  if (purchase.status === "paid") {
    const { data: c } = await admin.from("certified_credits").select("balance").eq("user_id", user.id).maybeSingle();
    return NextResponse.json({ ok: true, alreadyPaid: true, qty: purchase.qty, balance: c?.balance ?? 0 });
  }

  let resp, kbody;
  try {
    resp = await fetch(`${KAKAOPAY_BASE}/online/v1/payment/approve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        cid: ONETIME_CID,
        tid: purchase.kakao_tid,
        partner_order_id: orderId,
        partner_user_id: user.id,
        pg_token,
      }),
    });
    kbody = await resp.json();
  } catch (e) {
    return NextResponse.json({ error: "카카오페이 승인 호출 실패: " + e.message }, { status: 502 });
  }
  if (!resp.ok) {
    await admin.from("credit_purchases").update({ status: "failed" }).eq("id", purchase.id);
    return NextResponse.json(fmtKakaoError(resp, kbody), { status: resp.status });
  }

  // 잔액 가산 (service role — RLS 우회)
  const { data: cur } = await admin.from("certified_credits").select("balance").eq("user_id", user.id).maybeSingle();
  const newBalance = (cur?.balance || 0) + purchase.qty;
  const { error: upErr } = await admin.from("certified_credits").upsert({
    user_id: user.id, balance: newBalance, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (upErr) return NextResponse.json({ error: "발급권 적립 실패: " + upErr.message }, { status: 500 });

  await admin.from("credit_purchases").update({
    status: "paid", kakao_aid: kbody.aid, paid_at: kbody?.approved_at || new Date().toISOString(),
  }).eq("id", purchase.id);

  // 결제 이력 (관리자 MRR 그래프에서 plan='credit' 로 구분)
  try {
    await admin.from("billing_history").insert({
      user_id: user.id, plan: "credit", amount: kbody?.amount?.total ?? purchase.amount, status: "paid",
      method: kbody?.payment_method_type === "MONEY" ? "money" : "card", pg: "kakao",
      kakao_tid: purchase.kakao_tid, kakao_aid: kbody.aid, receipt_url: null,
      paid_at: kbody?.approved_at || new Date().toISOString(),
    });
  } catch (e) { console.warn("billing_history insert failed:", e?.message); }

  return NextResponse.json({ ok: true, qty: purchase.qty, balance: newBalance, amount: purchase.amount });
}
