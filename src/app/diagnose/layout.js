// 진단 페이지 메타데이터 — 공유 링크(?addr=&grade=&score=&pType=)로 들어오면 결과 카드 OG 이미지를 붙인다.
// (이전엔 정적 metadata 만 있어 "카톡 공유 카드"가 실제로는 사이트 공통 이미지로 나갔다)
const BASE = "https://www.ownly.kr";
const GRADES = new Set(["A", "B", "C", "D"]);

export async function generateMetadata({ searchParams }) {
  const sp = (await searchParams) || {};
  const addr = typeof sp.addr === "string" ? sp.addr.slice(0, 60) : "";
  const grade = typeof sp.grade === "string" ? sp.grade.toUpperCase() : "";
  const score = typeof sp.score === "string" ? sp.score.replace(/\D/g, "").slice(0, 3) : "";
  const pType = typeof sp.pType === "string" ? sp.pType.slice(0, 10) : "주거";

  const base = {
    title: "내 물건 등급 즉시 진단 — 국토부 실거래 + AI | 온리",
    description: "주소만 넣으면 입지 등급(A~D)·시장 포지션·공실 리스크를 즉시 확인. 국토부 실거래 + AI 분석. 무료.",
    alternates: { canonical: `${BASE}/diagnose` },
    openGraph: {
      title: "내 부동산 등급 즉시 진단 (무료)",
      description: "실거래 + AI 기반 입지 등급 A~D 진단",
      url: `${BASE}/diagnose`,
      type: "website",
    },
  };
  if (!addr || !GRADES.has(grade)) return base;

  const og = `${BASE}/api/og/diagnose?addr=${encodeURIComponent(addr)}&grade=${grade}&score=${encodeURIComponent(score || "")}&pType=${encodeURIComponent(pType)}`;
  const title = `${addr} ${grade}등급 입지 진단 | 온리`;
  const description = `${pType} · 국토부 실거래 + AI 분석 결과 ${grade}등급${score ? ` (${score}점)` : ""}. 내 물건도 무료로 진단해 보세요.`;
  return {
    ...base,
    title,
    description,
    openGraph: { ...base.openGraph, title, description, images: [{ url: og, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default function Layout({ children }) { return children; }
