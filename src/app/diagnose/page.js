// 진단 페이지 (서버 컴포넌트) — 공유 링크(?addr=&grade=&score=&pType=)에 맞춰 OG 카드 메타데이터를 생성하고
// 실제 UI 는 DiagnoseClient(클라이언트)가 렌더한다.
// Next App Router 에서 searchParams 는 page 의 generateMetadata 에만 전달된다 (layout 에는 없음) → 여기서 처리.
import DiagnoseClient from "./DiagnoseClient";

const BASE = "https://www.ownly.kr";
const GRADES = new Set(["A", "B", "C", "D"]);

export async function generateMetadata({ searchParams }) {
  const sp = (await searchParams) || {};
  const addr = typeof sp.addr === "string" ? sp.addr.slice(0, 60) : "";
  const grade = typeof sp.grade === "string" ? sp.grade.toUpperCase() : "";
  const score = typeof sp.score === "string" ? sp.score.replace(/\D/g, "").slice(0, 3) : "";
  const pType = typeof sp.pType === "string" ? sp.pType.slice(0, 10) : "주거";

  if (!addr || !GRADES.has(grade)) return {}; // 기본값은 layout.js 의 metadata

  const og = `${BASE}/api/og/diagnose?addr=${encodeURIComponent(addr)}&grade=${grade}&score=${encodeURIComponent(score || "")}&pType=${encodeURIComponent(pType)}`;
  const title = `${addr} ${grade}등급 입지 진단 | 온리`;
  const description = `${pType} · 국토부 실거래 + AI 분석 결과 ${grade}등급${score ? ` (${score}점)` : ""}. 내 물건도 무료로 진단해 보세요.`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/diagnose` },
    openGraph: { title, description, url: `${BASE}/diagnose`, type: "website", images: [{ url: og, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default function DiagnosePage() {
  return <DiagnoseClient />;
}
