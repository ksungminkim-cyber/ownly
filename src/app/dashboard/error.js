"use client";
// 대시보드 오류 경계 — 렌더 중 예외가 나도 흰 화면 대신 복구 화면을 보여주고, events 에 client_error 로 남긴다
// (2026-09 신규 가입자 대시보드 크래시가 데이터에 안 보였던 사고의 재발 방지)
import { useEffect } from "react";
import { track } from "../../lib/track";

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    track("client_error", { message: String(error?.message || error).slice(0, 300), digest: error?.digest || null });
  }, [error]);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="surface-card" style={{ maxWidth: 420, width: "100%", padding: 28, textAlign: "center" }}>
        <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>화면을 불러오지 못했어요</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
          일시적인 오류입니다. 다시 시도해도 계속되면 설정 페이지의 문의하기로 알려주세요. 입력해 두신 데이터는 안전하게 저장되어 있습니다.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button className="btn btn-accent" onClick={() => reset()}>다시 시도</button>
          <button className="btn btn-ghost" onClick={() => { window.location.href = "/dashboard/properties"; }}>물건 관리로 이동</button>
        </div>
      </div>
    </div>
  );
}
