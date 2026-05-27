// 카카오페이 정기결제 — 구독 비활성화 (4단계, sid 만료)
// 사용자: /dashboard/billing 에서 "구독 해지" 클릭 → 이 API 호출
// 흐름: 카카오페이 manage/subscription/inactive 호출 → sid 비활성화 → DB status='cancelled'
// 단, 현재 결제 기간 종료일까지는 서비스 유지

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { KAKAOPAY_BASE, KAKAOPAY_CID, KAKAOPAY_SECRET, authHeaders, adminClient, userClientFrom, fmtKakaoError } from "../_helpers";

export async function POST(req) {
  const userClient = userClientFrom(req);
  if (!userClient) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  const userId = userData.user.id;

  let body = {};
  try { body = await req.json(); } catch {}
  const reason = (body.reason || "").toString().slice(0, 500);

  const admin = adminClient();
  const { data: sub, error: subErr } = await admin
    .from("subscriptions").select("*").eq("user_id", userId).single();
  if (subErr || !sub) return NextResponse.json({ error: "구독 정보를 찾을 수 없습니다" }, { status: 404 });
  if (sub.status === "cancelled") return NextResponse.json({ error: "이미 취소된 구독입니다" }, { status: 400 });

  // 카카오페이 빌링키 비활성화 (선택) — sid 있을 때만
  if (sub.pg === "kakao" && sub.kakao_sid && KAKAOPAY_SECRET) {
    try {
      const resp = await fetch(`${KAKAOPAY_BASE}/online/v1/payment/manage/subscription/inactive`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ cid: KAKAOPAY_CID, sid: sub.kakao_sid }),
      });
      if (!resp.ok) {
        const k = await resp.json().catch(() => ({}));
        // 카카오 비활성화 실패해도 DB 상으로는 취소 진행 (운영자가 수동 처리)
        console.warn("kakao sid inactive failed:", fmtKakaoError(resp, k));
      }
    } catch (e) {
      console.warn("kakao inactive call error:", e?.message);
    }
  }

  const { error: updErr } = await admin
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason || null,
      next_payment_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    current_period_end: sub.current_period_end,
    message: "구독이 취소되었습니다. 현재 결제 기간 종료일까지 서비스를 이용할 수 있습니다.",
  });
}
