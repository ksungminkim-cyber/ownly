"use client";
import { useState, useEffect } from "react";
import { findLawdCodeFromAddr, findRegionFromAddr, LAWD_MAP } from "../lib/regions";

// 갱신 가이드 — 만료 120일 이내 세입자 대상, 벤치마크 기반 인상 제안
// 주택임대차보호법 §7: 갱신 시 임대료 인상 5% 상한

const LEGAL_CAP = 0.05; // 5%
const CACHE_KEY = "ownly_renewal_cache";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function getCached(region, type) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    const key = `${region}__${type}`;
    const e = all[key];
    if (!e || Date.now() - e.ts > CACHE_TTL) return null;
    return e.data;
  } catch { return null; }
}

function setCached(region, type, data) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[`${region}__${type}`] = { ts: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {}
}

async function fetchMedianRent(lawdCd, type = "apt_rent") {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const rents = [];
  for (const ym of months) {
    try {
      const res = await fetch(`/api/market/molit?type=${type}&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=100`);
      if (!res.ok) continue;
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      items.forEach(r => {
        const m = Number(r.monthlyRent);
        if (m > 0) rents.push(m);
      });
    } catch {}
  }
  if (rents.length === 0) return null;
  rents.sort((a, b) => a - b);
  return { median: rents[Math.floor(rents.length / 2)], count: rents.length };
}

export default function RenewalGuide({ tenant, daysLeft }) {
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const region = findRegionFromAddr(tenant.addr);
  const lawdCd = region ? LAWD_MAP[region] : null;
  const isCommercial = (tenant.pType || tenant.p_type) === "상가" || (tenant.sub || tenant.sub_type) === "오피스텔";
  const molitType = isCommercial ? "offi_rent" : "apt_rent";
  const currentRent = Number(tenant.rent) || 0;

  useEffect(() => {
    if (!region || !lawdCd) { setLoading(false); return; }
    const cached = getCached(region, molitType);
    if (cached) { setBenchmark(cached); setLoading(false); return; }
    setLoading(true);
    fetchMedianRent(lawdCd, molitType)
      .then(d => {
        if (d) { setCached(region, molitType, d); setBenchmark(d); }
      })
      .finally(() => setLoading(false));
  }, [region, lawdCd, molitType]);

  if (currentRent === 0) return null;

  const maxLegalRent = Math.round(currentRent * (1 + LEGAL_CAP));
  const gap = benchmark ? benchmark.median - currentRent : 0;
  const gapPct = benchmark && benchmark.median > 0 ? Math.round((gap / benchmark.median) * 100) : 0;

  // 제안가: 법적 상한과 시장 중위값 중 작은 값 (단 현재보다 낮으면 유지 추천)
  let suggestedRent = currentRent;
  let recommendation = "currentHold";
  if (benchmark && benchmark.median > currentRent) {
    suggestedRent = Math.min(maxLegalRent, benchmark.median);
    recommendation = suggestedRent >= maxLegalRent ? "capMax" : "marketRate";
  } else if (benchmark && benchmark.median < currentRent * 0.9) {
    recommendation = "keepOrReduce";
  }
  const increase = suggestedRent - currentRent;
  const annualIncrease = increase * 12;

  return (
    <div style={{ background: "linear-gradient(135deg,rgba(91,79,207,0.04),rgba(26,39,68,0.04))", border: "1.5px solid rgba(91,79,207,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#5b4fcf" }}>🎯 갱신 가이드 {daysLeft > 0 && `(D-${daysLeft})`}</p>
        <span style={{ fontSize: 10, color: "#8a8a9a" }}>법적 상한 +5%</span>
      </div>

      {loading ? (
        <p style={{ fontSize: 11, color: "#8a8a9a", textAlign: "center", padding: 8 }}>지역 시세 분석 중...</p>
      ) : !benchmark ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12 }}>
            <span style={{ color: "#8a8a9a" }}>현재 월세</span>
            <b style={{ color: "#1a2744" }}>{currentRent.toLocaleString()}만원</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12 }}>
            <span style={{ color: "#8a8a9a" }}>법적 최대 갱신가</span>
            <b style={{ color: "#5b4fcf" }}>{maxLegalRent.toLocaleString()}만원 (+5%)</b>
          </div>
          <p style={{ fontSize: 10, color: "#a0a0b0", marginTop: 8, lineHeight: 1.6 }}>
            지역 시세 데이터 부족 — 법적 상한 5% 인상만 참고 가능
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
            <div style={{ padding: "8px 10px", background: "#fff", borderRadius: 8 }}>
              <p style={{ fontSize: 9, color: "#8a8a9a", fontWeight: 700, marginBottom: 2 }}>현재 월세</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744" }}>{currentRent.toLocaleString()}만</p>
            </div>
            <div style={{ padding: "8px 10px", background: "rgba(91,79,207,0.06)", borderRadius: 8, border: "1px solid rgba(91,79,207,0.2)" }}>
              <p style={{ fontSize: 9, color: "#8a8a9a", fontWeight: 700, marginBottom: 2 }}>지역 중위값</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#5b4fcf" }}>
                {benchmark.median.toLocaleString()}만
                <span style={{ fontSize: 9, fontWeight: 600, marginLeft: 4, color: gap > 0 ? "#0fa573" : "#e8445a" }}>
                  {gap > 0 ? "+" : ""}{gap}
                </span>
              </p>
            </div>
          </div>

          <div style={{ padding: "10px 12px", background: "#fff", border: "1.5px solid rgba(15,165,115,0.25)", borderRadius: 9, marginBottom: 8 }}>
            <p style={{ fontSize: 10, color: "#0fa573", fontWeight: 800, marginBottom: 4 }}>💡 제안 갱신가</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#0fa573" }}>{suggestedRent.toLocaleString()}만원</span>
              {increase > 0 && (
                <span style={{ fontSize: 10, color: "#0fa573", fontWeight: 700 }}>
                  +{increase.toLocaleString()}만 / 연 +{annualIncrease.toLocaleString()}만
                </span>
              )}
            </div>
            <p style={{ fontSize: 10, color: "#6a6a7a", lineHeight: 1.5 }}>
              {recommendation === "capMax" && `📈 시세가 +${gapPct}% 높지만 갱신 시 법적 5% 상한 적용`}
              {recommendation === "marketRate" && `📊 시세(${benchmark.median.toLocaleString()}만)에 맞춤 인상 가능`}
              {recommendation === "currentHold" && `✅ 시세와 유사해 현재가 유지 권장`}
              {recommendation === "keepOrReduce" && `⚠️ 시세보다 ${Math.abs(gapPct)}% 높음 — 유지 또는 조정 고려`}
            </p>
          </div>

          <p style={{ fontSize: 10, color: "#a0a0b0", lineHeight: 1.6 }}>
            ※ {region} 최근 3개월 {isCommercial ? "오피스텔" : "아파트"} 월세 실거래 {benchmark.count}건 기준 ·
            재계약이 아닌 신규 계약은 상한 적용 없음
          </p>
        </div>
      )}
    </div>
  );
}
