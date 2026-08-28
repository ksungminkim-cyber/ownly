"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function SiteFooter({ hasFixedBar = false }) {
  // 로그인 상태에 따라 커뮤니티 링크 분기 (대시보드 vs 공개)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setIsLoggedIn(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setIsLoggedIn(!!session?.user);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  const communityHref = isLoggedIn ? "/dashboard/community" : "/community";
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
              { label: "전국 시세", href: "/sise" },
              { label: "등급 진단", href: "/diagnose" },
              { label: "수익률 계산기", href: "/tools/yield" },
              { label: "계약서 생성기", href: "/tools/contract" },
              { label: "내용증명 생성기", href: "/tools/certified" },
              { label: "보유세 계산기", href: "/tools/tax" },
              { label: "월세 환급", href: "/tools/refund" },
              { label: "상가 환산보증금", href: "/tools/commercial" },
              { label: "정책 브리핑", href: "/policy" },
              { label: "커뮤니티", href: communityHref },
              { label: "임대인 가이드", href: "/blog" },
              { label: "FAQ", href: "/legal/faq" },
              { label: "이용약관", href: "/legal/terms" },
              { label: "개인정보처리방침", href: "/legal/privacy" },
            ].map(l => (
              <Link key={l.label} href={l.href}
                style={{ fontSize: 12, color: "#8a8a9a", textDecoration: "none", whiteSpace: "nowrap" }}
                onMouseEnter={e => e.currentTarget.style.color = "#1a2744"}
                onMouseLeave={e => e.currentTarget.style.color = "#8a8a9a"}>
                {l.label}
              </Link>
            ))}
            {/* 카카오톡 채널 — 다음 검색등록 요건 */}
            <a href="http://pf.kakao.com/_ZBcxhX" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#3c1e1e", background: "#fee500", padding: "5px 10px", borderRadius: 7, textDecoration: "none", whiteSpace: "nowrap" }}
              title="카카오톡 채널 '온리_ownly'로 문의">
              💬 카카오톡 채널
            </a>
          </nav>
        </div>

        {/* 패밀리 서비스 — 임대인 라이프사이클 크로스 링크 (카드형) */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px 12px", marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", whiteSpace: "nowrap", marginRight: 2 }}>
            함께 쓰는<br />임대인 도구
          </span>
          {[
            {
              href: "https://beyond.mclean21.com",
              name: "낙찰너머",
              desc: "경매 상가, 낙찰받으면 얼마 벌리나",
              accent: "#B97B24",
              mark: (
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <rect x="1" y="3.5" width="11" height="11" fill="#1B2F45" />
                  <rect x="6.5" y="8" width="10" height="2.4" fill="#B97B24" />
                </svg>
              ),
            },
            {
              href: "https://chaeum.mclean21.com",
              name: "채움",
              desc: "공실 상가, 어떤 가게로 채울까",
              accent: "#14634B",
              mark: (
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <rect x="2" y="2" width="14" height="14" fill="none" stroke="#14634B" strokeWidth="1.6" strokeDasharray="3.2 2.2" />
                  <rect x="2.8" y="9" width="12.4" height="6.2" fill="#14634B" />
                </svg>
              ),
            },
          ].map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#fff", border: "1px solid #e2e0d8", borderRadius: 10,
                padding: "9px 14px", textDecoration: "none",
                transition: "border-color .2s ease, box-shadow .2s ease, transform .15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.boxShadow = "0 6px 16px rgba(26,39,68,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e0d8"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              {s.mark}
              <span style={{ lineHeight: 1.35 }}>
                <b style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "#1a2744" }}>{s.name}</b>
                <span style={{ fontSize: 11, color: "#8a8a9a" }}>{s.desc}</span>
              </span>
              <span aria-hidden="true" style={{ fontSize: 12, color: s.accent, fontWeight: 700, marginLeft: 2 }}>↗</span>
            </a>
          ))}
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
            <span>
              (주)맥클린 · 대표 김성민 · 사업자등록번호 137-81-52231
              {" · "}
              <a
                href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1378152231"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#8a8a9a", textDecoration: "underline" }}
              >사업자정보확인</a>
              {" · "}
              통신판매업신고 제2026-경기김포-2785호
            </span>
            <span>📍 경기도 김포시 양촌읍 유현삭시로241번길 86 · 📞 02-334-2211 · ✉ inquiry@mclean21.com · 고객센터 평일 10:00~18:00 · 카카오톡 채널 <a href="http://pf.kakao.com/_ZBcxhX" target="_blank" rel="noopener noreferrer" style={{ color: "#a0a0b0", textDecoration: "underline" }}>온리_ownly</a> (@온리_ownly)</span>
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
