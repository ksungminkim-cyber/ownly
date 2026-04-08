// src/lib/notify.js
// 앱 내에서 이메일 알림을 보낼 때 호출하는 유틸

export async function sendNotify(type, userId, userEmail) {
  if (!userId || !userEmail) return;
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, userId, userEmail }),
    });
  } catch (e) {
    console.error("notify error:", e);
  }
}

// 미납 처리 후 호출 — payments 페이지에서 납부 취소 시
export const notifyUnpaid   = (uid, email) => sendNotify("unpaid",    uid, email);
// 만료 임박 — 대시보드 로드 시 한번 체크
export const notifyExpiring = (uid, email) => sendNotify("expiring",  uid, email);
// 매월 1일 수금 체크리스트
export const notifyChecklist = (uid, email) => sendNotify("checklist", uid, email);
