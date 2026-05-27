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
              className="surface-card interactive"
              role="button" tabIndex={0}
              style={{ padding: "22px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span className="chip" style={{ color: post.tagColor, background: post.tagColor + "15", borderColor: post.tagColor + "33", fontSize: 10 }}>{post.tag}</span>
                <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{post.readTime} 읽기</span>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", lineHeight: 1.4, marginBottom: 10, letterSpacing: "-0.2px" }}>{post.title}</h2>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16 }}>{post.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{post.date}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>읽기 →</span>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 64, background: "var(--grad-primary)", borderRadius: "var(--radius-xl)", padding: "40px 28px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", top: -60, right: -40, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,108,255,0.4), transparent 70%)" }} />
          <div style={{ position: "relative" }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-0.4px" }}>임대 관리, 더 스마트하게</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 24, lineHeight: 1.7 }}>온리로 수금·계약·세금·내용증명을 한 번에 관리하세요.<br/>무료 플랜으로 영구 시작 가능합니다.</p>
            <button onClick={() => router.push("/login")} className="btn btn-lg" style={{ background: "#fff", color: "var(--text)", boxShadow: "var(--elev-3)" }}>
              무료로 시작하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
