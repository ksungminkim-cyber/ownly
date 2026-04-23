// 커뮤니티 글별 OG 이미지 동적 생성 (카톡·페이스북·X 공유 시 썸네일)
// 1200x630 — OG 표준 규격
import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const CATEGORY_COLORS = {
  질문: { bg: "#fef3c7", fg: "#b45309", icon: "❓" },
  정보: { bg: "#dbeafe", fg: "#1e40af", icon: "💡" },
  세금: { bg: "#d1fae5", fg: "#065f46", icon: "🧾" },
  법률: { bg: "#fecaca", fg: "#991b1b", icon: "⚖️" },
  수리: { bg: "#fed7aa", fg: "#9a3412", icon: "🔨" },
  시세: { bg: "#e0e7ff", fg: "#3730a3", icon: "📊" },
  일상: { bg: "#f3f4f6", fg: "#374151", icon: "💬" },
};

export async function GET(req, { params }) {
  const { id } = await params;

  // 글 조회
  let post = null;
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data } = await admin
      .from("community_posts")
      .select("title, category, nickname, views, like_count, content")
      .eq("id", id)
      .single();
    post = data;
  } catch {}

  const title = post?.title || "임대인 커뮤니티";
  const category = post?.category || "일상";
  const nickname = post?.nickname || "익명";
  const cat = CATEGORY_COLORS[category] || CATEGORY_COLORS.일상;
  const excerpt = (post?.content || "임대 관리에 필요한 모든 것").replace(/\s+/g, " ").slice(0, 80);
  const truncatedTitle = title.length > 60 ? title.slice(0, 60) + "..." : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #1a2744 0%, #2d4270 55%, #5b4fcf 100%)",
          padding: "60px 72px",
          fontFamily: "sans-serif",
          color: "#fff",
        }}
      >
        {/* 상단: 로고 + 브랜드 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            🏠
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>온리 Ownly</span>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>임대인 커뮤니티</span>
          </div>
        </div>

        {/* 카테고리 배지 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 8,
            padding: "9px 18px",
            borderRadius: 30,
            background: cat.bg,
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 22 }}>{cat.icon}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: cat.fg }}>{category}</span>
        </div>

        {/* 제목 */}
        <div
          style={{
            fontSize: truncatedTitle.length > 36 ? 48 : 56,
            fontWeight: 900,
            lineHeight: 1.25,
            letterSpacing: -1,
            display: "flex",
            marginBottom: 20,
          }}
        >
          {truncatedTitle}
        </div>

        {/* 발췌 */}
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.55,
            fontWeight: 500,
            display: "flex",
            flex: 1,
          }}
        >
          {excerpt}
        </div>

        {/* 하단: 작성자 + 통계 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {nickname.charAt(0)}
            </div>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{nickname}</span>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
            <span>👁 {post?.views || 0}</span>
            <span>❤️ {post?.like_count || 0}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
