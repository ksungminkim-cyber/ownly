// src/app/api/account/delete/route.js
// 회원 탈퇴 API — 인증된 유저 본인만 삭제 가능
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });

    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseSecret) return Response.json({ error: "서버 설정 오류" }, { status: 500 });

    // 1) 본인 토큰 검증 — 요청자 ID를 서버가 직접 추출
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return Response.json({ error: "인증 실패" }, { status: 401 });
    const userId = userData.user.id;

    const headers = {
      Authorization: `Bearer ${supabaseSecret}`,
      apikey: supabaseSecret,
      "Content-Type": "application/json",
    };

    // 2) 본인 데이터 삭제 (RLS가 user_id 기반이라 직접 삭제)
    const tables = [
      "community_comments",
      "community_likes",
      "community_posts",
      "subscriptions",
      "ai_usage",
      "vacancies",
      "payments",
      "contracts",
      "tenants",
      "billing_history",
      "notification_logs",
      "repairs",
      "buildings",
      "ledger",
    ];

    await Promise.all(
      tables.map((table) =>
        fetch(`${supabaseUrl}/rest/v1/${table}?user_id=eq.${userId}`, {
          method: "DELETE",
          headers,
        })
      )
    );

    // 3) Auth 유저 삭제
    const deleteRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}`,
      { method: "DELETE", headers }
    );

    if (!deleteRes.ok) {
      const err = await deleteRes.text();
      return Response.json({ error: "유저 삭제 실패: " + err }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
