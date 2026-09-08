// 카카오페이 단건 결제 — 내용증명 추가 발급권 구매 준비 (1단계)
// POST { qty } → next_redirect_*_url 응답 → 카카오 인증 → /dashboard/certified?credit_order=...&pg_token=...
//

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { KAKAOPAY_BASE, KAKAOPAY_SECRET, authHeaders, adminClient, userClientFrom, fmtKakaoError } from "../../_helpers";
import { CERTIFIED_CREDIT_PRICE_KRW } from "../../../../../../lib/constants";

// ⚠️ 정기결제 CID(CT75680604)로 폴백하지 않는다 — 정기 CID 는 결제창에 정기결제 동의가 뜨고 빌링키가 발급되어 단건 구매에 부적합
const ONETIME_CID = process.env.KAKAOPAY_ONETIME_CID || "";
const ALLOWED_QTY = [1, 3, 5];

export async function POST(req) {
  if (!KAKAOPAY_SECRET) {
    return NextResponse.json({ error: "KAKAOPAY_SECRET_KEY 환경변수가 설정되지 않았습니다" }, { status: 500 });
  }
  if (!ONETIME_CID) {
    // 단건결제 가맹 추가 전 — 사용자에게는 준비 중으로 안내
    return NextResponse.json({ error: "추가 발급권 결제는 준비 중입니다. 곧 열립니다 — 그동안 필요한 건은 inquiry@mclean21.com 으로 문의해 주세요." }, { status: 503 });
  }

  const userClient = userClientFrom(req);
  if (!userClient) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  const user = userData.user;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const qty = Number(body.qty);
  if (!ALLOWED_QTY.includes(qty)) return NextResponse.json({ error: "수량은 1·3·5장 중 선택" }, { status: 400 });

  const amount = CERTIFIED_CREDIT_PRICE_KRW * qty;
  const orderId = `ownly_credit_${user.id.slice(0, 8)}_${Date.now()}`;

  const origin = (() => {
    const h = req.headers.get("host") || "ownly.kr";
    const proto = h.includes("localhost") ? "http" : "https";
    return `${proto}://${h}`;
  })();
  const successUrl = `${origin}/dashboard/certified?credit_order=${encodeURIComponent(orderId)}`;
  const failUrl    = `${origin}/dashboard/certified?credit_failed=1`;
  const cancelUrl  = `${origin}/dashboard/certified?credit_cancelled=1`;

  let kakaoResp, kakaoBody;
  try {
    kakaoResp = await fetch(`${KAKAOPAY_BASE}/online/v1/payment/ready`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        cid: ONETIME_CID,
        partner_order_id: orderId,
        partner_user_id: user.id,
        item_name: `온리 내용증명 추가 발급권 ${qty}장`,
        quantity: qty,
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

  // tid 를 pending 구매 레코드로 보관 (approve 에서 검증)
  const { error: insErr } = await adminClient().from("credit_purchases").insert({
    user_id: user.id, kind: "certified", qty, amount, status: "pending",
    order_id: orderId, kakao_tid: kakaoBody.tid,
  });
  if (insErr) return NextResponse.json({ error: "구매 기록 저장 실패: " + insErr.message }, { status: 500 });

  return NextResponse.json({
    orderId,
    next_redirect_pc_url: kakaoBody.next_redirect_pc_url,
    next_redirect_mobile_url: kakaoBody.next_redirect_mobile_url,
    next_redirect_app_url: kakaoBody.next_redirect_app_url,
  });
}
