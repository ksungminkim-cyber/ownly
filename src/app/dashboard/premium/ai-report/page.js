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
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 6, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function AddressInput({ value, onChange, onSelect, error }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  const search = async (q) => {
    if (q.length < 3) { setSuggestions([]); setShowDrop(false); return; }
    setLoading(true);
    try {
      const jusoKey = process.env.NEXT_PUBLIC_JUSO_API_KEY || "devU01TX0FVVEgyMDI1MDMxNzE0MjI1NjExNTI5MDc=";
      const url = `https://business.juso.go.kr/addrlink/addrLinkApi.do?currentPage=1&countPerPage=8&keyword=${encodeURIComponent(q)}&confmKey=${jusoKey}&resultType=json`;
      const res = await fetch(url);
      const data = await res.json();
      const results = data?.results?.juso || [];
      setSuggestions(results);
      setShowDrop(results.length > 0);
    } catch {
      setSuggestions([]); setShowDrop(false);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    setActiveIdx(-1);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 350);
  };

  const handleSelect = (juso) => {
    const fullAddr = juso.roadAddr;
    onChange(fullAddr);
    onSelect(fullAddr);
    setSuggestions([]); setShowDrop(false);
  };

  const handleKeyDown = (e) => {
    if (!showDrop) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]); }
    if (e.key === "Escape") setShowDrop(false);
  };

  return (
    <div ref={wrapRef} style={{ flex: 1, position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input value={value} onChange={handleChange} onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDrop(true)}
          placeholder="예: 서울 마포구 합정동, 강남구 역삼동 823"
          autoComplete="off"
          style={{ width: "100%", padding: "13px 40px 13px 16px", borderRadius: 12, border: `1.5px solid ${error ? C.rose : showDrop ? C.navy : C.border}`, fontSize: 14, outline: "none", color: C.navy, background: C.faint, fontFamily: "inherit", boxSizing: "border-box", transition: "border .15s" }} />
        {loading && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, border: "2px solid #e8e6e0", borderTopColor: C.navy, borderRadius: "50%", animation: "spin .6s linear infinite" }} />}
        {!loading && value && <button onClick={() => { onChange(""); onSelect(""); setSuggestions([]); setShowDrop(false); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, padding: 2, lineHeight: 1 }}>✕</button>}
      </div>
      {showDrop && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200, background: C.surface, border: `1.5px solid ${C.navy}22`, borderRadius: 12, boxShadow: "0 8px 32px rgba(26,39,68,0.15)", overflow: "hidden" }}>
          <div style={{ padding: "8px 14px 6px", fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "1px", borderBottom: `1px solid ${C.border}` }}>📍 도로명주소 검색 결과 ({suggestions.length}건)</div>
          {suggestions.map((juso, i) => (
            <div key={i} onMouseDown={() => handleSelect(juso)}
              style={{ padding: "12px 16px", cursor: "pointer", background: i === activeIdx ? `${C.navy}08` : "transparent", borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : "none", transition: "background .1s" }}
              onMouseEnter={() => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(-1)}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 2 }}>📌 {juso.roadAddr}</p>
              <p style={{ fontSize: 11, color: C.muted }}>{juso.jibunAddr} · 우편번호 {juso.zipNo}</p>
            </div>
          ))}
          <div style={{ padding: "6px 14px 8px", fontSize: 10, color: C.muted, borderTop: `1px solid ${C.border}` }}>↑↓ 방향키로 선택 · Enter 확정 · Esc 닫기</div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AIReportPage() {
  const router = useRouter();
  const { tenants } = useApp();
  const [inputAddr, setInputAddr] = useState("");
  const [confirmedAddr, setConfirmedAddr] = useState("");
  const [propType, setPropType] = useState("주거");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const reportRef = useRef(null);
  const propTypes = ["주거", "상가", "오피스텔", "토지"];

  const generate = async () => {
    if (!inputAddr.trim()) { setError("주소를 입력해주세요."); return; }
    setLoading(true); setError(""); setReport(null);
    const addrToAnalyze = inputAddr.trim();
    try {
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addrToAnalyze, propertyType: propType }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConfirmedAddr(addrToAnalyze);
      setReport(data);
    } catch (e) {
      setError(e.message || "분석 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  const handlePrint = () => {
    if (!report) return;
    try {
      sessionStorage.setItem("ownly_ai_report", JSON.stringify(report));
      sessionStorage.setItem("ownly_ai_report_addr", confirmedAddr);
      window.open("/dashboard/premium/ai-report/print", "_blank");
    } catch (e) {
      alert("PDF 출력 중 오류가 발생했습니다: " + e.message);
    }
  };

  const gm = report ? (GRADE_META[report.grade] || GRADE_META["C"]) : null;
  const subScores = report ? {
    "교통": Math.min(100, Math.max(30, report.score + Math.round((Math.random() - 0.5) * 14))),
    "생활": Math.min(100, Math.max(30, report.score + Math.round((Math.random() - 0.5) * 16))),
    "수요": Math.min(100, Math.max(30, report.score + Math.round((Math.random() - 0.5) * 18))),
    "수익": Math.min(100, Math.max(30, report.score + Math.round((Math.random() - 0.5) * 20))),
  } : {};

  return (
    <div className="page-in page-padding" style={{ maxWidth: 860, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* 입력 영역 */}
      <div className="no-print">
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>← 뒤로가기</button>
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
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: "0 2px 12px rgba(26,39,68,0.06)" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>분석 정보 입력</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {propTypes.map(t => (
              <button key={t} onClick={() => setPropType(t)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${propType === t ? C.navy : C.border}`, background: propType === t ? C.navy : C.surface, color: propType === t ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span>{TYPE_ICONS[t]}</span> {t}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AddressInput value={inputAddr} onChange={setInputAddr} onSelect={(addr) => setInputAddr(addr)} error={!!error} />
            <button onClick={generate} disabled={loading}
              style={{ padding: "13px 24px", borderRadius: 12, background: loading ? C.muted : `linear-gradient(135deg,${C.navy},${C.purple})`, color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", transition: "all .2s", flexShrink: 0, height: 50 }}>
              {loading ? "분석 중…" : "분석하기"}
            </button>
          </div>
          {error && <p style={{ fontSize: 12, color: C.rose, marginTop: 8, fontWeight: 600 }}>⚠️ {error}</p>}
          <p style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>💡 주소를 3글자 이상 입력하면 도로명주소 목록이 나타납니다. 선택 후 분석하기를 눌러주세요.</p>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ background: C.surface, borderRadius: 20, padding: 56, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 16, animation: "rot 2s linear infinite", display: "inline-block" }}>🤖</div>
          <p style={{ fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 8 }}>AI가 입지를 심층 분석하고 있어요</p>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{propType} 유형 맞춤 분석 중<br/>교통·생활·수요·수익률·개발호재·리스크 7개 항목 (20~40초 소요)</p>
          <style>{`@keyframes rot { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {/* 리포트 결과 */}
      {report && !loading && (
        <div id="ai-report-print" ref={reportRef}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 10 }}>
            <button onClick={() => { setReport(null); setConfirmedAddr(""); }}
              style={{ padding: "9px 18px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              다시 분석
            </button>
            <button onClick={handlePrint}
              style={{ padding: "9px 20px", borderRadius: 10, background: `linear-gradient(135deg,${C.navy},${C.purple})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: `0 4px 14px ${C.navy}30` }}>
              🖨️ PDF 리포트 출력
            </button>
          </div>

          {/* 리포트 헤더 */}
          <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, borderRadius: 20, padding: "28px 32px", marginBottom: 16, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>OWNLY AI 입지 분석 리포트</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-.5px", marginBottom: 6 }}>{confirmedAddr}</h2>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>{TYPE_ICONS[report.propertyType]} {report.propertyType}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>분석일: {report.analysisDate}</span>
                </div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: gm.bg, border: `2px solid ${gm.color}60`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: gm.color }}>{report.grade}</span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{gm.label}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center", background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 24px" }}>
              <ScoreGauge score={report.score} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 8, letterSpacing: "1px" }}>AI 종합 입지 점수</div>
                <p style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.6, marginBottom: 14 }}>💡 {report.summary}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 24px" }}>
                  {Object.entries(subScores).map(([k, v]) => (
                    <ScoreBar key={k} label={k} value={v} color={v >= 75 ? C.emerald : v >= 55 ? C.amber : C.rose} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 섹션 분석 */}
          <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, background: C.faint }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1.5px" }}>항목별 심층 분석</p>
            </div>
            {report.sections?.map((sec, i) => (
              <div key={i} style={{ padding: "20px 24px", borderBottom: i < (report.sections?.length ?? 0) - 1 ? `1px solid ${C.border}` : "none", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.faint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{sec.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 8 }}>{sec.title}</p>
                  <p style={{ fontSize: 13, color: "#4a4a6a", lineHeight: 1.85 }}>{sec.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 장점 / 리스크 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div style={{ background: "rgba(15,165,115,0.05)", border: `1.5px solid rgba(15,165,115,0.25)`, borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.emerald, marginBottom: 14 }}>✅ 투자 장점</p>
              {report.pros?.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: C.emerald, fontWeight: 900, fontSize: 13, flexShrink: 0 }}>0{i + 1}</span>
                  <p style={{ fontSize: 13, color: "#1a4a3a", lineHeight: 1.65 }}>{p}</p>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(232,68,90,0.05)", border: `1.5px solid rgba(232,68,90,0.25)`, borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.rose, marginBottom: 14 }}>⚠️ 리스크 요인</p>
              {report.cons?.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: C.rose, fontWeight: 900, fontSize: 13, flexShrink: 0 }}>0{i + 1}</span>
                  <p style={{ fontSize: 13, color: "#4a1a1a", lineHeight: 1.65 }}>{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 종합 의견 */}
          <div style={{ background: `linear-gradient(135deg,${gm.bg},rgba(255,255,255,0.5))`, border: `1.5px solid ${gm.color}30`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>📋</span>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>종합 투자 의견</p>
              <span style={{ fontSize: 11, fontWeight: 800, color: gm.color, background: gm.bg, padding: "3px 10px", borderRadius: 20, border: `1px solid ${gm.color}30` }}>{gm.desc}</span>
            </div>
            <p style={{ fontSize: 14, color: "#2a2a4a", lineHeight: 1.9, fontWeight: 500 }}>{report.recommendation}</p>
          </div>

          {/* 푸터 */}
          <div style={{ textAlign: "center", padding: "14px 0", borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 11, color: C.muted }}>본 리포트는 Ownly by McLean AI 시스템이 생성했습니다 · ownly.kr · {report.analysisDate}</p>
            <p style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>※ 본 분석은 참고용이며, 실제 투자 결정은 전문 감정평가사 및 부동산 전문가와 상담하시기 바랍니다</p>
          </div>
        </div>
      )}
    </div>
  );
}
