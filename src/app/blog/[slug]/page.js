"use client";
import { useRouter, useParams } from "next/navigation";

const POSTS = {
  "landlord-income-tax-2025": {
    title: "2025년 임대소득 종합소득세 신고 완벽 가이드",
    tag: "세금", tagColor: "#0fa573", date: "2025.03", readTime: "8분",
    content: [
      { type: "intro", text: "주택 임대소득이 있는 임대인이라면 매년 5월 종합소득세 신고를 해야 합니다. 2025년 기준 핵심 내용을 정리했습니다." },
      { type: "h2", text: "1. 임대소득 2000만원 이하 — 분리과세 vs 종합과세" },
      { type: "p", text: "연간 임대소득이 2000만원 이하라면 분리과세(세율 14%)와 종합과세 중 선택할 수 있습니다. 다른 소득이 많을수록 분리과세가 유리하고, 소득이 적을수록 종합과세가 유리한 경우가 많습니다." },
      { type: "h2", text: "2. 필요경비 공제 항목" },
      { type: "p", text: "임대소득에서 공제 가능한 필요경비는 다음과 같습니다: 재산세, 화재보험료, 감가상각비, 수선비, 임대 관련 이자비용, 관리비 등. 간편장부 대상자는 필요경비율 50~60%를 일괄 적용할 수 있습니다." },
      { type: "h2", text: "3. 주택 임대사업자 등록 혜택" },
      { type: "p", text: "민간임대주택으로 등록하면 세금 감면 혜택이 있습니다. 단, 의무임대 기간(4년/8년) 준수, 임대료 인상률 5% 상한 등 조건을 지켜야 합니다." },
      { type: "h2", text: "4. 온리로 세금 미리 계산하기" },
      { type: "p", text: "온리의 세금 시뮬레이터를 활용하면 예상 종합소득세·건강보험료를 미리 계산해 볼 수 있습니다. 신고 전 세무사 상담 시 기초 자료로 활용하세요." },
      { type: "cta", text: "온리 무료로 시작하기" },
    ],
  },
  "lease-renewal-right-guide": {
    title: "계약갱신청구권 완벽 이해 — 임대인이 거절할 수 있는 경우",
    tag: "임대차 3법", tagColor: "#5b4fcf", date: "2025.03", readTime: "6분",
    content: [
      { type: "intro", text: "2020년 7월 시행된 계약갱신청구권은 세입자에게 1회 계약갱신을 요구할 권리를 부여합니다. 하지만 임대인도 정당한 사유가 있으면 거절할 수 있습니다." },
      { type: "h2", text: "1. 임대인이 갱신을 거절할 수 있는 6가지 경우" },
      { type: "p", text: "① 임대인 또는 직계존비속이 실제 거주할 경우 ② 세입자가 3회 이상 월세 연체한 경우 ③ 세입자가 임대인 동의 없이 전대한 경우 ④ 세입자가 주택을 파손·멸실한 경우 ⑤ 재건축·철거 계획이 있는 경우 ⑥ 기타 의무 위반 사항이 있는 경우." },
      { type: "h2", text: "2. 실거주 요건의 함정" },
      { type: "p", text: "실거주를 이유로 갱신을 거절했다가 실제로 거주하지 않으면, 세입자는 손해배상을 청구할 수 있습니다. 2년 내 제3자에게 임대하면 자동으로 손해배상 의무가 발생합니다." },
      { type: "h2", text: "3. 갱신 시 임대료 인상 한도" },
      { type: "p", text: "계약갱신 시 임대료 인상은 기존 임대료의 5%를 초과할 수 없습니다. 월세와 보증금 간 전환도 법정 전환율(연 2.5%) 이내여야 합니다." },
      { type: "h2", text: "4. 갱신 의향 관리는 온리로" },
      { type: "p", text: "온리의 갱신 의향 관리 기능을 활용하면 세입자별 갱신 의향을 추적하고, 만료 D-90일부터 알림을 받아 선제적으로 대응할 수 있습니다." },
      { type: "cta", text: "온리로 갱신 의향 관리하기" },
    ],
  },
  "delinquent-tenant-guide": {
    title: "월세 미납 세입자 대응 단계별 가이드 — 내용증명부터 명도까지",
    tag: "법률", tagColor: "#e8445a", date: "2025.03", readTime: "10분",
    content: [
      { type: "intro", text: "월세 미납은 임대인에게 가장 곤란한 상황 중 하나입니다. 감정적으로 대응하면 법적으로 불리해질 수 있습니다. 단계별로 대응하세요." },
      { type: "h2", text: "1단계: 연락 및 독촉 (1~2개월 미납)" },
      { type: "p", text: "전화·문자로 납부를 요청합니다. 이 단계에서 대화로 해결되는 경우가 많습니다. 온리의 카카오 알림톡 기능으로 공식적인 납부 독촉 메시지를 발송할 수 있습니다." },
      { type: "h2", text: "2단계: 내용증명 발송 (2~3개월 미납)" },
      { type: "p", text: "내용증명은 법적 분쟁 시 중요한 증거가 됩니다. 미납 금액, 납부 기한, 미납 시 계약 해지 의사를 명시해야 합니다. 온리에서 6가지 사유별 내용증명 서식을 바로 작성하고 PDF로 다운로드할 수 있습니다." },
      { type: "h2", text: "3단계: 계약 해지 통보 (3개월 이상 미납)" },
      { type: "p", text: "주거용 건물의 경우 월세 2회 이상 연체 시 계약 해지가 가능합니다(민법 제640조). 상가는 3회 이상 연체 시 가능합니다. 계약 해지 통보도 내용증명으로 발송하는 것이 원칙입니다." },
      { type: "h2", text: "4단계: 명도소송" },
      { type: "p", text: "세입자가 퇴거를 거부하면 명도소송을 제기해야 합니다. 관할 법원에 소장을 접수하고, 판결 후 강제집행이 가능합니다. 소송 기간은 통상 3~6개월입니다. 온리에서 제휴 법무사 연결을 통해 도움받을 수 있습니다." },
      { type: "cta", text: "온리로 내용증명 작성하기" },
    ],
  },
  "commercial-lease-management": {
    title: "상가 임대 관리 핵심 체크리스트 — 주거와 다른 점 총정리",
    tag: "상가 임대", tagColor: "#e8960a", date: "2025.03", readTime: "7분",
    content: [
      { type: "intro", text: "상가 임대는 주거 임대와 법적 구조, 세금, 관리 방식이 다릅니다. 임대인이 반드시 알아야 할 핵심 차이점을 정리했습니다." },
      { type: "h2", text: "1. 상가 임대차보호법 적용 요건" },
      { type: "p", text: "상가건물 임대차보호법은 환산보증금 기준 이하인 경우에만 적용됩니다. 서울 기준 환산보증금 9억원 이하(보증금 + 월세×100)인 소규모 상가에 적용됩니다. 초과 시 민법이 적용됩니다." },
      { type: "h2", text: "2. 관리비 구성과 세금 처리" },
      { type: "p", text: "상가 임대수익은 부가가치세 과세 대상입니다(주거용 제외). 관리비도 부가세 포함 여부를 계약서에 명시해야 합니다. 연 매출 8000만원 이상이면 일반과세자로 분기별 부가세 신고 의무가 있습니다." },
      { type: "h2", text: "3. 권리금 분쟁 예방" },
      { type: "p", text: "임대인은 세입자가 새로운 임차인으로부터 권리금을 받는 것을 방해해서는 안 됩니다. 계약 종료 3개월 전부터 6개월 사이에 새 임차인을 주선할 기회를 줘야 합니다." },
      { type: "h2", text: "4. 온리로 상가 임대 관리하기" },
      { type: "p", text: "온리는 상가 임대 특화 기능을 제공합니다. 관리비 포함 수금 추적, 상가 임대차 3법 체크리스트, 부가세 포함 수익 계산 등 주거와 상가를 통합 관리할 수 있습니다." },
      { type: "cta", text: "상가 임대 관리 시작하기" },
    ],
  },
  "rental-yield-calculation": {
    title: "임대 수익률 제대로 계산하는 법 — 표면 수익률 vs 실질 수익률",
    tag: "투자", tagColor: "#1a2744", date: "2025.03", readTime: "9분",
    content: [
      { type: "intro", text: "부동산 투자 전 수익률 계산은 필수입니다. 하지만 많은 임대인이 세금·보험료를 빠뜨린 표면 수익률만 보고 투자 결정을 내립니다." },
      { type: "h2", text: "1. 표면(총) 수익률 계산" },
      { type: "p", text: "표면 수익률 = (연간 임대수익 ÷ 매입가) × 100. 예) 매입가 5억, 월세 150만원 → 연 1800만원 ÷ 5억 = 3.6%. 하지만 이건 세전·비용 전 수치입니다." },
      { type: "h2", text: "2. 실질 수익률 계산 (세후)" },
      { type: "p", text: "실질 수익률을 구하려면 ① 재산세 ② 종합소득세 ③ 건강보험료 추가분 ④ 관리 비용 ⑤ 공실 손실 ⑥ 대출 이자(있는 경우)를 모두 차감해야 합니다. 실제로는 표면 수익률의 60~70% 수준인 경우가 많습니다." },
      { type: "h2", text: "3. 투자 결정 전 체크리스트" },
      { type: "p", text: "① 실질 수익률이 은행 예금 금리보다 2% 이상 높은가? ② 5년 후 매도 시 예상 시세차익은? ③ 공실 3개월 발생해도 대출 이자를 감당할 수 있는가? ④ 세금 신고를 직접 처리할 수 있는가?" },
      { type: "h2", text: "4. 온리 수익률 계산기 활용" },
      { type: "p", text: "온리 플러스 플랜의 수익률 계산기는 취득세·종소세·건강보험료를 자동 반영한 실질 수익률을 계산해 드립니다. 투자 전 필수 도구로 활용하세요." },
      { type: "cta", text: "수익률 계산기 사용해보기" },
    ],
  },
  "vacancy-management-tips": {
    title: "공실 기간을 줄이는 임대인 실전 전략 5가지",
    tag: "공실 관리", tagColor: "#0d9488", date: "2025.03", readTime: "5분",
    content: [
      { type: "intro", text: "공실 1개월은 그냥 손실이 아닙니다. 월세를 못 받는 것은 물론, 관리비·대출 이자는 그대로 나갑니다. 공실을 빠르게 해소하는 실전 전략 5가지를 소개합니다." },
      { type: "h2", text: "1. 플랫폼 다중 등록" },
      { type: "p", text: "직방·다방·네이버 부동산·당근마켓에 동시 등록하세요. 각 플랫폼마다 주 사용자층이 다릅니다. 네이버는 40대 이상, 직방·다방은 20~30대 비중이 높습니다." },
      { type: "h2", text: "2. 적정 임대료 설정" },
      { type: "p", text: "공실이 2개월 이상 지속되면 인근 시세를 재조사하세요. 시세 대비 5% 낮추는 것만으로 계약 속도가 2~3배 빨라지는 경우가 많습니다. 온리의 AI 입지 분석으로 적정 임대료를 확인할 수 있습니다." },
      { type: "h2", text: "3. 사진 품질 개선" },
      { type: "p", text: "임대 매물 조회에서 사진이 차지하는 비중은 절대적입니다. 자연광이 드는 낮 시간에 광각으로 촬영하고, 최소 10장 이상 올리세요. 스마트폰으로도 충분하지만 정리·청소 후 촬영은 필수입니다." },
      { type: "h2", text: "4. 조건 유연화" },
      { type: "p", text: "반려동물 허용, 보증금 분할 납부, 단기 임대 허용 등 조건을 유연하게 하면 잠재 임차인 풀이 크게 늘어납니다. 가구·가전 포함 조건도 효과적입니다." },
      { type: "h2", text: "5. 공실 손실을 정확히 파악하기" },
      { type: "p", text: "공실 기간이 길어질수록 심리적으로 조급해집니다. 온리의 공실 손실 계산기로 일별 기회비용을 명확히 파악하면 협상 시 최저선을 설정하는 데 도움이 됩니다." },
      { type: "cta", text: "공실 관리 시작하기" },
    ],
  },
};

