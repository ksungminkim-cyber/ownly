import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  // 다음달 계산
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  // 모든 유저 가져오기
  const { data: users } = await supabase.from("subscriptions").select("user_id, plan, status");
  const results = [];

  for (const user of (users || [])) {
    try {
      // 세입자 목록
      const { data: tenants } = await supabase.from("tenants").select("*").eq("user_id", user.user_id);
      if (!tenants?.length) continue;
      const tenantIds = tenants.map(t => t.id);

      // 이번달 납부 현황
      const { data: payments } = await supabase.from("payments").select("*").in("tenant_id", tenantIds).eq("month", month).eq("year", year);
      const paid = payments?.filter(p => p.status === "paid") || [];
      const unpaid = tenants.filter(t => !payments?.find(p => p.tenant_id === t.id && p.status === "paid"));

      // 다음달 만료 예정
      const expiring = tenants.filter(t => {
        if (!t.contract_end) return false;
        const end = new Date(t.contract_end);
        return end.getFullYear() === nextYear && end.getMonth() + 1 === nextMonth;
      });

      const totalRent = paid.reduce((s, p) => s + (p.amount || 0), 0);

      // 유저 이메일
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user.user_id);
      if (!authUser?.email) continue;

      const unpaidHtml = unpaid.length > 0
        ? `<ul>${unpaid.map(t => `<li><b>${t.name}</b> — ${t.address || ""} (${(t.rent||0).toLocaleString()}만원)</li>`).join("")}</ul>`
        : "<p>✅ 이번 달 미납 없음</p>";

      const expiringHtml = expiring.length > 0
        ? `<ul>${expiring.map(t => `<li><b>${t.name}</b> — ${t.contract_end?.slice(0,10)} 만료</li>`).join("")}</ul>`
        : "<p>✅ 다음 달 만료 예정 없음</p>";

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="background:#1a2744;padding:20px 24px;border-radius:12px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">온리 월간 수금 리포트</h1>
            <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:14px">${year}년 ${month}월</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:16px">
            <p style="font-size:13px;color:#166534;font-weight:700;margin:0 0 4px">이번 달 수금 완료</p>
            <p style="font-size:28px;font-weight:900;color:#15803d;margin:0">${totalRent.toLocaleString()}만원</p>
            <p style="font-size:12px;color:#166534;margin:4px 0 0">${paid.length}건 납부 완료 · ${unpaid.length}건 미납</p>
          </div>
          ${unpaid.length > 0 ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin-bottom:16px"><p style="font-size:13px;color:#991b1b;font-weight:700;margin:0 0 8px">⚠️ 미납 세입자 (${unpaid.length}명)</p>${unpaidHtml}</div>` : ""}
          ${expiring.length > 0 ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:16px"><p style="font-size:13px;color:#92400e;font-weight:700;margin:0 0 8px">📅 다음 달 계약 만료 예정 (${expiring.length}건)</p>${expiringHtml}</div>` : ""}
          <div style="text-align:center;margin-top:24px"><a href="https://ownly.kr/dashboard" style="background:#1a2744;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">대시보드 확인하기 →</a></div>
          <p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:20px">온리(Ownly) · 수신 거부는 설정에서 변경하세요</p>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "온리 <noreply@ownly.kr>",
          to: authUser.email,
          subject: `[온리] ${year}년 ${month}월 수금 리포트 — ${paid.length}건 완료, 미납 ${unpaid.length}건`,
          html,
        }),
      });

      results.push({ email: authUser.email, sent: true });
    } catch(e) {
      results.push({ userId: user.user_id, error: String(e) });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), { headers: { "Content-Type": "application/json" } });
});
