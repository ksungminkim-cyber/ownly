"use client";
import { useEffect, useState } from "react";
import { findLawdCodeFromAddr, findRegionFromAddr, LAWD_MAP } from "../lib/regions";

const AI_CACHE_KEY = "ownly_ai_benchmark_cache";
const AI_TTL = 24 * 60 * 60 * 1000; // 24h

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

async function fetchBenchmark(lawdCd, region, molitType = "apt_rent") {
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
      const res = await fetch(`/api/market/molit?type=${molitType}&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=100`);
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

  return { count: rents.length, avg, median, p25, p75, region, months: months.length, molitType };
}

export default function BenchmarkWidget({ tenants = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiComment, setAiComment] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDataSource, setShowDataSource] = useState(false);

  // 유저 물건 유형 판단: 주거 vs 상가·오피스텔 중 우세한 쪽
  const activeTenants = tenants.filter(t => t.status !== "공실" && Number(t.rent) > 0);
  const housingCount = activeTenants.filter(t => (t.pType || t.p_type) === "주거").length;
  const commercialCount = activeTenants.filter(t => {
    const pt = t.pType || t.p_type;
    return pt === "상가" || pt === "오피스텔" || (pt === "주거" && (t.sub === "오피스텔" || t.sub_type === "오피스텔"));
  }).length;

  const primaryType = housingCount >= commercialCount ? "residential" : "commercial";
  const molitType = primaryType === "residential" ? "apt_rent" : "offi_rent";
  const molitLabel = primaryType === "residential" ? "아파트 월세" : "오피스텔 월세 (상가 참고용)";

  // 대상 세입자: 선택된 유형 기준
  const targetTenants = primaryType === "residential"
    ? activeTenants.filter(t => (t.pType || t.p_type) === "주거")
    : activeTenants.filter(t => {
        const pt = t.pType || t.p_type;
        return pt === "상가" || pt === "오피스텔" || (pt === "주거" && (t.sub === "오피스텔" || t.sub_type === "오피스텔"));
      });

  const regionCounts = {};
  targetTenants.forEach(t => {
    const r = findRegionFromAddr(t.addr);
    if (r) regionCounts[r] = (regionCounts[r] || 0) + 1;
  });
  const primaryRegion = Object.keys(regionCounts).sort((a, b) => regionCounts[b] - regionCounts[a])[0];
  const myAvg = targetTenants.length > 0 ? Math.round(targetTenants.reduce((s, t) => s + Number(t.rent), 0) / targetTenants.length) : 0;

  const cacheKey = primaryRegion ? `${primaryRegion}__${molitType}` : null;

  useEffect(() => {
    if (!primaryRegion || !LAWD_MAP[primaryRegion]) return;
    const cached = getCached(cacheKey);
    if (cached) { setData(cached); return; }

    setLoading(true);
    setError(null);
    fetchBenchmark(LAWD_MAP[primaryRegion], primaryRegion, molitType)
      .then(d => {
        if (d) { setCached(cacheKey, d); setData(d); }
        else setError("데이터 없음");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [primaryRegion, molitType, cacheKey]);

  // AI 코멘트 (24시간 캐시)
  useEffect(() => {
    if (!data || !primaryRegion) return;
    const aiCacheKey = `${primaryRegion}__${molitType}__${myAvg}`;
    try {
      const raw = localStorage.getItem(AI_CACHE_KEY);
      const all = raw ? JSON.parse(raw) : {};
      const cached = all[aiCacheKey];
      if (cached && Date.now() - cached.ts < AI_TTL) {
        setAiComment(cached.comment);
        return;
      }
    } catch {}

    setAiLoading(true);
    fetch("/api/ai-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "benchmark",
        context: {
          region: primaryRegion,
          type: primaryType === "residential" ? "아파트" : "오피스텔/상가",
          myRent: myAvg,
          median: data.median,
          p25: data.p25,
          p75: data.p75,
          count: data.count,
        },
      }),
    })
      .then(r => r.json())
      .then(r => {
        if (r.comment) {
          setAiComment(r.comment);
          try {
            const raw = localStorage.getItem(AI_CACHE_KEY);
            const all = raw ? JSON.parse(raw) : {};
            all[aiCacheKey] = { ts: Date.now(), comment: r.comment };
            localStorage.setItem(AI_CACHE_KEY, JSON.stringify(all));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setAiLoading(false));
  }, [data, primaryRegion, myAvg, molitType, primaryType]);

  if (targetTenants.length === 0 || !primaryRegion) return null;

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>📊 지역 임대료 벤치마크</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744" }}>{primaryRegion} · {molitLabel} 기준</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: verdictColor, background: verdictColor + "15", padding: "5px 14px", borderRadius: 20 }}>
          {verdict} {gapPct !== 0 && `(${gapPct > 0 ? "+" : ""}${gapPct}%)`}
        </span>
      </div>

      {/* 내 월세 vs 지역 중위값 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ padding: "13px 15px", background: "rgba(26,39,68,0.06)", borderRadius: 11 }}>
          <p style={{ fontSize: 11, color: "#6a6a7a", fontWeight: 700, marginBottom: 4 }}>내 평균 월세</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: "#1a2744" }}>{myAvg.toLocaleString()}만원</p>
          <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 3 }}>{primaryType === "residential" ? "주거" : "상가·오피스텔"} {targetTenants.length}건 기준</p>
        </div>
        <div style={{ padding: "13px 15px", background: verdictColor + "10", borderRadius: 11, border: `1px solid ${verdictColor}25` }}>
          <p style={{ fontSize: 11, color: "#6a6a7a", fontWeight: 700, marginBottom: 4 }}>지역 중위값</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: verdictColor }}>{data.median.toLocaleString()}만원</p>
          <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 3 }}>최근 3개월 {data.count}건</p>
        </div>
      </div>

      {/* 분포 시각화 (25% / 75%) */}
      <div style={{ position: "relative", height: 28, background: "#f8f7f4", borderRadius: 8, marginBottom: 8 }}>
        <div style={{ position: "absolute", left: `${(data.p25 / (data.p75 * 1.2)) * 100}%`, right: `${100 - (data.p75 / (data.p75 * 1.2)) * 100}%`, top: 0, bottom: 0, background: verdictColor + "25", borderRadius: 4 }} />
        <div style={{ position: "absolute", left: `${Math.min(98, (data.median / (data.p75 * 1.2)) * 100)}%`, top: 0, bottom: 0, width: 2, background: verdictColor }} />
        <div style={{ position: "absolute", left: `${Math.min(98, (myAvg / (data.p75 * 1.2)) * 100)}%`, top: -4, bottom: -4, width: 3, background: "#1a2744", borderRadius: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6a6a7a", fontWeight: 600 }}>
        <span>하위 25% {data.p25.toLocaleString()}만</span>
        <span>중위 {data.median.toLocaleString()}만</span>
        <span>상위 25% {data.p75.toLocaleString()}만</span>
      </div>

      <p style={{ fontSize: 12, color: "#6a6a7a", marginTop: 10, lineHeight: 1.7 }}>
        {gap > 0 && gapPct >= 5 && `💡 지역 평균보다 ${gapPct}% 높게 받고 계십니다. 갱신 협상 시 참고하세요.`}
        {gap < 0 && Math.abs(gapPct) >= 5 && `💡 지역 평균보다 ${Math.abs(gapPct)}% 낮습니다. 다음 갱신 시 ${Math.abs(gap)}만원 인상 여력 있음 (5% 상한 확인).`}
        {Math.abs(gapPct) < 5 && `💡 시세와 일치합니다.`}
        {primaryType === "commercial" && " · 상가 실거래가는 공공데이터에 미포함돼 오피스텔 기준으로 참고 표시합니다."}
      </p>

      {/* AI 자연어 인사이트 */}
      {(aiLoading || aiComment) && (
        <div style={{ marginTop: 14, padding: "14px 16px", background: "linear-gradient(135deg,rgba(91,79,207,0.05),rgba(26,39,68,0.03))", border: "1px solid rgba(91,79,207,0.2)", borderRadius: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#5b4fcf", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
            <span>🤖</span> AI 시장 분석
          </p>
          {aiLoading ? (
            <p style={{ fontSize: 13, color: "#8a8a9a", fontStyle: "italic" }}>지역 시세 데이터를 분석 중...</p>
          ) : (
            <p style={{ fontSize: 13, color: "#3a3a4e", lineHeight: 1.75 }}>{aiComment}</p>
          )}
        </div>
      )}

      {/* 데이터 출처 (접힘) */}
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setShowDataSource(!showDataSource)}
          style={{ fontSize: 12, color: "#6a6a7a", background: "transparent", border: "none", cursor: "pointer", padding: 0, fontWeight: 700 }}>
          {showDataSource ? "▾" : "▸"} 데이터 출처
        </button>
        {showDataSource && (
          <div style={{ marginTop: 8, padding: "11px 14px", background: "#f8f7f4", borderRadius: 8, fontSize: 12, color: "#4a5568", lineHeight: 1.8 }}>
            국토교통부 실거래가 공개 시스템 API (정식 공공데이터)<br/>
            최근 3개월 {primaryType === "residential" ? "아파트 전월세" : "오피스텔 전월세"} {data.count}건의 월세 금액 기반<br/>
            • 중위값: 50번째 백분위수 (평균보다 이상치 영향 적음)<br/>
            • 25%/75% 분포: 시장 대부분이 이 구간에 위치<br/>
            AI 코멘트는 Llama 3.3 기반 실시간 생성 (결과 24시간 캐시)
          </div>
        )}
      </div>
    </div>
  );
}
