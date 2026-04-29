// 초대 코드 즉석 발급 (백필 누락된 기존 유저용)
// 마이그레이션 트리거가 신규 가입자에게만 적용되어, 그 이전 유저에게 코드가 없을 수 있음
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 호출자 인증
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, supabaseService);

    // 이미 코드 있으면 그대로 반환
    const { data: existing } = await admin.from("user_invite_codes").select("code").eq("user_id", userId).maybeSingle();
    if (existing?.code) return NextResponse.json({ code: existing.code, created: false });

    // 새 코드 생성 (UUID 해시 8자) — 충돌 시 5회까지 재시도
    let attempt = 0;
    while (attempt < 5) {
      const candidate = (Math.random().toString(36) + Date.now().toString(36)).replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
      const { data: inserted, error } = await admin
        .from("user_invite_codes")
        .insert({ user_id: userId, code: candidate })
        .select()
        .single();
      if (!error && inserted) return NextResponse.json({ code: inserted.code, created: true });
      attempt += 1;
    }
    return NextResponse.json({ error: "코드 발급 실패 — 잠시 후 다시 시도해주세요" }, { status: 500 });
  } catch (err) {
    console.error("[invite/generate-code]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
