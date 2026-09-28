// 세입자 알림톡 (Solapi) — 수동 발송(/api/kakao/send)과 자동 발송(크론 /api/notify)이 공용으로 사용 (서버 전용)
// 템플릿은 카카오 사전 승인된 5종만 사용하며, 변수명은 승인 템플릿과 정확히 일치해야 한다.
import crypto from "crypto";

export const TEMPLATE_MAP = {
  unpaid:            "KA01TP260319022413946WEFCauw7bu",
  unpaid_with_mgt:   "KA01TP260319044202504A6snqzyf3sN",
  upcoming:          "KA01TP260319022623914XEsARo3VO2y",
  upcoming_with_mgt: "KA01TP260319044259656FmFUnv2CZOa",
  expiring:          "KA01TP260319022807781m78Wss6h4dA",
};

function solapiAuthHeader() {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto.createHmac("sha256", process.env.SOLAPI_API_SECRET || "").update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${process.env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

// 관리비를 임대인이 받는 유형(상가, 아파트·오피스텔 외 주거)만 관리비 포함 템플릿 사용
export function isOwnerMgt(t) {
  if (t.pType === "상가") return true;
  if (t.pType === "주거") return !["아파트", "오피스텔"].includes(t.sub);
  return false;
}

// 납부일(1~31, 99=말일)을 해당 월의 실제 날짜로 — 29~31일·말일이 짧은 달을 넘지 않게
export function effectivePayDay(payDay, year, month1) {
  const last = new Date(Date.UTC(year, month1, 0)).getUTCDate();
  const d = Number(payDay) || 5;
  return Math.min(d >= 99 ? last : d, last);
}

// 오늘(KST)부터 다음 납부일까지 남은 일수 + 그 납부일이 속한 연·월
export function nextPayDue(payDay, now = Date.now()) {
  const kst = new Date(now + 9 * 3600000);
  const y = kst.getUTCFullYear(), m = kst.getUTCMonth(), d = kst.getUTCDate();
  const today = Date.UTC(y, m, d);
  let due = Date.UTC(y, m, effectivePayDay(payDay, y, m + 1));
  if (due < today) {
    const ny = m === 11 ? y + 1 : y, nm = (m + 1) % 12;
    due = Date.UTC(ny, nm, effectivePayDay(payDay, ny, nm + 1));
  }
  const dd = new Date(due);
  return { days: Math.round((due - today) / 86400000), year: dd.getUTCFullYear(), month: dd.getUTCMonth() + 1, dueAt: due - 9 * 3600000 };
}

export function buildVariables(templateKey, t) {
  const todayStr = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }); // 기존 수동 발송과 같은 형식
  const rent = String(t.rent || 0);
  const mgt = String(t.maintenance || 0);
  const total = String((Number(t.rent) || 0) + (Number(t.maintenance) || 0));
  const addr = t.addr || "해당 물건";
  const name = t.name || "임차인";
  const due = nextPayDue(t.pay_day || 5);
  const payDay = String(effectivePayDay(t.pay_day || 5, due.year, due.month)); // 말일(99)은 그달 실제 마지막 날 숫자 — 템플릿 문구("N일")를 깨지 않게
  const payDLeft = String(due.days); // upcoming 의 D-day 는 납부일까지 남은 일수
  if (templateKey === "unpaid") return { "#{이름}": name, "#{주소}": addr, "#{금액}": rent, "#{날짜}": todayStr };
  if (templateKey === "unpaid_with_mgt") return { "#{이름}": name, "#{주소}": addr, "#{금액}": rent, "#{관리비}": mgt, "#{총금액}": total, "#{날짜}": todayStr };
  if (templateKey === "upcoming") return { "#{이름}": name, "#{주소}": addr, "#{금액}": rent, "#{D-day}": payDLeft, "#{납부일}": payDay };
  if (templateKey === "upcoming_with_mgt") return { "#{이름}": name, "#{주소}": addr, "#{금액}": rent, "#{관리비}": mgt, "#{총금액}": total, "#{D-day}": payDLeft, "#{납부일}": payDay };
  if (templateKey === "expiring") return { "#{이름}": name, "#{주소}": addr, "#{만료일}": t.end_date || t.end || "미정", "#{D-day}": String(t.daysLeft ?? "") };
  return {};
}

/** 이번 달(KST) 알림톡 성공 건수 — 월 한도 판정용 */
export async function kakaoUsedThisMonth(admin, userId) {
  const kst = new Date(Date.now() + 9 * 3600000);
  const monthStart = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), 1) - 9 * 3600000);
  const { count } = await admin.from("notification_logs").select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("channel", "kakao").in("status", ["sent", "success"]) // 발송 기록은 "success"
    .gte("sent_at", monthStart.toISOString());
  return count || 0;
}

/**
 * 세입자에게 알림톡 1건 발송 + notification_logs 기록.
 * tenant 는 앱 형태(addr, pType, sub, end_date, phone, rent, maintenance, pay_day).
 * @returns {{ ok: boolean, error?: string, messageId?: string, templateKey: string }}
 */
