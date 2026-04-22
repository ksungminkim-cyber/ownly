"use client";
import { useRouter } from "next/navigation";
import { POSTS_META as POSTS } from "./posts-meta";

export default function BlogPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ebe9e3", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#1a2744" }}>온리</span>
        </div>
        <span style={{ color: "#ebe9e3" }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#8a8a9a" }}>임대인 가이드</span>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        {/* 히어로 */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>LANDLORD GUIDE</p>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1a2744", lineHeight: 1.2, marginBottom: 12 }}>임대인 실전 가이드</h1>
          <p style={{ fontSize: 15, color: "#8a8a9a", maxWidth: 480, margin: "0 auto" }}>세금·법률·수익률·공실 관리까지, 임대인이 꼭 알아야 할 실무 지식을 정리했습니다.</p>
        </div>

        {/* 포스트 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {POSTS.map(post => (
            <article key={post.slug}
              onClick={() => router.push("/blog/" + post.slug)}
              style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "22px", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(26,39,68,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: post.tagColor, background: post.tagColor + "15", padding: "3px 9px", borderRadius: 20 }}>{post.tag}</span>
                <span style={{ fontSize: 11, color: "#a0a0b0" }}>{post.readTime} 읽기</span>
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a2744", lineHeight: 1.4, marginBottom: 10 }}>{post.title}</h2>
              <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7, marginBottom: 16 }}>{post.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#a0a0b0" }}>{post.date}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>읽기 →</span>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 64, background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 20, padding: "36px", textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8 }}>임대 관리, 더 스마트하게</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>온리로 수금·계약·세금·내용증명을 한 번에 관리하세요. 무료로 시작할 수 있어요.</p>
          <button onClick={() => router.push("/login")} style={{ padding: "13px 32px", borderRadius: 12, background: "#fff", color: "#1a2744", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer" }}>
            무료로 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
