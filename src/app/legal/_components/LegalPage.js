"use client";
import { useState } from "react";

export default function LegalPage({ title, subtitle, effectiveDate, sections }) {
  const [activeIdx, setActiveIdx] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #ebe9e3" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 24px 20px" }}>
          <a href="/dashboard" style={{ fontSize: 12, color: "#8a8a9a", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
            ← 대시보드로 돌아가기
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>Ownly</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a2744", letterSpacing: "-.5px", marginBottom: 6 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 14, color: "#8a8a9a", marginBottom: 8 }}>{subtitle}</p>}
          {effectiveDate && (
            <p style={{ fontSize: 12, color: "#b0b0be" }}>시행일: {effectiveDate}</p>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 80px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 28, alignItems: "start" }}>

        {/* 목차 (좌측 사이드바) */}
        <div style={{ position: "sticky", top: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>목차</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sections.map((s, idx) => (
              <a key={idx} href={"#section-" + idx}
                onClick={() => setActiveIdx(idx)}
                style={{
                  fontSize: 12, fontWeight: activeIdx === idx ? 700 : 500,
                  color: activeIdx === idx ? "#1a2744" : "#8a8a9a",
                  textDecoration: "none", padding: "6px 10px", borderRadius: 8,
                  background: activeIdx === idx ? "rgba(26,39,68,0.07)" : "transparent",
                  borderLeft: "2px solid " + (activeIdx === idx ? "#1a2744" : "transparent"),
                  transition: "all .15s", lineHeight: 1.4,
                }}>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* 본문 섹션 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sections.map((s, idx) => (
            <div key={idx} id={"section-" + idx}
              style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", background: "#f8f7f4", borderBottom: "1px solid #ebe9e3" }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", margin: 0 }}>{s.title}</h2>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: 13, color: "#3a3a4e", lineHeight: 2, whiteSpace: "pre-wrap" }}>
                  {s.content}
                </div>
              </div>
            </div>
          ))}

          {/* 하단 문의 */}
          <div style={{ background: "rgba(26,39,68,0.04)", border: "1px solid rgba(26,39,68,0.1)", borderRadius: 14, padding: "20px 24px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", marginBottom: 4 }}>📮 추가 문의</p>
            <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.8 }}>
              (주)맥클린 · 대표 김성민<br />
              이메일: <a href="mailto:inquiry@mclean21.com" style={{ color: "#1a2744", fontWeight: 600 }}>inquiry@mclean21.com</a><br />
              사업자등록번호: 137-81-52231
            </p>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <div style={{ borderTop: "1px solid #e8e6e0", background: "#f5f4f0", padding: "20px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 11, color: "#b0b0be" }}>© 2025 McLean Inc. All rights reserved.</p>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "개인정보 처리방침", href: "/legal/privacy" },
              { label: "서비스 이용약관", href: "/legal/terms" },
              { label: "공지사항", href: "/legal/notice" },
            ].map(link => (
              <a key={link.label} href={link.href} style={{ fontSize: 11, color: "#8a8a9a", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.color = "#1a2744"}
                onMouseLeave={e => e.currentTarget.style.color = "#8a8a9a"}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
