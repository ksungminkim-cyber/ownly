"use client";
// 공개 무료 도구의 "결과 일부만 공개, 전체는 가입 후" 잠금 (2026-09-29 결정)
// - 로그인 사용자: children 그대로
// - 비로그인: 잠긴 항목 목록 + 가입 버튼 (children 은 렌더하지 않는다 — 흐림 처리만 하면 페이지 소스로 결과가 새어 나감)
// - 가입 후 next 경로로 돌아와 전체 결과를 보게 한다
import { useEffect, useState } from "react";
import Link from "next/link";
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

  useEffect(() => {
    if (signedIn !== false || viewed) return;
    trackToolAction(tool, "gate_view");
    Promise.resolve().then(() => setViewed(true));
  }, [signedIn, viewed, tool]);

  if (signedIn === null) return null;
  if (signedIn) return children;

  const back = next || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard");
  const href = `/login?mode=signup&next=${encodeURIComponent(back)}`;

  return (
    <div className="surface-card" style={{ padding: "18px 18px 16px", marginTop: 14, border: "1px dashed var(--accent-border)", background: "var(--accent-light)" }}>
      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>🔒 {title}</p>
      {items.length > 0 && (
        <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8 }}>
          {items.map((it) => <li key={it}>{it}</li>)}
        </ul>
      )}
      <Link href={href} onClick={() => { try { onSignup?.(); } catch {} trackToolCta(tool); }} className="btn btn-fill" style={{ display: "inline-block", textDecoration: "none" }}>
        무료 가입하고 전체 보기 →
      </Link>
      <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "8px 0 0" }}>카카오·구글·네이버로 10초 가입 · 카드 등록 없음 · 가입 후 이 화면으로 돌아옵니다</p>
    </div>
  );
}
