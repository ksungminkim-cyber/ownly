"use client";
import { useState } from "react";

const FAQS = [
  {
    category: "서비스 일반",
    items: [
      {
        q: "Ownly는 어떤 서비스인가요?",
        a: "Ownly는 임대인을 위한 임대 자산 관리 플랫폼입니다. 주거·상가·토지 등 다양한 유형의 임대 물건을 등록하고, 세입자 관리, 수금 현황 추적, 임대차 계약 관리, 세금 시뮬레이션, 내용증명 작성 등 임대 관리에 필요한 모든 기능을 제공합니다.",
      },
      {
        q: "무료로 사용할 수 있나요?",
        a: "네, 무료 플랜을 제공합니다. 무료 플랜은 물건 2개, 세입자 3명까지 등록할 수 있습니다. 더 많은 물건과 기능이 필요하시면 스타터(월 10,900원), 스타터+(월 19,900원), 프로(월 32,900원) 플랜으로 업그레이드하실 수 있습니다.",
      },
      {
        q: "데이터는 어디에 저장되나요?",
        a: "모든 데이터는 글로벌 클라우드 인프라(Supabase)에 안전하게 암호화되어 저장됩니다. 데이터는 오직 해당 계정의 소유자만 접근할 수 있으며, 회사는 운영 목적 외에 데이터에 접근하지 않습니다.",
      },
    ],
  },
  {
    category: "결제 및 구독",
    items: [
      {
        q: "결제 수단은 무엇을 지원하나요?",
        a: "신용카드 및 체크카드를 통한 자동결제를 지원합니다. 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.",
      },
      {
        q: "구독을 언제든지 해지할 수 있나요?",
        a: "네, 언제든지 해지하실 수 있습니다. 해지 시 당월 구독 기간이 종료될 때까지 서비스를 계속 이용하실 수 있습니다. 자동 갱신은 취소되며 다음 달부터 요금이 청구되지 않습니다.",
      },
      {
        q: "환불 정책은 어떻게 되나요?",
        a: "결제일로부터 7일 이내에 서비스를 사용하지 않으셨다면 전액 환불 요청이 가능합니다. 7일이 지난 경우 환불이 어렵습니다. 단, 회사 귀책사유로 인한 서비스 장애의 경우 해당 기간에 대해 일할 계산하여 환불해 드립니다. 환불 문의: inquiry@mclean21.com",
      },
      {
        q: "플랜 업그레이드/다운그레이드는 어떻게 하나요?",
        a: "대시보드 내 '구독 플랜' 메뉴에서 언제든지 플랜을 변경하실 수 있습니다. 업그레이드 시 변경일 기준으로 차액이 일할 계산됩니다.",
      },
    ],
  },
  {
    category: "기능 이용",
    items: [
      {
        q: "내용증명은 어떻게 발송하나요?",
        a: "대시보드 → 내용증명 메뉴에서 세입자 정보와 내용을 입력하면 법적 효력이 있는 내용증명 문서를 작성할 수 있습니다. 작성된 문서는 PDF로 출력하여 등기우편으로 발송하시면 됩니다.",
      },
      {
        q: "세금 시뮬레이터 결과를 믿을 수 있나요?",
        a: "세금 시뮬레이터는 2024년 귀속 세법을 기준으로 한 참고용 추정치를 제공합니다. 실제 세액은 개인 상황에 따라 다를 수 있으므로, 정확한 세금 신고 및 납부를 위해서는 공인 세무사의 상담을 권장합니다.",
      },
      {
        q: "여러 명이 함께 사용할 수 있나요?",
        a: "현재는 1인 계정 기반으로 운영됩니다. 멀티 유저(공동 관리) 기능은 추후 업데이트 예정입니다.",
      },
      {
        q: "모바일에서도 사용할 수 있나요?",
        a: "Ownly는 모바일 브라우저에서도 이용 가능한 반응형 웹 서비스입니다. 별도 앱 설치 없이 스마트폰 브라우저에서 접속하여 사용하실 수 있습니다.",
      },
    ],
  },
  {
    category: "보안 및 개인정보",
    items: [
      {
        q: "비밀번호를 잊어버렸어요.",
        a: "로그인 화면의 '비밀번호 찾기'를 클릭하시면 가입 시 등록한 이메일로 비밀번호 재설정 링크가 발송됩니다.",
      },
      {
        q: "계정을 탈퇴하면 데이터는 어떻게 되나요?",
        a: "계정 탈퇴 시 개인 정보 및 서비스 이용 데이터는 즉시 삭제됩니다. 단, 법령에 따라 일정 기간 보관이 필요한 데이터(결제 기록 등)는 해당 기간 동안 보관 후 삭제됩니다.",
      },
    ],
  },
];

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState({});

  const toggle = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenIdx(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #ebe9e3" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 24px 20px" }}>
          <a href="/dashboard" style={{ fontSize: 12, color: "#8a8a9a", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
            ← 대시보드로 돌아가기
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>Ownly</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a2744", letterSpacing: "-.5px", marginBottom: 6 }}>자주 묻는 질문</h1>
          <p style={{ fontSize: 14, color: "#8a8a9a" }}>궁금한 점이 있으시면 아래에서 확인해보세요. 더 도움이 필요하시면 <a href="mailto:inquiry@mclean21.com" style={{ color: "#1a2744", fontWeight: 700 }}>inquiry@mclean21.com</a>으로 문의해주세요.</p>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 60px" }}>
        {FAQS.map((cat, catIdx) => (
          <div key={catIdx} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 14 }}>{cat.category}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cat.items.map((item, itemIdx) => {
                const key = `${catIdx}-${itemIdx}`;
                const isOpen = !!openIdx[key];
                return (
                  <div key={itemIdx} style={{ background: "#ffffff", border: "1px solid " + (isOpen ? "#1a274440" : "#ebe9e3"), borderRadius: 14, overflow: "hidden", transition: "border-color .2s" }}>
                    <button onClick={() => toggle(catIdx, itemIdx)}
                      style={{ width: "100%", padding: "18px 20px", background: "transparent", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, textAlign: "left" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", lineHeight: 1.5 }}>{item.q}</span>
                      <span style={{ fontSize: 18, color: "#1a2744", fontWeight: 400, flexShrink: 0, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform .2s", display: "inline-block" }}>+</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 20px 18px", borderTop: "1px solid #f0efe9" }}>
                        <p style={{ fontSize: 13, color: "#5a5a6e", lineHeight: 1.8, marginTop: 14 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 추가 문의 */}
        <div style={{ background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(91,79,207,0.04))", border: "1px solid #e0e0f0", borderRadius: 16, padding: "24px 28px", textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 6 }}>원하는 답변을 찾지 못하셨나요?</p>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 16 }}>고객센터로 문의하시면 빠르게 도움드리겠습니다.</p>
          <a href="mailto:inquiry@mclean21.com"
            style={{ display: "inline-block", padding: "11px 24px", borderRadius: 10, background: "#1a2744", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            이메일 문의하기 →
          </a>
        </div>
      </div>
    </div>
  );
}
