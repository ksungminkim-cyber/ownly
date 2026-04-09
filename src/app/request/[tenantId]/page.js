"use client"; import { useState, useEffect } from "react"; import { useParams } from "next/navigation"; import { supabase } from "../../../lib/supabase";

const CATEGORIES = ["?꾨같/?ν뙋","諛곌?/?섎룄","?꾧린","?먯뼱而??됰궃諛?,"李쎈Ц/臾?,"二쇰갑","?뺤떎","?몃꼍/吏遺?,"湲고?"];
const ICONS = {"?꾨같/?ν뙋":"?렓","諛곌?/?섎룄":"?뵩","?꾧린":"??,"?먯뼱而??됰궃諛?:"?꾬툘","李쎈Ц/臾?:"?슞","二쇰갑":"?뜵","?뺤떎":"?슼","?몃꼍/吏遺?:"?룧","湲고?":"?뵪"};

export default function RepairRequestPage() {
  const params = useParams();
  const tenantId = params.tenantId;
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ category: "湲고?", desc: "", urgent: false });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!tenantId) { setNotFound(true); setLoading(false); return; }
      // ???щ컮瑜?DB 而щ읆紐??ъ슜
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, address, user_id")
        .eq("id", tenantId)
        .single();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setTenant(data);
      setLoading(false);
    };
    load();
  }, [tenantId]);

  const submit = async () => {
    if (!form.desc.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("repairs").insert([{
        tenant_id: tenantId,
        user_id: tenant.user_id,
        category: form.category,
        memo: form.desc,
        date: new Date().toISOString().slice(0, 10),
        cost: 0,
        receipt_yn: false,
        property_name: tenant.address || "",
        urgent: form.urgent,
        requested_by_tenant: true,
      }]);
      if (error) throw error;
      setDone(true);
    } catch(e) {
      alert("?붿껌 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. ?ㅼ떆 ?쒕룄?댁＜?몄슂.");
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>??/div>
        <p style={{ fontSize:14, color:"#8a8a9a" }}>遺덈윭?ㅻ뒗 以?..</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:320 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>?뵇</div>
        <h2 style={{ fontSize:18, fontWeight:800, color:"#1a2744", marginBottom:8 }}>留곹겕瑜??뺤씤?댁＜?몄슂</h2>
        <p style={{ fontSize:13, color:"#8a8a9a" }}>?섎せ??留곹겕?닿굅??留뚮즺??留곹겕?낅땲?? ?꾨??몄뿉寃??ㅼ떆 ?붿껌?댁＜?몄슂.</p>
      </div>
    </div>
  );

  if (done) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:360 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(15,165,115,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 20px" }}>??/div>
        <h2 style={{ fontSize:20, fontWeight:900, color:"#1a2744", marginBottom:8 }}>?섎━ ?붿껌???묒닔?먯뒿?덈떎</h2>
        <p style={{ fontSize:14, color:"#8a8a9a", lineHeight:1.7, marginBottom:24 }}>?꾨??몄뿉寃??뚮┝???꾩넚?먯뒿?덈떎.<br/>鍮좊Ⅸ ?쒖씪 ?댁뿉 ?곕씫 ?쒕┫寃뚯슂.</p>
        <div style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:14, padding:"16px 20px", textAlign:"left" }}>
          <p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, marginBottom:8 }}>?묒닔 ?댁슜</p>
          <p style={{ fontSize:13, fontWeight:700, color:"#1a2744", marginBottom:4 }}>{ICONS[form.category]} {form.category}</p>
          <p style={{ fontSize:13, color:"#4a5568" }}>{form.desc}</p>
          {form.urgent && <span style={{ display:"inline-block", marginTop:8, fontSize:11, fontWeight:800, color:"#e8445a", background:"rgba(232,68,90,0.1)", padding:"2px 8px", borderRadius:20 }}>??湲닿툒 ?붿껌</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#f5f4f0", fontFamily:"'Pretendard','DM Sans',sans-serif", padding:"0 0 40px" }}>
      <div style={{ background:"#1a2744", padding:"20px 20px 24px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(145deg,#2d4270,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
            </div>
            <span style={{ fontSize:16, fontWeight:800, color:"#fff" }}>?⑤━</span>
          </div>
          <h1 style={{ fontSize:20, fontWeight:900, color:"#fff", marginBottom:4 }}>?뵪 ?섎━ ?붿껌</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>{tenant?.address || ""}</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"24px 20px" }}>
        <div style={{ background:"#fff", borderRadius:16, padding:"20px", marginBottom:14, border:"1px solid #ebe9e3" }}>
          <p style={{ fontSize:12, fontWeight:800, color:"#8a8a9a", letterSpacing:"1px", textTransform:"uppercase", marginBottom:14 }}>?섎━ 遺꾩빞</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setForm(f=>({...f, category:cat}))} style={{ padding:"10px 4px", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"center", border:`1.5px solid ${form.category===cat?"#1a2744":"#ebe9e3"}`, background:form.category===cat?"#1a2744":"transparent", color:form.category===cat?"#fff":"#4a5568", transition:"all .15s" }}>
                <div style={{ fontSize:18, marginBottom:3 }}>{ICONS[cat]}</div>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background:"#fff", borderRadius:16, padding:"20px", marginBottom:14, border:"1px solid #ebe9e3" }}>
          <p style={{ fontSize:12, fontWeight:800, color:"#8a8a9a", letterSpacing:"1px", textTransform:"uppercase", marginBottom:12 }}>?곸꽭 ?댁슜</p>
          <textarea
            value={form.desc}
            onChange={e=>setForm(f=>({...f, desc:e.target.value}))}
            rows={5}
            placeholder={"?대뼡 臾몄젣媛 諛쒖깮?덈뒗吏 ?먯꽭???뚮젮二쇱꽭??\n?? 二쇰갑 ?깊겕? ?꾨옒 諛곌??먯꽌 臾쇱씠 ?덇퀬 ?덉뒿?덈떎."}
            style={{ width:"100%", padding:"12px 14px", fontSize:14, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, resize:"vertical", outline:"none", fontFamily:"inherit", lineHeight:1.7 }}
          />
        </div>

        <div style={{ background:"#fff", borderRadius:16, padding:"16px 20px", marginBottom:20, border:"1px solid #ebe9e3" }}>
          <div onClick={() => setForm(f=>({...f, urgent:!f.urgent}))} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${form.urgent?"#e8445a":"#ebe9e3"}`, background:form.urgent?"#e8445a":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}>
              {form.urgent && <span style={{ color:"#fff", fontSize:13, fontWeight:900 }}>??/span>}
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:"#1a2744", margin:0 }}>??湲닿툒 ?붿껌</p>
              <p style={{ fontSize:12, color:"#8a8a9a", margin:"2px 0 0" }}>?꾩닔, ?⑥쟾, 蹂댁씪??怨좎옣 ??利됱떆 泥섎━媛 ?꾩슂??寃쎌슦</p>
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !form.desc.trim()}
          style={{ width:"100%", padding:"16px", borderRadius:14, background: !form.desc.trim() ? "#e0e0e0" : form.urgent ? "linear-gradient(135deg,#e8445a,#dc2626)" : "linear-gradient(135deg,#1a2744,#2d4270)", border:"none", color: !form.desc.trim() ? "#aaa" : "#fff", fontWeight:800, fontSize:16, cursor: form.desc.trim() ? "pointer" : "not-allowed", boxShadow: form.desc.trim() ? "0 4px 20px rgba(26,39,68,0.25)" : "none" }}
        >
          {submitting ? "?붿껌 以?.." : "?뵩 ?섎━ ?붿껌 ?묒닔?섍린"}
        </button>

        <p style={{ textAlign:"center", fontSize:11, color:"#bbb", marginTop:16 }}>
          ???섏씠吏???꾨??몄씠 諛쒓툒???꾩슜 留곹겕?낅땲??쨌 Powered by Ownly
        </p>
      </div>
    </div>
  );
}
