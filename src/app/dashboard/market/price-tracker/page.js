// src/app/dashboard/market/price-tracker/page.js
"use client";
import { useState, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const LAWD_MAP = {
  "서울 강남구": "11680", "서울 서초구": "11650", "서울 송파구": "11710",
  "서울 마포구": "11440", "서울 용산구": "11170", "서울 성동구": "11200",
  "서울 강동구": "11740", "서울 노원구": "11350", "서울 영등포구": "11560",
  "서울 관악구": "11620", "경기 성남시": "41130", "경기 수원시": "41110",
  "경기 용인시": "41460", "경기 고양시": "41280", "인천 연수구": "28185",
  "부산 해운대구": "26350", "대구 수성구": "27260",
};

const TYPE_MAP = {
  "아파트 전월세": "apt_rent",
  "아파트 매매": "apt_trade",
  "빌라/다세대 전월세": "villa_rent",
  "오피스텔 전월세": "offi_rent",
};

function getLastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ ym, label });
  }
  return months;
}

export default function PriceTrackerPage() {
  const [region, setRegion] = useState("서울 강남구");
  const [tradeType, setTradeType] = useState("아파트 전월세");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const months = getLastNMonths(12);
    const lawdCd = LAWD_MAP[region];
    const type = TYPE_MAP[tradeType];
    const results = [];

    try {
      await Promise.all(
        months.map(async ({ ym, label }) => {
          const res = await fetch(`/api/market/molit?type=${type}&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`);
          const data = await res.json();

          if (data.items?.length > 0) {
            if (type === "apt_trade") {
              // 매매
              const prices = data.items.map(i => parseInt((i.dealAmount || "0").replace(/,/g, "")) / 10000);
              const avg = prices.reduce((s, v) => s + v, 0) / prices.length;
              results.push({ label, 매매평균: Math.round(avg * 10) / 10, count: data.items.length });

            } else if (type.includes("rent")) {
              // ✅ 전월세 공통 로직 - apt_rent, villa_rent, offi_rent 모두 동일하게 처리
              const jeonse = data.items.filter(i => parseInt((i.monthlyRent || "0").replace(/,/g, "")) === 0);
              const wolse  = data.items.filter(i => parseInt((i.monthlyRent || "0").replace(/,/g, "")) > 0);

              const jeonseAvg = jeonse.length > 0
                ? jeonse.reduce((s, i) => s + parseInt((i.deposit || "0").replace(/,/g, "")), 0) / jeonse.length / 10000
                : null;
              const wolseAvg = wolse.length > 0
                ? wolse.reduce((s, i) => s + parseInt((i.monthlyRent || "0").replace(/,/g, "")), 0) / wolse.length
                : null;

              results.push({
                label,
                ...(jeonseAvg !== null && { 전세평균: Math.round(jeonseAvg * 10) / 10 }),
                ...(wolseAvg  !== null && { 월세평균: Math.round(wolseAvg) }),
                count: data.items.length,
                jeonseCount: jeonse.length,
                wolseCount: wolse.length,
              });
            }
          } else {
            results.push({ label, count: 0 });
          }
        })
      );

      results.sort((a, b) => a.label.localeCompare(b.label));
      setChartData(results);

      // 통계 계산
      const validData = results.filter(r => r.count > 0);
      if (validData.length >= 2) {
        const isRent = type.includes("rent");
        const isTrade = type === "apt_trade";
        const key = isTrade ? "매매평균" : "전세평균";
        const latest = validData[validData.length - 1]?.[key];
        const prev   = validData[validData.length - 2]?.[key];
        const oldest = validData[0]?.[key];
        const change1m  = latest && prev   ? ((latest - prev)   / prev   * 100).toFixed(1) : null;
        const change12m = latest && oldest ? ((latest - oldest) / oldest * 100).toFixed(1) : null;
        const totalTx = validData.reduce((s, r) => s + r.count, 0);
        const latestWolse = isRent ? validData[validData.length - 1]?.월세평균 : null;
        setStats({ latest, latestWolse, change1m, change12m, totalTx, key, isRent, isTrade });
      }
    } catch (e) {
      setError("데이터 조회 실패: " + e.message);
    }
    setLoading(false);
  }, [region, tradeType]);

  const type = TYPE_MAP[tradeType];
  const isRentType = type.includes("rent");
  const isTradeType = type === "apt_trade";

  return (
    <div style={{ padding: "28px 28px 80px", maxWidth: 920, margin: "0 auto", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>📈 시세 트래커 (12개월 심층 분석)</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>국토부 실거래가 기반 · 12개월 추이 · 거래 유형별 (전월세/매매)</p>
      </div>
      <div style={{ background: "rgba(91,79,207,0.05)", border: "1px solid rgba(91,79,207,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#5b4fcf", lineHeight: 1.6 }}>
        💡 <b>최근 3개월 종합 통계</b>는 <a href="/sise" style={{ color: "#5b4fcf", fontWeight: 700, textDecoration: "underline" }}>전국 시세 페이지</a>에서 확인하세요. 본 페이지는 <b>12개월 장기 트렌드</b>와 <b>거래 유형별 추이</b>를 분석합니다.
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <select value={region} onChange={e => setRegion(e.target.value)} style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {Object.keys(LAWD_MAP).map(k => <option key={k}>{k}</option>)}
        </select>
        <select value={tradeType} onChange={e => setTradeType(e.target.value)} style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {Object.keys(TYPE_MAP).map(k => <option key={k}>{k}</option>)}
        </select>
        <button onClick={fetchData} disabled={loading} style={{ padding: "9px 22px", borderRadius: 10, background: loading ? "#94a3b8" : "#1a2744", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "조회 중..." : "조회"}
        </button>
      </div>

      {error && <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {/* 통계 카드 */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            {
              label: `최근 전세평균`,
              value: stats.latest ? `${stats.latest}억` : "-",
              sub: tradeType,
              show: !stats.isTrade,
            },
            {
              label: `최근 월세평균`,
              value: stats.latestWolse ? `${stats.latestWolse}만원` : "-",
              sub: tradeType,
              show: stats.isRent,
            },
            {
              label: `최근 매매평균`,
              value: stats.latest ? `${stats.latest}억` : "-",
              sub: tradeType,
              show: stats.isTrade,
            },
            { label: "전월 대비", value: stats.change1m ? `${stats.change1m > 0 ? "+" : ""}${stats.change1m}%` : "-", color: stats.change1m > 0 ? "#e11d48" : "#0fa573", show: true },
            { label: "12개월 변동", value: stats.change12m ? `${stats.change12m > 0 ? "+" : ""}${stats.change12m}%` : "-", color: stats.change12m > 0 ? "#e11d48" : "#0fa573", show: true },
            { label: "총 거래 건수", value: `${stats.totalTx.toLocaleString()}건`, sub: "최근 12개월", show: true },
          ].filter(c => c.show).map((c, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.color || "var(--text)" }}>{c.value}</div>
              {c.sub && <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{c.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 차트 */}
      {chartData.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px 10px" }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                formatter={(v, n) => [
                  n === "월세평균" ? `${v}만원` : `${v}억`,
                  n
                ]}
                labelStyle={{ fontWeight: 700 }}
                contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}
              />
              {isTradeType && <Line type="monotone" dataKey="매매평균" stroke="#1a2744" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />}
              {isRentType  && <Line type="monotone" dataKey="전세평균" stroke="#1a2744" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />}
              {isRentType  && <Line type="monotone" dataKey="월세평균" stroke="#0fa573" strokeWidth={2}   dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", marginTop: 8 }}>
            출처: 국토교통부 실거래가 공개시스템 · 단위: 억원(전세/매매), 만원(월세)
          </p>
        </div>
      )}

      {!loading && chartData.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>지역과 유형을 선택 후 조회하세요</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>국토부 실거래가 기준 · 최근 1개월 후 반영</p>
        </div>
      )}
    </div>
  );
}
