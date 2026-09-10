// 세입자 수리 요청 (로그인 없음) — service role 로 처리
// 배경: /request/[tenantId] 페이지가 익명 supabase 클라이언트로 tenants 조회·repairs insert 를 직접 하고 있었는데,
//       RLS(20260520_core_tables_rls) 가 user_id 소유자만 허용하므로 세입자에게는 항상 "링크를 확인해주세요"로 떨어졌다.
//       포털(/api/portal/[tenantId])과 같은 방식으로 서버가 tenantId(UUID = 링크 토큰)를 검증하고 최소 정보만 다룬다.

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATS = new Set(["도배/장판", "배관/수도", "전기", "에어컨/냉난방", "창문/문", "주방", "욕실", "외벽/지붕", "기타"]);

// 남용 방지: tenantId 당 하루 5건
const DAILY_LIMIT = 5;

export async function GET(_req, { params }) {
  const { tenantId } = await params;
  if (!UUID.test(tenantId || "")) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data, error } = await admin().from("tenants").select("id, name, address").eq("id", tenantId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ tenant: data }); // user_id·전화번호 등은 내려주지 않음
}

export async function POST(req, { params }) {
  const { tenantId } = await params;
  if (!UUID.test(tenantId || "")) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const category = CATS.has(body.category) ? body.category : "기타";
  const desc = String(body.desc || "").trim().slice(0, 1000);
  const urgent = body.urgent === true;
  if (!desc) return NextResponse.json({ error: "내용을 입력해주세요" }, { status: 400 });

  const sb = admin();
  const { data: tenant } = await sb.from("tenants").select("id, name, address, user_id").eq("id", tenantId).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const since = new Date(Date.now() - 86400000).toISOString();
  const { count } = await sb.from("repairs").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("source", "tenant").gte("created_at", since);
  if ((count || 0) >= DAILY_LIMIT) return NextResponse.json({ error: "오늘 접수 가능한 요청 수를 초과했습니다. 급한 건은 임대인에게 직접 연락해 주세요." }, { status: 429 });

  const { data: inserted, error } = await sb.from("repairs").insert([{
    tenant_id: tenantId,
    user_id: tenant.user_id,
    category,
    memo: urgent ? "[긴급] " + desc : desc,
    date: new Date().toISOString().slice(0, 10),
    cost: 0,
    receipt_yn: false,
    vendor: "",
    property_name: tenant.address || "",
    status: "open",
    source: "tenant",
    priority: urgent ? "urgent" : "normal",
  }]).select("id").single();
  if (error) return NextResponse.json({ error: "접수 저장 실패: " + error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: inserted.id, tenant: { name: tenant.name, address: tenant.address } });
}
