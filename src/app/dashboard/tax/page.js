"use client"; import { useState, useMemo } from "react"; import { useRouter } from "next/navigation"; import { SectionLabel } from "../../../components/shared"; import { C } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; import PlanGate from "../../../components/PlanGate"; const TAX_BRACKETS = [ { limit: 1400, rate: 0.06, base: 0 }, { limit: 5000, rate: 0.15, base: 84 }, { limit: 8800, rate: 0.24, base: 624 }, { limit: 15000, rate: 0.35, base: 1536 }, { limit: 30000, rate: 0.38, base: 3706 }, { limit: 50000, rate: 0.40, base: 9406 }, { limit: Infinity, rate: 0.42, base: 17406 } ]; function calcIncomeTaxCorrect(income) { if (income <= 0) return 0; if (income <= 1400) return Math.round(income * 0.06); if (income <= 5000) return Math.round(84 + (income - 1400) * 0.15); if (income <= 8800) return Math.round(624 + (income - 5000) * 0.24); if (income <= 15000) return Math.round(1536 + (income - 8800) * 0.35); if (income <= 30000) return Math.round(3706 + (income - 15000) * 0.38); if (income <= 50000) return Math.round(9406 + (income - 30000) * 0.40); return Math.round(17406 + (income - 50000) * 0.42); } function effectiveRate(tax, income) { if (!income) return 0; return ((tax / income) * 100).toFixed(1); } export default function TaxPage() { return <PlanGate feature="tax"><TaxContent /></PlanGate>; }

