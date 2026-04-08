"use client";
import { useRouter } from "next/navigation";

const POSTS = [
  {
    slug: "landlord-income-tax-2025",
    title: "2025년 임대소득 종합소득세 신고 완벽 가이드",
    desc: "주택 임대소득 2000만원 이하·초과 구분, 분리과세 vs 종합과세 선택 기준, 필요경비 공제 항목까지 임대인이 꼭 알아야 할 세금 신고 총정리.",
    tag: "세금",
    tagColor: "#0fa573",
    date: "2025.03",
    readTime: "8분",
  },
  {
    slug: "lease-renewal-right-guide",
    title: "계약갱신청구권 완벽 이해 — 임대인이 거절할 수 있는 경우",
    desc: "세입자가 계약갱신을 요구할 때 임대인이 정당하게 거절할 수 있는 6가지 사유, 실거주 요건, 위반 시 손해배상까지 실무 중심으로 정리.",
    tag: "임대차 3법",
    tagColor: "#5b4fcf",
    date: "2025.03",
    readTime: "6분",
  },
  {
    slug: "delinquent-tenant-guide",
    title: "월세 미납 세입자 대응 단계별 가이드 — 내용증명부터 명도까지",
    desc: "월세 1회 미납 시 대응법, 내용증명 발송 타이밍, 계약 해지 요건, 명도소송 절차까지. 임대인이 법적으로 손해 없이 처리하는 방법.",
    tag: "법률",
    tagColor: "#e8445a",
    date: "2025.03",
    readTime: "10분",
  },
  {
    slug: "commercial-lease-management",
    title: "상가 임대 관리 핵심 체크리스트 — 주거와 다른 점 총정리",
    desc: "상가 임대차보호법 적용 요건, 권리금 분쟁 예방법, 관리비 구성 기준, 부가세 처리까지. 상가 임대인이 반드시 알아야 할 실무 지식.",
    tag: "상가 임대",
    tagColor: "#e8960a",
    date: "2025.03",
    readTime: "7분",
  },
  {
    slug: "rental-yield-calculation",
    title: "임대 수익률 제대로 계산하는 법 — 표면 수익률 vs 실질 수익률",
    desc: "취득세·종합부동산세·소득세·건강보험료까지 반영한 실질 수익률 계산법. 임대 투자 전 반드시 확인해야 할 숫자들.",
    tag: "투자",
    tagColor: "#1a2744",
    date: "2025.03",
    readTime: "9분",
  },
  {
    slug: "vacancy-management-tips",
    title: "공실 기간을 줄이는 임대인 실전 전략 5가지",
    desc: "직방·다방·네이버 부동산 동시 등록 방법, 적정 임대료 설정, 공실 손실 계산, 인테리어 투자 수익성 분석까지 공실 최소화 실전 노하우.",
    tag: "공실 관리",
    tagColor: "#0d9488",
    date: "2025.03",
    readTime: "5분",
  },
];

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
