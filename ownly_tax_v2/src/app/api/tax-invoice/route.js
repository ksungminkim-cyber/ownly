// src/app/api/tax-invoice/route.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role — RLS 우회해서 저장
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL    = "inquiry@mclean21.com";

// 세무사 연락처 — 실제 세무사 정보로 교체하세요
const PARTNER_CONTACTS = {
  1: { name: "세무법인 온택스",  email: "ontax@example.com",   phone: "02-0000-0000" },
  2: { name: "세무사 김재호",    email: "kimjaeho@example.com", phone: "010-0000-0000" },
  3: { name: "세무법인 택스플러스", email: "taxplus@example.com", phone: "02-0000-0000" },
};

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY 없음 — 이메일 발송 스킵");
    return { skipped: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "온리 <noreply@ownly.kr>",
      to: [to],
      subject,
      html,
    }),
  });
  return res.json();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      issueType, issueTypeLabel,
      tenantName, tenantId,
      supplyAmt, taxAmt,
      issueDate, bizNo, memo,
      partnerId, partnerName,
      partnerFee, userId, userEmail,
    } = body;

    // ── 1. Supabase에 저장 ──────────────────────────────────────
    const { data, error } = await supabase
      .from("tax_invoice_requests")
      .insert({
        user_id:       userId || null,
        user_email:    userEmail || null,
        issue_type:    issueType,
        issue_type_label: issueTypeLabel,
        tenant_name:   tenantName || null,
        tenant_id:     tenantId || null,
        supply_amt:    Number(supplyAmt),
        tax_amt:       Number(taxAmt),
        total_amt:     Number(supplyAmt) + Number(taxAmt),
        issue_date:    issueDate,
        biz_no:        bizNo || null,
        memo:          memo || null,
        partner_id:    partnerId,
        partner_name:  partnerName,
        partner_fee:   Number(partnerFee),
        status:        "pending",  // pending | processing | done | cancelled
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const requestId = data.id;
    const partner   = PARTNER_CONTACTS[partnerId] || {};

    // ── 2. 세무사에게 이메일 발송 ─────────────────────────────────
    if (partner.email) {
      await sendEmail({
        to: partner.email,
        subject: `[온리] 세금계산서 발행 신청 #${requestId}`,
        html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e8e6e0;border-radius:12px;">
  <h2 style="color:#1a2744;margin-bottom:4px;">📋 세금계산서 발행 신청</h2>
  <p style="color:#8a8a9a;font-size:13px;margin-bottom:24px;">신청번호: #${requestId}</p>

  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr style="background:#f8f7f4;">
      <td style="padding:10px 14px;font-weight:600;color:#8a8a9a;width:40%;">발행 유형</td>
      <td style="padding:10px 14px;color:#1a2744;">${issueTypeLabel}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;font-weight:600;color:#8a8a9a;">세입자</td>
      <td style="padding:10px 14px;color:#1a2744;">${tenantName || "미기입"}</td>
    </tr>
    <tr style="background:#f8f7f4;">
      <td style="padding:10px 14px;font-weight:600;color:#8a8a9a;">사업자번호</td>
      <td style="padding:10px 14px;color:#1a2744;">${bizNo || "미기입"}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;font-weight:600;color:#8a8a9a;">발행 연월</td>
      <td style="padding:10px 14px;color:#1a2744;">${issueDate}</td>
    </tr>
    <tr style="background:#f8f7f4;">
      <td style="padding:10px 14px;font-weight:600;color:#8a8a9a;">공급가액</td>
      <td style="padding:10px 14px;color:#1a2744;">${Number(supplyAmt).toLocaleString()}원</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;font-weight:600;color:#8a8a9a;">부가세(10%)</td>
      <td style="padding:10px 14px;color:#1a2744;">${Number(taxAmt).toLocaleString()}원</td>
    </tr>
    <tr style="background:#f8f7f4;">
      <td style="padding:10px 14px;font-weight:700;color:#1a2744;">합계</td>
      <td style="padding:10px 14px;font-weight:700;color:#1a2744;">${(Number(supplyAmt)+Number(taxAmt)).toLocaleString()}원</td>
    </tr>
    ${memo ? `<tr>
      <td style="padding:10px 14px;font-weight:600;color:#8a8a9a;">메모</td>
      <td style="padding:10px 14px;color:#1a2744;">${memo}</td>
    </tr>` : ""}
  </table>

  <div style="margin-top:20px;padding:14px;background:#f0f9ff;border-radius:8px;font-size:13px;color:#1a2744;">
    <strong>신청인 연락처:</strong> ${userEmail || "미확인"}<br/>
    <strong>수수료:</strong> ₩${Number(partnerFee).toLocaleString()} (발행 완료 후 청구)
  </div>

  <p style="margin-top:20px;font-size:12px;color:#8a8a9a;">
    이 신청은 온리(Ownly) 임대 관리 플랫폼을 통해 접수됐습니다.<br/>
    1시간 내 신청인에게 연락 부탁드립니다.
  </p>
</div>`,
      });
    }

    // ── 3. 신청인에게 확인 이메일 발송 ─────────────────────────────
    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: `[온리] 세금계산서 발행 신청이 접수됐습니다 (#${requestId})`,
        html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e8e6e0;border-radius:12px;">
  <h2 style="color:#1a2744;">✅ 신청이 접수됐습니다</h2>
  <p style="color:#4a5568;font-size:14px;line-height:1.7;">
    <strong>${partnerName}</strong>에 세금계산서 발행을 신청했습니다.<br/>
    담당 세무사가 <strong style="color:#0fa573;">1시간 내</strong> 연락드립니다.
  </p>

  <div style="background:#f8f7f4;border-radius:10px;padding:16px;margin:20px 0;font-size:13px;">
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e8e6e0;">
      <span style="color:#8a8a9a;">신청번호</span><span style="font-weight:700;">#${requestId}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e8e6e0;">
      <span style="color:#8a8a9a;">발행 유형</span><span>${issueTypeLabel}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e8e6e0;">
      <span style="color:#8a8a9a;">합계</span><span style="font-weight:700;">${(Number(supplyAmt)+Number(taxAmt)).toLocaleString()}원</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;">
      <span style="color:#8a8a9a;">담당 세무사</span><span>${partnerName}</span>
    </div>
  </div>

  <p style="font-size:12px;color:#8a8a9a;">
    문의: inquiry@mclean21.com | 온리(Ownly) 임대 자산 관리 플랫폼
  </p>
</div>`,
      });
    }

    // ── 4. 운영자(inquiry@mclean21.com)에도 알림 ──────────────────
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[온리 신규 신청] 세금계산서 #${requestId} — ${partnerName}`,
      html: `<p>신청번호: #${requestId}<br/>신청인: ${userEmail}<br/>세무사: ${partnerName}<br/>금액: ${(Number(supplyAmt)+Number(taxAmt)).toLocaleString()}원</p>`,
    });

    return Response.json({ success: true, requestId });

  } catch (e) {
    console.error("tax-invoice API error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// 이력 조회 (GET)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ data: [] });

    const { data, error } = await supabase
      .from("tax_invoice_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
