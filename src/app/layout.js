import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  metadataBase: new URL("https://www.ownly.kr"),
  title: {
    default: "Ownly - 개인 임대인을 위한 스마트 임대 관리",
    template: "%s | Ownly",
  },
  description: "주거·상가 임대 물건을 한 앱으로. 수금 추적, 계약 관리, 세금 시뮬레이션, 내용증명까지. 개인 임대인을 위한 올인원 임대장부 앱.",
  keywords: ["임대 관리", "임대장부", "개인 임대인", "수금 관리", "계약 관리", "임대료 관리", "상가 임대", "주거 임대", "세금 시뮬레이터", "내용증명", "부동산 관리"],
  authors: [{ name: "McLean", url: "https://www.ownly.kr" }],
  creator: "McLean",
  publisher: "McLean",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.ownly.kr",
    siteName: "Ownly",
    title: "Ownly - 개인 임대인을 위한 스마트 임대 관리",
    description: "주거·상가 임대 물건을 한 앱으로. 수금 추적, 계약 관리, 세금 시뮬레이션까지.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ownly - 스마트 임대 관리 앱",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ownly - 개인 임대인을 위한 스마트 임대 관리",
    description: "주거·상가 임대 물건을 한 앱으로. 수금 추적, 계약 관리, 세금 시뮬레이션까지.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.ownly.kr",
  },
  verification: {
    google: "추후-구글서치콘솔-코드-입력",
    naver: "추후-네이버서치어드바이저-코드-입력",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Ownly",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://www.ownly.kr",
              description: "개인 임대인을 위한 올인원 임대 관리 앱. 수금 추적, 계약 관리, 세금 시뮬레이션, 내용증명까지.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "KRW",
              },
              publisher: {
                "@type": "Organization",
                name: "McLean",
                url: "https://www.ownly.kr",
              },
              inLanguage: "ko",
              keywords: "임대 관리, 임대장부, 수금 관리, 계약 관리, 개인 임대인",
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
