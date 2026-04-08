// supabase/functions/cron-notify/index.ts
// Supabase Edge Function — 스케줄 자동 이메일 발송
// 설정: Supabase Dashboard > Edge Functions > cron-notify > Schedule
//   매일 오전 9시: "0 9 * * *"  → 만료 임박 체크
//   매월 1일 오전 8시: "0 8 1 * *" → 수금 체크리스트

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const SITE_URL = "https://ownly.kr";

Deno.serve(async (req) => {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const hour = now.getHours();

  // 모든 유저 목록 조회
  const { data: users } = await supabase.auth.admin.listUsers();
  if (!users?.users?.length) return new Response("no users", { status: 200 });

  const results = [];

  for (const user of users.users) {
    const userId = user.id;
    const userEmail = user.email;
    if (!userEmail) continue;

    // 해당 유저의 세입자 조회
    const { data: tenants } = await supabase
      .from("tenants")
      .select("*")
      .eq("user_id", userId);

    if (!tenants?.length) continue;

    // ── 매일: 만료 임박 알림 (D-90, D-60, D-30) ──────────────
    const today = new Date();
    const expiringTargets = tenants.filter(t => {
      const end = new Date(t.contract_end || t.end_date || "");
      if (!end.getTime()) return false;
      const days = Math.ceil((end.getTime() - today.getTime()) / 86400000);
      return days === 90 || days === 60 || days === 30;
    });

    if (expiringTargets.length > 0) {
      const res = await fetch(`${SITE_URL}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "expiring", userId, userEmail }),
      });
      results.push({ userId, type: "expiring", status: res.status });
    }

    // ── 매월 1일: 수금 체크리스트 ────────────────────────────
    if (dayOfMonth === 1) {
      const res = await fetch(`${SITE_URL}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "checklist", userId, userEmail }),
      });
      results.push({ userId, type: "checklist", status: res.status });
    }

    // ── 매일: 미납 알림 (이달 5일 이후에만) ─────────────────
    if (dayOfMonth >= 5) {
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .in("tenant_id", tenants.map(t => t.id))
        .eq("year", year)
        .eq("month", month);

      const unpaid = tenants.filter(t => {
        const paid = payments?.find(p =>
          p.tenant_id === t.id && p.status === "paid"
        );
        return !paid && t.status !== "퇴거";
      });

      // 미납자 있고 아직 알림 안 보낸 경우만 (DB 중복 방지)
      if (unpaid.length > 0) {
        // 오늘 이미 보냈는지 체크
        const todayStr = today.toISOString().slice(0, 10);
        const { data: sentLog } = await supabase
          .from("notify_log")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "unpaid")
          .eq("sent_date", todayStr)
          .single();

        if (!sentLog) {
          const res = await fetch(`${SITE_URL}/api/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "unpaid", userId, userEmail }),
          });

          // 발송 로그 기록
          if (res.ok) {
            await supabase.from("notify_log").insert({
              user_id: userId,
              type: "unpaid",
              sent_date: todayStr,
            });
          }
          results.push({ userId, type: "unpaid", status: res.status });
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
