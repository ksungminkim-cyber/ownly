// 카카오페이 정기결제 — 매월 자동 청구 (3단계, sid 사용)
// 호출 주체:
//   - ✅ Vercel Cron Jobs (vercel.json 의 crons 정의 — 매일 09:30 KST). CRON_SECRET 이 설정돼 있으면 Vercel 이 Authorization: Bearer 로 자동 주입
//   - 외부 cron 서비스 (cron-job.org 등) — x-billing-token
//   - 운영자 — Bearer SERVICE_ROLE_KEY (userId 지정·force 강제 청구는 이 경로에서만)
//
// 보안 원칙 (2026-09-10 감사 반영):
//   - user-agent "vercel-cron" 폴백은 CRON_SECRET·BILLING_RENEWAL_TOKEN 이 둘 다 없을 때만 허용 (UA 는 누구나 위조 가능)
//   - 청구 전 next_payment_at 을 원자적으로 선점(CAS)해 동시 실행·중복 호출 시 이중 과금 방지
//   - past_due 는 매일 재시도, 유예 기간이 지나면 해지 처리

export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextResponse } from "next/server";
import { KAKAOPAY_BASE, KAKAOPAY_CID, KAKAOPAY_SECRET, authHeaders, adminClient, PLAN_PRICE_KRW, fmtKakaoError, cycleAmount, itemNameFor, nextPeriodDate } from "../_helpers";
import { GRACE_DAYS } from "../../../../../lib/plan";

const RENEWAL_TOKEN = process.env.BILLING_RENEWAL_TOKEN || "";
const CRON_SECRET = process.env.CRON_SECRET || "";
const PAST_DUE_MAX_DAYS = 7; // 갱신 실패 후 재시도 기간 (이후 해지)

// 반환: null(거부) | "cron"(스케줄 실행만) | "admin"(userId·force 허용)
function authLevel(req) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (bearer && process.env.SUPABASE_SERVICE_ROLE_KEY && bearer === process.env.SUPABASE_SERVICE_ROLE_KEY) return "admin";
  const xTok = req.headers.get("x-billing-token") || "";
  if (RENEWAL_TOKEN && xTok === RENEWAL_TOKEN) return "admin";
  if (CRON_SECRET && bearer === CRON_SECRET) return "cron";
  // 시크릿이 하나도 설정되지 않은 배포에서만 UA 폴백 (설정 후에는 위조 불가한 토큰만 인정)
  if (!CRON_SECRET && !RENEWAL_TOKEN && /vercel-cron/i.test(req.headers.get("user-agent") || "")) return "cron";
  return null;
}

// Vercel Cron 은 GET 으로 호출하므로 POST/GET 모두 허용
export async function GET(req) {
  return handle(req, {});
}

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  return handle(req, body);
}

