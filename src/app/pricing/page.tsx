import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "요금제 — 온리(Ownly) 임대 자산 관리 플랫폼",
  description:
    "무료 플랜부터 플러스(₩19,900/월), 프로(₩32,900/월)까지. 물건 수·기능에 맞는 플랜을 선택하세요. 연간 결제 시 20% 할인.",
  keywords:
    "온리 요금제, Ownly 가격, 임대 관리 앱 가격, 임대인 앱 구독, 월세 관리 앱 요금제",
  openGraph: {
    title: "요금제 — 온리(Ownly)",
    description:
      "무료부터 시작해 필요할 때 업그레이드. 임대 물건 수에 맞는 플랜을 고르세요.",
    url: "https://www.ownly.kr/pricing",
  },
  alternates: {
    canonical: "https://www.ownly.kr/pricing",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
