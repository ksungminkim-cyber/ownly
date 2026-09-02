"use client";
import { useState } from "react";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";
import { POLICIES, POLICY_REVIEW_DATE } from "../../lib/policies";

// 무료 공개 페이지: 최근 부동산 대책 임대인 영향 브리핑
// 로그인 불필요. 대시보드에 매물을 등록하면 매물별 해당 항목을 자동 매칭해 보여줍니다.

const TAG_COLORS = {
  "규제지역": { c: "#e8445a", bg: "rgba(232,68,90,0.08)" },
  "세제":     { c: "#c9920a", bg: "rgba(201,146,10,0.1)" },
  "대출·금융": { c: "#1e7fcb", bg: "rgba(30,127,203,0.08)" },
  "공급":     { c: "#0fa573", bg: "rgba(15,165,115,0.08)" },
};

function CertaintyChip({ certainty }) {
  if (certainty === "possible") {
    return <span className="chip chip-warn" style={{ fontSize: 10 }}>지역·유형 기준 해당 가능</span>;
  }
  return <span className="chip chip-info" style={{ fontSize: 10 }}>본인 조건 확인 필요</span>;
}

export default function PolicyPage() {
  const [openItems, setOpenItems] = useState({});
  const toggle = (id) => setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* 상단 네비 */}
      <nav style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: 14 }}>← 홈으로</Link>
        <Link href="/login?mode=signup" className="btn btn-fill btn-sm">무료 시작하기</Link>
      </nav>

      {/* 히어로 */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 28px", textAlign: "center" }}>
        <p className="section-eyebrow" style={{ marginBottom: 10 }}>POLICY BRIEFING</p>
        <h1 style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 14 }}>
          쏟아지는 부동산 대책,<br /><span className="gradient-text-2">임대인에게 영향 있는 것만</span> 정리했습니다
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.8, marginBottom: 16 }}>
          8·3 세제개편안 · 8·13 공급/금융대책 · 규제지역 현황을 원문 기준으로 쉽게 풀었습니다.<br />
          대시보드에 매물을 등록하면 <b style={{ color: "var(--text)" }}>내 매물과 겹치는 항목을 자동으로 표시</b>해 드립니다.
        </p>
        <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <span className="chip">최종 검토일 {POLICY_REVIEW_DATE}</span>
          <span className="chip">대책 {POLICIES.length}건 · 항목 {POLICIES.reduce((s, p) => s + p.items.length, 0)}개</span>
        </div>
      </section>

      {/* 정책 카드 */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {POLICIES.map(policy => {
          const tc = TAG_COLORS[policy.tag] || TAG_COLORS["세제"];
          return (
            <div key={policy.id} className="surface-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: tc.c, background: tc.bg, padding: "3px 10px", borderRadius: 20 }}>{policy.tag}</span>
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>발표 {policy.announcedAt}</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.3px" }}>{policy.title}</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.75, margin: 0 }}>{policy.summary}</p>
              </div>
              <div>
                {policy.items.map((item, i) => {
                  const key = `${policy.id}-${item.id}`;
                  const open = !!openItems[key];
                  return (
                    <div key={item.id} style={{ borderBottom: i < policy.items.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <button onClick={() => toggle(key)}
                        style={{ width: "100%", textAlign: "left", padding: "14px 22px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.5 }}>{item.headline}</span>
                        <CertaintyChip certainty={item.certainty} />
                        <span style={{ fontSize: 16, color: "var(--text-faint)", transform: open ? "rotate(45deg)" : "none", transition: "transform var(--t-fast) var(--ease)", flexShrink: 0 }}>+</span>
                      </button>
                      {open && (
                        <div style={{ padding: "0 22px 16px" }}>
                          <p style={{ fontSize: 13, color: "#4a4a6a", lineHeight: 1.8, marginBottom: 10 }}>{item.plain}</p>
                          <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                            <p style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.7, margin: 0 }}><b>임대인 영향</b> — {item.impact}</p>
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>적용: {item.effectiveFrom}</span>
                            {item.checkNote && <span style={{ fontSize: 11, color: "#8a6d1a" }}>⚠️ {item.checkNote}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "10px 22px", background: "var(--surface2)", borderTop: "1px solid var(--border)" }}>
                <a href={policy.source.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}>
                  출처: {policy.source.name} ↗
                </a>
              </div>
            </div>
          );
        })}
      </section>

      {/* 규제지역 목록 */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "8px 20px 20px" }}>
        <div className="surface-card" style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>현재 규제지역 (조정대상지역·투기과열지구·토지거래허가구역)</p>
          <p style={{ fontSize: 13, color: "#4a4a6a", lineHeight: 1.9, margin: 0 }}>
            <b>서울</b> 25개 자치구 전역 · <b>경기 15곳</b> — 과천시, 광명시, 성남시 분당구·수정구·중원구, 수원시 영통구·장안구·팔달구, 안양시 동안구, 용인시 수지구·기흥구, 의왕시, 하남시, 화성시 동탄, 구리시
          </p>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 10, margin: "10px 0 0" }}>
            2025-10-15 지정, 2026-06-30 확대 기준 · 지정·해제는 수시로 변경될 수 있으니 계약 전 국토교통부 고시를 확인하세요.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "8px 20px 48px" }}>
        <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270,#4b3fa8)", borderRadius: 20, padding: "32px 28px", textAlign: "center" }}>
          <p style={{ fontSize: 19, fontWeight: 900, color: "#fff", marginBottom: 8 }}>내 매물은 어디에 해당될까요?</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: 20 }}>
            매물 주소·유형을 등록하면 위 항목 중 겹치는 것만 골라 대시보드에 표시해 드립니다.<br />
            지금은 모든 기능 무료 · 카드 등록 불필요
          </p>
          <Link href="/login?mode=signup" className="btn btn-lg" style={{ background: "#fff", color: "#1a2744", fontWeight: 800 }}>
            무료로 내 매물 등록하기 →
          </Link>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.8, marginTop: 18, textAlign: "center" }}>
          ※ 본 페이지는 {POLICY_REVIEW_DATE} 기준 보도자료·언론 보도를 정리한 참고 자료이며 법률·세무 자문이 아닙니다.<br />
          실제 적용 여부는 세대 기준 주택 수·거주 이력 등 개별 조건에 따라 다르니 국세청·세무사·금융기관을 통해 확인하세요.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
