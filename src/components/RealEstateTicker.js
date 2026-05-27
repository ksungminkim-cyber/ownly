"use client";
import { useState, useEffect, useRef } from "react";

// 국토부 실거래 기반 지역 평균 월세 티커
// 마운트 시 핵심 지역의 /api/market/sigungu 응답을 받아 라이브 항목으로 표시.
// 페치 실패 시 fallback 으로 공식 출처 링크 모음만 표시합니다.

const LIVE_REGIONS = [
  { code: "11680", name: "서울 강남구", slug: "seoul-gangnam" },
  { code: "11440", name: "서울 마포구", slug: "seoul-mapo" },
  { code: "11710", name: "서울 송파구", slug: "seoul-songpa" },
  { code: "41130", name: "경기 성남시 분당", slug: "gyeonggi-bundang" },
  { code: "26350", name: "부산 해운대구", slug: "busan-haeundae" },
];

const REFERENCE_LINKS = [
  { name: "🇰🇷 KB부동산",         source: "KBland",      url: "https://www.kbland.kr/map" },
  { name: "🇰🇷 한국부동산원",     source: "R-ONE",       url: "https://www.reb.or.kr/r-one/" },
  { name: "🇰🇷 국토부 실거래가",  source: "MOLIT",       url: "https://rt.molit.go.kr/" },
  { name: "🇰🇷 한국은행 기준금리", source: "BOK",        url: "https://www.bok.or.kr/portal/main/contents.do?menuNo=200643" },
  { name: "🌏 글로벌 REIT",         source: "FTSE EPRA",   url: "https://www.ftserussell.com/products/indices/EPRA" },
];

const SPEED = 0.6; // px per frame

function fmtMan(n) {
  if (!n || isNaN(n)) return "-";
  if (n >= 10000) return `${(n / 10000).toFixed(1)}억`;
  return `${Math.round(n).toLocaleString()}만`;
}

export default function RealEstateTicker() {
  const trackRef    = useRef(null);
  const posRef      = useRef(0);       // 현재 x 위치
  const pausedRef   = useRef(false);   // RAF 내부에서 읽을 pause 상태
  const rafRef      = useRef(null);
  const halfRef     = useRef(0);       // 반쪽 길이 (루프 기준점)

  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [paused, setPaused]         = useState(false);
  const [liveItems, setLiveItems]   = useState([]); // [{ name, sub, value, deposit, count, slug }]
  const [updatedAt, setUpdatedAt]   = useState(null);

  // 국토부 실거래 5개 지역 라이브 페치 (24h CDN 캐시)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(LIVE_REGIONS.map(async (r) => {
          try {
            const res = await fetch("/api/market/sigungu", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lawdCd: r.code }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (!data || data.empty || data.error) return null;
            return {
              name: r.name,
              slug: r.slug,
              monthly: data.rent?.medianMonthly,
              deposit: data.rent?.medianDeposit,
              count: data.total?.rentTx,
              updatedAt: data.updatedAt,
            };
          } catch { return null; }
        }));
        if (cancelled) return;
        const ok = results.filter(Boolean);
        if (ok.length > 0) {
          setLiveItems(ok);
          const latestTs = ok.map(o => o.updatedAt).filter(Boolean).sort().pop();
          if (latestTs) setUpdatedAt(latestTs);
        }
      } catch { /* fallback to reference links */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // 라이브 항목이 있으면 라이브 + 출처를 함께, 없으면 출처만 표시
  const dynamicItems = liveItems.length > 0
    ? [
        ...liveItems.map(it => ({
          type: "live",
          name: `📍 ${it.name}`,
          source: `월세 중위 ${fmtMan(it.monthly)} · 보증금 ${fmtMan(it.deposit)} · ${it.count?.toLocaleString() || 0}건`,
          url: `/sise/${it.slug}`,
        })),
        ...REFERENCE_LINKS.map(l => ({ type: "ref", ...l })),
      ]
    : REFERENCE_LINKS.map(l => ({ type: "ref", ...l }));

  const items = [...dynamicItems, ...dynamicItems];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // 한 세트 너비 측정 (렌더 후, dynamicItems 변경 시 재측정)
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
  }, [liveItems.length]);

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
        {liveItems.length > 0 ? (
          <>
            <span className="pulse-dot" style={{ width: 7, height: 7 }} />
            <span style={{ color: "#4b6cb7" }}>LIVE · MOLIT</span>
          </>
        ) : (
          <>
            <span>🔗</span>
            <span style={{ color: "#4b6cb7" }}>REFERENCE INDICES</span>
          </>
        )}
      </div>

      {/* 스크롤 트랙 */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div ref={trackRef} style={{ display: "flex", alignItems: "center", width: "max-content", willChange: "transform" }}>
          {items.map((idx, i) => {
            const isLive = idx.type === "live";
            const open = () => {
              if (isLive) window.location.href = idx.url;
              else window.open(idx.url, "_blank", "noopener,noreferrer");
            };
            return (
              <div
                key={i}
                onClick={open}
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
                <span style={{ fontSize: 11, color: isLive ? "#cdd6f4" : "#8899bb", fontWeight: isLive ? 700 : 500 }}>{idx.name}</span>
                <span style={{ fontSize: 11, color: isLive ? "#50fa7b" : "#4b6cb7", fontWeight: 600 }}>· {idx.source}</span>
                <span style={{ fontSize: 11, color: "#3d5a9e" }}>{isLive ? "→" : "↗"}</span>
                {hoveredIdx === i && (
                  <div style={{
                    position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
                    background: "#1e2535", border: "1px solid #2e3a55", borderRadius: 8,
                    padding: "6px 12px", fontSize: 11, color: "#cdd6f4", whiteSpace: "nowrap",
                    zIndex: 100, pointerEvents: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                  }}>
                    {isLive ? "🔗 지역 시세 상세 보기" : "🔗 공식 출처 페이지로 이동"}
                  </div>
                )}
              </div>
            );
          })}
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
        {liveItems.length > 0 ? (
          <span>국토부 실거래 · {updatedAt ? new Date(updatedAt).toLocaleDateString("ko-KR") : "최근 3개월"}</span>
        ) : (
          <span>공식 출처 모음 · 클릭 시 이동</span>
        )}
      </div>
    </div>
  );
}
