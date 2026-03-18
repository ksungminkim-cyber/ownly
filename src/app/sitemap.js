export default function sitemap() {
  const base = "https://www.ownly.kr";
  const now  = new Date();
  return [
    { url: base,                          lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/features`,            lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/login`,               lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/legal/faq`,           lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/legal/notice`,        lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${base}/legal/privacy`,       lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal/terms`,         lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
