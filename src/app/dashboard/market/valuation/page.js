// src/app/dashboard/market/valuation/page.js
"use client";
import { useState, useCallback } from "react";
import { useApp } from "../../../../context/AppContext";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

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

export default function ValuationPage() {
  const { tenants } = useApp();
  const [region, setRegion] = useState("서울 강남구");
  const [area, setArea] = useState("");
  const [currentRent, setCurrentRent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // 앱에서 세입자 데이터 가져오기
  const appTenants = tenants.slice(0, 5);

  const estimate = useCallback(async () => {
    setLoading(true);
    const months = getLastNMonths(6);
    const lawdCd = LAWD_MAP[region];
    let allTrades = [];

    try {
      await Promise.all(
        months.map(async (ym) => {
          const res = await fetch(`/api/market/molit?type=apt_trade&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`);
          const d = await res.json();
          if (d.items) {
            d.items.forEach(i => {
              const a = parseFloat(i.excluUseAr || "0");
              const p = parseInt((i.dealAmount || "0").replace(/,/g, "")) * 10000;
              if (a > 0 && p > 0) allTrades.push({ area: a, price: p, dealYear: i.dealYear, dealMonth: i.dealMonth });
            });
          }
        })
      );

      const myArea = parseFloat(area);

      // 유사 면적 필터링 (±20%)
      const similar = allTrades.filter(t => Math.abs(t.area - myArea) / myArea < 0.2);
      if (similar.length === 0) {
        // 면적 범위 넓히기
        similar.push(...allTrades.filter(t => Math.abs(t.area - myArea) / myArea < 0.4));
      }

      // 평당가 계산
      const pricePerSqm = similar.map(t => t.price / t.area);
      pricePerSqm.sort((a, b) => a - b);

      const q1 = pricePerSqm[Math.floor(pricePerSqm.length * 0.25)];
      const median = pricePerSqm[Math.floor(pricePerSqm.length * 0.5)];
      const q3 = pricePerSqm[Math.floor(pricePerSqm.length * 0.75)];
      const avg = pricePerSqm.reduce((s, v) => s + v, 0) / pricePerSqm.length;

      const low = Math.round(q1 * myArea / 100000000 * 10) / 10;
      const mid = Math.round(median * myArea / 100000000 * 10) / 10;
      const high = Math.round(q3 * myArea / 100000000 * 10) / 10;
      const avgVal = Math.round(avg * myArea / 100000000 * 10) / 10;

      // 임대 수익률 역산 (연간 임대료 / 가치 추정)
      const myRentPerYear = parseFloat(currentRent || "0") * 10000 * 12;
      const impliedYield = myRentPerYear > 0 ? (myRentPerYear / (avgVal * 100000000) * 100).toFixed(2) : null;

      // 스캐터 데이터 (유사 거래)
      const scatterData = similar.slice(0, 100).map(t => ({
        x: Math.round(t.area * 10) / 10,
        y: Math.round(t.price / 100000000 * 10) / 10,
      }));

      setResult({ low, mid, high, avgVal, similar: similar.length, total: allTrades.length, impliedYield, scatterData, myArea });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [region, area, currentRent]);

  return (
    <div style={{ padding: "28px 28px 80px", maxWidth: 920, margin: "0 auto", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>🏠 매물 가치 추정</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>실거래가 기반 시가 추정 · 임대 수익률 역산</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px" }}>물건 정보 입력</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>지역</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13 }}>
              {Object.keys(LAWD_MAP).map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>전용면적 (㎡)</label>
            <input type="number" value={area} onChange={e => setArea(e.target.value)} placeholder="예: 59.9"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>현재 월세 (만원, 선택)</label>
            <input type="number" value={currentRent} onChange={e => setCurrentRent(e.target.value)} placeholder="예: 150 (수익률 역산용)"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>

        {/* 앱 세입자 빠른 선택 */}
        {appTenants.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>내 물건에서 바로 선택</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {appTenants.map((t, i) => (
                <button key={i} onClick={() => { setCurrentRent(t.monthly || ""); }}
                  style={{ padding: "5px 12px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border)", fontSize: 11, cursor: "pointer", color: "var(--text)", fontWeight: 600 }}>
                  {t.name} ({t.monthly || 0}만원/월)
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={estimate} disabled={loading || !area}
          style={{ padding: "10px 24px", borderRadius: 10, background: loading || !area ? "#94a3b8" : "#1a2744", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: loading || !area ? "not-allowed" : "pointer" }}>
          {loading ? "추정 중..." : "가치 추정"}
        </button>
      </div>

      {result && (
        <>
          {/* 가치 범위 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>추정 시장가치 범위</p>
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
              {[
                { label: "하단 (Q1)", value: result.low, color: "#94a3b8" },
                { label: "중간값", value: result.mid, color: "#1a2744" },
                { label: "상단 (Q3)", value: result.high, color: "#e8445a" },
              ].map((v, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "16px 8px", background: i === 1 ? "#1a274410" : "transparent", borderRadius: i === 1 ? 12 : 0, border: i === 1 ? "2px solid #1a274420" : "none" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{v.label}</div>
                  <div style={{ fontSize: i === 1 ? 32 : 24, fontWeight: 900, color: v.color }}>{v.value}억</div>
                </div>
              ))}
            </div>
            {/* 레인지 바 */}
            <div style={{ position: "relative", height: 12, borderRadius: 6, background: "#e5e7eb", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: "15%", right: "15%", top: 0, bottom: 0, background: "linear-gradient(90deg,#c7d2e8,#1a2744,#e8445a)", borderRadius: 6 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-faint)", marginTop: 4 }}>
              <span>{result.low}억</span>
              <span>평균 {result.avgVal}억</span>
              <span>{result.high}억</span>
            </div>

            {result.impliedYield && (
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(15,165,115,0.08)", border: "1px solid rgba(15,165,115,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>💰</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0fa573" }}>임대 수익률 {result.impliedYield}%</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>월 {currentRent}만원 기준 · 추정 시가 {result.avgVal}억 대비</div>
                </div>
              </div>
            )}
          </div>

          {/* 산점도 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px 10px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>유사 면적 실거래가 분포</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
              {region} · 유사 면적({result.myArea}㎡ ±20%) 거래 {result.similar}건 / 전체 {result.total}건
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="x" name="면적" unit="㎡" tick={{ fontSize: 10, fill: "var(--text-muted)" }} type="number" domain={["auto","auto"]} />
                <YAxis dataKey="y" name="거래가" unit="억" tick={{ fontSize: 10, fill: "var(--text-muted)" }} type="number" domain={["auto","auto"]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}
                  formatter={(v, n) => [n === "면적" ? `${v}㎡` : `${v}억`, n]} />
                <ReferenceLine x={result.myArea} stroke="#1a2744" strokeDasharray="4 4" label={{ value: "내 면적", fontSize: 10, fill: "#1a2744" }} />
                <Scatter data={result.scatterData} fill="#1a2744" opacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", marginTop: 8 }}>
              출처: 국토교통부 실거래가 · 최근 6개월 · 참고용 추정치 (법적 효력 없음)
            </p>
          </div>
        </>
      )}

      {!result && !loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>지역과 면적을 입력하면 실거래가 기반 시가를 추정해요</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>최근 6개월 실거래 데이터 기준 · 참고용 수치</p>
        </div>
      )}
    </div>
  );
}
