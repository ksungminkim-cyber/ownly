"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "무료",
    badge: null,
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "소규모 임대인을 위한 무료 플랜",
    cta: "무료로 시작",
    ctaHref: "/dashboard",
    ctaStyle: "outline" as const,
    features: [
      { text: "물건 최대 3개", included: true },
      { text: "세입자 최대 5명", included: true },
      { text: "수금 현황 관리", included: true },
      { text: "계약서 기본 관리", included: true },
      { text: "캘린더", included: true },
      { text: "리포트 / 세금 관리", included: false },
      { text: "내용증명", included: false },
      { text: "PDF 내보내기", included: false },
      { text: "프리미엄 기능 전체", included: false },
    ],
  },
  {
    id: "plus",
    name: "플러스",
    badge: "추천",
    badgeColor: "#6366f1",
    monthlyPrice: 19900,
    yearlyPrice: Math.round(19900 * 0.8),
    description: "다수 물건을 체계적으로 관리하는 임대인",
    cta: "구독 시작하기",
    ctaHref: "/dashboard/subscription",
    ctaStyle: "primary" as const,
    features: [
      { text: "물건 최대 15개", included: true },
      { text: "세입자 최대 30명", included: true },
      { text: "수금·계약·캘린더·세금 전체", included: true },
      { text: "내용증명 월 10건", included: true },
      { text: "💰 수익률 계산기", included: true },
      { text: "📊 공실 손실 계산기", included: true },
      { text: "📋 임대차 3법 체크리스트", included: true },
      { text: "🤖 AI 분석 월 10회", included: true },
      { text: "📱 카카오톡 알림", included: false },
    ],
  },
  {
    id: "pro",
    name: "프로",
    badge: "최강",
    badgeColor: "#e11d48",
    monthlyPrice: 32900,
    yearlyPrice: Math.round(32900 * 0.8),
    description: "건물 전체·법인 규모의 전문 임대인",
    cta: "구독 시작하기",
    ctaHref: "/dashboard/subscription",
    ctaStyle: "dark" as const,
    features: [
      { text: "물건·세입자 무제한", included: true },
      { text: "플러스 전체 기능", included: true },
      { text: "내용증명 무제한", included: true },
      { text: "🗺️ 주변 매물 조회", included: true },
      { text: "🤖 AI 분석 무제한", included: true },
      { text: "📱 카카오톡 수금 알림", included: true },
      { text: "멀티 빌딩 관리 (예정)", included: true },
      { text: "전담 1:1 이메일 지원", included: true },
      { text: "신기능 최우선 출시", included: true },
    ],
  },
];

const FAQ = [
  {
    q: "무료 플랜은 정말 영구 무료인가요?",
    a: "네. 물건 3개·세입자 5명 이하라면 기간 제한 없이 영구 무료로 사용하실 수 있습니다. 신용카드 등록도 필요 없습니다.",
  },
  {
    q: "연간 결제로 변경하면 바로 할인이 적용되나요?",
    a: "네. 월간에서 연간으로 전환 시 남은 기간을 정산한 뒤 연간 요금(20% 할인)으로 자동 전환됩니다.",
  },
  {
    q: "플랜을 언제든지 취소할 수 있나요?",
    a: "언제든 취소 가능합니다. 취소해도 결제 기간 종료 시까지 기능은 유지되고, 이후 자동으로 무료 플랜으로 전환됩니다.",
  },
  {
    q: "세금계산서 발행이 필요합니다.",
    a: "법인·사업자 고객은 영업팀(inquiry@mclean21.com)으로 문의주시면 세금계산서 발행·연간 계약을 협의드립니다.",
  },
  {
    q: "카카오톡 알림은 어떻게 작동하나요?",
    a: "프로 플랜에서 미납·납부예정·계약만료 알림을 카카오 알림톡으로 임대인 본인에게 발송합니다. 별도 설정 없이 자동으로 발송됩니다.",
  },
];

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

