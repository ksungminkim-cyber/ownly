import { getPostMeta, POSTS_META } from "../posts-meta";

export async function generateStaticParams() {
  return POSTS_META.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostMeta(slug);
  if (!post) return { title: "가이드를 찾을 수 없습니다" };

  const url = `https://www.ownly.kr/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.desc,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.desc,
      url,
      type: "article",
      publishedTime: post.datePublished,
      tags: post.keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.desc,
    },
  };
}

export default async function PostLayout({ children, params }) {
  const { slug } = await params;
  const post = getPostMeta(slug);
  const jsonLd = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.desc,
    "datePublished": post.datePublished,
    "dateModified": post.datePublished,
    "author": {
      "@type": "Organization",
      "name": "온리(Ownly)",
      "url": "https://www.ownly.kr",
    },
    "publisher": {
      "@type": "Organization",
      "name": "온리(Ownly)",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.ownly.kr/og-image.png",
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.ownly.kr/blog/${post.slug}`,
    },
    "keywords": post.keywords?.join(", "),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
