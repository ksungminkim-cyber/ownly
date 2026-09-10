"use client";
import { useState, useSyncExternalStore } from "react";
import { Modal, toast } from "./shared";
import { canPromptInstall, detectPlatform, installSteps, isInstalled, promptInstall, subscribeInstallState } from "../lib/pwa";

// "홈 화면에 추가" 안내 모달 — 설정·체크리스트·대시보드 배너·모바일 메뉴가 공용으로 연다.
// 네이티브 설치 프롬프트가 가능하면 버튼 하나로 끝내고, 아니면 기기·브라우저에 맞는 3단계 안내를 보여준다.
// 설치 상태는 src/lib/pwa.js 의 외부 스토어를 구독 (effect 안 setState 없이 동기화)
const noop = () => false;

export default function InstallGuideModal({ open, onClose, from = "guide", onManualDone }) {
  const [platform] = useState(() => detectPlatform());
  const canPrompt = useSyncExternalStore(subscribeInstallState, canPromptInstall, noop);
  const installed = useSyncExternalStore(subscribeInstallState, isInstalled, noop);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const steps = installSteps(platform);
  const deviceLabel = platform.os === "ios" ? (platform.browser === "chrome" ? "iPhone · Chrome" : "iPhone · Safari")
    : platform.os === "android" ? (platform.browser === "samsung" ? "Android · 삼성 인터넷" : "Android · Chrome")
    : "PC";

  const onPrompt = async () => {
    setBusy(true);
    const r = await promptInstall(from);
    setBusy(false);
    if (r === "accepted") { toast("홈 화면에 온리가 추가되었습니다"); onClose?.(); }
    else if (r === "unavailable") toast("이 브라우저에서는 아래 순서대로 직접 추가해 주세요", "info");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <img src="/icon-192.png" alt="" width={44} height={44} style={{ borderRadius: 12, flexShrink: 0 }} />
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0 }}>홈 화면에 온리 추가</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>앱 설치 없이 아이콘 하나로 바로 열기 · 로그인 유지 · 전체 화면</p>
          </div>
        </div>

        {installed ? (
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(15,165,115,0.07)", border: "1px solid rgba(15,165,115,0.25)", fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>
            ✅ 이 기기에는 이미 홈 화면에 추가되어 있습니다. 홈 화면의 <b>온리</b> 아이콘으로 여시면 됩니다.
          </div>
        ) : canPrompt ? (
          <>
            <button onClick={onPrompt} disabled={busy} className="btn btn-fill" style={{ width: "100%", padding: "13px", fontSize: 14 }}>
              {busy ? "확인 중..." : "📱 홈 화면에 추가하기"}
            </button>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>버튼을 누르면 브라우저의 설치 확인 창이 뜹니다. 앱스토어 설치가 아니라 바로가기 아이콘이 생기는 방식입니다.</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>{deviceLabel} 에서 추가하는 법</p>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {steps.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, background: "var(--surface2)" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, wordBreak: "keep-all" }}>{s}</span>
                </li>
              ))}
            </ol>
            {onManualDone && (
              <button onClick={onManualDone} className="btn btn-soft" style={{ marginTop: 12, width: "100%", padding: "11px", fontSize: 13 }}>위 순서대로 추가했어요 ✓</button>
            )}
          </>
        )}

        <button onClick={onClose} style={{ marginTop: 14, width: "100%", padding: "11px", borderRadius: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>닫기</button>
      </div>
    </Modal>
  );
}
