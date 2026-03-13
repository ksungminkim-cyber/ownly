"use client";
import { useState } from "react";
import { SectionLabel, Modal, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

export default function SettingsPage() {
  const { tenants, payments, contracts, resetAllData } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting]       = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetAllData();
      toast("모든 데이터가 초기화되었습니다", "warning");
      setConfirmReset(false);
    } catch {
      toast("초기화 중 오류가 발생했습니다", "error");
    } finally {
      setResetting(false);
    }
  };

  const stats = [
    { l: "등록 물건", v: tenants.length + "개",   icon: "🏠" },
    { l: "계약 건수", v: contracts.length + "건",  icon: "📋" },
    { l: "수금 기록", v: payments.length + "건",   icon: "💰" },
  ];

  return (
    <div className="page-in page-padding" style={{ padding: "36px 40px", maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <SectionLabel>SETTINGS</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>설정</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>앱 설정 및 데이터 관리</p>
      </div>

      {/* 데이터 현황 */}
      <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "20px", marginBottom: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>데이터 현황</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {stats.map((s) => (
            <div key={s.l} style={{ background: "#f8f7f4", borderRadius: 11, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#1a2744" }}>{s.v}</p>
              <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 앱 정보 */}
      <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "20px", marginBottom: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>앱 정보</p>
        {[
          ["앱 이름",  "Ownly"],
          ["버전",     "v1.0.0"],
          ["제작사",   "McLean"],
          ["지원",     "개인 임대인을 위한 스마트 관리 앱"],
        ].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #ebe9e3" }}>
            <span style={{ fontSize: 13, color: "#8a8a9a" }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* 고객지원 */}
      <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "20px", marginBottom: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>고객지원</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "✉️", label: "이메일 문의",      sub: "inquiry@mclean21.com · 평일 1~3일 내 답변",   action: () => window.open("mailto:inquiry@mclean21.com?subject=[Ownly] 문의사항", "_blank") },
            { icon: "📖", label: "이용 가이드",      sub: "기능 사용법 및 자주 묻는 질문",            action: () => window.open("https://ownly.kr", "_blank") },
            { icon: "💳", label: "플랜 업그레이드",  sub: "더 많은 기능을 사용해보세요",              action: () => window.location.href = "/dashboard/pricing" },
            { icon: "🐛", label: "버그 신고",        sub: "문제가 발생했나요? 알려주세요",            action: () => window.open("mailto:inquiry@mclean21.com?subject=[Ownly] 버그 신고", "_blank") },
          ].map(({ icon, label, sub, action }) => (
            <button key={label} onClick={action}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 12, border: "1px solid #ebe9e3", background: "#faf9f6", cursor: "pointer", textAlign: "left", width: "100%", transition: "all .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f0efe9"; e.currentTarget.style.borderColor = "#1a2744"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#faf9f6"; e.currentTarget.style.borderColor = "#ebe9e3"; }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 11, color: "#8a8a9a" }}>{sub}</p>
              </div>
              <span style={{ fontSize: 14, color: "#a0a0b0" }}>→</span>
            </button>
          ))}
        </div>
      </div>

      {/* 위험 구역 */}
      <div style={{ background: C.rose + "08", border: `1px solid ${C.rose}30`, borderRadius: 16, padding: "20px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e8445a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>⚠️ 위험 구역</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", marginBottom: 4 }}>모든 데이터 초기화</p>
            <p style={{ fontSize: 12, color: "#8a8a9a" }}>Supabase DB의 모든 세입자·수금·계약 데이터가 삭제됩니다. 되돌릴 수 없습니다.</p>
          </div>
          <button onClick={() => setConfirmReset(true)} style={{ padding: "9px 18px", borderRadius: 10, background: "transparent", border: `1px solid ${C.rose}60`, color: "#e8445a", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            데이터 초기화
          </button>
        </div>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} width={400}>
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#e8445a", marginBottom: 8 }}>정말 초기화하시겠습니까?</h3>
          <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.7, marginBottom: 22 }}>Supabase DB에 저장된 모든 세입자, 수금, 계약 데이터가 영구 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={handleReset} disabled={resetting} style={{ flex: 1, padding: "12px", borderRadius: 11, background: C.rose, border: "none", color: "#1a2744", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: resetting ? 0.7 : 1 }}>
              {resetting ? "초기화 중..." : "초기화 확인"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
