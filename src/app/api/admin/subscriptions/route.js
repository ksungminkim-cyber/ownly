// 관리자 전용 — 전체 구독·결제 이력 조회와 플랜 수동 변경.
// subscriptions 는 RLS 로 본인 행만 읽히고 update/insert 정책이 없어(20260910_security_hardening.sql),
// 관리자 화면이 클라이언트에서 직접 읽고 쓰면 본인 데이터만 보이고 변경은 0행 갱신(오류 없음)으로 사라졌다.
// 로그인 토큰의 이메일이 ADMIN_EMAILS 에 있을 때만 service role 로 처리한다.

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "../../../../lib/constants";

const PLANS_OK = ["free", "plus"];
const STATUS_OK = ["active", "inactive", "cancelled", "trial"];

async function adminFrom(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "로그인 필요" }, { status: 401 }) };
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { error: NextResponse.json({ error: "인증 실패" }, { status: 401 }) };
  if (!ADMIN_EMAILS.includes(data.user.email)) return { error: NextResponse.json({ error: "권한 없음" }, { status: 403 }) };
  return { admin };
}

export async function GET(req) {
  const { admin, error } = await adminFrom(req);
  if (error) return error;
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const [subs, billing] = await Promise.all([
    admin.from("subscriptions").select("*").order("created_at", { ascending: false }),
    admin.from("billing_history").select("plan, amount, status, paid_at").gte("paid_at", yearAgo.toISOString()).order("paid_at", { ascending: true }),
  ]);
  if (subs.error) return NextResponse.json({ error: subs.error.message }, { status: 500 });
  return NextResponse.json({ subs: subs.data || [], billing: billing.data || [] });
}

export async function POST(req) {
  const { admin, error } = await adminFrom(req);
  if (error) return error;
  const { userId, plan, status } = await req.json().catch(() => ({}));
  if (!userId || !PLANS_OK.includes(plan) || !STATUS_OK.includes(status)) {
    return NextResponse.json({ error: "userId·plan·status 값을 확인해주세요" }, { status: 400 });
  }
  const { data, error: upErr } = await admin.from("subscriptions")
    .upsert({ user_id: userId, plan, status, current_period_end: null, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    .select("user_id");
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "변경된 행이 없습니다" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
