// src/app/api/account/delete/route.js
// 회원 탈퇴 API — Supabase Admin으로 유저 + 데이터 삭제

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) return Response.json({ error: "userId 필수" }, { status: 400 });

    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseSecret) {
      return Response.json({ error: "서버 설정 오류" }, { status: 500 });
    }

    const headers = {
      Authorization: `Bearer ${supabaseSecret}`,
      apikey: supabaseSecret,
      "Content-Type": "application/json",
    };

    // 1. 유저 데이터 삭제 (Supabase RLS가 user_id 기반이라 직접 삭제)
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
    ];

    await Promise.all(
      tables.map((table) =>
        fetch(`${supabaseUrl}/rest/v1/${table}?user_id=eq.${userId}`, {
          method: "DELETE",
          headers,
        })
      )
    );

    // 2. Auth 유저 삭제
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
