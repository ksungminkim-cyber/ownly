// src/app/api/billing/confirm/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // 서버 전용 서비스 키
);

export async function POST(req) {
  const { planId, authKey, customerKey } = await req.json();

  try {
    // 1. Toss Payments 빌링키 발급
    const tossRes = await fetch("https://api.tosspayments.com/v1/billing/authorizations/issue", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(process.env.TOSS_SECRET_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ authKey, customerKey }),
    });
    const billing = await tossRes.json();
    if (!tossRes.ok) throw new Error(billing.message);

    const billingKey = billing.billingKey;

    // 2. 최초 1회 결제 실행
    const PLANS_PRICE = { starter: 9900, pro: 19900 };
    const chargeRes = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(process.env.TOSS_SECRET_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerKey,
        amount: PLANS_PRICE[planId],
        orderId: `ownly_${planId}_${Date.now()}`,
        orderName: `Ownly ${planId === "starter" ? "스타터" : "프로"} 월 구독`,
        customerEmail: billing.customerEmail || "",
        taxFreeAmount: 0,
      }),
    });
    const charge = await chargeRes.json();
    if (!chargeRes.ok) throw new Error(charge.message);

    // 3. Supabase에 구독 정보 저장
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from("subscriptions").upsert({
      user_id: customerKey,
      plan: planId,
      billing_key: billingKey,
      status: "active",
      current_period_end: periodEnd.toISOString(),
      toss_order_id: charge.orderId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Billing error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
