"use client";
import { useState, useMemo } from "react";
import { SectionLabel } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

// 2024년 기준 소득세 세율 구간 (만원)
const TAX_BRACKETS = [
  { limit: 1400,  rate: 0.06,  base: 0 },
  { limit: 5000,  rate: 0.15,  base: 84 },
  { limit: 8800,  rate: 0.24,  base: 624 },
  { limit: 15000, rate: 0.35,  base: 1536 },
  { limit: 30000, rate: 0.38,  base: 3706 },
  { limit: 50000, rate: 0.40,  base: 9406 },
  { limit: Infinity, rate: 0.42, base: 17406 },
];

function calcIncomeTax(income) {
  for (const b of TAX_BRACKETS) {
    if (income <= b.limit) return Math.round(b.base + (income - (TAX_BRACKETS[TAX_BRACKETS.indexOf(b) - 1]?.limit || 0)) * b.rate);
  }
  return 0;
}

function calcIncomeTaxCorrect(income) {
  if (income <= 0) return 0;
  if (income <= 1400)  return Math.round(income * 0.06);
  if (income <= 5000)  return Math.round(84  + (income - 1400) * 0.15);
  if (income <= 8800)  return Math.round(624 + (income - 5000) * 0.24);
  if (income <= 15000) return Math.round(1536 + (income - 8800) * 0.35);
  if (income <= 30000) return Math.round(3706 + (income - 15000) * 0.38);
  if (income <= 50000) return Math.round(9406 + (income - 30000) * 0.40);
  return Math.round(17406 + (income - 50000) * 0.42);
}

function effectiveRate(tax, income) {
  if (!income) return 0;
  return ((tax / income) * 100).toFixed(1);
}

