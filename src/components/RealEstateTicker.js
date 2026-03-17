"use client";
import { useState } from "react";

const REAL_ESTATE_INDICES = [
  { name: "🇰🇷 서울 아파트", value: "4.2억", change: "+0.8%", up: true, url: "https://www.kbland.kr/map" },
  { name: "🇰🇷 KB주택가격", value: "109.3", change: "+0.3%", up: true, url: "https://www.kbland.kr/map" },
  { name: "🇰🇷 전세가율", value: "68.2%", change: "+0.4%", up: true, url: "https://www.reb.or.kr/r-one/statistics/statisticsViewer.do" },
  { name: "🇰🇷 월임대수익률", value: "4.1%", change: "-0.1%", up: false, url: "https://www.reb.or.kr/r-one/statistics/statisticsViewer.do" },
  { name: "🇰🇷 한국부동산원", value: "HPI", change: "+0.2%", up: true, url: "https://www.reb.or.kr" },
  { name: "🇺🇸 케이스-실러", value: "331.5", change: "+4.2%", up: true, url: "https://www.spglobal.com/spdji/en/indices/indicators/sp-corelogic-case-shiller-us-national-home-price-nsa-index/" },
  { name: "🇺🇸 Zillow HVI", value: "$361K", change: "+2.1%", up: true, url: "https://www.zillow.com/research/data/" },
  { name: "🇺🇸 30년 모기지", value: "6.65%", change: "-0.12%", up: false, url: "https://www.freddiemac.com/pmms" },
  { name: "🇺🇸 NAR 주택판매", value: "4.02M", change: "+3.1%", up: true, url: "https://www.nar.realtor/research-and-statistics" },
  { name: "🇯🇵 도쿄 주택", value: "¥5,280만", change: "+3.1%", up: true, url: "https://www.reinfolib.mlit.go.jp/" },
  { name: "🇬🇧 Nationwide HPI", value: "£265K", change: "+3.9%", up: true, url: "https://www.nationwide.co.uk/about/house-price-index/house-price-index-results/" },
  { name: "🇩🇪 독일 부동산", value: "€3,200", change: "-1.2%", up: false, url: "https://www.empirica-regio.de/" },
  { name: "🇦🇺 CoreLogic AU", value: "A$802K", change: "+4.7%", up: true, url: "https://www.corelogic.com.au/news-research/news/2024/home-value-index" },
  { name: "🇸🇬 싱가포르 PPI", value: "180.4", change: "+1.8%", up: true, url: "https://www.ura.gov.sg/Corporate/Property/Property-Data/Private-Residential-Properties" },
  { name: "🇨🇳 베이징 주택", value: "¥71,000", change: "-2.3%", up: false, url: "https://www.nbs.gov.cn/sj/" },
  { name: "🇭🇰 홍콩 주택", value: "HK$1.4억", change: "-4.1%", up: false, url: "https://www.rvd.gov.hk/en/publications/pro-review.html" },
  { name: "🇮🇳 뭄바이 임대", value: "₹45K", change: "+6.3%", up: true, url: "https://www.magicbricks.com/property-trends" },
  { name: "🌏 글로벌 REIT", value: "2,847", change: "+1.4%", up: true, url: "https://www.ftserussell.com/products/indices/EPRA" },
];

export default function RealEstateTicker() {
  const [paused, setPaused] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const lastUpdate = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  // 끊김없는 루프용 2배 복제
  const items = [...REAL_ESTATE_INDICES, ...REAL_ESTATE_INDICES];

  const handleClick = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      style={{
        width: "100%", background: "#0a0e1a", borderTop: "1px solid #1e2535",
        overflow: "hidden", display: "flex", alignItems: "center",
        height: 36, userSelect: "none", flexShrink: 0, position: "relative",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setTooltip(null); }}
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

      {/* 스크롤 영역 */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center",
          animation: paused ? "none" : "ticker-scroll 70s linear infinite",
          animationPlayState: paused ? "paused" : "running",
          width: "max-content",
        }}>
          {items.map((idx, i) => (
            <div
              key={i}
              onClick={() => handleClick(idx.url)}
              onMouseEnter={() => setTooltip(i)}
              onMouseLeave={() => setTooltip(null)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "0 18px", height: 36,
                borderRight: "1px solid #1e2535",
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "background .15s",
                background: tooltip === i ? "rgba(75,108,183,0.15)" : "transparent",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 11, color: "#8899bb", fontWeight: 500 }}>{idx.name}</span>
              <span style={{ fontSize: 12, color: "#cdd6f4", fontWeight: 700 }}>{idx.value}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: idx.up ? "#50fa7b" : "#ff5555" }}>
                {idx.up ? "▲" : "▼"} {idx.change}
              </span>
              {/* 호버 툴팁 */}
              {tooltip === i && (
                <div style={{
                  position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
                  background: "#1e2535", border: "1px solid #2e3a55", borderRadius: 8,
                  padding: "6px 12px", fontSize: 11, color: "#cdd6f4", whiteSpace: "nowrap",
                  zIndex: 100, pointerEvents: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                }}>
                  🔗 클릭하면 상세 지수 페이지로 이동
                  <div style={{
                    position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
                    width: 8, height: 8, background: "#1e2535",
                    borderRight: "1px solid #2e3a55", borderBottom: "1px solid #2e3a55",
                    rotate: "45deg",
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 — 업데이트 시각 + 일시정지 안내 */}
      <div style={{
        padding: "0 12px", fontSize: 9, color: "#3d5a9e",
        borderLeft: "1px solid #1e2535", height: "100%",
        display: "flex", alignItems: "center", flexShrink: 0,
        background: "#0d1220", whiteSpace: "nowrap", gap: 6,
      }}>
        {paused && <span style={{ color: "#4b6cb7", fontSize: 9 }}>⏸ 정지</span>}
        <span>{lastUpdate} 기준</span>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (max-width: 768px) {
          .ticker-label { display: none; }
        }
      `}</style>
    </div>
  );
}
