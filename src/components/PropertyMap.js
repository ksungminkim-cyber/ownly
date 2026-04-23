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
      existing.addEventListener("load", () => window.kakao.maps.load(() => resolve(window.kakao)));
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=clusterer&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    script.onerror = () => reject(new Error("Kakao SDK 로드 실패"));
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

        // 마커 생성 — 물건 유형별 색상
        const markers = valid.map(({ tenant, coord }) => {
          const pos = new kakao.maps.LatLng(coord.y, coord.x);
          bounds.extend(pos);

          const isVacant = tenant.status === "공실";
          const isUnpaid = tenant.status === "미납";
          const color = isVacant ? "#e8445a" : isUnpaid ? "#e8960a" : tenant.pType === "상가" ? "#e8960a" : tenant.pType === "토지" ? "#0d9488" : "#5b4fcf";

          const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'><path d='M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24c0-8.837-7.163-16-16-16z' fill='${color}'/><circle cx='16' cy='16' r='7' fill='white'/></svg>`;
          const markerImage = new kakao.maps.MarkerImage(
            "data:image/svg+xml;base64," + btoa(svg),
            new kakao.maps.Size(32, 40),
            { offset: new kakao.maps.Point(16, 40) }
          );

          const marker = new kakao.maps.Marker({ position: pos, image: markerImage });
          const infoHtml = `
            <div style="padding:8px 12px;font-size:12px;line-height:1.5;min-width:180px;">
              <div style="font-weight:800;color:#1a2744;margin-bottom:3px">${tenant.name || "세입자"}</div>
              <div style="color:#8a8a9a;font-size:11px;">${tenant.addr || ""}</div>
              <div style="color:${color};font-weight:700;margin-top:5px;">${isVacant ? "🚪 공실" : `월세 ${(tenant.rent || 0).toLocaleString()}만원`}</div>
            </div>`;
          const infowindow = new kakao.maps.InfoWindow({ content: infoHtml, removable: true });
          kakao.maps.event.addListener(marker, "click", () => infowindow.open(map, marker));
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
      <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>🗺️ 물건 지역 분포</p>
        <div style={{ padding: "24px", textAlign: "center", background: "#f8f7f4", borderRadius: 10 }}>
          <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7 }}>
            카카오 지도 키가 설정되지 않았습니다.<br/>
            <code style={{ background: "#eee", padding: "1px 6px", borderRadius: 4 }}>NEXT_PUBLIC_KAKAO_MAP_KEY</code> 를 Vercel 환경변수에 추가해주세요.
          </p>
        </div>
      </div>
    );
  }

  if (status === "empty") return null;

  return (
    <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px" }}>🗺️ 물건 지역 분포</p>
        <div style={{ display: "flex", gap: 10, fontSize: 10, flexWrap: "wrap" }}>
          {[
            { c: "#5b4fcf", l: "주거" },
            { c: "#e8960a", l: "상가·미납" },
            { c: "#0d9488", l: "토지" },
            { c: "#e8445a", l: "공실" },
          ].map(x => (
            <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: x.c }} />
              <span style={{ color: "#6a6a7a" }}>{x.l}</span>
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
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8445a", fontSize: 12 }}>
            ⚠️ {errorMsg}
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
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
          {summary.slice(0, 6).map(r => (
            <div key={r.region} style={{ background: "#f8f7f4", borderRadius: 8, padding: "8px 10px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#1a2744", marginBottom: 2 }}>📍 {r.region}</p>
              <p style={{ fontSize: 10, color: "#8a8a9a" }}>{r.count}건 · 월 {r.monthlyRent.toLocaleString()}만</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
