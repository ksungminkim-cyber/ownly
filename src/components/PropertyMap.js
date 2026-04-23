"use client";
import { useEffect, useRef, useState } from "react";

// 물건 지역 분포 지도 — Kakao Maps JS SDK 동적 로드
// 각 물건을 지오코딩해 지도에 마커 표시, 클러스터링 지원

const GEO_CACHE_KEY = "ownly_geocode_cache";
const GEO_TTL = 30 * 24 * 60 * 60 * 1000; // 30일

function loadKakaoSDK(appkey) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"));
    if (window.kakao && window.kakao.maps) { resolve(window.kakao); return; }
    const existing = document.getElementById("kakao-maps-sdk");
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.kakao?.maps) window.kakao.maps.load(() => resolve(window.kakao));
        else reject(new Error("Kakao SDK 초기화 실패 — JavaScript 키 확인 필요"));
      });
      existing.addEventListener("error", () => reject(new Error("카카오 SDK 차단됨 — 도메인 미등록 또는 네트워크 문제")));
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=clusterer&autoload=false`;
    script.onload = () => {
      if (window.kakao?.maps) window.kakao.maps.load(() => resolve(window.kakao));
      else reject(new Error("Kakao SDK 초기화 실패 — JavaScript 키 확인 필요"));
    };
    script.onerror = () => reject(new Error("카카오 SDK 차단됨 — 개발자콘솔 도메인 등록 확인"));
    // 타임아웃 (10초)
    setTimeout(() => {
      if (!window.kakao?.maps) reject(new Error("Kakao SDK 로드 타임아웃 — 도메인 등록 또는 키 확인"));
    }, 10000);
    document.head.appendChild(script);
  });
}

async function geocodeAddress(addr) {
  // localStorage 캐시
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const cached = all[addr];
    if (cached && Date.now() - cached.ts < GEO_TTL) {
      return cached.coord;
    }
  } catch {}

  try {
    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: addr }),
    });
    const data = await res.json();
    if (!res.ok || !data.x || !data.y) return null;
    const coord = { x: Number(data.x), y: Number(data.y), sigunguName: data.sigunguName };
    try {
      const raw = localStorage.getItem(GEO_CACHE_KEY);
      const all = raw ? JSON.parse(raw) : {};
      all[addr] = { ts: Date.now(), coord };
      localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(all));
    } catch {}
    return coord;
  } catch {
    return null;
  }
}

export default function PropertyMap({ tenants = [] }) {
  const mapRef = useRef(null);
  const [status, setStatus] = useState("init");
  const [errorMsg, setErrorMsg] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    const appkey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (!appkey) {
      setStatus("no_key");
      setErrorMsg("카카오 지도 키가 설정되지 않았습니다 (NEXT_PUBLIC_KAKAO_MAP_KEY)");
      return;
    }

    if (tenants.length === 0) {
      setStatus("empty");
      return;
    }

    setStatus("loading");

    (async () => {
      try {
        const kakao = await loadKakaoSDK(appkey);
        if (!mounted) return;

        // 주소 지오코딩 (병렬)
        const coords = await Promise.all(
          tenants.map(async (t) => {
            if (!t.addr) return null;
            const c = await geocodeAddress(t.addr);
            return c ? { tenant: t, coord: c } : null;
          })
        );
        const valid = coords.filter(Boolean);
        if (!mounted) return;

        if (valid.length === 0) {
          setStatus("no_coords");
          setErrorMsg("주소를 좌표로 변환할 수 없었습니다");
          return;
        }

        // 지역별 집계 (요약용)
        const byRegion = {};
        valid.forEach(({ tenant, coord }) => {
          const region = coord.sigunguName || "기타";
          if (!byRegion[region]) byRegion[region] = { region, count: 0, monthlyRent: 0 };
          byRegion[region].count++;
          if (tenant.status !== "공실") byRegion[region].monthlyRent += Number(tenant.rent) || 0;
        });
        setSummary(Object.values(byRegion).sort((a, b) => b.count - a.count));

        // 지도 생성 (첫 좌표 중심)
        const center = new kakao.maps.LatLng(valid[0].coord.y, valid[0].coord.x);
        const map = new kakao.maps.Map(mapRef.current, { center, level: 7 });

        // bounds 계산해 모든 마커 보이도록 zoom 조정
        const bounds = new kakao.maps.LatLngBounds();

        // 클러스터러 생성
        const clusterer = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 4,
          disableClickZoom: false,
          styles: [{
            width: "48px", height: "48px",
            background: "rgba(91,79,207,0.88)", color: "#fff",
            borderRadius: "24px", textAlign: "center", lineHeight: "48px",
            fontSize: "14px", fontWeight: "800", border: "3px solid rgba(255,255,255,0.9)",
            boxShadow: "0 4px 16px rgba(26,39,68,0.3)",
          }],
        });

        // 현재 열린 오버레이 추적 (하나씩만 열리도록)
        let activeOverlay = null;

        // 마커 + CustomOverlay 생성
        const markers = valid.map(({ tenant, coord }) => {
          const pos = new kakao.maps.LatLng(coord.y, coord.x);
          bounds.extend(pos);

          const isVacant = tenant.status === "공실";
          const isUnpaid = tenant.status === "미납";
          const color = isVacant ? "#e8445a" : isUnpaid ? "#e8960a" : tenant.pType === "상가" ? "#e8960a" : tenant.pType === "토지" ? "#0d9488" : "#5b4fcf";
          const typeLabel = tenant.pType === "상가" ? "상가" : tenant.pType === "토지" ? "토지" : (tenant.sub || "주거");

          const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'><path d='M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24c0-8.837-7.163-16-16-16z' fill='${color}'/><circle cx='16' cy='16' r='7' fill='white'/></svg>`;
          const markerImage = new kakao.maps.MarkerImage(
            "data:image/svg+xml;base64," + btoa(svg),
            new kakao.maps.Size(32, 40),
            { offset: new kakao.maps.Point(16, 40) }
          );

          const marker = new kakao.maps.Marker({ position: pos, image: markerImage });

          // 커스텀 오버레이 — xAnchor/yAnchor로 위치 정렬 (transform 금지)
          const overlayDiv = document.createElement("div");
          overlayDiv.style.cssText = `position: relative; padding-bottom: 14px; pointer-events: auto;`;
          overlayDiv.innerHTML = `
            <div style="
              position: relative;
              background: #fff;
              border: 1px solid #e8e6e0;
              border-radius: 14px;
              box-shadow: 0 12px 32px rgba(26,39,68,0.18);
              min-width: 260px; max-width: 320px;
              font-family: 'Pretendard', 'DM Sans', -apple-system, sans-serif;
            ">
              <!-- 상단 컬러 바 -->
              <div style="height: 4px; background: ${color}; border-radius: 14px 14px 0 0;"></div>
              <!-- 닫기 버튼 -->
              <button class="ownly-overlay-close" style="
                position: absolute; top: 12px; right: 12px;
                width: 26px; height: 26px; border-radius: 8px;
                background: #f8f7f4; border: 1px solid #ebe9e3;
                cursor: pointer; font-size: 13px; color: #8a8a9a;
                display: flex; align-items: center; justify-content: center;
                font-weight: 700; line-height: 1;
              ">✕</button>
              <!-- 본문 -->
              <div style="padding: 16px 18px 14px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                  <span style="
                    font-size: 10px; font-weight: 800;
                    color: ${color}; background: ${color}18;
                    padding: 3px 8px; border-radius: 5px;
                    letter-spacing: 0.3px;
                  ">${isVacant ? "🚪 공실" : isUnpaid ? "⚠️ 미납" : typeLabel}</span>
                </div>
                <p style="
                  font-size: 15px; font-weight: 800; color: #1a2744;
                  margin: 0 0 4px; line-height: 1.3;
                ">${tenant.name || "미등록 세입자"}</p>
                <p style="
                  font-size: 12px; color: #6a6a7a; line-height: 1.5;
                  margin: 0 0 12px;
                ">${tenant.addr || ""}</p>
                <!-- 월세 + 보증금 박스 -->
                <div style="
                  background: #f8f7f4; border-radius: 10px;
                  padding: 10px 12px; display: flex;
                  justify-content: space-between; align-items: center;
                ">
                  ${isVacant ? `
                    <span style="font-size: 12px; color: #e8445a; font-weight: 700;">공실 상태 — 임차인 모집 중</span>
                  ` : `
                    <div>
                      <p style="font-size: 10px; color: #8a8a9a; font-weight: 700; margin: 0 0 2px;">월세</p>
                      <p style="font-size: 16px; font-weight: 900; color: #1a2744; margin: 0;">${(tenant.rent || 0).toLocaleString()}<span style="font-size: 11px; font-weight: 600; color: #8a8a9a;">만</span></p>
                    </div>
                    ${tenant.dep ? `
                    <div style="text-align: right;">
                      <p style="font-size: 10px; color: #8a8a9a; font-weight: 700; margin: 0 0 2px;">보증금</p>
                      <p style="font-size: 14px; font-weight: 800; color: #1a2744; margin: 0;">${(tenant.dep/10000).toFixed(1)}<span style="font-size: 11px; font-weight: 600; color: #8a8a9a;">억</span></p>
                    </div>
                    ` : ""}
                  `}
                </div>
              </div>
              <!-- 말풍선 꼬리 (카드 하단 중앙에서 아래로) -->
              <div style="
                position: absolute; left: 50%; bottom: -10px;
                transform: translateX(-50%);
                width: 0; height: 0;
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-top: 11px solid #fff;
                filter: drop-shadow(0 3px 3px rgba(26,39,68,0.15));
              "></div>
            </div>
          `;

          const overlay = new kakao.maps.CustomOverlay({
            position: pos,
            content: overlayDiv,
            xAnchor: 0.5,
            yAnchor: 1,
            zIndex: 3,
          });

          // 닫기 버튼 바인딩
          overlayDiv.querySelector(".ownly-overlay-close").addEventListener("click", (e) => {
            e.stopPropagation();
            overlay.setMap(null);
            if (activeOverlay === overlay) activeOverlay = null;
          });

          kakao.maps.event.addListener(marker, "click", () => {
            if (activeOverlay) activeOverlay.setMap(null);
            overlay.setMap(map);
            activeOverlay = overlay;
          });
          return marker;
        });

        clusterer.addMarkers(markers);
        if (valid.length > 1) map.setBounds(bounds);
        setStatus("ready");
      } catch (e) {
        if (mounted) {
          setStatus("error");
          setErrorMsg(e.message || "지도 로드 실패");
        }
      }
    })();

    return () => { mounted = false; };
  }, [tenants]);

  if (status === "no_key") {
    return (
      <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>🗺️ 물건 지역 분포</p>
        <div style={{ padding: "20px", background: "rgba(232,150,10,0.06)", border: "1px solid rgba(232,150,10,0.25)", borderRadius: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#e8960a", marginBottom: 8 }}>⚙️ 지도 기능 설정이 필요합니다</p>
          <ol style={{ fontSize: 11, color: "#6a6a7a", lineHeight: 1.9, paddingLeft: 18, marginBottom: 12 }}>
            <li><a href="https://developers.kakao.com/console/app" target="_blank" rel="noopener noreferrer" style={{ color: "#5b4fcf", fontWeight: 700 }}>카카오 개발자 콘솔</a> → 앱 선택 → <b>JavaScript 키</b> 복사</li>
            <li><b>앱 설정 → 플랫폼 → Web</b> → 사이트 도메인에 <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>https://www.ownly.kr</code> 등록</li>
            <li>Vercel 환경변수에 <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>NEXT_PUBLIC_KAKAO_MAP_KEY</code> 추가 후 재배포</li>
          </ol>
          <p style={{ fontSize: 10, color: "#8a8a9a", lineHeight: 1.6 }}>
            💡 주의: <b>REST API 키</b>가 아닌 <b>JavaScript 키</b>가 필요합니다 (클라이언트 사이드 사용).
          </p>
        </div>
      </div>
    );
  }

  if (status === "empty") return null;

  return (
    <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>🗺️ 물건 지역 분포</p>
        <div style={{ display: "flex", gap: 14, fontSize: 12, flexWrap: "wrap" }}>
          {[
            { c: "#5b4fcf", l: "주거" },
            { c: "#e8960a", l: "상가·미납" },
            { c: "#0d9488", l: "토지" },
            { c: "#e8445a", l: "공실" },
          ].map(x => (
            <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: x.c }} />
              <span style={{ color: "#4a5568", fontWeight: 600 }}>{x.l}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 지도 영역 */}
      <div ref={mapRef} style={{ width: "100%", height: 360, borderRadius: 10, background: "#f0efe9" }}>
        {(status === "loading" || status === "init") && (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a9a", fontSize: 12 }}>
            지도 불러오는 중...
          </div>
        )}
        {status === "error" && (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, padding: 20, textAlign: "center" }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#e8445a", marginBottom: 4 }}>{errorMsg}</p>
            <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.6 }}>
              카카오 개발자 콘솔 → 앱 설정 → 플랫폼 → Web에<br/>
              <code style={{ background: "#f0efe9", padding: "1px 5px", borderRadius: 3 }}>https://www.ownly.kr</code>, <code style={{ background: "#f0efe9", padding: "1px 5px", borderRadius: 3 }}>https://ownly.kr</code> 가 모두 등록돼있는지 확인하세요.
            </p>
            <a href="https://developers.kakao.com/console/app" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#5b4fcf", fontWeight: 700, marginTop: 4 }}>카카오 콘솔 열기 →</a>
          </div>
        )}
        {status === "no_coords" && (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a9a", fontSize: 12 }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* 지역별 요약 */}
      {summary && summary.length > 0 && (
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
          {summary.slice(0, 6).map(r => (
            <div key={r.region} style={{ background: "#f8f7f4", borderRadius: 10, padding: "11px 14px" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>📍 {r.region}</p>
              <p style={{ fontSize: 12, color: "#6a6a7a", fontWeight: 600 }}>{r.count}건 · 월 {r.monthlyRent.toLocaleString()}만</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
