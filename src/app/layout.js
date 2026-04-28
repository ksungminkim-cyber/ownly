import "./globals.css"; import { ThemeProvider } from "../context/ThemeContext"; import PwaInstallBanner from "../components/PwaInstallBanner"; import KakaoChannelButton from "../components/KakaoChannelButton"; export const viewport = { width: "device-width", initialScale: 1, }; export const metadata = { metadataBase: new URL("https://www.ownly.kr"), title: { default: "온리(Ownly) - 임대 관리 SaaS 소프트웨어 (월 구독형)", template: "%s | 온리(Ownly)", }, description: "임대인을 위한 업무 관리 SaaS 소프트웨어. 수금 추적·계약서 관리·세금 시뮬레이션·내용증명 자동화를 월 구독료(₩19,900)로 제공. 부동산 매매·임대·중개와 무관.", keywords: ["온리","Ownly","임대 관리 소프트웨어","SaaS","임대 관리 앱","임대인 업무 관리","수금 관리 소프트웨어","계약 관리 도구","임대료 자동 추적","임대 관리 자동화","임대인 세금 시뮬레이터","내용증명 자동 생성","임대 관리 프로그램","임대 관리 시스템","임대인 ERP","월 구독 소프트웨어","임대 관리 솔루션","임대인 회계 도구","임대 사업자 관리","건물주 관리 앱","임대 수익률 계산기","공실 관리 도구","임대 관리 클라우드"], authors: [{ name: "McLean", url: "https://www.ownly.kr" }], manifest: "/manifest.json", icons: { icon: [ { url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, ], apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }], }, openGraph: { type: "website", locale: "ko_KR", url: "https://www.ownly.kr", siteName: "온리(Ownly)", title: "온리(Ownly) - 임대 관리 SaaS 소프트웨어", description: "임대인용 업무 관리 SaaS. 수금·계약·세금·내용증명을 자동화하는 월 구독형 소프트웨어. 부동산 거래·중개 서비스 아님.", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "온리(Ownly) - 임대 관리 SaaS 소프트웨어" }], }, twitter: { card: "summary_large_image", title: "온리(Ownly) - 임대 관리 SaaS 소프트웨어", description: "임대인용 업무 관리 SaaS. 월 구독형 소프트웨어 (부동산 거래 X)", images: ["/og-image.png"], }, robots: { index: true, follow: true }, alternates: { canonical: "https://www.ownly.kr" }, verification: { naver: "841eaee5d6c77a899f34fa724e517995d65f3180" }, };

