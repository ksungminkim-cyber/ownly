import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 — 명시적 auth 옵션 + invalid refresh token 자동 처리
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  }
);

// ⚠️ Invalid Refresh Token 자동 처리
// localStorage 에 만료/손상된 토큰이 남아있는 경우 Supabase 가 AuthApiError 를 던지는데,
// 이를 감지해서 자동으로 stale 세션을 정리합니다 (다음 페이지 진입 시 비로그인 상태로 시작).
if (typeof window !== "undefined") {
  const handler = (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason || "");
    if (
      reason?.name === "AuthApiError" ||
      /Invalid Refresh Token|Refresh Token Not Found|refresh_token_not_found/i.test(msg)
    ) {
      console.warn("[supabase] stale auth token 감지 — 자동 정리합니다");
      try {
        supabase.auth.signOut().catch(() => {});
        // Supabase가 localStorage에 저장한 토큰 강제 제거
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const projectRef = url.match(/https?:\/\/([^.]+)\./)?.[1];
        if (projectRef) {
          window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
        }
      } catch {}
      // 에러를 콘솔에 그대로 띄우지 않도록 swallow
      event.preventDefault?.();
    }
  };
  window.addEventListener("unhandledrejection", handler);
}
