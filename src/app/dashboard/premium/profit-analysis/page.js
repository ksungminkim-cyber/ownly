"use client"; import { useState, useMemo } from "react"; import { useRouter } from "next/navigation"; import { SectionLabel } from "../../../../components/shared"; import { useApp } from "../../../../context/AppContext"; import PlanGate from "../../../../components/PlanGate";

export default function ProfitAnalysisPage() {
  return <PlanGate feature="profit_analysis" requiredPlan="pro"><ProfitAnalysisContent /></PlanGate>;
}

function ProfitAnalysisContent() {
  const router = useRouter();
  const { tenants } = useApp();
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [form, setForm] = useState({
    buyPrice: "",        // 취득가 (만원)
    currentPrice: "",   // 현재 추정 매각가 (만원)
    loanBalance: "",    // 대출 잔액 (만원)
    holdingYears: "",   // 보유 기간 (년)
    isMain: false,      // 1세대 1주택 여부
    annualRent: "",     // 연간 임대 수입 (만원, 자동 계산 가능)
    annualCost: "",     // 연간 비용 (수리비 등, 만원)
    expectedRentYears: "5", // 향후 임대 예정 기간
  });

  // 선택된 세입자로 자동 채우기
  const fillFromTenant = (t) => {
    setSelectedTenant(t);
    setForm(f => ({
      ...f,
      annualRent: String(Math.round((t.rent || 0) * 12)),
      buyPrice: f.buyPrice || String(Math.round((t.dep || 0) / 10000 * 100) || ""),
    }));
  };

  const calc = useMemo(() => {
    const buy = Number(form.buyPrice) || 0;
    const cur = Number(form.currentPrice) || 0;
    const loan = Number(form.loanBalance) || 0;
    const years = Number(form.holdingYears) || 1;
    const rentYears = Number(form.expectedRentYears) || 5;
    const annualRent = Number(form.annualRent) || 0;
    const annualCost = Number(form.annualCost) || 0;
    if (!buy || !cur) return null;

    // ── 양도세 계산 (간이) ──
    const gain = cur - buy; // 양도차익
    let taxRate = 0;
    if (gain <= 0) taxRate = 0;
    else if (form.isMain && years >= 2) taxRate = 0; // 1세대1주택 비과세 (간이)
    else if (gain <= 1400) taxRate = 0.15;
    else if (gain <= 5000) taxRate = 0.24;
    else if (gain <= 8800) taxRate = 0.35;
    else if (gain <= 15000) taxRate = 0.38;
    else if (gain <= 30000) taxRate = 0.40;
    else taxRate = 0.42;

    const transferTax = gain > 0 ? Math.round(gain * taxRate) : 0;
    const netSaleGain = gain - transferTax; // 세후 양도차익
    const netSaleProceeds = cur - loan - transferTax; // 실수령액 (대출 상환 후)

    // ── 계속 임대 시 수익 ──
    const annualNet = annualRent - annualCost;
    const rentTotalNet = annualNet * rentYears; // 임대 순수익 합계
    const futureValue = cur * Math.pow(1.03, rentYears); // 3% 상승 가정
    const futureGain = futureValue - cur;
    const futureGainAfterTax = futureGain * (1 - taxRate);
    const holdTotalGain = rentTotalNet + futureGainAfterTax; // 계속보유 총수익 추정

    // ── 수익률 비교 ──
    const saleROI = buy > 0 ? ((netSaleGain / buy) * 100).toFixed(1) : 0;
    const rentROI = buy > 0 && rentYears > 0 ? ((annualNet / buy) * 100).toFixed(2) : 0;

    return { gain, transferTax, taxRate, netSaleGain, netSaleProceeds, annualNet, rentTotalNet, holdTotalGain, saleROI, rentROI, cur, buy, loan };
  }, [form]);

  const recommendation = useMemo(() => {
    if (!calc) return null;
    const saleScore = calc.netSaleProceeds;
    const holdScore = calc.holdTotalGain;
    if (holdScore > saleScore * 1.2) return { action: "보유 추천", reason: "향후 임대 수익과 자산 가치 상승 합산이 즉시 매각보다 유리합니다.", color: "#0fa573", icon: "🏠" };
    if (saleScore > holdScore * 1.2) return { action: "매각 추천", reason: "양도세 후 실수령액이 향후 임대 기대 수익보다 높습니다.", color: "#3b5bdb", icon: "💰" };
    return { action: "상황에 따라 판단", reason: "매각과 보유의 기대 수익이 비슷합니다. 유동성 필요 여부와 세금 상황을 고려하세요.", color: "#e8960a", icon: "⚖️" };
  }, [calc]);

  const F = ({ label, name, placeholder, unit = "만원", icon }) => (
    <div>
      <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>{label}</p>
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>{icon}</span>}
        <input type="number" value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: `11px 13px 11px ${icon ? "36px" : "13px"}`, border: "1px solid #ebe9e3", borderRadius: 10, fontSize: 13, color: "#1a2744", background: "#f8f7f4", boxSizing: "border-box" }} />
        {unit && <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#8a8a9a" }}>{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="page-in page-padding" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>SELL VS HOLD ANALYSIS</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>팔 것인가 vs 계속 임대할 것인가</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>양도세 계산 · 임대 수익 분석 · 의사결정 지원 — 프로 플랜 전용</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* 입력 패널 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 세입자 연결 */}
          {tenants.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "18px" }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#8a8a9a", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>물건 선택 (선택)</p>
              <select onChange={e => { const t = tenants.find(t => t.id === e.target.value); if (t) fillFromTenant(t); }} defaultValue="" style={{ width: "100%", padding: "10px 13px", border: "1px solid #ebe9e3", borderRadius: 10, fontSize: 13, color: "#1a2744", background: "#f8f7f4" }}>
                <option value="">직접 입력</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name} — {t.addr}</option>)}
              </select>
            </div>
          )}

          {/* 매각 정보 */}
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "18px" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#3b5bdb", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>💰 매각 정보</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <F label="취득가 (매입가)" name="buyPrice" placeholder="30000" icon="🏷️" />
              <F label="현재 추정 매각가" name="currentPrice" placeholder="45000" icon="📈" />
              <F label="대출 잔액" name="loanBalance" placeholder="20000" icon="🏦" />
              <F label="보유 기간" name="holdingYears" placeholder="3" unit="년" icon="📅" />
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 0" }}>
                <div onClick={() => setForm(f => ({ ...f, isMain: !f.isMain }))} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form.isMain ? "#0fa573" : "#ebe9e3"}`, background: form.isMain ? "#0fa573" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {form.isMain && <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", margin: 0 }}>1세대 1주택 (2년 이상 보유)</p>
                  <p style={{ fontSize: 11, color: "#8a8a9a", margin: "2px 0 0" }}>비과세 요건 충족 시 양도세 없음</p>
                </div>
              </label>
            </div>
          </div>

          {/* 임대 정보 */}
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "18px" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#0fa573", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>🏠 계속 임대 정보</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <F label="연간 임대 수입" name="annualRent" placeholder="1440" icon="💰" />
              <F label="연간 비용 (수리비 등)" name="annualCost" placeholder="200" icon="🔧" />
              <div>
                <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>향후 임대 예정 기간</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {["3", "5", "10"].map(y => (
                    <button key={y} onClick={() => setForm(f => ({ ...f, expectedRentYears: y }))} style={{ flex: 1, padding: "9px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${form.expectedRentYears === y ? "#0fa573" : "#ebe9e3"}`, background: form.expectedRentYears === y ? "rgba(15,165,115,0.1)" : "transparent", color: form.expectedRentYears === y ? "#0fa573" : "#8a8a9a" }}>{y}년</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 결과 패널 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!calc ? (
            <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1a2744", marginBottom: 8 }}>취득가와 현재 매각가를 입력하세요</p>
              <p style={{ fontSize: 13, color: "#8a8a9a" }}>양도세 추정과 임대 수익 비교 분석이 자동으로 계산됩니다</p>
            </div>
          ) : (
            <>
              {/* AI 추천 */}
              {recommendation && (
                <div style={{ background: recommendation.color + "10", border: `1.5px solid ${recommendation.color}30`, borderRadius: 16, padding: "18px 20px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 28 }}>{recommendation.icon}</span>
                    <div>
                      <p style={{ fontSize: 11, color: recommendation.color, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 3px" }}>온리 분석 결과</p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: recommendation.color, margin: 0 }}>{recommendation.action}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.7, margin: 0 }}>{recommendation.reason}</p>
                  <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 8, margin: 0 }}>※ 간이 계산 결과이며, 정확한 세무 판단은 세무사에게 문의하세요</p>
                </div>
              )}

              {/* 매각 분석 */}
              <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "18px 20px" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#3b5bdb", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>💰 즉시 매각 시</p>
                {[
                  { l: "매각가", v: `${calc.cur.toLocaleString()}만원`, c: "#1a2744" },
                  { l: "양도차익", v: `${calc.gain > 0 ? "+" : ""}${calc.gain.toLocaleString()}만원`, c: calc.gain > 0 ? "#e8445a" : "#0fa573" },
                  { l: `양도세 추정 (${(calc.taxRate * 100).toFixed(0)}%)`, v: `-${calc.transferTax.toLocaleString()}만원`, c: "#e8445a" },
                  { l: "대출 상환", v: `-${calc.loan.toLocaleString()}만원`, c: "#8a8a9a" },
                  { l: "세후 실수령액", v: `${calc.netSaleProceeds.toLocaleString()}만원`, c: "#3b5bdb", bold: true },
                  { l: "투자 수익률", v: `${calc.saleROI}%`, c: Number(calc.saleROI) > 0 ? "#0fa573" : "#e8445a", bold: true },
                ].map(row => (
                  <div key={row.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0efe9" }}>
                    <span style={{ fontSize: 13, color: "#8a8a9a" }}>{row.l}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 800 : 600, color: row.c }}>{row.v}</span>
                  </div>
                ))}
              </div>

              {/* 계속 임대 분석 */}
              <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "18px 20px" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#0fa573", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>🏠 {form.expectedRentYears}년 계속 임대 시</p>
                {[
                  { l: "연간 임대 순수익", v: `${calc.annualNet.toLocaleString()}만원/년`, c: "#1a2744" },
                  { l: `${form.expectedRentYears}년 임대 수익 합계`, v: `${calc.rentTotalNet.toLocaleString()}만원`, c: "#0fa573" },
                  { l: "자산가치 상승 추정 (3%/년)", v: `+${Math.round((calc.cur * Math.pow(1.03, Number(form.expectedRentYears)) - calc.cur)).toLocaleString()}만원`, c: "#3b5bdb" },
                  { l: "총 기대 수익 (임대+시세차익)", v: `${Math.round(calc.holdTotalGain).toLocaleString()}만원`, c: "#0fa573", bold: true },
                  { l: "연 임대 수익률", v: `${calc.rentROI}%`, c: Number(calc.rentROI) > 4 ? "#0fa573" : "#e8960a", bold: true },
                ].map(row => (
                  <div key={row.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0efe9" }}>
                    <span style={{ fontSize: 13, color: "#8a8a9a" }}>{row.l}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 800 : 600, color: row.c }}>{row.v}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(26,39,68,0.04)", borderRadius: 12, padding: "12px 16px" }}>
                <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.7, margin: 0 }}>
                  ※ 양도세는 간이 세율 적용 추정값이며, 실제 세액은 다를 수 있습니다.<br/>
                  ※ 자산가치 상승은 연 3% 가정 — 지역에 따라 다를 수 있습니다.<br/>
                  ※ 세무사 상담을 통한 정확한 계산을 권장합니다.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
