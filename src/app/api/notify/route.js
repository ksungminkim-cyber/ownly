// src/app/api/notify/route.js
// 이메일 알림 API — Resend 기반
// POST /api/notify  { type: "unpaid" | "expiring" | "monthly_checklist" }
// 미납 발생 즉시, 만료 D-90/60/30, 월초 수금 체크리스트

import { createClient } from "@supabase/supabase-js";

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
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const unpaidTenants = tenants.filter(t => {
    const paid = payments.find(p =>
      p.tenant_id === t.id && p.month === month && p.year === year && p.status === "paid"
    );
    return !paid && t.status !== "퇴거";
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
