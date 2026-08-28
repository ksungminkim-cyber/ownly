// src/app/api/notify/route.js
// 이메일 알림 API — Resend 기반
// POST /api/notify  { type: "unpaid" | "expiring" | "monthly_checklist" }
// 미납 발생 즉시, 만료 D-90/60/30, 월초 수금 체크리스트

import { createClient } from "@supabase/supabase-js";
import { matchPolicies } from "../../../lib/policies";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = "온리 <noreply@ownly.kr>";

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) return { skipped: true };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  return res.json();
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

// ── 미납 알림 ─────────────────────────────────────────────────────
async function sendUnpaidNotice(userId, userEmail, tenants, payments) {
  // KST 기준 날짜 (Vercel 런타임은 UTC)
  const kst = new Date(Date.now() + 9 * 3600000);
  const month = kst.getUTCMonth() + 1;
  const year = kst.getUTCFullYear();
  const today = kst.getUTCDate();

  const unpaidTenants = tenants.filter(t => {
    if (t.status === "퇴거" || t.status === "공실") return false;
    if (!(Number(t.rent) > 0)) return false; // 전세 등 월세 없는 계약 제외
    const payDay = Number(t.pay_day ?? t.payment_day ?? 5);
    if (today <= payDay) return false; // 아직 납부일 전
    const paid = payments.find(p =>
      p.tenant_id === t.id && p.month === month && p.year === year && p.status === "paid"
    );
    return !paid;
  });

  if (unpaidTenants.length === 0) return { sent: false, reason: "no_unpaid" };

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

  return sendEmail({
    to: userEmail,
    subject: `[온리] ${month}월 미납 세입자 ${unpaidTenants.length}명 — 확인이 필요합니다`,
    html: baseHtml(`⚠️ ${month}월 미납 알림`, body),
  });
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

// ── 월별 수금 체크리스트 ─────────────────────────────────────────
async function sendMonthlyChecklist(userId, userEmail, tenants) {
  if (tenants.length === 0) return { sent: false, reason: "no_tenants" };

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const rows = tenants.map(t => `
    <tr style="border-bottom:1px solid #f0efe9;">
      <td style="padding:10px 12px;font-size:13px;color:#1a2744;font-weight:600;">${t.name}</td>
      <td style="padding:10px 12px;font-size:12px;color:#8a8a9a;">${t.address || t.addr || ""}</td>
      <td style="padding:10px 12px;font-size:13px;color:#0fa573;font-weight:700;">${(t.rent || 0).toLocaleString()}만원</td>
      <td style="padding:10px 12px;font-size:11px;color:#8a8a9a;">매월 ${t.payment_day || 1}일</td>
    </tr>`).join("");

  const total = tenants.reduce((s, t) => s + (t.rent || 0), 0);

  const body = `
    <p style="font-size:14px;color:#1a2744;font-weight:600;margin:0 0 4px;">${year}년 ${month}월 수금 체크리스트입니다.</p>
    <p style="font-size:12px;color:#8a8a9a;margin:0 0 16px;">이번 달 수금 예정 총액: <strong style="color:#1a2744;">${total.toLocaleString()}만원</strong></p>
    <table style="width:100%;border-collapse:collapse;background:#faf9f6;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <thead>
        <tr style="background:#f0efe9;">
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">세입자</th>
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">주소</th>
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">월세</th>
          <th style="padding:9px 12px;font-size:11px;color:#8a8a9a;font-weight:700;text-align:left;">납부일</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  return sendEmail({
    to: userEmail,
    subject: `[온리] ${month}월 수금 체크리스트 — ${total.toLocaleString()}만원 예정`,
    html: baseHtml(`💰 ${month}월 수금 체크리스트`, body),
  });
}

// ── 월간 자산 리포트 (매월 1일) ──────────────────────────────────
// 자리톡류 수금 앱이 주지 못하는 "자산 관리실" 리포트:
// 수금 요약 + 지역 실거래 시세 비교 + 정책 매칭 + 만료 임박
const SITE_BASE = process.env.SITE_URL || "https://www.ownly.kr";

async function fetchRegionStats(addr) {
  try {
    const geoRes = await fetch(`${SITE_BASE}/api/geocode`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: addr }),
    });
    const geo = await geoRes.json();
    if (!geo?.sigunguCode) return null;
    const mRes = await fetch(`${SITE_BASE}/api/market/sigungu`, {
      method: "POST", headers: { "Content-Type": "application/json" },
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
  const seenCodes = new Set();
  const regions = [];
  for (const t of active) {
    if (regions.length >= 2) break;
    const addr = t.address || t.addr;
    if (!addr) continue;
    const stats = await fetchRegionStats(addr);
    if (stats && !seenCodes.has(stats.code)) { seenCodes.add(stats.code); regions.push(stats); }
  }

  // 정책 매칭 상위 3건 (lib/policies — 서버에서도 동작)
  const policyMatches = matchPolicies(tenants.map(t => ({ ...t, addr: t.address || t.addr }))).slice(0, 3);

  const regionRows = regions.map(r => `
    <tr style="border-bottom:1px solid #f0efe9;">
      <td style="padding:9px 12px;font-size:12.5px;color:#1a2744;font-weight:600;">${r.name}</td>
      <td style="padding:9px 12px;font-size:12.5px;color:#1a2744;font-weight:700;">월세 중위 ${r.median}만원</td>
      <td style="padding:9px 12px;font-size:12px;color:#8a8a9a;">최근 3개월 ${r.tx.toLocaleString()}건</td>
    </tr>`).join("");

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

// ── 메인 핸들러 ──────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { type, userId, userEmail } = await req.json();
    if (!userId || !userEmail) return Response.json({ error: "userId, userEmail 필요" }, { status: 400 });

    // 해당 유저 데이터 조회
    const { data: tenants } = await supabase.from("tenants").select("*").eq("user_id", userId);
    const { data: payments } = await supabase.from("payments").select("*").in(
      "tenant_id", (tenants || []).map(t => t.id)
    );

    let result;
    if (type === "unpaid")           result = await sendUnpaidNotice(userId, userEmail, tenants || [], payments || []);
    else if (type === "expiring")    result = await sendExpiringNotice(userId, userEmail, tenants || []);
    else if (type === "checklist")   result = await sendMonthlyChecklist(userId, userEmail, tenants || []);
    else return Response.json({ error: "type 오류 (unpaid|expiring|checklist)" }, { status: 400 });

    return Response.json({ success: true, result });
  } catch (e) {
    console.error("notify error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// ── 리텐션 알림 크론 (매일 09:00 KST) ────────────────────────────
// GET /api/notify  (헤더 x-cron-token 또는 ?token= 로 인증)
// 매일: 납부일이 지났는데 미납인 세입자가 있으면 임대인에게 미납 알림 1통
//   - 중복 방지: notification_logs 의 최근 unpaid 발송이 3일 이내면 skip
// 월요일: 미납 메일이 없던 유저에게 만료 임박 다이제스트 1통
//   - 중복 방지: newsletter_subscribers.last_sent_at 5일
// - 발송 대상: 실제 이메일 보유 + newsletter_subscribers.weekly_digest !== false
// - 조치할 게 없으면 발송하지 않음 (빈 메일 스팸 금지)
// Vercel Cron 은 자동으로 Authorization: Bearer $CRON_SECRET 를 주입하므로 CRON_SECRET 우선 지원
const CRON_TOKEN = process.env.CRON_SECRET || process.env.CRON_TOKEN || process.env.BILLING_RENEWAL_TOKEN || "";
const DEDUP_DAYS = 5;         // 만료 다이제스트
const UNPAID_DEDUP_DAYS = 3;  // 미납 알림

export async function GET(req) {
  // Vercel Cron 은 CRON_SECRET 미설정 시 Authorization 헤더를 주입하지 않으므로
  // billing/kakao/subscription 과 동일하게 user-agent 폴백 허용 (last_sent_at 5일 dedup 이 남용 방지)
  const ua = req.headers.get("user-agent") || "";
  const isVercelCron = /vercel-cron/i.test(ua);
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = bearer || req.headers.get("x-cron-token") || new URL(req.url).searchParams.get("token");
  if (!isVercelCron && (!CRON_TOKEN || token !== CRON_TOKEN)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = { processed: 0, unpaidSent: 0, digestSent: 0, monthlySent: 0, skippedOptOut: 0, skippedRecent: 0, skippedNothing: 0, errors: 0 };
  const dedupCutoff = new Date(Date.now() - DEDUP_DAYS * 86400000);
  const unpaidCutoff = new Date(Date.now() - UNPAID_DEDUP_DAYS * 86400000);
  const kstNow = new Date(Date.now() + 9 * 3600000);
  const isMonday = kstNow.getUTCDay() === 1; // KST 기준
  const isFirstOfMonth = kstNow.getUTCDate() === 1;
  const monthlyCutoff = new Date(Date.now() - 25 * 86400000); // 월간 리포트 중복 방지

  try {
    let page = 1;
    const perPage = 200;
    for (;;) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users || [];
      if (users.length === 0) break;

      for (const u of users) {
        summary.processed++;
        const email = u.email;
        if (!email) continue;
        try {
          const { data: sub } = await supabase.from("newsletter_subscribers").select("weekly_digest,last_sent_at").eq("user_id", u.id).maybeSingle();
          if (sub && sub.weekly_digest === false) { summary.skippedOptOut++; continue; }

          const { data: tenants } = await supabase.from("tenants").select("*").eq("user_id", u.id);
          if (!tenants || tenants.length === 0) { summary.skippedNothing++; continue; }
          const { data: payments } = await supabase.from("payments").select("*").in("tenant_id", tenants.map(t => t.id));

          // ① 미납 알림 — 매일 체크, notification_logs 기준 3일 중복 방지
          let unpaidSentNow = false;
          const { data: lastUnpaid } = await supabase.from("notification_logs")
            .select("sent_at").eq("user_id", u.id).eq("type", "unpaid").eq("channel", "email")
            .order("sent_at", { ascending: false }).limit(1);
          if (lastUnpaid?.[0]?.sent_at && new Date(lastUnpaid[0].sent_at) > unpaidCutoff) {
            summary.skippedRecent++;
          } else {
            const result = await sendUnpaidNotice(u.id, email, tenants, payments || []);
            if (!(result?.sent === false || result?.skipped)) {
              summary.unpaidSent++;
              unpaidSentNow = true;
              await supabase.from("notification_logs").insert({ user_id: u.id, type: "unpaid", channel: "email", status: "sent" });
            }
          }

          // ②-a 월간 자산 리포트 — 매월 1일 (notification_logs 25일 중복 방지)
          if (isFirstOfMonth) {
            const { data: lastMonthly } = await supabase.from("notification_logs")
              .select("sent_at").eq("user_id", u.id).eq("type", "monthly").eq("channel", "email")
              .order("sent_at", { ascending: false }).limit(1);
            if (!(lastMonthly?.[0]?.sent_at && new Date(lastMonthly[0].sent_at) > monthlyCutoff)) {
              const result = await sendMonthlyReport(u.id, email, tenants, payments || []);
              if (!(result?.sent === false || result?.skipped)) {
                summary.monthlySent++;
                await supabase.from("notification_logs").insert({ user_id: u.id, type: "monthly", channel: "email", status: "sent" });
              }
            }
          }

          // ② 만료 임박 다이제스트 — 월요일만, 같은 날 미납 메일·월간 리포트와 중복 금지
          if (isMonday && !isFirstOfMonth && !unpaidSentNow) {
            if (sub?.last_sent_at && new Date(sub.last_sent_at) > dedupCutoff) {
              summary.skippedRecent++;
            } else {
              const result = await sendExpiringNotice(u.id, email, tenants);
              if (result?.sent === false || result?.skipped) {
                summary.skippedNothing++;
              } else {
                summary.digestSent++;
                await supabase.from("newsletter_subscribers").upsert({ user_id: u.id, email, last_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
                await supabase.from("notification_logs").insert({ user_id: u.id, type: "expiring", channel: "email", status: "sent" });
              }
            }
          }
        } catch (e) {
          summary.errors++;
          console.error("cron-notify user error:", u.id, e?.message);
        }
      }

      if (users.length < perPage) break;
      page++;
    }
    return Response.json({ success: true, summary });
  } catch (e) {
    console.error("cron-digest error:", e);
    return Response.json({ error: e.message, summary }, { status: 500 });
  }
}