export default function TaxPage() {
  const { tenants } = useApp();
  const [tab, setTab]     = useState("income"); // income | vat | summary
  const [period, setPeriod] = useState("1h");
  const [deductions, setDeductions] = useState({
    insurance: "", repair: "", interest: "", depreciation: "", other: ""
  });
  const [otherIncome, setOtherIncome] = useState(""); // 임대 외 소득

  const setD = (k, v) => setDeductions((d) => ({ ...d, [k]: v }));

  // ── 기초 수치 ──
  const commercialTenants = tenants.filter((t) => t.p_type === "상가" || t.pType === "상가");
  const allTenants        = tenants;

  const monthlyTotal     = allTenants.reduce((s, t) => s + (Number(t.rent) || 0), 0);
  const annualRent       = monthlyTotal * 12;
  const totalDeductAmt   = Object.values(deductions).reduce((s, v) => s + (Number(v) || 0), 0);
  const otherIncomeAmt   = Number(otherIncome) || 0;
  const taxableIncome    = Math.max(0, annualRent + otherIncomeAmt - totalDeductAmt);
  const incomeTax        = calcIncomeTaxCorrect(taxableIncome);
  const localTax         = Math.round(incomeTax * 0.1);
  const totalTax         = incomeTax + localTax;
  const afterTax         = annualRent - totalTax;

  // 부가세
  const periodMonths   = 6;
  const vatTenants     = commercialTenants;
  const vatSupply      = vatTenants.reduce((s, t) => s + (Number(t.rent) || 0), 0) * periodMonths;
  const vatAmount      = Math.round(vatSupply * 0.1);

  // 세율
  const eRate = effectiveRate(incomeTax, annualRent);

  const numStyle = (v, color = C.text) => ({
    fontSize: 22, fontWeight: 800, color,
  });

  const card = (label, value, color, sub) => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>{label}</p>
      <p style={numStyle(value, color)}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</p>}
    </div>
  );

  const inp = (key, ph) => (
    <input
      type="number" value={deductions[key]}
      onChange={(e) => setD(key, e.target.value)}
      placeholder={ph}
      style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: C.text, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 9, outline: "none", boxSizing: "border-box" }}
    />
  );

  const lbl = (txt, hint) => (
    <div style={{ marginBottom: 7 }}>
      <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase" }}>{txt}</p>
      {hint && <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{hint}</p>}
    </div>
  );

  // 세율 구간 표시
  const bracketLabel = (income) => {
    if (income <= 1400)  return "6%";
    if (income <= 5000)  return "15%";
    if (income <= 8800)  return "24%";
    if (income <= 15000) return "35%";
    if (income <= 30000) return "38%";
    if (income <= 50000) return "40%";
    return "42%";
  };

  return (
    <div className="page-in page-padding" style={{ padding: "36px 40px", maxWidth: 980 }}>
      <div style={{ marginBottom: 22 }}>
        <SectionLabel>TAX SIMULATION</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>세금 시뮬레이터</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>2025년 신고 기준 (2024 귀속) · 참고용 추정치 (실제 세무사 상담 권장)</p>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[{ k: "income", l: "📊 종합소득세" }, { k: "vat", l: "🧾 부가가치세" }, { k: "summary", l: "📋 세금 요약" }].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: "10px 20px", borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `2px solid ${tab === t.k ? C.indigo : C.border}`, background: tab === t.k ? C.indigo + "18" : "transparent", color: tab === t.k ? C.indigo : C.muted }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── 종합소득세 탭 ── */}
      {tab === "income" && (
        <div className="tax-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* 왼쪽: 입력 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 임대 수입 요약 */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <p style={{ fontSize: 11, color: C.indigo, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 14 }}>임대 수입 (자동 계산)</p>
              {allTenants.length === 0 ? (
                <p style={{ fontSize: 13, color: C.muted }}>등록된 세입자가 없습니다</p>
              ) : allTenants.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.text }}>{t.name} <span style={{ fontSize: 11, color: C.muted }}>({t.addr})</span></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>{(t.rent * 12).toLocaleString()}만원/년</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>연간 임대 수입 합계</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{annualRent.toLocaleString()}만원</span>
              </div>
            </div>

            {/* 임대 외 소득 */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <p style={{ fontSize: 11, color: C.amber, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 12 }}>임대 외 소득 (만원/년)</p>
              <input type="number" value={otherIncome} onChange={(e) => setOtherIncome(e.target.value)} placeholder="근로소득, 사업소득 등"
                style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: C.text, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* 필요경비 */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <p style={{ fontSize: 11, color: C.emerald, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 14 }}>필요경비 공제 (만원/년)</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {[
                  { k: "insurance", label: "보험료", hint: "화재보험 등" },
                  { k: "repair",    label: "수선비", hint: "수리·보수비용" },
                  { k: "interest",  label: "이자 비용", hint: "대출이자" },
                  { k: "depreciation", label: "감가상각비", hint: "건물 감가상각" },
                  { k: "other",     label: "기타 경비", hint: "관리비 등" },
                ].map(({ k, label, hint }) => (
                  <div key={k}>
                    {lbl(label, hint)}
                    {inp(k, "0")}
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: C.muted }}>총 공제액</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.emerald }}>{totalDeductAmt.toLocaleString()}만원</span>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 결과 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="tax-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {card("과세표준", taxableIncome.toLocaleString() + "만원", C.text, "임대+기타소득 - 공제")}
              {card("적용 세율 구간", bracketLabel(taxableIncome), C.amber, "한계세율")}
              {card("종합소득세", incomeTax.toLocaleString() + "만원", C.rose, `실효세율 ${eRate}%`)}
              {card("지방소득세", localTax.toLocaleString() + "만원", C.amber, "소득세의 10%")}
            </div>

            {/* 총 납부 세액 */}
            <div style={{ background: `linear-gradient(135deg,${C.rose}18,${C.purple}18)`, border: `1px solid ${C.rose}30`, borderRadius: 16, padding: "22px" }}>
              <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>총 납부 세액 추정</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: C.rose }}>{totalTax.toLocaleString()}만원</p>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>세후 임대 수입: <span style={{ color: C.emerald, fontWeight: 700 }}>{afterTax.toLocaleString()}만원/년</span></p>
            </div>

            {/* 세율 구간 시각화 */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>소득세 세율 구간</p>
              {[
                { range: "~1,400만원",   rate: 6,  limit: 1400 },
                { range: "~5,000만원",   rate: 15, limit: 5000 },
                { range: "~8,800만원",   rate: 24, limit: 8800 },
                { range: "~1.5억원",     rate: 35, limit: 15000 },
                { range: "~3억원",       rate: 38, limit: 30000 },
                { range: "~5억원",       rate: 40, limit: 50000 },
                { range: "5억원 초과",   rate: 42, limit: Infinity },
              ].map(({ range, rate, limit }) => {
                const isActive = taxableIncome > 0 && (
                  limit === 1400 ? taxableIncome <= 1400 :
                  limit === 5000 ? taxableIncome > 1400 && taxableIncome <= 5000 :
                  limit === 8800 ? taxableIncome > 5000 && taxableIncome <= 8800 :
                  limit === 15000 ? taxableIncome > 8800 && taxableIncome <= 15000 :
                  limit === 30000 ? taxableIncome > 15000 && taxableIncome <= 30000 :
                  limit === 50000 ? taxableIncome > 30000 && taxableIncome <= 50000 :
                  taxableIncome > 50000
                );
                return (
                  <div key={range} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: isActive ? C.rose : C.border, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: isActive ? C.text : C.muted, flex: 1, fontWeight: isActive ? 700 : 400 }}>{range}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? C.rose : C.muted }}>{rate}%</span>
                  </div>
                );
              })}
            </div>

            <div style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                ⚠️ 본 시뮬레이션은 <strong style={{ color: C.text }}>참고용 추정치</strong>입니다.<br />
                주택 수, 기준시가, 분리과세 여부 등에 따라 실제 세액이 달라질 수 있습니다.<br />
                정확한 세금 신고는 세무사 상담을 권장합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 부가가치세 탭 ── */}
      {tab === "vat" && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[{ k: "1h", l: "1기 (1~6월)" }, { k: "2h", l: "2기 (7~12월)" }].map((p) => (
              <button key={p.k} onClick={() => setPeriod(p.k)}
                style={{ padding: "7px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${period === p.k ? C.indigo : C.border}`, background: period === p.k ? C.indigo + "20" : "transparent", color: period === p.k ? C.indigo : C.muted }}>
                {p.l}
              </button>
            ))}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px", marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: C.amber, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 14 }}>과세 대상 (상가 임대)</p>
            {vatTenants.length === 0 ? (
              <p style={{ fontSize: 13, color: C.muted }}>등록된 상가 세입자가 없습니다</p>
            ) : vatTenants.map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.text }}>{t.name} <span style={{ fontSize: 11, color: C.muted }}>({t.addr})</span></span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{(t.rent * 6).toLocaleString()}만원 ({period === "1h" ? "1기" : "2기"})</span>
              </div>
            ))}
          </div>

          <div className="dash-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {card("공급가액", vatSupply.toLocaleString() + "만원", C.text, "6개월 임대료 합계")}
            {card("부가세율", "10%", C.amber, "일반과세자")}
            {card("납부 부가세", vatAmount.toLocaleString() + "만원", C.rose, "공급가액 × 10%")}
          </div>

          <div style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
              📌 <strong style={{ color: C.text }}>부가세 신고 일정</strong><br />
              1기 확정신고: 7월 25일까지 · 2기 확정신고: 다음해 1월 25일까지<br />
              연 매출 4,800만원 미만은 간이과세자 적용 가능 (세무사 확인 필요)
            </p>
          </div>
        </div>
      )}

      {/* ── 세금 요약 탭 ── */}
      {tab === "summary" && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, background: C.faint }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>연간 세금 요약</p>
            </div>
            {[
              { l: "연간 임대 수입",   v: annualRent.toLocaleString() + "만원",  c: C.emerald },
              { l: "필요경비 공제",    v: "- " + totalDeductAmt.toLocaleString() + "만원", c: C.amber },
              { l: "과세표준",         v: taxableIncome.toLocaleString() + "만원", c: C.text },
              { l: "종합소득세",       v: "- " + incomeTax.toLocaleString() + "만원", c: C.rose },
              { l: "지방소득세",       v: "- " + localTax.toLocaleString() + "만원", c: C.rose },
              { l: "부가가치세 (연간)", v: "- " + (vatAmount * 2).toLocaleString() + "만원", c: C.rose },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "14px 22px", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.muted }}>{l}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 22px", background: C.faint }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>실수령 추정</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.emerald }}>{(annualRent - totalTax - vatAmount * 2).toLocaleString()}만원</span>
            </div>
          </div>

          <div style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
              ⚠️ 본 요약은 <strong style={{ color: C.text }}>단순 추정치</strong>이며 실제 세액과 다를 수 있습니다.<br />
              종합소득세 신고: 매년 5월 / 부가세 신고: 1월·7월
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
