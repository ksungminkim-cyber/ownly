// 초대 코드 적용 — 신규 가입 직후 호출
// 양쪽 유저의 Plus 트라이얼 기간을 +30일 연장 + 보상 이력 기록
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const REWARD_DAYS = 30;

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "초대 코드가 필요합니다" }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1) 호출자(피초대자) 인증
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    const inviteeId = userData.user.id;

    const admin = createClient(supabaseUrl, supabaseService);

    // 2) 초대 코드 유효성
    const { data: codeRow } = await admin
      .from("user_invite_codes")
      .select("user_id")
      .eq("code", code.toUpperCase())
      .single();
    if (!codeRow) return NextResponse.json({ error: "유효하지 않은 초대 코드" }, { status: 404 });

    const inviterId = codeRow.user_id;
    if (inviterId === inviteeId) {
      return NextResponse.json({ error: "본인 코드는 사용할 수 없어요" }, { status: 400 });
    }

    // 3) 중복 보상 방지 (피초대자당 1회만)
    const { data: existing } = await admin
      .from("invite_rewards")
      .select("id")
      .eq("invitee_id", inviteeId)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "이미 초대 보상을 받으셨습니다" }, { status: 400 });

    // 4) 양쪽 트라이얼 연장 — subscriptions 테이블의 current_period_end를 +30일
    const addDays = (base, days) => {
      const d = base ? new Date(base) : new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString();
    };

    // 피초대자 sub
    const { data: inviteeSub } = await admin.from("subscriptions").select("*").eq("user_id", inviteeId).single();
    if (inviteeSub) {
      await admin.from("subscriptions").update({
        current_period_end: addDays(inviteeSub.current_period_end, REWARD_DAYS),
        status: inviteeSub.status === "active" ? "active" : "trial",
        plan: inviteeSub.plan || "plus",
        updated_at: new Date().toISOString(),
      }).eq("user_id", inviteeId);
    } else {
      await admin.from("subscriptions").insert({
        user_id: inviteeId,
        plan: "plus",
        status: "trial",
        current_period_end: addDays(null, REWARD_DAYS + 14), // 기본 14일 + 보너스 30일
      });
    }

    // 초대자 sub
    const { data: inviterSub } = await admin.from("subscriptions").select("*").eq("user_id", inviterId).single();
    if (inviterSub) {
      await admin.from("subscriptions").update({
        current_period_end: addDays(inviterSub.current_period_end, REWARD_DAYS),
        status: inviterSub.status === "active" ? "active" : "trial",
        plan: inviterSub.plan || "plus",
        updated_at: new Date().toISOString(),
      }).eq("user_id", inviterId);
    } else {
      await admin.from("subscriptions").insert({
        user_id: inviterId,
        plan: "plus",
        status: "trial",
        current_period_end: addDays(null, REWARD_DAYS),
      });
    }

    // 5) 보상 이력 기록
    await admin.from("invite_rewards").insert({
      inviter_id: inviterId,
      invitee_id: inviteeId,
      reward_days: REWARD_DAYS,
    });

    return NextResponse.json({
      ok: true,
      rewardDays: REWARD_DAYS,
      message: `${REWARD_DAYS}일 Plus 무료 체험이 추가됐습니다!`,
    });
  } catch (err) {
    console.error("[invite/apply]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
