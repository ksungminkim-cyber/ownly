// src/app/dashboard/market/vacancy-risk/page.js
"use client";
import { useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ ym, label });
  }
  return months;
}

function getRiskLevel(score) {
  if (score >= 75) return { label: "위험", color: "#e11d48", bg: "#fff1f2" };
  if (score >= 50) return { label: "주의", color: "#d97706", bg: "#fffbeb" };
  if (score >= 25) return { label: "보통", color: "#0284c7", bg: "#f0f9ff" };
  return { label: "안전", color: "#0fa573", bg: "#f0fdf4" };
}

export default function VacancyRiskPage() {
  const [region, setRegion] = useState("서울 강남구");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    const months = getLastNMonths(12);
    const lawdCd = LAWD_MAP[region];
    const monthly = [];

    try {
      await Promise.all(
        months.map(async ({ ym, label }) => {
          const [rentRes, tradeRes] = await Promise.all([
            fetch(`/api/market/molit?type=apt_rent&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`),
            fetch(`/api/market/molit?type=apt_trade&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`),
          ]);
          const [rentData, tradeData] = await Promise.all([rentRes.json(), tradeRes.json()]);

          const rentCount = rentData.items?.length || 0;
          const tradeCount = tradeData.items?.length || 0;

          // 전세 비중 (높을수록 임대 수요 높음 → 공실 위험 낮음)
          const jeonse = rentData.items?.filter(i => parseInt(i.monthlyRent || "0") === 0).length || 0;
          const wolse = rentCount - jeonse;

          monthly.push({ label, ym, rentCount, tradeCount, jeonse, wolse });
        })
      );

      monthly.sort((a, b) => a.ym.localeCompare(b.ym));

      // 공실 위험 지수 계산
      // - 거래량 감소 추세: 최근 3개월 vs 이전 3개월
      const recent3 = monthly.slice(-3).reduce((s, m) => s + m.rentCount, 0) / 3;
      const prev3 = monthly.slice(-6, -3).reduce((s, m) => s + m.rentCount, 0) / 3;
      const trendScore = prev3 > 0 ? Math.max(0, Math.min(50, ((prev3 - recent3) / prev3) * 100)) : 25;

      // 월세 비중 (높을수록 공실 위험 높음 — 전세 선호도가 높은 한국 시장 특성)
      const totalRent = monthly.reduce((s, m) => s + m.rentCount, 0);
      const totalWolse = monthly.reduce((s, m) => s + m.wolse, 0);
      const wolseRatio = totalRent > 0 ? totalWolse / totalRent : 0.5;
      const wolseScore = Math.min(50, wolseRatio * 60);

      const riskScore = Math.round(trendScore + wolseScore);
      const risk = getRiskLevel(riskScore);

      // 계절성 분석 (월별 평균)
      const byMonth = {};
      monthly.forEach(m => {
        const mo = m.ym.slice(4);
        if (!byMonth[mo]) byMonth[mo] = [];
        byMonth[mo].push(m.rentCount);
      });
      const seasonData = Object.entries(byMonth).map(([mo, counts]) => ({
        month: `${parseInt(mo)}월`,
        avg: Math.round(counts.reduce((s, v) => s + v, 0) / counts.length),
      })).sort((a, b) => parseInt(a.month) - parseInt(b.month));

      setData({ monthly, riskScore, risk, trendScore: Math.round(trendScore), wolseScore: Math.round(wolseScore), recent3: Math.round(recent3), prev3: Math.round(prev3), wolseRatio: (wolseRatio * 100).toFixed(1), seasonData });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [region]);

  return (
    <div style={{ padding: "28px 28px 80px", maxWidth: 920, margin: "0 auto", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>📉 공실 위험 지수</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>임대 거래량 추세 분석으로 공실 위험 사전 감지</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <select value={region} onChange={e => setRegion(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 600 }}>
          {Object.keys(LAWD_MAP).map(k => <option key={k}>{k}</option>)}
        </select>
        <button onClick={analyze} disabled={loading}
          style={{ padding: "9px 22px", borderRadius: 10, background: loading ? "#94a3b8" : "#1a2744", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "분석 중..." : "위험도 분석"}
        </button>
      </div>

      {data && (
        <>
          {/* 위험 지수 */}
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{ background: data.risk.bg, border: `2px solid ${data.risk.color}40`, borderRadius: 16, padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: data.risk.color, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>공실 위험 지수</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: data.risk.color, lineHeight: 1 }}>{data.riskScore}</div>
              <div style={{ fontSize: 11, color: data.risk.color, opacity: 0.7, marginTop: 4 }}>/100</div>
              <div style={{ marginTop: 12, padding: "6px 16px", borderRadius: 20, background: data.risk.color, color: "#fff", fontSize: 13, fontWeight: 800, display: "inline-block" }}>{data.risk.label}</div>
              {/* 게이지 바 */}
              <div style={{ marginTop: 16, height: 8, borderRadius: 4, background: "#e5e7eb", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${data.riskScore}%`, borderRadius: 4, background: `linear-gradient(90deg, #0fa573, ${data.riskScore > 50 ? "#e11d48" : "#d97706"})`, transition: "width 0.8s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-faint)", marginTop: 4 }}>
                <span>안전</span><span>위험</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "최근 3개월 월평균 거래", value: `${data.recent3}건`, sub: "임대 거래" },
                { label: "이전 3개월 월평균 거래", value: `${data.prev3}건`, sub: "비교 기준" },
                { label: "월세 비중", value: `${data.wolseRatio}%`, sub: "전세 선호도 역지표" },
                { label: "추세 위험점수", value: `${data.trendScore}pts`, sub: "거래량 감소 반영" },
              ].map((c, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 거래량 추세 차트 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px 10px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>12개월 임대 거래량 추세</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.monthly}>
                <defs>
                  <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a2744" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1a2744" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} unit="건" />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }} formatter={(v, n) => [`${v}건`, n === "rentCount" ? "전체 임대" : n === "jeonse" ? "전세" : "월세"]} />
                <Area type="monotone" dataKey="rentCount" stroke="#1a2744" strokeWidth={2} fill="url(#rentGrad)" name="rentCount" />
                <Area type="monotone" dataKey="jeonse" stroke="#0fa573" strokeWidth={1.5} fill="none" name="jeonse" />
                <Area type="monotone" dataKey="wolse" stroke="#e8445a" strokeWidth={1.5} fill="none" name="wolse" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 계절성 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px 10px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>월별 계절성 패턴</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>거래량이 많은 달 = 임대 수요 피크 → 만기 시점 맞추면 공실 위험 최소화</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.seasonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} unit="건" />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }} formatter={(v) => [`${v}건`]} />
                <Bar dataKey="avg" fill="#1a2744" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", marginTop: 8 }}>출처: 국토교통부 실거래가 공개시스템</p>
          </div>
        </>
      )}

      {!data && !loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📉</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>지역을 선택하고 공실 위험도를 분석하세요</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>임대 거래량 감소 추세와 월세 비중으로 위험도를 계산해요</p>
        </div>
      )}
    </div>
  );
}