// ✅ 토지 임대 세금 시뮬레이터 컴포넌트
function LandTaxTab({ tenants }) {
  const router = useRouter();
  const landTenants = tenants.filter(t => (t.p_type || t.pType) === "토지");

  // 토지 기본 입력
  const [landType, setLandType] = useState("나대지"); // 나대지 | 농지 | 임야 | 대지
  const [publicPrice, setPublicPrice] = useState(""); // 공시지가 (만원)
  const [area, setArea] = useState(""); // 면적 (㎡)
  const [annualRentLand, setAnnualRentLand] = useState(""); // 연 임대료 (만원)
  const [otherIncome, setOtherIncome] = useState(""); // 임대 외 소득
  const [isFarmer, setIsFarmer] = useState(false); // 농업인 여부
  const [holdingYears, setHoldingYears] = useState(""); // 보유 기간

  const LAND_TYPES = [
    { id: "나대지", label: "🏗️ 나대지", desc: "건물 없는 도시지역 토지", vatRequired: false, exemption: false },
    { id: "농지", label: "🌾 농지", desc: "농업진흥지역 내 전·답", vatRequired: false, exemption: true },
    { id: "임야", label: "🌲 임야", desc: "산지·산림", vatRequired: false, exemption: true },
    { id: "대지", label: "🏢 대지", desc: "건축물 부지", vatRequired: false, exemption: false },
  ];

  const selectedType = LAND_TYPES.find(t => t.id === landType);
  const pub = Number(publicPrice) || 0;
  const areaVal = Number(area) || 0;
  const rent = Number(annualRentLand) || 0;
  const other = Number(otherIncome) || 0;
  const holding = Number(holdingYears) || 0;

  // 1. 종합소득세 계산
  const totalIncome = rent + other;
  const incomeTax = calcIncomeTaxCorrect(totalIncome);
  const localTax = Math.round(incomeTax * 0.1);
  const totalIncomeTax = incomeTax + localTax;

  // 2. 종합부동산세 계산 (토지분)
  // 나대지·잡종지: 5억 초과분에 종부세 (별도합산)
  // 농지·임야: 비과세 or 감면 대상
  const pubTotal = pub; // 공시지가 합계
  const JONGBU_THRESHOLD_NAJI = 50000; // 나대지 별도합산 5억
  const JONGBU_THRESHOLD_ETC = 50000; // 기타 5억 (단순화)

  let jongbuBase = 0;
  let jongbuRate = 0;
  let jongbuTax = 0;
  let jongbuNote = "";

  if (landType === "나대지" || landType === "대지") {
    // 별도합산토지: 공시가 80% × 공정시장가액비율 100%
    const jongbuFair = Math.round(pubTotal * 0.8);
    jongbuBase = Math.max(0, jongbuFair - JONGBU_THRESHOLD_NAJI);
    if (jongbuBase <= 20000) { jongbuRate = 0.005; }
    else if (jongbuBase <= 130000) { jongbuRate = 0.006; }
    else { jongbuRate = 0.007; }
    jongbuTax = jongbuBase > 0 ? Math.round(jongbuBase * jongbuRate) : 0;
    jongbuNote = "별도합산토지 (공시가 80% 기준, 5억 공제)";
  } else if (landType === "농지" || landType === "임야") {
    jongbuTax = 0;
    jongbuNote = isFarmer ? "✅ 농업인 직접 경작 시 종부세 비과세" : "농지·임야는 종부세 합산 제외 (분리과세)";
  }

  // 3. 재산세 (참고용 간이 계산)
  // 토지 재산세: 공시가 × 공정시장가액비율(70%) × 세율
  const propertyTaxBase = Math.round(pubTotal * 0.7);
  let propertyTaxRate = 0.002; // 나대지 0.2%
  if (landType === "농지") propertyTaxRate = 0.007; // 농지 0.07% (실제 더 복잡)
  else if (landType === "임야") propertyTaxRate = 0.007;
  else if (landType === "대지") propertyTaxRate = 0.002;
  const propertyTax = pubTotal > 0 ? Math.round(propertyTaxBase * propertyTaxRate) : 0;

  // 4. 농지감면 여부
  const hasExemption = selectedType?.exemption && isFarmer;
  const exemptionRate = hasExemption ? 0.1 : 0; // 농업인 자경: 종소세 100% 감면 (단순화)
  const finalIncomeTax = hasExemption ? 0 : totalIncomeTax;
  const exemptionNote = hasExemption ? "✅ 농지 직접 경작 감면 적용 (종소세 면제)" : "";

  // 5. 총 세금
  const totalTax = finalIncomeTax + jongbuTax + propertyTax;
  const afterTaxRent = rent - totalTax;

  // 6. 실효 수익률
  const yieldRate = pub > 0 ? ((rent / pub) * 100).toFixed(2) : null;
  const afterTaxYield = pub > 0 && afterTaxRent > 0 ? ((afterTaxRent / pub) * 100).toFixed(2) : null;

  const cardStyle = { background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 16px" };
  const labelStyle = { fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* 왼쪽: 입력 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 토지 유형 */}
          <div style={cardStyle}>
            <p style={labelStyle}>토지 유형</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {LAND_TYPES.map(lt => (
                <button key={lt.id} onClick={() => setLandType(lt.id)} style={{ padding: "10px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `2px solid ${landType === lt.id ? "#0d9488" : "#ebe9e3"}`, background: landType === lt.id ? "rgba(13,148,136,0.08)" : "transparent", color: landType === lt.id ? "#0d9488" : "#8a8a9a", textAlign: "left" }}>
                  <div>{lt.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: "#a0a0b0", marginTop: 2 }}>{lt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 기본 정보 */}
          <div style={cardStyle}>
            <p style={labelStyle}>토지 기본 정보</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "공시지가 합계 (만원)", val: publicPrice, set: setPublicPrice, ph: "예: 50000 (5억)" },
                { label: "면적 (㎡)", val: area, set: setArea, ph: "예: 330" },
                { label: "연 임대료 (만원)", val: annualRentLand, set: setAnnualRentLand, ph: "예: 1200" },
                { label: "임대 외 소득 (만원/년)", val: otherIncome, set: setOtherIncome, ph: "근로소득 등" },
                { label: "보유 기간 (년)", val: holdingYears, set: setHoldingYears, ph: "예: 5" },
              ].map(({ label, val, set, ph }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 600, marginBottom: 4 }}>{label}</p>
                  <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: "100%", padding: "9px 12px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}

              {(landType === "농지" || landType === "임야") && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(13,148,136,0.06)", borderRadius: 9, border: "1px solid rgba(13,148,136,0.2)", cursor: "pointer" }} onClick={() => setIsFarmer(!isFarmer)}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isFarmer ? "#0d9488" : "#d0d0d0"}`, background: isFarmer ? "#0d9488" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isFarmer && <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0d9488", margin: 0 }}>농업인 직접 경작</p>
                    <p style={{ fontSize: 11, color: "#8a8a9a", margin: 0 }}>자경 농지 종소세 감면 적용</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 세입자 연동 */}
          {landTenants.length > 0 && (
            <div style={cardStyle}>
              <p style={labelStyle}>등록된 토지 세입자</p>
              {landTenants.map(t => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f0efe9" }}>
                  <span style={{ fontSize: 13, color: "#1a2744" }}>{t.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0d9488" }}>{((t.rent||0)*12).toLocaleString()}만원/년</span>
                </div>
              ))}
              <button onClick={() => setAnnualRentLand(String(landTenants.reduce((s,t) => s+(t.rent||0)*12, 0)))} style={{ marginTop: 10, width: "100%", padding: "8px", borderRadius: 9, background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)", color: "#0d9488", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                ↑ 세입자 임대료 자동 입력
              </button>
            </div>
          )}
        </div>

        {/* 오른쪽: 결과 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 수익률 */}
          {pub > 0 && rent > 0 && (
            <div style={{ background: "rgba(13,148,136,0.06)", border: "1.5px solid rgba(13,148,136,0.25)", borderRadius: 14, padding: "18px 20px" }}>
              <p style={labelStyle}>임대 수익률</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 4 }}>세전 수익률</p>
                  <p style={{ fontSize: 26, fontWeight: 900, color: "#0d9488" }}>{yieldRate}%</p>
                  <p style={{ fontSize: 11, color: "#8a8a9a" }}>연 {rent.toLocaleString()}만원 ÷ 공시가</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 4 }}>세후 수익률</p>
                  <p style={{ fontSize: 26, fontWeight: 900, color: afterTaxRent > 0 ? "#0d9488" : C.rose }}>{afterTaxYield || "—"}%</p>
                  <p style={{ fontSize: 11, color: "#8a8a9a" }}>세금 차감 후 순수익</p>
                </div>
              </div>
            </div>
          )}

          {/* 세금 내역 */}
          <div style={cardStyle}>
            <p style={labelStyle}>세금 내역 추정</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  label: "종합소득세 + 지방소득세",
                  value: finalIncomeTax,
                  color: finalIncomeTax > 0 ? C.rose : C.emerald,
                  note: hasExemption ? exemptionNote : `실효세율 ${effectiveRate(incomeTax, totalIncome)}%`,
                },
                {
                  label: "종합부동산세 (토지분)",
                  value: jongbuTax,
                  color: jongbuTax > 0 ? C.amber : C.emerald,
                  note: jongbuNote,
                },
                {
                  label: "재산세 (참고용)",
                  value: propertyTax,
                  color: "#8a8a9a",
                  note: "공시가 × 70% × 세율 (간이 계산)",
                },
              ].map(({ label, value, color, note }) => (
                <div key={label} style={{ padding: "12px 0", borderBottom: "1px solid #f0efe9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, color: "#1a2744", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color }}>{value.toLocaleString()}만원</span>
                  </div>
                  {note && <p style={{ fontSize: 11, color: value === 0 ? C.emerald : "#8a8a9a" }}>{note}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* 총 세금 + 세후 수입 */}
          <div style={{ background: `linear-gradient(135deg, rgba(13,148,136,0.1), rgba(13,148,136,0.04))`, border: "1.5px solid rgba(13,148,136,0.25)", borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 6 }}>총 납부 세액 추정</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: C.rose }}>{totalTax.toLocaleString()}만원</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 6 }}>세후 임대 수입</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: afterTaxRent >= 0 ? "#0d9488" : C.rose }}>{afterTaxRent.toLocaleString()}만원</p>
              </div>
            </div>
            {pub > 0 && (
              <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 12, color: "#1a2744", fontWeight: 700, marginBottom: 2 }}>💡 보유 vs 매각 참고</p>
                <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.6 }}>
                  현재 공시가 {pub.toLocaleString()}만원 기준 세전 수익률 {yieldRate || "—"}% →
                  시중금리(연 4~5%)와 비교해 보유 가치를 판단하세요.
                  {holding > 5 && " 5년 이상 보유로 장기보유특별공제 대상일 수 있습니다."}
                </p>
              </div>
            )}
          </div>

          {/* 감면 안내 */}
          {(landType === "농지" || landType === "임야") && (
            <div style={{ background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.2)", borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#0d9488", marginBottom: 8 }}>🌿 농지·임야 주요 감면 제도</p>
              {[
                { title: "자경 농지 양도세 감면", desc: "8년 이상 직접 경작 시 양도세 100% (한도 2억)" },
                { title: "농지 취득세 감면", desc: "농업인의 농지 취득 시 50% 감면" },
                { title: "종부세 분리과세", desc: "농지·임야는 종부세 종합합산 배제" },
                { title: "임야 재산세 감면", desc: "보전산지 등 일부 임야 재산세 50% 감면" },
              ].map(({ title, desc }) => (
                <div key={title} style={{ padding: "7px 0", borderBottom: "1px solid rgba(13,148,136,0.1)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0d9488", marginBottom: 2 }}>✓ {title}</p>
                  <p style={{ fontSize: 11, color: "#8a8a9a" }}>{desc}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 12, padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.7 }}>⚠️ 본 시뮬레이션은 참고용 추정치입니다. 토지 세금은 용도·지목·지역·보유기간에 따라 복잡하게 달라집니다. 정확한 계산은 세무사 상담을 권장합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxContent() { const { tenants, repairs, ledger } = useApp(); const router = useRouter(); const [tab, setTab] = useState("income"); const [period, setPeriod] = useState("1h"); const [deductions, setDeductions] = useState({ insurance: "", repair: "", interest: "", depreciation: "", other: "" }); const [otherIncome, setOtherIncome] = useState(""); const [useDeemed, setUseDeemed] = useState(false); const currentYear = new Date().getFullYear(); const taxYear = currentYear - 1; const filingYear = currentYear; const setD = (k, v) => setDeductions((d) => ({ ...d, [k]: v })); const commercialTenants = tenants.filter((t) => t.p_type === "상가" || t.pType === "상가"); const allTenants = tenants; const monthlyTotal = allTenants.reduce((s, t) => s + (Number(t.rent) || 0), 0); const annualRent = monthlyTotal * 12; const totalDeductAmt = Object.values(deductions).reduce((s, v) => s + (Number(v) || 0), 0); const otherIncomeAmt = Number(otherIncome) || 0;
  // 필요경비 자동 집계: repairs + ledger
  const thisYearRepairs = (repairs||[]).filter(r => r.date?.startsWith(String(taxYear))).reduce((s, r) => s + (Number(r.cost) || 0), 0);
  const thisYearInterest = (ledger||[]).filter(l => l.type === "expense" && l.category === "이자비용" && l.date?.startsWith(String(taxYear))).reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const thisYearInsurance = (ledger||[]).filter(l => l.type === "expense" && l.category === "보험료" && l.date?.startsWith(String(taxYear))).reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const autoFillAll = () => setDeductions(d => ({ ...d, repair: String(thisYearRepairs), interest: String(thisYearInterest), insurance: String(thisYearInsurance) }));
  // 간주임대료: 주택 3채 이상 + 보증금 합계 3억 초과분 × 2.9% × 60%
  const housingTenants = allTenants.filter(t => (t.p_type || t.pType) === "주거");
  const housingDepositSum = housingTenants.reduce((s, t) => s + (Number(t.deposit || t.dep) || 0), 0);
  const deemedBase = Math.max(0, housingDepositSum - 30000); // 만원 단위, 3억=30000만원
  const deemedRentAmt = useDeemed && housingTenants.length >= 3 ? Math.round(deemedBase * 0.029 * 0.6) : 0;
  const taxableIncome = Math.max(0, annualRent + otherIncomeAmt + deemedRentAmt - totalDeductAmt); const incomeTax = calcIncomeTaxCorrect(taxableIncome); const localTax = Math.round(incomeTax * 0.1); const totalTax = incomeTax + localTax; const afterTax = annualRent - totalTax; const periodMonths = 6; const vatTenants = commercialTenants; const vatSupply = vatTenants.reduce((s, t) => s + (Number(t.rent) || 0), 0) * periodMonths; const vatAmount = Math.round(vatSupply * 0.1); const eRate = effectiveRate(incomeTax, annualRent); const numStyle = (v, color = C.text) => ({ fontSize: 22, fontWeight: 800, color }); const card = (label, value, color, sub) => ( <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}> <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>{label}</p> <p style={numStyle(value, color)}>{value}</p> {sub && <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 4 }}>{sub}</p>} </div> ); const inp = (key, ph) => ( <input type="number" value={deductions[key]} onChange={(e) => setD(key, e.target.value)} placeholder={ph} style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} /> ); const lbl = (txt, hint) => ( <div style={{ marginBottom: 7 }}> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase" }}>{txt}</p> {hint && <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{hint}</p>} </div> ); const bracketLabel = (income) => { if (income <= 1400) return "6%"; if (income <= 5000) return "15%"; if (income <= 8800) return "24%"; if (income <= 15000) return "35%"; if (income <= 30000) return "38%"; if (income <= 50000) return "40%"; return "42%"; }; return ( <div className="page-in page-padding" style={{ padding: "36px 40px", maxWidth: 980 }}> <div style={{ marginBottom: 22 }}> <SectionLabel>TAX SIMULATION</SectionLabel> <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>세금 시뮬레이터</h1> <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>{filingYear}년 신고 기준 ({taxYear} 귀속) · 참고용 추정치 (실제 세무사 상담 권장)</p> </div> {tenants.length > 0 && ( <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 22 }}> {[ { icon: "🏠", label: "주거 임대", count: tenants.filter((t) => (t.p_type || t.pType) === "주거").length, color: "#1a2744", bg: "rgba(26,39,68,0.05)", tags: ["종합소득세", "주택임대소득세", "건보료 추가부과"], tip: "연 2천만원 이하 분리과세 선택 가능" }, { icon: "🏪", label: "상가 임대", count: tenants.filter((t) => (t.p_type || t.pType) === "상가").length, color: "#e8960a", bg: "rgba(232,150,10,0.06)", tags: ["종합소득세", "부가가치세(10%)", "사업자 등록 필수"], tip: "간이과세 vs 일반과세 선택에 따라 세부담 차이" }, { icon: "🌱", label: "토지 임대", count: tenants.filter((t) => (t.p_type || t.pType) === "토지").length, color: "#0d9488", bg: "rgba(13,148,136,0.05)", tags: ["종합소득세", "종합부동산세 검토", "농지/임야 감면 확인"], tip: "토지 용도·지목에 따라 감면 혜택 다름" }, ].map(({ icon, label, count, color, bg, tags, tip }) => ( <div key={label} style={{ background: bg, border: `1px solid ${color}20`, borderRadius: 13, padding: "14px 16px" }}> <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}> <span style={{ fontSize: 20 }}>{icon}</span> <div> <p style={{ fontSize: 12, fontWeight: 800, color }}>{label}</p> <p style={{ fontSize: 10, color: "#8a8a9a" }}>{count}건 등록</p> </div> </div> <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}> {tags.map((t) => ( <span key={t} style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: "2px 8px", borderRadius: 5, display: "inline-block", width: "fit-content" }}>{t}</span> ))} </div> <p style={{ fontSize: 10, color: "#8a8a9a", lineHeight: 1.5, borderTop: `1px solid ${color}15`, paddingTop: 8 }}>💡 {tip}</p> </div> ))} </div> )} <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}> {[{ k: "income", l: "📊 종합소득세" }, { k: "vat", l: "🧾 부가가치세" }, { k: "land", l: "🌱 토지 세금" }, { k: "summary", l: "📋 세금 요약" }, { k: "invoice", l: "📄 세금계산서 발행" }].map((t) => ( <button key={t.k} onClick={() => { if (t.k === "invoice") { router.push("/dashboard/premium/tax-invoice"); } else { setTab(t.k); } }} style={{ padding: "10px 20px", borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `2px solid ${tab === t.k ? (t.k === "land" ? "#0d9488" : C.indigo) : t.k === "invoice" ? "#c9920a" : "#ebe9e3"}`, background: tab === t.k ? (t.k === "land" ? "rgba(13,148,136,0.12)" : C.indigo + "18") : t.k === "invoice" ? "rgba(201,146,10,0.06)" : "transparent", color: tab === t.k ? (t.k === "land" ? "#0d9488" : C.indigo) : t.k === "invoice" ? "#c9920a" : C.muted }}> {t.l} {t.k === "invoice" && <span style={{ fontSize: 10, fontWeight: 800, background: "#c9920a", color: "#fff", padding: "1px 6px", borderRadius: 10, marginLeft: 6 }}>PRO</span>} </button> ))} </div>
  {tab === "income" && ( <div className="tax-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}> <div style={{ display: "flex", flexDirection: "column", gap: 16 }}> <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}> <p style={{ fontSize: 11, color: "#1a2744", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 14 }}>임대 수입 (자동 계산)</p> {allTenants.length === 0 ? ( <p style={{ fontSize: 13, color: "#8a8a9a" }}>등록된 세입자가 없습니다</p> ) : allTenants.map((t) => ( <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #ebe9e3" }}> <span style={{ fontSize: 13, color: "#1a2744" }}>{t.name} <span style={{ fontSize: 11, color: "#8a8a9a" }}>({t.addr})</span></span> <span style={{ fontSize: 13, fontWeight: 700, color: "#0fa573" }}>{(t.rent * 12).toLocaleString()}만원/년</span> </div> ))} <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}> <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>연간 임대 수입 합계</span> <span style={{ fontSize: 15, fontWeight: 800, color: "#1a2744" }}>{annualRent.toLocaleString()}만원</span> </div> </div> <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}> <p style={{ fontSize: 11, color: "#e8960a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 12 }}>임대 외 소득 (만원/년)</p> <input type="number" value={otherIncome} onChange={(e) => setOtherIncome(e.target.value)} placeholder="근로소득, 사업소득 등" style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />{housingTenants.length >= 3 && (<div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(232,150,10,0.06)", border: "1px solid rgba(232,150,10,0.2)", borderRadius: 9 }}><label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}><input type="checkbox" checked={useDeemed} onChange={(e) => setUseDeemed(e.target.checked)} style={{ marginTop: 2 }} /><div style={{ flex: 1 }}><p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", marginBottom: 3 }}>간주임대료 포함</p><p style={{ fontSize: 10, color: "#8a8a9a", lineHeight: 1.6 }}>주택 3채 이상 + 보증금 3억 초과 시 적용. (보증금 합계 - 3억) × 2.9% × 60% ≈ {deemedRentAmt.toLocaleString()}만원/년</p></div></label></div>)} </div> <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><p style={{ fontSize: 11, color: "#0fa573", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase" }}>필요경비 공제 (만원/년)</p>{(thisYearRepairs + thisYearInterest + thisYearInsurance) > 0 && <button onClick={autoFillAll} style={{ fontSize: 10, fontWeight: 700, color: "#5b4fcf", background: "rgba(91,79,207,0.1)", border: "1px solid rgba(91,79,207,0.3)", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>🤖 {taxYear}년 자동 채움</button>}</div> <div style={{ display: "flex", flexDirection: "column", gap: 11 }}> {[ { k: "insurance", label: "보험료", hint: "화재보험 등" }, { k: "repair", label: "수선비", hint: "수리·보수비용" }, { k: "interest", label: "이자 비용", hint: "대출이자" }, { k: "depreciation", label: "감가상각비", hint: "건물 감가상각" }, { k: "other", label: "기타 경비", hint: "관리비 등" }, ].map(({ k, label, hint }) => ( <div key={k}>{lbl(label, hint)}{inp(k, "0")}</div> ))} <div style={{ borderTop: "1px solid #ebe9e3", paddingTop: 10, display: "flex", justifyContent: "space-between" }}> <span style={{ fontSize: 13, color: "#8a8a9a" }}>총 공제액</span> <span style={{ fontSize: 14, fontWeight: 700, color: "#0fa573" }}>{totalDeductAmt.toLocaleString()}만원</span> </div> </div> </div> </div> <div style={{ display: "flex", flexDirection: "column", gap: 14 }}> <div className="tax-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}> {card("과세표준", taxableIncome.toLocaleString() + "만원", C.text, "임대+기타소득 - 공제")} {card("적용 세율 구간", bracketLabel(taxableIncome), C.amber, "한계세율")} {card("종합소득세", incomeTax.toLocaleString() + "만원", C.rose, `실효세율 ${eRate}%`)} {card("지방소득세", localTax.toLocaleString() + "만원", C.amber, "소득세의 10%")} </div> <div style={{ background: `linear-gradient(135deg,${C.rose}18,${C.purple}18)`, border: `1px solid ${C.rose}30`, borderRadius: 16, padding: "22px" }}> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>총 납부 세액 추정</p> <p style={{ fontSize: 32, fontWeight: 900, color: "#e8445a" }}>{totalTax.toLocaleString()}만원</p> <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 6 }}>세후 임대 수입: <span style={{ color: "#0fa573", fontWeight: 700 }}>{afterTax.toLocaleString()}만원/년</span></p> </div> {totalTax > 300 && ( <div onClick={() => router.push("/dashboard/pricing")} style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.08),rgba(124,58,237,0.05))", border: "1.5px solid rgba(79,70,229,0.2)", borderRadius: 14, padding: "14px 16px", cursor: "pointer" }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> <div> <p style={{ fontSize: 12, fontWeight: 800, color: "#4f46e5", marginBottom: 3 }}>💡 절세 전략이 필요하신가요?</p> <p style={{ fontSize: 11, color: "#8a8a9a" }}>PDF 리포트 · 세금계산서 발행 · 수리비 경비 처리</p> </div> <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "#4f46e5", padding: "4px 10px", borderRadius: 20, flexShrink: 0, marginLeft: 10 }}>플러스 →</span> </div> </div> )} <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>소득세 세율 구간</p> {[ { range: "~1,400만원", rate: 6, limit: 1400 }, { range: "~5,000만원", rate: 15, limit: 5000 }, { range: "~8,800만원", rate: 24, limit: 8800 }, { range: "~1.5억원", rate: 35, limit: 15000 }, { range: "~3억원", rate: 38, limit: 30000 }, { range: "~5억원", rate: 40, limit: 50000 }, { range: "5억원 초과", rate: 42, limit: Infinity }, ].map(({ range, rate, limit }) => { const isActive = taxableIncome > 0 && ( limit === 1400 ? taxableIncome <= 1400 : limit === 5000 ? taxableIncome > 1400 && taxableIncome <= 5000 : limit === 8800 ? taxableIncome > 5000 && taxableIncome <= 8800 : limit === 15000 ? taxableIncome > 8800 && taxableIncome <= 15000 : limit === 30000 ? taxableIncome > 15000 && taxableIncome <= 30000 : limit === 50000 ? taxableIncome > 30000 && taxableIncome <= 50000 : taxableIncome > 50000 ); return ( <div key={range} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #ebe9e3" }}> <div style={{ width: 8, height: 8, borderRadius: 2, background: isActive ? C.rose : "#ebe9e3", flexShrink: 0 }} /> <span style={{ fontSize: 12, color: isActive ? C.text : C.muted, flex: 1, fontWeight: isActive ? 700 : 400 }}>{range}</span> <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? C.rose : C.muted }}>{rate}%</span> </div> ); })} </div> <div style={{ background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 16px" }}> <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7 }}>⚠️ 본 시뮬레이션은 <strong style={{ color: "#1a2744" }}>참고용 추정치</strong>입니다.<br />주택 수, 기준시가, 분리과세 여부 등에 따라 실제 세액이 달라질 수 있습니다.<br />정확한 세금 신고는 세무사 상담을 권장합니다.</p> </div> </div> </div> )}
  {tab === "vat" && ( <div style={{ maxWidth: 640 }}> <div style={{ display: "flex", gap: 8, marginBottom: 20 }}> {[{ k: "1h", l: "1기 (1~6월)" }, { k: "2h", l: "2기 (7~12월)" }].map((p) => ( <button key={p.k} onClick={() => setPeriod(p.k)} style={{ padding: "7px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${period === p.k ? C.indigo : "#ebe9e3"}`, background: period === p.k ? C.indigo + "20" : "transparent", color: period === p.k ? C.indigo : C.muted }}>{p.l}</button> ))} </div> <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "22px", marginBottom: 16 }}> <p style={{ fontSize: 11, color: "#e8960a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 14 }}>과세 대상 (상가 임대)</p> {vatTenants.length === 0 ? ( <p style={{ fontSize: 13, color: "#8a8a9a" }}>등록된 상가 세입자가 없습니다</p> ) : vatTenants.map((t) => ( <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #ebe9e3" }}> <span style={{ fontSize: 13, color: "#1a2744" }}>{t.name} <span style={{ fontSize: 11, color: "#8a8a9a" }}>({t.addr})</span></span> <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{(t.rent * 6).toLocaleString()}만원 ({period === "1h" ? "1기" : "2기"})</span> </div> ))} </div> <div className="dash-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}> {card("공급가액", vatSupply.toLocaleString() + "만원", C.text, "6개월 임대료 합계")} {card("부가세율", "10%", C.amber, "일반과세자")} {card("납부 부가세", vatAmount.toLocaleString() + "만원", C.rose, "공급가액 × 10%")} </div> <div style={{ background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 16px" }}> <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7 }}>📌 <strong style={{ color: "#1a2744" }}>부가세 신고 일정</strong><br />1기 확정신고: 7월 25일까지 · 2기 확정신고: 다음해 1월 25일까지<br />연 매출 4,800만원 미만은 간이과세자 적용 가능 (세무사 확인 필요)</p> </div> </div> )}
  {/* ✅ 토지 세금 탭 */}
  {tab === "land" && <LandTaxTab tenants={tenants} />}
  {tab === "summary" && ( <div style={{ maxWidth: 640 }}> <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}> <div style={{ padding: "18px 22px", borderBottom: "1px solid #ebe9e3", background: "#f8f7f4" }}> <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>연간 세금 요약</p> </div> {[ { l: "연간 임대 수입", v: annualRent.toLocaleString() + "만원", c: C.emerald }, { l: "필요경비 공제", v: "- " + totalDeductAmt.toLocaleString() + "만원", c: C.amber }, { l: "과세표준", v: taxableIncome.toLocaleString() + "만원", c: C.text }, { l: "종합소득세", v: "- " + incomeTax.toLocaleString() + "만원", c: C.rose }, { l: "지방소득세", v: "- " + localTax.toLocaleString() + "만원", c: C.rose }, { l: "부가가치세 (연간)", v: "- " + (vatAmount * 2).toLocaleString() + "만원", c: C.rose }, ].map(({ l, v, c }) => ( <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1px solid #ebe9e3" }}> <span style={{ fontSize: 13, color: "#8a8a9a" }}>{l}</span> <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span> </div> ))} <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 22px", background: "#f8f7f4" }}> <span style={{ fontSize: 14, fontWeight: 800, color: "#1a2744" }}>실수령 추정</span> <span style={{ fontSize: 18, fontWeight: 900, color: "#0fa573" }}>{(annualRent - totalTax - vatAmount * 2).toLocaleString()}만원</span> </div> </div> <div style={{ background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 16px" }}> <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7 }}>⚠️ 본 요약은 <strong style={{ color: "#1a2744" }}>단순 추정치</strong>이며 실제 세액과 다를 수 있습니다.<br />종합소득세 신고: 매년 5월 / 부가세 신고: 1월·7월</p> </div> <div style={{ background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(15,165,115,0.04))", border: "1px solid #e0ede8", borderRadius: 14, padding: "18px 20px" }}> <p style={{ fontSize: 12, fontWeight: 800, color: "#1a2744", marginBottom: 12 }}>📌 세금 신고 전 체크리스트</p> <div style={{ display: "flex", flexDirection: "column", gap: 8 }}> {[ { icon: "💰", text: "수금 현황 확인", sub: "미납 세입자 없는지 최종 점검", page: "/dashboard/payments" }, { icon: "📋", text: "리포트 출력", sub: "연간 수입·지출 내역 PDF 저장", page: "/dashboard/reports" }, { icon: "📨", text: "내용증명 발송", sub: "미납 세입자 법적 대응 준비", page: "/dashboard/certified" }, ].map(({ icon, text, sub, page }) => ( <div key={text} onClick={() => router.push(page)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fff", borderRadius: 10, border: "1px solid #ebe9e3", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1a2744"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ebe9e3"; }}> <span style={{ fontSize: 18 }}>{icon}</span> <div style={{ flex: 1 }}> <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>{text}</p> <p style={{ fontSize: 10, color: "#8a8a9a" }}>{sub}</p> </div> <span style={{ fontSize: 12, color: "#a0a0b0" }}>→</span> </div> ))} </div> </div> </div> )}
</div> ); }
