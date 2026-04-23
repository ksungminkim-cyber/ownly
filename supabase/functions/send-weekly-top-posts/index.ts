// 주간 커뮤니티 Top 10 이메일
// 매주 월요일 09:00 KST (UTC 00:00) — pg_cron 호출
// 지난 7일 조회수 TOP 10 글 + 카테고리 분포 → 활성 유저에게 발송

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://www.ownly.kr";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CATEGORY_EMOJI: Record<string, string> = {
  질문: "❓", 정보: "💡", 세금: "🧾", 법률: "⚖️", 수리: "🔨", 시세: "📊", 일상: "💬", 자유: "💬",
};

function truncate(s: string, n: number) {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function buildEmailHtml(posts: any[]) {
  const rows = posts.map((p, i) => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f0efe9;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="font-size:18px;font-weight:900;color:${i < 3 ? "#e8445a" : "#8a8a9a"};min-width:24px;text-align:center;">${i + 1}</div>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:10px;font-weight:800;color:#5b4fcf;background:rgba(91,79,207,0.08);padding:2px 8px;border-radius:10px;">${CATEGORY_EMOJI[p.category] || "💬"} ${p.category || "일상"}</span>
              <span style="font-size:11px;color:#8a8a9a;">${p.nickname || "익명"}</span>
            </div>
            <a href="${SITE_URL}/community/${p.id}" style="text-decoration:none;color:#1a2744;">
              <div style="font-size:15px;font-weight:700;line-height:1.5;margin-bottom:4px;">${p.title}</div>
              <div style="font-size:12px;color:#6a6a7a;line-height:1.6;">${truncate(p.content, 100)}</div>
              <div style="font-size:11px;color:#a0a0b0;margin-top:6px;">👁 ${p.views || 0} · ❤️ ${p.like_count || 0}</div>
            </a>
          </div>
        </div>
      </td>
    </tr>
  `).join("");

  return `
  <div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:620px;margin:0 auto;background:#f5f4f0;">
    <div style="background:linear-gradient(135deg,#1a2744,#5b4fcf);padding:26px 32px;border-radius:14px 14px 0 0;">
      <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px;">WEEKLY DIGEST</p>
      <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0;">🔥 이번 주 인기 글 Top ${posts.length}</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:8px 0 0;">임대인들이 가장 많이 본 커뮤니티 글</p>
    </div>
    <div style="background:#fff;padding:0;border-radius:0 0 14px 14px;border:1px solid #e8e6e0;border-top:none;">
      ${posts.length === 0 ? `
        <div style="padding:40px 24px;text-align:center;color:#8a8a9a;">
          <p style="font-size:14px;">이번 주 새 글이 아직 많지 않아요.</p>
          <a href="${SITE_URL}/community" style="display:inline-block;margin-top:14px;padding:10px 20px;background:#1a2744;color:#fff;text-decoration:none;border-radius:9px;font-size:12px;font-weight:700;">커뮤니티 둘러보기 →</a>
        </div>
      ` : `
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <div style="padding:24px 32px;text-align:center;background:#f8f7f4;border-radius:0 0 14px 14px;">
          <a href="${SITE_URL}/community" style="display:inline-block;padding:11px 22px;background:#1a2744;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:700;">커뮤니티 전체 보기 →</a>
        </div>
      `}
    </div>
    <p style="font-size:11px;color:#b0aead;margin:18px 0 0;text-align:center;line-height:1.7;">
      매주 월요일 발송됩니다.<br/>
      <a href="${SITE_URL}/dashboard/settings" style="color:#b0aead;">알림 설정</a> · 문의 inquiry@mclean21.com
    </p>
  </div>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return { skipped: true };
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: "온리 <noreply@ownly.kr>", to: [to], subject, html }),
  }).then(r => r.json());
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const isService = token === SUPABASE_SERVICE_KEY;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 최근 7일 TOP 10
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, title, content, category, nickname, views, like_count, created_at")
    .gte("created_at", weekAgo.toISOString())
    .order("views", { ascending: false })
    .limit(10);

  if (!isService) {
    // 유저 본인 테스트 — 본인 이메일로만 발송
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user?.email) return new Response(JSON.stringify({ error: "auth" }), { status: 401 });
    await sendEmail(userData.user.email, `[온리] 🔥 이번 주 커뮤니티 인기 글 Top ${(posts||[]).length}`, buildEmailHtml(posts || []));
    return new Response(JSON.stringify({ sent: 1, to: userData.user.email }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }

  // 서비스 키 → 모든 활성 유저 발송
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emails = (users?.users || [])
    .filter((u: any) => u.email && !u.banned_until)
    .map((u: any) => u.email);

  let sent = 0, failed = 0;
  for (const email of emails) {
    try {
      await sendEmail(email, `[온리] 🔥 이번 주 커뮤니티 인기 글 Top ${(posts||[]).length}`, buildEmailHtml(posts || []));
      sent++;
    } catch { failed++; }
  }

  return new Response(
    JSON.stringify({ total: emails.length, sent, failed, postsCount: (posts || []).length }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
});
