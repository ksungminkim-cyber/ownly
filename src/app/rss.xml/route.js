// RSS 2.0 피드 — 블로그 + 최근 커뮤니티 인기 글
// 네이버 서치어드바이저 RSS 제출 대상
// 캐싱: 1시간
import { POSTS_META } from "../blog/posts-meta";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  return d.toUTCString();
}

async function getCommunityTop(limit = 30) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data } = await supabase
      .from("community_posts")
      .select("id, title, content, category, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch { return []; }
}

export async function GET() {
  const base = "https://www.ownly.kr";
  const buildDate = new Date().toUTCString();

  const blogItems = POSTS_META.map(p => ({
    title: p.title,
    link: `${base}/blog/${p.slug}`,
    desc: p.desc,
    pubDate: toRfc822(p.datePublished),
    category: p.tag,
    guid: `${base}/blog/${p.slug}`,
  }));

  const communityPosts = await getCommunityTop(30);
  const communityItems = communityPosts.map(p => ({
    title: p.title,
    link: `${base}/community/${p.id}`,
    desc: (p.content || "").replace(/\s+/g, " ").slice(0, 200),
    pubDate: toRfc822(p.created_at),
    category: p.category || "커뮤니티",
    guid: `${base}/community/${p.id}`,
  }));

  const items = [...blogItems, ...communityItems];

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>온리 Ownly — 임대 관리 가이드 + 임대인 커뮤니티</title>
    <link>${base}</link>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    <description>수금·계약·세금·내용증명까지 임대 관리의 모든 것. 임대인들의 실제 이야기와 최신 세금·법률 가이드.</description>
    <language>ko-KR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <copyright>© ${new Date().getFullYear()} McLean Inc.</copyright>
    <managingEditor>inquiry@mclean21.com (온리 편집팀)</managingEditor>
    <webMaster>inquiry@mclean21.com (온리 웹마스터)</webMaster>
    <generator>Ownly RSS Generator</generator>
${items.map(item => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <description>${escapeXml(item.desc)}</description>
      <category>${escapeXml(item.category)}</category>
      <pubDate>${item.pubDate}</pubDate>
    </item>`).join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
