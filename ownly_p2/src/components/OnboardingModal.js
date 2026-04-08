"use client";
// src/components/OnboardingModal.js
// 첫 로그인 시 3단계 온보딩 가이드 모달
// localStorage 'ownly_onboarded' 로 완료 여부 관리

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    icon: "🏠",
    title: "물건을 등록하세요",
    desc: "주거·상가·토지 유형별로 임대 물건을 등록합니다.\n주소, 월세, 보증금, 계약 기간을 입력하면 돼요.",
    cta: "물건 등록하러 가기",
    path: "/dashboard/properties",
    tip: "물건 등록 후 세입자를 연결할 수 있어요.",
    color: "#1a2744",
    bg: "rgba(26,39,68,0.06)",
  },
  {
    icon: "👤",
    title: "세입자를 연결하세요",
    desc: "등록한 물건에 세입자 정보를 연결합니다.\n이름, 전화번호, 계약 기간을 입력하세요.",
    cta: "세입자 등록하러 가기",
    path: "/dashboard/tenants",
    tip: "세입자 등록 후 월세 수금 관리가 시작돼요.",
    color: "#4f46e5",
    bg: "rgba(79,70,229,0.06)",
  },
  {
    icon: "💰",
    title: "수금 현황을 확인하세요",
    desc: "매월 월세 납부 여부를 확인하고 미납 세입자를\n빠르게 파악할 수 있어요.",
    cta: "수금 현황 확인하기",
    path: "/dashboard/payments",
    tip: "수금 데이터가 쌓이면 대시보드 차트가 채워져요.",
    color: "#0fa573",
    bg: "rgba(15,165,115,0.06)",
  },
];

export default function OnboardingModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 이미 온보딩 완료한 유저는 표시 안 함
    const done = localStorage.getItem("ownly_onboarded");
    if (!done) {
      // 첫 로그인 후 1초 딜레이로 부드럽게 표시
      const t = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const finish = () => {
    localStorage.setItem("ownly_onboarded", "1");
    setOpen(false);
  };

  const goStep = (path) => {
    finish();
    router.push(path);
  };

  if (!open) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, animation:"fade-in .2s ease" }}
      onClick={e => e.target === e.currentTarget && finish()}
    >
      <div style={{ background:"var(--surface)", borderRadius:20, padding:"32px 28px 24px", maxWidth:420, width:"100%", boxShadow:"0 24px 60px rgba(0,0,0,0.2)", position:"relative" }}>

        {/* 닫기 */}
        <button onClick={finish} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:8, border:"none", background:"var(--surface2)", color:"var(--text-muted)", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
          ✕
        </button>

        {/* 스텝 인디케이터 */}
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height:4, width: i === step ? 24 : 8, borderRadius:4, background: i === step ? s.color : "var(--border)", transition:"all .3s" }} />
          ))}
        </div>

        {/* 아이콘 */}
        <div style={{ width:64, height:64, borderRadius:18, background:s.bg, border:`2px solid ${s.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>
          {s.icon}
        </div>

        {/* 내용 */}
        <h2 style={{ fontSize:20, fontWeight:900, color:"var(--text)", textAlign:"center", marginBottom:10, letterSpacing:"-.4px" }}>
          {s.title}
        </h2>
        <p style={{ fontSize:13, color:"var(--text-muted)", textAlign:"center", lineHeight:1.8, marginBottom:8, whiteSpace:"pre-line" }}>
          {s.desc}
        </p>
        <div style={{ background:s.bg, borderRadius:10, padding:"10px 14px", marginBottom:24, textAlign:"center" }}>
          <p style={{ fontSize:12, color:s.color, fontWeight:700, margin:0 }}>💡 {s.tip}</p>
        </div>

        {/* 버튼 */}
        <button
          onClick={() => goStep(s.path)}
          style={{ width:"100%", padding:"13px", borderRadius:12, background:`linear-gradient(135deg,${s.color},${s.color}dd)`, color:"#fff", border:"none", fontWeight:800, fontSize:14, cursor:"pointer", marginBottom:10, boxShadow:`0 4px 16px ${s.color}30` }}
        >
          {s.cta} →
        </button>

        <div style={{ display:"flex", gap:8 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex:1, padding:"11px", borderRadius:11, background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontWeight:600, fontSize:13, cursor:"pointer" }}>
              ← 이전
            </button>
          )}
          {!isLast ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ flex:2, padding:"11px", borderRadius:11, background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--text)", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              다음 단계 보기 →
            </button>
          ) : (
            <button onClick={finish}
              style={{ flex:2, padding:"11px", borderRadius:11, background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--text)", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              시작하기 ✓
            </button>
          )}
        </div>

        {/* 건너뛰기 */}
        <p style={{ textAlign:"center", marginTop:14 }}>
          <button onClick={finish} style={{ background:"none", border:"none", fontSize:12, color:"var(--text-muted)", cursor:"pointer", textDecoration:"underline" }}>
            온보딩 건너뛰기
          </button>
        </p>
      </div>
    </div>
  );
}
