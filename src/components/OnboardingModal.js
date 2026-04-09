"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";

const STEPS = [
  {
    icon: "🏠",
    title: "첫 번째: 물건을 등록하세요",
    desc: "주거·상가·토지 유형별로 임대 물건을 등록합니다.\n주소, 월세, 보증금, 계약 기간을 입력하면 돼요.",
    cta: "지금 물건 등록하기 →",
    path: "/dashboard/properties",
    tip: "물건 하나 등록하는 데 1분이면 충분해요.",
    color: "#1a2744",
    bg: "rgba(26,39,68,0.06)",
    checkKey: "hasProperties",
    benefit: "등록 후 월세 수금·만료일 자동 추적 시작",
  },
  {
    icon: "👤",
    title: "두 번째: 세입자를 연결하세요",
    desc: "등록한 물건에 세입자 정보를 연결합니다.\n이름, 전화번호, 납부일을 입력하세요.",
    cta: "세입자 등록하러 가기 →",
    path: "/dashboard/tenants",
    tip: "납부일을 설정하면 매달 수금 예정일이 캘린더에 표시돼요.",
    color: "#4f46e5",
    bg: "rgba(79,70,229,0.06)",
    checkKey: "hasTenants",
    benefit: "연결 후 미납 알림·연락처 관리 자동화",
  },
  {
    icon: "💰",
    title: "세 번째: 수금 현황을 확인하세요",
    desc: "매월 납부 여부를 확인하고,\n미납 세입자를 즉시 파악할 수 있어요.",
    cta: "수금 현황 확인하기 →",
    path: "/dashboard/payments",
    tip: "납부처리 한 번이면 장부에 자동으로 기록돼요.",
    color: "#0fa573",
    bg: "rgba(15,165,115,0.06)",
    checkKey: null,
    benefit: "수금 데이터가 쌓이면 연간 수익 리포트 생성",
  },
];

// ✅ 완료 화면
function DoneScreen({ onClose }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: 56, marginBottom: 16, animation: "bounce-in .5s ease" }}>🎉</div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", marginBottom: 8, letterSpacing: "-.4px" }}>
        온리 시작 준비 완료!
      </h2>
      <p style={{ fontSize: 14, color: "#8a8a9a", lineHeight: 1.8, marginBottom: 24 }}>
        이제 임대 관리의 모든 것을<br/>온리 하나로 처리할 수 있어요.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {[
          { icon: "✅", text: "월세 수금 자동 추적" },
          { icon: "✅", text: "계약 만료일 알림" },
          { icon: "✅", text: "세금 신고 시뮬레이터" },
          { icon: "✅", text: "수리비 → 장부 자동 연동" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(15,165,115,0.06)", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 14, color: "#0fa573" }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{text}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        style={{ width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(26,39,68,0.2)" }}
      >
        대시보드로 시작하기 🚀
      </button>
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function OnboardingModal() {
  const router = useRouter();
  const { tenants } = useApp();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("ownly_onboarded");
    if (!completed) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const finish = () => {
    localStorage.setItem("ownly_onboarded", "1");
    setOpen(false);
    setDone(false);
    setStep(0);
  };

  const goStep = (path) => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      setDone(true);
    }
    router.push(path);
  };

  const handleComplete = () => {
    setDone(true);
  };

  if (!open) return null;

  const s = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}
    >
      <div style={{ background: "var(--surface)", borderRadius: 22, padding: "28px 26px 24px", maxWidth: 420, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", position: "relative", animation: "fade-in .2s ease" }}>

        {done ? (
          <DoneScreen onClose={finish} />
        ) : (
          <>
            {/* ✅ 진행률 바 — 상단 */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "1px", textTransform: "uppercase" }}>
                  시작 가이드
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>
                  {step + 1} / {STEPS.length}
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 5, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((step + 1) / STEPS.length) * 100}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)`, borderRadius: 5, transition: "width .4s ease" }} />
              </div>
              {/* 단계 인디케이터 */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                {STEPS.map((st, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, color: i <= step ? st.color : "#c0c0cc" }}>
                    {i < step ? "✓ " : ""}{["물건", "세입자", "수금"][i]}
                  </span>
                ))}
              </div>
            </div>

            {/* 아이콘 */}
            <div style={{ width: 68, height: 68, borderRadius: 20, background: s.bg, border: `2px solid ${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 18px" }}>
              {s.icon}
            </div>

            {/* 내용 */}
            <h2 style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", textAlign: "center", marginBottom: 10, letterSpacing: "-.4px" }}>
              {s.title}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.8, marginBottom: 8, whiteSpace: "pre-line" }}>
              {s.desc}
            </p>

            {/* ✅ 팁 + 혜택 */}
            <div style={{ background: s.bg, borderRadius: 10, padding: "10px 14px", marginBottom: 8, textAlign: "center" }}>
              <p style={{ fontSize: 12, color: s.color, fontWeight: 700, margin: 0 }}>💡 {s.tip}</p>
            </div>
            <div style={{ background: "rgba(15,165,115,0.05)", border: "1px solid rgba(15,165,115,0.15)", borderRadius: 10, padding: "8px 14px", marginBottom: 20, textAlign: "center" }}>
              <p style={{ fontSize: 11, color: "#0fa573", fontWeight: 600, margin: 0 }}>🎯 {s.benefit}</p>
            </div>

            {/* 메인 CTA */}
            <button
              onClick={() => goStep(s.path)}
              style={{ width: "100%", padding: "13px", borderRadius: 12, background: `linear-gradient(135deg,${s.color},${s.color}cc)`, color: "#fff", border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer", marginBottom: 8, boxShadow: `0 4px 16px ${s.color}30` }}
            >
              {s.cta}
            </button>

            {/* 다음/이전 */}
            <div style={{ display: "flex", gap: 8 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  ← 이전
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: "10px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  다음 →
                </button>
              ) : (
                <button onClick={handleComplete} style={{ flex: 2, padding: "10px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  완료 ✓
                </button>
              )}
            </div>

            {/* 건너뛰기 — 덜 눈에 띄게 */}
            <p style={{ textAlign: "center", marginTop: 12 }}>
              <button onClick={finish} style={{ background: "none", border: "none", fontSize: 11, color: "#c0c0cc", cursor: "pointer" }}>
                나중에 하기
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
