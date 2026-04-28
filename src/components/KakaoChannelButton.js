"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// 카카오톡 채널 플로팅 버튼
// 다음(Daum) 검색등록 요건: 카카오톡 채널 ID/링크가 메인 화면에 노출되어야 함
// 위치: 랜딩 페이지·공개 페이지 우하단 고정

const CHANNEL_URL = "http://pf.kakao.com/_ZBcxhX";
const CHAT_URL = "http://pf.kakao.com/_ZBcxhX/chat";
const CHANNEL_ID = "온리_ownly";

export default function KakaoChannelButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  // 대시보드(로그인 후)·로그인·인증 페이지에선 숨김 — 공개 페이지에만 노출
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/login") || pathname?.startsWith("/auth") || pathname?.startsWith("/reset-password")) {
    return null;
  }

  return (
    <>
      {/* 펼친 패널 */}
      {open && (
        <div style={{
          position: "fixed", bottom: 90, right: 20, zIndex: 999,
          width: 280, background: "#fff", borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
          border: "1px solid #ebe9e3",
          padding: "20px 22px",
          fontFamily: "'Pretendard',sans-serif",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fee500", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💬</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", margin: 0 }}>카카오톡 문의</p>
              <p style={{ fontSize: 11, color: "#8a8a9a", margin: "2px 0 0" }}>{CHANNEL_ID}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="닫기"
              style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, color: "#8a8a9a", cursor: "pointer", padding: 4 }}>
              ✕
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 14 }}>
            궁금하신 점이 있으면 카카오톡으로 편하게 물어보세요. 평일 10:00~18:00 답변 드립니다.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href={CHAT_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", background: "#fee500", color: "#3c1e1e", borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
              💬 1:1 채팅 시작
            </a>
            <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", background: "#fff", border: "1px solid #ebe9e3", color: "#6a6a7a", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              ⭐ 채널 추가하기
            </a>
          </div>
          <p style={{ fontSize: 10, color: "#a0a0b0", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
            카카오톡 채널 <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#a0a0b0", textDecoration: "underline" }}>{CHANNEL_URL}</a>
          </p>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="카카오톡 채널 문의"
        title={`카카오톡 채널 ${CHANNEL_ID} 문의`}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 998,
          width: 60, height: 60, borderRadius: "50%",
          background: "#fee500",
          border: "none", cursor: "pointer",
          boxShadow: "0 8px 24px rgba(254,229,0,0.5), 0 4px 12px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
          transition: "transform .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        💬
      </button>
    </>
  );
}
