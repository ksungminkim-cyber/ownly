import Link from "next/link";

export const metadata = {
  title: "기능 소개 — 온리(Ownly) 임대 자산 관리 플랫폼",
  description: "Ownly의 모든 기능을 확인하세요. 임대료 수금 자동화, 계약서 관리, 내용증명, 세금 시뮬레이터, AI 적정 임대료 분석, 수익률 계산까지 임대인에게 필요한 모든 도구.",
  alternates: { canonical: "https://www.ownly.kr/features" },
};

const FEATURES = [
  {
    slug: "rent-management",
    title: "임대료 수금 자동화",
    keywords: ["월세 관리", "임대료 수금", "미납 알림", "임대 장부"],
    desc: "매월 반복되는 월세 수금 현황을 자동으로 추적합니다. 세입자별 납부 상태를 한눈에 확인하고, 미납 발생 시 즉시 알림을 받습니다. 수금 내역은 자동으로 임대 장부에 기록되어 별도의 엑셀 관리가 필요 없습니다.",
    details: ["세입자별 월세·관리비 납부 현황 추적", "미납 자동 감지 및 알림", "수금률 통계 및 월별 수입 차트", "카카오톡 고지서 발송 (프로 플랜)"],
  },
  {
    slug: "contract-management",
    title: "임대차 계약서 관리",
    keywords: ["임대차 계약", "전월세 계약", "계약 만료 알림", "갱신 의향"],
    desc: "임대차 계약 정보를 체계적으로 관리합니다. 계약 만료일 D-90, D-60, D-30일 전 자동 알림으로 갱신 협의를 놓치지 않습니다. 세입자 갱신 의향을 미리 파악하여 공실을 예방합니다.",
    details: ["계약 시작일·만료일·임대조건 관리", "만료 D-90/60/30 자동 알림", "갱신 의향 추적 및 연락 이력 관리", "계약서 PDF 생성 및 다운로드"],
  },
  {
    slug: "certified-mail",
    title: "내용증명 작성·발송",
    keywords: ["내용증명", "임대료 미납 내용증명", "명도 소송", "임대차 분쟁"],
    desc: "임대차 분쟁 상황에서 법적 효력이 있는 내용증명을 직접 작성할 수 있습니다. 임대료 미납, 계약 위반, 계약 해지, 보증금 반환 등 6가지 사유별 법적 서식을 자동 생성합니다.",
    details: ["임대료 미납 내용증명", "계약 위반 및 원상복구 요청", "계약 해지 통보", "보증금 반환 청구", "법정 서식 준수 PDF 출력"],
  },
  {
    slug: "tax-simulator",
    title: "임대소득 세금 시뮬레이터",
    keywords: ["임대소득세", "종합소득세", "부가세", "임대사업자 세금"],
    desc: "임대소득에 대한 종합소득세와 부가세를 자동으로 추정합니다. 2025년 세법 기준으로 계산되며, 임대 수익과 필요경비를 입력하면 예상 세금을 즉시 확인할 수 있습니다.",
    details: ["종합소득세 자동 추정", "부가세 계산 (과세·면세 구분)", "필요경비 입력 지원", "2025년 세법 기준 적용"],
  },
  {
    slug: "ai-analysis",
    title: "AI 적정 임대료 분석",
    keywords: ["AI 임대료 분석", "적정 임대료", "국토부 실거래가"],
    desc: "국토교통부 실거래가 데이터를 기반으로 해당 지역의 적정 임대료를 AI가 분석합니다. 면적별 임대료 시나리오, 시세 구간 분석, 시장 포지션을 종합 평가합니다.",
    details: ["국토교통부 실거래가 기반 분석", "면적별 임대료 시나리오 테이블", "시세 구간 분석 (저평가·적정·고평가)", "공실 리스크 및 협상 팁 제공"],
  },
  {
    slug: "vacancy-management",
    title: "공실 관리",
    keywords: ["공실 관리", "공실률", "공실 해결", "임대 매물"],
    desc: "공실 현황을 체계적으로 관리합니다. 공실 기간, 예상 손실액, 적정 임대료를 파악하고 빠른 입주자 확보를 위한 전략을 수립합니다.",
    details: ["물건별 공실 현황 추적", "공실 기간 및 손실 금액 계산", "인근 시세 기반 적정 임대료 제안"],
  },
];

export default function FeaturesPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px", fontFamily: "'Pretendard',sans-serif" }}>
      <nav style={{ marginBottom: 32 }}>
        <Link href="/" style={{ fontSize: 13, color: "#8a8a9a", textDecoration: "none" }}>← 홈으로</Link>
      </nav>

      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1a2744", marginBottom: 8, letterSpacing: "-.5px" }}>
        Ownly 기능 소개
      </h1>
      <p style={{ fontSize: 15, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 48 }}>
        임대인에게 필요한 모든 도구를 하나의 플랫폼에서. 수금부터 세금까지 임대 자산 관리의 전 과정을 지원합니다.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {FEATURES.map((f) => (
          <article key={f.slug} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "28px 32px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>{f.title}</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {f.keywords.map(k => (
                <span key={k} style={{ fontSize: 11, fontWeight: 600, color: "#5b4fcf", background: "rgba(91,79,207,0.08)", padding: "2px 8px", borderRadius: 20 }}>{k}</span>
              ))}
            </div>
            <p style={{ fontSize: 14, color: "#4a4a6a", lineHeight: 1.85, marginBottom: 16 }}>{f.desc}</p>
            <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {f.details.map(d => (
                <li key={d} style={{ fontSize: 13, color: "#6a6a7a", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: "#0fa573", flexShrink: 0, fontWeight: 700 }}>✓</span> {d}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 56, textAlign: "center", padding: "40px 24px", background: "#f5f4f0", borderRadius: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>지금 무료로 시작하세요</h2>
        <p style={{ fontSize: 14, color: "#6a6a7a", marginBottom: 24 }}>물건 2개, 세입자 3명까지 영구 무료. 신용카드 불필요.</p>
        <Link href="/login" style={{ display: "inline-block", padding: "14px 36px", borderRadius: 12, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
          무료로 시작하기
        </Link>
      </div>
    </main>
  );
}
