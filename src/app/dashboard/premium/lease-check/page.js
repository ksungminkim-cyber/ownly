"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const C = { navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", purple:"#5b4fcf", surface:"#ffffff", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4" };

const CHECKS = [
  {
    id: "renewal",
    q: "怨꾩빟媛깆떊泥?뎄沅뚯씠 ?ъ슜?먮굹??",
    desc: "?꾩감?몄씠 怨꾩빟 醫낅즺 2媛쒖썡 ?꾧퉴吏 媛깆떊???붿껌?????덈뒗 沅뚮━",
    yes: { label:"?ъ슜??, color:C.rose, result:"?몄엯?먯뿉寃?2???곗옣 ?섎Т媛 諛쒖깮?⑸땲?? ?뺣떦???ъ쑀 ?놁씠 嫄곗젅 ???먰빐諛곗긽 泥?뎄 ?꾪뿕???덉뒿?덈떎.", action:"踰뺣Т???먮뒗 蹂?몄궗?먭쾶 媛깆떊 嫄곗젅 ?붽굔 ?뺤씤 沅뚯옣" },
    no:  { label:"誘몄궗??, color:C.emerald, result:"?ш퀎???щ?瑜??먯쑀濡?쾶 ?묒쓽?????덉뒿?덈떎. 蹂댁쬆湲댟룹썡??議곌굔???쒖꽭??留욊쾶 議곗젙 媛?ν빀?덈떎.", action:"怨꾩빟 醫낅즺 6媛쒖썡~2媛쒖썡 ???ъ씠??怨꾩빟 媛깆떊 嫄곗젅 ?듬낫 ?꾩슂" },
  },
  {
    id: "cap",
    q: "?꾩썡???곹븳???곸슜 ??곸씤媛??",
    desc: "二쇨굅??嫄대Ъ ?꾨?李?怨꾩빟 媛깆떊 ???꾨?猷?5% ?대궡 ?몄긽留??덉슜",
    yes: { label:"?곸슜??, color:C.amber, result:"媛깆떊 怨꾩빟 ??湲곗〈 ?꾨?猷??鍮?5% ?대궡 ?몄긽留?媛?ν빀?덈떎. 珥덇낵 ?몄긽 ??怨꾩빟??臾댄슚媛 ?????덉뒿?덈떎.", action:"?몄긽瑜?= (?좉퇋 ?꾨?猷?- 湲곗〈 ?꾨?猷? 첨 湲곗〈 ?꾨?猷?횞 100" },
    no:  { label:"誘몄쟻??, color:C.emerald, result:"?좉퇋 怨꾩빟?닿굅??鍮꾩＜嫄??⑸룄 臾쇨굔??寃쎌슦 ?곹븳???곸슜??諛쏆? ?딆뒿?덈떎. ?쒖꽭 諛섏쁺 媛?ν빀?덈떎.", action:"鍮꾩＜嫄??⑸룄 蹂寃??쒖뿉???ㅼ궗??紐⑹쟻 ?뺤씤 ?꾩슂" },
  },
  {
    id: "conversion",
    q: "?꾩꽭瑜??붿꽭濡??꾪솚?섎굹??",
    desc: "?꾩꽭湲덉쓽 ?쇰?瑜??붿꽭濡??꾪솚????踰뺤젙 ?꾪솚???곸슜",
    yes: { label:"?꾪솚 ?덉젙", color:C.amber, result:"踰뺤젙 ?꾪솚?⑥? 湲곗?湲덈━ + 2% (?꾩옱 ??5.5% ?섏?)?낅땲?? ?대? 珥덇낵?섎뒗 ?꾪솚?⑥? 踰뺤쟻?쇰줈 臾댄슚?낅땲??", action:"???꾪솚 ?꾨?猷?= ?꾪솚 蹂댁쬆湲?횞 ?꾪솚??첨 12" },
    no:  { label:"?좎?", color:C.emerald, result:"?꾩꽭 ?좎? ??蹂꾨룄 洹쒖젣 ?놁씠 怨꾩빟 議곌굔??洹몃?濡??좎??섎㈃ ?⑸땲??", action:"蹂댁쬆湲?諛섑솚 ?쒓린? 諛⑸쾿??怨꾩빟?쒖뿉 紐낇솗??湲곗옱?섏꽭?? },
  },
  {
    id: "dispute",
    q: "?꾩감?멸낵 遺꾩웳???덈굹??",
    desc: "?꾨?猷?誘몃궔, ?먯긽蹂듦뎄, 怨꾩빟 ?댁? ??遺꾩웳 ?곹솴",
    yes: { label:"遺꾩웳 ?덉쓬", color:C.rose, result:"?댁슜利앸챸???듯빐 踰뺤쟻 ?섏궗?쒖떆瑜?癒쇱? ?④린??寃껋씠 以묒슂?⑸땲?? ?댄썑 二쇳깮?꾨?李⑤텇?곸“?뺤쐞?먰쉶瑜??쒖슜?????덉뒿?덈떎.", action:"?댁슜利앸챸 諛쒖넚 ??議곗젙 ?좎껌 ???뚯븸 ?ы뙋 ?쒖꽌 沅뚯옣" },
    no:  { label:"?놁쓬", color:C.emerald, result:"遺꾩웳 ?덈갑???꾪빐 怨꾩빟???뱀빟 ?ы빆??紐낇솗???섍퀬, ?섎━ ?붿껌쨌?섍툑 ?대젰???깆뿉 湲곕줉?대몢?몄슂.", action:"?⑤━ ?깆쓽 '?댁슜利앸챸' 湲곕뒫?쇰줈 ?쒕㈃ 諛쒖넚 媛?? },
  },
];

export default function LeaseCheckPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState({});
  const [expanded, setExpanded] = useState(null);

  const answered = Object.keys(answers).length;
  const risks = Object.values(answers).filter(a => a === "yes").length;

  return (
    <div className="page-in page-padding" style={{ maxWidth:720, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()}
        style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:14, padding:0 }}>
        ????쒕낫?쒕줈
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#5b4fcf,#1a2744)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>?뽳툘</div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, letterSpacing:"-.4px" }}>?꾨?李?3踰?泥댄겕由ъ뒪??/h1>
            <span style={{ fontSize:10, fontWeight:800, color:C.purple, background:"rgba(91,79,207,0.1)", padding:"3px 8px", borderRadius:6 }}>PLUS</span>
          </div>
          <p style={{ fontSize:13, color:C.muted }}>踰뺤쟻 由ъ뒪?щ? ?ъ쟾???뚯븙?섍퀬 ???諛⑸쾿???뺤씤?섏꽭??/p>
        </div>
      </div>

      {/* 吏꾪뻾 ?곹솴 */}
      {answered > 0 && (
        <div style={{ background: risks > 1 ? "rgba(232,68,90,0.06)" : "rgba(15,165,115,0.06)",
          border:`1px solid ${risks > 1 ? C.rose : C.emerald}22`, borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ fontSize:28 }}>{risks > 1 ? "?좑툘" : "??}</span>
          <div>
            <p style={{ fontSize:14, fontWeight:800, color:C.navy }}>{answered}/{CHECKS.length}媛???ぉ ?뺤씤 쨌 由ъ뒪??{risks}嫄?/p>
            <p style={{ fontSize:12, color:C.muted }}>{risks > 1 ? "踰뺣Т???곷떞??沅뚯옣?⑸땲?? : "?꾩옱 踰뺤쟻 由ъ뒪?ш? ??뒿?덈떎"}</p>
          </div>
        </div>
      )}

      {/* 泥댄겕 ??ぉ */}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {CHECKS.map((c, i) => {
          const ans = answers[c.id];
          const result = ans ? c[ans] : null;
          return (
            <div key={c.id} style={{ background:C.surface, border:`1.5px solid ${result ? result.color+"30" : C.border}`, borderRadius:18, overflow:"hidden", transition:"all .2s" }}>
              {/* ?ㅻ뜑 */}
              <div style={{ padding:"18px 20px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${C.navy}15,${C.purple}15)`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:C.navy, flexShrink:0 }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:4 }}>{c.q}</p>
                    <p style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{c.desc}</p>
                  </div>
                </div>
                {/* 踰꾪듉 */}
                <div style={{ display:"flex", gap:10 }}>
                  {["yes","no"].map(v => (
                    <button key={v} onClick={() => setAnswers(a => ({ ...a, [c.id]: v }))}
                      style={{ flex:1, padding:"11px 0", borderRadius:12, cursor:"pointer", fontSize:14, fontWeight:800, transition:"all .15s",
                        background: ans===v ? (v==="yes" ? c.yes.color : c.no.color) : C.faint,
                        color: ans===v ? "#fff" : C.muted,
                        border: ans===v ? "none" : `1px solid ${C.border}` }}>
                      {v==="yes" ? "?? : "?꾨땲??}
                    </button>
                  ))}
                </div>
              </div>

              {/* 寃곌낵 */}
              {result && (
                <div style={{ padding:"16px 20px", borderTop:`1px solid ${result.color}20`, background:`${result.color}06` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:result.color, display:"inline-block", flexShrink:0 }} />
                    <span style={{ fontSize:12, fontWeight:800, color:result.color }}>{result.label}</span>
                  </div>
                  <p style={{ fontSize:13, color:C.navy, lineHeight:1.7, marginBottom:10 }}>{result.result}</p>
                  <div style={{ background:result.color+"12", borderRadius:10, padding:"10px 14px", display:"flex", gap:8, alignItems:"flex-start" }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>?뮕</span>
                    <p style={{ fontSize:12, color:C.navy, fontWeight:600, lineHeight:1.6 }}>{result.action}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:20, lineHeight:1.7 }}>
        ????泥댄겕由ъ뒪?몃뒗 李멸퀬?⑹씠硫? 踰뺤쟻 ?먮떒? 蹂?몄궗쨌踰뺣Т?ъ뿉寃?臾몄쓽?섏꽭??
      </p>
    </div>
  );
}

