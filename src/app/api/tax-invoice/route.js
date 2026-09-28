// src/app/api/tax-invoice/route.js
// 세무사 연결 사전 신청 — 온리는 전자세금계산서를 직접 발행하지 않는다. 요청을 저장하고 운영자에게 알린 뒤,
// 운영자가 직접 확인해 연락한다. (2026-09-28 이전: 가짜 제휴 세무사·평점, 무인증으로 임의 주소에 메일 발송 → 제거)
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = "inquiry@mclean21.com";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function userFrom(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : data?.user || null;
}

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: "온리 <noreply@ownly.kr>", to: [to], subject, html }),
  }).catch(() => {});
}

export async function POST(req) {
  const user = await userFrom(req);
  if (!user) return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const supply = Math.max(0, Math.round(Number(b.supplyAmt) || 0));
  if (!b.issueType) return Response.json({ error: "요청 유형을 선택해주세요" }, { status: 400 });

  const { data, error } = await admin().from("tax_invoice_requests").insert({
    user_id: user.id,
    user_email: user.email,
    issue_type: String(b.issueType).slice(0, 30),
    issue_type_label: String(b.issueTypeLabel || "").slice(0, 60),
    tenant_name: b.tenantName ? String(b.tenantName).slice(0, 60) : null,
    tenant_id: b.tenantId || null,
    supply_amt: supply,
    tax_amt: Math.round(supply * 0.1),
    total_amt: supply + Math.round(supply * 0.1),
    issue_date: String(b.issueDate || "").slice(0, 10),
    biz_no: b.bizNo ? String(b.bizNo).slice(0, 20) : null,
    memo: b.memo ? String(b.memo).slice(0, 1000) : null,
    status: "pending",
  }).select("id").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows = [
    ["요청 유형", b.issueTypeLabel], ["세입자", b.tenantName || "미기입"], ["사업자번호", b.bizNo || "미기입"],
    ["대상 연월", b.issueDate], ["공급가액", `${supply.toLocaleString()}원`], ["메모", b.memo || "-"],
  ].map(([k, v]) => `<tr><td style="padding:6px 10px;color:#8a8a9a;">${esc(k)}</td><td style="padding:6px 10px;">${esc(v)}</td></tr>`).join("");

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[온리] 세무사 연결 사전 신청 #${data.id}`,
    html: `<p>신청인: ${esc(user.email)} (${esc(user.id)})</p><table style="font-size:13px;border-collapse:collapse;">${rows}</table><p>영업일 1~2일 내 신청인에게 직접 연락해 주세요.</p>`,
  });
  // 확인 메일은 로그인한 본인 주소로만
  await sendEmail({
    to: user.email,
    subject: "[온리] 세무사 연결 신청이 접수됐습니다",
    html: `<div style="font-family:sans-serif;max-width:540px;"><p>세무사 연결 신청을 접수했습니다. 이 서비스는 아직 준비 단계로, <b>운영자가 신청 내용을 직접 확인한 뒤 영업일 기준 1~2일 안에</b> 연락드립니다.</p><p>온리는 전자세금계산서를 직접 발행하지 않으며, 세무사 수수료는 연결되는 세무사와 직접 정하시게 됩니다.</p><table style="font-size:13px;border-collapse:collapse;">${rows}</table><p style="font-size:12px;color:#8a8a9a;">문의: inquiry@mclean21.com</p></div>`,
  });
  return Response.json({ success: true, requestId: data.id });
}

// 본인 신청 이력
export async function GET(req) {
  const user = await userFrom(req);
  if (!user) return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data, error } = await admin().from("tax_invoice_requests")
    .select("id, created_at, issue_type_label, tenant_name, supply_amt, issue_date, status")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
