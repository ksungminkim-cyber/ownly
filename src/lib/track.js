import { supabase } from "./supabase";

/**
 * 퍼널 이벤트 트래킹 — Supabase events 테이블에 기록.
 * 목적: "가입 후 재로그인·물건등록이 있었는지"를 데이터로 확인 (활성화 퍼널 계측).
 *
 * - fire-and-forget: 실패해도 앱 동작에 영향 없음 (마이그레이션 미실행 시에도 안전)
 * - 로그인 유저 이벤트만 기록 (RLS: auth.uid() = user_id)
 * - 조회는 Supabase SQL Editor에서 — docs/analytics-events.md 쿼리 참고
 *
 * 주요 이벤트: login / dashboard_view(일 1회) / property_added / sample_seeded /
 *             checkout_view / pay_click
 */
export function track(event, props = {}) {
  try {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id;
      if (!uid) return; // 익명 이벤트는 기록하지 않음
      supabase.from("events").insert([{
        user_id: uid,
        event,
        props,
        path: typeof window !== "undefined" ? window.location.pathname : null,
      }]).then(() => {}, () => {});
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
