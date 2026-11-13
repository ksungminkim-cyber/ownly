"use client";
// 공개 무료 도구의 "결과 일부만 공개, 전체는 가입 후" 잠금 (2026-09-29 결정)
// - 로그인 사용자: children 그대로
// - 비로그인: 잠긴 항목 목록 + 가입 버튼 (children 은 렌더하지 않는다 — 흐림 처리만 하면 페이지 소스로 결과가 새어 나감)
// - 가입 후 next 경로로 돌아와 전체 결과를 보게 한다
import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { trackToolCta, trackToolAction } from "../lib/track";

export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(null); // null = 확인 중
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setSignedIn(Boolean(data?.session));
    })();
    return () => { cancelled = true; };
  }, []);
  return signedIn;
}

/**
 * @param tool     도구 키 (계측용: tool_view 와 같은 값)
 * @param title    잠금 카드 제목
 * @param items    가입하면 볼 수 있는 항목 목록
 * @param next     가입 후 돌아올 경로 (기본: 현재 페이지)
 * @param onSignup 가입 버튼 클릭 직전 콜백 (예: 입력값 보관)
 */
export default function SignupGate({ tool, title, items = [], next, onSignup, children }) {
  const signedIn = useSignedIn();
  const [viewed, setViewed] = useState(false);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (signedIn !== false || viewed) return;
    trackToolAction(tool, "gate_view");
    Promise.resolve().then(() => setViewed(true));
  }, [signedIn, viewed, tool]);

  if (signedIn === null) return null;
  if (signedIn) return children;

  const back = next || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard");
  const href = `/login?mode=signup&next=${encodeURIComponent(back)}`;

  // 버튼 한 번으로 바로 카카오·구글 인증으로 간다 — 예전엔 가입 페이지를 한 번 더 거쳐야 했고,
  // 2026-10~11 도구 방문 284명 중 가입 버튼 클릭이 2명뿐이었다. 인증 후 /auth/callback 이 ownly_next 로 이 화면에 되돌려 준다.
  const social = async (provider) => {
    setBusy(provider);
    try { onSignup?.(); } catch {}
    trackToolCta(tool);
    trackToolAction(tool, "gate_social", { provider });
    try { localStorage.setItem("ownly_next", back); } catch {}
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      // 인앱 브라우저 등에서 실패하면 기존 가입 페이지로 보낸다
      window.location.href = href;
    }
  };

  const btn = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px 14px", borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div className="surface-card" style={{ padding: "18px 18px 16px", marginTop: 14, border: "1px solid var(--accent-border)", background: "var(--surface)" }}>
      <p style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 7 }}>
        <Lock size={15} strokeWidth={2.4} />
        {title}
      </p>
      {items.length > 0 && (
        <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8 }}>
          {items.map((it) => <li key={it}>{it}</li>)}
        </ul>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" onClick={() => social("kakao")} disabled={!!busy} style={{ ...btn, background: "#FEE500", color: "#191600", border: "1px solid #FEE500", opacity: busy && busy !== "kakao" ? 0.6 : 1 }}>
          {busy === "kakao" ? "카카오로 이동 중..." : "카카오로 3초 가입하고 계속"}
        </button>
        <button type="button" onClick={() => social("google")} disabled={!!busy} style={{ ...btn, background: "#fff", color: "#1a2744", border: "1px solid var(--border)", opacity: busy && busy !== "google" ? 0.6 : 1 }}>
          {busy === "google" ? "Google로 이동 중..." : "Google로 가입하고 계속"}
        </button>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "10px 0 0", lineHeight: 1.6 }}>
        무료 · 카드 등록 없음 · 가입 후 이 화면으로 돌아와 이어집니다.{" "}
        <Link href={href} onClick={() => { try { onSignup?.(); } catch {} trackToolCta(tool); }} style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
          이메일·네이버로 가입
        </Link>
      </p>
    </div>
  );
}
