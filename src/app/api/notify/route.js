// src/app/api/notify/route.js
// 이메일 알림 API — Resend 기반
// GET 크론(매일): 미납 알림·임대인 문자·월간 리포트·만료 다이제스트. (무인증 POST 는 2026-09-10 제거)
// 미납 발생 즉시, 만료 D-90/60/30, 월초 수금 체크리스트

import crypto from "crypto";
export const maxDuration = 60;

import { createClient } from "@supabase/supabase-js";
import { matchPolicies } from "../../../lib/policies";
import { internalHeaders } from "../../../lib/ratelimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = "온리 <noreply@ownly.kr>";

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) return { skipped: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    const json = await res.json().catch(() => ({}));
    // Resend 는 실패 시 { statusCode, name, message } 를 돌려준다 → 성공 판정은 id 존재 여부로만.
    // (예전엔 응답을 그대로 반환해 429/422 도 "발송됨"으로 기록되어 3일간 재시도가 막히고 문자만 나갔다)
    const sent = res.ok && Boolean(json?.id);
    if (!sent) console.error("[notify] resend failed:", res.status, json?.message || json?.name || "");
    return { sent, id: json?.id || null, error: sent ? null : (json?.message || `HTTP ${res.status}`) };
  } catch (e) {
    console.error("[notify] resend error:", e?.message);
    return { sent: false, error: e?.message };
  }
}

// 샘플 체험 데이터([샘플] 접두어)는 실제 알림 대상에서 제외 — 가짜 세입자로 미납 메일·문자가 나가면 안 된다
const SAMPLE_MARK = "[샘플]";
const isSampleRow = (t) => String(t?.name || "").includes(SAMPLE_MARK) || String(t?.address || t?.addr || "").includes(SAMPLE_MARK);

// ── 임대인 본인 문자 (Solapi SMS/LMS, 길이에 따라 자동 판별) ─────────
// 알림톡은 사전 승인 템플릿이 세입자용뿐이라, 임대인 본인에게는 일반 문자로 보낸다.
// 설정에서 옵트인(newsletter_subscribers.sms_unpaid)한 유저 + 프로필 전화번호가 있을 때만.
async function sendLandlordSms({ to, text }) {
  const key = process.env.SOLAPI_API_KEY, secret = process.env.SOLAPI_API_SECRET, from = process.env.SOLAPI_FROM;
  if (!key || !secret || !from) return { skipped: true, reason: "solapi_not_configured" };
  const phone = String(to || "").replace(/\D/g, "");
  if (!/^01\d{8,9}$/.test(phone)) return { skipped: true, reason: "bad_phone" };
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto.createHmac("sha256", secret).update(date + salt).digest("hex");
  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `HMAC-SHA256 apiKey=${key}, date=${date}, salt=${salt}, signature=${signature}` },
    body: JSON.stringify({ message: { to: phone, from, text } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errorCode) return { sent: false, error: data.errorMessage || `HTTP ${res.status}` };
  return { sent: true, messageId: data.messageId || data.groupId };
}

// 미납 문자 본문 — 이메일과 같은 판정(sendUnpaidNotice 내부 로직)을 재사용하기 위해 목록을 받는다
function unpaidSmsText(month, unpaidTenants) {
  const first = unpaidTenants[0];
  const rest = unpaidTenants.length > 1 ? ` 외 ${unpaidTenants.length - 1}건` : "";
  const total = unpaidTenants.reduce((s, t) => s + (Number(t.rent) || 0), 0);
  return `[온리] ${month}월 미납 ${unpaidTenants.length}건 · 총 ${total.toLocaleString()}만원\n${first.name} ${(first.rent || 0).toLocaleString()}만원${rest}\n납부 처리·독촉: https://www.ownly.kr/dashboard/payments`;
}

