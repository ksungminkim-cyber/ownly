import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  metadataBase: new URL("https://www.ownly.kr"),
  title: {
    default: "온리(Ownly) - 개인 임대인을 위한 스마트 임대 관리",
    template: "%s | 온리(Ownly)",
  },
  description: "온리(Ownly) — 주거·상가 임대 물건을 한 앱으로. 수금 추적, 계약 관리, 세금 시뮬레이션, 내용증명까지. 개인 임대인을 위한 올인원 임대장부 앱.",
  keywords: ["온리", "Ownly", "임대 관리", "임대장부", "개인 임대인", "수금 관리", "계약 관리", "임대료 관리", "상가 임대", "주거 임대", "세금 시뮬레이터", "내용증명", "부동산 관리", "월세 관리", "임대인 앱", "임대인 커뮤니티", "부동산 투자", "공실 관리", "임대차 3법", "부동산 리포트", "수익률 계산기", "임대사업자", "소형 임대인", "다주택자 관리"],
  authors: [{ name: "McLean", url: "https://www.ownly.kr" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.ownly.kr",
    siteName: "온리(Ownly)",
    title: "온리(Ownly) - 개인 임대인을 위한 스마트 임대 관리",
    description: "온리(Ownly) — 주거·상가 임대 물건을 한 앱으로. 수금 추적, 계약 관리, 세금 시뮬레이션까지.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "온리(Ownly) - 스마트 임대 관리 앱" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "온리(Ownly) - 개인 임대인을 위한 스마트 임대 관리",
    description: "온리(Ownly) — 주거·상가 임대 물건을 한 앱으로. 수금 추적, 계약 관리, 세금 시뮬레이션까지.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.ownly.kr" },
  verification: {
    google: "추후-구글서치콘솔-코드-입력",
    naver: "841eaee5d6c77a899f34fa724e517995d65f3180",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="naver-site-verification" content="841eaee5d6c77a899f34fa724e517995d65f3180" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "SoftwareApplication",
          name: "온리(Ownly)", applicationCategory: "BusinessApplication", operatingSystem: "Web",
          url: "https://www.ownly.kr",
          description: "개인 임대인을 위한 올인원 임대 관리 앱.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
          publisher: { "@type": "Organization", name: "McLean", url: "https://www.ownly.kr" },
        })}} />
      </head>
      <body>
        <ThemeProvider>{children}</body>
    </html>
  );
}
