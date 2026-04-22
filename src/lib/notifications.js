"use client";
// 브라우저 알림 헬퍼 (Notification API)
// v1: 권한 요청 + 간단한 알림 발송. Web Push (서버 발송)는 v2 예정

const PERM_KEY = "ownly_noti_enabled";
const CATS_KEY = "ownly_noti_cats";

export function isSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermission() {
  if (!isSupported()) return "unsupported";
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export function isEnabled() {
  if (!isSupported() || Notification.permission !== "granted") return false;
  try { return localStorage.getItem(PERM_KEY) === "1"; } catch { return false; }
}

export async function requestPermission() {
  if (!isSupported()) return false;
  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      localStorage.setItem(PERM_KEY, "1");
      return true;
    }
  } catch {}
  return false;
}

export function setEnabled(enabled) {
  try { localStorage.setItem(PERM_KEY, enabled ? "1" : "0"); } catch {}
}

export function getCategories() {
  const defaults = { payment: true, repair: true, expiry: true };
  try {
    const raw = localStorage.getItem(CATS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch { return defaults; }
}

export function setCategories(cats) {
  try { localStorage.setItem(CATS_KEY, JSON.stringify(cats)); } catch {}
}

// 알림 발송 — 권한 & 활성화 & 카테고리 체크 후 실제 발송
export function notify(category, { title, body, tag, url }) {
  if (!isEnabled()) return;
  const cats = getCategories();
  if (!cats[category]) return;

  try {
    const n = new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: tag || category,
      renotify: false,
    });
    if (url) {
      n.onclick = () => {
        window.focus();
        window.location.href = url;
        n.close();
      };
    }
    setTimeout(() => n.close(), 8000);
  } catch (e) {
    console.warn("Notification error:", e);
  }
}

// 실시간 이벤트 → 알림 변환
export function notifyFromEvent(event) {
  if (!event || !event.eventType) return;

  // INSERT on repairs with source='tenant'
  if (event.table === "repairs" && event.eventType === "INSERT") {
    const r = event.new;
    if (r?.source === "tenant") {
      notify("repair", {
        title: r.priority === "urgent" ? "🚨 긴급 수리 요청 접수" : "🔧 새 수리 요청 접수",
        body: `${r.category || "기타"}: ${(r.memo || "").slice(0, 80)}`,
        tag: `repair-${r.id}`,
        url: "/dashboard/repairs",
      });
    }
  }

  // INSERT/UPDATE on payments with status='paid'
  if (event.table === "payments" && (event.eventType === "INSERT" || event.eventType === "UPDATE")) {
    const p = event.new;
    const old = event.old;
    const becamePaid = p?.status === "paid" && (!old || old.status !== "paid");
    if (becamePaid) {
      notify("payment", {
        title: "💰 월세 입금 확인",
        body: `${(p.amount || 0).toLocaleString()}만원 납부 완료`,
        tag: `payment-${p.tenant_id}-${p.month}`,
        url: "/dashboard/payments",
      });
    }
  }
}
