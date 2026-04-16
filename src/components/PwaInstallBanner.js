"use client";
import { useState, useEffect } from "react";

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 이미 설치됐거나 dismissed 처리된 경우 표시 안 함
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      localStorage.getItem("pwa-banner-dismissed") === "true"
    ) return;

    // iOS 감지
    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

    if (isIosDevice && isInSafari) {
      setIsIos(true);
      // 3초 후 표시
      setTimeout(() => setShow(true), 3000);
      return;
    }

    // Android / Chrome - beforeinstallprompt 이벤트
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
        localStorage.setItem("pwa-banner-dismissed", "true");
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!show || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 72, // 하단 구독 바 위에 뜨도록
        left: 12,
        right: 12,
        zIndex: 1100,
        background: "#1a2744",
        borderRadius: 18,
        padding: "16px 18px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        boxShadow: "0 8px 32px rgba(26,39,68,0.35)",
        animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 아이콘 */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "linear-gradient(145deg, #2d4270, #4f6ab0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95" />
          <rect x="7.5" y="12" width="5" height="6" rx="1" fill="rgba(255,255,255,0.4)" />
        </svg>
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>
          온리를 홈 화면에 추가하세요
        </p>
        {isIos ? (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.5 }}>
            Safari 하단의 <strong style={{ color: "#fff" }}>공유 버튼 →</strong> 홈 화면에 추가
          </p>
        ) : (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.5 }}>
            앱처럼 빠르게 실행 · 오프라인에서도 사용 가능
          </p>
        )}
      </div>

      {/* 버튼들 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {!isIos && (
          <button
            onClick={handleInstall}
            style={{
              padding: "7px 14px",
              borderRadius: 9,
              background: "#fff",
              color: "#1a2744",
              fontWeight: 800,
              fontSize: 12,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            설치하기
          </button>
        )}
        <button
          onClick={handleDismiss}
          style={{
            padding: "6px 14px",
            borderRadius: 9,
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            fontWeight: 600,
            fontSize: 12,
            border: "1px solid rgba(255,255,255,0.15)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
