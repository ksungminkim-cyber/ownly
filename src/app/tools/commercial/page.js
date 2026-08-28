"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import SiteFooter from "../../../components/SiteFooter";

// 무료 공개 도구: 상가 환산보증금 계산기 (상가건물임대차보호법)
// 상가·법인 임대인 세그먼트 특화 — 자리톡류 원룸 중심 서비스와의 차별점
// 기준: 상가건물임대차보호법 시행령 (2019-04-02 개정, 현행)

const NAVY = "#1a2744";

const REGION_LIMITS = [
  { key: "seoul", label: "서울특별시", limit: 90000 },
  { key: "metro", label: "과밀억제권역·부산 (서울 제외)", limit: 69000 },
  { key: "city", label: "광역시·세종·파주·화성·안산·용인·김포·광주", limit: 54000 },
  { key: "etc", label: "그 밖의 지역", limit: 37000 },
];

const fmt = (manwon) => manwon >= 10000 ? `${(manwon / 10000).toFixed(manwon % 10000 === 0 ? 0 : 1)}억원` : `${manwon.toLocaleString()}만원`;

function Field({ label, hint, ...props }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 6 }}>{label}{hint && <span style={{ fontWeight: 500, marginLeft: 6, color: "#b0b0c0" }}>{hint}</span>}</p>
      <input {...props} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: NAVY, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
    </div>
  );
}

export default function CommercialToolPage() {
  const [region, setRegion] = useState("seoul");
  const [deposit, setDeposit] = useState("");
  const [rent, setRent] = useState("");

  const result = useMemo(() => {
    const dep = Number(deposit || 0);
    const r = Number(rent || 0);
    if (!dep && !r) return null;
    const converted = dep + r * 100;
    const limit = REGION_LIMITS.find(x => x.key === region).limit;
    return { converted, limit, protectedFull: converted <= limit };
  }, [deposit, rent, region]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 60px", width: "100%", boxSizing: "border-box" }}>
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(145deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: NAVY }}>온리</span>
          </Link>
          <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: NAVY, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            상가 환산보증금 <span className="gradient-text-2">무료 계산기</span>
          </h1>
          <p style={{ fontSize: 14, color: "#6a6a7a", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 14px" }}>
            보증금 + 월세×100 = 환산보증금.<br />
            이 금액이 지역 기준 이내인지에 따라 상가건물임대차보호법 적용 범위가 달라집니다.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <span className="chip">⚖️ 상가임대차보호법 시행령 기준</span>
            <span className="chip">🆓 로그인 불필요</span>
          </div>
        </div>

        {/* 계산기 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "22px 20px", marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 8 }}>상가 소재지</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {REGION_LIMITS.map((r) => (
              <button key={r.key} onClick={() => setRegion(r.key)} className={`chip ${region === r.key ? "is-active" : ""}`} style={{ cursor: "pointer" }}>{r.label}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <Field label="보증금 (만원)" inputMode="numeric" placeholder="5000" value={deposit} onChange={(e) => setDeposit(e.target.value.replace(/[^0-9]/g, ""))} />
            <Field label="월세 (만원)" inputMode="numeric" placeholder="300" value={rent} onChange={(e) => setRent(e.target.value.replace(/[^0-9]/g, ""))} />
          </div>

          {result && (
            <div style={{ background: result.protectedFull ? "rgba(15,165,115,0.06)" : "rgba(232,150,10,0.06)", border: `1.5px solid ${result.protectedFull ? "rgba(15,165,115,0.3)" : "rgba(232,150,10,0.35)"}`, borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ fontSize: 12, color: "#6a6a7a", fontWeight: 700, marginBottom: 4 }}>환산보증금 = {Number(deposit || 0).toLocaleString()} + {Number(rent || 0).toLocaleString()}×100</p>
              <p className="num" style={{ fontSize: 28, fontWeight: 900, color: NAVY, margin: "0 0 8px" }}>{fmt(result.converted)}</p>
              {result.protectedFull ? (
                <p style={{ fontSize: 13, fontWeight: 800, color: "#0fa573", margin: 0 }}>✅ 지역 기준({fmt(result.limit)}) 이내 — 상가임대차보호법 <u>전면 적용</u></p>
              ) : (
                <p style={{ fontSize: 13, fontWeight: 800, color: "#b8860b", margin: 0 }}>⚠️ 지역 기준({fmt(result.limit)}) 초과 — <u>일부 조항만 적용</u></p>
              )}
              <p style={{ fontSize: 11.5, color: "#6a6a7a", lineHeight: 1.8, margin: "8px 0 0" }}>
                {result.protectedFull
                  ? "임대료 인상 5% 상한 · 우선변제권 · 묵시적 갱신 등 법의 보호 조항이 모두 적용됩니다."
                  : "기준 초과 상가에도 대항력, 계약갱신요구권(10년), 권리금 회수기회 보호, 3기 연체 해지 규정은 그대로 적용됩니다. 다만 5% 인상 상한·우선변제권 등은 적용되지 않습니다."}
              </p>
            </div>
          )}
        </div>

        {/* 핵심 규정 요약 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "22px 20px", marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, marginBottom: 12 }}>⚖️ 상가 임대인이 꼭 아는 4가지</p>
          {[
            ["계약갱신요구권 10년", "임차인은 최초 계약일로부터 10년간 갱신을 요구할 수 있고, 정당한 사유 없이 거절할 수 없습니다. 환산보증금과 무관하게 적용됩니다."],
            ["임대료 인상 상한 5%", "환산보증금이 기준 이내라면 증액 청구는 5%를 넘을 수 없습니다. 기준 초과 상가는 상한이 없지만 과도한 인상은 분쟁 소지가 있습니다."],
            ["3기 연체 시 해지", "월세를 3개월분(3기) 연체하면 계약 해지와 갱신 거절이 가능합니다. 주택(2기)과 다릅니다."],
            ["권리금 회수기회 보호", "계약 종료 6개월 전부터 종료 시까지 임차인의 권리금 회수를 방해하면 손해배상 책임이 생길 수 있습니다."],
          ].map(([t, s]) => (
            <div key={t} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
              <span style={{ color: "#c9920a", fontWeight: 900, flexShrink: 0 }}>▪</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: NAVY, margin: 0 }}>{t}</p>
                <p style={{ fontSize: 12, color: "#6a6a7a", lineHeight: 1.7, margin: "3px 0 0" }}>{s}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 16, padding: "24px 22px", color: "#fff", marginBottom: 40 }}>
          <p style={{ fontSize: 15, fontWeight: 900, margin: "0 0 6px" }}>상가·건물 임대, 엑셀로 관리하고 계신가요?</p>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, margin: "0 0 14px" }}>
            온리는 상가·사무실·건물 단위 관리에 특화된 웹 기반 임대 관리 서비스입니다.<br />
            수금·부가세·세금계산서·3기 연체 추적·내용증명까지 — <b style={{ color: "#fff" }}>지금은 전부 무료</b>입니다.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/login?mode=signup" className="btn" style={{ background: "#fff", color: NAVY, fontWeight: 800, textDecoration: "none" }}>무료로 시작하기 →</Link>
            <Link href="/tools/certified" className="btn btn-ghost" style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)", textDecoration: "none" }}>내용증명 생성기</Link>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.7, textAlign: "center" }}>
          ※ 상가건물임대차보호법 및 시행령(현행) 기준의 일반적 안내이며 법률 자문이 아닙니다. 개별 사안은 변호사·법무사와 상담하세요.
        </p>
      </div>

      <SiteFooter />
    </div>
  );
}
