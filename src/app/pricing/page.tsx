import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "요금제 — 온리(Ownly) 임대 자산 관리 플랫폼",
  description:
    "무료 플랜으로 시작하고 필요할 때 플러스(₩9,900/월) 하나로 전체 기능을. 카카오페이 정기결제, 언제든 해지.",
  keywords:
    "온리 요금제, Ownly 가격, 임대 관리 앱 가격, 임대인 앱 구독, 월세 관리 앱 요금제",
  openGraph: {
    title: "요금제 — 온리(Ownly)",
    description:
      "무료로 시작, 필요할 때 월 9,900원 플러스 하나로 전체 기능.",
    url: "https://www.ownly.kr/pricing",
  },
  alternates: {
    canonical: "https://www.ownly.kr/pricing",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
