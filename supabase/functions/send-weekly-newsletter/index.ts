import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://www.ownly.kr";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// 최근 2주 블로그 가이드 — 정적 데이터 (src/app/blog과 동기화)
const RECENT_BLOG_POSTS = [
  {
    slug: "long-term-commercial-vacancy",
    title: "상가 장기 공실 탈출 플레이북 — 6개월 이상 비어있다면",
    desc: "용도 변경·렌트프리·중개수수료 2배·팝업스토어 등 장기 공실 해소 고급 전략",
    tag: "공실 관리",
  },
  {
    slug: "vacancy-management-tips",
    title: "공실 기간을 줄이는 임대인 실전 전략 5가지",
    desc: "직방·다방·네이버 동시 등록, 적정 임대료 설정, 공실 손실 계산까지",
    tag: "공실 관리",
  },
  {
    slug: "commercial-lease-management",
    title: "상가 임대 관리 핵심 체크리스트 — 주거와 다른 점 총정리",
    desc: "상가 임대차보호법·권리금 분쟁 예방·관리비·부가세 처리",
    tag: "상가 임대",
  },
];

function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function excerpt(s: string, n: number) {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

// Google News RSS에서 한국 부동산·임대 뉴스 상위 N개 가져오기
async function fetchRealEstateNews(limit = 6): Promise<Array<{ title: string; link: string; source: string; pubDate: string }>> {
  try {
    const query = encodeURIComponent("부동산 임대 전월세");
    const url = `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
    const res = await fetch(url, { headers: { "User-Agent": "Ownly Newsletter/1.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: Array<{ title: string; link: string; source: string; pubDate: string }> = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const m of itemMatches) {
      const block = m[1];
      const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] || "").trim();
      const link = (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "").trim();
      const source = (block.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/)?.[1] || "").trim();
      const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "").trim();
      if (title && link) {
        items.push({ title, link, source: source || "언론사", pubDate });
      }
      if (items.length >= limit) break;
    }
    return items;
  } catch {
    return [];
  }
}

function relTimeKo(pubDate: string): string {
  if (!pubDate) return "";
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  if (diff < 604800) return Math.floor(diff / 86400) + "일 전";
  return d.toLocaleDateString("ko-KR");
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 인증: 헤더에 어떤 식으로든 인증 정보가 있는지만 확인 (ES256 JWT 직접 검증)
    const authHeader = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const apikeyHeader = req.headers.get("apikey") || "";

    // service_role 키로 호출 (cron 등)은 바로 통과
    const isServiceCall = authHeader === SUPABASE_SERVICE_KEY || apikeyHeader === SUPABASE_SERVICE_KEY;

    // 유저 JWT라면 Supabase Auth API로 검증 (ES256 지원)
    let isUserCall = false;
    if (!isServiceCall && authHeader) {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader);
        if (user && !userErr) isUserCall = true;
      } catch {}
    }

    if (!isServiceCall && !isUserCall) {
      return new Response(JSON.stringify({ error: "Unauthorized — missing or invalid auth token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  // 1) 구독자 목록
  const { data: subs, error: subErr } = await supabase
    .from("newsletter_subscribers")
    .select("user_id, email, weekly_digest, last_sent_at")
    .eq("weekly_digest", true);

  if (subErr) {
    return new Response(JSON.stringify({ error: subErr.message }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  // 2) 지난 7일 인기 글 상위 5개 (좋아요×3 + 댓글×2 + 조회 점수)
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, title, content, author_name, category, likes, comment_count, views, created_at, tags")
    .gte("created_at", sevenDaysAgo)
    .limit(30);

  const hotPosts = (posts || [])
    .map(p => ({ ...p, _score: (p.likes || 0) * 3 + (p.comment_count || 0) * 2 + (p.views || 0) / 10 }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5);

  // 부동산 관련 뉴스 한 번만 가져오기 (모든 수신자 공유)
  const newsItems = await fetchRealEstateNews(6);
  const newsHtml = newsItems.length > 0
    ? newsItems.map(n => `
      <div style="border-bottom:1px solid #ebe9e3;padding:10px 0">
        <a href="${escapeHtml(n.link)}" style="text-decoration:none;color:inherit" target="_blank" rel="noopener">
          <p style="font-size:13px;font-weight:700;color:#1a2744;margin:0 0 4px;line-height:1.45">${escapeHtml(excerpt(n.title, 80))}</p>
          <p style="font-size:11px;color:#8a8a9a;margin:0">${escapeHtml(n.source)}${n.pubDate ? " · " + escapeHtml(relTimeKo(n.pubDate)) : ""}</p>
        </a>
      </div>
    `).join("")
    : "";

  const results: { email: string; sent: boolean; error?: string }[] = [];

  for (const sub of (subs || [])) {
    if (!sub.email) continue;
    try {
      // 인기 글 HTML
      const hotPostsHtml = hotPosts.length > 0
        ? hotPosts.map(p => `
          <div style="border-bottom:1px solid #ebe9e3;padding:12px 0">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="font-size:10px;font-weight:700;color:#5b4fcf;background:rgba(91,79,207,0.1);padding:2px 7px;border-radius:4px">${escapeHtml(p.category || "자유")}</span>
              <span style="font-size:11px;color:#8a8a9a">${escapeHtml(p.author_name || "임대인")}</span>
            </div>
            <a href="${SITE_URL}/dashboard/community/posts/${p.id}" style="text-decoration:none;color:inherit">
              <p style="font-size:14px;font-weight:700;color:#1a2744;margin:0 0 4px">${escapeHtml(p.title)}</p>
            </a>
            <p style="font-size:12px;color:#6a6a7a;line-height:1.6;margin:0 0 6px">${escapeHtml(excerpt(p.content || "", 100))}</p>
            <p style="font-size:11px;color:#8a8a9a;margin:0">❤️ ${p.likes || 0} · 💬 ${p.comment_count || 0} · 👁 ${p.views || 0}</p>
          </div>
        `).join("")
        : `<p style="font-size:13px;color:#8a8a9a;padding:20px 0;text-align:center">이번 주 새 글이 아직 없어요</p>`;

      // 최근 가이드 HTML
      const guidesHtml = RECENT_BLOG_POSTS.map(g => `
        <a href="${SITE_URL}/blog/${g.slug}" style="display:block;background:#f8f7f4;border:1px solid #ebe9e3;border-radius:10px;padding:12px 14px;margin-bottom:8px;text-decoration:none;color:inherit">
          <span style="font-size:10px;font-weight:700;color:#0d9488;background:rgba(13,148,136,0.1);padding:2px 7px;border-radius:4px">${escapeHtml(g.tag)}</span>
          <p style="font-size:13px;font-weight:700;color:#1a2744;margin:6px 0 3px">${escapeHtml(g.title)}</p>
          <p style="font-size:11px;color:#8a8a9a;line-height:1.5;margin:0">${escapeHtml(g.desc)}</p>
        </a>
      `).join("");

      const weekLabel = `${now.getMonth() + 1}월 ${Math.ceil(now.getDate() / 7)}주차`;

      const html = `
        <!DOCTYPE html>
        <html><body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif">
          <div style="max-width:600px;margin:0 auto;padding:24px 20px">
            <div style="background:linear-gradient(135deg,#1a2744,#2d4270);padding:24px 28px;border-radius:14px;margin-bottom:20px">
              <h1 style="color:#fff;font-size:22px;margin:0 0 6px">📮 온리 위클리</h1>
              <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px">${now.getFullYear()}년 ${weekLabel} · 임대인을 위한 주간 하이라이트</p>
            </div>

            <div style="background:#fff;border:1px solid #ebe9e3;border-radius:12px;padding:18px 22px;margin-bottom:16px">
              <p style="font-size:11px;font-weight:800;color:#e8445a;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px">🔥 이번 주 인기 글</p>
              ${hotPostsHtml}
              <div style="text-align:center;margin-top:14px">
                <a href="${SITE_URL}/dashboard/community" style="font-size:12px;color:#5b4fcf;font-weight:700;text-decoration:none">커뮤니티 전체 보기 →</a>
              </div>
            </div>

            ${newsHtml ? `
            <div style="background:#fff;border:1px solid #ebe9e3;border-radius:12px;padding:18px 22px;margin-bottom:16px">
              <p style="font-size:11px;font-weight:800;color:#1e7fcb;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px">📰 이번 주 부동산 뉴스</p>
              ${newsHtml}
              <p style="font-size:10px;color:#a0a0b0;margin:14px 0 0;text-align:center">출처: Google News 집계 · 각 언론사 원문 링크</p>
            </div>
            ` : ""}

            <div style="background:#fff;border:1px solid #ebe9e3;border-radius:12px;padding:18px 22px;margin-bottom:16px">
              <p style="font-size:11px;font-weight:800;color:#0d9488;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px">📖 임대인 가이드</p>
              ${guidesHtml}
            </div>

            <div style="background:linear-gradient(135deg,rgba(26,39,68,0.04),rgba(15,165,115,0.04));border:1px solid rgba(26,39,68,0.1);border-radius:12px;padding:18px 22px;margin-bottom:16px;text-align:center">
              <p style="font-size:13px;font-weight:800;color:#1a2744;margin:0 0 6px">이번 주 내 대시보드 확인하기</p>
              <p style="font-size:12px;color:#8a8a9a;margin:0 0 12px">수금 현황·공실 해소·AI 시세 분석까지</p>
              <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#1a2744;color:#fff;padding:10px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px">대시보드 열기 →</a>
            </div>

            <p style="font-size:11px;color:#9ca3af;text-align:center;margin:16px 0 0;line-height:1.7">
              <b>온리(Ownly)</b> · (주)맥클린 · inquiry@mclean21.com<br/>
              수신 거부는 <a href="${SITE_URL}/dashboard/settings" style="color:#5b4fcf;text-decoration:none">설정 페이지</a>에서 변경할 수 있습니다.
            </p>
          </div>
        </body></html>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "온리 위클리 <noreply@ownly.kr>",
          to: sub.email,
          subject: `📮 온리 위클리 — ${hotPosts[0] ? escapeHtml(excerpt(hotPosts[0].title, 30)) : "이번 주 임대인 핫 토픽"}`,
          html,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        results.push({ email: sub.email, sent: false, error: errBody.slice(0, 200) });
        continue;
      }

      // last_sent_at 업데이트
      await supabase
        .from("newsletter_subscribers")
        .update({ last_sent_at: now.toISOString() })
        .eq("user_id", sub.user_id);

      results.push({ email: sub.email, sent: true });
    } catch (e) {
      results.push({ email: sub.email, sent: false, error: String(e) });
    }
  }

    return new Response(JSON.stringify({ ok: true, total: (subs || []).length, sent: results.filter(r => r.sent).length, results }, null, 2), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
