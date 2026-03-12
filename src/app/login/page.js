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

function OwnlyLogoMark() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 24px ${C.indigo}55` }}>
        <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
          <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
          <rect x="7.5" y="12" width="5" height="6" rx="1" fill={C.indigo}/>
        </svg>
      </div>
      <div>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff" }}>Ownly</span>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginLeft: 8 }}>by McLean</span>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", pw: "", name: "", phone: "", agree: false });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // 이메일 로그인/가입
  const submit = async () => {
    const errs = {};
    if (!form.email.includes("@")) errs.email = "올바른 이메일을 입력하세요";
    if (form.pw.length < 6) errs.pw = "6자 이상 입력하세요";
    if (tab === "signup" && !form.name) errs.name = "이름을 입력하세요";
    if (tab === "signup" && !form.agree) errs.agree = "약관에 동의해주세요";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setMsg("");
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.pw });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.pw,
          options: { data: { full_name: form.name, phone: form.phone } },
        });
        if (error) throw error;
        setMsg("가입 확인 이메일을 발송했습니다. 메일함을 확인해주세요.");
      }
    } catch (e) {
      setErrors({ submit: e.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 올바르지 않습니다" : e.message });
    } finally {
      setLoading(false);
    }
  };

  // 소셜 로그인
  const socialLogin = async (provider) => {
    setSocialLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (e) {
      setErrors({ submit: e.message });
      setSocialLoading(null);
    }
  };

  // 비밀번호 찾기
  const resetPassword = async () => {
    if (!form.email.includes("@")) { setErrors({ email: "이메일을 먼저 입력하세요" }); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setErrors({ submit: error.message });
    else setMsg("비밀번호 재설정 이메일을 발송했습니다.");
  };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit','Noto Sans KR',sans-serif" }}>
      <div style={{ width: 420, maxWidth: "100%" }}>
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div onClick={() => router.push("/")} style={{ display: "inline-block", cursor: "pointer", marginBottom: 16 }}>
            <OwnlyLogoMark />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{tab === "login" ? "로그인" : "회원가입"}</h2>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {/* 구글 */}
          <button
            onClick={() => socialLogin("google")}
            disabled={!!socialLoading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", borderRadius: 12, background: "#fff", border: "none", color: "#333", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: socialLoading === "google" ? 0.7 : 1 }}
          >
            {socialLoading === "google" ? <Spinner /> : (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            Google로 {tab === "login" ? "로그인" : "가입"}
          </button>

          {/* 카카오 */}
          <button
            onClick={() => socialLogin("kakao")}
            disabled={!!socialLoading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", borderRadius: 12, background: "#FEE500", border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: socialLoading === "kakao" ? 0.7 : 1 }}
          >
            {socialLoading === "kakao" ? <Spinner /> : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 1.5C4.86 1.5 1.5 4.186 1.5 7.5c0 2.1 1.26 3.942 3.15 5.04L3.9 15.75l3.57-2.34c.507.09 1.029.09 1.53.09 4.14 0 7.5-2.686 7.5-6 0-3.314-3.36-6-7.5-6z" fill="#000"/>
              </svg>
            )}
            카카오로 {tab === "login" ? "로그인" : "가입"}
          </button>
        </div>

        {/* 구분선 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 12, color: C.muted }}>또는 이메일로 {tab === "login" ? "로그인" : "가입"}</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", marginBottom: 22, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {["login", "signup"].map((t) => (
            <button key={t} onClick={() => { setTab(t); setErrors({}); setMsg(""); }}
              style={{ flex: 1, padding: "10px", background: tab === t ? C.indigo : "transparent", border: "none", color: tab === t ? "#fff" : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .15s" }}>
              {t === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        {/* 폼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "signup" && (
            <AuthInput label="이름" value={form.name} onChange={set("name")} placeholder="홍길동" error={errors.name} />
          )}
          <AuthInput label="이메일" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" error={errors.email} />
          {tab === "signup" && (
            <AuthInput label="전화번호 (선택)" type="tel" value={form.phone} onChange={set("phone")} placeholder="010-0000-0000" />
          )}
          <AuthInput label="비밀번호" type="password" value={form.pw} onChange={set("pw")} placeholder={tab === "signup" ? "6자 이상" : "비밀번호"} error={errors.pw}
            onKeyDown={(e) => e.key === "Enter" && submit()} />

          {tab === "signup" && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={form.agree} onChange={set("agree")} style={{ marginTop: 2, accentColor: C.indigo }} />
              <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                <span style={{ color: C.indigo, cursor: "pointer" }}>이용약관</span> 및 <span style={{ color: C.indigo, cursor: "pointer" }}>개인정보처리방침</span>에 동의합니다.
              </span>
              {errors.agree && <span style={{ fontSize: 11, color: C.rose }}>{errors.agree}</span>}
            </label>
          )}

          {errors.submit && <p style={{ fontSize: 12, color: C.rose, textAlign: "center" }}>{errors.submit}</p>}
          {msg && <p style={{ fontSize: 12, color: C.emerald, textAlign: "center" }}>{msg}</p>}

          <button onClick={submit} disabled={loading}
            style={{ padding: "13px", borderRadius: 12, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? <Spinner /> : tab === "login" ? "로그인" : "가입하기"}
          </button>

          {tab === "login" && (
            <button onClick={resetPassword} disabled={loading}
              style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              비밀번호를 잊으셨나요?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
