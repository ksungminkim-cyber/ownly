// src/app/auth/callback/page.js
// 소셜 로그인(구글/카카오/네이버) 포함 모든 인증 콜백
// - PKCE 흐름의 ?code= 명시적 exchange (detectSessionInUrl race condition 회피)
// - 닉네임/초대코드 처리는 fire-and-forget — 네비게이션 블록 금지
// - router.push 대신 window.location.href 로 강제 풀 네비게이션 (Next 16 클라이언트 라우터 silent fail 회피)
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { generateNickname } from "../../../lib/nickname";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("인증 처리 중...");

  useEffect(() => {
    let cancelled = false;

    const go = (path, delay = 200) => {
      if (cancelled) return;
      setTimeout(() => { window.location.href = path; }, delay);
    };

    const handleCallback = async () => {
      try {
        // 1) PKCE: ?code= 가 있으면 명시적으로 교환 시도
        //    (detectSessionInUrl: true 가 이미 처리했을 수도 있으므로 실패는 무시)
        try {
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");
          if (code) {
            await supabase.auth.exchangeCodeForSession(code).catch(() => {});
          }
        } catch {}

        // 2) Implicit/Magiclink: #access_token= 가 있으면 명시적으로 setSession
        //    (flowType:"pkce" 일 때 detectSessionInUrl 이 hash 를 처리하지 않으므로 직접 처리)
        //    네이버 OAuth → magiclink → /auth/callback#access_token=... 흐름이 여기로 옴
        try {
          const hash = typeof window !== "undefined" ? window.location.hash : "";
          if (hash && hash.includes("access_token")) {
            const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token }).catch(() => {});
              // hash 정리 (브라우저 주소창에서 토큰 노출 방지)
              try { window.history.replaceState(null, "", window.location.pathname); } catch {}
            }
          }
        } catch {}

        // 3) 세션 확인
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const session = data?.session;

        if (!session) {
          if (cancelled) return;
          setStatus("로그인 페이지로 이동합니다...");
          go("/login", 800);
          return;
        }

        // 4) 닉네임 자동 생성 — fire and forget (블록 X)
        const user = session.user;
        if (user && !user?.user_metadata?.nickname) {
          supabase.auth
            .updateUser({ data: { nickname: generateNickname() } })
            .catch(() => {});
        }

        // 5) 초대 코드 — fire and forget
        try {
          const inviteCode = typeof window !== "undefined" ? localStorage.getItem("ownly_invite_code") : null;
          if (inviteCode && session.access_token) {
            fetch("/api/invite/apply", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ code: inviteCode }),
            })
              .then(r => r.json())
              .then(d => {
                try {
                  if (d?.ok) {
                    localStorage.removeItem("ownly_invite_code");
                  } else {
                    localStorage.removeItem("ownly_invite_code");
                  }
                } catch {}
              })
              .catch(() => {});
          }
        } catch {}

        if (cancelled) return;
        setStatus("✅ 인증 완료! 대시보드로 이동합니다...");
        go("/dashboard", 300);
      } catch {
        if (cancelled) return;
        setStatus("인증 중 오류가 발생했습니다. 다시 로그인해주세요.");
        go("/login", 1500);
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"#f5f4f0", fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center", padding:40 }}>
        <div style={{ width:56, height:56, borderRadius:14, background:"linear-gradient(145deg,#1a2744,#2d4270)",
          display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 20px", boxShadow:"0 4px 20px rgba(26,39,68,0.3)" }}>
          <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
            <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
            <rect x="7.5" y="12" width="5" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
          </svg>
        </div>
        <h2 style={{ fontSize:20, fontWeight:800, color:"#1a2744", marginBottom:12 }}>온리(Ownly)</h2>
        {!status.includes("오류") && (
          <div style={{ width:36, height:36, border:"3px solid #e8e6e0", borderTopColor:"#1a2744",
            borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 16px" }} />
        )}
        <p style={{ fontSize:15, color:"#8a8a9a", fontWeight:600 }}>{status}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
