"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import SiteFooter from "../../../components/SiteFooter";
import { calcTotalHoldingTax, HOLDING_TAX_BASIS_YEAR, HOLDING_TAX_DISCLAIMER } from "../../../lib/holdingTax";

// 무료 공개 도구: 보유세(재산세 + 종부세) 계산기
// 로그인 불필요. src/lib/holdingTax.js 재사용 — 기준 연도·면책 동일 적용.

const NAVY = "#1a2744";

function Field({ label, hint, ...props }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 6 }}>{label}{hint && <span style={{ fontWeight: 500, marginLeft: 6, color: "#b0b0c0" }}>{hint}</span>}</p>
      <input {...props} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: NAVY, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
    </div>
  );
}

function Toggle({ label, sub, value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", background: value ? "rgba(79,70,229,0.05)" : "#faf9f6", border: `1.5px solid ${value ? "rgba(79,70,229,0.3)" : "#ebe9e3"}`, borderRadius: 12, cursor: "pointer" }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: "#8a8a9a", margin: "2px 0 0" }}>{sub}</p>}
      </div>
      <div style={{ width: 40, height: 22, borderRadius: 11, background: value ? "#4f46e5" : "#d1d5db", position: "relative", transition: "background .2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left .2s" }} />
      </div>
    </div>
  );
}

const fmt = (manwon) => {
  if (manwon >= 10000) return `${(manwon / 10000).toFixed(manwon % 10000 === 0 ? 0 : 1)}억원`;
  return `${Math.round(manwon).toLocaleString()}만원`;
};

