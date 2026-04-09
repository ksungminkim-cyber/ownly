// src/app/dashboard/settings/page.js
"use client"; import { useState, useEffect } from "react"; import { useRouter } from "next/navigation"; import { SectionLabel, Modal, toast } from "../../../components/shared"; import { C } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; import { supabase } from "../../../lib/supabase"; import { generateNickname } from "../../../lib/nickname";

// ✅ ① 알림 설정 컴포넌트
function NotificationSettings() {
  const NOTI_KEY = "ownly_noti_settings";
  const defaults = { monthlyReport: true, expiryAlert: true, unpaidAlert: true, depositReturn: true };
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTI_KEY);
      if (saved) setSettings({ ...defaults, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const toggle = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    localStorage.setItem(NOTI_KEY, JSON.stringify(next));
    toast(next[key] ? "알림이 켜졌습니다" : "알림이 꺼졌습니다");
  };

  const items = [
    { key: "monthlyReport", icon: "📊", label: "월말 수금 리포트 이메일", sub: "매월 28일 · 수금 현황 요약 메일 발송" },
    { key: "expiryAlert", icon: "📅", label: "계약 만료 알림", sub: "만료 90일 · 60일 · 30일 전 알림" },
    { key: "unpaidAlert", icon: "💰", label: "미납 알림", sub: "납부일 경과 시 카카오/문자 알림" },
    { key: "depositReturn", icon: "💜", label: "보증금 반환 예정 알림", sub: "만료 14일 전 보증금 반환 준비 알림" },
  ];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 18 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 16 }}>🔔 알림 설정</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(({ key, icon, label, sub }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: "#8a8a9a", margin: "2px 0 0" }}>{sub}</p>
              </div>
            </div>
            {/* 토글 스위치 */}
            <div
              onClick={() => toggle(key)}
              style={{ width: 44, height: 24, borderRadius: 12, background: settings[key] ? "#1a2744" : "#d1d5db", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}
            >
              <div style={{ position: "absolute", top: 3, left: settings[key] ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left .2s" }} />
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#b0b0be", marginTop: 14, lineHeight: 1.6 }}>
        ※ 카카오/문자 알림은 카카오 알림톡 설정이 완료된 경우에만 발송됩니다.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, tenants, payments, contracts, resetAllData } = useApp();
  const currentNickname = user?.user_metadata?.nickname || "";
  const [nickname, setNickname] = useState(currentNickname);
  const [savingNick, setSavingNick] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const stats = [
    { l: "등록 물건", v: tenants.length + "개", icon: "🏠" },
    { l: "계약 건수", v: contracts.length + "건", icon: "📋" },
    { l: "수금 기록", v: payments.length + "건", icon: "💰" },
  ];
  const saveNickname = async () => { if (!nickname.trim()) { toast("닉네임을 입력해주세요", "error"); return; } if (nickname.trim().length < 2 || nickname.trim().length > 20) { toast("닉네임은 2~20자 사이로 입력해주세요", "error"); return; } setSavingNick(true); const { error } = await supabase.auth.updateUser({ data: { nickname: nickname.trim() } }); setSavingNick(false); if (error) { toast("저장 실패: " + error.message, "error"); return; } toast("닉네임이 저장되었습니다 ✓"); };
  const randomNickname = () => setNickname(generateNickname());
  const savePassword = async () => { if (!pwForm.next || pwForm.next.length < 6) { toast("새 비밀번호는 6자 이상이어야 합니다", "error"); return; } if (pwForm.next !== pwForm.confirm) { toast("새 비밀번호가 일치하지 않습니다", "error"); return; } setSavingPw(true); const { error } = await supabase.auth.updateUser({ password: pwForm.next }); setSavingPw(false); if (error) { toast("변경 실패: " + error.message, "error"); return; } setPwForm({ current: "", next: "", confirm: "" }); toast("비밀번호가 변경되었습니다 ✓"); };
  const handleReset = async () => { setResetting(true); try { await resetAllData(); toast("모든 데이터가 초기화되었습니다", "warning"); setConfirmReset(false); } catch { toast("초기화 중 오류가 발생했습니다", "error"); } finally { setResetting(false); } };
  const handleDelete = async () => { if (deleteInput !== "탈퇴합니다") { toast("확인 문구를 정확히 입력해주세요", "error"); return; } setDeleting(true); try { const res = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); await supabase.auth.signOut(); router.push("/login?msg=deleted"); } catch (err) { toast("탈퇴 실패: " + err.message, "error"); setDeleting(false); } };
  const isEmailUser = !user?.app_metadata?.provider || user?.app_metadata?.provider === "email";

  return (
    <div className="page-in page-padding" style={{ padding: "36px 40px", maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <SectionLabel>SETTINGS</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-.4px" }}>설정</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>계정 및 앱 설정</p>
      </div>

      {/* 프로필 */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 16 }}>👤 프로필</p>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 6 }}>이메일</p>
          <div style={{ padding: "10px 13px", background: "var(--surface2)", borderRadius: 10, fontSize: 13, color: "var(--text-muted)", border: "1px solid var(--border)" }}>{user?.email || "—"}</div>
        </div>
        <div style={{ marginBottom: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 6 }}>닉네임 <span style={{ color: "#a0a0b0", fontWeight: 400 }}>(커뮤니티 표시 이름)</span></p>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="닉네임을 입력하세요" maxLength={20} style={{ flex: 1, padding: "10px 13px", fontSize: 13, color: "var(--text)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, outline: "none" }} />
            <button onClick={randomNickname} style={{ padding: "10px 14px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>🎲 랜덤</button>
            <button onClick={saveNickname} disabled={savingNick} style={{ padding: "10px 18px", borderRadius: 10, background: savingNick ? "#94a3b8" : "#1a2744", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: savingNick ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>{savingNick ? "저장 중..." : "저장"}</button>
          </div>
          <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 5 }}>닉네임을 설정하지 않으면 커뮤니티에서 자동 생성된 이름으로 표시됩니다.</p>
        </div>
      </div>

      {/* 비밀번호 */}
      {isEmailUser && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPw ? 16 : 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px" }}>🔑 비밀번호 변경</p>
            <button onClick={() => setShowPw(o => !o)} style={{ fontSize: 12, color: "#1a2744", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>{showPw ? "닫기 ▲" : "변경하기 ▼"}</button>
          </div>
          {showPw && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ key: "next", label: "새 비밀번호", placeholder: "6자 이상" }, { key: "confirm", label: "새 비밀번호 확인", placeholder: "한 번 더 입력" }].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 6 }}>{label}</p>
                  <input type="password" value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: "var(--text)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <button onClick={savePassword} disabled={savingPw} style={{ padding: "11px", borderRadius: 10, background: savingPw ? "#94a3b8" : "#1a2744", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: savingPw ? "not-allowed" : "pointer" }}>{savingPw ? "변경 중..." : "비밀번호 변경"}</button>
            </div>
          )}
        </div>
      )}

      {/* ✅ ① 알림 설정 */}
      <NotificationSettings />

      {/* 데이터 현황 */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>데이터 현황</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {stats.map((s) => (
            <div key={s.l} style={{ background: "var(--surface2)", borderRadius: 11, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{s.v}</p>
              <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 앱 정보 */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>앱 정보</p>
        {[["앱 이름","Ownly"],["버전","v1.0.0"],["제작사","McLean"],["지원","임대 자산 관리 플랫폼"]].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "#8a8a9a" }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* 고객지원 */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>고객지원</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "✉️", label: "이메일 문의", sub: "inquiry@mclean21.com · 평일 1~3일 내 답변", action: () => window.open("mailto:inquiry@mclean21.com?subject=[Ownly] 문의사항", "_blank") },
            { icon: "📖", label: "이용 가이드", sub: "기능 사용법 및 자주 묻는 질문", action: () => window.open("https://ownly.kr/legal/faq", "_blank") },
            { icon: "💳", label: "플랜 업그레이드", sub: "더 많은 기능을 사용해보세요", action: () => router.push("/dashboard/pricing") },
            { icon: "🐛", label: "버그 신고", sub: "문제가 발생했나요? 알려주세요", action: () => window.open("mailto:inquiry@mclean21.com?subject=[Ownly] 버그 신고", "_blank") },
          ].map(({ icon, label, sub, action }) => (
            <button key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface2)", cursor: "pointer", textAlign: "left", width: "100%" }} onMouseEnter={e => { e.currentTarget.style.background = "var(--surface3)"; e.currentTarget.style.borderColor = "#1a2744"; }} onMouseLeave={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 11, color: "#8a8a9a" }}>{sub}</p>
              </div>
              <span style={{ fontSize: 14, color: "#a0a0b0" }}>→</span>
            </button>
          ))}
        </div>
      </div>

      {/* 위험 구역 */}
      <div style={{ background: "rgba(232,68,90,0.04)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 16, padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e8445a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 16 }}>⚠️ 위험 구역</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid rgba(232,68,90,0.15)" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>모든 데이터 초기화</p>
            <p style={{ fontSize: 12, color: "#8a8a9a" }}>세입자·수금·계약 데이터가 삭제됩니다. 되돌릴 수 없습니다.</p>
          </div>
          <button onClick={() => setConfirmReset(true)} style={{ padding: "9px 18px", borderRadius: 10, background: "transparent", border: "1px solid rgba(232,68,90,0.5)", color: "#e8445a", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>데이터 초기화</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>회원 탈퇴</p>
            <p style={{ fontSize: 12, color: "#8a8a9a" }}>계정과 모든 데이터가 영구 삭제됩니다. 되돌릴 수 없습니다.</p>
          </div>
          <button onClick={() => setConfirmDelete(true)} style={{ padding: "9px 18px", borderRadius: 10, background: "#e8445a", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>회원 탈퇴</button>
        </div>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} width={400}>
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#e8445a", marginBottom: 8 }}>정말 초기화하시겠습니까?</h3>
          <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.7, marginBottom: 22 }}>모든 세입자, 수금, 계약 데이터가 영구 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: 12, borderRadius: 11, background: "transparent", border: "1px solid var(--border)", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={handleReset} disabled={resetting} style={{ flex: 1, padding: 12, borderRadius: 11, background: "#e8445a", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: resetting ? 0.7 : 1 }}>{resetting ? "초기화 중..." : "초기화 확인"}</button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => { setConfirmDelete(false); setDeleteInput(""); }} width={420}>
        <div style={{ padding: "10px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#e8445a", marginBottom: 8 }}>회원 탈퇴</h3>
            <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.7 }}>탈퇴하면 계정과 <strong>모든 데이터</strong>가 영구 삭제됩니다.</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", marginBottom: 8 }}>확인을 위해 아래에 <strong style={{ color: "#e8445a" }}>탈퇴합니다</strong> 를 입력하세요</p>
            <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="탈퇴합니다" style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "var(--text)", background: "var(--surface2)", border: `1.5px solid ${deleteInput === "탈퇴합니다" ? "#e8445a" : "var(--border)"}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setConfirmDelete(false); setDeleteInput(""); }} style={{ flex: 1, padding: 12, borderRadius: 11, background: "transparent", border: "1px solid var(--border)", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={handleDelete} disabled={deleting || deleteInput !== "탈퇴합니다"} style={{ flex: 1, padding: 12, borderRadius: 11, background: deleteInput === "탈퇴합니다" ? "#e8445a" : "#d1d5db", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: deleteInput === "탈퇴합니다" && !deleting ? "pointer" : "not-allowed", opacity: deleting ? 0.7 : 1 }}>{deleting ? "탈퇴 중..." : "탈퇴 확인"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
