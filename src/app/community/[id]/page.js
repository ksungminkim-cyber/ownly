import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ShareButtons from "./ShareButtons";

export const revalidate = 300;

async function fetchPost(id) {
  try {
    const h = await headers();
    const host = h.get("host") || "www.ownly.kr";
    const proto = host.includes("localhost") ? "http" : "https";
    const res = await fetch(`${proto}://${host}/api/community/public?id=${id}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch { return null; }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await fetchPost(id);
  if (!data?.post) return { title: "게시글을 찾을 수 없습니다" };
  const p = data.post;
  const excerpt = (p.content || "").replace(/\s+/g, " ").slice(0, 150);
  const ogImage = `https://www.ownly.kr/api/og/community/${p.id}`;
  return {
    title: `${p.title} — 임대인 커뮤니티`,
    description: excerpt,
    alternates: { canonical: `https://www.ownly.kr/community/${p.id}` },
    openGraph: {
      title: p.title,
      description: excerpt,
      url: `https://www.ownly.kr/community/${p.id}`,
      type: "article",
      publishedTime: p.created_at,
      images: [{ url: ogImage, width: 1200, height: 630, alt: p.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: excerpt,
      images: [ogImage],
    },
  };
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  if (diff < 86400 * 30) return Math.floor(diff / 86400) + "일 전";
  return new Date(iso).toLocaleDateString("ko-KR");
}

export default async function PublicPostPage({ params }) {
  const { id } = await params;
  const data = await fetchPost(id);
  if (!data?.post) notFound();

  const { post, comments = [] } = data;
  const shareUrl = `https://www.ownly.kr/community/${post.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": post.title,
    "articleBody": post.content,
    "datePublished": post.created_at,
    "author": { "@type": "Person", "name": post.nickname || "익명" },
    "interactionStatistic": [
      { "@type": "InteractionCounter", "interactionType": "https://schema.org/ViewAction", "userInteractionCount": post.views || 0 },
      { "@type": "InteractionCounter", "interactionType": "https://schema.org/LikeAction", "userInteractionCount": post.like_count || 0 },
      { "@type": "InteractionCounter", "interactionType": "https://schema.org/CommentAction", "userInteractionCount": comments.length },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ebe9e3", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/community" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#6a6a7a", fontSize: 13, fontWeight: 600 }}>
          ← 커뮤니티
        </Link>
        <span style={{ color: "#ebe9e3" }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#5b4fcf" }}>💬 임대인 커뮤니티</span>
        <Link href="/login" style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 10, background: "#1a2744", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          참여하기 →
        </Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 48px" }}>
        {/* 본문 카드 */}
        <article style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#5b4fcf", background: "rgba(91,79,207,0.08)", padding: "4px 11px", borderRadius: 20 }}>
              {post.category || "일상"}
            </span>
            <span style={{ fontSize: 13, color: "#6a6a7a" }}>{post.nickname || "익명"} · {timeAgo(post.created_at)}</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1a2744", lineHeight: 1.35, marginBottom: 18 }}>{post.title}</h1>

          <div style={{ fontSize: 15, color: "#2a2a3a", lineHeight: 1.85, whiteSpace: "pre-wrap", marginBottom: 22 }}>{post.content}</div>

          {/* 통계 */}
          <div style={{ display: "flex", gap: 20, padding: "14px 0", borderTop: "1px solid #f0efe9", borderBottom: "1px solid #f0efe9", fontSize: 13, color: "#6a6a7a", fontWeight: 600 }}>
            <span>👁 조회 {post.views || 0}</span>
            <span>❤️ 좋아요 {post.like_count || 0}</span>
            <span>💬 댓글 {comments.length}</span>
          </div>

          {/* 공유 버튼 */}
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#6a6a7a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>공유하기</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ShareButtons url={shareUrl} title={post.title} />
            </div>
          </div>
        </article>

        {/* 댓글 */}
        <div style={{ marginTop: 20, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "22px 28px" }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 14 }}>💬 댓글 {comments.length}개</p>
          {comments.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", background: "#f8f7f4", borderRadius: 10 }}>
              <p style={{ fontSize: 14, color: "#6a6a7a", marginBottom: 12 }}>첫 댓글을 남겨주세요</p>
              <Link href="/login?mode=signup" style={{ display: "inline-block", padding: "9px 20px", borderRadius: 9, background: "#5b4fcf", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                로그인하고 댓글 달기
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {comments.map(c => (
                <div key={c.id} style={{ padding: "12px 14px", background: "#f8f7f4", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{c.nickname || "익명"}</span>
                    <span style={{ fontSize: 12, color: "#8a8a9a" }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#2a2a3a", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{c.content}</p>
                </div>
              ))}
              <div style={{ padding: "14px", background: "linear-gradient(135deg,rgba(91,79,207,0.05),rgba(26,39,68,0.03))", borderRadius: 10, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#6a6a7a", marginBottom: 10 }}>함께 답변·의견 나누고 싶으신가요?</p>
                <Link href="/login?mode=signup" style={{ display: "inline-block", padding: "9px 20px", borderRadius: 9, background: "#1a2744", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  무료 가입하고 참여 →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 관련 링크 */}
        <div style={{ marginTop: 24, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 22px" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>온리가 도와드릴 수 있어요</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {[
              { icon: "🧾", label: "세금 시뮬레이터", href: "/features" },
              { icon: "📨", label: "내용증명 자동 생성", href: "/features" },
              { icon: "📊", label: "임대 수익률 분석", href: "/features" },
            ].map(a => (
              <Link key={a.label} href={a.href} style={{ padding: "12px 14px", background: "#f8f7f4", borderRadius: 10, textDecoration: "none", color: "#1a2744", fontSize: 13, fontWeight: 700 }}>
                {a.icon} {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