export default function HoldingTaxToolPage() {
  const [housingEok, setHousingEok] = useState("");
  const [is1Home, setIs1Home] = useState(true);
  const [is3Plus, setIs3Plus] = useState(false);
  const [joint, setJoint] = useState(false);

  const result = useMemo(() => {
    const sum = Number(housingEok || 0) * 10000; // 억 → 만원
    if (!sum) return null;
    return calcTotalHoldingTax({
      housingPriceSum: sum,
      is1Home: is1Home && !is3Plus,
      is3Plus,
      isJointOwnership: joint,
    });
  }, [housingEok, is1Home, is3Plus, joint]);

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
            보유세 <span className="gradient-text-2">무료 계산기</span>
          </h1>
          <p style={{ fontSize: 14, color: "#6a6a7a", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 14px" }}>
            공시가격만 입력하면 재산세 + 종합부동산세를 바로 추정합니다.<br />
            1주택 · 다주택 · 부부공동명의 조건을 바꿔가며 비교해보세요.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <span className="chip">🧮 {HOLDING_TAX_BASIS_YEAR} 세법 기준</span>
            <span className="chip">🆓 로그인 불필요</span>
          </div>
        </div>

        {/* 입력 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <Field label="보유 주택 공시가격 합계 (억원)" hint="공시가격은 통상 시세의 60~70% — 부동산공시가격알리미에서 확인" inputMode="decimal" placeholder="예: 9.5" value={housingEok} onChange={(e) => setHousingEok(e.target.value)} />
          <Toggle label="1세대 1주택" sub="기본공제 12억원 적용 (그 외 9억원)" value={is1Home && !is3Plus} onChange={(v) => { setIs1Home(v); if (v) setIs3Plus(false); }} />
          <Toggle label="3주택 이상 (조정대상지역 포함)" sub="종부세 중과세율 적용" value={is3Plus} onChange={(v) => { setIs3Plus(v); if (v) setIs1Home(false); }} />
          <Toggle label="부부 공동명의 (1/2씩)" sub="종부세는 인별 과세 — 명의별 분할 계산 후 합산" value={joint} onChange={setJoint} />
        </div>

        {/* 결과 */}
        {result && (
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", padding: "20px 22px", color: "#fff" }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", opacity: .6, marginBottom: 4 }}>연간 보유세 추정 (재산세 + 종부세)</p>
              <p className="num" style={{ fontSize: 30, fontWeight: 900, margin: 0 }}>{fmt(result.grandTotal)}</p>
            </div>
            <div style={{ padding: "16px 22px" }}>
              {[
                ["재산세 (주택분)", result.propertyTax.housing],
                ["종합부동산세", result.comprehensiveTax.housing],
              ].map(([label, v]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f0efe9" }}>
                  <span style={{ fontSize: 13, color: "#6a6a7a", fontWeight: 600 }}>{label}</span>
                  <span className="num" style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{fmt(v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0" }}>
                <span style={{ fontSize: 12, color: "#a0a0b0" }}>종부세 공제액 {joint ? "(명의별 합산)" : ""}</span>
                <span className="num" style={{ fontSize: 12, color: "#a0a0b0" }}>{fmt(result.comprehensiveTax.housingDetail.exemption)}</span>
              </div>
              <p style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.7, margin: "10px 0 0" }}>{HOLDING_TAX_DISCLAIMER}</p>
            </div>
          </div>
        )}

        {/* 8·3 개편 안내 */}
        <Link href="/policy" style={{ textDecoration: "none" }}>
          <div style={{ background: "rgba(201,146,10,0.06)", border: "1.5px solid rgba(201,146,10,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ fontSize: 22 }}>🏛️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: NAVY, margin: 0 }}>2027년부터 종부세 공제가 바뀝니다 (8·3 세제개편)</p>
              <p style={{ fontSize: 11.5, color: "#8a7a4a", margin: "3px 0 0", lineHeight: 1.6 }}>거주 1주택 14억↑ · 비거주 1주택 9억↓ · 다주택 거주비율 연동 — 임대인 영향 정리 보기</p>
            </div>
            <span style={{ fontSize: 13, color: "#c9920a", fontWeight: 800 }}>→</span>
          </div>
        </Link>

        {/* 가입 전환 CTA */}
        <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 16, padding: "22px 22px", color: "#fff", marginBottom: 40 }}>
          <p style={{ fontSize: 15, fontWeight: 900, margin: "0 0 6px" }}>내 물건별 세금을 자동으로 관리하세요</p>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 14px" }}>
            무료 가입하면 물건을 등록해 <b style={{ color: "#fff" }}>종합소득세 시뮬레이션·수금 현황·만료 알림</b>까지 한 곳에서 관리할 수 있습니다.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/login?mode=signup" className="btn" style={{ background: "#fff", color: NAVY, fontWeight: 800, textDecoration: "none" }}>무료 가입하고 시작 →</Link>
            <Link href="/tools/yield" className="btn btn-ghost" style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)", textDecoration: "none" }}>수익률 계산기</Link>
          </div>
        </div>

        {/* SEO FAQ */}
        <h2 style={{ fontSize: 20, fontWeight: 900, color: NAVY, marginBottom: 16 }}>자주 묻는 질문</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[
            { q: "보유세는 언제 내나요?", a: "재산세는 매년 7월(1/2)과 9월(1/2)에 나뉘어 고지되고, 종합부동산세는 매년 12월에 고지됩니다. 과세 기준일은 6월 1일 — 이 날짜에 보유한 사람이 그 해 보유세를 부담합니다." },
            { q: "공시가격은 어디서 확인하나요?", a: "국토교통부 '부동산공시가격알리미(realtyprice.kr)'에서 주소로 조회할 수 있습니다. 공시가격은 통상 시세의 60~70% 수준입니다." },
            { q: "부부 공동명의가 유리한가요?", a: "종부세는 인별 과세라 공동명의 시 각자 공제를 받아 유리한 경우가 많지만, 1세대 1주택 고령·장기보유 세액공제는 단독명의에만 적용되는 등 상황에 따라 다릅니다. 이 계산기에서 조건을 바꿔 비교해보시고, 최종 결정은 세무사와 상담하세요." },
            { q: "이 계산이 실제 고지서와 다를 수 있나요?", a: `네. 본 계산기는 ${HOLDING_TAX_BASIS_YEAR} 세법 기준의 단순 추정으로, 세부담 상한·고령자/장기보유 세액공제·지역자원시설세 등은 반영되지 않습니다. 실제 세액은 위택스·홈택스 고지서를 기준으로 확인하세요.` },
          ].map((f) => (
            <details key={f.q} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 18px" }}>
              <summary style={{ fontSize: 13.5, fontWeight: 800, color: NAVY, cursor: "pointer" }}>{f.q}</summary>
              <p style={{ fontSize: 12.5, color: "#6a6a7a", lineHeight: 1.8, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
