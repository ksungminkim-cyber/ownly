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
// localStorage 에 만료/손상된 토큰이 남아있는 경우만 정리합니다.
// (이전에는 모든 AuthApiError 를 잡아 OAuth 콜백 중에도 signOut 되는 부작용이 있었음)
if (typeof window !== "undefined") {
  const handler = (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason?.error_description || reason || "");
    const code = String(reason?.code || reason?.error || "");
    const isRefreshIssue =
      /Invalid Refresh Token|Refresh Token Not Found|refresh_token_not_found|refresh token/i.test(msg) ||
      /refresh_token_not_found|invalid_refresh_token/i.test(code);
    if (isRefreshIssue) {
      console.warn("[supabase] stale refresh token 감지 — 자동 정리합니다");
      try {
        supabase.auth.signOut().catch(() => {});
        // Supabase가 localStorage에 저장한 토큰 강제 제거
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const projectRef = url.match(/https?:\/\/([^.]+)\./)?.[1];
        if (projectRef) {
          window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
        }
      } catch {}
      event.preventDefault?.();
    }
  };
  window.addEventListener("unhandledrejection", handler);
}
