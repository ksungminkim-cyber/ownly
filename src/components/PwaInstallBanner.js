"use client";
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { isSampleTenant } from "../lib/sampleData";
import { track } from "../lib/track";
import { isInstalled, subscribeInstallState } from "../lib/pwa";
import InstallGuideModal from "./InstallGuide";

// 대시보드 하단 "홈 화면에 추가" 배너 — 실제 물건을 등록한 유저에게만, 14일 간격으로 다시 제안.
// 이미 앱으로 실행 중이거나 설치한 기기에는 나오지 않는다. 안내·설치는 InstallGuideModal 이 담당.
const SNOOZE_KEY = "ownly_pwa_snoozed_at";
const SNOOZE_DAYS = 14;

export default function PwaInstallBanner() {
  const { tenants, loading } = useApp();
  const [visible, setVisible] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    const hasReal = tenants.some((t) => !isSampleTenant(t));
    if (!hasReal) return;
    const decide = () => {
      if (isInstalled()) { setVisible(false); return; }
      try {
        const at = Number(localStorage.getItem(SNOOZE_KEY) || 0);
        if (at && Date.now() - at < SNOOZE_DAYS * 86400000) { setVisible(false); return; }
      } catch {}
      setVisible(true);
    };
    const timer = setTimeout(decide, 2500); // 첫 화면이 자리 잡은 뒤에
    const unsub = subscribeInstallState(decide);
    return () => { clearTimeout(timer); unsub(); };
  }, [loading, tenants]);

  if (!visible) return null;

  const snooze = () => { try { localStorage.setItem(SNOOZE_KEY, String(Date.now())); } catch {} setVisible(false); };
  const openGuide = () => { track("pwa_guide_open", { from: "dashboard_banner" }); setGuideOpen(true); };

  return (
    <>
      <div className="pwa-banner" style={{ position: "fixed", left: 12, right: 12, zIndex: 480, background: "#1a2744", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(26,39,68,0.35)", maxWidth: 560, margin: "0 auto" }}>
        <img src="/icon-192.png" alt="" width={40} height={40} style={{ borderRadius: 11, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", margin: 0 }}>홈 화면에 온리 추가</p>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", margin: "2px 0 0", lineHeight: 1.5, wordBreak: "keep-all" }}>아이콘 하나로 미납·만료 확인 · 로그인 유지 · 전체 화면</p>
        </div>
        <button onClick={openGuide} style={{ padding: "8px 13px", borderRadius: 9, background: "#fff", color: "#1a2744", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>추가하기</button>
        <button onClick={snooze} aria-label="14일간 숨기기" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
      </div>
      <style>{`.pwa-banner{bottom:16px}@media (max-width:767px){.pwa-banner{bottom:76px}}`}</style>
      <InstallGuideModal open={guideOpen} onClose={() => { setGuideOpen(false); snooze(); }} from="dashboard_banner" />
    </>
  );
}
