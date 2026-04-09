"use client"; import { useState, useEffect } from "react"; import { useParams } from "next/navigation"; import { supabase } from "../../../lib/supabase";

export default function ContractViewPage() {
  const params = useParams();
  const tenantId = params.tenantId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!tenantId) { setNotFound(true); setLoading(false); return; }
      // ???щ컮瑜?DB 而щ읆紐??ъ슜
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("id, name, address, p_type, sub_type, rent, deposit, maintenance, start_date, contract_end, pay_day")
        .eq("id", tenantId)
        .single();
      if (error || !tenant) { setNotFound(true); setLoading(false); return; }
      setData(tenant);
      setLoading(false);
    };
    load();
  }, [tenantId]);

  const daysLeft = (end) => {
    if (!end) return null;
    return Math.ceil((new Date(end) - new Date()) / 86400000);
  };

  const formatPayDay = (d) => {
    if (!d) return "誘몄꽕??;
    if (Number(d) === 99) return "留ㅼ썡 留먯씪";
    return `留ㅼ썡 ${d}??;
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>??/div>
        <p style={{ fontSize:14, color:"#8a8a9a" }}>遺덈윭?ㅻ뒗 以?..</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:320 }}>
        <div style={{ fontSize:44, marginBottom:16 }}>?뵇</div>
        <h2 style={{ fontSize:18, fontWeight:800, color:"#1a2744", marginBottom:8 }}>留곹겕瑜??뺤씤?댁＜?몄슂</h2>
        <p style={{ fontSize:13, color:"#8a8a9a", lineHeight:1.7 }}>?섎せ??留곹겕?닿굅??留뚮즺??留곹겕?낅땲?? ?꾨??몄뿉寃??ㅼ떆 ?붿껌?댁＜?몄슂.</p>
      </div>
    </div>
  );

  // ??而щ읆紐?留ㅽ븨 (DB ???쒖떆)
  const addr = data.address || "";
  const rent = Number(data.rent) || 0;
  const dep = Number(data.deposit) || 0;
  const maint = Number(data.maintenance) || 0;
  const endDate = data.contract_end || "";
  const startDate = data.start_date || "";
  const rentTotal = rent + maint;

  const dl = daysLeft(endDate);
  const isExpiringSoon = dl !== null && dl <= 90 && dl >= 0;
  const isExpired = dl !== null && dl < 0;

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f0", fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      {/* ?ㅻ뜑 */}
      <div style={{ background:"#1a2744", padding:"20px 20px 24px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(145deg,#2d4270,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
            </div>
            <div>
              <p style={{ fontSize:16, fontWeight:800, color:"#fff", margin:0 }}>?⑤━</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0 }}>?꾨? 怨꾩빟 ?뺤씤</p>
            </div>
          </div>
          <h1 style={{ fontSize:20, fontWeight:900, color:"#fff", marginBottom:4 }}>??怨꾩빟 ?뺣낫</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", margin:0 }}>{data.name}?섏쓽 ?꾨?李?怨꾩빟 ?꾪솴</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"24px 20px 40px" }}>
        {/* 留뚮즺 ?곹깭 諛곕꼫 */}
        {isExpired && (
          <div style={{ background:"rgba(232,68,90,0.1)", border:"1px solid rgba(232,68,90,0.3)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:18 }}>?좑툘</span>
            <div>
              <p style={{ fontSize:13, fontWeight:800, color:"#e8445a", margin:0 }}>怨꾩빟 湲곌컙??留뚮즺?먯뒿?덈떎</p>
              <p style={{ fontSize:11, color:"#8a8a9a", margin:"2px 0 0" }}>?꾨??몄뿉寃?媛깆떊 ?щ?瑜??뺤씤?섏꽭??/p>
            </div>
          </div>
        )}
        {isExpiringSoon && (
          <div style={{ background:"rgba(232,150,10,0.1)", border:"1px solid rgba(232,150,10,0.3)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:18 }}>?뱟</span>
            <div>
              <p style={{ fontSize:13, fontWeight:800, color:"#e8960a", margin:0 }}>怨꾩빟 留뚮즺 D-{dl}</p>
              <p style={{ fontSize:11, color:"#8a8a9a", margin:"2px 0 0" }}>?꾨??멸낵 媛깆떊 ?щ?瑜?誘몃━ ?곸쓽?섏꽭??/p>
            </div>
          </div>
        )}

        {/* 二쇱슂 ?뺣낫 移대뱶 */}
        <div style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:18, overflow:"hidden", marginBottom:14, boxShadow:"0 2px 12px rgba(26,39,68,0.06)" }}>
          <div style={{ background:"linear-gradient(135deg,rgba(26,39,68,0.04),rgba(91,79,207,0.04))", padding:"16px 20px", borderBottom:"1px solid #ebe9e3" }}>
            <p style={{ fontSize:11, fontWeight:800, color:"#8a8a9a", letterSpacing:"1px", textTransform:"uppercase", margin:"0 0 4px" }}>?꾨? 臾쇨굔</p>
            <p style={{ fontSize:16, fontWeight:800, color:"#1a2744", margin:0 }}>{addr}</p>
            {data.sub_type && <p style={{ fontSize:12, color:"#8a8a9a", margin:"3px 0 0" }}>{data.sub_type}</p>}
          </div>
          <div style={{ padding:"16px 20px" }}>
            {[
              { label:"?붿꽭", value:`${rent.toLocaleString()}留뚯썝`, color:"#1a2744", bold:true },
              maint > 0 ? { label:"愿由щ퉬", value:`${maint.toLocaleString()}留뚯썝 蹂꾨룄`, color:"#8a8a9a" } : null,
              maint > 0 ? { label:"珥????⑸???, value:`${rentTotal.toLocaleString()}留뚯썝`, color:"#4f46e5", bold:true } : null,
              { label:"蹂댁쬆湲?, value:`${dep.toLocaleString()}留뚯썝`, color:"#1a2744" },
              { label:"?⑸???, value:formatPayDay(data.pay_day), color:"#1a2744" },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f5f4f0" }}>
                <span style={{ fontSize:13, color:"#8a8a9a" }}>{row.label}</span>
                <span style={{ fontSize:14, fontWeight:row.bold?800:600, color:row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 怨꾩빟 湲곌컙 移대뱶 */}
        <div style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:18, padding:"16px 20px", marginBottom:14, boxShadow:"0 2px 12px rgba(26,39,68,0.06)" }}>
          <p style={{ fontSize:11, fontWeight:800, color:"#8a8a9a", letterSpacing:"1px", textTransform:"uppercase", marginBottom:14 }}>怨꾩빟 湲곌컙</p>
          {[
            { label:"怨꾩빟 ?쒖옉", value:startDate || "誘몄엯?? },
            { label:"怨꾩빟 留뚮즺", value:endDate || "誘몄엯?? },
            dl !== null ? { label:"留뚮즺源뚯?", value:dl >= 0 ? `D-${dl}` : `D+${Math.abs(dl)} (留뚮즺??`, color:dl < 0?"#e8445a":dl<=90?"#e8960a":"#0fa573" } : null,
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f5f4f0" }}>
              <span style={{ fontSize:13, color:"#8a8a9a" }}>{row.label}</span>
              <span style={{ fontSize:14, fontWeight:row.color?800:600, color:row.color||"#1a2744" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* ?덈궡 */}
        <div style={{ background:"rgba(26,39,68,0.04)", borderRadius:12, padding:"14px 16px", marginBottom:24 }}>
          <p style={{ fontSize:12, color:"#8a8a9a", lineHeight:1.7, margin:0 }}>
            ??蹂??섏씠吏???꾨??몄씠 諛쒓툒??怨꾩빟 ?뺤씤 留곹겕?낅땲??<br/>
            ??怨꾩빟 ?댁슜 蹂寃쎌? ?꾨??몄뿉寃?吏곸젒 臾몄쓽?섏꽭??<br/>
            ????留곹겕???몄젣?좎? ?뺤씤 媛?ν빀?덈떎.
          </p>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#c0c0cc" }}>
          Powered by <span style={{ fontWeight:700, color:"#8a8a9a" }}>Ownly</span> 쨌 ?꾨? 愿由??뚮옯??        </p>
      </div>
    </div>
  );
}
