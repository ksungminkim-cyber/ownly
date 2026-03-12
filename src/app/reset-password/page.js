"use client";
import { useState, useEffect } from "react";
import { Spinner } from "../../components/shared";
import { C } from "../../lib/constants";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw]         = useState("");
  const [pw2, setPw2]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [done, setDone]     = useState(false);
  const [ready, setReady]   = useState(false);

  // Supabase가 URL 해시에서 세션을 자동으로 복원
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  const handleReset = async () => {
    if (pw.length < 6)  { setError("6자 이상 입력하세요"); return; }
    if (pw !== pw2)     { setError("비밀번호가 일치하지 않습니다"); return; }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) { setError(error.message); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit','Noto Sans KR',sans-serif" }}>
      <div style={{ width: 420, maxWidth: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, margin: "0 auto 16px" }}>🏠</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>새 비밀번호 설정</h2>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px" }}>
          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 8 }}>비밀번호가 변경되었습니다</h3>
              <p style={{ fontSize: 13, color: C.muted }}>3초 후 로그인 페이지로 이동합니다...</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>새 비밀번호</p>
                <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="6자 이상"
                  style={{ width: "100%", padding: "12px 14px", fontSize: 14, color: C.text, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>비밀번호 확인</p>
                <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="동일하게 입력"
                  style={{ width: "100%", padding: "12px 14px", fontSize: 14, color: C.text, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
              </div>
              {error && (
                <p style={{ fontSize: 12, color: C.rose, background: C.rose + "12", border: `1px solid ${C.rose}30`, borderRadius: 9, padding: "10px 14px" }}>{error}</p>
              )}
              <button onClick={handleReset} disabled={loading || !ready} className="btn-primary"
                style={{ padding: "13px", borderRadius: 12, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: (loading || !ready) ? 0.7 : 1 }}>
                {loading ? <Spinner size={16} /> : "비밀번호 변경하기"}
              </button>
              {!ready && <p style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>이메일 링크를 통해 접속해주세요</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
