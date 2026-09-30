// src/app/api/share/route.js
// 읽기 전용 공유 링크(세무사·가족용 연간 보고서) — 생성·목록·해지. 로그인 필요(Authorization: Bearer <access_token>).
// 토큰은 서버가 32바이트 랜덤으로 만든다. 공개 조회는 /api/share/[token].
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const EXPIRY_DAYS = new Set([7, 30, 90]);
const MAX_ACTIVE = 20;

async function userFrom(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : data?.user || null;
}

export async function GET(req) {
  const user = await userFrom(req);
  if (!user) return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data, error } = await admin().from("share_links")
    .select("id, token, scope, year, label, expires_at, revoked_at, created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ links: data || [] });
}

export async function POST(req) {
  const user = await userFrom(req);
  if (!user) return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const year = Number(body.year);
  const days = Number(body.days);
  const label = String(body.label || "").trim().slice(0, 40) || null;
  const thisYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 2000 || year > thisYear) return Response.json({ error: "연도를 확인해 주세요" }, { status: 400 });
  if (!EXPIRY_DAYS.has(days)) return Response.json({ error: "만료 기간은 7·30·90일 중에서 골라 주세요" }, { status: 400 });

  const db = admin();
  const { count } = await db.from("share_links").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).is("revoked_at", null).gt("expires_at", new Date().toISOString());
  if ((count || 0) >= MAX_ACTIVE) return Response.json({ error: `유효한 공유 링크는 최대 ${MAX_ACTIVE}개까지예요. 쓰지 않는 링크를 해지해 주세요` }, { status: 400 });

  const row = {
    user_id: user.id, token: randomBytes(32).toString("base64url"), scope: "annual_report", year, label,
    expires_at: new Date(Date.now() + days * 86400000).toISOString(),
  };
  const { data, error } = await db.from("share_links").insert([row])
    .select("id, token, scope, year, label, expires_at, revoked_at, created_at").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ link: data });
}

// ?id=... → 해지(revoked_at 기록). 삭제하지 않고 남겨 두어 목록에서 해지 이력을 볼 수 있게 한다
export async function DELETE(req) {
  const user = await userFrom(req);
  if (!user) return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id 가 필요합니다" }, { status: 400 });
  const { data, error } = await admin().from("share_links").update({ revoked_at: new Date().toISOString() })
    .eq("id", id).eq("user_id", user.id).is("revoked_at", null).select("id");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data?.length) return Response.json({ error: "링크를 찾을 수 없습니다" }, { status: 404 });
  return Response.json({ ok: true });
}
