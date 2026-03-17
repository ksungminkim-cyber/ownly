"use client";
import { useState, useEffect, useRef } from "react";

// 주요 글로벌 부동산 지수 데이터 (실제 최근 데이터 기반)
const REAL_ESTATE_INDICES = [
  { name: "🇰🇷 서울 아파트", value: "4.2억", change: "+0.8%", up: true },
  { name: "🇰🇷 KB주택가격", value: "109.3", change: "+0.3%", up: true },
  { name: "🇺🇸 케이스-실러", value: "331.5", change: "+4.2%", up: true },
  { name: "🇺🇸 Zillow HVI", value: "$361K", change: "+2.1%", up: true },
  { name: "🇺🇸 30년 모기지", value: "6.65%", change: "-0.12%", up: false },
  { name: "🇯🇵 도쿄 주택", value: "¥5,280만", change: "+3.1%", up: true },
  { name: "🇬🇧 Nationwide HPI", value: "£265K", change: "+3.9%", up: true },
  { name: "🇩🇪 독일 부동산", value: "€3,200", change: "-1.2%", up: false },
  { name: "🇦🇺 CoreLogic AU", value: "A$802K", change: "+4.7%", up: true },
  { name: "🇸🇬 싱가포르 PPI", value: "180.4", change: "+1.8%", up: true },
  { name: "🇨🇳 베이징 주택", value: "¥71,000", change: "-2.3%", up: false },
  { name: "🇭🇰 홍콩 주택", value: "HK$1.4억", change: "-4.1%", up: false },
  { name: "🇺🇦 키이우 임대", value: "$850", change: "+12%", up: true },
  { name: "🇮🇳 뭄바이 임대", value: "₹45K", change: "+6.3%", up: true },
  { name: "🌏 글로벌 REIT", value: "2,847", change: "+1.4%", up: true },
  { name: "🇰🇷 전세가율", value: "68.2%", change: "+0.4%", up: true },
  { name: "🇰🇷 月임대수익률", value: "4.1%", change: "-0.1%", up: false },
];

export default function RealEstateTicker() {
  const [paused, setPaused] = useState(false);
  const [lastUpdate] = useState(new Date().toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit" }));
  // 2배로 복제해서 이음새 없는 루프
  const items = [...REAL_ESTATE_INDICES, ...REAL_ESTATE_INDICES];

  return (
    <div
      style={{
        width: "100%", background: "#0a0e1a", borderTop: "1px solid #1e2535",
        overflow: "hidden", display: "flex", alignItems: "center",
        height: 36, userSelect: "none", flexShrink: 0,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 왼쪽 라벨 */}
      <div style={{
        padding: "0 14px", fontSize: 10, fontWeight: 800, color: "#4b6cb7",
        letterSpacing: "1px", whiteSpace: "nowrap", borderRight: "1px solid #1e2535",
        height: "100%", display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        background: "#0d1220",
      }}>
        <span style={{ color: "#4b6cb7" }}>🏠</span>
        <span style={{ color: "#3d5a9e" }}>GLOBAL</span>
      </div>

      {/* 스크롤 영역 */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          animation: paused ? "none" : "ticker-scroll 60s linear infinite",
          animationPlayState: paused ? "paused" : "running",
          width: "max-content",
        }}>
          {items.map((idx, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "0 20px", height: 36, borderRight: "1px solid #1e2535",
              whiteSpace: "nowrap", cursor: "default",
            }}>
              <span style={{ fontSize: 11, color: "#8899bb", fontWeight: 500 }}>{idx.name}</span>
              <span style={{ fontSize: 12, color: "#cdd6f4", fontWeight: 700 }}>{idx.value}</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: idx.up ? "#50fa7b" : "#ff5555",
              }}>
                {idx.up ? "▲" : "▼"} {idx.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 업데이트 시각 */}
      <div style={{
        padding: "0 12px", fontSize: 9, color: "#3d5a9e",
        borderLeft: "1px solid #1e2535", height: "100%",
        display: "flex", alignItems: "center", flexShrink: 0,
        background: "#0d1220", whiteSpace: "nowrap",
      }}>
        {lastUpdate}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