export default function PricingClient() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary, #faf9f7)",
        fontFamily:
          "'Noto Sans KR', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "var(--text-primary, #1a1a1a)",
      }}
    >
      {/* 상단 네비 */}
      <nav
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: "1px solid var(--border-color, #e8e4de)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "inherit",
            fontSize: "14px",
            opacity: 0.6,
          }}
        >
          ← 홈으로
        </Link>
      </nav>

      {/* 히어로 */}
      <section
        style={{
          textAlign: "center",
          padding: "60px 24px 40px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "#6366f1",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          PRICING
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 6vw, 42px)",
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: "16px",
            letterSpacing: "-0.02em",
          }}
        >
          나에게 맞는 플랜 선택
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary, #666)",
            marginBottom: "36px",
          }}
        >
          모든 플랜은 언제든지 변경·취소 가능합니다
        </p>

        {/* 월간/연간 토글 */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "var(--bg-secondary, #f0ede8)",
            borderRadius: "100px",
            padding: "4px",
          }}
        >
          <button
            onClick={() => setIsYearly(false)}
            style={{
              padding: "8px 20px",
              borderRadius: "100px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              background: !isYearly ? "#fff" : "transparent",
              color: !isYearly
                ? "var(--text-primary, #1a1a1a)"
                : "var(--text-secondary, #888)",
              boxShadow: !isYearly ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
            }}
          >
            월간 결제
          </button>
          <button
            onClick={() => setIsYearly(true)}
            style={{
              padding: "8px 20px",
              borderRadius: "100px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              background: isYearly ? "#fff" : "transparent",
              color: isYearly
                ? "var(--text-primary, #1a1a1a)"
                : "var(--text-secondary, #888)",
              boxShadow: isYearly ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            연간 결제
            <span
              style={{
                background: "#dcfce7",
                color: "#16a34a",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "100px",
              }}
            >
              20% 할인
            </span>
          </button>
        </div>
      </section>

      {/* 플랜 카드 */}
      <section
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "0 16px 60px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          alignItems: "start",
        }}
      >
        {PLANS.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const isPrimary = plan.id === "plus";
          const isDark = plan.id === "pro";

          return (
            <div
              key={plan.id}
              style={{
                background: isDark
                  ? "#1a1a2e"
                  : isPrimary
                  ? "#fff"
                  : "var(--bg-secondary, #f5f2ee)",
                border: isPrimary
                  ? "2px solid #6366f1"
                  : isDark
                  ? "2px solid #3730a3"
                  : "1.5px solid var(--border-color, #e8e4de)",
                borderRadius: "20px",
                padding: "28px 24px",
                position: "relative",
                boxShadow: isPrimary
                  ? "0 8px 32px rgba(99,102,241,0.15)"
                  : isDark
                  ? "0 8px 32px rgba(0,0,0,0.2)"
                  : "none",
                transform: isPrimary ? "translateY(-6px)" : "none",
              }}
            >
              {/* 배지 */}
              {plan.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: plan.badgeColor,
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "100px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {plan.badge}
                </span>
              )}

              {/* 플랜명 */}
              <div style={{ marginBottom: "4px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: isPrimary
                      ? "#6366f1"
                      : isDark
                      ? "#a5b4fc"
                      : "var(--text-secondary, #888)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {plan.name}
                </span>
              </div>

              {/* 가격 */}
              <div
                style={{
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "4px",
                }}
              >
                {price === 0 ? (
                  <span
                    style={{
                      fontSize: "36px",
                      fontWeight: 800,
                      color: isDark ? "#fff" : "var(--text-primary, #1a1a1a)",
                    }}
                  >
                    무료
                  </span>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: "36px",
                        fontWeight: 800,
                        color: isDark ? "#fff" : "var(--text-primary, #1a1a1a)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      ₩{formatPrice(price)}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: isDark ? "#a5b4fc" : "var(--text-secondary, #888)",
                      }}
                    >
                      /월
                    </span>
                  </>
                )}
              </div>

              {price === 0 ? (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary, #888)",
                    marginBottom: "20px",
                  }}
                >
                  영구 무료
                </p>
              ) : (
                <p
                  style={{
                    fontSize: "12px",
                    color: isDark ? "#818cf8" : "var(--text-secondary, #888)",
                    marginBottom: "20px",
                  }}
                >
                  {isYearly
                    ? `연 ₩${formatPrice(price * 12)} · VAT 포함`
                    : "월 구독 · VAT 포함"}
                </p>
              )}

              {/* 설명 */}
              <p
                style={{
                  fontSize: "13px",
                  color: isDark ? "#94a3b8" : "var(--text-secondary, #666)",
                  marginBottom: "24px",
                  lineHeight: 1.5,
                }}
              >
                {plan.description}
              </p>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                  marginBottom: "24px",
                  border:
                    plan.ctaStyle === "outline"
                      ? "1.5px solid var(--border-color, #d4cfc8)"
                      : "none",
                  background:
                    plan.ctaStyle === "primary"
                      ? "linear-gradient(135deg, #6366f1, #a855f7)"
                      : plan.ctaStyle === "dark"
                      ? "#fff"
                      : "transparent",
                  color:
                    plan.ctaStyle === "primary"
                      ? "#fff"
                      : plan.ctaStyle === "dark"
                      ? "#1a1a2e"
                      : "var(--text-primary, #1a1a1a)",
                  boxShadow:
                    plan.ctaStyle === "primary"
                      ? "0 4px 16px rgba(99,102,241,0.4)"
                      : "none",
                }}
              >
                {plan.cta}
              </Link>

              {/* 기능 목록 */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {plan.features.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "7px 0",
                      fontSize: "13px",
                      color: f.included
                        ? isDark
                          ? "#e2e8f0"
                          : "var(--text-primary, #1a1a1a)"
                        : isDark
                        ? "#475569"
                        : "var(--text-secondary, #bbb)",
                      borderBottom:
                        i < plan.features.length - 1
                          ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "var(--border-color, #f0ede8)"}`
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        color: f.included
                          ? "#22c55e"
                          : isDark
                          ? "#334155"
                          : "#d1d5db",
                        marginTop: "1px",
                      }}
                    >
                      {f.included ? "✓" : "✗"}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* 비교 요약 배너 */}
      <section
        style={{
          maxWidth: "800px",
          margin: "0 auto 60px",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            borderRadius: "20px",
            padding: "36px 32px",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px", opacity: 0.8 }}>
            ENTERPRISE
          </p>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              marginBottom: "12px",
              lineHeight: 1.3,
            }}
          >
            법인·공인중개사·자산관리사 대상
            <br />
            별도 문의
          </h2>
          <p
            style={{
              fontSize: "14px",
              opacity: 0.85,
              marginBottom: "24px",
              lineHeight: 1.6,
            }}
          >
            다수 물건 보유 법인 · 공인중개사 사무소 · 자산관리회사
            <br />
            세금계산서 발행 · 연간 계약 · 팀 계정 협의 가능
          </p>
          <a
            href="mailto:inquiry@mclean21.com"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              background: "#fff",
              color: "#6366f1",
              borderRadius: "100px",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            영업팀에 문의하기 →
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{
          maxWidth: "680px",
          margin: "0 auto 80px",
          padding: "0 16px",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 800,
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          자주 묻는 질문
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {FAQ.map((item, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-secondary, #f5f2ee)",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1.5px solid var(--border-color, #e8e4de)",
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text-primary, #1a1a1a)",
                  fontFamily: "inherit",
                }}
              >
                {item.q}
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: "18px",
                    color: "#6366f1",
                    transition: "transform 0.2s",
                    transform: openFaq === i ? "rotate(45deg)" : "none",
                  }}
                >
                  +
                </span>
              </button>
              {openFaq === i && (
                <div
                  style={{
                    padding: "0 20px 18px",
                    fontSize: "13px",
                    color: "var(--text-secondary, #666)",
                    lineHeight: 1.7,
                    borderTop: "1px solid var(--border-color, #e8e4de)",
                    paddingTop: "14px",
                  }}
                >
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 하단 CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "0 24px 100px",
        }}
      >
        <p
          style={{
            fontSize: "20px",
            fontWeight: 800,
            marginBottom: "8px",
          }}
        >
          지금 바로 시작해보세요
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary, #888)",
            marginBottom: "24px",
          }}
        >
          무료 플랜으로 시작, 언제든 업그레이드 가능
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "14px 36px",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            color: "#fff",
            borderRadius: "100px",
            fontWeight: 700,
            fontSize: "15px",
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
          }}
        >
          무료로 온리 시작하기 →
        </Link>
        <p
          style={{
            marginTop: "12px",
            fontSize: "12px",
            color: "var(--text-secondary, #aaa)",
          }}
        >
          신용카드 불필요 · 언제든 취소 가능
        </p>
      </section>
    </main>
  );
}
