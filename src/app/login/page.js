"use client";
import { useState } from "react";
import { Spinner, AuthInput } from "../../components/shared";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

  const submit = async () => {
    const errs = {};
    if (!form.email.includes("@")) errs.email = "올바른 이메일을 입력하세요";
    if (form.pw.length < 6) errs.pw = "6자 이상 입력하세요";
    if (tab === "signup" && !form.name) errs.name = "이름을 입력하세요";
    if (tab === "signup" && !form.agree) errs.agree = "약관에 동의해주세요";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true); setMsg("");
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.pw });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.pw,
          options: {
            data: { full_name: form.name, phone: form.phone },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMsg("sent");
      }
    } catch (e) {
      setErrors({ submit: e.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 올바르지 않습니다" : e.message });
    } finally { setLoading(false); }
  };

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
    <div style={{
      minHeight: "100vh", display: "flex", fontFamily: "'Pretendard','DM Sans',sans-serif",
      background: "#f5f4f0"
    }}>
      {/* 왼쪽 브랜드 패널 (데스크탑) */}
      <div style={{
        display: "none", width: "45%", background: "#1a2744",
        position: "relative", overflow: "hidden",
        flexDirection: "column", justifyContent: "space-between", padding: "48px"
      }} className="login-brand-panel">
        {/* 배경 패턴 */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "32px 32px"
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 60 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Pretendard',sans-serif", color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: "-0.5px" }}>온리</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500, fontSize: 12, marginLeft: 6, letterSpacing: "0.5px" }}>Ownly</span>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 16, letterSpacing: "-.5px" }}>
            임대 관리,<br/>더 스마트하게
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
            물건 관리부터 수금, 계약, 세금까지<br/>개인 임대인을 위한 올인원 솔루션
          </p>
        </div>
        <div style={{ position: "relative" }}>
          {["✓ 수금 자동 추적", "✓ 계약 만료 알림", "✓ 세금 시뮬레이터", "✓ 내용증명 발행"].map((f) => (
            <div key={f} style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{f}</div>
          ))}
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 24 }}>by McLean · 개인 임대인의 진짜 파트너</p>
        </div>
      </div>

      {/* 오른쪽 폼 영역 */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 20px"
      }}>
        <div style={{ width: 420, maxWidth: "100%" }}>
          {/* 로고 (모바일) */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div onClick={() => router.push("/")} style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: "linear-gradient(145deg, #1a2744, #2d4270)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 24px rgba(26,39,68,0.3)"
              }}>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
                  <rect x="7.5" y="12" width="5" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.5px" }}>온리</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#a0a0b0", marginLeft: 6, letterSpacing: "0.5px" }}>Ownly</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a2744" }}>{tab === "login" ? "로그인" : "회원가입"}</h2>
            <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 4 }}>
              {tab === "login" ? "계속하려면 로그인하세요" : "무료로 시작해보세요"}
            </p>
          </div>

          {/* 소셜 로그인 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            <button onClick={() => socialLogin("google")} disabled={!!socialLoading} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "13px", borderRadius: 14, background: "#fff",
              border: "1.5px solid #e8e6e0", color: "#333", fontWeight: 700, fontSize: 14,
              cursor: "pointer", opacity: socialLoading === "google" ? 0.7 : 1,
              boxShadow: "0 1px 4px rgba(26,39,68,0.06)", transition: "all .15s"
            }}>
              {socialLoading === "google" ? <Spinner color="#1a2744" /> : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              Google로 {tab === "login" ? "로그인" : "가입"}
            </button>
            <button onClick={() => socialLogin("kakao")} disabled={!!socialLoading} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "13px", borderRadius: 14, background: "#FEE500",
              border: "1.5px solid #FEE500", color: "#191600", fontWeight: 700, fontSize: 14,
              cursor: "pointer", opacity: socialLoading === "kakao" ? 0.7 : 1,
              transition: "all .15s"
            }}>
              {socialLoading === "kakao" ? <Spinner color="#191600" /> : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9 1.5C4.86 1.5 1.5 4.186 1.5 7.5c0 2.1 1.26 3.942 3.15 5.04L3.9 15.75l3.57-2.34c.507.09 1.029.09 1.53.09 4.14 0 7.5-2.686 7.5-6 0-3.314-3.36-6-7.5-6z" fill="#000"/>
                </svg>
              )}
              카카오로 {tab === "login" ? "로그인" : "가입"}
            </button>
          </div>

          {/* 구분선 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: "#ebe9e3" }} />
            <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 500 }}>또는 이메일로 {tab === "login" ? "로그인" : "가입"}</span>
            <div style={{ flex: 1, height: 1, background: "#ebe9e3" }} />
          </div>

          {/* 탭 */}
          <div style={{ display: "flex", marginBottom: 22, borderRadius: 12, overflow: "hidden", border: "1.5px solid #e8e6e0", background: "#f8f7f4", padding: 3, gap: 3 }}>
            {["login", "signup"].map((t) => (
              <button key={t} onClick={() => { setTab(t); setErrors({}); setMsg(""); }}
                style={{
                  flex: 1, padding: "9px", borderRadius: 9,
                  background: tab === t ? "#fff" : "transparent",
                  border: "none",
                  color: tab === t ? "#1a2744" : "#8a8a9a",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .15s",
                  boxShadow: tab === t ? "0 1px 4px rgba(26,39,68,0.1)" : "none"
                }}>
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
            {tab === "signup" && form.email.includes("@") && (
              <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: -8, paddingLeft: 2, lineHeight: 1.5 }}>
                📬 가입 후 인증 메일이 발송됩니다. <b>스팸함</b>도 확인해주세요.
              </p>
            )}
            {tab === "signup" && (
              <AuthInput label="전화번호 (선택)" type="tel" value={form.phone} onChange={set("phone")} placeholder="010-0000-0000" />
            )}
            <AuthInput label="비밀번호" type="password" value={form.pw} onChange={set("pw")} placeholder={tab === "signup" ? "6자 이상" : "비밀번호"} error={errors.pw} />

            {tab === "signup" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.agree} onChange={set("agree")} style={{ marginTop: 2, accentColor: "#1a2744" }} />
                <span style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.5 }}>
                  <span style={{ color: "#1a2744", cursor: "pointer", fontWeight: 600 }}>이용약관</span> 및 <span style={{ color: "#1a2744", cursor: "pointer", fontWeight: 600 }}>개인정보처리방침</span>에 동의합니다.
                </span>
                {errors.agree && <span style={{ fontSize: 11, color: "#e8445a" }}>{errors.agree}</span>}
              </label>
            )}

            {errors.submit && <p style={{ fontSize: 12, color: "#e8445a", textAlign: "center", fontWeight: 600 }}>{errors.submit}</p>}

            {/* 가입 완료 — 인증 메일 발송 안내 카드 */}
            {msg === "sent" && (
              <div style={{
                background: "linear-gradient(135deg, #f0fdf8, #e6faf3)",
                border: "1.5px solid #0fa57340",
                borderRadius: 14, padding: "18px 16px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>📧</span>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#0a6b4a" }}>
                    인증 메일을 발송했습니다
                  </p>
                </div>
                <p style={{ fontSize: 12, color: "#1a6b4a", lineHeight: 1.7 }}>
                  <b>{form.email}</b> 로 인증 링크를 보냈습니다.<br/>
                  링크를 클릭하면 자동으로 로그인됩니다.
                </p>
                {/* 스팸 경고 */}
                <div style={{
                  background: "#fff8e6", border: "1px solid #f59e0b40",
                  borderRadius: 10, padding: "10px 12px",
                  display: "flex", gap: 8, alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 3 }}>
                      메일이 안 보이시나요?
                    </p>
                    <p style={{ fontSize: 11, color: "#78350f", lineHeight: 1.6 }}>
                      인증 메일이 <b>스팸함</b>으로 분류될 수 있습니다.<br/>
                      스팸함을 확인하시고, 발신자 <b>noreply@mail.supabase.io</b>를 안전 발신자로 등록해주세요.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setMsg(""); setTab("login"); }}
                  style={{
                    background: "none", border: "none", color: "#0fa573",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    textDecoration: "underline", textAlign: "center", padding: 0,
                  }}>
                  로그인 화면으로 돌아가기
                </button>
              </div>
            )}

            {/* 일반 메시지 (비밀번호 재설정 등) */}
            {msg && msg !== "sent" && (
              <p style={{ fontSize: 12, color: "#0fa573", textAlign: "center", fontWeight: 600 }}>{msg}</p>
            )}

            <button onClick={submit} disabled={loading} style={{
              padding: "14px", borderRadius: 14,
              background: "linear-gradient(135deg, #1a2744, #2d4270)",
              border: "none", color: "#fff", fontWeight: 800, fontSize: 15,
              cursor: "pointer", marginTop: 4, opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 20px rgba(26,39,68,0.3)", transition: "all .15s"
            }}>
              {loading ? <Spinner /> : tab === "login" ? "로그인" : "가입하기"}
            </button>

            {tab === "login" && (
              <button onClick={resetPassword} disabled={loading} style={{
                background: "none", border: "none", color: "#8a8a9a", fontSize: 12,
                cursor: "pointer", textDecoration: "underline", padding: 0, textAlign: "center"
              }}>비밀번호를 잊으셨나요?</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
