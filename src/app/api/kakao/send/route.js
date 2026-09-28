// src/app/api/kakao/send/route.js
// 세입자 알림톡 수동 발송 — 템플릿·변수·Solapi 호출·발송 기록은 src/lib/alimtalk.js (크론 자동 발송과 공용)
import { createClient } from "@supabase/supabase-js";
import { PLANS, PAID_PLAN_ID } from "../../../../lib/constants";
import { entitlementsOf } from "../../../../lib/plan";
import { sendTenantAlimtalk, kakaoUsedThisMonth } from "../../../../lib/alimtalk";

const supabaseAdmin = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// tab → notification_logs.type 매핑
const TAB_TO_TYPE = {
  unpaid: "unpaid",
  upcoming: "unpaid",
  expiring: "expiry",
};

// 인증 + 플랜 검증 — 알림톡은 실비(Solapi)가 발생하므로 반드시 서버에서 확인
async function verifyProUser(req) {
  if (!supabaseAdmin) return { error: "서버 설정 오류", status: 500 };
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { error: "로그인이 필요합니다", status: 401 };
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { error: "인증에 실패했습니다. 다시 로그인해주세요.", status: 401 };
  const user = data.user;

  // 월 발송 한도 — 한도는 entitlementsOf(PLANS · 기존 가입자 LEGACY_LIMITS) 한 곳에서 판정. 자동 발송분도 같은 한도에 포함
  const { data: sub } = await supabaseAdmin.from("subscriptions").select("plan,status,current_period_end,kakao_sid,billing_key").eq("user_id", user.id).maybeSingle();
  const ent = entitlementsOf(user, sub);
  const limit = ent.limits.kakaoMonthly || 0;
  const plusLimit = PLANS[PAID_PLAN_ID].limits.kakaoMonthly;
  if (!limit) return { error: `카카오 알림톡은 플러스 플랜(월 ${PLANS[PAID_PLAN_ID].price.toLocaleString()}원)에서 사용할 수 있습니다`, status: 403 };
  const upsell = ent.legacy ? ` 플러스 구독 시 월 ${plusLimit}건까지 늘어납니다.` : "";
  const count = await kakaoUsedThisMonth(supabaseAdmin, user.id);
  if (count >= limit) {
    return { error: `알림톡은 월 ${limit}건까지 발송할 수 있습니다 (이번 달 ${count}건 사용).${upsell}`, status: 429 };
  }
  return { user };
}

export async function POST(req) {
  const auth = await verifyProUser(req);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { tab, tenant } = body || {};
  if (!tenant?.phone) return Response.json({ error: "전화번호 없음" }, { status: 400 });

  const r = await sendTenantAlimtalk({ admin: supabaseAdmin, userId: auth.user.id, tenant, tab, logType: TAB_TO_TYPE[tab] || "kakao" });
  if (!r.ok) return Response.json({ error: r.error }, { status: r.error?.startsWith("템플릿 없음") ? 400 : 500 });
  return Response.json({ success: true, messageId: r.messageId });
}
