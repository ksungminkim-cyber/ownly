// src/app/dashboard/market/yield-benchmark/page.js
"use client";
import { useState, useCallback } from "react";
import { useApp } from "../../../../context/AppContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

const LAWD_MAP = {
  "서울 강남구": "11680", "서울 서초구": "11650", "서울 송파구": "11710",
  "서울 마포구": "11440", "서울 용산구": "11170", "서울 성동구": "11200",
  "서울 강동구": "11740", "서울 노원구": "11350", "서울 영등포구": "11560",
  "서울 관악구": "11620", "경기 성남시": "41130", "경기 수원시": "41110",
  "경기 용인시": "41460", "경기 고양시": "41280",
};

function getLastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export default function YieldBenchmarkPage() {
  const { tenants } = useApp();
  const [region, setRegion] = useState("서울 강남구");
  const [myMonthlyRent, setMyMonthlyRent] = useState("");
  const [myPurchasePrice, setMyPurchasePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // 내 물건에서 자동으로 월세/보증금 합산
  const totalMonthlyFromApp = tenants
    .filter(t => parseInt(t.monthly || "0") > 0)
    .reduce((s, t) => s + parseInt(t.monthly || "0"), 0);

  const fetchBenchmark = useCallback(async () => {
    setLoading(true);
    const months = getLastNMonths(6);
    const lawdCd = LAWD_MAP[region];
    let allRents = [], allTrades = [];

    try {
      await Promise.all([
        ...months.map(async (ym) => {
          const res = await fetch(`/api/market/molit?type=apt_rent&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`);
          const d = await res.json();
          if (d.items) {
            d.items.filter(i => parseInt(i.monthlyRent || "0") > 0).forEach(i => {
              allRents.push({
                monthly: parseInt(i.monthlyRent || "0"),
                deposit: parseInt((i.deposit || "0").replace(/,/g, "")),
                area: parseFloat(i.excluUseAr || "0"),
              });
            });
          }
        }),
        ...months.slice(-3).map(async (ym) => {
          const res = await fetch(`/api/market/molit?type=apt_trade&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`);
          const d = await res.json();
          if (d.items) {
            d.items.forEach(i => {
              allTrades.push({
                price: parseInt((i.dealAmount || "0").replace(/,/g, "")) * 10000,
                area: parseFloat(i.excluUseAr || "0"),
              });
            });
          }
        }),
      ]);

      // 평균 매매가 (㎡당)
      const avgTradePerSqm = allTrades.length > 0
        ? allTrades.reduce((s, t) => s + (t.area > 0 ? t.price / t.area : 0), 0) / allTrades.length
        : 0;

      // 월세 수익률 분포 (연간 월세 / 매매가 * 100)
      const yieldData = [];
      const brackets = ["0~3%", "3~4%", "4~5%", "5~6%", "6~7%", "7%+"];
      const counts = [0, 0, 0, 0, 0, 0];

      allRents.forEach(r => {
        if (r.area > 0 && avgTradePerSqm > 0) {
          const estimatedPrice = r.area * avgTradePerSqm;
          const annualRent = r.monthly * 12 * 10000;
          const yld = (annualRent / estimatedPrice) * 100;
          if (yld < 3) counts[0]++;
          else if (yld < 4) counts[1]++;
          else if (yld < 5) counts[2]++;
          else if (yld < 6) counts[3]++;
          else if (yld < 7) counts[4]++;
          else counts[5]++;
        }
      });

      brackets.forEach((b, i) => yieldData.push({ range: b, count: counts[i] }));

      // 내 수익률
      const myRent = parseFloat(myMonthlyRent || totalMonthlyFromApp || "0");
      const myPrice = parseFloat(myPurchasePrice || "0") * 100000000; // 억 → 원
      const myYield = myPrice > 0 ? ((myRent * 10000 * 12) / myPrice * 100).toFixed(2) : null;

      // 시장 평균 수익률
      const totalCount = counts.reduce((s, v) => s + v, 0);
      const weightedYield = totalCount > 0
        ? (counts[0] * 2 + counts[1] * 3.5 + counts[2] * 4.5 + counts[3] * 5.5 + counts[4] * 6.5 + counts[5] * 7.5) / totalCount
        : 0;

      // 백분위 계산
      let myPercentile = null;
      if (myYield) {
        const y = parseFloat(myYield);
        const below = (y < 3 ? 0 : y < 4 ? counts[0] : y < 5 ? counts[0]+counts[1] : y < 6 ? counts[0]+counts[1]+counts[2] : y < 7 ? counts[0]+counts[1]+counts[2]+counts[3] : counts[0]+counts[1]+counts[2]+counts[3]+counts[4]);
        myPercentile = totalCount > 0 ? Math.round(below / totalCount * 100) : null;
      }

      setResult({ yieldData, myYield, marketAvgYield: weightedYield.toFixed(2), myPercentile, totalSamples: allRents.length, avgTradePerSqm: Math.round(avgTradePerSqm / 10000) });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [region, myMonthlyRent, myPurchasePrice, tenants, totalMonthlyFromApp]);

  return (
    <div style={{ padding: "28px 28px 80px", maxWidth: 920, margin: "0 auto", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>📊 수익률 벤치마크</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>내 임대 수익률이 시장 대비 어느 위치인지 확인</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px" }}>비교 설정</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>비교 지역</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13 }}>
              {Object.keys(LAWD_MAP).map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>내 월세 (만원)</label>
            <input type="number" value={myMonthlyRent} onChange={e => setMyMonthlyRent(e.target.value)}
              placeholder={totalMonthlyFromApp ? `앱 합산: ${totalMonthlyFromApp}만원` : "예: 150"}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>매입가 (억원)</label>
            <input type="number" step="0.1" value={myPurchasePrice} onChange={e => setMyPurchasePrice(e.target.value)}
              placeholder="예: 8.5"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>
        <button onClick={fetchBenchmark} disabled={loading}
          style={{ padding: "10px 24px", borderRadius: 10, background: loading ? "#94a3b8" : "#1a2744", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "분석 중..." : "벤치마크 분석"}
        </button>
      </div>

      {result && (
        <>
          {/* 결과 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
            {result.myYield && (
              <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 14, padding: "18px 20px", color: "#fff" }}>
                <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, marginBottom: 6 }}>내 수익률</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{result.myYield}%</div>
                {result.myPercentile !== null && (
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>상위 {100 - result.myPercentile}%</div>
                )}
              </div>
            )}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>시장 평균 수익률</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>{result.marketAvgYield}%</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{region} 기준</div>
            </div>
            {result.myYield && (
              <div style={{ background: parseFloat(result.myYield) > parseFloat(result.marketAvgYield) ? "rgba(15,165,115,0.08)" : "rgba(232,68,90,0.08)", border: `1px solid ${parseFloat(result.myYield) > parseFloat(result.marketAvgYield) ? "rgba(15,165,115,0.25)" : "rgba(232,68,90,0.25)"}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>시장 대비</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: parseFloat(result.myYield) > parseFloat(result.marketAvgYield) ? "#0fa573" : "#e8445a" }}>
                  {parseFloat(result.myYield) > parseFloat(result.marketAvgYield) ? "▲" : "▼"} {Math.abs(parseFloat(result.myYield) - parseFloat(result.marketAvgYield)).toFixed(2)}%p
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                  {parseFloat(result.myYield) > parseFloat(result.marketAvgYield) ? "시장 평균보다 좋음" : "시장 평균보다 낮음"}
                </div>
              </div>
            )}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>분석 샘플</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>{result.totalSamples.toLocaleString()}건</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>최근 6개월</div>
            </div>
          </div>

          {/* 수익률 분포 차트 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px 10px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>수익률 분포</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={result.yieldData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} unit="건" />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }} formatter={(v) => [`${v}건`]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {result.yieldData.map((_, i) => (
                    <Cell key={i} fill={i === 2 || i === 3 ? "#1a2744" : "#c7d2e8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", marginTop: 8 }}>출처: 국토교통부 실거래가 · 추정 매매가 기반 계산</p>
          </div>
        </>
      )}

      {!result && !loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>지역을 선택하고 벤치마크 분석을 시작하세요</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>내 수익률이 시장 대비 상위 몇 %인지 확인할 수 있어요</p>
        </div>
      )}
    </div>
  );
}
