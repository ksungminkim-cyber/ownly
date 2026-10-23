"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

// 물건 지역 분포 지도 — Kakao Maps JS SDK 동적 로드
// 지도는 채도를 낮춰 바탕으로 깔고, 물건은 월세가 적힌 알약 마커로 표시한다.
// 오른쪽 지역 목록을 클릭하면 그 지역으로 지도가 이동한다.

const GEO_CACHE_KEY = "ownly_geocode_cache";
const GEO_TTL = 30 * 24 * 60 * 60 * 1000; // 30일

const COLOR = { 주거: "#1a2744", 상가: "#b45309", 토지: "#0f766e", 공실: "#d7263d" };

function loadKakaoSDK(appkey) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"));
    if (window.kakao && window.kakao.maps) {
      resolve(window.kakao);
      return;
    }
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
    setTimeout(() => {
      if (!window.kakao?.maps) reject(new Error("Kakao SDK 로드 타임아웃 — 도메인 등록 또는 키 확인"));
    }, 10000);
    document.head.appendChild(script);
  });
}

async function geocodeAddress(addr) {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const cached = all[addr];
    if (cached && Date.now() - cached.ts < GEO_TTL) return cached.coord;
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

// 월세가 적힌 알약 마커 (SVG → data URI). 한글이 섞여 btoa 대신 encodeURIComponent 를 쓴다.
function pillImage(kakao, label, color) {
  const w = Math.round(18 + [...label].reduce((s, ch) => s + (ch.charCodeAt(0) > 0x1100 ? 12 : 7.4), 0));
  const h = 26;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h + 7}' viewBox='0 0 ${w} ${h + 7}'>
<rect x='0.5' y='0.5' width='${w - 1}' height='${h - 1}' rx='13' fill='${color}' stroke='rgba(255,255,255,0.9)' stroke-width='1'/>
<path d='M${w / 2 - 5} ${h - 1} L${w / 2} ${h + 5} L${w / 2 + 5} ${h - 1} Z' fill='${color}'/>
<text x='${w / 2}' y='${h / 2 + 4.3}' text-anchor='middle' font-family='Pretendard, -apple-system, system-ui, sans-serif' font-size='12' font-weight='700' fill='#fff'>${label}</text>
</svg>`;
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  return new kakao.maps.MarkerImage(src, new kakao.maps.Size(w, h + 7), { offset: new kakao.maps.Point(w / 2, h + 6) });
}

function overlayCard(tenant, color, typeLabel) {
  const isVacant = tenant.status === "공실";
  const div = document.createElement("div");
  div.style.cssText = "position: relative; padding-bottom: 12px; pointer-events: auto;";
  div.innerHTML = `
    <div style="position:relative;background:#fff;border:1px solid #e8e6e0;border-radius:12px;box-shadow:0 12px 32px rgba(26,39,68,0.16);min-width:230px;max-width:300px;font-family:'Pretendard',-apple-system,sans-serif;padding:14px 16px 12px;">
      <button class="ownly-overlay-close" aria-label="닫기" style="position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:7px;background:#f8f7f4;border:1px solid #ebe9e3;cursor:pointer;font-size:12px;color:#8a8a9a;line-height:1;">✕</button>
      <span style="font-size:10px;font-weight:800;color:${color};background:${color}14;padding:3px 8px;border-radius:5px;">${isVacant ? "공실" : typeLabel}</span>
      <p style="font-size:14px;font-weight:800;color:#1a2744;margin:8px 0 2px;line-height:1.3;">${tenant.name || "미등록 세입자"}</p>
      <p style="font-size:12px;color:#6a6a7a;line-height:1.5;margin:0 0 10px;">${tenant.addr || ""}</p>
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-top:1px solid #f0efe9;padding-top:9px;">
        ${
          isVacant
            ? `<span style="font-size:12px;color:#d7263d;font-weight:700;">임차인 모집 중</span>`
            : `<span style="font-size:12px;color:#8a8a9a;">월세 <b style="font-size:15px;color:#1a2744;">${(tenant.rent || 0).toLocaleString()}</b>만</span>` +
              (tenant.dep ? `<span style="font-size:12px;color:#8a8a9a;">보증금 <b style="color:#1a2744;">${(tenant.dep / 10000).toFixed(1)}</b>억</span>` : "")
        }
      </div>
      <div style="position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:10px solid #fff;filter:drop-shadow(0 2px 2px rgba(26,39,68,0.12));"></div>
    </div>`;
  return div;
}

export default function PropertyMap({ tenants = [] }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const [status, setStatus] = useState(() => (process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ? "init" : "no_key"));
  const [errorMsg, setErrorMsg] = useState(() => (process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ? "" : "카카오 지도 키가 설정되지 않았습니다 (NEXT_PUBLIC_KAKAO_MAP_KEY)"));
  const [summary, setSummary] = useState(null);
  const [hot, setHot] = useState(null);

  useEffect(() => {
    let mounted = true;
    const appkey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appkey || tenants.length === 0) return;

    (async () => {
      try {
        const kakao = await loadKakaoSDK(appkey);
        if (!mounted) return;
        setStatus("loading");
        const coords = await Promise.all(
          tenants.map(async (t) => {
            if (!t.addr) return null;
            const c = await geocodeAddress(t.addr);
            return c ? { tenant: t, coord: c } : null;
          }),
        );
        const valid = coords.filter(Boolean);
        if (!mounted) return;
        if (valid.length === 0) {
          setStatus("no_coords");
          setErrorMsg("주소를 좌표로 변환할 수 없었습니다");
          return;
        }

        // 지역별 집계 — 목록 클릭 시 이동할 좌표(첫 물건)도 함께 보관
        const byRegion = {};
        valid.forEach(({ tenant, coord }) => {
          const region = coord.sigunguName || "기타";
          if (!byRegion[region]) byRegion[region] = { region, count: 0, vacant: 0, monthlyRent: 0, x: coord.x, y: coord.y };
          byRegion[region].count++;
          if (tenant.status === "공실") byRegion[region].vacant++;
          else byRegion[region].monthlyRent += Number(tenant.rent) || 0;
        });
        setSummary(Object.values(byRegion).sort((a, b) => b.monthlyRent - a.monthlyRent || b.count - a.count));

        const center = new kakao.maps.LatLng(valid[0].coord.y, valid[0].coord.x);
        const map = new kakao.maps.Map(mapRef.current, { center, level: 7 });
        mapObj.current = map;
        const bounds = new kakao.maps.LatLngBounds();

        const clusterer = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 4,
          disableClickZoom: false,
          styles: [
            {
              width: "44px",
              height: "44px",
              background: "rgba(26,39,68,0.92)",
              color: "#fff",
              borderRadius: "22px",
              textAlign: "center",
              lineHeight: "44px",
              fontSize: "13px",
              fontWeight: "800",
              border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: "0 6px 18px rgba(26,39,68,0.28)",
            },
          ],
        });

        let activeOverlay = null;
        const markers = valid.map(({ tenant, coord }) => {
          const pos = new kakao.maps.LatLng(coord.y, coord.x);
          bounds.extend(pos);
          const isVacant = tenant.status === "공실";
          const color = isVacant ? COLOR.공실 : tenant.pType === "상가" ? COLOR.상가 : tenant.pType === "토지" ? COLOR.토지 : COLOR.주거;
          const typeLabel = tenant.pType === "상가" ? "상가" : tenant.pType === "토지" ? "토지" : tenant.sub || "주거";
          const label = isVacant ? "공실" : `${Number(tenant.rent || 0).toLocaleString()}만`;

          const marker = new kakao.maps.Marker({ position: pos, image: pillImage(kakao, label, color), title: tenant.addr || "" });
          const overlayDiv = overlayCard(tenant, color, typeLabel);
          const overlay = new kakao.maps.CustomOverlay({ position: pos, content: overlayDiv, xAnchor: 0.5, yAnchor: 1.18, zIndex: 3 });
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
        if (valid.length > 1) map.setBounds(bounds, 48);
        setStatus("ready");
      } catch (e) {
        if (mounted) {
          setStatus("error");
          setErrorMsg(e.message || "지도 로드 실패");
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tenants]);

  const flyTo = (r) => {
    const kakao = window.kakao;
    const map = mapObj.current;
    if (!kakao || !map) return;
    setHot(r.region);
    map.panTo(new kakao.maps.LatLng(r.y, r.x));
    if (map.getLevel() > 6) map.setLevel(6, { animate: true });
  };

  if (status === "no_key") {
    return (
      <section className="surface-card" style={{ padding: "18px 20px", marginBottom: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>물건 지역 분포</p>
        <div style={{ padding: 20, background: "rgba(232,150,10,0.06)", border: "1px solid rgba(232,150,10,0.25)", borderRadius: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#e8960a", marginBottom: 8 }}>지도 기능 설정이 필요합니다</p>
          <ol style={{ fontSize: 11, color: "#6a6a7a", lineHeight: 1.9, paddingLeft: 18, marginBottom: 12 }}>
            <li>
              <a href="https://developers.kakao.com/console/app" target="_blank" rel="noopener noreferrer" style={{ color: "#5b4fcf", fontWeight: 700 }}>
                카카오 개발자 콘솔
              </a>{" "}
              → 앱 선택 → <b>JavaScript 키</b> 복사
            </li>
            <li>
              <b>앱 설정 → 플랫폼 → Web</b> → 사이트 도메인에{" "}
              <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>https://www.ownly.kr</code> 등록
            </li>
            <li>
              Vercel 환경변수에 <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>NEXT_PUBLIC_KAKAO_MAP_KEY</code> 추가 후 재배포
            </li>
          </ol>
          <p style={{ fontSize: 10, color: "#8a8a9a", lineHeight: 1.6 }}>
            주의: <b>REST API 키</b>가 아닌 <b>JavaScript 키</b>가 필요합니다 (클라이언트 사이드 사용).
          </p>
        </div>
      </section>
    );
  }

  if (tenants.length === 0) return null;

  const total = summary ? summary.reduce((s, r) => s + r.count, 0) : 0;

  return (
    <section className="surface-card" style={{ padding: "18px 20px", marginBottom: 14 }}>
      <style jsx>{`
        .map-grid { display: grid; grid-template-columns: minmax(0, 1fr) 224px; gap: 14px; }
        @media (max-width: 760px) { .map-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0, display: "inline-flex", alignItems: "center", gap: 7 }}>
          <MapPin size={15} strokeWidth={2.2} />
          물건 지역 분포
          {total > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{total}건 · {summary.length}개 지역</span>}
        </h3>
        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>마커를 누르면 물건 정보가 열립니다</span>
      </div>

      <div className="map-grid">
        <div className="map-shell" style={{ height: 360 }}>
          <div className="map-legend" aria-hidden>
            {[
              [COLOR.주거, "주거"],
              [COLOR.상가, "상가"],
              [COLOR.토지, "토지"],
              [COLOR.공실, "공실"],
            ].map(([c, l]) => (
              <span key={l}>
                <i style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
          <div ref={mapRef} className="map-canvas" />
          {(status === "loading" || status === "init") && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12 }}>
              지도를 불러오는 중
            </div>
          )}
          {status === "error" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
                padding: 20,
                textAlign: "center",
                background: "var(--surface2)",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "#e8445a", marginBottom: 4 }}>{errorMsg}</p>
              <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.6 }}>
                카카오 개발자 콘솔 → 앱 설정 → 플랫폼 → Web에
                <br />
                <code style={{ background: "#f0efe9", padding: "1px 5px", borderRadius: 3 }}>https://www.ownly.kr</code>,{" "}
                <code style={{ background: "#f0efe9", padding: "1px 5px", borderRadius: 3 }}>https://ownly.kr</code> 가 모두 등록돼있는지 확인하세요.
              </p>
              <a href="https://developers.kakao.com/console/app" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#5b4fcf", fontWeight: 700, marginTop: 4 }}>
                카카오 콘솔 열기 →
              </a>
            </div>
          )}
          {status === "no_coords" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12 }}>
              {errorMsg}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", margin: "2px 12px 6px" }}>지역별 · 월세 합계</p>
          {summary && summary.length > 0 ? (
            summary.slice(0, 8).map((r) => (
              <div key={r.region} className={`region-row${hot === r.region ? " is-hot" : ""}`} onClick={() => flyTo(r)} role="button" tabIndex={0}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.region}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                    {r.count}건{r.vacant > 0 ? ` · 공실 ${r.vacant}` : ""}
                  </p>
                </div>
                <span className="num" style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap" }}>
                  {r.monthlyRent.toLocaleString()}만
                </span>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "6px 12px" }}>좌표를 확인하는 중입니다</p>
          )}
        </div>
      </div>
    </section>
  );
}