function baseHtml(title, body) {
  return `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:540px;margin:0 auto;padding:0;background:#f5f4f0;">
  <div style="background:#1a2744;padding:24px 28px 20px;border-radius:12px 12px 0 0;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:32px;height:32px;background:linear-gradient(145deg,#2d4270,#1a2744);border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.15);">
        <span style="color:#fff;font-size:16px;">🏠</span>
      </div>
      <span style="color:#fff;font-size:15px;font-weight:800;letter-spacing:-.3px;">온리(Ownly)</span>
    </div>
    <h1 style="color:#fff;font-size:18px;font-weight:800;margin:14px 0 0;line-height:1.4;">${title}</h1>
  </div>
  <div style="background:#fff;padding:24px 28px;border-radius:0 0 12px 12px;border:1px solid #e8e6e0;border-top:none;">
    ${body}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f0efe9;">
      <a href="https://ownly.kr/dashboard" style="display:inline-block;padding:11px 22px;background:#1a2744;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:700;">
        대시보드 확인하기 →
      </a>
    </div>
    <p style="margin-top:16px;font-size:11px;color:#b0aead;line-height:1.6;">
      이 이메일은 온리(Ownly) 임대 관리 플랫폼에서 자동 발송됩니다.<br/>
      문의: inquiry@mclean21.com · <a href="https://ownly.kr/dashboard/settings" style="color:#b0aead;">알림 설정 변경</a>
    </p>
  </div>
</div>`;
}

// 이번 달 미납 세입자 계산 (KST 기준) — 이메일·문자 공용. src/lib/unpaid.js(클라이언트)와 같은 규칙
function computeUnpaid(tenants, payments) {
  const kst = new Date(Date.now() + 9 * 3600000);
  const month = kst.getUTCMonth() + 1;
  const year = kst.getUTCFullYear();
  const today = kst.getUTCDate();
  const unpaidTenants = tenants.filter(t => {
    if (t.status === "퇴거" || t.status === "공실") return false;
    if (!(Number(t.rent) > 0)) return false; // 전세 등 월세 없는 계약 제외
    const payDay = Number(t.pay_day ?? t.payment_day ?? 5);
    if (today <= payDay) return false; // 아직 납부일 전
    return !payments.find(p => p.tenant_id === t.id && p.month === month && p.year === year && p.status === "paid");
  });
  return { month, year, unpaidTenants };
}

// ── 미납 알림 ─────────────────────────────────────────────────────
async function sendUnpaidNotice(userId, userEmail, tenants, payments) {
  // KST 기준 날짜 (Vercel 런타임은 UTC)
  const { month, year, unpaidTenants } = computeUnpaid(tenants, payments);
  if (unpaidTenants.length === 0) return { sent: false, reason: "no_unpaid" };
  const smsText = unpaidSmsText(month, unpaidTenants);

  const rows = unpaidTenants.map(t => `
    <tr style="border-bottom:1px solid #f0efe9;">
      <td style="padding:10px 12px;font-size:13px;color:#1a2744;font-weight:600;">${t.name}</td>
      <td style="padding:10px 12px;font-size:12px;color:#8a8a9a;">${t.address || t.addr || ""}</td>
      <td style="padding:10px 12px;font-size:13px;color:#e8445a;font-weight:700;">${(t.rent || 0).toLocaleString()}만원</td>
    </tr>
  `).join("");

  const body = `
    <p style="font-size:14px;color:#1a2744;font-weight:600;margin:0 0 16px;">
      ${year}년 ${month}월 미납 세입자 <strong style="color:#e8445a;">${unpaidTenants.length}명</strong>이 있습니다.
    </p>
    <table style="width:100%;border-collapse:collapse;background:#faf9f6;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <thead>
        <tr style="background:#f0efe9;">
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">세입자</th>
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">주소</th>
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">월세</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:12px;color:#8a8a9a;line-height:1.7;">
      수금 현황 페이지에서 납부 처리하거나 세입자에게 연락하세요.<br/>
      미납이 지속될 경우 내용증명 발송을 고려해보세요.
    </p>`;

  const result = await sendEmail({
    to: userEmail,
    subject: `[온리] ${month}월 미납 세입자 ${unpaidTenants.length}명 — 확인이 필요합니다`,
    html: baseHtml(`⚠️ ${month}월 미납 알림`, body),
  });
  return { ...(result || {}), smsText }; // 크론이 옵트인 유저에게 같은 내용을 문자로도 보낼 수 있게 본문 동봉
}

