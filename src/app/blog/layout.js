export const metadata = {
  title: "임대인 가이드 블로그",
  description: "임대 수익률·세금·법률·공실 관리까지 — 임대인이 실무에서 꼭 알아야 할 가이드 모음. 온리(Ownly)가 정리했습니다.",
  keywords: ["임대인", "임대 관리", "임대소득세", "월세 미납", "공실 관리", "계약갱신청구권", "상가 임대", "임대 수익률"],
  alternates: { canonical: "https://www.ownly.kr/blog" },
  openGraph: {
    title: "임대인 가이드 블로그 — 온리",
    description: "임대 수익률·세금·법률·공실 관리 실전 가이드",
    url: "https://www.ownly.kr/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "임대인 가이드 블로그 — 온리",
    description: "임대 수익률·세금·법률·공실 관리 실전 가이드",
  },
};

export default function BlogLayout({ children }) {
  return children;
}
