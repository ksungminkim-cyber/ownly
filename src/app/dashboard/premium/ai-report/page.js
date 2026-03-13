"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = {
  navy: "#1a2744", navyLight: "#2d4270", purple: "#5b4fcf",
  emerald: "#0fa573", rose: "#e8445a", amber: "#e8960a",
  bg: "#f5f4f0", surface: "#ffffff", border: "#e8e6e0",
  muted: "#8a8a9a", faint: "#f8f7f4",
};

function ScoreRing({ score }) {
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 80 ? C.emerald : score >= 60 ? C.amber : C.rose;
  return (
    <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f0efe9" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.2s ease", strokeLinecap: "round" }} />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="22" fontWeight="900"
        style={{ transform: "rotate(90deg)", transformOrigin: "60px 60px" }}>
        {score}
      </text>
      <text x="60" y="76" textAnchor="middle" dominantBaseline="central"
        fill={C.muted} fontSize="10" fontWeight="600"
        style={{ transform: "rotate(90deg)", transformOrigin: "60px 60px" }}>
        /100
      </text>
    </svg>
  );
}

export default function AIReportPage() {
  const router = useRouter();
  const { tenants } = useApp();
  const [addr, setAddr] = useState(tenants[0]?.addr || "");
  const [propType, setPropType] = useState("주거");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const propTypes = ["주거", "상가", "오피스텔", "토지"];

  const generate = async () => {
    if (!addr.trim()) { setError("주소를 입력해주세요."); return; }
    setLoading(true); setError(""); setReport(null);
    try {
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, propertyType: propType }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setError("API 크레딧이 부족합니다. console.anthropic.com에서 충전 후 이용해주세요.");
        setLoading(false);
        return;
      }
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch (e) {
      setError(e.message || "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
    setLoading(false);
  };

  const gradeColor = (g) => ({ A: C.emerald, B: C.amber, C: "#e8960a", D: C.rose }[g] || C.muted);

  return (
    <div className="page-in page-padding" style={{ maxWidth: 800, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => router.back()}
          style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
          ← 대시보드로
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🤖</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: "-.4px" }}>AI 입지 분석 리포트</h1>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.purple, background: "rgba(91,79,207,0.1)", padding: "3px 8px", borderRadius: 6, letterSpacing: "0.5px" }}>PRO</span>
            </div>
            <p style={{ fontSize: 13, color: C.muted }}>주소를 입력하면 AI가 상권·학군·교통·수요를 분석합니다</p>
          </div>
        </div>
      </div>

      {/* 입력 카드 */}
      <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: "0 2px 12px rgba(26,39,68,0.06)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>분석 정보 입력</p>

        {/* 물건 유형 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {propTypes.map(t => (
            <button key={t} onClick={() => setPropType(t)}
              style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1.5px solid ${propType === t ? C.navy : C.border}`,
                background: propType === t ? C.navy : C.surface, color: propType === t ? "#fff" : C.muted,
                fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
              {t}
            </button>
          ))}
        </div>

        {/* 주소 입력 */}
        <div style={{ display: "flex", gap: 10 }}>
          <input value={addr} onChange={e => setAddr(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generate()}
            placeholder="예: 서울 강남구 역삼동 123-45, 합정동 맥클린사옥"
            style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${error ? C.rose : C.border}`,
              fontSize: 14, outline: "none", color: C.navy, background: C.faint, fontFamily: "inherit" }} />
          <button onClick={generate} disabled={loading}
            style={{ padding: "12px 24px", borderRadius: 12, background: loading ? "#8a8a9a" : "linear-gradient(135deg,#1a2744,#5b4fcf)",
              color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", minWidth: 90, transition: "all .2s" }}>
            {loading ? "분석 중…" : "분석하기"}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: C.rose, marginTop: 8, fontWeight: 600 }}>⚠️ {error}</p>}
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ background: C.surface, borderRadius: 20, padding: 48, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: "spin 2s linear infinite", display: "inline-block" }}>🤖</div>
          <p style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 8 }}>AI가 입지를 분석하고 있어요</p>
          <p style={{ fontSize: 13, color: C.muted }}>상권·학군·교통·수요를 종합 분석 중 (10~20초 소요)</p>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {/* 리포트 결과 */}
      {report && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 종합 스코어 카드 */}
          <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 20, padding: 28, display: "flex", alignItems: "center", gap: 24 }}>
            <ScoreRing score={report.score} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{addr}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", background: gradeColor(report.grade) + "33", padding: "4px 12px", borderRadius: 8, letterSpacing: "1px" }}>등급 {report.grade}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{propType} · AI 분석</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>💡 {report.summary}</p>
            </div>
          </div>

          {/* 섹션 분석 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {report.sections?.map((sec, i) => (
              <div key={i} style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(26,39,68,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{sec.icon}</span>
                  <p style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>{sec.title}</p>
                </div>
                <p style={{ fontSize: 13, color: "#4a4a6a", lineHeight: 1.7 }}>{sec.content}</p>
              </div>
            ))}
          </div>

          {/* 장단점 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "rgba(15,165,115,0.05)", border: `1px solid rgba(15,165,115,0.2)`, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.emerald, marginBottom: 12 }}>✅ 장점</p>
              {report.pros?.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: C.emerald, fontWeight: 700, flexShrink: 0 }}>•</span>
                  <p style={{ fontSize: 13, color: C.navy, lineHeight: 1.6 }}>{p}</p>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(232,68,90,0.05)", border: `1px solid rgba(232,68,90,0.2)`, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.rose, marginBottom: 12 }}>⚠️ 리스크</p>
              {report.cons?.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: C.rose, fontWeight: 700, flexShrink: 0 }}>•</span>
                  <p style={{ fontSize: 13, color: C.navy, lineHeight: 1.6 }}>{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 종합 의견 */}
          <div style={{ background: C.surface, border: `1.5px solid ${C.navy}22`, borderRadius: 16, padding: 22, boxShadow: "0 2px 12px rgba(26,39,68,0.06)" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.navy, marginBottom: 10 }}>📋 종합 의견</p>
            <p style={{ fontSize: 14, color: "#4a4a6a", lineHeight: 1.75 }}>{report.recommendation}</p>
          </div>

          {/* 다시 분석 */}
          <p style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>
            ※ AI 분석은 참고 목적이며, 실제 투자 판단은 전문가 상담을 권장합니다.
          </p>
        </div>
      )}
    </div>
  );
}
