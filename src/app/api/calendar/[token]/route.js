// src/app/api/calendar/[token]/route.js
// 캘린더 구독(ICS) — 구글 캘린더·아이폰이 로그인 없이 주기적으로 가져가는 공개 URL.
// 토큰(설정 화면에서 발급, calendar_feeds)이 비밀값 역할. service role 로 토큰 → user_id → tenants 를 읽어
// src/lib/ics.js 로 정적 ICS 를 만든다. 세입자 전화번호 등 연락처는 넣지 않는다.
import { createClient } from "@supabase/supabase-js";
import { buildCalendar, buildLandlordEvents, todayKST } from "../../../../lib/ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const notFound = () => new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export async function GET(_req, { params }) {
  const raw = String((await params)?.token || "").replace(/\.ics$/i, "");
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(raw)) return notFound();

  const db = admin();
  const { data: feed } = await db.from("calendar_feeds").select("user_id").eq("token", raw).maybeSingle();
  if (!feed?.user_id) return notFound();

  const { data: tenants, error } = await db.from("tenants").select("*").eq("user_id", feed.user_id);
  if (error) return new Response("Temporary error", { status: 503, headers: { "Cache-Control": "no-store" } });

  const ics = buildCalendar({ events: buildLandlordEvents(tenants || [], todayKST()) });
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="ownly.ics"',
      "Cache-Control": "private, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
