"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import SiteFooter from "../../../components/SiteFooter";

// 무료 공개 도구: 임대 수익률 계산기
// 로그인 불필요. 대출·공실·세금 반영한 실질 수익률 즉시 계산.
// 결과 하단에 "내 물건에 저장" CTA로 회원가입 유도.

export default function YieldCalcPage() {
  const [form, setForm] = useState({
    price: "",          // 매매가 (만원)
    rent: "",           // 월세 (만원)
    deposit: "",        // 보증금 (만원)
    loan: "",           // 대출금액 (만원)
    rate: "4.5",        // 대출금리 %
    vacancy: "5",       // 공실률 %
    maintenance: "",    // 월 관리비 (만원)
    propertyTax: "",    // 연 재산세 (만원)
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const n = (v) => Number(v || 0);

  const result = useMemo(() => {
    const price = n(form.price);
    const rent = n(form.rent);
    const deposit = n(form.deposit);
    const loan = n(form.loan);
    const rate = n(form.rate) / 100;
    const vacancy = n(form.vacancy) / 100;
    const maint = n(form.maintenance);
    const tax = n(form.propertyTax);

    if (!price || !rent) return null;

    const equity = price - loan - deposit; // 실투자금 (만원)
    if (equity <= 0) return { equity, error: "실투자금이 0 이하입니다 (대출·보증금이 매매가보다 큼)" };

    const annualRent = rent * 12;
    const adjRent = annualRent * (1 - vacancy); // 공실 반영
    const annualLoanInterest = loan * rate;
    const annualMaint = maint * 12;
    const annualCosts = annualLoanInterest + annualMaint + tax;
    const netAnnual = adjRent - annualCosts;

    const grossYield  = price > 0 ? (annualRent / price) * 100 : 0;
    const netYield    = equity > 0 ? (netAnnual / equity) * 100 : 0;
    const cashFlowMon = Math.round((adjRent - annualCosts) / 12);

    // 10년 누적 현금흐름 (간단 가정: 임대료 연 2% 상승, 금리 고정)
    const yearly = Array.from({ length: 10 }, (_, i) => {
      const year = i + 1;
      const growthFactor = Math.pow(1.02, i);
      const yrRent = annualRent * growthFactor * (1 - vacancy);
      const yrNet = yrRent - annualCosts;
      return { year, rent: Math.round(yrRent), net: Math.round(yrNet), cumulative: null };
    });
    let cum = 0;
    yearly.forEach(y => { cum += y.net; y.cumulative = cum; });
    const paybackYear = yearly.find(y => y.cumulative >= equity)?.year || null;

    return {
      equity,
      annualRent,
      adjRent: Math.round(adjRent),
      annualCosts: Math.round(annualCosts),
      annualLoanInterest: Math.round(annualLoanInterest),
      netAnnual: Math.round(netAnnual),
      grossYield: Math.round(grossYield * 100) / 100,
      netYield: Math.round(netYield * 100) / 100,
      cashFlowMon,
      yearly,
      paybackYear,
    };
  }, [form]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #ebe9e3", padding: "14px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#1a2744" }}>온리</span>
            <span style={{ fontSize: 11, color: "#8a8a9a" }}>| 무료 도구</span>
          </Link>
          <Link href="/login?mode=signup" style={{ padding: "7px 14px", background: "#1a2744", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>무료 시작 →</Link>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 56px" }}>
        <section style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#5b4fcf", letterSpacing: "1.5px", marginBottom: 6 }}>FREE TOOL</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1a2744" }}>임대 수익률 계산기</h1>
          <p style={{ fontSize: 13, color: "#6a6a7a", marginTop: 6, lineHeight: 1.7 }}>
            매매가·월세·대출·공실률까지 반영한 <b>실질 수익률</b>을 즉시 계산합니다. 10년 누적 현금흐름과 투자금 회수 시점까지.
          </p>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {/* 입력 폼 */}
          <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "22px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 14 }}>💰 기본 정보</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <FormField label="매매가 (만원)"  value={form.price}   onChange={set("price")}   placeholder="50000" required />
              <FormField label="월세 (만원)"    value={form.rent}    onChange={set("rent")}    placeholder="150" required />
              <FormField label="보증금 (만원)"  value={form.deposit} onChange={set("deposit")} placeholder="5000" />
              <FormField label="대출금액 (만원)" value={form.loan}    onChange={set("loan")}    placeholder="25000" />
              <FormField label="대출금리 (%)"   value={form.rate}    onChange={set("rate")}    placeholder="4.5" />
              <FormField label="공실률 (%)"     value={form.vacancy} onChange={set("vacancy")} placeholder="5" />
              <FormField label="월 관리비 (만원)"  value={form.maintenance} onChange={set("maintenance")} placeholder="5" />
              <FormField label="연 재산세 (만원)"  value={form.propertyTax} onChange={set("propertyTax")} placeholder="30" />
            </div>
          </section>

          {/* 결과 */}
          {result && !result.error && (
            <>
              <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <ResultCard
                  label="실투자금"
                  value={fmtMan(result.equity)}
                  sub="매매가 - 대출 - 보증금"
                  color="#1a2744"
                />
                <ResultCard
                  label="표면 수익률"
                  value={`${result.grossYield}%`}
                  sub="연 임대료 ÷ 매매가"
                  color="#8a8a9a"
                />
                <ResultCard
                  label="실질 수익률"
                  value={`${result.netYield}%`}
                  sub="공실·대출·세금 반영"
                  color={result.netYield >= 6 ? "#0fa573" : result.netYield >= 3 ? "#e8960a" : "#e8445a"}
                />
                <ResultCard
                  label="월 현금흐름"
                  value={`${result.cashFlowMon.toLocaleString()}만원`}
                  sub="실질 수익 ÷ 12"
                  color="#5b4fcf"
                />
              </section>

              {/* 투자금 회수 */}
              <section style={{ background: "linear-gradient(135deg,rgba(91,79,207,0.08),rgba(15,165,115,0.08))", border: "1px solid rgba(91,79,207,0.2)", borderRadius: 14, padding: "20px 24px" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#5b4fcf", letterSpacing: "1px", marginBottom: 6 }}>💎 투자금 회수 시점</p>
                {result.paybackYear ? (
                  <>
                    <p style={{ fontSize: 26, fontWeight: 900, color: "#1a2744", lineHeight: 1.2 }}>약 <span style={{ color: "#0fa573" }}>{result.paybackYear}년</span> 후</p>
                    <p style={{ fontSize: 12, color: "#6a6a7a", marginTop: 6 }}>임대료 연 2% 인상 가정 · 자본이득 미포함 순수 임대 수익 기준</p>
                  </>
                ) : (
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#e8445a" }}>10년 안에 투자금 회수 어려움 — 임대 조건 재검토 권장</p>
                )}
              </section>

              {/* 연간 내역 */}
              <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "22px 24px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 12 }}>📊 연간 현금흐름 내역</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <BreakRow label="연간 임대료 수입" value={`+${fmtMan(result.annualRent)}`} color="#0fa573" />
                  <BreakRow label="공실 반영 후" value={`+${fmtMan(result.adjRent)}`} color="#0fa573" />
                  <BreakRow label="대출 이자 (연)" value={`-${fmtMan(result.annualLoanInterest)}`} color="#e8445a" />
                  <BreakRow label="관리비·세금 (연)" value={`-${fmtMan(result.annualCosts - result.annualLoanInterest)}`} color="#e8445a" />
                  <BreakRow label="연 순수익" value={`${fmtMan(result.netAnnual)}`} color="#1a2744" big />
                </div>
              </section>

              {/* 10년 테이블 */}
              <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "22px 24px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>📈 10년 누적 시뮬레이션</h3>
                <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 12 }}>임대료 연 2% 상승, 금리·공실률 고정 가정</p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                    <thead>
                      <tr style={{ background: "#faf9f6" }}>
                        {["연도", "연 임대료", "연 순수익", "누적 현금흐름"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 800, color: "#6a6a7a", textAlign: h === "연도" ? "left" : "right" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearly.map(y => (
                        <tr key={y.year} style={{ borderBottom: "1px solid #f0efe9" }}>
                          <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: "#1a2744" }}>{y.year}년차</td>
                          <td style={{ padding: "9px 12px", fontSize: 12, color: "#6a6a7a", textAlign: "right" }}>{fmtMan(y.rent)}</td>
                          <td style={{ padding: "9px 12px", fontSize: 12, color: y.net >= 0 ? "#0fa573" : "#e8445a", fontWeight: 600, textAlign: "right" }}>{fmtMan(y.net)}</td>
                          <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: y.cumulative >= result.equity ? "#0fa573" : "#1a2744", textAlign: "right" }}>
                            {fmtMan(y.cumulative)}
                            {y.cumulative >= result.equity && <span style={{ marginLeft: 4, fontSize: 10, color: "#0fa573" }}>✓ 회수</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* CTA */}
              <section style={{ background: "linear-gradient(135deg,#1a2744,#5b4fcf)", color: "#fff", borderRadius: 14, padding: "28px 26px" }}>
                <p style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>내 물건으로 자동 계산하고 싶다면</p>
                <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 18, lineHeight: 1.7 }}>
                  온리에 물건을 등록하면 위 수익률을 자동 계산하고,<br />월세 수금·세금 시뮬·임대차 관리까지 한 곳에서 처리됩니다.
                </p>
                <Link href="/login?mode=signup" style={{ display: "inline-block", padding: "11px 26px", background: "#fff", color: "#1a2744", borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                  무료 가입하고 물건 등록하기 →
                </Link>
              </section>

              {/* 관련 도구 */}
              <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Link href="/sise" style={{ padding: "14px 16px", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, textDecoration: "none", color: "#1a2744" }}>
                  <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>🗺️ 이 동네 시세는?</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0fa573" }}>전국 46개 지역 실거래 →</p>
                </Link>
                <Link href="/diagnose" style={{ padding: "14px 16px", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, textDecoration: "none", color: "#1a2744" }}>
                  <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>🎯 내 물건 등급은?</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#5b4fcf" }}>1분 AI 진단 →</p>
                </Link>
              </section>
            </>
          )}

          {result?.error && (
            <div style={{ background: "rgba(232,68,90,0.08)", border: "1px solid rgba(232,68,90,0.25)", borderRadius: 12, padding: "16px 20px", fontSize: 13, color: "#e8445a", fontWeight: 600 }}>
              ⚠️ {result.error}
            </div>
          )}

          {!result && (
            <div style={{ background: "#fff", border: "1px dashed #ebe9e3", borderRadius: 14, padding: "32px 24px", textAlign: "center", color: "#8a8a9a", fontSize: 13 }}>
              매매가와 월세를 입력하면 수익률이 즉시 계산됩니다
            </div>
          )}
        </div>

        {/* 안내 */}
        <section style={{ marginTop: 22, padding: "14px 18px", background: "#f8f7f4", borderRadius: 10, fontSize: 11, color: "#8a8a9a", lineHeight: 1.7 }}>
          <p>💡 <b style={{ color: "#6a6a7a" }}>참고</b>: 이 계산기는 간단한 가정(임대료 연 2% 상승, 금리·공실률 고정)에 기반한 참고용입니다. 실제 수익은 시장 상황·세법 개정·유지보수 비용에 따라 달라질 수 있습니다.</p>
          <p style={{ marginTop: 4 }}>정확한 실질 수익률(취득세·양도세·종합소득세 포함)은 <Link href="/login?mode=signup" style={{ color: "#5b4fcf", fontWeight: 700 }}>가입 후 프리미엄 계산기</Link>를 이용하세요.</p>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6a6a7a", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#e8445a", marginLeft: 3 }}>*</span>}
      </label>
      <input type="number" value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px", fontSize: 14, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function ResultCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "16px 18px", borderLeft: `3px solid ${color}` }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 5 }}>{sub}</p>
    </div>
  );
}

function BreakRow({ label, value, color, big }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: big ? "rgba(26,39,68,0.04)" : "transparent", borderRadius: 8, borderTop: big ? "1px solid #ebe9e3" : "none", marginTop: big ? 6 : 0 }}>
      <span style={{ fontSize: 13, fontWeight: big ? 800 : 600, color: "#6a6a7a" }}>{label}</span>
      <span style={{ fontSize: big ? 15 : 13, fontWeight: big ? 900 : 700, color }}>{value}</span>
    </div>
  );
}

function fmtMan(v) {
  if (typeof v !== "number") return "-";
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}억`;
  return `${v.toLocaleString()}만`;
}
