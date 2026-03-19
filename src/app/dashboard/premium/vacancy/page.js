"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = { navy:"#1a2744", rose:"#e8445a", amber:"#e8960a", emerald:"#0fa573", surface:"#ffffff", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4" };

export default function VacancyPage() {
  const router = useRouter();
  const { tenants } = useApp();
  const [months, setMonths] = useState(3);
  const [customRent, setCustomRent] = useState("");

  const avgRent = tenants.length > 0
    ? Math.round(tenants.reduce((s, t) => s + (t.rent || 0), 0) / tenants.length)
    : 200;
  const effectiveRent = customRent ? Number(customRent) : avgRent;
  const directLoss    = effectiveRent * months;
  const opportunityCost = Math.round(directLoss * 0.05);
  const totalLoss     = directLoss + opportunityCost;
  const annualImpact  = Math.round((directLoss / 12) * 100) / 100;

  const tips = [
    { icon:"?룧", title:"吏곷갑쨌?ㅻ갑 ?숈떆 ?깅줉", desc:"?몄텧 洹밸??붾줈 怨듭떎 湲곌컙 ?됯퇏 40% ?⑥텞 ?④낵" },
    { icon:"?뮥", title:"蹂댁쬆湲??좎뿰 ?묒쓽", desc:"蹂댁쬆湲덉쓣 ??텛硫??꾩감???좎튂 ?띾룄 ?μ긽" },
    { icon:"?뱤", title:"?쒖꽭 5% ?댄븯 梨낆젙", desc:"鍮좊Ⅸ 怨꾩빟 ?곗꽑 ???κ린 怨듭떎蹂대떎 ?섏씡 ?좊━" },
    { icon:"?뵩", title:"?뚭퇋紐?由щえ?몃쭅", desc:"?꾨같쨌?ν뙋留뚯쑝濡??꾨?猷?5~10% ?곹뼢 媛?? },
  ];

  const barMax = 24;

  return (
    <div className="page-in page-padding" style={{ maxWidth:760, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()}
        style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:14, padding:0 }}>
        ????쒕낫?쒕줈
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#e8445a,#c0364a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>?뱣</div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, letterSpacing:"-.4px" }}>怨듭떎 ?먯떎 怨꾩궛湲?/h1>
            <span style={{ fontSize:10, fontWeight:800, color:C.rose, background:"rgba(232,68,90,0.1)", padding:"3px 8px", borderRadius:6 }}>PLUS</span>
          </div>
          <p style={{ fontSize:13, color:C.muted }}>怨듭떎 湲곌컙??諛쒖깮?섎뒗 ?ㅼ젣 ?먯떎怨?湲고쉶鍮꾩슜??怨꾩궛?⑸땲??/p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        {/* ?낅젰 */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* ?붿꽭 */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:14 }}>?붿꽭 (留뚯썝)</p>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
              <div style={{ flex:1, background:C.faint, borderRadius:10, padding:"10px 14px" }}>
                <p style={{ fontSize:11, color:C.muted, marginBottom:2 }}>?깅줉 臾쇨굔 ?됯퇏</p>
                <p style={{ fontSize:20, fontWeight:900, color:C.navy }}>{avgRent}留뚯썝</p>
              </div>
            </div>
            <p style={{ fontSize:11, color:C.muted, marginBottom:6 }}>吏곸젒 ?낅젰 (?좏깮)</p>
            <input type="number" value={customRent} onChange={e => setCustomRent(e.target.value)}
              placeholder={String(avgRent)}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`,
                fontSize:14, fontWeight:700, color:C.navy, background:C.faint, outline:"none", fontFamily:"inherit" }} />
          </div>

          {/* 怨듭떎 湲곌컙 ?щ씪?대뜑 */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:14 }}>怨듭떎 湲곌컙</p>
            <p style={{ fontSize:40, fontWeight:900, color:C.navy, marginBottom:10 }}>{months}<span style={{ fontSize:16, fontWeight:600, color:C.muted }}>媛쒖썡</span></p>
            <input type="range" min={1} max={barMax} value={months}
              onChange={e => setMonths(Number(e.target.value))}
              style={{ width:"100%", accentColor:C.rose, marginBottom:6 }} />
            {/* 湲곌컙 ?덉씠釉?*/}
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              {[1,3,6,12,24].map(m => (
                <button key={m} onClick={() => setMonths(m)}
                  style={{ fontSize:11, fontWeight:700, color:months===m?C.rose:C.muted,
                    background:"none", border:"none", cursor:"pointer", padding:"2px 4px" }}>
                  {m}媛쒖썡
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 寃곌낵 */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* 硫붿씤 ?먯떎 */}
          <div style={{ background:"linear-gradient(135deg,#e8445a,#c0364a)", borderRadius:20, padding:24, textAlign:"center" }}>
            <p style={{ fontSize:12, fontWeight:800, color:"rgba(255,255,255,0.6)", letterSpacing:"1px", marginBottom:8 }}>珥??덉긽 ?먯떎</p>
            <p style={{ fontSize:44, fontWeight:900, color:"#fff", letterSpacing:"-2px", lineHeight:1 }}>
              {totalLoss.toLocaleString()}<span style={{ fontSize:18 }}>留뚯썝</span>
            </p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:8 }}>湲고쉶鍮꾩슜 {opportunityCost.toLocaleString()}留뚯썝 ?ы븿</p>
          </div>

          {/* ?곸꽭 */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:14 }}>?먯떎 ?곸꽭</p>
            {[
              ["?꾨?猷?誘몄닔", directLoss.toLocaleString()+"留뚯썝", C.rose],
              ["湲고쉶鍮꾩슜 (5%)", opportunityCost.toLocaleString()+"留뚯썝", C.amber],
              ["?곌컙 ?섏씡 ?곹뼢", "-"+annualImpact.toFixed(1)+"%p", C.navy],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, color:C.muted }}>{label}</span>
                <span style={{ fontSize:14, fontWeight:800, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ?⑥텞 ?꾨왂 */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:24 }}>
        <p style={{ fontSize:14, fontWeight:800, color:C.navy, marginBottom:16 }}>?렞 怨듭떎 ?⑥텞 ?꾨왂</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {tips.map((t, i) => (
            <div key={i} style={{ background:C.faint, borderRadius:14, padding:16 }}>
              <p style={{ fontSize:18, marginBottom:6 }}>{t.icon}</p>
              <p style={{ fontSize:13, fontWeight:800, color:C.navy, marginBottom:4 }}>{t.title}</p>
              <p style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

