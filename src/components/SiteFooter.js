"use client";
import Link from "next/link";

export default function SiteFooter({ hasFixedBar = false }) {
  return (
    <footer style={{
      width: "100%",
      background: "#f0efe9",
      borderTop: "1px solid #e2e0d8",
      fontFamily: "'Pretendard','DM Sans',sans-serif",
      padding: hasFixedBar ? "22px clamp(16px, 4vw, 56px) 72px" : "22px clamp(16px, 4vw, 56px) 28px",
    }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", width: "100%" }}>

        {/* 링크 + 브랜드 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px 24px",
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>온리</span>
            <span className="footer-tagline" style={{ fontSize: 11, color: "#b0b0be", marginLeft: 2 }}>내 임대 물건, 온리 하나로</span>
          </div>

          <nav style={{
            display: "flex",
            alignItems: "center",
            gap: "8px 18px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            rowGap: 6,
          }}>
            {[
              { label: "서비스 이용약관", href: "/legal/terms" },
              { label: "개인정보처리방침", href: "/legal/privacy" },
              { label: "공지사항", href: "/legal/notice" },
              { label: "FAQ", href: "/legal/faq" },
              { label: "임대인 가이드", href: "/blog" },
              { label: "커뮤니티", href: "/dashboard/community" },
            ].map(l => (
              <Link key={l.label} href={l.href}
                style={{ fontSize: 12, color: "#8a8a9a", textDecoration: "none", whiteSpace: "nowrap" }}
                onMouseEnter={e => e.currentTarget.style.color = "#1a2744"}
                onMouseLeave={e => e.currentTarget.style.color = "#8a8a9a"}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: "#e2e0d8", marginBottom: 12 }} />

        {/* 사업자 정보 — 좌: 사업자, 우: 저작권 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "6px 20px",
        }}>
          <div className="footer-biz" style={{
            fontSize: 11,
            color: "#a0a0b0",
            lineHeight: 1.8,
            display: "flex",
            flexWrap: "wrap",
            gap: "2px 16px",
            flex: 1,
            minWidth: 0,
          }}>
            <span>(주)맥클린 · 대표 김성민 · 사업자등록번호 137-81-52231 · 통신판매업신고 제2026-경기김포-2785호</span>
            <span>📍 경기도 김포시 양촌읍 유현삭시로241번길 86 · 📞 02-334-2211 · ✉ inquiry@mclean21.com</span>
          </div>
          <span style={{ fontSize: 11, color: "#b0b0be", whiteSpace: "nowrap", flexShrink: 0 }}>© 2025 McLean Inc.</span>
        </div>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .footer-tagline { display: none; }
          .footer-biz { font-size: 10px; }
        }
        @media (min-width: 1600px) {
          /* 초대형 모니터에서도 넉넉히 퍼지도록 좌우 패딩 유지 */
        }
      `}</style>
    </footer>
  );
}
