// 월간 임대인 결산 리포트 — 매월 1일 KST 09:00 자동 발송
// 지난 달 수입·지출·이슈를 정리해 이메일로 전달 (retention + 업셀 훅)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://www.ownly.kr";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const fmt = (n: number) => (n || 0).toLocaleString();

function baseHtml(title: string, body: string) {
  return `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:560px;margin:0 auto;background:#f5f4f0;">
  <div style="background:linear-gradient(135deg,#1a2744,#2d4270,#5b4fcf);padding:28px 30px;border-radius:14px 14px 0 0;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="width:32px;height:32px;background:rgba(255,255,255,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;">
        <span style="color:#fff;font-size:15px;">🏠</span>
      </div>
      <span style="color:#fff;font-size:14px;font-weight:800;letter-spacing:-.3px;">온리(Ownly) 월간 결산</span>
    </div>
    <h1 style="color:#fff;font-size:20px;font-weight:900;margin:0;line-height:1.4;">${title}</h1>
  </div>
  <div style="background:#fff;padding:26px 30px;border-radius:0 0 14px 14px;border:1px solid #e8e6e0;border-top:none;">
    ${body}
    <div style="margin-top:24px;padding-top:18px;border-top:1px solid #f0efe9;">
      <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#1a2744;color:#fff;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;">
        📊 대시보드에서 상세 보기 →
      </a>
    </div>
    <p style="margin-top:18px;font-size:11px;color:#b0aead;line-height:1.6;">
      이 이메일은 매월 1일 자동 발송됩니다.<br/>
      수신 거부: <a href="${SITE_URL}/dashboard/settings" style="color:#b0aead;">설정에서 알림 관리</a> · 문의: inquiry@mclean21.com
    </p>
  </div>
</div>`;
}

