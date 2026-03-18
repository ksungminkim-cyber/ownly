export const runtime = "edge";

export async function GET(req) {
  const clientId     = process.env.NAVER_CLIENT_ID;
  const redirectUri  = `${new URL(req.url).origin}/auth/naver/callback`;
  // state: CSRF 방지용 랜덤값 (edge에서 crypto 사용 가능)
  const state        = crypto.randomUUID();

  const naverAuthUrl = new URL("https://nid.naver.com/oauth2.0/authorize");
  naverAuthUrl.searchParams.set("response_type", "code");
  naverAuthUrl.searchParams.set("client_id", clientId);
  naverAuthUrl.searchParams.set("redirect_uri", redirectUri);
  naverAuthUrl.searchParams.set("state", state);

  const res = Response.redirect(naverAuthUrl.toString(), 302);
  // state를 쿠키에 저장해서 callback에서 검증
  const headers = new Headers(res.headers);
  headers.set("Set-Cookie", `naver_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300`);
  return new Response(null, { status: 302, headers });
}