export default function BlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const post = POSTS[params.slug];

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Pretendard',sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#1a2744", marginBottom: 8 }}>포스트를 찾을 수 없습니다</p>
          <button onClick={() => router.push("/blog")} style={{ padding: "10px 24px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>블로그로 돌아가기</button>
        </div>
      </div>
    );
  }

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
        <span onClick={() => router.push("/blog")} style={{ fontSize: 14, fontWeight: 700, color: "#8a8a9a", cursor: "pointer" }}>임대인 가이드</span>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* 포스트 헤더 */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: post.tagColor, background: post.tagColor + "15", padding: "4px 10px", borderRadius: 20 }}>{post.tag}</span>
            <span style={{ fontSize: 12, color: "#a0a0b0" }}>{post.date} · {post.readTime} 읽기</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a2744", lineHeight: 1.3, marginBottom: 0 }}>{post.title}</h1>
        </div>

        {/* 본문 */}
        <article style={{ background: "#fff", borderRadius: 20, padding: "36px", border: "1px solid #ebe9e3" }}>
          {post.content.map((block, i) => {
            if (block.type === "intro") return (
              <p key={i} style={{ fontSize: 16, color: "#3a3a4e", lineHeight: 1.8, marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid #ebe9e3", fontWeight: 500 }}>{block.text}</p>
            );
            if (block.type === "h2") return (
              <h2 key={i} style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginTop: 36, marginBottom: 12 }}>{block.text}</h2>
            );
            if (block.type === "p") return (
              <p key={i} style={{ fontSize: 14, color: "#4a4a5e", lineHeight: 1.9, marginBottom: 20 }}>{block.text}</p>
            );
            if (block.type === "cta") return (
              <div key={i} style={{ marginTop: 40, padding: "24px", background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(15,165,115,0.04))", borderRadius: 14, border: "1px solid rgba(26,39,68,0.1)", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#8a8a9a", marginBottom: 14 }}>온리에서 지금 바로 시작해보세요. 무료 플랜으로 3개 물건까지 무료입니다.</p>
                <button onClick={() => router.push("/login")} style={{ padding: "12px 28px", borderRadius: 11, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>
                  {block.text} →
                </button>
              </div>
            );
            return null;
          })}
        </article>

        {/* 다른 글 보기 */}
        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => router.push("/blog")} style={{ padding: "10px 20px", borderRadius: 10, background: "#fff", border: "1px solid #ebe9e3", color: "#1a2744", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← 모든 가이드 보기
          </button>
          <button onClick={() => router.push("/login")} style={{ padding: "10px 20px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            온리 무료 시작 →
          </button>
        </div>
      </div>
    </div>
  );
}
