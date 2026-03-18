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
  const { tenants, checkAiUsage, recordAiUsage, userPlan } = useApp();
  const [activeTab, setActiveTab] = useState("location"); // location | pricing
  const [inputAddr, setInputAddr] = useState("");
  const [confirmedAddr, setConfirmedAddr] = useState("");
  const [propType, setPropType] = useState("주거");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const reportRef = useRef(null);
  const propTypes = ["주거", "상가", "오피스텔", "토지"];

  // 프라이싱 탭 전용 state
  const [pInputAddr, setPInputAddr] = useState("");
  const [pPropType, setPPropType] = useState("주거");
  const [pLoading, setPLoading]       = useState(false);
  const [pLoadingStep, setPLoadingStep] = useState(0); // 0=지역조회 1=실거래 2=AI분석
  const [pResult, setPResult]           = useState(null);
  const [pError, setPError]             = useState("");

  const generate = async () => {
    if (!inputAddr.trim()) { setError("주소를 입력해주세요."); return; }
    const usage = checkAiUsage("aiReport");
    if (!usage.allowed) {
      setError(`이번 달 AI 입지 분석을 ${usage.limit}회 모두 사용했습니다. 플랜을 업그레이드하세요.`);
      return;
    }
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
      await recordAiUsage("aiReport");
      await recordAiUsage("aiReport");
    } catch (e) {
      setError(e.message || "분석 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  const generatePricing = async () => {
    if (!pInputAddr.trim()) { setPError("주소를 입력해주세요."); return; }
    const usage = checkAiUsage("aiPricing");
    if (!usage.allowed) {
      setPError(`이번 달 AI 임대료 분석을 ${usage.limit}회 모두 사용했습니다. 플랜을 업그레이드하세요.`);
      return;
    }
    setPLoading(true); setPLoadingStep(0); setPError(""); setPResult(null);
    try {
      // 1단계: 지역 코드 추출
      setPLoadingStep(0);
      let lawdCd = null;
      try {
        const geoRes = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: pInputAddr.trim() }),
        });
        const geoData = await geoRes.json();
        if (geoData.sigunguCode) lawdCd = geoData.sigunguCode;
      } catch (e) {
        console.warn("법정동코드 추출 실패, AI 추정으로 진행:", e.message);
      }

      // 2단계: 실거래가 기반 AI 분석
      setPLoadingStep(1);
      const res = await fetch("/api/ai-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: pInputAddr.trim(), propertyType: pPropType, lawdCd }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPLoadingStep(2);
      setPResult(data);
      await recordAiUsage("aiPricing");
    } catch (e) {
      setPError(e.message || "분석 중 오류가 발생했습니다.");
    }
    setPLoading(false);
  };

  const handlePrint = () => {
    if (!report) return;
    try {
      const key = "ownly_ai_report_latest";
      localStorage.setItem(key, JSON.stringify(report));
      localStorage.setItem(key + "_addr", confirmedAddr);
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
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🤖</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: "-.4px" }}>AI 부동산 분석</h1>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.purple, background: "rgba(91,79,207,0.1)", padding: "3px 8px", borderRadius: 6 }}>PRO</span>
            </div>
            <p style={{ fontSize: 13, color: C.muted }}>입지 분석 · 적정 임대료 산출 · 투자 전략까지 AI가 전문가 수준으로 분석합니다</p>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, background: C.faint, borderRadius: 12, padding: 4 }}>
          {[
            { key: "location", icon: "🗺️", label: "입지 분석 리포트", desc: "상권·학군·교통·수요 종합 분석" },
            { key: "pricing",  icon: "💰", label: "적정 임대료 분석", desc: "시세 기반 적정 임대료 산출" },
          ].map(tab => (
            <button key={tab.key} onClick={() => {
              setActiveTab(tab.key);
              // 탭 전환 시 반대 탭 결과 초기화
              if (tab.key === "pricing") { setReport(null); setError(""); }
              if (tab.key === "location") { setPResult(null); setPError(""); }
            }}
              style={{
                flex: 1, padding: "11px 16px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
                background: activeTab === tab.key ? "#fff" : "transparent",
                boxShadow: activeTab === tab.key ? "0 2px 8px rgba(26,39,68,0.1)" : "none",
                transition: "all .2s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{tab.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: activeTab === tab.key ? C.navy : C.muted }}>{tab.label}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{tab.desc}</p>
                </div>
                {(() => {
                  const featureKey = tab.key === "location" ? "aiReport" : "aiPricing";
                  const u = checkAiUsage(featureKey);
                  if (u.limit === Infinity) return <span style={{ fontSize: 10, color: C.emerald, background: "rgba(15,165,115,0.1)", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>무제한</span>;
                  if (u.limit === 0) return <span style={{ fontSize: 10, color: C.muted, background: "#f0efe9", padding: "2px 8px", borderRadius: 20 }}>PRO 전용</span>;
                  return <span style={{ fontSize: 10, color: u.allowed ? C.indigo : C.rose, background: u.allowed ? "rgba(59,91,219,0.1)" : "rgba(232,68,90,0.1)", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{u.used}/{u.limit}회</span>;
                })()}
              </div>
            </button>
          ))}
        </div>

        {/* ── 입지 분석 탭 입력 ── */}
        {activeTab === "location" && (
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
        )}

        {/* ── 프라이싱 탭 입력 ── */}
        {activeTab === "pricing" && (
          <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: "0 2px 12px rgba(26,39,68,0.06)" }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>임대료 분석 정보 입력</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {propTypes.map(t => (
                <button key={t} onClick={() => setPPropType(t)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${pPropType === t ? C.emerald : C.border}`, background: pPropType === t ? C.emerald : C.surface, color: pPropType === t ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, position: "relative" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span>{TYPE_ICONS[t]}</span> {t}
                  </div>
                  <span style={{ fontSize:8, fontWeight:600, opacity:0.7 }}>
                    {["주거","오피스텔"].includes(t) ? "전월세 실거래" : "매매가 역산"}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AddressInput value={pInputAddr} onChange={setPInputAddr} onSelect={(addr) => setPInputAddr(addr)} error={!!pError} />
              <button onClick={generatePricing} disabled={pLoading}
                style={{ padding: "13px 24px", borderRadius: 12, background: pLoading ? C.muted : `linear-gradient(135deg,${C.emerald},#059669)`, color: "#fff", border: "none", cursor: pLoading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", transition: "all .2s", flexShrink: 0, height: 50 }}>
                {pLoading ? "분석 중…" : "분석하기"}
              </button>
            </div>
            {pError && <p style={{ fontSize: 12, color: C.rose, marginTop: 8, fontWeight: 600 }}>⚠️ {pError}</p>}
            <p style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>💡 주소를 입력하면 해당 지역의 적정 임대료 범위와 시장 포지션을 AI가 분석합니다.</p>
          </div>
        )}
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

      {/* ── 프라이싱 로딩 ── */}
      {activeTab === "pricing" && pLoading && (
        <div style={{ background: C.surface, borderRadius: 20, padding: "44px 32px", border: `1px solid ${C.border}`, textAlign: "center" }}>
          {/* 메인 아이콘 */}
          <div style={{ fontSize: 48, marginBottom: 20, animation: "rot 2.5s linear infinite", display: "inline-block" }}>💰</div>
          <p style={{ fontSize: 18, fontWeight: 900, color: C.navy, marginBottom: 6 }}>적정 임대료 분석 중</p>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>{pInputAddr}</p>

          {/* 단계 표시 */}
          <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
            {[
              { step: 0, icon: "📍", label: "지역 코드 조회" },
              { step: 1, icon: "🏛️", label: "국토부 실거래가 수집" },
              { step: 2, icon: "🤖", label: "AI 분석 중" },
            ].map((s, i) => {
              const isDone    = pLoadingStep > s.step;
              const isActive  = pLoadingStep === s.step;
              const isPending = pLoadingStep < s.step;
              return (
                <div key={s.step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, marginBottom: 8, transition: "all .4s",
                      background: isDone ? C.emerald : isActive ? C.navy : "#f0efe9",
                      boxShadow: isActive ? `0 0 0 4px ${C.navy}22` : "none",
                      animation: isActive ? "pulse-ring 1.5s infinite" : "none",
                    }}>
                      {isDone ? "✓" : s.icon}
                    </div>
                    <p style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isDone ? C.emerald : isActive ? C.navy : C.muted, textAlign: "center", lineHeight: 1.4 }}>{s.label}</p>
                    {isActive && <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>진행 중...</p>}
                    {isDone && <p style={{ fontSize: 10, color: C.emerald, marginTop: 2 }}>완료</p>}
                  </div>
                  {i < 2 && (
                    <div style={{ height: 2, width: 32, flexShrink: 0, background: isDone ? C.emerald : "#e8e6e0", marginBottom: 28, transition: "background .4s" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* 단계별 설명 */}
          <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "12px 20px", display: "inline-block" }}>
            <p style={{ fontSize: 12, color: C.muted }}>
              {pLoadingStep === 0 && "주소에서 행정구역 코드를 추출하고 있어요"}
              {pLoadingStep === 1 && "국토교통부 실거래가 데이터를 수집하고 있어요 (최근 5개월)"}
              {pLoadingStep === 2 && "수집된 데이터를 AI가 분석하고 있어요 (20~40초 소요)"}
            </p>
          </div>

          <style>{`
            @keyframes pulse-ring {
              0%   { box-shadow: 0 0 0 0 rgba(26,39,68,0.3); }
              70%  { box-shadow: 0 0 0 10px rgba(26,39,68,0); }
              100% { box-shadow: 0 0 0 0 rgba(26,39,68,0); }
            }
          `}</style>
        </div>
      )}

      {/* ── 프라이싱 결과 ── */}
      {activeTab === "pricing" && pResult && !pLoading && (() => {
        const pos       = pResult.marketPosition || "적정";
        const posColor  = pos === "저평가" ? C.emerald : pos === "고평가" ? C.rose : C.amber;
        const trendColor = pResult.priceTrend === "상승" ? C.emerald : pResult.priceTrend === "하락" ? C.rose : C.amber;
        const vacColor   = pResult.vacancyRisk === "낮음" ? C.emerald : pResult.vacancyRisk === "높음" ? C.rose : C.amber;
        const score = pResult.marketPositionScore || 0;
        const TYPE_ICONS = { 주거:"🏠", 상가:"🏪", 오피스텔:"🏢", 토지:"🌳" };

        return (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <p style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:"1.5px", textTransform:"uppercase" }}>OWNLY AI 적정 임대료 분석 리포트</p>
                <p style={{ fontSize:13, color:C.muted }}>{pResult.address} · {pResult.analysisDate}</p>
              </div>
              <button onClick={() => { setPResult(null); setPInputAddr(""); }}
                style={{ padding:"9px 18px", borderRadius:10, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                다시 분석
              </button>
            </div>

            {/* ① 핵심 요약 헤더 */}
            <div style={{ background:`linear-gradient(135deg,${C.navy},#2d4270)`, borderRadius:20, padding:"24px 28px", marginBottom:14, color:"#fff" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontWeight:800, letterSpacing:"2px", color:"rgba(255,255,255,0.4)" }}>
                      {TYPE_ICONS[pResult.propertyType]} {pResult.propertyType} · AI 임대료 분석
                    </span>
                    {(() => {
                      const s = pResult.rawStats;
                      if (!pResult.hasRealData)
                        return <span style={{ fontSize:9, fontWeight:800, color:"#f87171", background:"rgba(248,113,113,0.2)", padding:"2px 8px", borderRadius:20 }}>✕ 실거래 없음 — AI 추정</span>;
                      if (s?.tradeCount > 0 && !s?.wolseCount)
                        return <span style={{ fontSize:9, fontWeight:800, color:"#fbbf24", background:"rgba(251,191,36,0.2)", padding:"2px 8px", borderRadius:20 }}>⚠ 매매가 역산 {s.count}건 — 전월세 미공개</span>;
                      return <span style={{ fontSize:9, fontWeight:800, color:"#4ade80", background:"rgba(74,222,128,0.2)", padding:"2px 8px", borderRadius:20 }}>✓ 전월세 실거래 {s?.count || 0}건</span>;
                    })()}
                  </div>
                  <p style={{ fontSize:15, fontWeight:800, lineHeight:1.6 }}>{pResult.marketSummary}</p>
                </div>
                <div style={{ textAlign:"center", flexShrink:0, marginLeft:20 }}>
                  <div style={{ fontSize:24, fontWeight:900, color:posColor }}>{pos}</div>
                  <div style={{ display:"flex", gap:3, marginTop:6, justifyContent:"center" }}>
                    {[-2,-1,0,1,2].map(i=>(
                      <div key={i} style={{ width:12,height:5,borderRadius:3, background:i<=score?posColor:"rgba(255,255,255,0.15)" }} />
                    ))}
                  </div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:4 }}>시장 포지션</div>
                </div>
              </div>

              {/* 핵심 수치 5개 */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
                {[
                  { label:"월세 범위", value: (() => {
                    const mn = pResult.rentRange?.min, mx = pResult.rentRange?.max;
                    if (!mn && !mx) return "데이터 없음";
                    if (mn === mx) return `${mn?.toLocaleString()}만원`;
                    return `${mn?.toLocaleString()}~${mx?.toLocaleString()}만원`;
                  })(), sub:"월", color: (pResult.rentRange?.min||0) > 0 ? C.emerald : C.muted },
                  { label:"보증금 범위", value: (() => {
                    const mn = pResult.depositRange?.min, mx = pResult.depositRange?.max;
                    if (!mn && !mx) return "-";
                    if (mn === mx) return `${mn?.toLocaleString()}만원`;
                    return `${mn?.toLocaleString()}~${mx?.toLocaleString()}만원`;
                  })(), sub:"", color: (pResult.depositRange?.min||0) > 0 ? C.amber : C.muted },
                  { label:"평당 임대료", value: (() => {
                    // 우선순위: rawStats(실거래) > AI rentPerPy > comparables 역산
                    const fromStats = pResult.rawStats?.avgRentPerPy;
                    const fromAI    = pResult.rentPerPy;
                    const fromComps = (() => {
                      const valid = (pResult.comparables||[]).filter(x=>x.rent>0&&(x.areaPy||x.areaPyeong));
                      if (!valid.length) return null;
                      const vals = valid.map(x=>x.rent/(x.areaPy||x.areaPyeong));
                      return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10;
                    })();
                    const v = fromStats || (fromAI && fromAI < 200 ? fromAI : null) || fromComps;
                    return v ? `${v}만원` : "-";
                  })(), sub:"평당/월", color:"#a78bfa" },
                  { label:"㎡당 임대료", value: (() => {
                    const fromStats = pResult.rawStats?.avgRentPerPy;
                    const fromAI    = pResult.rentPerPy;
                    const fromComps = (() => {
                      const valid = (pResult.comparables||[]).filter(x=>x.rent>0&&(x.areaPy||x.areaPyeong));
                      if (!valid.length) return null;
                      const vals = valid.map(x=>x.rent/(x.areaPy||x.areaPyeong));
                      return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10;
                    })();
                    const py = fromStats || (fromAI && fromAI < 200 ? fromAI : null) || fromComps;
                    return py ? `${(py/3.306).toFixed(2)}만원` : "-";
                  })(), sub:"㎡당/월", color:"#60a5fa" },
                  { label:"평균 면적", value:`${pResult.avgArea || "-"}평`, sub:`(${pResult.avgArea ? Math.round(pResult.avgArea * 3.306) : "-"}㎡)`, color:"#fff" },
                ].map(k=>(
                  <div key={k.label} style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"14px 12px", textAlign:"center" }}>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginBottom:6 }}>{k.label}</p>
                    <p style={{ fontSize:14, fontWeight:900, color:k.color, lineHeight:1.2 }}>{k.value}</p>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:3 }}>{k.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ② 시세 구간 */}
            {pResult.priceRange && (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 22px", marginBottom:14 }}>
                <p style={{ fontSize:12, fontWeight:800, color:C.navy, letterSpacing:"1px", marginBottom:14 }}>📊 시세 구간 분석</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  {[
                    { label:"하한가", desc:pResult.priceRange?.low, color:C.emerald, bg:"rgba(15,165,115,0.06)", border:"rgba(15,165,115,0.2)" },
                    { label:"중간가", desc:pResult.priceRange?.mid, color:C.amber,   bg:"rgba(232,150,10,0.06)",  border:"rgba(232,150,10,0.2)" },
                    { label:"상한가", desc:pResult.priceRange?.high, color:C.rose,   bg:"rgba(232,68,90,0.06)",   border:"rgba(232,68,90,0.2)" },
                  ].map(r=>(
                    <div key={r.label} style={{ background:r.bg, border:`1px solid ${r.border}`, borderRadius:12, padding:"14px 16px" }}>
                      <p style={{ fontSize:11, fontWeight:800, color:r.color, marginBottom:6 }}>{r.label}</p>
                      <p style={{ fontSize:12, color:"#4a4a6a", lineHeight:1.7 }}>{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ③ 인근 유사 물건 비교 — 상세 */}
            {pResult.comparables?.length > 0 && (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden", marginBottom:14 }}>
                <div style={{ padding:"12px 20px", background:C.faint, borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <p style={{ fontSize:12, fontWeight:800, color:C.navy }}>🏘️ 인근 유사 물건 비교</p>
                  <p style={{ fontSize:11, color:C.muted }}>AI 추정 데이터 · 실제 공시와 차이 있을 수 있음</p>
                </div>
                {/* 테이블 헤더 */}
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1.5fr", gap:0, padding:"8px 20px", background:"#fafaf8", borderBottom:`1px solid ${C.border}` }}>
                  {["물건명·동", "면적", "층/건축년", "월세", "보증금", "평당/계약"].map(h=>(
                    <p key={h} style={{ fontSize:10, fontWeight:800, color:C.muted, letterSpacing:".5px" }}>{h}</p>
                  ))}
                </div>
                {pResult.comparables.map((comp, i) => {
                  const _py = comp.areaPy || comp.areaPyeong || (comp.areaSqm ? Math.round(comp.areaSqm/3.306*10)/10 : 0);
                  const rentPerPy = comp.rentPerPy || ((_py > 0 && comp.rent > 0) ? (comp.rent/_py).toFixed(1) : "-");
                  return (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1.5fr", gap:0, padding:"12px 20px", borderBottom: i < pResult.comparables.length-1 ? `1px solid ${C.border}` : "none", alignItems:"center" }}>
                      <div>
                        <p style={{ fontSize:12, fontWeight:700, color:C.navy }}>{comp.name || comp.type || "-"}</p>
                        <p style={{ fontSize:10, color:C.muted, marginTop:2 }}>{comp.dong}{comp.distance ? ` · ${comp.distance}` : ""}</p>
                        {comp.note && <p style={{ fontSize:10, color:C.muted }}>{comp.note}</p>}
                      </div>
                      <div>
                        <p style={{ fontSize:12, fontWeight:600, color:C.navy }}>{(comp.areaPy||comp.areaPyeong) ? `${comp.areaPy||comp.areaPyeong}평` : "-"}</p>
                        <p style={{ fontSize:10, color:C.muted }}>{(comp.areaSqm||comp.area) ? `${comp.areaSqm||comp.area}㎡` : ""}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:12, color:C.navy }}>{comp.floor ? (String(comp.floor).includes("층") ? comp.floor : comp.floor+"층") : "-"}</p>
                        <p style={{ fontSize:10, color:C.muted }}>{comp.builtYear ? comp.builtYear+"년" : ""}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:13, fontWeight:800, color:C.emerald }}>{comp.rent?.toLocaleString() || "-"}만원</p>
                        {comp.type && <p style={{ fontSize:9, fontWeight:700,
                          color: comp.type==="매매역산" ? C.amber : comp.type==="전세" ? "#3b5bdb" : C.emerald,
                          background: comp.type==="매매역산" ? "rgba(232,150,10,0.1)" : comp.type==="전세" ? "rgba(59,91,219,0.1)" : "rgba(15,165,115,0.1)",
                          padding:"1px 6px", borderRadius:10, display:"inline-block", marginTop:2
                        }}>{comp.type==="매매역산" ? "매매역산*" : comp.type}</p>}
                      </div>
                      <p style={{ fontSize:12, color:C.muted }}>{comp.deposit?.toLocaleString() || "-"}만원</p>
                      <div>
                        <div style={{ background:`${C.indigo}10`, borderRadius:8, padding:"3px 8px", marginBottom:3 }}>
                          <p style={{ fontSize:11, fontWeight:800, color:C.indigo }}>{rentPerPy}만원/평</p>
                        </div>
                        <p style={{ fontSize:10, color:C.muted }}>{comp.contract || ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ④ 전략 & 팁 */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:18 }}>
                <p style={{ fontSize:12, fontWeight:800, color:C.navy, marginBottom:10 }}>🎯 임대 전략 제안</p>
                <p style={{ fontSize:13, color:"#4a4a6a", lineHeight:1.85 }}>{pResult.strategy}</p>
              </div>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:18 }}>
                <p style={{ fontSize:12, fontWeight:800, color:C.navy, marginBottom:10 }}>💡 시장 정보</p>
                <div style={{ display:"flex", gap:16, marginBottom:10 }}>
                  <div>
                    <p style={{ fontSize:10, color:C.muted, marginBottom:3 }}>가격 추세</p>
                    <p style={{ fontSize:13, fontWeight:800, color:trendColor }}>{pResult.priceTrend}</p>
                  </div>
                  <div>
                    <p style={{ fontSize:10, color:C.muted, marginBottom:3 }}>공실 리스크</p>
                    <p style={{ fontSize:13, fontWeight:800, color:vacColor }}>{pResult.vacancyRisk}</p>
                  </div>
                </div>
                <p style={{ fontSize:12, color:"#4a4a6a", lineHeight:1.7, marginBottom:8 }}>{pResult.trendReason}</p>
                <div style={{ background:`${C.emerald}08`, border:`1px solid ${C.emerald}20`, borderRadius:10, padding:"8px 12px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.emerald, marginBottom:3 }}>🤝 협상 팁</p>
                  <p style={{ fontSize:12, color:"#4a4a6a" }}>{pResult.negotiationTip}</p>
                </div>
                <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>📅 {pResult.bestTiming}</p>
              </div>
            </div>

            {/* 데이터 한계 안내 */}
            {!pResult.hasRealData && (
              <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:14, padding:"16px 20px", marginBottom:14 }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ fontSize:20 }}>⚠️</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:800, color:"#b91c1c", marginBottom:6 }}>실거래가 데이터를 가져오지 못했습니다</p>
                    <p style={{ fontSize:12, color:"#7f1d1d", lineHeight:1.8, marginBottom:10 }}>
                      아래 수치는 AI가 일반 지식 기반으로 추정한 값입니다. 실제 시세와 크게 다를 수 있으므로 참고용으로만 활용하세요.
                    </p>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:"#b91c1c", background:"rgba(239,68,68,0.1)", padding:"3px 10px", borderRadius:20 }}>
                        💡 주거·오피스텔 유형은 실거래 데이터가 제공됩니다
                      </span>
                      {(pResult.propertyType === "상가" || pResult.propertyType === "토지") && (
                        <span style={{ fontSize:11, color:"#b45309", background:"rgba(251,191,36,0.15)", padding:"3px 10px", borderRadius:20 }}>
                          📋 {pResult.propertyType}는 전월세 실거래가 미공개 — 매매가 역산값
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {pResult.hasRealData && pResult.dataNote && (
              <div style={{ background:"rgba(59,91,219,0.04)", border:"1px solid rgba(59,91,219,0.15)", borderRadius:12, padding:"12px 16px", marginBottom:12, display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:16, flexShrink:0 }}>ℹ️</span>
                <p style={{ fontSize:12, color:"#3b5bdb", lineHeight:1.7 }}>{pResult.dataNote}</p>
              </div>
            )}

            <div style={{ textAlign:"center", padding:"12px 0", borderTop:`1px solid ${C.border}` }}>
              <p style={{ fontSize:10, color:C.muted }}>
                {pResult.hasRealData
                  ? `국토교통부 실거래가 ${pResult.dataCount || pResult.rawStats?.count || ""}건 기반 · Ownly AI 분석 · ${pResult.analysisDate}`
                  : `AI 추정 분석 (실거래가 데이터 없음) · Ownly AI · ${pResult.analysisDate}`
                }
              </p>
              <p style={{ fontSize:9, color:C.muted, marginTop:2 }}>※ 본 분석은 참고용이며 실제 거래 시 공인중개사 및 감정평가사와 반드시 상담하시기 바랍니다</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