// ✅ GA 측정 ID — 실제 GA4 ID로 교체하세요 (형식: G-XXXXXXXXXX)
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="naver-site-verification" content="841eaee5d6c77a899f34fa724e517995d65f3180" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="온리" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" type="application/rss+xml" title="온리(Ownly) — 임대 관리 가이드 + 커뮤니티" href="https://www.ownly.kr/rss.xml" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        {/* ✅ Google Analytics 4 */}
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    page_path: window.location.pathname,
                    send_page_view: true
                  });
                  // 커스텀 이벤트 헬퍼 — 전역 노출
                  window.trackEvent = function(eventName, params) {
                    if (typeof gtag !== 'undefined') {
                      gtag('event', eventName, params || {});
                    }
                  };
                `,
              }}
            />
          </>
        )}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([ { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "온리(Ownly)", alternateName: "Ownly", applicationCategory: "BusinessApplication", applicationSubCategory: "SaaS", operatingSystem: "Web, iOS, Android", url: "https://www.ownly.kr", description: "임대인용 업무 관리 SaaS 소프트웨어. 수금·계약·세금·내용증명 자동화. 월 구독형 소프트웨어 서비스 (부동산 거래·중개와 무관).", offers: { "@type": "Offer", price: "0", priceCurrency: "KRW", availability: "https://schema.org/InStock", description: "월 구독형 SaaS 소프트웨어 사용권" }, publisher: { "@type": "Organization", name: "McLean", url: "https://www.ownly.kr" }, featureList: ["수금 현황 관리 소프트웨어","계약서 관리 소프트웨어","내용증명 PDF 자동 생성","세금 시뮬레이터","수익률 계산기","공실 관리 도구","AI 입지 분석 도구"], screenshot: "https://www.ownly.kr/og-image.png", isFamilyFriendly: true }, { "@context": "https://schema.org", "@type": "Service", name: "온리 SaaS 구독 서비스", serviceType: "Software as a Service (SaaS)", provider: { "@type": "Organization", name: "(주)맥클린 (McLean)" }, areaServed: { "@type": "Country", name: "South Korea" }, description: "임대인을 위한 클라우드 기반 업무 관리 소프트웨어 월 구독 서비스. 부동산 매매·임대·중개를 하지 않으며, 소프트웨어 사용권만 제공함." }, { "@context": "https://schema.org", "@type": "Organization", name: "McLean", legalName: "(주)맥클린", url: "https://www.ownly.kr", logo: "https://www.ownly.kr/favicon.svg", sameAs: [], contactPoint: { "@type": "ContactPoint", email: "inquiry@mclean21.com", telephone: "+82-2-334-2211", contactType: "customer support" }, knowsAbout: ["임대 관리 소프트웨어 개발","SaaS 서비스","업무 자동화 도구"] }, { "@context": "https://schema.org", "@type": "WebSite", name: "온리(Ownly)", url: "https://www.ownly.kr", potentialAction: { "@type": "SearchAction", target: "https://www.ownly.kr/dashboard/community?q={search_term_string}", "query-input": "required name=search_term_string" } }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [ { "@type": "Question", name: "온리는 부동산을 판매하거나 중개하나요?", acceptedAnswer: { "@type": "Answer", text: "아니요. 온리는 부동산 매매·임대·중개를 일절 하지 않습니다. 임대인이 자기 자산을 관리할 수 있는 클라우드 소프트웨어(SaaS)를 월 구독료로 제공하는 IT 서비스입니다." } }, { "@type": "Question", name: "온리의 결제는 무엇에 대한 결제인가요?", acceptedAnswer: { "@type": "Answer", text: "월 ₩19,900 또는 연간 ₩191,040의 SaaS 구독료입니다. 이는 임대 관리 소프트웨어의 사용권에 대한 비용이며, 부동산 거래와는 무관합니다." } }, { "@type": "Question", name: "Ownly는 무료인가요?", acceptedAnswer: { "@type": "Answer", text: "기본 플랜은 무료입니다. 물건 3개, 세입자 5명까지 영구 무료로 사용할 수 있습니다." } }, { "@type": "Question", name: "임대 관리를 어떻게 시작하나요?", acceptedAnswer: { "@type": "Answer", text: "회원가입 후 물건을 등록하면 수금 현황, 계약 관리, 캘린더 등 모든 기능을 바로 사용할 수 있습니다." } }, { "@type": "Question", name: "상가와 주거 모두 관리할 수 있나요?", acceptedAnswer: { "@type": "Answer", text: "네. 아파트·빌라·오피스텔·상가·토지 등 모든 임대 유형을 통합 관리할 수 있습니다." } }, { "@type": "Question", name: "내용증명을 직접 작성할 수 있나요?", acceptedAnswer: { "@type": "Answer", text: "네. 임대료 미납, 계약 위반, 계약 해지 등 6가지 사유별 법적 서식을 자동 생성하고 PDF로 다운로드할 수 있습니다." } }, { "@type": "Question", name: "세금 신고에 도움이 되나요?", acceptedAnswer: { "@type": "Answer", text: "종합소득세·부가세를 자동 추정하는 세금 시뮬레이터를 제공합니다. 최신 세법 기준으로 계산됩니다." } }, { "@type": "Question", name: "카카오톡으로 수금 알림을 보낼 수 있나요?", acceptedAnswer: { "@type": "Answer", text: "PRO 플랜에서 카카오 알림톡으로 미납·납부예정·계약만료 알림을 세입자에게 직접 발송할 수 있습니다." } }, ]}, ]), }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <PwaInstallBanner />
        <KakaoChannelButton />
      </body>
    </html>
  );
}
