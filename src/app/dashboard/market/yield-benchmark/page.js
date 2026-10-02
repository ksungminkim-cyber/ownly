// src/app/dashboard/market/yield-benchmark/page.js
"use client"; import { useState, useCallback } from "react"; import { useApp } from "../../../../context/AppContext"; import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"; import PlanGate from "../../../../components/PlanGate";

// 수익률 벤치마크 — Plus 플랜 전용
// 지역 평균 수익률은 국토부 실거래(최근 6개월 매매 평당가 대비 임대료)로만 계산한다.
// 2026-10 이전에는 구별 "한국부동산원 R-ONE 임대수익률"과 분기 추이, 정규분포로 만든 "수익률 분포(추정)"를 코드에 직접 적어 표시했으나
// R-ONE 은 구별 아파트 임대수익률을 공표하지 않아 출처를 댈 수 없는 수치였다 → 제거. 표본이 없으면 "표본 부족"으로 표시한다.
const LAWD_MAP = { "서울 강남구": "11680", "서울 서초구": "11650", "서울 송파구": "11710", "서울 마포구": "11440", "서울 용산구": "11170", "서울 성동구": "11200", "서울 강동구": "11740", "서울 노원구": "11350", "서울 영등포구": "11560", "서울 관악구": "11620", "경기 성남시": "41130", "경기 수원시": "41110", "경기 용인시": "41460", "경기 고양시": "41280", }; function getLastNMonths(n) { const months = []; const now = new Date(); for (let i = n-1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth()-i, 1); months.push(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}`); } return months; }

export default function YieldBenchmarkPage() {
  return <PlanGate feature="roi"><YieldBenchmarkContent /></PlanGate>;
}

function YieldBenchmarkContent() {
  const { tenants } = useApp();
  const [region, setRegion] = useState("서울 강남구");
  const [myMonthlyRent, setMyMonthlyRent] = useState("");
  const [myPurchasePrice, setMyPurchasePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // ✅ 대출 관련 입력
  const [loanAmount, setLoanAmount] = useState("");       // 대출금액 (억원)
  const [loanRate, setLoanRate] = useState("");           // 대출금리 (%)

  const autoRent = tenants.reduce((s, t) => s + (t.rent || 0), 0);

  // ✅ 대출이자 계산
  const loanAmountWon = (parseFloat(loanAmount) || 0) * 100000000; // 원
  const loanRatePct = parseFloat(loanRate) || 0;
  const annualInterest = loanAmountWon > 0 && loanRatePct > 0
    ? Math.round((loanAmountWon * loanRatePct / 100) / 10000) // 만원
    : 0;

  const fetchBenchmark = useCallback(async () => {
    setLoading(true);
    const months = getLastNMonths(6);
    const lawdCd = LAWD_MAP[region];
    let kabRef = { apt: null, officetel: null, sampleSize: null }; // 실거래 표본이 없으면 null (폴백 수치 없음)

    // MOLIT 실거래로 임대수익률 직접 산출
    try {
      const realtimeRes = await fetch("/api/market/regional-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawdCd, propTypes: ["apt", "officetel"] }),
      });
      if (realtimeRes.ok) {
        const realtime = await realtimeRes.json();
        const aptYield = realtime?.types?.apt?.yieldRate;
        const offiYield = realtime?.types?.officetel?.yieldRate;
        kabRef = {
          apt: aptYield > 0 ? aptYield : null,
          officetel: offiYield > 0 ? offiYield : null,
          sampleSize: realtime?.types?.apt?.sampleSize,
        };
      }
    } catch (e) {
      console.warn("지역 실거래 통계 조회 실패:", e.message);
    }

    let allRents = [];
    try {
      await Promise.all(months.map(async (ym) => {
        const res = await fetch(`/api/market/molit?type=apt_rent&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`);
        const d = await res.json();
        if (d.items) { d.items.filter(i => parseInt(String(i.monthlyRent||"0").replace(/,/g,""), 10) > 0).forEach(i => { allRents.push({ monthly: parseInt(String(i.monthlyRent||"0").replace(/,/g,""), 10), deposit: parseInt((i.deposit||"0").replace(/,/g,"")), area: parseFloat(i.excluUseAr||"0"), apt: i.aptNm||"" }); }); }
      }));
      const rents = allRents.map(r => r.monthly).filter(v => v > 0).sort((a,b) => a-b);
      const medianRent = rents[Math.floor(rents.length/2)] || 0;
      const avgRent = rents.length > 0 ? Math.round(rents.reduce((s,v) => s+v, 0)/rents.length) : 0;
      const p25Rent = rents[Math.floor(rents.length*0.25)] || 0;
      const p75Rent = rents[Math.floor(rents.length*0.75)] || 0;
      const areaGroups = { "~50㎡": allRents.filter(r => r.area<50).map(r => r.monthly), "50~66㎡": allRents.filter(r => r.area>=50&&r.area<66).map(r => r.monthly), "66~84㎡": allRents.filter(r => r.area>=66&&r.area<84).map(r => r.monthly), "84~102㎡": allRents.filter(r => r.area>=84&&r.area<102).map(r => r.monthly), "102㎡~": allRents.filter(r => r.area>=102).map(r => r.monthly) };
      const areaData = Object.entries(areaGroups).filter(([,v]) => v.length > 0).map(([range,vals]) => ({ range, avg: Math.round(vals.reduce((s,v) => s+v,0)/vals.length), count: vals.length }));
      const myRent = parseFloat(myMonthlyRent || autoRent || "0");
      const myPrice = parseFloat(myPurchasePrice||"0")*100000000;
      const myYield = myPrice > 0 ? ((myRent*10000*12)/myPrice*100).toFixed(2) : null;
      const marketAvg = kabRef.apt;
      const diff = myYield && marketAvg ? (parseFloat(myYield)-marketAvg).toFixed(2) : null;

      // ✅ 레버리지 순수익률 계산
      const annualRentTotal = myRent * 12; // 만원
      const myPriceMan = parseFloat(myPurchasePrice||"0") * 10000; // 억→만원
      const loanAmountMan = parseFloat(loanAmount||"0") * 10000; // 억→만원
      const selfCapital = Math.max(0, myPriceMan - loanAmountMan); // 자기자본 (만원)
      const netAnnualIncome = annualRentTotal - annualInterest; // 순수익 (이자차감)
      const leveragedYield = selfCapital > 0 && loanAmountMan > 0 /* 대출을 입력한 경우에만 레버리지 카드 표시 */ ? ((netAnnualIncome / selfCapital) * 100).toFixed(2) : null;
      const grossYield = myPriceMan > 0 ? ((annualRentTotal / myPriceMan) * 100).toFixed(2) : null;
      const ltvPct = myPriceMan > 0 ? Math.round((loanAmountMan / myPriceMan) * 100) : 0;

      setResult({
        areaData, myYield, marketAvg, diff, kabRef, rents,
        totalSamples: allRents.length, medianRent, avgRent, p25Rent, p75Rent, region,
        // ✅ 레버리지 결과
        grossYield, leveragedYield, netAnnualIncome, annualInterest, selfCapital,
        loanAmountMan, ltvPct, myPriceMan,
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [region, myMonthlyRent, myPurchasePrice, loanAmount, loanRate, tenants, autoRent, annualInterest]);

  const myYieldNum = result?.myYield ? parseFloat(result.myYield) : null;
  const isAboveMarket = myYieldNum !== null && result?.marketAvg ? myYieldNum > result.marketAvg : false;

  return (
    <div style={{ padding: "28px 28px 80px", maxWidth: 960, margin: "0 auto", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>📊 수익률 벤치마크</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>국토부 실거래 기반 지역 수익률 비교 · 대출이자 반영 순수익률</p>
      </div>

      {/* 입력 */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px" }}>기본 정보</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>비교 지역</label>
            <select value={region} onChange={e => { setRegion(e.target.value); setResult(null); }} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13 }}>
              {Object.keys(LAWD_MAP).map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              내 월세 (만원){autoRent > 0 && <span style={{ color: "#0fa573", marginLeft: 6 }}>앱 합산: {autoRent}만원</span>}
            </label>
            <input type="number" value={myMonthlyRent} onChange={e => setMyMonthlyRent(e.target.value)} placeholder={autoRent ? `${autoRent}` : "예: 150"} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>매입가 (억원)</label>
            <input type="number" step="0.1" value={myPurchasePrice} onChange={e => setMyPurchasePrice(e.target.value)} placeholder="예: 8.5" style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>

        {/* ✅ 대출 정보 섹션 */}
        <div style={{ background: "rgba(26,39,68,0.04)", borderRadius: 12, padding: "14px 16px", marginBottom: 14, border: "1px solid rgba(26,39,68,0.1)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>🏦 대출 정보 (선택 — 순수익률 계산용)</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>대출금액 (억원)</label>
              <input type="number" step="0.1" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} placeholder="예: 4.0" style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>연 금리 (%)</label>
              <input type="number" step="0.1" value={loanRate} onChange={e => setLoanRate(e.target.value)} placeholder="예: 4.5" style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8 }}>이자만 납부하는 경우 기준으로 계산합니다 (원금 상환액은 반영하지 않음).</p>
          {loanAmount && loanRate && (
            <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>연 이자 부담: <strong style={{ color: "#e8445a" }}>{annualInterest.toLocaleString()}만원</strong></span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>월 이자: <strong style={{ color: "#e8445a" }}>{Math.round(annualInterest/12).toLocaleString()}만원</strong></span>
              {myPurchasePrice && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>LTV: <strong style={{ color: parseFloat(loanAmount)/parseFloat(myPurchasePrice) > 0.7 ? "#e8445a" : "#1a2744" }}>{Math.round(parseFloat(loanAmount)/parseFloat(myPurchasePrice)*100)}%</strong></span>}
            </div>
          )}
        </div>

        <button onClick={fetchBenchmark} disabled={loading} style={{ padding: "10px 24px", borderRadius: 10, background: loading ? "#94a3b8" : "#1a2744", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "분석 중..." : "벤치마크 분석"}
        </button>
      </div>

      {result && (<>
        {/* ✅ 수익률 핵심 지표 — 레버리지 포함 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
          {result.myYield && (
            <div style={{ background: isAboveMarket ? "linear-gradient(135deg,#0fa573,#059669)" : "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 14, padding: "18px 20px", color: "#fff" }}>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600, marginBottom: 6 }}>세전 총수익률</div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{result.myYield}%</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>{result.diff === null ? "지역 평균 표본 부족" : isAboveMarket ? `▲ 지역 평균 +${result.diff}%p` : `▼ 지역 평균 ${result.diff}%p`}</div>
            </div>
          )}

          {/* ✅ 레버리지 순수익률 카드 */}
          {result.leveragedYield && (
            <div style={{ background: parseFloat(result.leveragedYield) > parseFloat(result.myYield||0) ? "linear-gradient(135deg,rgba(59,91,219,0.12),rgba(91,79,207,0.08))" : "rgba(232,68,90,0.06)", border: `1.5px solid ${parseFloat(result.leveragedYield) > 0 ? "rgba(59,91,219,0.3)" : "rgba(232,68,90,0.3)"}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>자기자본 순수익률 🏦</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: parseFloat(result.leveragedYield) > 0 ? "#3b5bdb" : "#e8445a" }}>{result.leveragedYield}%</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>이자차감 후 자기자본 기준</div>
            </div>
          )}

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>지역 평균 수익률 (아파트)</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>{result.marketAvg ? `${result.marketAvg}%` : "표본 부족"}</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>국토부 실거래 최근 6개월 계산</div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>실거래 월세 중앙값</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)" }}>{result.medianRent}만원</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>국토부 실거래 {result.totalSamples}건</div>
          </div>
        </div>

        {/* ✅ 레버리지 상세 분석 박스 */}
        {result.leveragedYield && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>🏦 레버리지 수익률 상세 분석</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 16 }}>
              {[
                { l:"매입가", v:`${parseFloat(myPurchasePrice).toFixed(1)}억원`, c:"var(--text)" },
                { l:"대출금액", v:`${parseFloat(loanAmount).toFixed(1)}억원`, c:"#e8445a" },
                { l:"자기자본", v:`${(result.selfCapital/10000).toFixed(1)}억원`, c:"#1a2744" },
                { l:"LTV", v:`${result.ltvPct}%`, c:result.ltvPct > 70 ? "#e8445a" : "#0fa573" },
                { l:"연 임대수입", v:`${(parseFloat(myMonthlyRent||autoRent)*12).toLocaleString()}만원`, c:"#0fa573" },
                { l:"연 이자비용", v:`-${result.annualInterest.toLocaleString()}만원`, c:"#e8445a" },
                { l:"순수익", v:`${result.netAnnualIncome.toLocaleString()}만원`, c:result.netAnnualIncome >= 0 ? "#0fa573" : "#e8445a" },
              ].map(k => (
                <div key={k.l} style={{ background: "var(--surface2,#f8f7f4)", borderRadius: 10, padding: "10px 12px" }}>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>{k.l}</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: k.c }}>{k.v}</p>
                </div>
              ))}
            </div>

            {/* 수익률 비교 바 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label:"세전 총수익률 (매입가 기준)", value:parseFloat(result.myYield||0), color:"#1a2744", max:8 },
                { label:"자기자본 순수익률 (레버리지 반영)", value:parseFloat(result.leveragedYield), color:parseFloat(result.leveragedYield) > 0 ? "#3b5bdb" : "#e8445a", max:8 },
                ...(result.marketAvg ? [{ label:"지역 평균 수익률 (실거래 계산)", value:result.marketAvg, color:"#8a8a9a", max:8 }] : []),
              ].map(bar => (
                <div key={bar.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{bar.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: bar.color }}>{bar.value}%</span>
                  </div>
                  <div style={{ height: 8, background: "var(--border,#ebe9e3)", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, (bar.value/bar.max)*100))}%`, background: bar.color, borderRadius: 8, transition: "width .5s" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(26,39,68,0.04)", borderRadius: 10 }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                💡 <strong>레버리지 효과:</strong> 자기자본({(result.selfCapital/10000).toFixed(1)}억원)만 투입했을 때의 순수익률입니다.
                {parseFloat(result.leveragedYield) > parseFloat(result.myYield||0)
                  ? " 대출이자보다 임대수익이 높아 레버리지 효과가 긍정적입니다 ✅"
                  : " 대출이자 부담이 커서 레버리지 효과가 부정적입니다 ⚠️ 금리 재검토를 권장합니다."}
              </p>
            </div>
          </div>
        )}

        {/* 데이터 출처 안내 */}
        <div style={{ background: "rgba(26,39,68,0.04)", border: "1px solid rgba(26,39,68,0.12)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16 }}>📌</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>데이터 출처 및 산출 방법</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
지역 평균 수익률: <strong>국토교통부 실거래</strong> 최근 6개월 — 평당 임대료(보증금은 법정 전환율로 월세 환산) × 12 ÷ 평당 매매가 ({result.kabRef.sampleSize?.rent || 0}건 임대 · {result.kabRef.sampleSize?.trade || 0}건 매매). 공식 통계가 아니라 온리가 실거래로 계산한 참고치입니다.<br/>
월세 시세: <strong>국토교통부 실거래가 공개시스템</strong> — 최근 6개월 {result.region} 아파트 임대 실거래 {result.totalSamples}건 (실시간 집계)</p>
          </div>
        </div>

        {result.areaData.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px 10px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>면적대별 평균 월세 (실거래)</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>국토부 실거래가 · 최근 6개월 · {result.region}</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={result.areaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} unit="만원" />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }} formatter={(v,n,p) => [`${v}만원 (${p.payload.count}건)`]} />
                <Bar dataKey="avg" fill="#1a2744" radius={[5,5,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>📋 시장 해석</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { title:"아파트 임대수익률", value: result.kabRef.apt ? `${result.kabRef.apt}%` : "표본 부족", desc:`${result.region} 아파트 실거래(최근 6개월)로 계산한 값.`, color:"#1a2744" },
              { title:"오피스텔 임대수익률", value: result.kabRef.officetel ? `${result.kabRef.officetel}%` : "표본 부족", desc:`같은 지역 오피스텔 실거래(최근 6개월)로 계산한 값.`, color:"#5b4fcf" },
              { title:"실거래 월세 평균", value:`${result.avgRent}만원`, desc:`국토부 실거래 ${result.totalSamples}건 기준 평균 월세. 보증금 수준과 면적에 따라 편차 있음.`, color:"#0fa573" },
            ].map((item,i) => (
              <div key={i} style={{ padding: "14px 16px", background: "var(--surface2,#f8f7f4)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{item.title}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: item.color }}>{item.value}</span>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 16, lineHeight: 1.7 }}>※ 지역 수익률은 국토부 실거래로 계산한 참고치이며 공식 통계가 아닙니다. 개별 물건의 실제 수익률은 매입가·보증금·공실·수리비 등에 따라 다를 수 있습니다.</p>
        </div>
      </>)}

      {!result && !loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>지역을 선택하고 벤치마크 분석을 시작하세요</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>국토부 실거래 데이터 기반</p>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>대출금액·금리 입력 시 레버리지 순수익률도 함께 계산됩니다</p>
        </div>
      )}
    </div>
  );
}
