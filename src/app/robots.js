export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/community", "/blog", "/features", "/legal", "/sise", "/tools", "/diagnose", "/rss.xml"],
        disallow: ["/dashboard/", "/reset-password/"],
      },
    ],
    sitemap: "https://www.ownly.kr/sitemap.xml",
    host: "https://www.ownly.kr",
  };
}
