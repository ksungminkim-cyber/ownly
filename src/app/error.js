"use client";
// 전역 오류 경계 — 공개 페이지(도구·시세·포털 등)에서 렌더 예외가 나도 흰 화면 대신 복구 화면
// client_error 기록은 로그인 유저만 남는다 (events RLS 가 익명은 tool_* 만 허용)
import { useEffect } from "react";
import { track } from "../lib/track";

export default function AppError({ error, reset }) {
  useEffect(() => {
    track("client_error", { message: String(error?.message || error).slice(0, 300), digest: error?.digest || null });
  }, [error]);

  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
      <div className="surface-card" style={{ maxWidth: 420, width: "100%", padding: 28, textAlign: "center" }}>
        <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>페이지를 불러오지 못했어요</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>일시적인 오류입니다. 잠시 후 다시 시도해주세요.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button className="btn btn-accent" onClick={() => reset()}>다시 시도</button>
          <button className="btn btn-ghost" onClick={() => { window.location.href = "/"; }}>홈으로</button>
        </div>
      </div>
    </div>
  );
}
