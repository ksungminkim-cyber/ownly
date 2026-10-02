// src/app/dashboard/market/vacancy-risk/page.js
"use client";
import { useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PlanGate from "../../../../components/PlanGate";

// 임대 수요 추이 (플러스 플랜)
// 국토부 아파트 전월세 실거래의 월별 신고 건수만으로 수요 흐름을 보여준다.
// 2026-10 이전에는 구별 "한국부동산원 공실률"·상업용 공실률을 코드에 직접 적어 표시했으나, R-ONE 은 주택 공실률을 작성하지 않고
// 상업용 공실률도 구가 아니라 시도·상권 단위로만 공표한다(출처를 댈 수 없는 수치) → 전부 제거. 공실률이 아니라 "거래량 추이"임을 화면에 명시한다.
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
  // 진행 중인 당월은 신고가 덜 들어와 거래량이 급감한 것처럼 보이므로 제외하고 직전 n개월을 본다
  for (let i = n; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      ym: `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return months;
}

// 최근 3개월 vs 이전 3개월 거래량 변화율로만 판정 (다른 가중치 없음)
function demandLabel(changePct) {
  if (changePct <= -15) return { label: "수요 감소", color: "#e11d48", bg: "#fff1f2", note: "임대 거래가 뚜렷하게 줄었습니다. 만기 물건은 공실 기간이 길어질 수 있습니다." };
  if (changePct < -5)   return { label: "약세",     color: "#d97706", bg: "#fffbeb", note: "임대 거래가 다소 줄었습니다." };
  if (changePct <= 5)   return { label: "보합",     color: "#0284c7", bg: "#f0f9ff", note: "임대 거래량이 이전 분기와 비슷합니다." };
  return { label: "수요 증가", color: "#0fa573", bg: "#f0fdf4", note: "임대 거래가 늘었습니다." };
}

export default function VacancyRiskPage() {
  return <PlanGate feature="vacancyLoss"><VacancyRiskContent /></PlanGate>;
}

function VacancyRiskContent() {
  const [region, setRegion] = useState("서울 강남구");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const analyze = useCallback(async () => {
    setLoading(true);
    setError("");
    setData(null);
    const months = getLastNMonths(12);
    const lawdCd = LAWD_MAP[region];

    try {
      // 건수는 국토부 totalCount(전체), 전세/월세 비율은 조회된 표본으로 추정
      const monthlyData = await Promise.all(
        months.map(async ({ ym, label }) => {
          const res = await fetch(`/api/market/molit?type=apt_rent&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=1000`);
          const d = await res.json();
          if (d.molitError || d.error) throw new Error(d.molitError || d.error); // 국토부 오류를 0건으로 위장하지 않는다
          const items = d.items || [];
          const totalCount = d.totalCount || items.length;
          const sampleJeonseRatio = items.length > 0
            ? items.filter(i => parseInt(String(i.monthlyRent || "0").replace(/,/g, ""), 10) === 0).length / items.length
            : 0.5;
          const jeonse = Math.round(totalCount * sampleJeonseRatio);
          return { label, ym, total: totalCount, jeonse, wolse: totalCount - jeonse };
        })
      );
      monthlyData.sort((a, b) => a.ym.localeCompare(b.ym));

      const totalTx = monthlyData.reduce((s, m) => s + m.total, 0);
      if (totalTx === 0) { setError("이 지역은 최근 12개월 아파트 임대 실거래 신고 내역이 없습니다."); setLoading(false); return; }

      const recent3avg = monthlyData.slice(-3).reduce((s, m) => s + m.total, 0) / 3;
      const prev3avg = monthlyData.slice(-6, -3).reduce((s, m) => s + m.total, 0) / 3;
      const changePct = prev3avg > 0 ? Math.round((recent3avg - prev3avg) / prev3avg * 1000) / 10 : 0;
      const totalJeonse = monthlyData.reduce((s, m) => s + m.jeonse, 0);
      const jeonseRatio = (totalJeonse / totalTx * 100).toFixed(1);
      const peak = monthlyData.reduce((a, b) => (b.total > a.total ? b : a));

      setData({ region, monthlyData, demand: demandLabel(changePct), recent3avg: Math.round(recent3avg), prev3avg: Math.round(prev3avg), changePct, jeonseRatio, totalTx, peak });
    } catch (e) {
      setError("국토부 실거래 조회 오류: " + (e?.message || "알 수 없는 오류"));
    }
    setLoading(false);
  }, [region]);

  return (
    <div style={{ padding: "28px 28px 80px", maxWidth: 960, margin: "0 auto", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>📉 임대 수요 추이</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>국토부 아파트 전월세 실거래 신고 건수 · 최근 12개월 (당월 제외)</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <select value={region} onChange={e => { setRegion(e.target.value); setData(null); }} style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 600 }}>
          {Object.keys(LAWD_MAP).map(k => <option key={k}>{k}</option>)}
        </select>
        <button onClick={analyze} disabled={loading} className="btn btn-fill">
          {loading ? "조회 중..." : "수요 추이 조회"}
        </button>
      </div>

      {error && <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {data && (<>
        <div style={{ background: "rgba(26,39,68,0.04)", border: "1px solid rgba(26,39,68,0.12)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
          📌 <strong>공실률이 아닙니다.</strong> 주택 공실률은 구 단위 공식 통계가 없어, 임대 거래 신고 건수의 증감을 수요 흐름의 참고 지표로 보여드립니다.
          신고 지연으로 최근 달은 이후 늘어날 수 있습니다. 출처: 국토교통부 실거래가 공개시스템 — {data.region} 아파트 전월세 {data.totalTx.toLocaleString()}건.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 20 }}>
          <div style={{ background: data.demand.bg, border: `2px solid ${data.demand.color}40`, borderRadius: 16, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: data.demand.color, marginBottom: 8 }}>최근 3개월 임대 거래량</div>
            <div className="num" style={{ fontSize: 44, fontWeight: 900, color: data.demand.color, lineHeight: 1 }}>{data.changePct >= 0 ? "+" : ""}{data.changePct}%</div>
            <div style={{ fontSize: 11, color: data.demand.color, opacity: 0.8, marginTop: 6 }}>이전 3개월 대비</div>
            <div style={{ marginTop: 12, padding: "6px 16px", borderRadius: 20, background: data.demand.color, color: "#fff", fontSize: 13, fontWeight: 800, display: "inline-block" }}>{data.demand.label}</div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.6 }}>{data.demand.note}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "최근 3개월 월평균", value: `${data.recent3avg.toLocaleString()}건`, sub: `이전 3개월 ${data.prev3avg.toLocaleString()}건` },
              { label: "12개월 총 임대거래", value: `${data.totalTx.toLocaleString()}건`, sub: "국토부 신고 기준" },
              { label: "전세 비중", value: `${data.jeonseRatio}%`, sub: "조회 표본 기준 추정" },
              { label: "거래 최다 월", value: data.peak.label, sub: `${data.peak.total.toLocaleString()}건` },
            ].map((c, i) => (
              <div key={i} className="stat">
                <div className="stat-label">{c.label}</div>
                <div className="stat-value num" style={{ fontSize: 20 }}>{c.value}</div>
                <div className="stat-sub">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px 10px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>12개월 임대 거래량 추이</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>거래가 많은 달이 수요 피크 — 계약 만기를 이 시기에 맞추면 공실 기간을 줄이는 데 유리합니다</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.monthlyData}>
              <defs>
                <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a2744" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1a2744" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} unit="건" />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }} formatter={(v, n) => [`${v.toLocaleString()}건`, n === "total" ? "전체" : n === "jeonse" ? "전세" : "월세"]} />
              <Area type="monotone" dataKey="total" stroke="#1a2744" strokeWidth={2} fill="url(#rentGrad)" name="total" />
              <Area type="monotone" dataKey="jeonse" stroke="#0fa573" strokeWidth={1.5} fill="none" name="jeonse" />
              <Area type="monotone" dataKey="wolse" stroke="#e8445a" strokeWidth={1.5} fill="none" name="wolse" />
            </AreaChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", marginTop: 8 }}>출처: 국토교통부 실거래가 공개시스템 · 전체(남색) · 전세(초록) · 월세(빨강)</p>
        </div>
      </>)}

      {!data && !loading && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📉</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>지역을 선택하고 임대 수요 추이를 조회하세요</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>국토부 실거래 신고 건수 기준</p>
        </div>
      )}
    </div>
  );
}