async function handle(req, body) {
  const level = authLevel(req);
  if (!level) return NextResponse.json({ error: "권한 없음" }, { status: 401 });
  if (!KAKAOPAY_SECRET) return NextResponse.json({ error: "KAKAOPAY_SECRET_KEY 미설정" }, { status: 500 });

  // 특정 사용자 지정·강제 청구는 운영자 인증에서만
  const onlyUserId = level === "admin" ? body.userId : undefined;
  const force = level === "admin" && body.force === true;

  const admin = adminClient();
  const now = new Date();

  // 청구 대상: pg=kakao, status active|past_due, sid 존재, next_payment_at <= now
  let q = admin
    .from("subscriptions")
    .select("*")
    .eq("pg", "kakao")
    .in("status", ["active", "past_due"])
    .not("kakao_sid", "is", null);
  if (onlyUserId) q = q.eq("user_id", onlyUserId);
  if (!force) q = q.lte("next_payment_at", now.toISOString());

  const { data: subs, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const sub of subs || []) {
    const planId = sub.plan;
    if (!PLAN_PRICE_KRW[planId]) { results.push({ user_id: sub.user_id, skipped: "unknown plan" }); continue; }

    // past_due 유예 초과 → 해지 (sid 는 카카오 측에 남지만 우리가 호출하지 않는 한 청구되지 않음)
    if (sub.status === "past_due") {
      const since = new Date(sub.current_period_end || sub.next_payment_at || now);
      if ((now - since) / 86400000 > PAST_DUE_MAX_DAYS) {
        await admin.from("subscriptions").update({
          status: "cancelled", next_payment_at: null, cancelled_at: now.toISOString(),
          cancel_reason: `renew_failed_${PAST_DUE_MAX_DAYS}d`, updated_at: now.toISOString(),
        }).eq("user_id", sub.user_id);
        results.push({ user_id: sub.user_id, cancelled: "past_due_expired" });
        continue;
      }
    }

    // ── 선점(CAS): next_payment_at 을 내일로 밀어 두고 시작. 동시 실행된 다른 인스턴스는 0행 갱신 → 건너뜀
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    let claim = admin.from("subscriptions").update({ next_payment_at: tomorrow.toISOString(), updated_at: now.toISOString() }).eq("user_id", sub.user_id);
    claim = sub.next_payment_at ? claim.eq("next_payment_at", sub.next_payment_at) : claim.is("next_payment_at", null);
    const { data: claimed } = await claim.select("user_id");
    if (!claimed || claimed.length === 0) { results.push({ user_id: sub.user_id, skipped: "already_claimed" }); continue; }

    // 단일 가격: 항상 현재 플랜 가격(PLANS)으로 청구. 결제 주기는 구독 레코드 기준(신규는 월간만, 과거 연간 레코드 호환)
    const cycle = sub.billing_cycle === "annual" ? "annual" : "monthly";
    const monthly = PLAN_PRICE_KRW[planId];
    const amount = cycleAmount(monthly, cycle);
    const orderId = `ownly_renew_${planId}_${sub.user_id.slice(0,8)}_${Date.now()}`;

    try {
      const resp = await fetch(`${KAKAOPAY_BASE}/online/v1/payment/subscription`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          cid: KAKAOPAY_CID,
          sid: sub.kakao_sid,
          partner_order_id: orderId,
          partner_user_id: sub.user_id,
          item_name: itemNameFor(planId, cycle) + " (자동결제)",
          quantity: 1,
          total_amount: amount,
          tax_free_amount: 0,
        }),
      });
      const k = await resp.json();

      if (!resp.ok) {
        // 실패 처리: past_due 로 표시하고 다음날 재시도 (선점 단계에서 이미 next_payment_at=내일)
        await admin.from("subscriptions").update({
          status: "past_due",
          cancel_reason: `kakao_renew_fail: ${k?.error_code || resp.status} ${k?.error_message || ""}`,
          updated_at: new Date().toISOString(),
        }).eq("user_id", sub.user_id);
        await admin.from("billing_history").insert({
          user_id: sub.user_id,
          plan: planId,
          amount,
          status: "failed",
          method: "card",
          pg: "kakao",
          paid_at: new Date().toISOString(),
        });
        results.push({ user_id: sub.user_id, ok: false, ...fmtKakaoError(resp, k) });
        continue;
      }

      // 성공: 다음 결제 예정일은 원래 예정일 기준으로 한 주기 뒤 (크론 실행 시각 기준이면 매달 며칠씩 밀림).
      // 오래 밀린 past_due 회복은 오늘 기준.
      const due = sub.next_payment_at ? new Date(sub.next_payment_at) : now;
      const base = (now - due) / 86400000 <= GRACE_DAYS ? due : now;
      const next = nextPeriodDate(cycle, base);
      await admin.from("subscriptions").update({
        status: "active",
        monthly_amount: monthly,
        current_period_end: next.toISOString(),
        next_payment_at: next.toISOString(),
        last_payment_at: new Date().toISOString(),
        toss_order_id: orderId,
        cancel_reason: null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", sub.user_id);

      await admin.from("billing_history").insert({
        user_id: sub.user_id,
        plan: planId,
        amount: k?.amount?.total ?? amount,
        status: "paid",
        method: k?.payment_method_type === "MONEY" ? "money" : "card",
        pg: "kakao",
        kakao_tid: k?.tid || null,
        kakao_aid: k?.aid || null,
        paid_at: k?.approved_at || new Date().toISOString(),
      });

      results.push({ user_id: sub.user_id, ok: true, amount });
    } catch (e) {
      // 네트워크 예외: 선점으로 next_payment_at=내일 → 자동 재시도
      results.push({ user_id: sub.user_id, ok: false, error: e.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
