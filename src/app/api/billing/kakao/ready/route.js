// 카카오페이 정기결제 — 결제 준비 (1단계)
// 사용자: 결제 버튼 클릭 → 이 API 호출 → 응답의 next_redirect_*_url 로 이동 → 카카오페이 화면에서 인증

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { KAKAOPAY_BASE, KAKAOPAY_CID, KAKAOPAY_SECRET, authHeaders, adminClient, userClientFrom, PLAN_PRICE_KRW, PLAN_NAME, fmtKakaoError } from "../_helpers";

export async function POST(req) {
  if (!KAKAOPAY_SECRET) {
    return NextResponse.json({ error: "KAKAOPAY_SECRET_KEY 환경변수가 설정되지 않았습니다" }, { status: 500 });
  }

  // 1) 본인 인증
  const userClient = userClientFrom(req);
  if (!userClient) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  const user = userData.user;

  // 2) 요청 파싱
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const planId = (body.planId || "").toString();
  const cycle = body.cycle === "annual" ? "annual" : "monthly";
  const price = PLAN_PRICE_KRW[planId];
  if (!price) return NextResponse.json({ error: "유효하지 않은 플랜" }, { status: 400 });

  const amount = cycle === "annual" ? Math.round(price * 12 * 0.8) : price;
  const itemName = PLAN_NAME[planId] + (cycle === "annual" ? " (연간)" : "");
  const orderId = `ownly_${planId}_${cycle}_${user.id.slice(0,8)}_${Date.now()}`;

  // 3) 콜백 URL — 현재 호스트 기준
  const origin = (() => {
    const h = req.headers.get("host") || "ownly.kr";
    const proto = h.includes("localhost") ? "http" : "https";
    return `${proto}://${h}`;
  })();
  const successUrl = `${origin}/dashboard/checkout/success?plan=${encodeURIComponent(planId)}&cycle=${encodeURIComponent(cycle)}&order=${encodeURIComponent(orderId)}`;
  const failUrl    = `${origin}/dashboard/checkout/${encodeURIComponent(planId)}?failed=1`;
  const cancelUrl  = `${origin}/dashboard/checkout/${encodeURIComponent(planId)}?cancelled=1`;

  // 4) 카카오페이 결제 준비 호출
  let kakaoResp, kakaoBody;
  try {
    kakaoResp = await fetch(`${KAKAOPAY_BASE}/online/v1/payment/ready`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        cid: KAKAOPAY_CID,
        partner_order_id: orderId,
        partner_user_id: user.id,
        item_name: itemName,
        quantity: 1,
        total_amount: amount,
        tax_free_amount: 0,
        approval_url: successUrl,
        fail_url: failUrl,
        cancel_url: cancelUrl,
      }),
    });
    kakaoBody = await kakaoResp.json();
  } catch (e) {
    return NextResponse.json({ error: "카카오페이 호출 실패: " + e.message }, { status: 502 });
  }

  if (!kakaoResp.ok) return NextResponse.json(fmtKakaoError(kakaoResp, kakaoBody), { status: kakaoResp.status });

  // 5) tid + orderId 를 임시 저장 (approve 단계에서 검증)
  try {
    const admin = adminClient();
    await admin.from("subscriptions").upsert({
      user_id: user.id,
      plan: planId,
      pg: "kakao",
      kakao_cid: KAKAOPAY_CID,
      kakao_tid: kakaoBody.tid,
      toss_order_id: orderId, // 컬럼명은 toss_order_id 지만 일반 partner_order_id 용으로 재사용
      status: "pending",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  } catch (e) {
    console.warn("subscription pending upsert failed:", e?.message);
  }

  // 6) 클라이언트가 카카오페이 결제창으로 이동할 URL 반환
  return NextResponse.json({
    tid: kakaoBody.tid,
    orderId,
    next_redirect_pc_url: kakaoBody.next_redirect_pc_url,
    next_redirect_mobile_url: kakaoBody.next_redirect_mobile_url,
    next_redirect_app_url: kakaoBody.next_redirect_app_url,
    android_app_scheme: kakaoBody.android_app_scheme,
    ios_app_scheme: kakaoBody.ios_app_scheme,
    created_at: kakaoBody.created_at,
  });
}
