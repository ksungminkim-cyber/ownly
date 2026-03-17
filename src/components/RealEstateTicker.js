"use client";
import { useState, useEffect, useRef } from "react";

const REAL_ESTATE_INDICES = [
  { name: "🇰🇷 서울 아파트",    value: "4.2억",    change: "+0.8%",  up: true,  url: "https://www.kbland.kr/map" },
  { name: "🇰🇷 KB주택가격",     value: "109.3",   change: "+0.3%",  up: true,  url: "https://www.kbland.kr/map" },
  { name: "🇰🇷 전세가율",       value: "68.2%",   change: "+0.4%",  up: true,  url: "https://www.reb.or.kr/r-one/statistics/statisticsViewer.do" },
  { name: "🇰🇷 월임대수익률",   value: "4.1%",    change: "-0.1%",  up: false, url: "https://www.reb.or.kr/r-one/statistics/statisticsViewer.do" },
  { name: "🇺🇸 케이스-실러",    value: "331.5",   change: "+4.2%",  up: true,  url: "https://www.spglobal.com/spdji/en/indices/indicators/sp-corelogic-case-shiller-us-national-home-price-nsa-index/" },
  { name: "🇺🇸 Zillow HVI",    value: "$361K",   change: "+2.1%",  up: true,  url: "https://www.zillow.com/research/data/" },
  { name: "🇺🇸 30년 모기지",    value: "6.65%",   change: "-0.12%", up: false, url: "https://www.freddiemac.com/pmms" },
  { name: "🇺🇸 NAR 주택판매",   value: "4.02M",   change: "+3.1%",  up: true,  url: "https://www.nar.realtor/research-and-statistics" },
  { name: "🇯🇵 도쿄 주택",      value: "¥5,280만", change: "+3.1%",  up: true,  url: "https://www.reinfolib.mlit.go.jp/" },
  { name: "🇬🇧 Nationwide HPI", value: "£265K",   change: "+3.9%",  up: true,  url: "https://www.nationwide.co.uk/about/house-price-index/house-price-index-results/" },
  { name: "🇩🇪 독일 부동산",    value: "€3,200",  change: "-1.2%",  up: false, url: "https://www.empirica-regio.de/" },
  { name: "🇦🇺 CoreLogic AU",   value: "A$802K",  change: "+4.7%",  up: true,  url: "https://www.corelogic.com.au/news-research/news/2024/home-value-index" },
  { name: "🇸🇬 싱가포르 PPI",   value: "180.4",   change: "+1.8%",  up: true,  url: "https://www.ura.gov.sg/Corporate/Property/Property-Data/Private-Residential-Properties" },
  { name: "🇨🇳 베이징 주택",    value: "¥71,000", change: "-2.3%",  up: false, url: "https://www.nbs.gov.cn/sj/" },
  { name: "🇭🇰 홍콩 주택",      value: "HK$1.4억", change: "-4.1%", up: false, url: "https://www.rvd.gov.hk/en/publications/pro-review.html" },
  { name: "🇮🇳 뭄바이 임대",    value: "₹45K",    change: "+6.3%",  up: true,  url: "https://www.magicbricks.com/property-trends" },
  { name: "🌏 글로벌 REIT",     value: "2,847",   change: "+1.4%",  up: true,  url: "https://www.ftserussell.com/products/indices/EPRA" },
];

const SPEED = 0.6; // px per frame

export default function RealEstateTicker() {
  const trackRef    = useRef(null);
  const posRef      = useRef(0);       // 현재 x 위치
  const pausedRef   = useRef(false);   // RAF 내부에서 읽을 pause 상태
  const rafRef      = useRef(null);
  const halfRef     = useRef(0);       // 반쪽 길이 (루프 기준점)

  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [paused, setPaused]         = useState(false);
  const lastUpdate = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  // 2배 복제로 끊김 없는 루프
  const items = [...REAL_ESTATE_INDICES, ...REAL_ESTATE_INDICES];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // 한 세트 너비 측정 (렌더 후)
    const measure = () => {
      halfRef.current = track.scrollWidth / 2;
    };
    measure();

    const tick = () => {
      if (!pausedRef.current) {
        posRef.current += SPEED;
        // 절반 지점(한 세트 끝)에 도달하면 리셋 → 이음새 없는 루프
        if (posRef.current >= halfRef.current) {
          posRef.current = 0;
        }
        if (track) {
          track.style.transform = `translateX(-${posRef.current}px)`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseEnter = () => {
    pausedRef.current = true;
    setPaused(true);
  };

  const handleMouseLeave = () => {
    pausedRef.current = false;
    setPaused(false);
    setHoveredIdx(null);
  };

  return (
    <div
      style={{
        width: "100%", background: "#0a0e1a", borderTop: "1px solid #1e2535",
        overflow: "hidden", display: "flex", alignItems: "center",
        height: 36, userSelect: "none", flexShrink: 0, position: "relative",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 왼쪽 고정 라벨 */}
      <div style={{
        padding: "0 14px", fontSize: 10, fontWeight: 800,
        letterSpacing: "1px", whiteSpace: "nowrap", borderRight: "1px solid #1e2535",
        height: "100%", display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        background: "#0d1220", zIndex: 2,
      }}>
        <span>🏠</span>
        <span style={{ color: "#4b6cb7" }}>REAL ESTATE</span>
      </div>

      {/* 스크롤 트랙 */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div ref={trackRef} style={{ display: "flex", alignItems: "center", width: "max-content", willChange: "transform" }}>
          {items.map((idx, i) => (
            <div
              key={i}
              onClick={() => window.open(idx.url, "_blank", "noopener,noreferrer")}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "0 18px", height: 36,
                borderRight: "1px solid #1e2535",
                whiteSpace: "nowrap", cursor: "pointer",
                transition: "background .15s",
                background: hoveredIdx === i ? "rgba(75,108,183,0.15)" : "transparent",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 11, color: "#8899bb", fontWeight: 500 }}>{idx.name}</span>
              <span style={{ fontSize: 12, color: "#cdd6f4", fontWeight: 700 }}>{idx.value}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: idx.up ? "#50fa7b" : "#ff5555" }}>
                {idx.up ? "▲" : "▼"} {idx.change}
              </span>
              {/* 호버 툴팁 */}
              {hoveredIdx === i && (
                <div style={{
                  position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
                  background: "#1e2535", border: "1px solid #2e3a55", borderRadius: 8,
                  padding: "6px 12px", fontSize: 11, color: "#cdd6f4", whiteSpace: "nowrap",
                  zIndex: 100, pointerEvents: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}>
                  🔗 클릭하면 상세 지수 페이지로 이동
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 — 시각 + 정지 표시 */}
      <div style={{
        padding: "0 12px", fontSize: 9, color: "#3d5a9e",
        borderLeft: "1px solid #1e2535", height: "100%",
        display: "flex", alignItems: "center", flexShrink: 0,
        background: "#0d1220", whiteSpace: "nowrap", gap: 6,
      }}>
        {paused && <span style={{ color: "#4b6cb7", fontSize: 9 }}>⏸</span>}
        <span>{lastUpdate} 기준</span>
      </div>
    </div>
  );
}
