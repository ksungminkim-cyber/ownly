"use client";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";
import { PLANS, PAID_PLAN_ID } from "../../lib/constants";

// 채움·낙찰너머에서 넘어온 임대인 전용 랜딩 — 패밀리 퍼널의 온리 쪽 받는 면
const plus = PLANS[PAID_PLAN_ID];
const SIGNUP = "/login?mode=signup&next=%2Fdashboard";
const KAKAO = "http://pf.kakao.com/_ZBcxhX";

const navy = "#1a2744";
const muted = "#8a8a9a";

const STEPS = [
  { t: "수금, 더 이상 달력에 표시하지 마세요", d: "물건·세입자를 등록하면 월세 입금 현황이 자동으로 정리되고, 미납이 생기면 알림이 옵니다." },
  { t: "계약 만기를 놓치지 않습니다", d: "계약 만기 D-day 알림, 표준 계약서 생성, 법적 효력의 내용증명까지 한 곳에서 처리합니다." },
  { t: "세금은 미리 보이게", d: "임대 소득 기준으로 종합소득세·부가세를 자동 추정해 신고 시즌에 당황하지 않게 합니다." },
];

export default function ChaeumLandingPage() {
  return (
    <div style={{ fontFamily: "'Pretendard','DM Sans',sans-serif", background: "#f7f6f2", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, width: "100%", maxWidth: 760, margin: "0 auto", padding: "56px 20px 72px" }}>

        <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", color: "#14634B" }}>채움 · 낙찰너머 임대인 전용</p>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 800, color: navy, lineHeight: 1.35, marginTop: 10 }}>
          공실이 채워지면,<br />그때부터가 임대의 시작입니다.
        </h1>
        <p style={{ fontSize: 15, color: muted, marginTop: 14, lineHeight: 1.7, maxWidth: "36em" }}>
          채움에서 임차인을 찾으셨거나 낙찰너머로 상가를 알아보셨다면, 다음 고민은 똑같습니다 —
          월세는 제때 들어오는지, 계약 만기는 언제인지, 세금은 얼마나 나올지.
          <b style={{ color: navy }}> 온리</b>는 그 전부를 한 화면에서 관리하는 임대인 플랫폼입니다.
        </p>

        <div style={{ display: "grid", gap: 14, marginTop: 34 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e2e0d8", borderRadius: 12, padding: "18px 22px" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: navy }}>{s.t}</p>
              <p style={{ fontSize: 13.5, color: muted, marginTop: 6, lineHeight: 1.65 }}>{s.d}</p>
            </div>
          ))}
        </div>

        {/* 전용 혜택 */}
        <div style={{ marginTop: 34, background: "#1a2744", borderRadius: 14, padding: "26px 26px 28px", color: "#f1f3f0" }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "#B9C6D8" }}>전용 혜택</p>
          <p style={{ fontSize: 19, fontWeight: 800, marginTop: 8 }}>
            플러스(월 {plus.price.toLocaleString()}원) 첫 달 무료
          </p>
          <p style={{ fontSize: 13.5, color: "#B9C6D8", marginTop: 10, lineHeight: 1.7 }}>
            적용 방법 — ① 아래에서 무료로 가입하고 ② 카카오톡 채널 <b style={{ color: "#fee500" }}>@온리_ownly</b>로
            {" "}&ldquo;채움(또는 낙찰너머)에서 왔어요&rdquo;와 가입 이메일을 보내주세요. 확인 후 바로 적용해 드립니다.
            무료 플랜은 혜택 없이도 기간 제한 없이 쓸 수 있습니다.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <Link href={SIGNUP} style={{ background: "#fff", color: navy, fontWeight: 800, fontSize: 14, padding: "12px 22px", borderRadius: 9, textDecoration: "none" }}>
              무료로 시작하기 →
            </Link>
            <a href={KAKAO} target="_blank" rel="noopener noreferrer" style={{ background: "#fee500", color: "#3c1e1e", fontWeight: 800, fontSize: 14, padding: "12px 22px", borderRadius: 9, textDecoration: "none" }}>
              💬 카카오톡으로 혜택 받기
            </a>
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: muted, marginTop: 22, lineHeight: 1.7 }}>
          처음이신가요? <Link href="/pricing" style={{ color: navy }}>요금제 보기</Link> ·{" "}
          <Link href="/" style={{ color: navy }}>온리가 하는 일 둘러보기</Link>
          <br />공실 임차인 찾기는 <a href="https://chaeum.mclean21.com" target="_blank" rel="noopener noreferrer" style={{ color: navy }}>채움</a>,
          경매 상가 수익성 계산은 <a href="https://beyond.mclean21.com" target="_blank" rel="noopener noreferrer" style={{ color: navy }}>낙찰너머</a>에서.
        </p>

      </main>
      <SiteFooter />
    </div>
  );
}
