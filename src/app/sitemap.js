import { POSTS_META } from "./blog/posts-meta";
import { REGIONS } from "../lib/regions";
import { createClient } from "@supabase/supabase-js";

// 커뮤니티 인기 글 최근 100개 (재생성 1시간)
async function fetchCommunityPosts() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data } = await supabase
      .from("community_posts")
      .select("id, updated_at, created_at")
      .order("views", { ascending: false })
      .limit(100);
    return data || [];
  } catch { return []; }
}

export default async function sitemap() {
  const base = "https://www.ownly.kr";
  const now  = new Date();

  const blogRoutes = POSTS_META.map(p => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.datePublished ? new Date(p.datePublished) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const communityPosts = await fetchCommunityPosts();
  const communityRoutes = communityPosts.map(p => ({
    url: `${base}/community/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : (p.created_at ? new Date(p.created_at) : now),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // 지역별 시세 페이지 (실거래 기반 SEO 자산)
  const siseRoutes = REGIONS.map(r => ({
    url: `${base}/sise/${r.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    { url: base,                          lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/features`,            lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/community`,           lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/sise`,                lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/tools/yield`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/diagnose`,            lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/blog`,                lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    ...siseRoutes,
    ...blogRoutes,
    ...communityRoutes,
    { url: `${base}/login`,               lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/legal/faq`,           lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/legal/notice`,        lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${base}/legal/privacy`,       lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal/terms`,         lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
