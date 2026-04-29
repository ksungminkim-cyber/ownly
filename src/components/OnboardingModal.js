"use client";
import { useState, useEffect } from "react";

const STEPS = [
  { id: "welcome", cta: "시작하기", skip: false },
  { id: "register", cta: "다음 →", skip: true },
  { id: "advanced", cta: "마무리 →", skip: false },
  { id: "done", cta: "대시보드로 이동", skip: false },
];

// ✅ React state에 의존하지 않고 DOM에서 직접 모달을 숨김
// onClose prop 완전히 제거 — React 리렌더링 race condition 원천 차단
export default function OnboardingModal() {
  const [step, setStep] = useState(0);
  const [pType, setPType] = useState("주거");
  // ✅ 초기값 false — SSR·초기 렌더에선 무조건 숨김 (깜빡임 제거)
  // 마운트 후 localStorage 확인해서 미완료 유저만 노출
  const [visible, setVisible] = useState(false);

  const close = (path) => {
    try { localStorage.setItem("ownly_onboarding_done", "1"); } catch(e) {}
    setVisible(false);
    if (path) {
      setTimeout(() => { window.location.href = path; }, 80);
    }
  };

  // 최초 진입 유저에게만 노출 (localStorage 플래그 없을 때만 true 설정)
  useEffect(() => {
    try {
      if (!localStorage.getItem("ownly_onboarding_done")) {
        setVisible(true);
      }
    } catch (e) { /* localStorage 접근 불가 환경 */ }
  }, []);

  if (!visible) return null;

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const last = () => setStep(STEPS.length - 1);
  const ctaClick = () => {
    if (step < STEPS.length - 1) { next(); return; }
    close(null);
  };
  const bar = `${((step + 1) / STEPS.length) * 100}%`;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) close(null); }}
      style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
    >
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:480, overflow:"hidden", boxShadow:"0 24px 80px rgba(26,39,68,0.25)" }}>
        <div style={{ height:4, background:"#f0efe9" }}>
          <div style={{ height:"100%", borderRadius:4, background:"linear-gradient(90deg,#1a2744,#5b4fcf)", width:bar, transition:"width .4s" }} />
        </div>
        <div style={{ padding:"32px 32px 28px" }}>

          {step === 0 && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:52, marginBottom:16 }}>👋</div>
              <h1 style={{ fontSize:22, fontWeight:900, color:"#1a2744", marginBottom:6 }}>온리에 오신 걸 환영합니다</h1>
              <p style={{ fontSize:13, fontWeight:600, color:"#5b4fcf", marginBottom:14 }}>내 임대 물건, 온리 하나로</p>
              <p style={{ fontSize:13, color:"#6a6a7a", lineHeight:1.7, marginBottom:24 }}>수금부터 계약·세금·내용증명까지<br/>임대 관리에 필요한 모든 것을 한 곳에서.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8, textAlign:"left" }}>
                {[
                  { icon:"💰", t:"월세 수금 자동 추적", d:"납부일마다 현황 자동 업데이트" },
                  { icon:"📅", t:"계약 만료 60일 전 알림", d:"공실 없이 갱신 협상 시작" },
                  { icon:"🧾", t:"세금 시뮬레이터", d:"예상 종합소득세 미리 파악" },
                  { icon:"📝", t:"내용증명 원클릭 발행", d:"변호사 없이 법적 서식 생성" },
                ].map(f => (
                  <div key={f.t} style={{ background:"#f8f7f4", borderRadius:12, padding:"12px 14px" }}>
                    <span style={{ fontSize:20, display:"block", marginBottom:5 }}>{f.icon}</span>
                    <p style={{ fontSize:12, fontWeight:700, color:"#1a2744", marginBottom:2 }}>{f.t}</p>
                    <p style={{ fontSize:10, color:"#8a8a9a", lineHeight:1.4 }}>{f.d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ fontSize:44, marginBottom:12, textAlign:"center" }}>🏠</div>
              <h2 style={{ fontSize:20, fontWeight:900, color:"#1a2744", marginBottom:5, textAlign:"center" }}>첫 물건을 등록해보세요</h2>
              <p style={{ fontSize:13, color:"#8a8a9a", marginBottom:20, textAlign:"center" }}>2분이면 충분합니다</p>
              <p style={{ fontSize:11, fontWeight:700, color:"#8a8a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>어떤 물건을 관리하시나요?</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:18 }}>
                {[{ type:"주거", icon:"🏠", desc:"아파트·빌라" }, { type:"상가", icon:"🏪", desc:"1층 상가" }, { type:"토지", icon:"🌱", desc:"나대지·농지" }].map(item => (
                  <button key={item.type} onClick={() => setPType(item.type)}
                    style={{ padding:"12px 8px", borderRadius:12, cursor:"pointer", textAlign:"center", border:`2px solid ${pType===item.type?"#1a2744":"#ebe9e3"}`, background:pType===item.type?"rgba(26,39,68,0.05)":"transparent" }}>
                    <div style={{ fontSize:22, marginBottom:5 }}>{item.icon}</div>
                    <p style={{ fontSize:12, fontWeight:700, color:"#1a2744", marginBottom:2 }}>{item.type}</p>
                    <p style={{ fontSize:10, color:"#8a8a9a" }}>{item.desc}</p>
                  </button>
                ))}
              </div>
              <div style={{ background:"#f8f7f4", borderRadius:12, padding:"12px 14px" }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#1a2744", marginBottom:8 }}>등록 시 필요한 정보</p>
                {["📍 주소 (도로명 검색 지원)", "👤 세입자 이름 + 연락처", "💰 월세·보증금·계약 기간"].map(item => (
                  <div key={item} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <div style={{ width:15, height:15, borderRadius:4, background:"#0fa573", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ color:"#fff", fontSize:9 }}>✓</span>
                    </div>
                    <span style={{ fontSize:12, color:"#6a6a7a" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize:44, marginBottom:12, textAlign:"center" }}>⚡</div>
              <h2 style={{ fontSize:20, fontWeight:900, color:"#1a2744", marginBottom:5, textAlign:"center" }}>임대 관리를 한 단계 업그레이드</h2>
              <p style={{ fontSize:13, color:"#8a8a9a", marginBottom:20, textAlign:"center" }}>온리만의 스마트 도구들</p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { icon:"🏢", t:"건물 단위 관리 + 엑셀 일괄 등록", d:"여러 호실 한 번에 등록·건물별 수익 집계" },
                  { icon:"🚪", t:"공실 단계별 액션플랜", d:"D+일수에 따라 5단계 해소 전략 자동 제안" },
                  { icon:"🗺️", t:"주변 매물 실거래 비교", d:"국토부 최근 3개월 · 내 월세 vs 지역 평균" },
                  { icon:"💬", t:"임대인 커뮤니티", d:"질문·답변 · 인기 글 · 실시간 활동 알림" },
                  { icon:"🤖", t:"AI 적정 임대료 분석", d:"국토부 실거래 기반 · PRO 무제한 · 플러스 월 10회" },
                ].map(f => (
                  <div key={f.t} style={{ display:"flex", gap:12, padding:"10px 12px", background:"#f8f7f4", borderRadius:11 }}>
                    <span style={{ fontSize:22, flexShrink:0 }}>{f.icon}</span>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:"#1a2744", margin:0 }}>{f.t}</p>
                      <p style={{ fontSize:11, color:"#8a8a9a", lineHeight:1.5, marginTop:2 }}>{f.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontSize:22, fontWeight:900, color:"#1a2744", marginBottom:6 }}>준비 완료!</h2>
              <p style={{ fontSize:13, fontWeight:600, color:"#5b4fcf", marginBottom:14 }}>이제 관리를 시작하세요</p>
              <p style={{ fontSize:13, color:"#6a6a7a", lineHeight:1.7, marginBottom:20 }}>세입자를 연결하고 수금 현황을 추적하면<br/>미납 알림과 계약 만료 알림을 자동으로 받을 수 있어요.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8, textAlign:"left" }}>
                {[
                  { icon:"👤", label:"세입자 연결하기", desc:"수금·계약 추적 시작", color:"#5b4fcf", path:"/dashboard/tenants" },
                  { icon:"💰", label:"수금 현황 확인", desc:"이번 달 납부 상태", color:"#0fa573", path:"/dashboard/payments" },
                  { icon:"🧾", label:"세금 미리 계산", desc:"종합소득세 추정", color:"#e8960a", path:"/dashboard/tax" },
                ].map(item => (
                  <button key={item.path} onClick={() => close(item.path)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, border:`1px solid ${item.color}25`, background:item.color+"08", cursor:"pointer", width:"100%" }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
                    <div style={{ textAlign:"left" }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#1a2744", margin:0 }}>{item.label}</p>
                      <p style={{ fontSize:11, color:"#8a8a9a", margin:0 }}>{item.desc}</p>
                    </div>
                    <span style={{ marginLeft:"auto", fontSize:12, color:item.color, fontWeight:700 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={ctaClick}
            style={{ width:"100%", padding:"14px", borderRadius:14, marginTop:20, background:"linear-gradient(135deg,#1a2744,#2d4270)", border:"none", color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer" }}>
            {STEPS[step].cta}
          </button>

          {STEPS[step].skip && (
            <button onClick={last}
              style={{ width:"100%", padding:"10px", marginTop:8, borderRadius:10, background:"transparent", border:"none", color:"#8a8a9a", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              나중에 등록하기
            </button>
          )}

          <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:14 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width:i===step?20:6, height:6, borderRadius:3, background:i===step?"#1a2744":"#e0ddd8", transition:"all .3s" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
