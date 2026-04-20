"use client";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={{
      width: "100%",
      background: "#0f172a",
      color: "#fff",
      padding: "56px 24px 40px",
      fontFamily: "'Pretendard','DM Sans',sans-serif",
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* 상단 — 브랜드 + 링크 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>

          {/* 브랜드 */}
          <div style={{ gridColumn: "span 1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#3b5bdb,#5b4fcf)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
                </svg>
              </div>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>온리</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 20 }}>
              내 임대 물건,<br/>온리 하나로.
            </p>
            <a href="mailto:inquiry@mclean21.com"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 12px" }}>
              ✉ inquiry@mclean21.com
            </a>
          </div>

          {/* 서비스 */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Service</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "수금 관리", href: "/dashboard/payments" },
                { label: "계약 관리", href: "/dashboard/contracts" },
                { label: "세금 시뮬레이터", href: "/dashboard/tax" },
                { label: "AI 입지 분석", href: "/dashboard/premium/ai-report" },
                { label: "내용증명 발행", href: "/dashboard/certified" },
              ].map(l => (
                <Link key={l.label} href={l.href}
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 리소스 */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Resources</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "임대인 가이드", href: "/blog" },
                { label: "임대차 3법", href: "/dashboard/premium/lease-check" },
                { label: "수익률 계산기", href: "/dashboard/premium/calculator" },
                { label: "임대인 커뮤니티", href: "/dashboard/community" },
                { label: "요금제", href: "/pricing" },
              ].map(l => (
                <Link key={l.label} href={l.href}
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 법적 */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Legal</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "서비스 이용약관", href: "/legal/terms" },
                { label: "개인정보처리방침", href: "/legal/privacy" },
                { label: "공지사항", href: "/legal/notice" },
                { label: "자주 묻는 질문", href: "/legal/faq" },
              ].map(l => (
                <Link key={l.label} href={l.href}
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 28 }} />

        {/* 하단 — 사업자 정보 */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 2 }}>
              <span>(주)맥클린</span>
              <span>대표 김성민</span>
              <span>사업자등록번호 137-81-52231</span>
              <span>통신판매업신고 제2026-경기김포-2785호</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 2 }}>
              <span>📍 경기도 김포시 양촌읍 유현삭시로241번길 86</span>
              <span>📞 02-334-2211</span>
              <span>✉ inquiry@mclean21.com</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6, lineHeight: 1.6 }}>
              Ownly(온리)에서 제공하는 정보는 임대 관리 참고용이며, 세무·법률 판단의 근거로 활용할 수 없습니다.
            </p>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
            © 2025 McLean Inc.
          </p>
        </div>

      </div>
    </footer>
  );
}
