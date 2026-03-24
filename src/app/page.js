"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { C, PLANS } from "../lib/constants";

export default function LandingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("plus");

  const features = [
    { icon: "? ", title: "ì£¼ê±°Â·?ê? ?µí•© ê´€ë¦?, desc: "?„íŒŒ?¸Â·ë¹Œ?¼Â·ì˜¤?¼ìŠ¤?”Â·ìƒê°€Â·? ì? ??ëª¨ë“  ?„ë? ? í˜•?????Œë«?¼ì—??ê´€ë¦¬í•©?ˆë‹¤." },
    { icon: "?’°", title: "?„ë?ë£??˜ê¸ˆ ?ë™??,  desc: "?”ì„¸Â·ë³´ì¦ê¸??˜ê¸ˆ ?„í™©???ë™ ì¶”ì ?˜ê³  ë¯¸ë‚© ì¦‰ì‹œ ?Œë¦¼. ?„ë?ë£?ê´€ë¦¬ê? ?¬ì›Œì§‘ë‹ˆ??" },
    { icon: "?“Š", title: "?„ë? ?˜ìµë¥?ë¶„ì„",    desc: "ë¬¼ê±´ë³????˜ìµë¥??ë™ ê³„ì‚°, ?”ë³„ ?˜ìµ ì°¨íŠ¸. ?„ë? ?ì‚° ?˜ìµ ?„í™©???œëˆˆ???Œì•…?©ë‹ˆ??" },
    { icon: "?“", title: "ê³„ì•½?œÂ·ë‚´?©ì¦ëª?,     desc: "?„ë?ì°?ê³„ì•½??ê´€ë¦¬ë???ë²•ì  ?¨ë ¥???´ìš©ì¦ëª… PDF ë°œí–‰ê¹Œì? ?ìŠ¤?±ìœ¼ë¡?ì²˜ë¦¬?©ë‹ˆ??" },
    { icon: "?§¾", title: "?¸ê¸ˆ ? ê³  ?œë??ˆì´??, desc: "?„ë??Œë“ ì¢…í•©?Œë“?¸Â·ë?ê°€?¸ë? ?ë™ ì¶”ì •?©ë‹ˆ?? ?„ë??¬ì—…???¸ê¸ˆ ? ê³ ???„ì????©ë‹ˆ??" },
    { icon: "?¤–", title: "AI ?…ì?Â·?„ë?ë£?ë¶„ì„", desc: "êµ?† ë¶€ ?¤ê±°?˜ê? ê¸°ë°˜?¼ë¡œ ì§€???ì • ?„ë?ë£Œì? ?…ì?ë¥?AIê°€ ë¶„ì„?©ë‹ˆ??" },
  ];

  return (
    <div className="grid-bg" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "40px 20px 0",
      position: "relative", overflow: "hidden",
      fontFamily: "'Pretendard','DM Sans',sans-serif",
      background: "#f5f4f0"
    }}>

      {/* ë°°ê²½ ?¥ì‹ */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,39,68,0.05), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,79,207,0.04), transparent 70%)", pointerEvents: "none" }} />

      {/* ?ˆì–´ë¡??¹ì…˜ */}
      <div style={{ textAlign: "center", maxWidth: 700, position: "relative", zIndex: 1, paddingTop: 40 }}>
        {/* ë¡œê³  */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: "linear-gradient(145deg, #1a2744, #2d4270)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 24px rgba(26,39,68,0.3)"
          }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
              <rect x="7.5" y="12" width="5" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
            </svg>
          </div>
          <div>
            <span style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.5px" }}>?¨ë¦¬</span>
            <span style={{ fontSize: 11, color: "#a0a0b0", fontWeight: 500, marginLeft: 6, letterSpacing: "0.5px" }}>Ownly</span>
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          <span className="gradient-text">???„ë? ë¬¼ê±´,</span><br />
          <span style={{ color: "#1a2744" }}>?¨ë¦¬ ?˜ë‚˜ë¡?</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          ?˜ê¸ˆë¶€??ê³„ì•½Â·?¸ê¸ˆÂ·?´ìš©ì¦ëª…ê¹Œì?. ?„ë? ê´€ë¦¬ì— ?„ìš”??ëª¨ë“  ê²? ?˜ë‚˜???±ì—??
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary"
            style={{
              padding: "15px 44px", borderRadius: 14,
              background: "linear-gradient(135deg, #1a2744, #2d4270)",
              border: "none", color: "#fff", fontWeight: 800, fontSize: 16,
              cursor: "pointer", boxShadow: "0 8px 32px rgba(26,39,68,0.3)"
            }}
          >ë¬´ë£Œë¡??œì‘?˜ê¸°</button>
          <button
            onClick={() => router.push("/login")}
            style={{
              padding: "15px 28px", borderRadius: 14,
              background: "#ffffff", border: "1.5px solid #e8e6e0",
              color: "#6a6a7a", fontWeight: 600, fontSize: 15, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(26,39,68,0.06)"
            }}
          >ë¡œê·¸??/button>
        </div>
        <div style={{ marginTop: 16 }}>
          <Link href="/features" style={{ fontSize: 13, color: "#8a8a9a", textDecoration: "none", borderBottom: "1px solid #d0cfc8", paddingBottom: 1 }}>
            ëª¨ë“  ê¸°ëŠ¥ ?´í´ë³´ê¸° ??
          </Link>
        </div>
      </div>

      {/* ê¸°ëŠ¥ ì¹´ë“œ */}
      <style>{`@media(max-width:640px){.features-grid{grid-template-columns:1fr 1fr!important}}`}</style>
      <div className="stagger features-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)",
        gap: 14, maxWidth: 960, width: "100%", marginTop: 56, position: "relative", zIndex: 1, marginLeft: "auto", marginRight: "auto"
      }}>
        {features.map((f) => (
          <div key={f.title} className="hover-lift" style={{
            background: "#ffffff", border: "1px solid #ebe9e3",
            borderRadius: 16, padding: "22px 20px",
            boxShadow: "0 2px 10px rgba(26,39,68,0.05)"
          }}>
            <span style={{ fontSize: 26, marginBottom: 10, display: "block" }}>{f.icon}</span>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", marginBottom: 5 }}>{f.title}</h2>
            <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ?€?€?€ êµ¬ë… ?Œëœ ?¹ì…˜ ?€?€?€ */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 80, position: "relative", zIndex: 1, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, opacity: 0.5 }}>PRICING</p>
          <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 900, color: "#1a2744", margin: 0 }}>?˜ì—ê²?ë§ëŠ” ?Œëœ ? íƒ</h2>
          <p style={{ color: "#8a8a9a", fontSize: 14, marginTop: 8 }}>ëª¨ë“  ?Œëœ?€ ?¸ì œ? ì? ë³€ê²½Â·ì·¨??ê°€?¥í•©?ˆë‹¤</p>

          {/* ?”ê°„ / ?°ê°„ ? ê? */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 20, background: "#f5f4f0", borderRadius: 40, padding: "5px 6px" }}>
            <button onClick={() => setIsAnnual(false)}
              style={{ padding: "7px 20px", borderRadius: 30, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s",
                background: !isAnnual ? "#fff" : "transparent",
                color: !isAnnual ? "#1a2744" : "#8a8a9a",
                boxShadow: !isAnnual ? "0 2px 8px rgba(26,39,68,0.1)" : "none" }}>
              ?”ê°„ ê²°ì œ
            </button>
            <button onClick={() => setIsAnnual(true)}
              style={{ padding: "7px 20px", borderRadius: 30, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s", display: "flex", alignItems: "center", gap: 6,
                background: isAnnual ? "#1a2744" : "transparent",
                color: isAnnual ? "#fff" : "#8a8a9a",
                boxShadow: isAnnual ? "0 2px 8px rgba(26,39,68,0.2)" : "none" }}>
              ?°ê°„ ê²°ì œ
              <span style={{ fontSize: 10, fontWeight: 800, background: isAnnual ? "rgba(255,255,255,0.2)" : "#0fa573", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>20% ? ì¸</span>
            </button>
          </div>
          {isAnnual && (
            <p style={{ fontSize: 12, color: "#0fa573", fontWeight: 600, marginTop: 8 }}>
              ?‰ ?°ê°„ ê²°ì œ ??2.4ê°œì›”ì¹?ë¬´ë£Œ ??12ê°œì›” ??ë²ˆì— ê²°ì œ
            </p>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, padding: "0 0 20px", alignItems: "start" }}>
          {Object.values(PLANS).map((plan) => {
            const isPlus = plan.id === "plus";
            const isPro         = plan.id === "pro";
            return (
              <div key={plan.id} style={{
                background: isPlus ? "linear-gradient(160deg, rgba(79,70,229,0.04), #ffffff)" : "#ffffff",
                border: `1.5px solid ${isPlus ? "rgba(79,70,229,0.25)" : isPro ? "rgba(201,146,10,0.25)" : "#ebe9e3"}`,
                borderRadius: 20, padding: "28px 24px 24px",
                position: "relative", display: "flex", flexDirection: "column",
                boxShadow: isPlus ? "0 8px 32px rgba(79,70,229,0.12)" : "0 2px 10px rgba(26,39,68,0.05)"
              }}>
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: isPlus ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "linear-gradient(135deg,#c9920a,#e8960a)",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap"
                  }}>{plan.badge}</div>
                )}

                {/* ?Œëœëª?& ê°€ê²?*/}
                <p style={{ fontSize: 13, fontWeight: 800, color: isPro ? "#c9920a" : isPlus ? "#4f46e5" : "#8a8a9a", marginBottom: 6, letterSpacing: "1px" }}>{plan.name.toUpperCase()}</p>
                {(() => {
                  const monthly  = plan.price;
                  const annual   = Math.round(monthly * 0.8);
                  const showPrice = isAnnual && monthly > 0 ? annual : monthly;
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "0 0 4px" }}>
                        <p style={{ fontSize: monthly === 0 ? 32 : 28, fontWeight: 900, color: "#1a2744", margin: 0 }}>
                          {monthly === 0 ? "ë¬´ë£Œ" : `??{showPrice.toLocaleString()}`}
                        </p>
                        {isAnnual && monthly > 0 && (
                          <span style={{ fontSize: 13, color: "#8a8a9a", textDecoration: "line-through" }}>??monthly.toLocaleString()}</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 20 }}>
                        {monthly === 0 ? "?êµ¬ ë¬´ë£Œ" : isAnnual ? `????{(annual*12).toLocaleString()} Â· VAT ?¬í•¨` : "??êµ¬ë… Â· VAT ?¬í•¨"}
                      </p>
                    </>
                  );
                })()}

                {/* ê¸°ëŠ¥ ëª©ë¡ ??flex: 1 ë¡??˜ì—¬??ë²„íŠ¼????ƒ ?˜ë‹¨??*/}
                <div style={{ marginBottom: 24, flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start", opacity: f.ok ? 1 : 0.35 }}>
                      <span style={{ color: f.ok ? "#0fa573" : "#8a8a9a", fontSize: 13, marginTop: 1, flexShrink: 0 }}>{f.ok ? "?? : "??}</span>
                      <span style={{ fontSize: 13, color: f.ok ? "#1a2744" : "#8a8a9a" }}>{f.t}</span>
                    </div>
                  ))}
                </div>

                {/* CTA ë²„íŠ¼ ??marginTop: auto ë¡???ƒ ?˜ë‹¨ ?•ë ¬ */}
                <button
                  onClick={() => router.push("/login")}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 12, border: "none",
                    cursor: "pointer", fontWeight: 800, fontSize: 14, marginTop: "auto",
                    background: isPlus
                      ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                      : isPro
                        ? "linear-gradient(135deg, #c9920a, #e8960a)"
                        : "#f0efe9",
                    color: plan.price === 0 ? "#6a6a7a" : "#fff",
                    boxShadow: isPlus ? "0 4px 16px rgba(79,70,229,0.25)" : isPro ? "0 4px 16px rgba(201,146,10,0.25)" : "none",
                  }}
                >
                  {plan.price === 0 ? "ë¬´ë£Œë¡??œì‘" : "êµ¬ë… ?œì‘?˜ê¸°"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ?€?€?€ ?„ë???ì»¤ë??ˆí‹° ?€?€?€ */}
      <div style={{ width: "100%", background: "#ffffff", padding: "60px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>COMMUNITY</p>
              <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, color: "#1a2744", lineHeight: 1.2 }}>?„ë??¸ë“¤???¤ì œ ?´ì•¼ê¸?/h2>
              <p style={{ fontSize: 15, color: "#8a8a9a", marginTop: 8 }}>?¨ë¦¬ë¥??¬ìš©?˜ëŠ” ?„ë??¸ë“¤???˜ëˆ„??ê²½í—˜ê³??¸í•˜??/p>
            </div>
            <a href="/login" style={{ fontSize: 13, fontWeight: 700, color: "#5b4fcf", textDecoration: "none", background: "rgba(91,79,207,0.08)", padding: "9px 18px", borderRadius: 10, flexShrink: 0 }}>ë¬´ë£Œë¡??œì‘?˜ê¸° ??/a>
          </div>

          {/* ì»¤ë??ˆí‹° ?¼ë“œ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, alignItems: "flex-start" }}>
            {[
              { avatar: "?¢", name: "?œìš¸ ê°•ë‚¨ ?„ë???, time: "ë°©ê¸ˆ ??, tag: "?˜ê¸ˆ ê´€ë¦?, content: "?”ì„¸ ë¯¸ë‚© ?Œë¦¼??ë°”ë¡œ ?€???¸ì…?í•œ??ë¬¸ì ë³´ë‚´?ˆê¹Œ ?¤ìŒ??ë°”ë¡œ ?…ê¸ˆ?ì–´?? ?ˆì „???˜ê¸°ë¡?ì²´í¬?˜ë‹¤ ê¹Œë¨¹?ˆëŠ”???´ì œ ?„ì „ ?¸í•´ì¡ŒìŠµ?ˆë‹¤ ?‘", likes: 24 },
              { avatar: "? ", name: "?¸ì²œ ?¤ì„¸?€ 2ì±??´ì˜", time: "1?œê°„ ??, tag: "?¸ê¸ˆ ?œë?", content: "ì¢…í•©?Œë“??? ê³  ?„ì— ?¸ê¸ˆ ?œë??ˆì´???Œë ¤ë´¤ëŠ”???¸ë¬´??ê²¬ì ?´ë‘ ê±°ì˜ ë¹„ìŠ·?˜ê²Œ ?˜ì™”?´ìš”. ?¬ì „??ì¤€ë¹„í•  ???ˆì–´???ˆë¬´ ì¢‹ìŠµ?ˆë‹¤", likes: 18 },
              { avatar: "?ª", name: "ë¶€???ê? ?„ë?", time: "3?œê°„ ??, tag: "?´ìš©ì¦ëª…", content: "?´ê±° ?”ì²­ ?´ìš©ì¦ëª…???±ì—??ë°”ë¡œ ë½‘ì•„???±ê¸°ë¡?ë³´ëƒˆ?´ìš”. ë³€?¸ì‚¬ ?µí•˜ë©?50ë§Œì›?¸ë° ì§ì ‘ ?˜ë‹ˆê¹????°í¸ë£Œë§Œ ?¤ì—ˆ?µë‹ˆ???’ª", likes: 31 },
              { avatar: "?—ï¸?, name: "ê²½ê¸° ë¹Œë¼ 3ì±?, time: "?´ì œ", tag: "ê³„ì•½ ê´€ë¦?, content: "ê³„ì•½ ë§Œë£Œ??90???„ë????Œë¦¼???¤ë‹ˆê¹?ë¯¸ë¦¬ë¯¸ë¦¬ ?¸ì…?í•œ???°ë½?????ˆì–´?? ê³µì‹¤ ?†ì´ ê³„ì† ? ì? ì¤‘ì…?ˆë‹¤!", likes: 15 },
              { avatar: "?Œ±", name: "ì¶©ë‚¨ ? ì? ?„ë?", time: "?´í? ??, tag: "? ì? ê´€ë¦?, content: "? ì? ?„ë???ê´€ë¦?ê°€?¥í•´??ì¢‹ì•„?? ?ì? ?„ë?ë£??˜ê¸ˆ ?´ì—­???”ë³„ë¡??•ë¦¬?????ˆê³ , ?¸ê¸ˆ ê³„ì‚°???°ë¡œ ?˜ì????¸í•˜?¤ìš”", likes: 9 },
              { avatar: "?’¼", name: "?œìš¸ ?¤í”¼?¤í…” 5ì±?, time: "3????, tag: "ë¦¬í¬??, content: "?°ë§???¸ë¬´? ê³  ?ë£Œ ì¤€ë¹„í•  ??ë¦¬í¬??ë½‘ìœ¼?ˆê¹Œ 1?„ì¹˜ ?˜ì…Â·ì§€ì¶œì´ ?œëˆˆ??ë³´ì—¬?? ?¸ë¬´???ë‹´ ?œê°„???ˆë°˜?¼ë¡œ ì¤„ì—ˆ?´ìš”", likes: 27 },
            ].map((post, i) => (
              <div key={i} style={{ background: "#f8f7f4", borderRadius: 16, padding: "18px 20px", border: "1px solid #ebe9e3" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{post.avatar}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{post.name}</p>
                      <p style={{ fontSize: 11, color: "#a0a0b0" }}>{post.time}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#5b4fcf", background: "rgba(91,79,207,0.1)", padding: "3px 9px", borderRadius: 6 }}>{post.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: "#3a3a4e", lineHeight: 1.7, marginBottom: 14 }}>{post.content}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>?¤ï¸</span>
                  <span style={{ fontSize: 12, color: "#a0a0b0", fontWeight: 600 }}>{post.likes}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 32, textAlign: "center", padding: "32px", background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(91,79,207,0.04))", borderRadius: 20, border: "1px solid rgba(91,79,207,0.1)" }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>ì§€ê¸?ë°”ë¡œ ?œì‘?´ë³´?¸ìš”</p>
            <p style={{ fontSize: 14, color: "#8a8a9a", marginBottom: 20 }}>ë¬´ë£Œ ?Œëœ?¼ë¡œ ?œì‘, ?¸ì œ???…ê·¸?ˆì´??ê°€??/p>
            <a href="/login" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>ë¬´ë£Œë¡??¨ë¦¬ ?œì‘?˜ê¸° ??/a>
          </div>
        </div>
      </div>

      {/* ?€?€?€ B2B ë¬¸ì˜ ?¹ì…˜ ?€?€?€ */}
      <div style={{ width: "100%", background: "#1a2744", padding: "48px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>ENTERPRISE</p>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: "-.3px" }}>
              ë²•ì¸Â·ê³µì¸ì¤‘ê°œ??·ì?°ê?ë¦¬ì‚¬ ?€??ë³„ë„ ë¬¸ì˜
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              ?¤ìˆ˜ ë¬¼ê±´ ë³´ìœ  ë²•ì¸ Â· ê³µì¸ì¤‘ê°œ???¬ë¬´??Â· ?ì‚°ê´€ë¦¬íšŒ??br/>
              ?¸ê¸ˆê³„ì‚°??ë°œí–‰ Â· ?°ê°„ ê³„ì•½ Â· ?€ ê³„ì • ?‘ì˜ ê°€??
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <a href="mailto:inquiry@mclean21.com?subject=?¨ë¦¬ ê¸°ì—… êµ¬ë… ë¬¸ì˜"
              style={{ padding: "14px 28px", borderRadius: 12, background: "#fff", color: "#1a2744", fontWeight: 800, fontSize: 14, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap" }}>
              ?ì—…?€??ë¬¸ì˜?˜ê¸° ??
            </a>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>inquiry@mclean21.com</p>
          </div>
        </div>
      </div>

      {/* ?€?€?€ ë²•ì  ?¸í„° ?€?€?€ */}
      <footer style={{
        width: "100%", borderTop: "1px solid #e8e6e0",
        marginTop: 60, padding: "40px 20px 80px",
        position: "relative", zIndex: 1
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* ?¸í„° ?ë‹¨ ??ë¡œê³  + ë§í¬ ê·¸ë¦¬??*/}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
            {/* ë¡œê³  + ?¤ëª… */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #1a2744, #2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.9"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 16, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.3px" }}>?¨ë¦¬</span>
              </div>
              <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7, maxWidth: 200 }}>???„ë? ë¬¼ê±´, ?¨ë¦¬ ?˜ë‚˜ë¡?<br/>?˜ê¸ˆÂ·ê³„ì•½Â·?¸ê¸ˆÂ·?´ìš©ì¦ëª…</p>
            </div>

            {/* ë§í¬ ê·¸ë£¹??*/}
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>?œë¹„??/p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/features" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ê¸°ëŠ¥ ?Œê°œ
                  </Link>
                  <Link href="/login" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ë¬´ë£Œ ?œì‘?˜ê¸°
                  </Link>
                  <Link href="/dashboard/pricing" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ?”ê¸ˆ??
                  </Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>ì§€??/p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/legal/faq" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ?ì£¼ ë¬»ëŠ” ì§ˆë¬¸
                  </Link>
                  <Link href="/legal/notice" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ê³µì??¬í•­
                  </Link>
                  <a href="mailto:inquiry@mclean21.com" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ë¬¸ì˜?˜ê¸°
                  </a>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>ë²•ì </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/legal/terms" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ?œë¹„???´ìš©?½ê?
                  </Link>
                  <Link href="/legal/privacy" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ê°œì¸?•ë³´ì²˜ë¦¬ë°©ì¹¨
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ?¸í„° ?˜ë‹¨ ???¬ì—…???•ë³´ */}
          <div style={{ borderTop: "1px solid #ebe9e3", paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.9, display: "flex", flexWrap: "wrap", gap: "0 20px" }}>
              <span>?í˜¸ëª? (ì£?ë§¥í´ë¦?/span>
              <span>?€?? ê¹€?±ë?</span>
              <span>?¬ì—…?ë“±ë¡ë²ˆ?? 137-81-52231</span>
              <span>?µì‹ ?ë§¤?…ì‹ ê³? ??000-?œìš¸00-0000??/span>
              <span>?´ë©”?? inquiry@mclean21.com</span>
            </div>
            <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 8 }}>Â© 2025 McLean Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ?€?€?€ ?˜ë‹¨ ê³ ì • ê²°ì œ ë°??€?€?€ */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #e8e6e0", padding: "12px 20px", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select onChange={(e) => setSelectedPlan(e.target.value)} value={selectedPlan}
            style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid #e8e6e0", fontSize: 13, fontWeight: 600, color: "#1a2744", background: "#fff", cursor: "pointer" }}>
            {Object.values(PLANS).filter(p => p.price > 0).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => setIsAnnual(!isAnnual)}
            style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #e8e6e0", fontSize: 13, fontWeight: 600, cursor: "pointer", background: isAnnual ? "#1a2744" : "#fff", color: isAnnual ? "#fff" : "#1a2744", whiteSpace: "nowrap" }}>
            {isAnnual ? "?°ê°„ (20% ? ì¸)" : "?”ê°„"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {(() => {
            const plan = Object.values(PLANS).find(p => p.id === selectedPlan) || Object.values(PLANS)[1];
            const monthly = plan?.price || 0;
            const price = isAnnual ? Math.round(monthly * 0.8) : monthly;
            return (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#1a2744", lineHeight: 1.1 }}>
                  ??price.toLocaleString()}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#8a8a9a" }}> / ??/span>
                  {isAnnual && <span style={{ fontSize: 10, fontWeight: 800, color: "#0fa573", marginLeft: 4 }}>-20%</span>}
                </p>
                <p style={{ fontSize: 10, color: "#8a8a9a" }}>{isAnnual ? `????{(price * 12).toLocaleString()} Â· VAT ?¬í•¨` : "VAT ?¬í•¨"}</p>
              </div>
            );
          })()}
          <button onClick={() => router.push("/login")}
            style={{ padding: "10px 24px", borderRadius: 11, background: "linear-gradient(135deg, #1a2744, #2d4270)", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(26,39,68,0.25)" }}>
            êµ¬ë… ?œì‘?˜ê¸°
          </button>
        </div>
      </div>
    </div>
  );
}
