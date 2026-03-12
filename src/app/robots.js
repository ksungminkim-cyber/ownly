export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: ["/dashboard/", "/reset-password/"],
      },
    ],
    sitemap: "https://www.ownly.kr/sitemap.xml",
    host: "https://www.ownly.kr",
  };
}
