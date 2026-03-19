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
    { icon: "?룧", title: "二쇨굅쨌?곴? ?듯빀 愿由?, desc: "?꾪뙆?맞룸퉴?셋룹삤?쇱뒪?붋룹긽媛쨌?좎? ??紐⑤뱺 ?꾨? ?좏삎?????뚮옯?쇱뿉??愿由ы빀?덈떎." },
    { icon: "?뮥", title: "?꾨?猷??섍툑 ?먮룞??,  desc: "?붿꽭쨌蹂댁쬆湲??섍툑 ?꾪솴???먮룞 異붿쟻?섍퀬 誘몃궔 利됱떆 ?뚮┝. ?꾨?猷?愿由ш? ?ъ썙吏묐땲??" },
    { icon: "?뱤", title: "?꾨? ?섏씡瑜?遺꾩꽍",    desc: "臾쇨굔蹂????섏씡瑜??먮룞 怨꾩궛, ?붾퀎 ?섏씡 李⑦듃. ?꾨? ?먯궛 ?섏씡 ?꾪솴???쒕늿???뚯븙?⑸땲??" },
    { icon: "?뱷", title: "怨꾩빟?쑣룸궡?⑹쬆紐?,     desc: "?꾨?李?怨꾩빟??愿由щ???踰뺤쟻 ?⑤젰???댁슜利앸챸 PDF 諛쒗뻾源뚯? ?먯뒪?깆쑝濡?泥섎━?⑸땲??" },
    { icon: "?㎨", title: "?멸툑 ?좉퀬 ?쒕??덉씠??, desc: "?꾨??뚮뱷 醫낇빀?뚮뱷?맞룸?媛?몃? ?먮룞 異붿젙?⑸땲?? ?꾨??ъ뾽???멸툑 ?좉퀬???꾩????⑸땲??" },
    { icon: "?쨼", title: "AI ?낆?쨌?꾨?猷?遺꾩꽍", desc: "援?넗遺 ?ㅺ굅?섍? 湲곕컲?쇰줈 吏???곸젙 ?꾨?猷뚯? ?낆?瑜?AI媛 遺꾩꽍?⑸땲??" },
  ];

  return (
    <div className="grid-bg" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "40px 20px 0",
      position: "relative", overflow: "hidden",
      fontFamily: "'Pretendard','DM Sans',sans-serif",
      background: "#f5f4f0"
    }}>

      {/* 諛곌꼍 ?μ떇 */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,39,68,0.05), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,79,207,0.04), transparent 70%)", pointerEvents: "none" }} />

      {/* ?덉뼱濡??뱀뀡 */}
      <div style={{ textAlign: "center", maxWidth: 700, position: "relative", zIndex: 1, paddingTop: 40 }}>
        {/* 濡쒓퀬 */}
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
            <span style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.5px" }}>?⑤━</span>
            <span style={{ fontSize: 11, color: "#a0a0b0", fontWeight: 500, marginLeft: 6, letterSpacing: "0.5px" }}>Ownly</span>
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          <span className="gradient-text">???꾨? 臾쇨굔,</span><br />
          <span style={{ color: "#1a2744" }}>?⑤━ ?섎굹濡?</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          ?섍툑遺??怨꾩빟쨌?멸툑쨌?댁슜利앸챸源뚯?. ?꾨? 愿由ъ뿉 ?꾩슂??紐⑤뱺 寃? ?섎굹???깆뿉??
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
          >臾대즺濡??쒖옉?섍린</button>
          <button
            onClick={() => router.push("/login")}
            style={{
              padding: "15px 28px", borderRadius: 14,
              background: "#ffffff", border: "1.5px solid #e8e6e0",
              color: "#6a6a7a", fontWeight: 600, fontSize: 15, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(26,39,68,0.06)"
            }}
          >濡쒓렇??/button>
        </div>
        <div style={{ marginTop: 16 }}>
          <Link href="/features" style={{ fontSize: 13, color: "#8a8a9a", textDecoration: "none", borderBottom: "1px solid #d0cfc8", paddingBottom: 1 }}>
            紐⑤뱺 湲곕뒫 ?댄렣蹂닿린 ??          </Link>
        </div>
      </div>

      {/* 湲곕뒫 移대뱶 */}
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

      {/* ??? 援щ룆 ?뚮옖 ?뱀뀡 ??? */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 80, position: "relative", zIndex: 1, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, opacity: 0.5 }}>PRICING</p>
          <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 900, color: "#1a2744", margin: 0 }}>?섏뿉寃?留욌뒗 ?뚮옖 ?좏깮</h2>
          <p style={{ color: "#8a8a9a", fontSize: 14, marginTop: 8 }}>紐⑤뱺 ?뚮옖? ?몄젣?좎? 蹂寃승룹랬??媛?ν빀?덈떎</p>

          {/* ?붽컙 / ?곌컙 ?좉? */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 20, background: "#f5f4f0", borderRadius: 40, padding: "5px 6px" }}>
            <button onClick={() => setIsAnnual(false)}
              style={{ padding: "7px 20px", borderRadius: 30, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s",
                background: !isAnnual ? "#fff" : "transparent",
                color: !isAnnual ? "#1a2744" : "#8a8a9a",
                boxShadow: !isAnnual ? "0 2px 8px rgba(26,39,68,0.1)" : "none" }}>
              ?붽컙 寃곗젣
            </button>
            <button onClick={() => setIsAnnual(true)}
              style={{ padding: "7px 20px", borderRadius: 30, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s", display: "flex", alignItems: "center", gap: 6,
                background: isAnnual ? "#1a2744" : "transparent",
                color: isAnnual ? "#fff" : "#8a8a9a",
                boxShadow: isAnnual ? "0 2px 8px rgba(26,39,68,0.2)" : "none" }}>
              ?곌컙 寃곗젣
              <span style={{ fontSize: 10, fontWeight: 800, background: isAnnual ? "rgba(255,255,255,0.2)" : "#0fa573", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>20% ?좎씤</span>
            </button>
          </div>
          {isAnnual && (
            <p style={{ fontSize: 12, color: "#0fa573", fontWeight: 600, marginTop: 8 }}>
              ?럦 ?곌컙 寃곗젣 ??2.4媛쒖썡移?臾대즺 ??12媛쒖썡 ??踰덉뿉 寃곗젣
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

                {/* ?뚮옖紐?& 媛寃?*/}
                <p style={{ fontSize: 13, fontWeight: 800, color: isPro ? "#c9920a" : isPlus ? "#4f46e5" : "#8a8a9a", marginBottom: 6, letterSpacing: "1px" }}>{plan.name.toUpperCase()}</p>
                {(() => {
                  const monthly  = plan.price;
                  const annual   = Math.round(monthly * 0.8);
                  const showPrice = isAnnual && monthly > 0 ? annual : monthly;
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "0 0 4px" }}>
                        <p style={{ fontSize: monthly === 0 ? 32 : 28, fontWeight: 900, color: "#1a2744", margin: 0 }}>
                          {monthly === 0 ? "臾대즺" : `??{showPrice.toLocaleString()}`}
                        </p>
                        {isAnnual && monthly > 0 && (
                          <span style={{ fontSize: 13, color: "#8a8a9a", textDecoration: "line-through" }}>??monthly.toLocaleString()}</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 20 }}>
                        {monthly === 0 ? "?곴뎄 臾대즺" : isAnnual ? `????{(annual*12).toLocaleString()} 쨌 VAT ?ы븿` : "??援щ룆 쨌 VAT ?ы븿"}
                      </p>
                    </>
                  );
                })()}

                {/* 湲곕뒫 紐⑸줉 ??flex: 1 濡??섏뿬??踰꾪듉????긽 ?섎떒??*/}
                <div style={{ marginBottom: 24, flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start", opacity: f.ok ? 1 : 0.35 }}>
                      <span style={{ color: f.ok ? "#0fa573" : "#8a8a9a", fontSize: 13, marginTop: 1, flexShrink: 0 }}>{f.ok ? "?? : "??}</span>
                      <span style={{ fontSize: 13, color: f.ok ? "#1a2744" : "#8a8a9a" }}>{f.t}</span>
                    </div>
                  ))}
                </div>

                {/* CTA 踰꾪듉 ??marginTop: auto 濡???긽 ?섎떒 ?뺣젹 */}
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
                  {plan.price === 0 ? "臾대즺濡??쒖옉" : "援щ룆 ?쒖옉?섍린"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ??? ?꾨???而ㅻ??덊떚 ??? */}
      <div style={{ width: "100%", background: "#ffffff", padding: "60px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>COMMUNITY</p>
              <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, color: "#1a2744", lineHeight: 1.2 }}>?꾨??몃뱾???ㅼ젣 ?댁빞湲?/h2>
              <p style={{ fontSize: 15, color: "#8a8a9a", marginTop: 8 }}>?⑤━瑜??ъ슜?섎뒗 ?꾨??몃뱾???섎늻??寃쏀뿕怨??명븯??/p>
            </div>
            <a href="/login" style={{ fontSize: 13, fontWeight: 700, color: "#5b4fcf", textDecoration: "none", background: "rgba(91,79,207,0.08)", padding: "9px 18px", borderRadius: 10, flexShrink: 0 }}>臾대즺濡??쒖옉?섍린 ??/a>
          </div>

          {/* 而ㅻ??덊떚 ?쇰뱶 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, alignItems: "flex-start" }}>
            {[
              { avatar: "?룫", name: "?쒖슱 媛뺣궓 ?꾨???, time: "諛⑷툑 ??, tag: "?섍툑 愿由?, content: "?붿꽭 誘몃궔 ?뚮┝??諛붾줈 ????몄엯?먰븳??臾몄옄 蹂대궡?덇퉴 ?ㅼ쓬??諛붾줈 ?낃툑?먯뼱?? ?덉쟾???섍린濡?泥댄겕?섎떎 源뚮㉨?덈뒗???댁젣 ?꾩쟾 ?명빐議뚯뒿?덈떎 ?몟", likes: 24 },
              { avatar: "?룧", name: "?몄쿇 ?ㅼ꽭? 2梨??댁쁺", time: "1?쒓컙 ??, tag: "?멸툑 ?쒕?", content: "醫낇빀?뚮뱷???좉퀬 ?꾩뿉 ?멸툑 ?쒕??덉씠???뚮젮遊ㅻ뒗???몃Т??寃ъ쟻?대옉 嫄곗쓽 鍮꾩듂?섍쾶 ?섏솕?댁슂. ?ъ쟾??以鍮꾪븷 ???덉뼱???덈Т 醫뗭뒿?덈떎", likes: 18 },
              { avatar: "?룵", name: "遺???곴? ?꾨?", time: "3?쒓컙 ??, tag: "?댁슜利앸챸", content: "?닿굅 ?붿껌 ?댁슜利앸챸???깆뿉??諛붾줈 戮묒븘???깃린濡?蹂대깉?댁슂. 蹂?몄궗 ?듯븯硫?50留뚯썝?몃뜲 吏곸젒 ?섎땲源????고렪猷뚮쭔 ?ㅼ뿀?듬땲???뮞", likes: 31 },
              { avatar: "?룛截?, name: "寃쎄린 鍮뚮씪 3梨?, time: "?댁젣", tag: "怨꾩빟 愿由?, content: "怨꾩빟 留뚮즺??90???꾨????뚮┝???ㅻ땲源?誘몃━誘몃━ ?몄엯?먰븳???곕씫?????덉뼱?? 怨듭떎 ?놁씠 怨꾩냽 ?좎? 以묒엯?덈떎!", likes: 15 },
              { avatar: "?뙮", name: "異⑸궓 ?좎? ?꾨?", time: "?댄? ??, tag: "?좎? 愿由?, content: "?좎? ?꾨???愿由?媛?ν빐??醫뗭븘?? ?띿? ?꾨?猷??섍툑 ?댁뿭???붾퀎濡??뺣━?????덇퀬, ?멸툑 怨꾩궛???곕줈 ?섏????명븯?ㅼ슂", likes: 9 },
              { avatar: "?뮳", name: "?쒖슱 ?ㅽ뵾?ㅽ뀛 5梨?, time: "3????, tag: "由ы룷??, content: "?곕쭚???몃Т?좉퀬 ?먮즺 以鍮꾪븷 ??由ы룷??戮묒쑝?덇퉴 1?꾩튂 ?섏엯쨌吏異쒖씠 ?쒕늿??蹂댁뿬?? ?몃Т???곷떞 ?쒓컙???덈컲?쇰줈 以꾩뿀?댁슂", likes: 27 },
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
                  <span style={{ fontSize: 13 }}>?ㅿ툘</span>
                  <span style={{ fontSize: 12, color: "#a0a0b0", fontWeight: 600 }}>{post.likes}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 32, textAlign: "center", padding: "32px", background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(91,79,207,0.04))", borderRadius: 20, border: "1px solid rgba(91,79,207,0.1)" }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>吏湲?諛붾줈 ?쒖옉?대낫?몄슂</p>
            <p style={{ fontSize: 14, color: "#8a8a9a", marginBottom: 20 }}>臾대즺 ?뚮옖?쇰줈 ?쒖옉, ?몄젣???낃렇?덉씠??媛??/p>
            <a href="/login" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>臾대즺濡??⑤━ ?쒖옉?섍린 ??/a>
          </div>
        </div>
      </div>

      {/* ??? B2B 臾몄쓽 ?뱀뀡 ??? */}
      <div style={{ width: "100%", background: "#1a2744", padding: "48px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>ENTERPRISE</p>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: "-.3px" }}>
              踰뺤씤쨌怨듭씤以묎컻??룹옄?곌?由ъ궗 ???蹂꾨룄 臾몄쓽
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              ?ㅼ닔 臾쇨굔 蹂댁쑀 踰뺤씤 쨌 怨듭씤以묎컻???щТ??쨌 ?먯궛愿由ы쉶??br/>
              ?멸툑怨꾩궛??諛쒗뻾 쨌 ?곌컙 怨꾩빟 쨌 ? 怨꾩젙 ?묒쓽 媛??            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <a href="mailto:inquiry@mclean21.com?subject=?⑤━ 湲곗뾽 援щ룆 臾몄쓽"
              style={{ padding: "14px 28px", borderRadius: 12, background: "#fff", color: "#1a2744", fontWeight: 800, fontSize: 14, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap" }}>
              ?곸뾽???臾몄쓽?섍린 ??            </a>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>inquiry@mclean21.com</p>
          </div>
        </div>
      </div>

      {/* ??? 踰뺤쟻 ?명꽣 ??? */}
      <footer style={{
        width: "100%", borderTop: "1px solid #e8e6e0",
        marginTop: 60, padding: "40px 20px 80px",
        position: "relative", zIndex: 1
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* ?명꽣 ?곷떒 ??濡쒓퀬 + 留곹겕 洹몃━??*/}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
            {/* 濡쒓퀬 + ?ㅻ챸 */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #1a2744, #2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.9"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 16, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.3px" }}>?⑤━</span>
              </div>
              <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7, maxWidth: 200 }}>???꾨? 臾쇨굔, ?⑤━ ?섎굹濡?<br/>?섍툑쨌怨꾩빟쨌?멸툑쨌?댁슜利앸챸</p>
            </div>

            {/* 留곹겕 洹몃９??*/}
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>?쒕퉬??/p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/features" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    湲곕뒫 ?뚭컻
                  </Link>
                  <Link href="/login" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    臾대즺 ?쒖옉?섍린
                  </Link>
                  <Link href="/dashboard/pricing" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ?붽툑??                  </Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>吏??/p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/legal/faq" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ?먯＜ 臾삳뒗 吏덈Ц
                  </Link>
                  <Link href="/legal/notice" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    怨듭??ы빆
                  </Link>
                  <a href="mailto:inquiry@mclean21.com" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    臾몄쓽?섍린
                  </a>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>踰뺤쟻</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/legal/terms" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ?쒕퉬???댁슜?쎄?
                  </Link>
                  <Link href="/legal/privacy" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    媛쒖씤?뺣낫泥섎━諛⑹묠
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ?명꽣 ?섎떒 ???ъ뾽???뺣낫 */}
          <div style={{ borderTop: "1px solid #ebe9e3", paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.9, display: "flex", flexWrap: "wrap", gap: "0 20px" }}>
              <span>?곹샇紐? (二?留ν겢由?/span>
              <span>??? 源?깅?</span>
              <span>?ъ뾽?먮벑濡앸쾲?? 137-81-52231</span>
              <span>?듭떊?먮ℓ?낆떊怨? ??000-?쒖슱00-0000??/span>
              <span>?대찓?? inquiry@mclean21.com</span>
            </div>
            <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 8 }}>짤 2025 McLean Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ??? ?섎떒 怨좎젙 寃곗젣 諛???? */}
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
            {isAnnual ? "?곌컙 (20% ?좎씤)" : "?붽컙"}
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
                <p style={{ fontSize: 10, color: "#8a8a9a" }}>{isAnnual ? `????{(price * 12).toLocaleString()} 쨌 VAT ?ы븿` : "VAT ?ы븿"}</p>
              </div>
            );
          })()}
          <button onClick={() => router.push("/login")}
            style={{ padding: "10px 24px", borderRadius: 11, background: "linear-gradient(135deg, #1a2744, #2d4270)", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(26,39,68,0.25)" }}>
            援щ룆 ?쒖옉?섍린
          </button>
        </div>
      </div>
    </div>
  );
}

