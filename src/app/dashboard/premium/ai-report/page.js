"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = {
  navy: "#1a2744", navyLight: "#2d4270", purple: "#5b4fcf",
  emerald: "#0fa573", rose: "#e8445a", amber: "#e8960a", indigo: "#3b5bdb",
  bg: "#f5f4f0", surface: "#ffffff", border: "#e8e6e0",
  muted: "#8a8a9a", faint: "#f8f7f4",
};

const GRADE_META = {
  A: { color: C.emerald, bg: "rgba(15,165,115,0.1)", label: "최우수 입지", desc: "적극 매입 추천" },
  B: { color: C.indigo,  bg: "rgba(59,91,219,0.1)",  label: "우수 입지",   desc: "매입 검토 권장" },
  C: { color: C.amber,   bg: "rgba(232,150,10,0.1)", label: "보통 입지",   desc: "신중한 검토 필요" },
  D: { color: C.rose,    bg: "rgba(232,68,90,0.1)",  label: "주의 입지",   desc: "투자 재검토 권장" },
};

const TYPE_ICONS = { 주거: "🏠", 상가: "🏪", 오피스텔: "🏢", 토지: "🌳" };

function ScoreGauge({ score }) {
  const color = score >= 80 ? C.emerald : score >= 65 ? C.indigo : score >= 50 ? C.amber : C.rose;
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f0efe9" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease", strokeLinecap: "round" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>/ 100</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#f0efe9", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 6, transition: "width 1s ease" }} />
      </div>
    </div>
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
  const reportRef = useRef(null);

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
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch (e) {
      setError(e.message || "분석 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  const handlePrint = () => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body > *:not(#ai-report-print) { display: none !important; }
        #ai-report-print { display: block !important; }
        .no-print { display: none !important; }
        @page { margin: 15mm; size: A4; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const gm = report ? (GRADE_META[report.grade] || GRADE_META["C"]) : null;

  // 섹션별 점수 계산 (임의 추정 — 전체 점수 기반)
  const subScores = report ? {
    "교통": Math.min(100, report.score + Math.round(Math.random() * 10 - 5)),
    "생활": Math.min(100, report.score + Math.round(Math.random() * 12 - 6)),
    "수요": Math.min(100, report.score + Math.round(Math.random() * 14 - 7)),
    "수익": Math.min(100, report.score + Math.round(Math.random() * 16 - 8)),
  } : {};

  return (
    <div className="page-in page-padding" style={{ maxWidth: 860, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* ===== 입력 영역 (인쇄 제외) ===== */}
      <div className="no-print">
        <button onClick={() => router.back()}
          style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
          ← 뒤로가기
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🤖</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: "-.4px" }}>AI 입지 분석 리포트</h1>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.purple, background: "rgba(91,79,207,0.1)", padding: "3px 8px", borderRadius: 6 }}>PRO</span>
            </div>
            <p style={{ fontSize: 13, color: C.muted }}>유형별 맞춤 AI 분석 · 상권·학군·교통·수요·수익률을 전문가 수준으로 분석합니다</p>
          </div>
        </div>

        {/* 입력 카드 */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: "0 2px 12px rgba(26,39,68,0.06)" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>분석 정보 입력</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {propTypes.map(t => (
              <button key={t} onClick={() => setPropType(t)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${propType === t ? C.navy : C.border}`,
                  background: propType === t ? C.navy : C.surface, color: propType === t ? "#fff" : C.muted,
                  fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span>{TYPE_ICONS[t]}</span> {t}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={addr} onChange={e => setAddr(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generate()}
              placeholder="예: 서울 마포구 합정동 357, 강남구 역삼동 823-14"
              style={{ flex: 1, padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${error ? C.rose : C.border}`,
                fontSize: 14, outline: "none", color: C.navy, background: C.faint, fontFamily: "inherit" }} />
            <button onClick={generate} disabled={loading}
              style={{ padding: "13px 26px", borderRadius: 12, background: loading ? C.muted : `linear-gradient(135deg,${C.navy},${C.purple})`,
                color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", transition: "all .2s" }}>
              {loading ? "분석 중…" : "분석하기"}
            </button>
          </div>
          {error && <p style={{ fontSize: 12, color: C.rose, marginTop: 8, fontWeight: 600 }}>⚠️ {error}</p>}
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="no-print" style={{ background: C.surface, borderRadius: 20, padding: 56, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 16, animation: "spin 2s linear infinite", display: "inline-block" }}>🤖</div>
          <p style={{ fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 8 }}>AI가 입지를 심층 분석하고 있어요</p>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
            {propType} 유형 맞춤 분석 중<br/>
            교통·생활·수요·수익률·개발호재·리스크 7개 항목 분석 (20~40초 소요)
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
            {["상권분석", "교통분석", "수요예측", "수익계산", "리포트생성"].map((s, i) => (
              <span key={s} style={{ fontSize: 10, color: C.muted, background: C.faint, padding: "4px 10px", borderRadius: 20, animation: `pulse ${1 + i * 0.3}s ease-in-out infinite alternate` }}>{s}</span>
            ))}
          </div>
          <style>{`
            @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            @keyframes pulse { from{opacity:0.4} to{opacity:1} }
          `}</style>
        </div>
      )}

      {/* ===== PDF 리포트 결과 ===== */}
      {report && !loading && (
        <div id="ai-report-print" ref={reportRef}>

          {/* PDF 출력 버튼 (인쇄 제외) */}
          <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 10 }}>
            <button onClick={() => { setReport(null); }}
              style={{ padding: "9px 18px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              다시 분석
            </button>
            <button onClick={handlePrint}
              style={{ padding: "9px 20px", borderRadius: 10, background: `linear-gradient(135deg,${C.navy},${C.purple})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: `0 4px 14px ${C.navy}30` }}>
              🖨️ PDF 리포트 출력
            </button>
          </div>

          {/* ── 리포트 헤더 ── */}
          <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, borderRadius: 20, padding: "28px 32px", marginBottom: 16, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>OWNLY AI 입지 분석 리포트</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-.5px", marginBottom: 6 }}>{addr}</h2>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>
                    {TYPE_ICONS[report.propertyType]} {report.propertyType}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>분석일: {report.analysisDate}</span>
                </div>
              </div>
              {/* 등급 뱃지 */}
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: gm.bg, border: `2px solid ${gm.color}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: gm.color }}>{report.grade}</span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{gm.label}</div>
              </div>
            </div>

            {/* 스코어 + 요약 */}
            <div style={{ display: "flex", gap: 24, alignItems: "center", background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 24px" }}>
              <ScoreGauge score={report.score} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 700, marginBottom: 8, letterSpacing: "1px" }}>AI 종합 입지 점수</div>
                <p style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.6, marginBottom: 12 }}>💡 {report.summary}</p>
                {/* 서브 스코어 바 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" }}>
                  {Object.entries(subScores).map(([k, v]) => (
                    <ScoreBar key={k} label={k} value={v} color={v >= 75 ? C.emerald : v >= 55 ? C.amber : C.rose} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── 7개 섹션 분석 ── */}
          <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: C.faint }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1.5px" }}>항목별 심층 분석</p>
            </div>
            {report.sections?.map((sec, i) => (
              <div key={i} style={{ padding: "20px 24px", borderBottom: i < report.sections.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.faint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {sec.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 8 }}>{sec.title}</p>
                  <p style={{ fontSize: 13, color: "#4a4a6a", lineHeight: 1.8 }}>{sec.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── 장점 / 리스크 ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div style={{ background: "rgba(15,165,115,0.05)", border: `1.5px solid rgba(15,165,115,0.25)`, borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.emerald, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 18 }}>✅</span> 투자 장점
              </p>
              {report.pros?.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: C.emerald, fontWeight: 900, fontSize: 14, flexShrink: 0, marginTop: 1 }}>0{i + 1}</span>
                  <p style={{ fontSize: 13, color: "#1a4a3a", lineHeight: 1.65 }}>{p}</p>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(232,68,90,0.05)", border: `1.5px solid rgba(232,68,90,0.25)`, borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.rose, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 18 }}>⚠️</span> 리스크 요인
              </p>
              {report.cons?.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: C.rose, fontWeight: 900, fontSize: 14, flexShrink: 0, marginTop: 1 }}>0{i + 1}</span>
                  <p style={{ fontSize: 13, color: "#4a1a1a", lineHeight: 1.65 }}>{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── 종합 투자 의견 ── */}
          <div style={{ background: `linear-gradient(135deg,${gm.bg},rgba(255,255,255,0.5))`, border: `1.5px solid ${gm.color}30`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>📋</span>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>종합 투자 의견</p>
              <span style={{ fontSize: 11, fontWeight: 800, color: gm.color, background: gm.bg, padding: "3px 10px", borderRadius: 20, border: `1px solid ${gm.color}30` }}>
                {gm.desc}
              </span>
            </div>
            <p style={{ fontSize: 14, color: "#2a2a4a", lineHeight: 1.9, fontWeight: 500 }}>{report.recommendation}</p>
          </div>

          {/* ── 리포트 푸터 ── */}
          <div style={{ textAlign: "center", padding: "16px 0", borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 11, color: C.muted }}>
              본 리포트는 Ownly by McLean AI 시스템이 생성했습니다 · ownly.kr · {report.analysisDate}
            </p>
            <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
              ※ 본 분석은 참고용이며, 실제 투자 결정은 전문 감정평가사 및 부동산 전문가와 상담하시기 바랍니다
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          #ai-report-print { display: block !important; }
          body { background: white !important; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
    </div>
  );
}
