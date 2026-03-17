"use client";
import { useState, useRef, useEffect } from "react";

const C = {
  navy: "#1a2744", border: "#e8e6e0", surface: "#ffffff",
  faint: "#f8f7f4", muted: "#8a8a9a", rose: "#e8445a",
};

export default function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder = "예: 서울 마포구 합정동, 강남구 역삼동 823",
  error,
  label,
  icon = "📍",
  style = {},
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q) => {
    if (q.length < 3) { setSuggestions([]); setShowDrop(false); return; }
    setSearching(true);
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
    setSearching(false);
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
    if (onSelect) onSelect(fullAddr, juso);
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
    <div ref={wrapRef} style={{ position: "relative", ...style }}>
      {label && (
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>
          {icon} {label}
        </p>
      )}
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDrop(true)}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: "100%", padding: "11px 38px 11px 13px",
            borderRadius: 10, fontSize: 13, outline: "none",
            color: C.navy, background: C.faint, boxSizing: "border-box",
            border: `1px solid ${error ? C.rose : showDrop ? C.navy : C.border}`,
            transition: "border .15s", fontFamily: "inherit",
          }}
        />
        {/* 스피너 or 클리어 버튼 */}
        {searching ? (
          <div style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, border: "2px solid #e8e6e0", borderTopColor: C.navy, borderRadius: "50%", animation: "addr-spin .6s linear infinite" }} />
        ) : value ? (
          <button onClick={() => { onChange(""); setSuggestions([]); setShowDrop(false); if (onSelect) onSelect("", null); }}
            style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 15, padding: 2, lineHeight: 1 }}>
            ✕
          </button>
        ) : null}
      </div>

      {/* 드롭다운 */}
      {showDrop && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300,
          background: C.surface, border: `1.5px solid ${C.navy}22`, borderRadius: 12,
          boxShadow: "0 8px 28px rgba(26,39,68,0.14)", overflow: "hidden",
        }}>
          <div style={{ padding: "7px 13px 5px", fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "1px", borderBottom: `1px solid ${C.border}` }}>
            📍 도로명주소 {suggestions.length}건
          </div>
          {suggestions.map((juso, i) => (
            <div key={i} onMouseDown={() => handleSelect(juso)}
              onMouseEnter={() => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(-1)}
              style={{
                padding: "10px 14px", cursor: "pointer",
                background: i === activeIdx ? `${C.navy}08` : "transparent",
                borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : "none",
                transition: "background .1s",
              }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 2 }}>📌 {juso.roadAddr}</p>
              <p style={{ fontSize: 11, color: C.muted }}>{juso.jibunAddr} · {juso.zipNo}</p>
            </div>
          ))}
          <div style={{ padding: "5px 13px 7px", fontSize: 10, color: C.muted, borderTop: `1px solid ${C.border}` }}>
            ↑↓ 방향키 · Enter 선택 · Esc 닫기
          </div>
        </div>
      )}

      <style>{`@keyframes addr-spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}
