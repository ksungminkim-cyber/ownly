import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";
import { REGIONS, REGION_GROUPS, groupRegions } from "../../lib/regions";

export const metadata = {
  title: "전국 월세 시세 — 국토부 실거래 기반 | 온리",
  description: "서울·경기·광역시 50개 지역의 월세 시세, 보증금 중위값, 평당 임대료를 국토교통부 실거래 데이터로 매일 업데이트. 무료 조회.",
  alternates: { canonical: "https://www.ownly.kr/sise" },
  openGraph: {
    title: "전국 월세 시세 — 국토부 실거래",
    description: "50개 지역 실거래 기반 월세·보증금·평당 시세 무료 조회",
    url: "https://www.ownly.kr/sise",
    type: "website",
  },
};

export default function SiseIndexPage() {
  const groups = groupRegions();
  const orderedKeys = Object.keys(REGION_GROUPS).sort((a, b) => REGION_GROUPS[a].order - REGION_GROUPS[b].order);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "전국 월세 시세 지역 목록",
    "itemListElement": REGIONS.map((r, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": r.name,
      "url": `https://www.ownly.kr/sise/${r.slug}`,
    })),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 헤더 */}
      <header style={{ background: "#fff", borderBottom: "1px solid #ebe9e3", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#1a2744" }}>온리</span>
            <span style={{ fontSize: 12, color: "#8a8a9a" }}>| 월세 시세</span>
          </Link>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/community" style={{ padding: "8px 14px", borderRadius: 9, background: "transparent", border: "1px solid #ebe9e3", color: "#6a6a7a", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>임대인 커뮤니티</Link>
            <Link href="/login?mode=signup" style={{ padding: "8px 16px", borderRadius: 9, background: "#1a2744", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>무료 시작하기 →</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 60px" }}>

        {/* 인트로 */}
        <section style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#5b4fcf", letterSpacing: "1.5px", marginBottom: 8 }}>MARKET DATA · 국토교통부 실거래</p>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1a2744", lineHeight: 1.3, marginBottom: 14 }}>
            전국 월세 시세<br />
            <span style={{ color: "#5b4fcf" }}>지역별 실거래 기반 무료 조회</span>
          </h1>
          <p style={{ fontSize: 15, color: "#6a6a7a", lineHeight: 1.7, maxWidth: 720 }}>
            국토교통부 실거래가 API의 최근 3개월 데이터를 기반으로, 서울·경기·광역시 <b>50개 시군구</b>의 월세·보증금·평당 시세를 집계했습니다.
            아파트·빌라·오피스텔 월세 실거래를 매일 업데이트합니다.
          </p>

          {/* 트러스트 배지 */}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <TrustBadge icon="📊" label="국토부 실거래 API" />
            <TrustBadge icon="🔄" label="매일 자동 업데이트" />
            <TrustBadge icon="💯" label="무료 열람" />
            <TrustBadge icon="📍" label="50개 지역" />
          </div>
        </section>

        {/* 지역별 목록 */}
        {orderedKeys.map(regionKey => {
          const group = REGION_GROUPS[regionKey];
          const items = groups[regionKey];
          if (!items || items.length === 0) return null;
          return (
            <section key={regionKey} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>{group.emoji}</span>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1a2744" }}>{group.label}</h2>
                <span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 600 }}>{items.length}개 지역</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {items.map(r => (
                  <Link key={r.code} href={`/sise/${r.slug}`}
                    style={{
                      padding: "14px 16px",
                      background: "#fff",
                      border: "1px solid #ebe9e3",
                      borderRadius: 11,
                      textDecoration: "none",
                      color: "#1a2744",
                      fontSize: 14,
                      fontWeight: 700,
                      transition: "all .15s",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                    <span>{r.name}</span>
                    <span style={{ fontSize: 12, color: "#8a8a9a" }}>→</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* 가입 CTA */}
        <section style={{ marginTop: 48, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", color: "#fff", borderRadius: 18, padding: "32px 28px", textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>내 물건이 시세에 맞는지 궁금하다면</p>
          <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 20, lineHeight: 1.6 }}>
            실거래 데이터 + AI 분석으로 내 물건 적정 임대료를 즉시 확인하세요.<br />
            무료 가입 → 첫 30일 프로 플랜 체험
          </p>
          <Link href="/login?mode=signup" style={{ display: "inline-block", padding: "13px 32px", background: "#fff", color: "#1a2744", borderRadius: 11, fontSize: 14, fontWeight: 800, textDecoration: "none" }}>
            무료로 시작하기 →
          </Link>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}

function TrustBadge({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(91,79,207,0.08)", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#5b4fcf" }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