export async function sendTenantAlimtalk({ admin, userId, tenant, tab, logType }) {
  const hasMgt = isOwnerMgt(tenant) && (Number(tenant.maintenance) || 0) > 0;
  let templateKey = tab;
  if (tab === "unpaid" && hasMgt) templateKey = "unpaid_with_mgt";
  if (tab === "upcoming" && hasMgt) templateKey = "upcoming_with_mgt";
  const templateId = TEMPLATE_MAP[templateKey];
  const variables = templateId ? buildVariables(templateKey, tenant) : {};

  const log = async (status, errorMessage, messageId) => {
    if (!admin || !userId) return;
    try {
      await admin.from("notification_logs").insert({
        user_id: userId, tenant_id: tenant?.id || null, type: logType, channel: "kakao", template_key: templateKey,
        message: Object.entries(variables).map(([k, v]) => `${k}=${v}`).join(", "),
        status, error_message: errorMessage || null, provider_message_id: messageId || null, sent_at: new Date().toISOString(),
      });
    } catch (e) { console.error("notification_logs insert failed:", e?.message); }
  };

  if (!templateId) { await log("failed", "템플릿 없음: " + templateKey); return { ok: false, error: "템플릿 없음: " + templateKey, templateKey }; }
  const to = String(tenant.phone || "").replace(/[^0-9]/g, "");
  if (!to) return { ok: false, error: "전화번호 없음", templateKey };

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: solapiAuthHeader() },
      body: JSON.stringify({ message: { to, from: process.env.SOLAPI_FROM || "", kakaoOptions: { pfId: process.env.SOLAPI_PFID, templateId, variables, disableSms: false } } }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.errorCode) {
      const err = data.errorMessage || `HTTP ${res.status}`;
      console.error("솔라피 에러:", JSON.stringify(data));
      await log("failed", err);
      return { ok: false, error: err, templateKey };
    }
    const messageId = data.messageId || data.groupId;
    await log("success", null, messageId);
    return { ok: true, messageId, templateKey };
  } catch (e) {
    await log("failed", e?.message);
    return { ok: false, error: e?.message, templateKey };
  }
}

// ── 자동 발송 (크론) ──────────────────────────────────────────────
// 임대인이 설정에서 켠 경우에만(user_metadata.auto_alimtalk = { upcoming, unpaid }), 전화번호가 있는 세입자에게
//  - upcoming: 납부일 하루 전, 그달 완납 기록이 없으면 1회
//  - unpaid:   가장 최근에 지난 납부일 기준 1일 이상 지났고 그달 완납이 아니면 1회, 7일 이상이면 1회 더 (한 납부 회차당 최대 2회)
// 오래된 미납(납부일 20일 초과)은 자동으로 보내지 않는다. 발송 이력은 notification_logs type auto_upcoming / auto_unpaid.
export const AUTO_UNPAID_MAX_OVERDUE = 20;

// 가장 최근에 지난(오늘 이전) 납부일과 그 연·월, 경과 일수
export function lastPassedDue(payDay, now = Date.now()) {
  const kst = new Date(now + 9 * 3600000);
  const y = kst.getUTCFullYear(), m = kst.getUTCMonth(), d = kst.getUTCDate();
  const today = Date.UTC(y, m, d);
  let due = Date.UTC(y, m, effectivePayDay(payDay, y, m + 1));
  if (due >= today) {
    const py = m === 0 ? y - 1 : y, pm = (m + 11) % 12;
    due = Date.UTC(py, pm, effectivePayDay(payDay, py, pm + 1));
  }
  const dd = new Date(due);
  // dueAt: 납부일 00:00 KST (ms) — 회차별 중복 판정 기준
  return { overdue: Math.round((today - due) / 86400000), year: dd.getUTCFullYear(), month: dd.getUTCMonth() + 1, dueAt: due - 9 * 3600000 };
}

/**
 * 오늘 자동 발송할 대상 (순수 함수 — 테스트 가능)
 * @param tenants  앱 형태 세입자 [{ id, phone, rent, pay_day, status, ... }]
 * @param payments DB 형태 [{ tenant_id, year, month, status, amount }]
 * @param logs     이 임대인의 최근 알림톡 이력 [{ tenant_id, type, sent_at }]
 * @param settings { upcoming: bool, unpaid: bool }
 * @returns [{ tenant, tab: "upcoming"|"unpaid", logType, due: { year, month }, remain? }]
 */
export function autoAlimtalkTargets({ tenants, payments, logs, settings, now = Date.now() }) {
  const out = [];
  const paidOf = (tid, y, m) => payments.find((p) => p.tenant_id === tid && Number(p.year) === y && Number(p.month) === m);
  // 같은 납부 회차에 이미 보낸 건 (since 이후 발송분)
  const sentSince = (tid, type, since) => logs.filter((l) => l.tenant_id === tid && l.type === type && Date.parse(l.sent_at) >= since);
  for (const t of tenants) {
    if (t.status === "공실" || t.status === "퇴거") continue;
    if (!(Number(t.rent) > 0) || !String(t.phone || "").replace(/[^0-9]/g, "")) continue;

    if (settings?.upcoming) {
      const next = nextPayDue(t.pay_day || 5, now);
      const p = paidOf(t.id, next.year, next.month);
      if (next.days === 1 && p?.status !== "paid" && sentSince(t.id, "auto_upcoming", next.dueAt - 3 * 86400000).length === 0) {
        out.push({ tenant: t, tab: "upcoming", logType: "auto_upcoming", due: next });
        continue; // 같은 날 두 통 보내지 않는다
      }
    }
    if (settings?.unpaid) {
      const last = lastPassedDue(t.pay_day || 5, now);
      if (last.overdue < 1 || last.overdue > AUTO_UNPAID_MAX_OVERDUE) continue;
      const p = paidOf(t.id, last.year, last.month);
      if (p?.status === "paid") continue;
      const sent = sentSince(t.id, "auto_unpaid", last.dueAt).sort((a, b) => Date.parse(b.sent_at) - Date.parse(a.sent_at));
      const second = sent.length === 1 && last.overdue >= 7 && now - Date.parse(sent[0].sent_at) >= 5 * 86400000;
      if (sent.length === 0 || second) {
        const remain = Math.max(0, Number(t.rent) - (p?.status === "partial" ? Number(p.amount) || 0 : 0));
        out.push({ tenant: t, tab: "unpaid", logType: "auto_unpaid", due: last, remain });
      }
    }
  }
  return out;
}
