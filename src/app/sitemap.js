export default function sitemap() {
  const base = "https://www.ownly.kr";
  const now = new Date();
  return [
    { url: base,                          lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/login`,               lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/legal/privacy`,       lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/legal/terms`,         lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/legal/notice`,        lastModified: now, changeFrequency: "weekly",  priority: 0.4 },
    { url: `${base}/legal/faq`,           lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
