// 초대 코드 적용 — 신규 가입 직후 호출
// 양쪽 유저의 Plus 트라이얼 기간을 +30일 연장 + 보상 이력 기록
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { paidPlanOf } from "../../../../lib/plan";

const REWARD_DAYS = 30;
const CREDIT_REWARD = 2; // 내용증명 추가 발급권 (양쪽 각각)

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

    // 체험 연장 규칙 (2026-09-10 정리):
    //  - 결제 수단이 등록된 유료 구독자: 건드리지 않음 (기간을 늘려도 갱신 크론이 덮어써 무의미하고, 상태를 trial 로 뒤집으면 위험)
    //  - 행이 없거나 status 가 trial: current_period_end 를 +REWARD_DAYS
    //  - 그 외(cancelled·past_due·pending 등): 그대로 둠
    const grantTrial = async (uid, baseDays) => {
      const { data: sub } = await admin.from("subscriptions").select("*").eq("user_id", uid).maybeSingle();
      if (!sub) {
        await admin.from("subscriptions").insert({ user_id: uid, plan: "plus", status: "trial", current_period_end: addDays(null, baseDays + REWARD_DAYS) });
        return "created";
      }
      if (paidPlanOf(sub) !== "free") return "paid_skip";
      if (sub.status !== "trial") return "status_skip";
      const base = sub.current_period_end && new Date(sub.current_period_end) > new Date() ? sub.current_period_end : null;
      await admin.from("subscriptions").update({ current_period_end: addDays(base, REWARD_DAYS), plan: sub.plan || "plus", updated_at: new Date().toISOString() }).eq("user_id", uid);
      return "extended";
    };
    await grantTrial(inviteeId, 14); // 신규: 기본 14일 + 보너스
    await grantTrial(inviterId, 0);

    // 4-b) 양쪽에 내용증명 추가 발급권 +CREDIT_REWARD 장
    //      (체험 일수 외에 바로 쓸 수 있는 보상을 함께 지급)
    for (const uid of [inviteeId, inviterId]) {
      const { data: cur } = await admin.from("certified_credits").select("balance").eq("user_id", uid).maybeSingle();
      await admin.from("certified_credits").upsert({
        user_id: uid, balance: (cur?.balance || 0) + CREDIT_REWARD, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
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
      creditReward: CREDIT_REWARD,
      message: `내용증명 추가 발급권 ${CREDIT_REWARD}장과 Plus ${REWARD_DAYS}일이 추가됐습니다!`,
    });
  } catch (err) {
    console.error("[invite/apply]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
