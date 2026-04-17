"use client";
import { useState } from "react";

const STEPS = [
  { id: "welcome", emoji: "?몝", title: "?⑤━???ㅼ떊 嫄??섏쁺?⑸땲??, subtitle: "???꾨? 臾쇨굔, ?⑤━ ?섎굹濡?, desc: "?섍툑遺??怨꾩빟쨌?멸툑쨌?댁슜利앸챸源뚯?\n?꾨? 愿由ъ뿉 ?꾩슂??紐⑤뱺 寃껋쓣 ??怨녹뿉??", cta: "?쒖옉?섍린", skip: false },
  { id: "register", emoji: "?룧", title: "泥?臾쇨굔???깅줉?대낫?몄슂", subtitle: "2遺꾩씠硫?異⑸텇?⑸땲??, cta: "臾쇨굔 ?깅줉?섍린", skip: true },
  { id: "done", emoji: "?럦", title: "以鍮??꾨즺!", subtitle: "?댁젣 愿由щ? ?쒖옉?섏꽭??, desc: "?몄엯?먮? ?곌껐?섍퀬 ?섍툑 ?꾪솴??異붿쟻?섎㈃\n誘몃궔 ?뚮┝怨?怨꾩빟 留뚮즺 ?뚮┝???먮룞?쇰줈 諛쏆쓣 ???덉뼱??", cta: "??쒕낫?쒕줈 ?대룞", skip: false },
];

const QUICK_FEATURES = [
  { icon: "?뮥", title: "?붿꽭 ?섍툑 ?먮룞 異붿쟻", desc: "?⑸??쇰쭏???꾪솴 ?먮룞 ?낅뜲?댄듃" },
  { icon: "?뱟", title: "怨꾩빟 留뚮즺 60?????뚮┝", desc: "怨듭떎 ?놁씠 媛깆떊 ?묒긽 ?쒖옉" },
  { icon: "?㎨", title: "?멸툑 ?쒕??덉씠??, desc: "?덉긽 醫낇빀?뚮뱷??誘몃━ ?뚯븙" },
  { icon: "?뱷", title: "?댁슜利앸챸 ?먰겢由?諛쒗뻾", desc: "蹂?몄궗 ?놁씠 踰뺤쟻 ?쒖떇 ?앹꽦" },
];

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [propertyType, setPropertyType] = useState("二쇨굅");
  const current = STEPS[step];

  const handleClose = (path) => {
    try { localStorage.setItem("ownly_onboarding_done", "1"); } catch {}
    if (typeof onClose === "function") onClose();
    if (path) setTimeout(() => { window.location.href = path; }, 100);
  };

  const goNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const goLast = () => setStep(STEPS.length - 1);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(null); }}
    >
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 480, overflow: "hidden", boxShadow: "0 24px 80px rgba(26,39,68,0.25)" }}>
        <div style={{ height: 4, background: "#f0efe9" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#1a2744,#5b4fcf)", width: `${((step + 1) / STEPS.length) * 100}%`, transition: "width .4s" }} />
        </div>
        <div style={{ padding: "32px 32px 28px" }}>
          {step === 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{current.emoji}</div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", marginBottom: 6 }}>{current.title}</h1>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#5b4fcf", marginBottom: 14 }}>{current.subtitle}</p>
              <p style={{ fontSize: 13, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 24, whiteSpace: "pre-line" }}>{current.desc}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8, textAlign: "left" }}>
                {QUICK_FEATURES.map(f => (
                  <div key={f.title} style={{ background: "#f8f7f4", borderRadius: 12, padding: "12px 14px" }}>
                    <span style={{ fontSize: 20, display: "block", marginBottom: 5 }}>{f.icon}</span>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", marginBottom: 2 }}>{f.title}</p>
                    <p style={{ fontSize: 10, color: "#8a8a9a", lineHeight: 1.4 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 44, marginBottom: 12, textAlign: "center" }}>{current.emoji}</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1a2744", marginBottom: 5, textAlign: "center" }}>{current.title}</h2>
              <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 20, textAlign: "center" }}>{current.subtitle}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>?대뼡 臾쇨굔??愿由ы븯?쒕굹??</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }}>
                {[{ type: "二쇨굅", icon: "?룧", desc: "?꾪뙆?맞룸퉴?? }, { type: "?곴?", icon: "?룵", desc: "1痢??곴?쨌?ㅽ뵾?? }, { type: "?좎?", icon: "?뙮", desc: "?섎?吏쨌?띿?" }].map(item => (
                  <button key={item.type} onClick={() => setPropertyType(item.type)} style={{ padding: "12px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", border: `2px solid ${propertyType === item.type ? "#1a2744" : "#ebe9e3"}`, background: propertyType === item.type ? "rgba(26,39,68,0.05)" : "transparent" }}>
                    <div style={{ fontSize: 22, marginBottom: 5 }}>{item.icon}</div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", marginBottom: 2 }}>{item.type}</p>
                    <p style={{ fontSize: 10, color: "#8a8a9a" }}>{item.desc}</p>
                  </button>
                ))}
              </div>
              <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#1a2744", marginBottom: 8 }}>?깅줉 ???꾩슂???뺣낫</p>
                {["?뱧 二쇱냼 (?꾨줈紐?寃??吏??", "?뫀 ?몄엯???대쫫 + ?곕씫泥?, "?뮥 ?붿꽭쨌蹂댁쬆湲댟룰퀎??湲곌컙"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 15, height: 15, borderRadius: 4, background: "#0fa573", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#fff", fontSize: 9 }}>??/span>
                    </div>
                    <span style={{ fontSize: 12, color: "#6a6a7a" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{current.emoji}</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", marginBottom: 6 }}>{current.title}</h2>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#5b4fcf", marginBottom: 14 }}>{current.subtitle}</p>
              <p style={{ fontSize: 13, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 20, whiteSpace: "pre-line" }}>{current.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                {[
                  { icon: "?뫀", label: "?몄엯???곌껐?섍린", desc: "?섍툑쨌怨꾩빟 異붿쟻 ?쒖옉", color: "#5b4fcf", path: "/dashboard/tenants" },
                  { icon: "?뮥", label: "?섍툑 ?꾪솴 ?뺤씤", desc: "?대쾲 ???⑸? ?곹깭", color: "#0fa573", path: "/dashboard/payments" },
                  { icon: "?㎨", label: "?멸툑 誘몃━ 怨꾩궛", desc: "醫낇빀?뚮뱷??異붿젙", color: "#e8960a", path: "/dashboard/tax" },
                ].map(item => (
                  <button key={item.path} onClick={() => handleClose(item.path)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${item.color}25`, background: item.color + "08", cursor: "pointer", width: "100%" }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: "#8a8a9a", margin: 0 }}>{item.desc}</p>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: item.color, fontWeight: 700 }}>??/span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => {
              if (step === 0) { goNext(); return; }
              if (step === 1) { handleClose("/dashboard/properties"); return; }
              if (step === 2) { handleClose(null); return; }
            }}
            style={{ width: "100%", padding: "14px", borderRadius: 14, marginTop: 20, background: "linear-gradient(135deg,#1a2744,#2d4270)", border: "none", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}
          >
            {current.cta}
          </button>
          {current.skip && (
            <button onClick={goLast} style={{ width: "100%", padding: "10px", marginTop: 8, borderRadius: 10, background: "transparent", border: "none", color: "#8a8a9a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ?섏쨷???깅줉?섍린
            </button>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#1a2744" : "#e0ddd8", transition: "all .3s" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}