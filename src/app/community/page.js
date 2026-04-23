import Link from "next/link";
import { headers } from "next/headers";

export const revalidate = 300; // 5분마다 재생성

export const metadata = {
  title: "임대인 커뮤니티 — 온리",
  description: "임대 관리, 세금, 법률, 공실 문제까지. 임대인들이 직접 묻고 답하는 공개 커뮤니티. 누구나 읽고 참여할 수 있어요.",
  keywords: ["임대인 커뮤니티", "임대 관리", "임대소득세", "전월세", "공실", "임대차 3법", "내용증명"],
  alternates: { canonical: "https://www.ownly.kr/community" },
  openGraph: {
    title: "임대인 커뮤니티 — 온리",
    description: "임대인들이 직접 묻고 답하는 공개 커뮤니티",
    url: "https://www.ownly.kr/community",
    type: "website",
  },
};

const CATEGORIES = [
  { key: "전체", icon: "📋" },
  { key: "질문", icon: "❓" },
  { key: "정보", icon: "💡" },
  { key: "세금", icon: "🧾" },
  { key: "법률", icon: "⚖️" },
  { key: "수리", icon: "🔨" },
  { key: "시세", icon: "📊" },
  { key: "일상", icon: "💬" },
];

function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  if (diff < 86400 * 30) return Math.floor(diff / 86400) + "일 전";
  return new Date(iso).toLocaleDateString("ko-KR");
}

async function fetchPosts() {
  try {
    const h = await headers();
    const host = h.get("host") || "www.ownly.kr";
    const proto = host.includes("localhost") ? "http" : "https";
    const res = await fetch(`${proto}://${host}/api/community/public?limit=50`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch { return []; }
}

export default async function PublicCommunityPage() {
  const posts = await fetchPosts();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ebe9e3", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#1a2744" }}>온리</span>
        </Link>
        <span style={{ color: "#ebe9e3" }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#5b4fcf" }}>💬 임대인 커뮤니티</span>
        <Link href="/login" style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 10, background: "#1a2744", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          참여하기 →
        </Link>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "36px 24px 48px" }}>
        {/* 히어로 */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#5b4fcf", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>LANDLORD COMMUNITY</p>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1a2744", lineHeight: 1.2, marginBottom: 10 }}>임대인들이 직접 묻고 답하는 곳</h1>
          <p style={{ fontSize: 15, color: "#6a6a7a", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            세금·법률·수리·시세 문제, 혼자 고민하지 마세요.<br/>실전 경험 있는 임대인들이 함께 답합니다.
          </p>
        </div>

        {/* 카테고리 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, justifyContent: "center" }}>
          {CATEGORIES.map(c => (
            <Link key={c.key} href={c.key === "전체" ? "/community" : `/community?category=${encodeURIComponent(c.key)}`}
              style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: "#fff", border: "1px solid #ebe9e3", color: "#1a2744", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
              {c.icon} {c.key}
            </Link>
          ))}
        </div>

        {/* 글 목록 */}
        {posts.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "60px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 14 }}>💬</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1a2744", marginBottom: 6 }}>아직 게시글이 없습니다</p>
            <p style={{ fontSize: 13, color: "#6a6a7a" }}>첫 글을 올려서 커뮤니티를 시작해보세요</p>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}>
            {posts.map((p, i) => {
              const nick = p.nickname || "익명";
              const initial = nick.charAt(0).toUpperCase();
              return (
                <Link key={p.id} href={`/community/${p.id}`}
                  style={{ display: "flex", gap: 12, padding: "18px 22px", borderBottom: i < posts.length - 1 ? "1px solid #f0efe9" : "none", textDecoration: "none", color: "inherit", alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#5b4fcf,#1a2744)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                    {initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{nick}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#5b4fcf" }}>· {p.category || "일상"}</span>
                      <span style={{ fontSize: 12, color: "#8a8a9a", marginLeft: "auto" }}>{timeAgo(p.created_at)}</span>
                    </div>
                    <h2 style={{ fontSize: 15.5, fontWeight: 700, color: "#1a2744", lineHeight: 1.45, marginBottom: 5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.title}</h2>
                    <p style={{ fontSize: 13, color: "#6a6a7a", lineHeight: 1.6, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.content}</p>
                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>
                      <span>🤍 {p.like_count || 0}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* 가입 유도 CTA */}
        <div style={{ marginTop: 32, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", color: "#fff", borderRadius: 20, padding: "28px 32px", textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>참여하고 답변 받으세요</p>
          <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 20, lineHeight: 1.6 }}>
            가입하면 글 작성·댓글·좋아요로 참여하고,<br/>임대 관리 도구 (수금·세금·내용증명)도 함께 사용할 수 있어요.
          </p>
          <Link href="/login?mode=signup" style={{ display: "inline-block", padding: "13px 32px", borderRadius: 12, background: "#fff", color: "#1a2744", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>
            무료로 시작하기 →
          </Link>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 12 }}>신용카드 불필요 · 14일 무료 체험</p>
        </div>
      </div>
    </div>
  );
}
