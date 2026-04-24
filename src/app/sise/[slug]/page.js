import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import SiteFooter from "../../../components/SiteFooter";
import { REGIONS, findRegionBySlug } from "../../../lib/regions";

export const revalidate = 86400; // 24h ISR

export async function generateStaticParams() {
  return REGIONS.map(r => ({ slug: r.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const region = findRegionBySlug(slug);
  if (!region) return { title: "지역을 찾을 수 없습니다" };
  return {
    title: `${region.name} 월세 시세 — 국토부 실거래 기반 | 온리`,
    description: `${region.name}의 최근 3개월 월세·보증금·평당 실거래 시세. 아파트·빌라·오피스텔 집계. 국토교통부 실거래가 기반 매일 자동 업데이트.`,
    alternates: { canonical: `https://www.ownly.kr/sise/${region.slug}` },
    openGraph: {
      title: `${region.name} 월세 시세 — 실거래 기반`,
      description: `최근 3개월 실거래 기반 ${region.sigungu} 월세 시세와 평당 임대료`,
      url: `https://www.ownly.kr/sise/${region.slug}`,
      type: "article",
    },
  };
}

async function fetchMarket(lawdCd) {
  try {
    const h = await headers();
    const host = h.get("host") || "www.ownly.kr";
    const proto = host.includes("localhost") ? "http" : "https";
    const res = await fetch(`${proto}://${host}/api/market/sigungu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lawdCd }),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function fmtMan(n) {
  if (!n) return "-";
  if (n >= 10000) return `${(n / 10000).toFixed(1)}억`;
  return `${n.toLocaleString()}만`;
}

function fmtYm(ym) {
  if (!ym || ym.length !== 6) return ym;
  return `${ym.slice(0,4)}.${ym.slice(4)}`;
}

const TYPE_LABEL = { apt: "아파트", villa: "빌라", offi: "오피스텔" };
const TYPE_COLOR = { apt: "#5b4fcf", villa: "#0fa573", offi: "#e8960a" };

export default async function RegionMarketPage({ params }) {
  const { slug } = await params;
  const region = findRegionBySlug(slug);
  if (!region) notFound();

  const data = await fetchMarket(region.code);
  const hasData = data && !data.empty && !data.error;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `${region.name} 월세 시세`,
    "description": `${region.name}의 최근 3개월 월세·보증금·평당 실거래 시세 집계`,
    "keywords": [region.name, "월세 시세", "임대료", "실거래가", "부동산"],
    "creator": { "@type": "Organization", "name": "온리" },
    "distribution": [{
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": `https://www.ownly.kr/api/market/sigungu`,
    }],
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 헤더 */}
      <header style={{ background: "#fff", borderBottom: "1px solid #ebe9e3", padding: "14px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/sise" style={{ color: "#6a6a7a", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← 전국 시세</Link>
            <span style={{ color: "#ebe9e3" }}>|</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>온리 시세</span>
          </div>
          <Link href="/login?mode=signup" style={{ padding: "7px 14px", background: "#1a2744", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            무료 시작 →
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 56px" }}>

        {/* 타이틀 */}
        <section style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#5b4fcf", letterSpacing: "1.5px", marginBottom: 6 }}>MARKET REPORT</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a2744", lineHeight: 1.3 }}>{region.name} 월세 시세</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 8 }}>
            {hasData ? (
              <>📊 국토부 실거래 <b style={{ color: "#1a2744" }}>{data.total.rentTx}건</b> 집계 · 최근 3개월 · {new Date(data.updatedAt).toLocaleDateString("ko-KR")} 업데이트</>
            ) : (
              <>실거래 데이터 집계 중입니다</>
            )}
          </p>
        </section>

        {!hasData ? (
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "48px 28px", textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 6 }}>최근 3개월 실거래 데이터가 없습니다</p>
            <p style={{ fontSize: 13, color: "#6a6a7a" }}>{region.name}은(는) 임대 실거래 공개가 제한적이거나 거래량이 적은 지역일 수 있어요.</p>
            <Link href="/sise" style={{ display: "inline-block", marginTop: 18, padding: "10px 20px", background: "#1a2744", color: "#fff", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              다른 지역 보기
            </Link>
          </div>
        ) : (
          <>
            {/* ① 핵심 지표 — 4 카드 */}
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
              <StatCard
                label="월세 중위값"
                value={`${data.rent.medianMonthly.toLocaleString()}만원`}
                sub={`평균 ${data.rent.avgMonthly.toLocaleString()}만원`}
                color="#5b4fcf"
              />
              <StatCard
                label="보증금 중위값"
                value={fmtMan(data.rent.medianDeposit)}
                sub={`월세 포함 거래 기준`}
                color="#0fa573"
              />
              <StatCard
                label="평당 월세"
                value={`${data.rent.avgRentPerPy}만원`}
                sub={`평균 전용 ${data.rent.avgAreaPy}평`}
                color="#e8960a"
              />
              <StatCard
                label="시세 구간 (25%~75%)"
                value={`${data.rent.p25}~${data.rent.p75}만원`}
                sub="중간 50% 거래 범위"
                color="#1a2744"
              />
            </section>

            {/* ② 유형별 시세 */}
            {Object.keys(data.byType).length > 0 && (
              <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "20px 22px", marginBottom: 18 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 14 }}>🏠 유형별 월세 시세</h2>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Object.keys(data.byType).length}, 1fr)`, gap: 12 }}>
                  {Object.entries(data.byType).map(([type, stat]) => (
                    <div key={type} style={{ background: TYPE_COLOR[type] + "08", borderLeft: `3px solid ${TYPE_COLOR[type]}`, borderRadius: 10, padding: "14px 16px" }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: TYPE_COLOR[type], marginBottom: 6 }}>{TYPE_LABEL[type]}</p>
                      <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", lineHeight: 1.1 }}>{stat.medianRent.toLocaleString()}만원</p>
                      <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 4, lineHeight: 1.5 }}>
                        보증금 {fmtMan(stat.medianDep)} · 평당 {stat.avgPerPy}만원<br />
                        거래 {stat.count}건
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ③ 월별 추이 */}
            {data.trend.length > 1 && (
              <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "20px 22px", marginBottom: 18 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 14 }}>📈 월별 월세 중위값 추이</h2>
                <TrendBars trend={data.trend} />
              </section>
            )}

            {/* ④ 면적대별 분포 */}
            <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "20px 22px", marginBottom: 18 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 14 }}>📐 면적대별 거래 분포</h2>
              <DistributionBars buckets={data.sizeBuckets} labels={{ small: "~10평", medium: "10~20평", large: "20~30평", xl: "30평+" }} />
            </section>

            {/* ⑤ 건축연도별 */}
            <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "20px 22px", marginBottom: 18 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 14 }}>🏗️ 건축연도별 거래 분포</h2>
              <DistributionBars buckets={data.ageBuckets} labels={{ new: "5년 이하(신축)", mid: "5~15년", old: "15~30년", veryOld: "30년+", unknown: "정보 없음" }} />
            </section>

            {/* ⑥ 최근 실거래 10건 */}
            <section style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "20px 22px", marginBottom: 18 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>📋 최근 실거래 10건</h2>
              <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 14 }}>국토부 공개 데이터 · 건물명 포함</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                  <thead>
                    <tr style={{ background: "#faf9f6", borderBottom: "1px solid #ebe9e3" }}>
                      {["유형", "건물·층", "면적", "보증금", "월세", "거래월"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 800, color: "#6a6a7a", textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTx.map((t, i) => (
                      <tr key={i} style={{ borderBottom: i < data.recentTx.length - 1 ? "1px solid #f0efe9" : "none" }}>
                        <td style={{ padding: "10px 12px", fontSize: 11 }}>
                          <span style={{ padding: "2px 8px", background: TYPE_COLOR[t.type] + "18", color: TYPE_COLOR[t.type], borderRadius: 5, fontWeight: 700 }}>{TYPE_LABEL[t.type]}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#1a2744", fontWeight: 600 }}>
                          {t.name}{t.floor ? ` · ${t.floor}층` : ""}
                          {t.buildYear && <span style={{ fontSize: 10, color: "#8a8a9a", marginLeft: 4 }}>({t.buildYear})</span>}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#1a2744" }}>{t.py}평</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#1a2744", fontWeight: 600 }}>{fmtMan(t.deposit)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#5b4fcf", fontWeight: 800 }}>{t.rent.toLocaleString()}만</td>
                        <td style={{ padding: "10px 12px", fontSize: 11, color: "#8a8a9a" }}>{fmtYm(t.ym)}{t.day ? `.${String(t.day).padStart(2,"0")}` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ⑦ 매매 시세 (참고) */}
            {data.trade && (
              <section style={{ background: "rgba(26,39,68,0.04)", border: "1px solid rgba(26,39,68,0.1)", borderRadius: 14, padding: "20px 22px", marginBottom: 18 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>💰 참고: 아파트 매매 시세</h2>
                <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 14 }}>최근 3개월 아파트 매매 {data.trade.count}건</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  <MiniStat label="매매 중위값" value={fmtMan(data.trade.medianPrice)} />
                  <MiniStat label="평당 매매가" value={`${data.trade.medianPricePerPy.toLocaleString()}만원`} />
                  <MiniStat label="평균 전용" value={`${data.trade.avgAreaPy}평`} />
                </div>
              </section>
            )}

            {/* 가입 CTA */}
            <section style={{ marginTop: 32, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", color: "#fff", borderRadius: 16, padding: "28px 26px" }}>
              <p style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>내 물건 시세, 이 데이터로 계산해드려요</p>
              <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 18, lineHeight: 1.7 }}>
                {region.name} 실거래 + 내 물건 주소·평형을 넣으면 AI가 적정 임대료 범위와 시장 포지션을 분석합니다.<br />
                무료 가입 → 30일 프로 체험
              </p>
              <Link href="/login?mode=signup" style={{ display: "inline-block", padding: "11px 26px", background: "#fff", color: "#1a2744", borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                내 물건 시세 진단 받기 →
              </Link>
            </section>

            {/* 출처 */}
            <section style={{ marginTop: 20, padding: "14px 18px", background: "#f8f7f4", borderRadius: 10, fontSize: 11, color: "#8a8a9a", lineHeight: 1.7 }}>
              <p><b style={{ color: "#6a6a7a" }}>데이터 출처</b>: 국토교통부 실거래가 공개시스템 API (공공데이터포털). 아파트·빌라·오피스텔 월세 실거래 + 아파트 매매 실거래.</p>
              <p style={{ marginTop: 4 }}><b style={{ color: "#6a6a7a" }}>업데이트</b>: 24시간 주기 자동 갱신. 최신 업데이트: {new Date(data.updatedAt).toLocaleString("ko-KR")}</p>
              <p style={{ marginTop: 4 }}>건물별 프라이버시 보호를 위해 거래 당사자 정보는 공개되지 않습니다.</p>
            </section>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px", borderLeft: `3px solid ${color}` }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 6, lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 900, color: "#1a2744" }}>{value}</p>
    </div>
  );
}

function TrendBars({ trend }) {
  const max = Math.max(...trend.map(t => t.median), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120, paddingTop: 10 }}>
      {trend.map(t => {
        const h = (t.median / max) * 100;
        return (
          <div key={t.ym} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#1a2744" }}>{t.median.toLocaleString()}</span>
            <div style={{ width: "100%", height: `${h}%`, background: "linear-gradient(180deg,#5b4fcf,#1a2744)", borderRadius: "8px 8px 2px 2px", minHeight: 8 }} />
            <span style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 600 }}>{fmtYm(t.ym)}</span>
            <span style={{ fontSize: 9, color: "#c0c0cc" }}>{t.count}건</span>
          </div>
        );
      })}
    </div>
  );
}

function DistributionBars({ buckets, labels }) {
  const total = Object.values(buckets).reduce((s, v) => s + v, 0);
  if (total === 0) return <p style={{ fontSize: 12, color: "#8a8a9a" }}>데이터가 충분하지 않습니다</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(buckets).map(([key, count]) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6a6a7a" }}>{labels[key] || key}</span>
              <span style={{ fontSize: 11, color: "#8a8a9a" }}>{count}건 ({pct}%)</span>
            </div>
            <div style={{ height: 8, background: "#f0efe9", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#5b4fcf,#1a2744)", transition: "width .6s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
