"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    id: "welcome",
    emoji: "👋",
    title: "온리에 오신 걸 환영합니다",
    subtitle: "내 임대 물건, 온리 하나로",
    desc: "수금부터 계약·세금·내용증명까지\n임대 관리에 필요한 모든 것을 한 곳에서.",
    cta: "시작하기",
    skip: false,
  },
  {
    id: "register",
    emoji: "🏠",
    title: "첫 물건을 등록해보세요",
    subtitle: "2분이면 충분합니다",
    desc: null,
    cta: "물건 등록하기",
    skip: true,
  },
  {
    id: "done",
    emoji: "🎉",
    title: "준비 완료!",
    subtitle: "이제 관리를 시작하세요",
    desc: "세입자를 연결하고 수금 현황을 추적하면\n미납 알림과 계약 만료 알림을 자동으로 받을 수 있어요.",
    cta: "대시보드로 이동",
    skip: false,
  },
];

const QUICK_FEATURES = [
  { icon: "💰", title: "월세 수금 자동 추적", desc: "납부일마다 현황 자동 업데이트" },
  { icon: "📅", title: "계약 만료 60일 전 알림", desc: "공실 없이 갱신 협상 시작" },
  { icon: "🧾", title: "세금 시뮬레이터", desc: "예상 종합소득세 미리 파악" },
  { icon: "📝", title: "내용증명 원클릭 발행", desc: "변호사 없이 법적 서식 생성" },
];

export default function OnboardingModal({ onClose }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [propertyType, setPropertyType] = useState("주거");
  const current = STEPS[step];

  // ✅ 모달 닫기 — localStorage 저장 + onClose 호출을 한 곳에서
  const handleClose = (navigateTo) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ownly_onboarding_done", "1");
    }
    onClose(); // 부모의 setShowOnboarding(false) 호출
    if (navigateTo) {
      router.push(navigateTo);
    }
  };

  const goNext = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAnimating(false);
    }, 200);
  };

  const handleCta = () => {
    if (step === 0) { goNext(); return; }
    if (step === 1) {
      // 물건 등록 페이지로 이동
      handleClose("/dashboard/properties");
      return;
    }
    if (step === 2) {
      // 대시보드 이동 — 이미 대시보드에 있으므로 그냥 닫기
      handleClose();
      return;
    }
  };

  const handleSkip = () => {
    // 스킵 시 마지막 스텝으로 이동
    setStep(STEPS.length - 1);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 480,
        overflow: "hidden", boxShadow: "0 24px 80px rgba(26,39,68,0.25)",
        opacity: animating ? 0 : 1, transform: animating ? "translateY(8px)" : "translateY(0)",
        transition: "opacity .2s, transform .2s",
      }}>
        {/* 진행 바 */}
        <div style={{ height: 4, background: "#f0efe9" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            background: "linear-gradient(90deg, #1a2744, #5b4fcf)",
            width: `${((step + 1) / STEPS.length) * 100}%`,
            transition: "width .4s ease",
          }} />
        </div>

        <div style={{ padding: "32px 32px 28px" }}>

          {/* 스텝 0: 환영 */}
          {step === 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>{current.emoji}</div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>
                {current.title}
              </h1>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#5b4fcf", marginBottom: 16 }}>
                {current.subtitle}
              </p>
              <p style={{ fontSize: 14, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 28, whiteSpace: "pre-line" }}>
                {current.desc}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24, textAlign: "left" }}>
                {QUICK_FEATURES.map(f => (
                  <div key={f.title} style={{ background: "#f8f7f4", borderRadius: 12, padding: "12px 14px" }}>
                    <span style={{ fontSize: 20, display: "block", marginBottom: 6 }}>{f.icon}</span>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", marginBottom: 3 }}>{f.title}</p>
                    <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.4 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 스텝 1: 물건 등록 유도 */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>{current.emoji}</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1a2744", marginBottom: 6, textAlign: "center" }}>{current.title}</h2>
              <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 24, textAlign: "center" }}>{current.subtitle}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>어떤 물건을 관리하시나요?</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
                {[
                  { type: "주거", icon: "🏠", desc: "아파트·빌라·오피스텔" },
                  { type: "상가", icon: "🏪", desc: "1층 상가·오피스" },
                  { type: "토지", icon: "🌱", desc: "나대지·농지·임야" },
                ].map(item => (
                  <button key={item.type} onClick={() => setPropertyType(item.type)} style={{
                    padding: "14px 10px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                    border: `2px solid ${propertyType === item.type ? "#1a2744" : "#ebe9e3"}`,
                    background: propertyType === item.type ? "rgba(26,39,68,0.05)" : "transparent",
                    transition: "all .15s",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", marginBottom: 2 }}>{item.type}</p>
                    <p style={{ fontSize: 10, color: "#8a8a9a" }}>{item.desc}</p>
                  </button>
                ))}
              </div>
              <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#1a2744", marginBottom: 10 }}>등록 시 필요한 정보</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["📍 주소 (도로명 검색 지원)", "👤 세입자 이름 + 연락처", "💰 월세·보증금·계약 기간"].map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: "#0fa573", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: "#fff", fontSize: 10 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 12, color: "#6a6a7a" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 스텝 2: 완료 */}
          {step === 2 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>{current.emoji}</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>{current.title}</h2>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#5b4fcf", marginBottom: 16 }}>{current.subtitle}</p>
              <p style={{ fontSize: 14, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 24, whiteSpace: "pre-line" }}>{current.desc}</p>
              {/* 추천 액션 — 클릭 시 바로 이동 + 모달 닫기 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                {[
                  { icon: "👤", label: "세입자 연결하기", desc: "수금·계약 추적 시작", color: "#5b4fcf", page: "/dashboard/tenants" },
                  { icon: "💰", label: "수금 현황 확인", desc: "이번 달 납부 상태", color: "#0fa573", page: "/dashboard/payments" },
                  { icon: "🧾", label: "세금 미리 계산", desc: "종합소득세 추정", color: "#e8960a", page: "/dashboard/tax" },
                ].map(item => (
                  <button key={item.page} onClick={() => handleClose(item.page)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    borderRadius: 12, border: `1px solid ${item.color}25`,
                    background: item.color + "08", cursor: "pointer", width: "100%",
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: "#8a8a9a", margin: 0 }}>{item.desc}</p>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: item.color, fontWeight: 700 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA 버튼 */}
          <button onClick={handleCta} style={{
            width: "100%", padding: "14px", borderRadius: 14, marginTop: 20,
            background: "linear-gradient(135deg, #1a2744, #2d4270)",
            border: "none", color: "#fff", fontWeight: 800, fontSize: 15,
            cursor: "pointer", boxShadow: "0 4px 16px rgba(26,39,68,0.25)",
          }}>
            {current.cta}
          </button>

          {/* 스킵 */}
          {current.skip && (
            <button onClick={handleSkip} style={{
              width: "100%", padding: "10px", marginTop: 8, borderRadius: 10,
              background: "transparent", border: "none", color: "#8a8a9a",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              나중에 등록하기
            </button>
          )}

          {/* 스텝 인디케이터 */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                background: i === step ? "#1a2744" : "#e0ddd8",
                transition: "all .3s",
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
