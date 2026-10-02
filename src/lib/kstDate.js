// 한국 시간 기준 날짜 문자열 — 날짜 입력 기본값·기록용.
// new Date().toISOString() 은 UTC 라서 한국 시간 00:00~08:59 에는 "어제" 날짜가 나온다
// (자정 넘어 납부 처리하면 납부일이 전날로 기록되던 문제). 브라우저·서버 시간대와 무관하게 KST 로 고정한다.
const KST_OFFSET_MS = 9 * 3600000;

/** 오늘 날짜 "YYYY-MM-DD" (KST) */
export function todayKST(now = new Date()) {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 현재 시각 "YYYY-MM-DDTHH:mm" (KST) — datetime-local 입력 기본값 */
export function nowKSTInput(now = new Date()) {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 16);
}
