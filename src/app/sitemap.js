import { POSTS_META } from "./blog/posts-meta";

export default function sitemap() {
  const base = "https://www.ownly.kr";
  const now  = new Date();

  const blogRoutes = POSTS_META.map(p => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.datePublished ? new Date(p.datePublished) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: base,                          lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/features`,            lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog`,                lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    ...blogRoutes,
    { url: `${base}/login`,               lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/legal/faq`,           lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/legal/notice`,        lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${base}/legal/privacy`,       lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal/terms`,         lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
