// 서버 라우트 공용 간이 레이트리밋 (인스턴스 메모리 기준 — 완전하진 않지만 대량 남용은 차단)
// 사용: if (isRateLimited(req, "molit", 60)) return 429
// 내부 호출(우리 서버 → 우리 서버: ai-pricing·health·notify 가 MOLIT 프록시를 부를 때)은
// x-internal-token: CRON_SECRET 헤더로 제한을 건너뛴다 (Vercel 함수들의 egress IP 가 공유되어 서로 한도를 잡아먹는 것 방지).
const WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map(); // key → { start, count }

export function clientIp(req) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export function isInternalCall(req) {
  const tok = req.headers.get("x-internal-token");
  return Boolean(tok && process.env.CRON_SECRET && tok === process.env.CRON_SECRET);
}

export function internalHeaders() {
  return process.env.CRON_SECRET ? { "x-internal-token": process.env.CRON_SECRET } : {};
}

export function isRateLimited(req, scope, limitPerHour) {
  if (isInternalCall(req)) return false;
  const key = `${scope}:${clientIp(req)}`;
  const now = Date.now();
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) if (now - v.start > WINDOW_MS) buckets.delete(k);
  }
  const rec = buckets.get(key);
  if (!rec || now - rec.start > WINDOW_MS) { buckets.set(key, { start: now, count: 1 }); return false; }
  rec.count += 1;
  return rec.count > limitPerHour;
}
