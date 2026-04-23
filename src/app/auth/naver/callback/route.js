// src/app/auth/naver/callback/route.js
// 네이버 OAuth 콜백 — nodejs runtime (edge 대비 디버깅 로그 가시성 좋음)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function log(...args) {
  console.log("[NAVER_CB]", new Date().toISOString(), ...args);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const origin = new URL(req.url).origin;

  log("start", { origin, hasCode: !!code, hasState: !!state });

  if (error || !code) {
    log("naver_denied", { error });
    return Response.redirect(`${origin}/login?error=naver_denied`, 302);
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const savedState = cookieHeader.match(/naver_state=([^;]+)/)?.[1];
  if (!savedState || savedState !== state) {
    log("state_mismatch", { saved: savedState?.slice(0, 8), got: state?.slice(0, 8) });
    return Response.redirect(`${origin}/login?error=naver_state_mismatch`, 302);
  }

  try {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const redirectUri = `${origin}/auth/naver/callback`;

    // 1. 네이버 토큰
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code, state }),
    });
    const tokenText = await tokenRes.text();
    let tokenData;
    try { tokenData = JSON.parse(tokenText); }
    catch { tokenData = Object.fromEntries(new URLSearchParams(tokenText)); }
    if (!tokenData.access_token) throw new Error("네이버 토큰 발급 실패: " + JSON.stringify(tokenData));

    // 2. 네이버 프로필
    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();
    const profile = profileData.response;
    if (!profile) throw new Error("네이버 프로필 조회 실패");

    const naverId = profile.id;
    const naverName = profile.name || profile.nickname || "네이버 사용자";
    const email = (profile.email || `naver_${naverId}@ownly.naver`).toLowerCase();
    log("naver_profile", { naverId, email, hasRealEmail: !!profile.email });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 3. 기존 사용자 조회 — email 정확 일치 (대소문자 무시)
    let existing = null;
    const legacyEmail = `naver_${naverId}@ownly.naver`.toLowerCase();
    let page = 1;
    let totalChecked = 0;
    while (page <= 10) {
      const listRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`,
        { headers: { Authorization: `Bearer ${supabaseSecret}`, apikey: supabaseSecret } }
      );
      const listData = await listRes.json();
      const users = listData?.users || [];
      totalChecked += users.length;
      existing = users.find(u => {
        const ue = (u.email || "").toLowerCase();
        return ue === email || ue === legacyEmail;
      });
      if (existing || users.length < 1000) break;
      page++;
    }
    log("lookup", { totalChecked, found: !!existing, foundEmail: existing?.email, foundId: existing?.id });

    let userId;
    if (existing) {
      userId = existing.id;
      log("using_existing_user", { userId, email: existing.email });
    } else {
      // 신규 생성
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${supabaseSecret}`, apikey: supabaseSecret, "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          email_confirm: true,
          user_metadata: { full_name: naverName, provider: "naver", naver_id: naverId, avatar_url: profile.profile_image || null },
        }),
      });
      const createData = await createRes.json();
      if (!createData.id) {
        log("create_failed", createData);
        throw new Error("계정 생성 실패: " + JSON.stringify(createData));
      }
      userId = createData.id;
      log("created_new_user", { userId, email });
    }

    // 3.5 방어: userId 로 실제 유저 조회해 email 일치 확인
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${supabaseSecret}`, apikey: supabaseSecret },
    });
    const verifyData = await verifyRes.json();
    const verifyEmail = (verifyData.email || "").toLowerCase();
    log("verify", { userId, verifyEmail, matches: verifyEmail === email || verifyEmail === legacyEmail });
    if (verifyEmail !== email && verifyEmail !== legacyEmail) {
      throw new Error(`유저 검증 실패: expected=${email} got=${verifyEmail}`);
    }

    // 4. 매직링크 발급
    const linkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: { Authorization: `Bearer ${supabaseSecret}`, apikey: supabaseSecret, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "magiclink", email: verifyEmail, options: { redirect_to: `${origin}/auth/callback` } }),
    });
    const linkData = await linkRes.json();
    const actionLink = linkData.action_link || linkData.properties?.action_link;
    log("generate_link", { hasLink: !!actionLink, linkUserEmail: linkData.email || linkData.properties?.email });

    if (!actionLink) throw new Error("세션 발급 실패: " + JSON.stringify(linkData));

    const clearCookie = "naver_state=; Path=/; HttpOnly; Max-Age=0";
    return new Response(null, {
      status: 302,
      headers: { Location: actionLink, "Set-Cookie": clearCookie },
    });
  } catch (err) {
    log("error", err.message);
    return Response.redirect(
      `${origin}/login?error=naver_failed&msg=${encodeURIComponent(err.message)}`,
      302
    );
  }
}
