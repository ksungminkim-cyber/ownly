export const metadata = {
  title: "내용증명 무료 작성 — 월세 미납·계약해지·보증금 반환 양식 | 온리",
  description:
    "임대인용 내용증명을 무료로 작성하세요. 월세 미납 독촉, 계약 해지 통보, 명도 요청, 보증금 반환 청구 — 법적 근거가 포함된 양식을 회원가입 없이 바로 미리볼 수 있습니다. 우체국 발송 방법 안내 포함.",
  keywords: ["내용증명", "내용증명 작성", "내용증명 양식", "월세 미납 내용증명", "임대료 미납", "계약 해지 통보", "명도 요청", "보증금 반환", "내용증명 보내는법"],
  alternates: { canonical: "https://www.ownly.kr/tools/certified" },
  openGraph: {
    title: "내용증명 무료 작성 — 임대인 전용 양식 생성기",
    description: "월세 미납·계약해지·보증금 반환 내용증명을 법적 근거와 함께 무료로 작성하세요. 회원가입 불필요.",
    url: "https://www.ownly.kr/tools/certified",
    type: "website",
  },
};

// FAQ 구조화 데이터 (검색 결과 리치 스니펫)
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "내용증명은 법적 효력이 있나요?",
      acceptedAnswer: { "@type": "Answer", text: "내용증명 자체가 강제력을 갖지는 않지만, '언제, 어떤 내용을, 누구에게 통보했는지'를 우체국이 공적으로 증명해 줍니다. 이후 소송·지급명령 등 법적 절차에서 핵심 증거로 사용되며, 계약 해지 통보 등 의사표시의 도달을 입증하는 표준 수단입니다." },
    },
    {
      "@type": "Question",
      name: "내용증명은 어떻게 보내나요?",
      acceptedAnswer: { "@type": "Answer", text: "같은 내용의 문서를 3부 출력해 우체국 창구에서 '내용증명 우편'으로 접수합니다. 1부는 수신인에게 발송, 1부는 우체국 보관, 1부는 발신인이 보관합니다. 인터넷우체국(epost.go.kr)에서 온라인 접수도 가능합니다." },
    },
    {
      "@type": "Question",
      name: "월세 미납 시 언제 내용증명을 보내야 하나요?",
      acceptedAnswer: { "@type": "Answer", text: "주택은 2기(2개월분), 상가는 3기 임대료 연체 시 계약 해지 사유가 됩니다. 해지 전 단계로 미납 사실과 납부 기한을 명시한 내용증명을 발송해 두면, 이후 명도소송 등에서 임대인의 정당한 절차 이행을 입증할 수 있습니다." },
    },
    {
      "@type": "Question",
      name: "내용증명 작성 시 꼭 들어가야 하는 내용은?",
      acceptedAnswer: { "@type": "Answer", text: "발신인·수신인의 이름과 주소, 임대 목적물 표시, 계약 내용(기간·금액), 요구 사항과 이행 기한, 불이행 시 조치 예정 사항, 작성일과 발신인 서명(날인)이 포함되어야 합니다. 이 생성기는 위 요소를 자동으로 구성해 드립니다." },
    },
  ],
};

export default function Layout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}
