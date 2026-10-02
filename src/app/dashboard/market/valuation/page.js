// src/app/dashboard/market/valuation/page.js
"use client";
import { useState, useCallback } from "react";
import { useApp } from "../../../../context/AppContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import PlanGate from "../../../../components/PlanGate";

// 매물 가치 추정 (플러스 플랜)
// 국토부 실거래(최근 6개월)만 사용: 매매 평당가 · 매매가 대비 임대료로 계산한 지역 수익률 · 유사 면적 임대 시세.
// 2026-10 이전에는 구별 "R-ONE 임대수익률"·"KB 평당가"를 코드에 직접 적어 폴백으로 썼으나, R-ONE 은 구별 아파트 임대수익률을
// 공표하지 않아 출처를 댈 수 없는 수치였다 → 제거. 실거래 표본이 없으면 추정하지 않고 "데이터 부족"으로 표시한다.

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
    months.push({
      ym: `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return months;
}

export default function ValuationPage() {
  return <PlanGate feature="vacancyLoss"><ValuationContent /></PlanGate>;
}

function ValuationContent() {
  const { tenants } = useApp();
  const [region, setRegion] = useState("서울 강남구");
  const [area, setArea] = useState("");
  const [currentRent, setCurrentRent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const estimate = useCallback(async () => {
    setLoading(true);
    setError("");
    setResult(null);
    const months = getLastNMonths(6);
    const lawdCd = LAWD_MAP[region];
    let regionYield = null;          // 지역 임대수익률(%) — 실거래 매매가·임대료로 계산. 표본 없으면 null
    let pricePerPyeong = null;  // 3.3㎡당 매매 평균(만원) — 실거래. 표본 없으면 null
    let realtimeSampleSize = null;

    // MOLIT 실거래로 평당가·수익률 직접 산출 (폴백 수치 없음)
    try {
      const realtimeRes = await fetch("/api/market/regional-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawdCd, propTypes: ["apt"] }),
      });
      if (realtimeRes.ok) {
        const realtime = await realtimeRes.json();
        const apt = realtime?.types?.apt;
        if (apt?.avgPricePerPyeong > 0) {
          pricePerPyeong = apt.avgPricePerPyeong;
          realtimeSampleSize = apt.sampleSize;
        }
        if (apt?.yieldRate > 0) regionYield = apt.yieldRate;
      }
    } catch (e) {
      console.warn("지역 실거래 통계 조회 실패:", e.message);
    }

    const myArea = parseFloat(area);
    const myPyeong = myArea / 3.3058;

    try {
      // 국토부 실거래 임대 데이터 (월세 시세 파악)
      let allRents = [];
      await Promise.all(months.map(async ({ ym }) => {
        const res = await fetch(`/api/market/molit?type=apt_rent&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`);
        const d = await res.json();
        if (d.items) {
          d.items
            .filter(i => parseInt(String(i.monthlyRent || "0").replace(/,/g, ""), 10) > 0)
            .forEach(i => {
              allRents.push({
                monthly: parseInt(String(i.monthlyRent || "0").replace(/,/g, ""), 10),
                area: parseFloat(i.excluUseAr || "0"),
                deposit: parseInt((i.deposit || "0").replace(/,/g, "")),
                apt: i.aptNm || "",
                ym,
              });
            });
        }
      }));

      // 유사 면적 임대 시세 (±25%)
      const similarRents = allRents.filter(r => r.area > 0 && Math.abs(r.area - myArea) / myArea < 0.25);
      const rentVals = similarRents.map(r => r.monthly).sort((a, b) => a - b);
      const medianRent = rentVals[Math.floor(rentVals.length / 2)] || 0;
      const avgRent    = rentVals.length > 0 ? Math.round(rentVals.reduce((s, v) => s + v, 0) / rentVals.length) : 0;
      const p25Rent    = rentVals[Math.floor(rentVals.length * 0.25)] || 0;
      const p75Rent    = rentVals[Math.floor(rentVals.length * 0.75)] || 0;

      // ── 가치 추정 3가지 방법 ──────────────────────────
      // 1. 실거래 평당가 기준 (평당가 × 평수)
      const priceValue = pricePerPyeong ? Math.round(pricePerPyeong * myPyeong / 10000 * 10) / 10 : null; // 억

      // 2. 수익환원법 (임대수익률 역산)
      //    추정가 = 연간임대료 / 수익률
      const useRent = parseFloat(currentRent || medianRent || "0");
      const incomeValue = useRent > 0 && regionYield > 0
        ? Math.round((useRent * 10000 * 12) / (regionYield / 100) / 100000000 * 10) / 10
        : null;

      // 3. 실거래 임대 시세 기반 추정 (면적당 임대료 × 지역 수익률 역산)
      const rentPerSqm = avgRent > 0 ? avgRent / myArea : 0;
      const rentBasedValue = rentPerSqm > 0 && regionYield > 0
        ? Math.round((rentPerSqm * myArea * 10000 * 12) / (regionYield / 100) / 100000000 * 10) / 10
        : null;

      // 최종 추정 범위
      const estimates = [priceValue, incomeValue, rentBasedValue].filter(v => v !== null && v > 0);
      if (estimates.length === 0) {
        setError("이 지역은 최근 6개월 실거래 표본이 부족해 추정할 수 없습니다.");
        setLoading(false);
        return;
      }
      const low  = Math.round(Math.min(...estimates) * 0.92 * 10) / 10;
      const mid  = Math.round(estimates.reduce((s, v) => s + v, 0) / estimates.length * 10) / 10;
      const high = Math.round(Math.max(...estimates) * 1.08 * 10) / 10;

      // 내 수익률 계산
      const myRentVal = parseFloat(currentRent || "0");
      const impliedYield = myRentVal > 0 && mid > 0
        ? (myRentVal * 10000 * 12 / (mid * 100000000) * 100).toFixed(2)
        : null;

      // 월별 임대 시세 추이 (해당 면적대)
      const monthlyRentTrend = months.map(({ ym, label }) => {
        const monthRents = allRents
          .filter(r => r.ym === ym && r.area > 0 && Math.abs(r.area - myArea) / myArea < 0.25)
          .map(r => r.monthly);
        const avg = monthRents.length > 0
          ? Math.round(monthRents.reduce((s, v) => s + v, 0) / monthRents.length)
          : null;
        return { label, avg, count: monthRents.length };
      }).filter(m => m.avg !== null);

      // 면적대별 임대 시세 분포
      const areaGroups = [
        { range: "~50㎡", min: 0, max: 50 },
        { range: "50~66㎡", min: 50, max: 66 },
        { range: "66~84㎡", min: 66, max: 84 },
        { range: "84~102㎡", min: 84, max: 102 },
        { range: "102㎡~", min: 102, max: 9999 },
      ].map(g => {
        const group = allRents.filter(r => r.area >= g.min && r.area < g.max);
        const avg = group.length > 0
          ? Math.round(group.reduce((s, r) => s + r.monthly, 0) / group.length)
          : 0;
        return { range: g.range, avg, count: group.length };
      }).filter(g => g.count > 0);

      setResult({
        priceValue, incomeValue, rentBasedValue,
        low, mid, high, impliedYield,
        regionYield, pricePerPyeong, realtimeSampleSize, methodCount: estimates.length,
        medianRent, avgRent, p25Rent, p75Rent,
        similarCount: similarRents.length, totalRents: allRents.length,
        monthlyRentTrend, areaGroups,
        myArea, myPyeong: Math.round(myPyeong * 10) / 10,
        useRent, region,
      });
    } catch (e) {
      console.error(e);
      setError("추정 중 오류: " + (e?.message || "알 수 없는 오류"));
    }
    setLoading(false);
  }, [region, area, currentRent]);

  return (
    <div style={{ padding: "28px 28px 80px", maxWidth: 960, margin: "0 auto", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>🏠 매물 가치 추정</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          국토부 실거래 기반 — 매매 평당가 · 수익환원법 · 임대 시세 교차 추정
        </p>
      </div>

      {/* 입력 */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px" }}>물건 정보 입력</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>지역</label>
            <select value={region} onChange={e => { setRegion(e.target.value); setResult(null); }}
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
            <input type="number" value={currentRent} onChange={e => setCurrentRent(e.target.value)} placeholder="수익률 역산에 활용"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>
        {/* 앱 세입자 빠른 선택 */}
        {tenants.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>내 물건에서 바로 선택</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tenants.slice(0, 5).map((t, i) => (
                <button key={i} onClick={() => setCurrentRent(String(t.rent || ""))}
                  style={{ padding: "5px 12px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border)", fontSize: 11, cursor: "pointer", color: "var(--text)", fontWeight: 600 }}>
                  {t.name} ({t.rent || 0}만원/월)
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

      {error && <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {result && (<>
        {/* 데이터 출처 */}
        <div style={{ background: "rgba(26,39,68,0.04)", border: "1px solid rgba(26,39,68,0.12)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
          <span style={{ fontSize: 16 }}>📌</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>추정 방법 및 데이터 출처</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
              <strong>① 실거래 평당가법:</strong> {result.pricePerPyeong
                ? <>국토부 아파트 매매 실거래 최근 6개월 평균 ({result.region} 3.3㎡당 {result.pricePerPyeong.toLocaleString()}만원, {result.realtimeSampleSize?.trade || 0}건)</>
                : <>매매 실거래 표본이 없어 계산하지 않았습니다</>}<br/>
              <strong>② 수익환원법:</strong> {result.regionYield
                ? <>입력한 월세 ÷ 지역 임대수익률 {result.regionYield}% (같은 기간 매매 평당가 대비 임대료로 계산, 보증금은 법정 전환율로 월세 환산)</>
                : <>지역 수익률을 계산할 표본이 없어 계산하지 않았습니다</>}<br/>
              <strong>③ 임대시세법:</strong> 국토부 실거래 최근 6개월 유사면적 임대 {result.similarCount}건의 평균 월세를 같은 수익률로 역산<br/>
              <span style={{ color: "#e8960a", fontSize: 10 }}>⚠️ 참고용 추정치이며 실제 매매가는 단지·동·층·향·노후도에 따라 달라집니다. 감정평가는 공인된 감정평가법인 상담을 권장합니다.</span>
            </p>
          </div>
        </div>

        {/* 가치 범위 */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>추정 시장가치 범위</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 20 }}>
            {result.region} · {result.myArea}㎡ ({result.myPyeong}평) · {result.methodCount}가지 방법 교차 추정
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "하단", value: result.low, sub: "보수적 추정", color: "#64748b" },
              { label: "중간 (추천)", value: result.mid, sub: "계산된 방법 평균", color: "#1a2744", highlight: true },
              { label: "상단", value: result.high, sub: "낙관적 추정", color: "#e8445a" },
            ].map((v, i) => (
              <div key={i} style={{
                textAlign: "center", padding: "20px 12px",
                background: v.highlight ? "linear-gradient(135deg,rgba(26,39,68,0.06),rgba(26,39,68,0.02))" : "var(--surface2)",
                borderRadius: 14, border: `2px solid ${v.highlight ? "rgba(26,39,68,0.2)" : "var(--border)"}`,
              }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{v.label}</div>
                <div style={{ fontSize: v.highlight ? 36 : 28, fontWeight: 900, color: v.color }}>{v.value}억</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{v.sub}</div>
              </div>
            ))}
          </div>

          {/* 3개 방법별 값 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "① 실거래 평당가법", value: result.priceValue, desc: result.pricePerPyeong ? `매매 실거래 ${result.pricePerPyeong.toLocaleString()}만/평 기준` : "매매 실거래 표본 없음" },
              { label: "② 수익환원법", value: result.incomeValue, desc: result.regionYield ? `지역 실거래 수익률 ${result.regionYield}% 적용` : "수익률 표본 없음" },
              { label: "③ 임대시세법", value: result.rentBasedValue, desc: `실거래 임대료 역산` },
            ].map((m, i) => (
              <div key={i} style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: m.value ? "var(--text)" : "var(--text-faint)" }}>
                  {m.value ? `${m.value}억` : "데이터 부족"}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{m.desc}</div>
              </div>
            ))}
          </div>

          {result.impliedYield && (
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(15,165,115,0.08)", border: "1px solid rgba(15,165,115,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>💰</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0fa573" }}>임대 수익률 {result.impliedYield}%</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  월 {result.useRent}만원 기준 · 추정 시가 {result.mid}억 대비{result.regionYield ? ` · 지역 실거래 수익률 ${result.regionYield}%와 비교` : ""}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2단 차트 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* 면적대별 월세 */}
          {result.areaGroups.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px 10px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>면적대별 평균 월세</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>국토부 실거래 · {result.region} · 최근 6개월</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={result.areaGroups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} unit="만" />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}
                    formatter={(v, n, p) => [`${v}만원 (${p.payload.count}건)`]} />
                  <Bar dataKey="avg" fill="#1a2744" radius={[5, 5, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 유사 면적 월세 추이 */}
          {result.monthlyRentTrend.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px 10px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>유사 면적 월세 추이</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>
                {result.myArea}㎡ ±25% 면적 · 최근 6개월 월평균
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.monthlyRentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} unit="만" domain={["auto","auto"]} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}
                    formatter={(v) => [`${v}만원`, "평균 월세"]} />
                  <Line type="monotone" dataKey="avg" stroke="#1a2744" strokeWidth={2.5}
                    dot={{ fill: "#1a2744", r: 4, strokeWidth: 0 }} name="avg" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 실거래 월세 요약 */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>
            실거래 임대 시세 요약 ({result.region} · {result.myArea}㎡ 유사 면적)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "중앙값 (Median)", value: `${result.medianRent}만원`, desc: "실거래 월세 중앙값" },
              { label: "평균", value: `${result.avgRent}만원`, desc: "유사면적 평균 월세" },
              { label: "하위 25% (Q1)", value: `${result.p25Rent}만원`, desc: "저렴한 매물 기준" },
              { label: "상위 25% (Q3)", value: `${result.p75Rent}만원`, desc: "비싼 매물 기준" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "14px 16px", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 14, lineHeight: 1.7 }}>
            ※ 유사 면적 ({result.myArea}㎡ ±25%) 기준 실거래 {result.similarCount}건 / 전체 {result.totalRents}건. 추정치는 참고용이며 법적 효력이 없습니다.
          </p>
        </div>
      </>)}

      {!result && !loading && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>지역과 면적을 입력하면 시가를 추정해요</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>국토부 실거래 기반 교차 추정 (참고용)</p>
        </div>
      )}
    </div>
  );
}