function kpiCard(label: string, value: string, color: string, sub: string = "") {
  return `
  <div style="background:#f8f7f4;border:1px solid #ebe9e3;border-radius:10px;padding:14px 16px;text-align:center;">
    <p style="font-size:10px;color:#8a8a9a;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin:0 0 6px;">${label}</p>
    <p style="font-size:18px;font-weight:900;color:${color};margin:0;">${value}</p>
    ${sub ? `<p style="font-size:10px;color:#a0a0b0;margin:4px 0 0;">${sub}</p>` : ""}
  </div>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return { skipped: true };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: "온리 <noreply@ownly.kr>", to: [to], subject, html }),
  });
  return res.json();
}

async function buildReportForUser(supabase: any, user: any) {
  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastYear = lastMonthDate.getFullYear();

  // 세입자
  const { data: tenants } = await supabase.from("tenants").select("*").eq("user_id", user.id);
  if (!tenants || tenants.length === 0) return { skipped: true, reason: "no_tenants" };

  const activeTenants = tenants.filter((t: any) => t.status !== "공실");
  const vacancies = tenants.filter((t: any) => t.status === "공실");
  const tenantIds = tenants.map((t: any) => t.id);

  // 지난 달 수금
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .in("tenant_id", tenantIds)
    .eq("year", lastYear)
    .eq("month", lastMonth);

  const expectedGross = activeTenants.reduce((s: number, t: any) => s + (Number(t.rent) || 0), 0);
  const paidGross = (payments || [])
    .filter((p: any) => p.status === "paid")
    .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const collectionRate = expectedGross > 0 ? Math.round((paidGross / expectedGross) * 100) : 0;
  const unpaidCount = activeTenants.length - (payments?.filter((p: any) => p.status === "paid").length || 0);

  // 공실 손실
  const vacancyLoss = vacancies.reduce((s: number, t: any) => s + (Number(t.rent) || 0), 0);

  // 지난 달 수리비 (경비)
  const lastMonthStart = `${lastYear}-${String(lastMonth).padStart(2, "0")}-01`;
  const nextMonthStart = new Date(lastYear, lastMonth, 1).toISOString().slice(0, 10);
  const { data: repairs } = await supabase
    .from("repairs")
    .select("cost, category")
    .eq("user_id", user.id)
    .gte("date", lastMonthStart)
    .lt("date", nextMonthStart);
  const repairCost = (repairs || []).reduce((s: number, r: any) => s + (Number(r.cost) || 0), 0);

  // 계약 만료 임박
  const soonExpiring = activeTenants.filter((t: any) => {
    const end = t.contract_end || t.end_date;
    if (!end) return false;
    const d = Math.ceil((new Date(end).getTime() - now.getTime()) / 86400000);
    return d > 0 && d <= 90;
  }).length;

  const netEstimate = paidGross - repairCost;

  const body = `
    <p style="font-size:13px;color:#8a8a9a;margin:0 0 8px;">${lastYear}년 ${lastMonth}월 임대 활동 결산 리포트입니다.</p>

    <div style="background:linear-gradient(135deg,#1a2744,#5b4fcf);border-radius:14px;padding:22px;margin:0 0 22px;text-align:center;">
      <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">지난 달 순수익 (추정)</p>
      <p style="color:#fff;font-size:34px;font-weight:900;margin:0;letter-spacing:-.5px;">${fmt(netEstimate)}만원</p>
      <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:6px 0 0;">수금 ${fmt(paidGross)}만원 · 경비 ${fmt(repairCost)}만원</p>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
      ${kpiCard("수금률", collectionRate + "%", collectionRate >= 80 ? "#0fa573" : "#e8445a", `${fmt(paidGross)} / ${fmt(expectedGross)}만원`)}
      ${kpiCard("미납", unpaidCount + "건", unpaidCount > 0 ? "#e8445a" : "#0fa573", unpaidCount > 0 ? "즉시 확인 필요" : "모두 정상")}
      ${kpiCard("공실", vacancies.length + "건", vacancies.length > 0 ? "#e8445a" : "#0fa573", vacancies.length > 0 ? `월 손실 ${fmt(vacancyLoss)}만원` : "전 물건 임대 중")}
      ${kpiCard("만료 임박", soonExpiring + "건", soonExpiring > 0 ? "#e8960a" : "#8a8a9a", "90일 이내")}
    </div>

    ${(unpaidCount > 0 || vacancies.length > 0 || soonExpiring > 0) ? `
    <div style="background:#fff8e6;border:1px solid #f0d88a;border-radius:10px;padding:14px 16px;margin-bottom:18px;">
      <p style="font-size:12px;color:#b8860b;font-weight:700;margin:0 0 6px;">⚡ 이번 달 우선 액션</p>
      <ul style="font-size:12px;color:#8a7a4a;margin:0;padding-left:18px;line-height:1.8;">
        ${unpaidCount > 0 ? `<li><b>미납 ${unpaidCount}건</b> — 대응 플랜에서 단계별 조치 확인</li>` : ""}
        ${vacancies.length > 0 ? `<li><b>공실 ${vacancies.length}실</b> — 공실 해소 액션플랜으로 기간별 전략 실행</li>` : ""}
        ${soonExpiring > 0 ? `<li><b>만료 임박 ${soonExpiring}건</b> — 갱신 의향 확인·협상 시작</li>` : ""}
      </ul>
    </div>` : ""}

    <div style="background:rgba(91,79,207,0.06);border:1px solid rgba(91,79,207,0.2);border-radius:10px;padding:13px 16px;">
      <p style="font-size:12px;color:#5b4fcf;font-weight:700;margin:0 0 4px;">🧾 연말 세금 준비</p>
      <p style="font-size:11px;color:#6a6a7a;line-height:1.7;margin:0 0 10px;">
        지난 달 누적 경비 <b>${fmt(repairCost)}만원</b>이 필요경비로 집계됐습니다.
        아래 버튼으로 <b>세무사 제출용 연간 리포트</b>를 바로 출력하실 수 있어요.
      </p>
      <a href="${SITE_URL}/dashboard/reports/tax-annual" style="display:inline-block;padding:9px 18px;background:#5b4fcf;color:#fff;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700;">
        📋 세무사용 PDF 열기 →
      </a>
    </div>
  `;

  return {
    body,
    subject: `[온리] ${lastYear}년 ${lastMonth}월 임대 결산 — 순수익 ${fmt(netEstimate)}만원`,
    title: `📊 ${lastMonth}월 월간 결산 리포트`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 인증: service_role (pg_cron) 또는 유저 본인 (테스트 발송)
  const isService = token === SUPABASE_SERVICE_KEY;
  let targetUserIds: string[] = [];

  if (isService) {
    // 모든 활성 유저 대상 일괄 발송
    const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    targetUserIds = (users?.users || [])
      .filter((u: any) => u.email && !u.banned_until)
      .map((u: any) => u.id);
  } else {
    // 유저 본인 테스트 발송
    const { data: userData, error } = await supabase.auth.getUser(token);
    if (error || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }
    targetUserIds = [userData.user.id];
  }

  const results = [];
  for (const uid of targetUserIds) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(uid);
      const email = authUser?.user?.email;
      if (!email) continue;

      const report = await buildReportForUser(supabase, authUser.user);
      if (report.skipped) { results.push({ uid, skipped: report.reason }); continue; }

      const sendResult = await sendEmail(email, report.subject, baseHtml(report.title, report.body));
      results.push({ uid, email, sent: !sendResult?.skipped });
    } catch (e) {
      results.push({ uid, error: (e as Error).message });
    }
  }

  return new Response(
    JSON.stringify({ processed: targetUserIds.length, results }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
});
