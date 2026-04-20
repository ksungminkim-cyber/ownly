"use client";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={{
      width: "100%",
      background: "#0f172a",
      fontFamily: "'Pretendard','DM Sans',sans-serif",
      padding: "28px 32px 24px",
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* 상단: 브랜드 + 링크 한 줄 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>

          {/* 브랜드 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#3b5bdb,#5b4fcf)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>온리</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 2 }}>— 내 임대 물건, 온리 하나로</span>
          </div>

          {/* 링크 */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            {[
              { label: "서비스 이용약관", href: "/legal/terms" },
              { label: "개인정보처리방침", href: "/legal/privacy" },
              { label: "공지사항", href: "/legal/notice" },
              { label: "FAQ", href: "/legal/faq" },
              { label: "임대인 가이드", href: "/blog" },
              { label: "커뮤니티", href: "/dashboard/community" },
            ].map(l => (
              <Link key={l.label} href={l.href}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 16 }} />

        {/* 하단: 사업자 정보 + 카피라이트 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px", fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.8 }}>
            <span>(주)맥클린 · 대표 김성민 · 사업자등록번호 137-81-52231 · 통신판매업신고 제2026-경기김포-2785호</span>
            <span>📍 경기도 김포시 양촌읍 유현삭시로241번길 86 · 📞 02-334-2211 · ✉ inquiry@mclean21.com</span>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>© 2025 McLean Inc.</span>
        </div>

      </div>
    </footer>
  );
}
