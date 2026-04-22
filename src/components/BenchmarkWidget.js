"use client";
import { useEffect, useState } from "react";
import { findLawdCodeFromAddr, findRegionFromAddr, LAWD_MAP } from "../lib/regions";

// 임대료 벤치마크 위젯 — 사용자 월세 vs 지역 평균 비교
// 7일 localStorage 캐시 · 주거 세입자만 대상

const CACHE_KEY = "ownly_benchmark_cache";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7일

function getCached(region) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    const entry = all[region];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) return null;
    return entry.data;
  } catch { return null; }
}

function setCached(region, data) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[region] = { ts: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {}
}

function isMonthlyRow(row) {
  const m = Number(row.monthlyRent || 0);
  return m > 0;
}

async function fetchBenchmark(lawdCd, region) {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push(ym);
  }

  const allRows = [];
  for (const ym of months) {
    try {
      const res = await fetch(`/api/market/molit?type=apt_rent&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=100`);
      if (!res.ok) continue;
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      allRows.push(...items.filter(isMonthlyRow));
    } catch {}
  }

  if (allRows.length === 0) return null;

  const rents = allRows.map(r => Number(r.monthlyRent));
  rents.sort((a, b) => a - b);
  const avg = Math.round(rents.reduce((s, v) => s + v, 0) / rents.length);
  const median = rents[Math.floor(rents.length / 2)];
  const p25 = rents[Math.floor(rents.length * 0.25)];
  const p75 = rents[Math.floor(rents.length * 0.75)];

  return { count: rents.length, avg, median, p25, p75, region, months: months.length };
}

export default function BenchmarkWidget({ tenants = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 유저의 주 지역 + 평균 월세 계산
  const housing = tenants.filter(t =>
    (t.pType === "주거" || t.p_type === "주거") &&
    t.status !== "공실" &&
    Number(t.rent) > 0
  );

  const regionCounts = {};
  housing.forEach(t => {
    const r = findRegionFromAddr(t.addr);
    if (r) regionCounts[r] = (regionCounts[r] || 0) + 1;
  });
  const primaryRegion = Object.keys(regionCounts).sort((a, b) => regionCounts[b] - regionCounts[a])[0];
  const myAvg = housing.length > 0 ? Math.round(housing.reduce((s, t) => s + Number(t.rent), 0) / housing.length) : 0;

  useEffect(() => {
    if (!primaryRegion || !LAWD_MAP[primaryRegion]) return;
    const cached = getCached(primaryRegion);
    if (cached) { setData(cached); return; }

    setLoading(true);
    setError(null);
    fetchBenchmark(LAWD_MAP[primaryRegion], primaryRegion)
      .then(d => {
        if (d) { setCached(primaryRegion, d); setData(d); }
        else setError("데이터 없음");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [primaryRegion]);

  if (housing.length === 0 || !primaryRegion) return null;

  if (loading) {
    return (
      <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "16px 20px", marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", letterSpacing: "1px", marginBottom: 6 }}>📊 지역 임대료 벤치마크</p>
        <p style={{ fontSize: 12, color: "#8a8a9a" }}>{primaryRegion} 실거래가 분석 중...</p>
      </div>
    );
  }

  if (error || !data) return null;

  const gap = myAvg - data.median;
  const gapPct = data.median > 0 ? Math.round((gap / data.median) * 100) : 0;
  const verdict = Math.abs(gapPct) < 5 ? "적정" : gap > 0 ? "상회" : "하회";
  const verdictColor = Math.abs(gapPct) < 5 ? "#0fa573" : gap > 0 ? "#5b4fcf" : "#e8960a";

  return (
    <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "16px 20px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 3 }}>📊 지역 임대료 벤치마크</p>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>{primaryRegion} · 아파트 월세 기준</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: verdictColor, background: verdictColor + "15", padding: "4px 12px", borderRadius: 20 }}>
          {verdict} {gapPct !== 0 && `(${gapPct > 0 ? "+" : ""}${gapPct}%)`}
        </span>
      </div>

      {/* 내 월세 vs 지역 중위값 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ padding: "11px 13px", background: "rgba(26,39,68,0.06)", borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>내 평균 월세</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744" }}>{myAvg.toLocaleString()}만원</p>
          <p style={{ fontSize: 10, color: "#a0a0b0", marginTop: 2 }}>주거 {housing.length}건 기준</p>
        </div>
        <div style={{ padding: "11px 13px", background: verdictColor + "10", borderRadius: 10, border: `1px solid ${verdictColor}25` }}>
          <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>지역 중위값</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: verdictColor }}>{data.median.toLocaleString()}만원</p>
          <p style={{ fontSize: 10, color: "#a0a0b0", marginTop: 2 }}>최근 3개월 {data.count}건</p>
        </div>
      </div>

      {/* 분포 시각화 (25% / 75%) */}
      <div style={{ position: "relative", height: 28, background: "#f8f7f4", borderRadius: 8, marginBottom: 8 }}>
        <div style={{ position: "absolute", left: `${(data.p25 / (data.p75 * 1.2)) * 100}%`, right: `${100 - (data.p75 / (data.p75 * 1.2)) * 100}%`, top: 0, bottom: 0, background: verdictColor + "25", borderRadius: 4 }} />
        <div style={{ position: "absolute", left: `${Math.min(98, (data.median / (data.p75 * 1.2)) * 100)}%`, top: 0, bottom: 0, width: 2, background: verdictColor }} />
        <div style={{ position: "absolute", left: `${Math.min(98, (myAvg / (data.p75 * 1.2)) * 100)}%`, top: -4, bottom: -4, width: 3, background: "#1a2744", borderRadius: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#a0a0b0" }}>
        <span>하위 25% {data.p25.toLocaleString()}만</span>
        <span>중위 {data.median.toLocaleString()}만</span>
        <span>상위 25% {data.p75.toLocaleString()}만</span>
      </div>

      <p style={{ fontSize: 10, color: "#a0a0b0", marginTop: 10, lineHeight: 1.6 }}>
        {gap > 0 && gapPct >= 5 && `💡 지역 평균보다 ${gapPct}% 높게 받고 계십니다. 갱신 협상 시 참고하세요.`}
        {gap < 0 && Math.abs(gapPct) >= 5 && `💡 지역 평균보다 ${Math.abs(gapPct)}% 낮습니다. 다음 갱신 시 ${Math.abs(gap)}만원 인상 여력 있음 (5% 상한 확인).`}
        {Math.abs(gapPct) < 5 && `💡 시세와 일치합니다.`}
      </p>
    </div>
  );
}
