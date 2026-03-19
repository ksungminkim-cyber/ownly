// src/app/auth/callback/page.js
// 소셜 로그인(구글/카카오/네이버) 포함 모든 인증 콜백
// 닉네임 없는 최초 가입자에게 자동으로 닉네임 생성해서 저장
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { generateNickname } from "../../../lib/nickname";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("인증 처리 중...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data?.session;

        if (session) {
          // ✅ 닉네임 없으면 자동 생성해서 저장 (소셜 로그인 포함)
          const user = session.user;
          const hasNickname = !!user?.user_metadata?.nickname;

          if (!hasNickname) {
            const autoNickname = generateNickname();
            await supabase.auth.updateUser({
              data: { nickname: autoNickname },
            });
          }

          setStatus("✅ 인증 완료! 대시보드로 이동합니다...");
          setTimeout(() => router.push("/dashboard"), 800);
        } else {
          // hash에서 직접 처리 (매직링크 등)
          const hash = window.location.hash;
          if (hash && hash.includes("access_token")) {
            // hash 방식 세션 재시도
            await new Promise(r => setTimeout(r, 500));
            const { data: data2 } = await supabase.auth.getSession();
            const session2 = data2?.session;

            if (session2) {
              const user2 = session2.user;
              if (!user2?.user_metadata?.nickname) {
                await supabase.auth.updateUser({ data: { nickname: generateNickname() } });
              }
            }

            setStatus("✅ 인증 완료! 대시보드로 이동합니다...");
            setTimeout(() => router.push("/dashboard"), 800);
          } else {
            setStatus("로그인 페이지로 이동합니다...");
            setTimeout(() => router.push("/login"), 1500);
          }
        }
      } catch (e) {
        setStatus("인증 중 오류가 발생했습니다. 다시 로그인해주세요.");
        setTimeout(() => router.push("/login"), 2000);
      }
    };

    handleCallback();
  }, [router]);

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