// ── 만료 임박 알림 ───────────────────────────────────────────────
async function sendExpiringNotice(userId, userEmail, tenants) {
  const now = new Date();
  const expiring = tenants.filter(t => {
    if (!t.contract_end && !t.end_date) return false;
    const end = new Date(t.contract_end || t.end_date);
    const days = Math.ceil((end - now) / 86400000);
    return days > 0 && days <= 90;
  }).map(t => {
    const end = new Date(t.contract_end || t.end_date);
    const days = Math.ceil((end - now) / 86400000);
    return { ...t, daysLeft: days };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  if (expiring.length === 0) return { sent: false, reason: "none_expiring" };

  const rows = expiring.map(t => {
    const urgency = t.daysLeft <= 30 ? "#e8445a" : t.daysLeft <= 60 ? "#e8960a" : "#0fa573";
    return `
      <tr style="border-bottom:1px solid #f0efe9;">
        <td style="padding:10px 12px;font-size:13px;color:#1a2744;font-weight:600;">${t.name}</td>
        <td style="padding:10px 12px;font-size:12px;color:#8a8a9a;">${t.address || t.addr || ""}</td>
        <td style="padding:10px 12px;font-size:12px;color:#8a8a9a;">${(t.contract_end || t.end_date || "").slice(0,10)}</td>
        <td style="padding:10px 12px;text-align:center;">
          <span style="font-size:12px;font-weight:800;color:${urgency};background:${urgency}18;padding:3px 8px;border-radius:12px;">D-${t.daysLeft}</span>
        </td>
      </tr>`;
  }).join("");

  const body = `
    <p style="font-size:14px;color:#1a2744;font-weight:600;margin:0 0 16px;">
      90일 이내 계약 만료 예정 세입자 <strong style="color:#e8960a;">${expiring.length}명</strong>입니다.<br/>
      <span style="font-size:12px;color:#8a8a9a;font-weight:400;">지금 갱신 의향을 확인하고 협상을 시작하세요.</span>
    </p>
    <table style="width:100%;border-collapse:collapse;background:#faf9f6;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <thead>
        <tr style="background:#f0efe9;">
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">세입자</th>
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">주소</th>
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">만료일</th>
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:center;">잔여</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="background:#fff8e6;border:1px solid #f0d88a;border-radius:10px;padding:12px 14px;">
      <p style="font-size:12px;color:#b8860b;font-weight:700;margin:0 0 4px;">💡 갱신 협상 타이밍</p>
      <p style="font-size:12px;color:#8a7a4a;margin:0;line-height:1.7;">
        • D-90: 갱신 의향 확인 연락<br/>
        • D-60: 임대료 협상 시작<br/>
        • D-30: 계약서 작성 완료 목표
      </p>
    </div>`;

  return sendEmail({
    to: userEmail,
    subject: `[온리] 계약 만료 임박 세입자 ${expiring.length}명 — D-${expiring[0].daysLeft}부터 시작`,
    html: baseHtml("📅 계약 만료 임박 알림", body),
  });
}

// ── 월간 자산 리포트 (매월 1일) ──────────────────────────────────
// 자리톡류 수금 앱이 주지 못하는 "자산 관리실" 리포트:
// 수금 요약 + 지역 실거래 시세 비교 + 정책 매칭 + 만료 임박
const SITE_BASE = process.env.SITE_URL || "https://www.ownly.kr";

async function fetchRegionStats(addr) {
  try {
    const geoRes = await fetch(`${SITE_BASE}/api/geocode`, {
      method: "POST", headers: { "Content-Type": "application/json", ...internalHeaders() },
      body: JSON.stringify({ address: addr }),
    });
    const geo = await geoRes.json();
    if (!geo?.sigunguCode) return null;
    const mRes = await fetch(`${SITE_BASE}/api/market/sigungu`, {
      method: "POST", headers: { "Content-Type": "application/json", ...internalHeaders() },
      body: JSON.stringify({ lawdCd: geo.sigunguCode }),
    });
    const m = await mRes.json();
    if (m.error || m.empty) return null;
    return { name: geo.sigunguName || "내 지역", code: geo.sigunguCode, median: m.rent.medianMonthly, tx: m.total.rentTx };
  } catch { return null; }
}

async function sendMonthlyReport(userId, userEmail, tenants, payments) {
  if (tenants.length === 0) return { sent: false, reason: "no_tenants" };
  const kst = new Date(Date.now() + 9 * 3600000);
  const month = kst.getUTCMonth() + 1;
  const year = kst.getUTCFullYear();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const active = tenants.filter(t => t.status !== "퇴거" && t.status !== "공실");
  const totalRent = active.reduce((s, t) => s + (Number(t.rent) || 0), 0);
  const prevPaid = payments.filter(p => p.year === prevYear && p.month === prevMonth && p.status === "paid");
  const prevPaidSum = prevPaid.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const expiring = tenants.filter(t => {
    const end = t.contract_end || t.end_date;
    if (!end) return false;
    const days = Math.ceil((new Date(end) - new Date()) / 86400000);
    return days > 0 && days <= 90;
  }).length;

  // 지역 시세 — 유니크 시군구 최대 2곳 (실패해도 리포트는 발송)
  // 같은 시군구에 속한 내 주거 물건의 평균 월세를 지역 중위값과 비교해 "시세 대비 몇 %"를 함께 보여준다.
  const seenCodes = new Set();
  const regions = [];
  const regionRents = {}; // code → [내 월세…]
  for (const t of active) {
    if (regions.length >= 2) break; // 지오코딩 호출 상한 — 비교는 조회한 물건 기준
    const addr = t.address || t.addr;
    if (!addr) continue;
    const stats = await fetchRegionStats(addr);
    if (!stats) continue;
    if (!seenCodes.has(stats.code)) { seenCodes.add(stats.code); regions.push(stats); }
    if ((t.p_type || t.pType || "주거") === "주거" && Number(t.rent) > 0) {
      (regionRents[stats.code] ||= []).push(Number(t.rent));
    }
  }
  for (const r of regions) {
    const mine = regionRents[r.code] || [];
    if (mine.length && r.median > 0) {
      r.myAvg = Math.round(mine.reduce((s, v) => s + v, 0) / mine.length);
      r.diffPct = Math.round(((r.myAvg - r.median) / r.median) * 100);
    }
  }

  // 정책 매칭 상위 3건 (lib/policies — 서버에서도 동작)
  const policyMatches = matchPolicies(tenants.map(t => ({ ...t, addr: t.address || t.addr }))).slice(0, 3);

  const regionRows = regions.map(r => {
    const cmp = typeof r.diffPct === "number"
      ? `<br/><span style="font-size:11.5px;color:${r.diffPct >= 0 ? "#0fa573" : "#e8960a"};font-weight:700;">내 평균 ${r.myAvg}만원 · 지역 중위 대비 ${r.diffPct >= 0 ? "+" : ""}${r.diffPct}%</span>`
      : "";
    return `
    <tr style="border-bottom:1px solid #f0efe9;">
      <td style="padding:9px 12px;font-size:12.5px;color:#1a2744;font-weight:600;">${r.name}</td>
      <td style="padding:9px 12px;font-size:12.5px;color:#1a2744;font-weight:700;">월세 중위 ${r.median}만원${cmp}</td>
      <td style="padding:9px 12px;font-size:12px;color:#8a8a9a;">최근 3개월 ${r.tx.toLocaleString()}건</td>
    </tr>`;
  }).join("");

  const policyRows = policyMatches.map(mch => `
    <li style="margin-bottom:6px;font-size:12.5px;color:#1a2744;line-height:1.6;">
      <b>[${mch.policyTag}]</b> ${mch.item.headline}
      <span style="color:#8a8a9a;">— 매물 ${mch.properties.length}건 관련</span>
    </li>`).join("");

  const body = `
    <p style="font-size:14px;color:#1a2744;font-weight:600;margin:0 0 14px;">
      ${month}월 자산 현황 요약입니다.
    </p>
    <table style="width:100%;border-collapse:collapse;background:#faf9f6;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <tbody>
        <tr style="border-bottom:1px solid #f0efe9;">
          <td style="padding:10px 12px;font-size:12px;color:#8a8a9a;font-weight:700;">운영 물건</td>
          <td style="padding:10px 12px;font-size:13px;color:#1a2744;font-weight:800;">${active.length}개 (전체 ${tenants.length}개)</td>
        </tr>
        <tr style="border-bottom:1px solid #f0efe9;">
          <td style="padding:10px 12px;font-size:12px;color:#8a8a9a;font-weight:700;">월 임대료 합계</td>
          <td style="padding:10px 12px;font-size:13px;color:#0fa573;font-weight:800;">${totalRent.toLocaleString()}만원</td>
        </tr>
        <tr style="border-bottom:1px solid #f0efe9;">
          <td style="padding:10px 12px;font-size:12px;color:#8a8a9a;font-weight:700;">지난달 수납</td>
          <td style="padding:10px 12px;font-size:13px;color:#1a2744;font-weight:800;">${prevPaid.length}건 · ${prevPaidSum.toLocaleString()}만원</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-size:12px;color:#8a8a9a;font-weight:700;">계약 만료 임박</td>
          <td style="padding:10px 12px;font-size:13px;color:${expiring > 0 ? "#e8960a" : "#0fa573"};font-weight:800;">${expiring > 0 ? `${expiring}건 (90일 이내)` : "없음"}</td>
        </tr>
      </tbody>
    </table>
    ${regionRows ? `
    <p style="font-size:13px;color:#1a2744;font-weight:800;margin:0 0 8px;">📊 내 지역 실거래 시세 (국토부)</p>
    <table style="width:100%;border-collapse:collapse;background:#faf9f6;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <tbody>${regionRows}</tbody>
    </table>` : ""}
    ${policyRows ? `
    <p style="font-size:13px;color:#1a2744;font-weight:800;margin:0 0 8px;">🏛️ 내 매물 관련 정책 체크</p>
    <ul style="margin:0 0 6px;padding-left:18px;">${policyRows}</ul>
    <p style="font-size:11px;color:#8a8a9a;margin:0 0 16px;">
      상세 내용과 원문은 <a href="${SITE_BASE}/policy" style="color:#5b4fcf;">정책 브리핑</a>에서 확인하세요.
    </p>` : ""}
    <p style="font-size:11px;color:#a0a0b0;line-height:1.7;">
      ※ 시세는 최근 3개월 실거래 기준 참고 지표이며, 정책 해당 여부는 세대 주택 수 등 개별 조건에 따라 다릅니다.
    </p>`;

  return sendEmail({
    to: userEmail,
    subject: `[온리] ${month}월 자산 리포트 — 물건 ${active.length}개 · 월 ${totalRent.toLocaleString()}만원`,
    html: baseHtml(`📋 ${month}월 자산 리포트`, body),
  });
}

// (2026-09-10 제거) 무인증 POST /api/notify — body 의 userId·userEmail 을 신뢰해 임의 이메일로 세입자 명단을 보낼 수 있었음.
// 호출처(src/lib/notify.js)도 사용되지 않아 함께 삭제. 발송은 아래 GET 크론만 수행한다.

// ── 리텐션 알림 크론 (매일 09:00 KST) ────────────────────────────
// GET /api/notify  (Authorization: Bearer CRON_SECRET — Vercel Cron 자동 주입 / x-cron-token / ?token=)
// 매일: 납부일이 지났는데 미납인 세입자가 있으면 임대인에게 미납 이메일(+옵트인 문자) 1통 — 3일 중복 방지
// 월요일: 미납 메일이 없던 유저에게 만료 임박 다이제스트 — 5일 중복 방지
// 매월 1일: 월간 자산 리포트 — 25일 중복 방지
//
// 규모 대응 (2026-09-10): 구독 설정·최근 발송 이력을 한 번에 프리페치하고 유저를 CONCURRENCY 개씩 병렬 처리.
// 유저당 DB 왕복 2회(tenants·payments) 로 줄여 수백 명까지 maxDuration(60s) 안에 끝난다.
const CRON_TOKEN = process.env.CRON_SECRET || process.env.CRON_TOKEN || process.env.BILLING_RENEWAL_TOKEN || "";
const DEDUP_DAYS = 5;         // 만료 다이제스트
const UNPAID_DEDUP_DAYS = 3;  // 미납 알림 (이메일·문자 각각)
const MONTHLY_DEDUP_DAYS = 25;
const CONCURRENCY = 5;

async function runPool(items, limit, fn) {
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) { const item = items[idx++]; await fn(item); }
  });
  await Promise.all(workers);
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = bearer || req.headers.get("x-cron-token") || new URL(req.url).searchParams.get("token");
  // 시크릿이 설정돼 있으면 토큰만 인정 (Vercel Cron 은 CRON_SECRET 을 Bearer 로 자동 주입). UA 는 위조 가능하므로 시크릿 미설정 배포에서만 폴백.
  const authorized = CRON_TOKEN ? token === CRON_TOKEN : /vercel-cron/i.test(req.headers.get("user-agent") || "");
  if (!authorized) return Response.json({ error: "unauthorized" }, { status: 401 });

  const summary = { processed: 0, unpaidSent: 0, smsSent: 0, digestSent: 0, monthlySent: 0, skippedOptOut: 0, skippedRecent: 0, skippedNothing: 0, errors: 0, elapsedMs: 0 };
  const started = Date.now();
  const now = new Date();
  const kstNow = new Date(Date.now() + 9 * 3600000);
  const isMonday = kstNow.getUTCDay() === 1; // KST 기준
  const isFirstOfMonth = kstNow.getUTCDate() === 1;
  const dayMs = 86400000;

  try {
    // ── 프리페치: 구독 설정 + 최근 발송 이력 (유저별 반복 조회 제거)
    const [subsRes, logsRes] = await Promise.all([
      supabase.from("newsletter_subscribers").select("user_id,weekly_digest,last_sent_at,sms_unpaid"),
      supabase.from("notification_logs").select("user_id,type,channel,sent_at").gte("sent_at", new Date(Date.now() - MONTHLY_DEDUP_DAYS * dayMs).toISOString()),
    ]);
    const subMap = new Map((subsRes.data || []).map((r) => [r.user_id, r]));
    const lastSent = new Map(); // "user|type|channel" → 가장 최근 sent_at(ms)
    for (const l of logsRes.data || []) {
      const k = `${l.user_id}|${l.type}|${l.channel}`;
      const t = new Date(l.sent_at).getTime();
      if (!lastSent.has(k) || lastSent.get(k) < t) lastSent.set(k, t);
    }
    const recent = (uid, type, channel, days) => { const t = lastSent.get(`${uid}|${type}|${channel}`); return Boolean(t && Date.now() - t < days * dayMs); };
    const logSent = async (uid, type, channel, extra = {}) => {
      lastSent.set(`${uid}|${type}|${channel}`, Date.now());
      await supabase.from("notification_logs").insert({ user_id: uid, type, channel, status: "sent", ...extra });
    };

    const processUser = async (u) => {
      summary.processed++;
      const email = u.email;
      if (!email) return;
      try {
        const sub = subMap.get(u.id);
        const emailOptOut = sub && sub.weekly_digest === false; // 이메일 수신 거부 — 문자 옵트인과는 별개
        const smsOptIn = Boolean(sub?.sms_unpaid);
        if (emailOptOut && !smsOptIn) { summary.skippedOptOut++; return; }

        const { data: tenantsRaw } = await supabase.from("tenants").select("*").eq("user_id", u.id);
        const tenants = (tenantsRaw || []).filter((t) => !isSampleRow(t));
        if (tenants.length === 0) { summary.skippedNothing++; return; }
        const { data: payments } = await supabase.from("payments").select("*").in("tenant_id", tenants.map(t => t.id));

        // ① 미납 — 이메일(3일 중복 방지)과 문자(3일 중복 방지)를 독립적으로 판정
        const { month, unpaidTenants } = computeUnpaid(tenants, payments || []);
        let unpaidSentNow = false;
        if (unpaidTenants.length > 0) {
          if (!emailOptOut) {
            if (recent(u.id, "unpaid", "email", UNPAID_DEDUP_DAYS)) summary.skippedRecent++;
            else {
              const result = await sendUnpaidNotice(u.id, email, tenants, payments || []);
              if (result?.sent) { summary.unpaidSent++; unpaidSentNow = true; await logSent(u.id, "unpaid", "email"); }
            }
          }
          if (smsOptIn && !recent(u.id, "unpaid", "sms", UNPAID_DEDUP_DAYS)) {
            const phone = u.user_metadata?.phone || u.phone;
            const sms = await sendLandlordSms({ to: phone, text: unpaidSmsText(month, unpaidTenants) });
            if (sms?.sent) { summary.smsSent++; await logSent(u.id, "unpaid", "sms", { provider_message_id: sms.messageId || null }); }
            else if (sms?.error) await supabase.from("notification_logs").insert({ user_id: u.id, type: "unpaid", channel: "sms", status: "failed", error_message: sms.error });
          }
        }
        if (emailOptOut) return; // 아래는 전부 이메일

        // ② 월간 자산 리포트 — 매월 1일
        if (isFirstOfMonth && !recent(u.id, "monthly", "email", MONTHLY_DEDUP_DAYS)) {
          const result = await sendMonthlyReport(u.id, email, tenants, payments || []);
          if (result?.sent) { summary.monthlySent++; await logSent(u.id, "monthly", "email"); }
        }

        // ③ 만료 임박 다이제스트 — 월요일만, 같은 날 미납 메일·월간 리포트와 중복 금지
        if (isMonday && !isFirstOfMonth && !unpaidSentNow) {
          if (sub?.last_sent_at && now - new Date(sub.last_sent_at) < DEDUP_DAYS * dayMs) { summary.skippedRecent++; return; }
          const result = await sendExpiringNotice(u.id, email, tenants);
          if (!result?.sent) { summary.skippedNothing++; return; }
          summary.digestSent++;
          await supabase.from("newsletter_subscribers").upsert({ user_id: u.id, email, last_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
          await logSent(u.id, "expiring", "email");
        }
      } catch (e) {
        summary.errors++;
        console.error("cron-notify user error:", u.id, e?.message);
      }
    };

    let page = 1;
    const perPage = 200;
    for (;;) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users || [];
      if (users.length === 0) break;
      await runPool(users, CONCURRENCY, processUser);
      if (users.length < perPage) break;
      page++;
    }
    summary.elapsedMs = Date.now() - started;
    return Response.json({ success: true, summary });
  } catch (e) {
    console.error("cron-digest error:", e);
    summary.elapsedMs = Date.now() - started;
    return Response.json({ error: e.message, summary }, { status: 500 });
  }
}
