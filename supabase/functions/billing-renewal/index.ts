// 구독 자동 갱신 Edge Function
// 매일 00:00 UTC (09:00 KST)에 pg_cron 으로 호출됨
// 만료된 active 구독을 찾아 Toss billing_key 로 재결제

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const PLANS_PRICE: Record<string, number> = { starter: 9900, plus: 19900, pro: 32900 };
const PLAN_LABEL: Record<string, string> = { starter: "스타터", plus: "플러스", pro: "프로" };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sendFailureEmail(to: string, planLabel: string, reason: string) {
  if (!RESEND_API_KEY || !to) return;
  const html = `
    <div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:520px;margin:0 auto;">
      <div style="background:#1a2744;padding:22px 26px;border-radius:12px 12px 0 0;">
        <p style="color:#fff;font-size:15px;font-weight:800;margin:0;">⚠️ 온리 자동 결제 실패</p>
      </div>
      <div style="background:#fff;padding:22px 26px;border:1px solid #e8e6e0;border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:14px;color:#1a2744;line-height:1.7;margin:0 0 12px;">
          <b>${planLabel}</b> 플랜 자동 결제에 실패했습니다.
        </p>
        <p style="font-size:12px;color:#e8445a;background:rgba(232,68,90,0.06);padding:10px 12px;border-radius:8px;margin:0 0 16px;">사유: ${reason}</p>
        <p style="font-size:13px;color:#6a6a7a;line-height:1.7;margin:0 0 18px;">
          카드 유효기간·한도·잔액을 확인해주세요. 3일 내 정상화되지 않으면 프리미엄 기능이 중단됩니다.
        </p>
        <a href="https://www.ownly.kr/dashboard/billing" style="display:inline-block;padding:11px 22px;background:#1a2744;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:700;">결제 관리로 이동 →</a>
      </div>
    </div>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "온리 <noreply@ownly.kr>", to: [to], subject: "[온리] 자동 결제 실패 — 확인이 필요합니다", html }),
    });
  } catch (e) {
    console.error("failure email send failed:", e);
  }
}

async function chargeRenewal(sub: any) {
  const planId = sub.plan;
  const amount = PLANS_PRICE[planId];
  if (!amount || !sub.billing_key) {
    return { ok: false, error: `유효하지 않은 플랜/빌링키: ${planId}` };
  }
  // idempotent orderId: yyyymm 단위로 1회만 가능
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const orderId = `ownly_${planId}_renewal_${sub.user_id}_${ym}`;

  const res = await fetch(`https://api.tosspayments.com/v1/billing/${sub.billing_key}`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(TOSS_SECRET_KEY + ":"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerKey: sub.user_id,
      amount,
      orderId,
      orderName: `Ownly ${PLAN_LABEL[planId] || planId} 월 구독`,
      taxFreeAmount: 0,
    }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.message || JSON.stringify(data), data };
  return { ok: true, data, orderId, amount };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  // 인증: service_role 키만 허용 (pg_cron 에서 호출)
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (token !== SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }

  // TOSS_SECRET_KEY 미설정 시 즉시 no-op 종료 (오탐 past_due 방지)
  if (!TOSS_SECRET_KEY) {
    console.log("TOSS_SECRET_KEY not set — skipping renewal run");
    return new Response(
      JSON.stringify({ skipped: true, reason: "TOSS_SECRET_KEY not configured" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const nowIso = new Date().toISOString();

  // 활성 구독 중 만료된 것만 조회
  const { data: subs, error: subErr } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .lte("current_period_end", nowIso);

  if (subErr) {
    console.error("subscriptions query failed:", subErr);
    return new Response(JSON.stringify({ error: subErr.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }

  const results: any[] = [];
  let succeeded = 0, failed = 0;

  for (const sub of subs || []) {
    const result = await chargeRenewal(sub);

    if (result.ok) {
      const charge = result.data;
      const newPeriodEnd = new Date();
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      await supabase
        .from("subscriptions")
        .update({
          current_period_end: newPeriodEnd.toISOString(),
          toss_order_id: charge.orderId,
          updated_at: nowIso,
        })
        .eq("user_id", sub.user_id);

      await supabase.from("billing_history").insert({
        user_id: sub.user_id,
        plan: sub.plan,
        amount: result.amount,
        status: "paid",
        method: charge.method || "card",
        toss_payment_key: charge.paymentKey || null,
        toss_order_id: charge.orderId,
        receipt_url: charge.receipt?.url || null,
        paid_at: charge.approvedAt || nowIso,
      });

      succeeded++;
      results.push({ user_id: sub.user_id, status: "renewed", orderId: charge.orderId });
    } else {
      // 실패: past_due 로 전환, 이력 기록, 이메일 통지
      await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: nowIso })
        .eq("user_id", sub.user_id);

      await supabase.from("billing_history").insert({
        user_id: sub.user_id,
        plan: sub.plan,
        amount: PLANS_PRICE[sub.plan] || 0,
        status: "failed",
        error_message: result.error,
        paid_at: nowIso,
      });

      // 유저 이메일 조회 후 실패 안내
      const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id);
      const email = authUser?.user?.email;
      if (email) {
        await sendFailureEmail(email, PLAN_LABEL[sub.plan] || sub.plan, result.error || "알 수 없는 오류");
      }

      failed++;
      results.push({ user_id: sub.user_id, status: "failed", error: result.error });
    }
  }

  return new Response(
    JSON.stringify({ processed: (subs || []).length, succeeded, failed, results }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
});
