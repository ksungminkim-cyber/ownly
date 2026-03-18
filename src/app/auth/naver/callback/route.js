export const runtime = "edge";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const origin = new URL(req.url).origin;

  if (error || !code) {
    return Response.redirect(`${origin}/login?error=naver_denied`, 302);
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const savedState   = cookieHeader.match(/naver_state=([^;]+)/)?.[1];
  if (!savedState || savedState !== state) {
    return Response.redirect(`${origin}/login?error=naver_state_mismatch`, 302);
  }

  try {
    const clientId     = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const redirectUri  = `${origin}/auth/naver/callback`;

    // 1. 네이버 access_token 발급
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        state,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("네이버 토큰 발급 실패");

    // 2. 네이버 사용자 프로필 조회
    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();
    const profile = profileData.response;
    if (!profile) throw new Error("네이버 프로필 조회 실패");

    const naverId   = profile.id;
    const naverName = profile.name || profile.nickname || "네이버 사용자";
    const email     = profile.email || `naver_${naverId}@ownly.naver`;

    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 3. 기존 사용자 조회
    const listRes  = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${supabaseSecret}`, apikey: supabaseSecret } }
    );
    const listData = await listRes.json();
    const existing = listData?.users?.[0];

    let userId;
    if (existing) {
      userId = existing.id;
    } else {
      // 신규 생성
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseSecret}`,
          apikey: supabaseSecret,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          email_confirm: true,
          user_metadata: {
            full_name:   naverName,
            provider:    "naver",
            naver_id:    naverId,
            avatar_url:  profile.profile_image || null,
          },
        }),
      });
      const createData = await createRes.json();
      if (!createData.id) throw new Error("계정 생성 실패: " + JSON.stringify(createData));
      userId = createData.id;
    }

    // 4. 매직링크 발급 → 토큰 추출
    const linkRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}/generate-link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseSecret}`,
        apikey: supabaseSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "magiclink" }),
    });
    const linkData = await linkRes.json();

    const clearCookie = "naver_state=; Path=/; HttpOnly; Max-Age=0";

    if (linkData.action_link) {
      const actionUrl    = new URL(linkData.action_link);
      const accessToken  = actionUrl.searchParams.get("access_token");
      const refreshToken = actionUrl.searchParams.get("refresh_token");
      if (accessToken) {
        const dest = `${origin}/auth/callback#access_token=${accessToken}&refresh_token=${refreshToken}&type=magiclink`;
        return new Response(null, {
          status: 302,
          headers: { Location: dest, "Set-Cookie": clearCookie },
        });
      }
    }

    if (linkData.confirm_url) {
      return new Response(null, {
        status: 302,
        headers: { Location: linkData.confirm_url, "Set-Cookie": clearCookie },
      });
    }

    throw new Error("세션 발급 실패: " + JSON.stringify(linkData));

  } catch (err) {
    console.error("네이버 콜백 오류:", err.message);
    return Response.redirect(
      `${origin}/login?error=naver_failed&msg=${encodeURIComponent(err.message)}`, 302
    );
  }
}
