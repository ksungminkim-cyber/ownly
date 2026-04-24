"use client";
import { useState } from "react";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

// 공개 공실/수익 진단 페이지
// 주소 + 월세(옵션) 입력 → MOLIT + AI 분석 → 등급(A/B/C/D) + 공유 가능한 OG 이미지 URL

const TYPES = [
  { v: "주거", icon: "🏠" },
  { v: "상가", icon: "🏪" },
  { v: "오피스텔", icon: "🏢" },
  { v: "토지", icon: "🌳" },
];

export default function DiagnosePage() {
  const [addr, setAddr] = useState("");
  const [pType, setPType] = useState("주거");
  const [myRent, setMyRent] = useState("");
  const [areaPy, setAreaPy] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [report, setReport] = useState(null);

  const submit = async () => {
    if (!addr.trim()) { setErr("주소를 입력해주세요"); return; }
    setErr(""); setLoading(true); setReport(null);
    try {
      // lawdCd 추출
      let lawdCd = null;
      try {
        const geoRes = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr.trim() }),
        });
        const geoData = await geoRes.json();
        if (geoData.sigunguCode) lawdCd = geoData.sigunguCode;
      } catch {}

      const res = await fetch("/api/ai-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr.trim(), propertyType: pType, lawdCd, myRent, areaPyeong: areaPy }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 등급 산정 로직 (MOLIT 실데이터 존재 + 시장 포지션 기반)
      const score = calcScore(data);
      const grade = scoreToGrade(score);
      setReport({ ...data, score, grade });
    } catch (e) {
      setErr(e.message || "분석 중 오류가 발생했습니다");
    }
    setLoading(false);
  };

  const shareUrl = report
    ? `https://www.ownly.kr/diagnose?addr=${encodeURIComponent(addr)}&grade=${report.grade}&score=${report.score}&pType=${encodeURIComponent(pType)}`
    : "";
  const ogImageUrl = report
    ? `https://www.ownly.kr/api/og/diagnose?addr=${encodeURIComponent(addr)}&grade=${report.grade}&score=${report.score}&pType=${encodeURIComponent(pType)}`
    : "";

  const share = () => {
    if (!report) return;
    const title = `${addr} ${report.grade}등급 입지 진단`;
    if (navigator.share) {
      navigator.share({ title, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => alert("링크가 복사되었습니다")).catch(() => {});
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #ebe9e3", padding: "14px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#1a2744" }}>온리</span>
            <span style={{ fontSize: 11, color: "#8a8a9a" }}>| 무료 진단</span>
          </Link>
          <Link href="/login?mode=signup" style={{ padding: "7px 14px", background: "#1a2744", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>무료 시작 →</Link>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 56px" }}>
        <section style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#5b4fcf", letterSpacing: "1.5px", marginBottom: 6 }}>FREE DIAGNOSIS</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1a2744", lineHeight: 1.3 }}>내 물건 등급 즉시 진단</h1>
          <p style={{ fontSize: 13, color: "#6a6a7a", marginTop: 6, lineHeight: 1.7 }}>
            주소만 넣으면 국토부 실거래 + AI 분석으로 <b>입지 등급(A~D)</b>·시장 포지션·공실 리스크를 즉시 확인합니다.
            카카오톡 공유로 친구와 비교해보세요.
          </p>
        </section>

        {/* 입력 폼 */}
        <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "22px 24px", marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6a6a7a", marginBottom: 6 }}>유형</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TYPES.map(t => (
                <button key={t.v} onClick={() => setPType(t.v)}
                  style={{ padding: "8px 14px", borderRadius: 9, border: `2px solid ${pType === t.v ? "#5b4fcf" : "#ebe9e3"}`, background: pType === t.v ? "rgba(91,79,207,0.08)" : "transparent", color: pType === t.v ? "#5b4fcf" : "#8a8a9a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {t.icon} {t.v}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6a6a7a", marginBottom: 6 }}>주소 *</label>
            <input value={addr} onChange={e => setAddr(e.target.value)} placeholder="예: 서울 마포구 합정동 123"
              style={{ width: "100%", padding: "12px 14px", fontSize: 14, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6a6a7a", marginBottom: 6 }}>현재 월세 (만원) <span style={{ color: "#8a8a9a", fontWeight: 500 }}>선택</span></label>
              <input type="number" value={myRent} onChange={e => setMyRent(e.target.value)} placeholder="120"
                style={{ width: "100%", padding: "11px 13px", fontSize: 14, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6a6a7a", marginBottom: 6 }}>전용면적 (평) <span style={{ color: "#8a8a9a", fontWeight: 500 }}>선택</span></label>
              <input type="number" value={areaPy} onChange={e => setAreaPy(e.target.value)} placeholder="20"
                style={{ width: "100%", padding: "11px 13px", fontSize: 14, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <button onClick={submit} disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: 10, background: loading ? "#8a8a9a" : "linear-gradient(135deg,#1a2744,#5b4fcf)", color: "#fff", fontSize: 14, fontWeight: 800, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "⏳ 실거래 + AI 분석 중..." : "🎯 지금 진단받기"}
          </button>
          {err && <p style={{ marginTop: 10, fontSize: 12, color: "#e8445a", fontWeight: 600 }}>{err}</p>}
        </section>

        {/* 결과 */}
        {report && (
          <>
            {/* 메인 등급 카드 */}
            <section style={{ background: "linear-gradient(135deg,#1a2744,#2d4270,#5b4fcf)", color: "#fff", borderRadius: 18, padding: "28px 28px", marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "1.5px", marginBottom: 8 }}>📍 {addr}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                <GradeCircle grade={report.grade} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: 4 }}>종합 점수</p>
                  <p style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{report.score}<span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)" }}>/100</span></p>
                  <p style={{ fontSize: 13, marginTop: 6, color: "rgba(255,255,255,0.85)" }}>
                    {gradeLabel(report.grade)}
                  </p>
                </div>
              </div>
              {report.dataNote && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", padding: "9px 13px", background: "rgba(255,255,255,0.08)", borderRadius: 8 }}>
                  {report.dataNote}
                </div>
              )}
            </section>

            {/* 세부 지표 */}
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
              <InfoCard label="시장 포지션" value={report.marketPosition || "적정"} color={positionColor(report.marketPosition)} />
              <InfoCard label="공실 리스크" value={report.vacancyRisk || "보통"} color={riskColor(report.vacancyRisk)} />
              <InfoCard label="가격 추세" value={report.priceTrend || "보합"} color="#5b4fcf" />
            </section>

            {report.rentRange && (
              <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "18px 22px", marginBottom: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 10 }}>💰 적정 월세 범위</h3>
                <p style={{ fontSize: 22, fontWeight: 900, color: "#1a2744" }}>
                  {report.rentRange.min}~{report.rentRange.max}<span style={{ fontSize: 14, color: "#8a8a9a", fontWeight: 600, marginLeft: 4 }}>만원/월</span>
                </p>
                {report.avgRent && <p style={{ fontSize: 12, color: "#8a8a9a", marginTop: 4 }}>평균 {report.avgRent}만원 · 보증금 {report.avgDeposit?.toLocaleString() || "-"}만원</p>}
              </section>
            )}

            {/* 공유 */}
            <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "20px 24px", marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 10 }}>📤 친구와 비교해보세요</p>
              <p style={{ fontSize: 12, color: "#6a6a7a", marginBottom: 12, lineHeight: 1.6 }}>공유 링크엔 {report.grade}등급 진단 카드가 카카오톡·SNS에 큰 이미지로 노출됩니다.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={share} style={{ padding: "10px 18px", borderRadius: 10, background: "#fee500", color: "#3c1e1e", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer" }}>💬 카톡·링크 공유</button>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${addr} ${report.grade}등급 입지 진단 결과`)}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding: "10px 18px", borderRadius: 10, background: "#000", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>𝕏 X 공유</a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding: "10px 18px", borderRadius: 10, background: "#1877f2", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>페이스북</a>
              </div>
            </section>

            {/* CTA */}
            <section style={{ background: "linear-gradient(135deg,#0fa573,#5b4fcf)", color: "#fff", borderRadius: 14, padding: "24px 26px" }}>
              <p style={{ fontSize: 17, fontWeight: 900, marginBottom: 8 }}>더 깊이있는 분석이 필요하다면</p>
              <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 16, lineHeight: 1.7 }}>내 물건 10개까지 상세 AI 진단, 실거래 평당 비교, 수익률 시뮬, 세금 계산까지.</p>
              <Link href="/login?mode=signup" style={{ display: "inline-block", padding: "11px 24px", background: "#fff", color: "#1a2744", borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                무료 30일 체험 시작 →
              </Link>
            </section>

            {/* 관련 도구 */}
            <section style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Link href="/sise" style={{ padding: "14px 16px", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, textDecoration: "none", color: "#1a2744" }}>
                <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>🗺️ 이 지역 전체 시세</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#5b4fcf" }}>전국 46개 지역 실거래 →</p>
              </Link>
              <Link href="/tools/yield" style={{ padding: "14px 16px", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, textDecoration: "none", color: "#1a2744" }}>
                <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>📊 수익률 계산</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#e8960a" }}>10년 시뮬레이션 →</p>
              </Link>
            </section>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function calcScore(data) {
  let score = 70; // 기본
  // 실거래 데이터 유무
  if (data.hasRealData) score += 5;
  // 시장 포지션 (-2~2 → -10~+10)
  if (typeof data.marketPositionScore === "number") score += data.marketPositionScore * 5;
  // 공실 리스크
  if (data.vacancyRisk === "낮음") score += 8;
  else if (data.vacancyRisk === "높음") score -= 10;
  // 가격 추세
  if (data.priceTrend === "상승") score += 5;
  else if (data.priceTrend === "하락") score -= 5;
  return Math.max(20, Math.min(100, Math.round(score)));
}
function scoreToGrade(s) {
  if (s >= 85) return "A";
  if (s >= 70) return "B";
  if (s >= 55) return "C";
  return "D";
}
function gradeLabel(g) {
  return { A: "최우수 입지 — 현재 전략 유지", B: "우수 입지 — 소폭 조정 권장", C: "보통 입지 — 전략 재검토 필요", D: "주의 입지 — 적극적 조정 필요" }[g] || "";
}
function GradeCircle({ grade }) {
  const colors = { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#ef4444" };
  return (
    <div style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: `3px solid ${colors[grade] || "#fff"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 44, fontWeight: 900, color: colors[grade] || "#fff" }}>{grade}</span>
    </div>
  );
}
function InfoCard({ label, value, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 11, padding: "14px 16px" }}>
      <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 900, color }}>{value}</p>
    </div>
  );
}
function positionColor(p) {
  return { 저평가: "#0fa573", 적정: "#5b4fcf", 고평가: "#e8445a" }[p] || "#5b4fcf";
}
function riskColor(r) {
  return { 낮음: "#0fa573", 보통: "#e8960a", 높음: "#e8445a" }[r] || "#8a8a9a";
}
