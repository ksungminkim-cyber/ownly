"use client";
import { useState } from "react";
import { Spinner, AuthInput } from "../../components/shared";
import { C } from "../../lib/constants";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab]       = useState("login"); // login | signup | reset
  const [form, setForm]     = useState({ email: "", pw: "", name: "", agree: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resetSent, setResetSent] = useState(false);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // ── 로그인 ──
  const handleLogin = async () => {
    const errs = {};
    if (!form.email.includes("@")) errs.email = "올바른 이메일을 입력하세요";
    if (form.pw.length < 4)        errs.pw    = "4자 이상 입력하세요";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.pw });
      if (error) { setErrors({ submit: error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 올바르지 않습니다" : error.message }); return; }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ── 회원가입 ──
  const handleSignup = async () => {
    const errs = {};
    if (!form.name)                errs.name  = "이름을 입력하세요";
    if (!form.email.includes("@")) errs.email = "올바른 이메일을 입력하세요";
    if (form.pw.length < 6)        errs.pw    = "6자 이상 입력하세요";
    if (!form.agree)               errs.agree = "약관에 동의해주세요";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.pw,
        options: { data: { full_name: form.name } },
      });
      if (error) { setErrors({ submit: error.message }); return; }
      setErrors({ submit: "✅ 가입 확인 이메일이 발송되었습니다. 이메일을 확인해주세요." });
      setTimeout(() => setTab("login"), 3000);
    } finally {
      setLoading(false);
    }
  };

  // ── 비밀번호 재설정 ──
  const handleReset = async () => {
    if (!form.email.includes("@")) { setErrors({ email: "올바른 이메일을 입력하세요" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { setErrors({ submit: error.message }); return; }
      setResetSent(true);
    } finally {
      setLoading(false);
    }
  };

  const submit = tab === "login" ? handleLogin : tab === "signup" ? handleSignup : handleReset;

  const switchTab = (t) => { setTab(t); setErrors({}); setResetSent(false); };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit','Noto Sans KR',sans-serif" }}>
      <div style={{ width: 420, maxWidth: "100%" }}>
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div onClick={() => router.push("/")} style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🏠</div>
            <div>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>Ownly</span>
              <span style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginLeft: 6 }}>by McLean</span>
            </div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
            {tab === "login" ? "로그인" : tab === "signup" ? "회원가입" : "비밀번호 재설정"}
          </h2>
          {tab === "reset" && !resetSent && (
            <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>가입한 이메일로 재설정 링크를 보내드립니다</p>
          )}
        </div>

        {/* 탭 (로그인/회원가입만) */}
        {tab !== "reset" && (
          <div style={{ display: "flex", marginBottom: 22, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
            {["login", "signup"].map((t) => (
              <button key={t} onClick={() => switchTab(t)}
                style={{ flex: 1, padding: "10px", background: tab === t ? C.indigo : "transparent", border: "none", color: tab === t ? "#fff" : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .15s" }}>
                {t === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>
        )}

        {/* ── 비밀번호 재설정 완료 화면 ── */}
        {tab === "reset" && resetSent ? (
          <div style={{ background: C.surface, border: `1px solid ${C.emerald}40`, borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 10 }}>이메일을 확인해주세요</h3>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
              <span style={{ color: C.emerald, fontWeight: 700 }}>{form.email}</span>으로<br />
              비밀번호 재설정 링크를 보내드렸습니다.<br />
              메일함을 확인해 링크를 클릭하세요.
            </p>
            <button onClick={() => switchTab("login")}
              style={{ padding: "11px 28px", borderRadius: 11, background: C.indigo, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              로그인으로 돌아가기
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* 회원가입: 이름 */}
            {tab === "signup" && (
              <AuthInput label="이름" placeholder="홍길동" value={form.name} onChange={set("name")} error={errors.name} icon="👤" />
            )}

            {/* 이메일 */}
            <AuthInput label="이메일" type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} error={errors.email} icon="✉" />

            {/* 비밀번호 (재설정 탭에서는 숨김) */}
            {tab !== "reset" && (
              <div>
                <AuthInput label="비밀번호" type="password" placeholder={tab === "signup" ? "6자 이상" : "••••••"} value={form.pw} onChange={set("pw")} error={errors.pw} icon="🔒" />
                {/* 로그인 탭: 비밀번호 찾기 링크 */}
                {tab === "login" && (
                  <div style={{ textAlign: "right", marginTop: 6 }}>
                    <button onClick={() => switchTab("reset")}
                      style={{ background: "none", border: "none", color: C.indigo, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                      비밀번호를 잊으셨나요?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 회원가입: 약관 동의 */}
            {tab === "signup" && (
              <>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" className="custom-check" checked={form.agree} onChange={set("agree")} />
                  <span style={{ fontSize: 12, color: C.muted }}>이용약관 및 개인정보 처리방침에 동의합니다</span>
                </label>
                {errors.agree && <p style={{ fontSize: 11, color: C.rose }}>{errors.agree}</p>}
              </>
            )}

            {/* 공통 에러/성공 메시지 */}
            {errors.submit && (
              <p style={{ fontSize: 12, color: errors.submit.startsWith("✅") ? C.emerald : C.rose, background: errors.submit.startsWith("✅") ? C.emerald + "12" : C.rose + "12", border: `1px solid ${errors.submit.startsWith("✅") ? C.emerald : C.rose}30`, borderRadius: 9, padding: "10px 14px", lineHeight: 1.6 }}>
                {errors.submit}
              </p>
            )}

            {/* 제출 버튼 */}
            <button onClick={submit} disabled={loading} className="btn-primary"
              style={{ padding: "13px", borderRadius: 12, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.8 : 1 }}>
              {loading ? <Spinner size={16} /> : tab === "login" ? "로그인" : tab === "signup" ? "가입하기" : "재설정 링크 보내기"}
            </button>

            {/* 비밀번호 재설정 탭: 뒤로 가기 */}
            {tab === "reset" && (
              <button onClick={() => switchTab("login")}
                style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", textAlign: "center", padding: "4px 0" }}>
                ← 로그인으로 돌아가기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
