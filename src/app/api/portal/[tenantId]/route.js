// 세입자 포털 — 공개 조회 API (URL의 tenantId UUID가 토큰 역할)
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req, { params }) {
  const { tenantId } = await params;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1) 세입자 정보 (공개 가능 필드만)
  const { data: tenant, error: tErr } = await admin
    .from("tenants")
    .select("id, name, address, p_type, sub_type, rent, deposit, maintenance, contract_end, start_date, pay_day, status, business_name")
    .eq("id", tenantId)
    .single();

  if (tErr || !tenant) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 2) 최근 12개월 납부 내역
  const now = new Date();
  const yearFrom = now.getFullYear() - 1;
  const { data: payments } = await admin
    .from("payments")
    .select("tenant_id, year, month, status, paid_date, amount, maintenance_paid, maintenance_paid_date")
    .eq("tenant_id", tenantId)
    .gte("year", yearFrom)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(18);

  // 3) 수리 이력 (세입자가 등록한 것 + 임대인이 처리한 것)
  const { data: repairs } = await admin
    .from("repairs")
    .select("id, date, category, memo, status, priority, source, completed_at, response_memo, cost")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(30);

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      address: tenant.address,
      pType: tenant.p_type,
      sub: tenant.sub_type,
      rent: tenant.rent,
      deposit: tenant.deposit,
      maintenance: tenant.maintenance || 0,
      contract_end: tenant.contract_end,
      start_date: tenant.start_date,
      pay_day: tenant.pay_day || 5,
      status: tenant.status,
      biz: tenant.business_name,
    },
    payments: payments || [],
    repairs: repairs || [],
  });
}
