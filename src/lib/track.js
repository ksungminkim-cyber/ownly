import { supabase } from "./supabase";

/**
 * 퍼널 이벤트 트래킹 — Supabase events 테이블에 기록.
 * 목적: "가입 후 재로그인·물건등록이 있었는지"를 데이터로 확인 (활성화 퍼널 계측).
 *
 * - fire-and-forget: 실패해도 앱 동작에 영향 없음 (마이그레이션 미실행 시에도 안전)
 * - 로그인 유저 이벤트만 기록 (RLS: auth.uid() = user_id)
 *   예외: tool_* 이벤트는 익명(user_id null)으로도 기록 — 무료 도구 퍼널용
 * - 조회는 관리자 패널 "퍼널" 탭 또는 docs/analytics-events.md 쿼리 참고
 *
 * 주요 이벤트: login / dashboard_view(일 1회) / property_added / sample_seeded /
 *             checkout_view / pay_click / signup_source(유저당 1회, 유입 경로) /
 *             tool_view / tool_cta_click(익명 가능) /
 *             certified_issued / portal_link_copied / sms_parse_used / upsell_click /
 *             checklist_done
 */

const ATTR_KEY = "ownly_attr";
const ANON_KEY = "ownly_anon_id";

function anonId() {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch { return null; }
}

export function track(event, props = {}) {
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id;
      if (!uid) {
        // 익명은 도구 이벤트만 (RLS 정책 events_insert_anon_tool 과 일치)
        if (!event.startsWith("tool_")) return;
        supabase.from("events").insert([{
          user_id: null, event, props: { ...props, anon_id: anonId() }, path,
        }]).then(() => {}, () => {});
        return;
      }
      supabase.from("events").insert([{ user_id: uid, event, props, path }]).then(() => {}, () => {});
    }).catch(() => {});
  } catch {}
}

/** localStorage 가드로 하루 1회만 기록 (예: dashboard_view) */
export function trackDaily(event, props = {}) {
  try {
    const key = `ownly_evt_${event}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
  } catch {}
  track(event, props);
}

/** 무료 도구 조회 (익명 가능, 브라우저당 도구별 하루 1회) */
export function trackTool(tool) {
  try {
    const key = `ownly_evt_tool_view_${tool}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
  } catch {}
  track("tool_view", { tool });
}

/** 무료 도구 → 가입 CTA 클릭 (익명 가능) */
export function trackToolCta(tool) {
  track("tool_cta_click", { tool });
}

/** 무료 도구의 핵심 행동을 익명 상태에서도 기록한다. */
export function trackToolAction(tool, action, props = {}) {
  track("tool_action", { tool, action, ...props });
}

/**
 * 유입 경로 캡처 — 첫 방문(first-touch) 기준으로 1회만 저장.
 * utm_* 파라미터와 첫 착지 경로를 localStorage 에 보관했다가
 * 가입 후 첫 대시보드 진입 시 signup_source 이벤트로 1회 전송한다.
 */
// 광고 플랫폼이 클릭 URL 에 자동으로 붙이는 값 — utm 을 안 붙인 광고도 "광고 유입"으로 구분된다.
// 구글: gclid·gbraid·wbraid / 네이버 검색광고: n_media·n_query·n_keyword·NaPm / 메타: fbclid / 카카오: kclid
function adInfo(p) {
  let ad = "";
  if (p.get("gclid") || p.get("gbraid") || p.get("wbraid")) ad = "google";
  else if (p.get("n_media") || p.get("n_query") || p.get("n_keyword") || p.get("NaPm")) ad = "naver";
  else if (p.get("fbclid")) ad = "meta";
  else if (p.get("kclid")) ad = "kakao";
  if (!ad) return null;
  // 검색어는 사용자가 친 말 그대로라 길이만 제한해 보관 (클릭 ID 자체는 저장하지 않는다)
  const kw = (p.get("n_query") || p.get("n_keyword") || p.get("utm_term") || "").slice(0, 60);
  return { ad, ad_kw: kw, ad_group: (p.get("n_ad_group") || "").slice(0, 40) };
}

// 광고 클릭으로 들어온 방문을 가입 여부와 상관없이 1건 남긴다 (브라우저·광고 플랫폼당 하루 1회).
// 가입 전 방문자는 익명이라 RLS 가 이름이 tool_ 로 시작하는 이벤트만 받는다 — 그래서 이름이 tool_ad_landing 이다.
// 관리자 패널 퍼널 탭의 "광고 클릭" 표가 이 이벤트를 읽는다 (광고 클릭 수 → 가입 수 비교, 자동 추적 URL 동작 확인).
function trackAdLanding(ad, p) {
  try {
    const key = `ownly_evt_ad_${ad.ad}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
  } catch {}
  track("tool_ad_landing", {
    ad: ad.ad,
    kw: ad.ad_kw,
    bid_kw: (p.get("n_keyword") || "").slice(0, 60), // 입찰 키워드 (kw 는 실제 검색어)
    rank: (p.get("n_rank") || "").slice(0, 4),
    landing: window.location.pathname,
  });
}

export function captureAttribution() {
  try {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const ad = adInfo(p);
    if (ad) trackAdLanding(ad, p);
    const saved = localStorage.getItem(ATTR_KEY);
    if (saved) {
      // 첫 방문 기록은 유지하되, 나중에 광고를 눌러 다시 들어온 경우 광고 정보만 보탠다
      if (ad) {
        const prev = JSON.parse(saved);
        if (!prev.ad) localStorage.setItem(ATTR_KEY, JSON.stringify({ ...prev, ...ad, ad_landing: window.location.pathname }));
      }
      return;
    }
    const attr = {
      utm_source: p.get("utm_source") || "",
      utm_medium: p.get("utm_medium") || "",
      utm_campaign: p.get("utm_campaign") || "",
      utm_content: p.get("utm_content") || "",
      ref: p.get("ref") || "",
      landing: window.location.pathname,
      referrer: (document.referrer || "").slice(0, 200),
      at: new Date().toISOString(),
      ...(ad || {}),
    };
    // utm 이 없고 referrer 가 자기 사이트면 의미 없는 기록 — 그래도 landing 은 남긴다
    localStorage.setItem(ATTR_KEY, JSON.stringify(attr));
  } catch {}
}

export function getAttribution() {
  try { return JSON.parse(localStorage.getItem(ATTR_KEY) || "null"); } catch { return null; }
}

/** 로그인 유저당 1회 — 저장된 유입 경로를 signup_source 로 전송 */
export function trackSignupSourceOnce(uid) {
  if (!uid) return;
  try {
    const key = `ownly_attr_sent_${uid}`;
    if (localStorage.getItem(key)) return;
    const attr = getAttribution() || { landing: "(unknown)" };
    localStorage.setItem(key, "1");
    track("signup_source", attr);
  } catch {}
}
