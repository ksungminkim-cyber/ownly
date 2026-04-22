// src/app/api/billing/cancel/route.js
// 구독 취소: 자동 결제 중단, 현재 결제 기간 종료일까지 서비스 유지
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  // 유저 토큰으로 본인 확인
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  const userId = userData.user.id;

  let body = {};
  try { body = await req.json(); } catch {}
  const reason = (body.reason || "").toString().slice(0, 500);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: sub, error: subErr } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (subErr || !sub) return NextResponse.json({ error: "구독 정보를 찾을 수 없습니다" }, { status: 404 });
  if (sub.status === "cancelled") return NextResponse.json({ error: "이미 취소된 구독입니다" }, { status: 400 });

  const { error: updErr } = await admin
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason || null,
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
