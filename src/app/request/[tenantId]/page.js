"use client"; import { useState, useEffect } from "react"; import { useParams } from "next/navigation"; import { supabase } from "../../../lib/supabase";

const CATEGORIES = ["\uB3C4\uBC30/\uC7A5\uD310","\uBC30\uAD00/\uC218\uB3C4","\uC804\uAE30","\uC5D0\uC5B4\uCEE8/\uB0C9\uB09C\uBC29","\uCC3D\uBB38/\uBB38","\uC8FC\uBC29","\uC695\uC2E4","\uC678\uBCBD/\uC9C0\uBD95","\uAE30\uD0C0"];
const ICONS = {"\uB3C4\uBC30/\uC7A5\uD310":"\uD83C\uDFA8","\uBC30\uAD00/\uC218\uB3C4":"\uD83D\uDD27","\uC804\uAE30":"\u26A1","\uC5D0\uC5B4\uCEE8/\uB0C9\uB09C\uBC29":"\u2744\uFE0F","\uCC3D\uBB38/\uBB38":"\uD83D\uDEAA","\uC8FC\uBC29":"\uD83C\uDF73","\uC695\uC2E4":"\uD83D\uDEBF","\uC678\uBCBD/\uC9C0\uBD95":"\uD83C\uDFE0","\uAE30\uD0C0":"\uD83D\uDD28"};

export default function RepairRequestPage() {
  const params = useParams();
  const tenantId = params.tenantId;
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ category: "\uAE30\uD0C0", desc: "", urgent: false });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!tenantId) { setNotFound(true); setLoading(false); return; }
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
      alert("\uC694\uCCAD \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.");
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>&#9203;</div>
        <p style={{ fontSize:14, color:"#8a8a9a" }}>\uBD88\uB7EC\uC624\uB294 \uC911...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:320 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>&#128269;</div>
        <h2 style={{ fontSize:18, fontWeight:800, color:"#1a2744", marginBottom:8 }}>\uB9C1\uD06C\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694</h2>
        <p style={{ fontSize:13, color:"#8a8a9a" }}>\uC798\uBABB\uB41C \uB9C1\uD06C\uC774\uAC70\uB098 \uB9CC\uB8CC\uB41C \uB9C1\uD06C\uC785\uB2C8\uB2E4. \uC784\uB300\uC778\uC5D0\uAC8C \uB2E4\uC2DC \uC694\uCCAD\uD574\uC8FC\uC138\uC694.</p>
      </div>
    </div>
  );

  if (done) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:360 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(15,165,115,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 20px" }}>&#9989;</div>
        <h2 style={{ fontSize:20, fontWeight:900, color:"#1a2744", marginBottom:8 }}>\uC218\uB9AC \uC694\uCCAD\uC774 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4</h2>
        <p style={{ fontSize:14, color:"#8a8a9a", lineHeight:1.7, marginBottom:24 }}>\uC784\uB300\uC778\uC5D0\uAC8C \uC54C\uB9BC\uC774 \uC804\uC1A1\uB620\uC2B5\uB2C8\uB2E4.<br/>\uBE60\uB978 \uC2DC\uC77C \uB0B4\uC5D0 \uC5F0\uB77D \uB4DC\uB9B4\uAC8C\uC694.</p>
        <div style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:14, padding:"16px 20px", textAlign:"left" }}>
          <p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, marginBottom:8 }}>\uC811\uC218 \uB0B4\uC6A9</p>
          <p style={{ fontSize:13, fontWeight:700, color:"#1a2744", marginBottom:4 }}>{ICONS[form.category]} {form.category}</p>
          <p style={{ fontSize:13, color:"#4a5568" }}>{form.desc}</p>
          {form.urgent && <span style={{ display:"inline-block", marginTop:8, fontSize:11, fontWeight:800, color:"#e8445a", background:"rgba(232,68,90,0.1)", padding:"2px 8px", borderRadius:20 }}>&#9889; \uAE34\uAE09 \uC694\uCCAD</span>}
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
            <span style={{ fontSize:16, fontWeight:800, color:"#fff" }}>\uC628\uB9AC</span>
          </div>
          <h1 style={{ fontSize:20, fontWeight:900, color:"#fff", marginBottom:4 }}>&#128296; \uC218\uB9AC \uC694\uCCAD</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>{tenant?.address || ""}</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"24px 20px" }}>
        <div style={{ background:"#fff", borderRadius:16, padding:"20px", marginBottom:14, border:"1px solid #ebe9e3" }}>
          <p style={{ fontSize:12, fontWeight:800, color:"#8a8a9a", letterSpacing:"1px", textTransform:"uppercase", marginBottom:14 }}>\uC218\uB9AC \uBD84\uC57C</p>
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
          <p style={{ fontSize:12, fontWeight:800, color:"#8a8a9a", letterSpacing:"1px", textTransform:"uppercase", marginBottom:12 }}>\uC0C1\uC138 \uB0B4\uC6A9</p>
          <textarea
            value={form.desc}
            onChange={e=>setForm(f=>({...f, desc:e.target.value}))}
            rows={5}
            placeholder={"\uC5B4\uB5A4 \uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uB294\uC9C0 \uC790\uC138\uD788 \uC54C\uB824\uC8FC\uC138\uC694.\n\uC608: \uC8FC\uBC29 \uC2F1\uD06C\uB300 \uC544\uB798 \uBC30\uAD00\uC5D0\uC11C \uBB3C\uC774 \uC0C8\uACE0 \uC788\uC2B5\uB2C8\uB2E4."}
            style={{ width:"100%", padding:"12px 14px", fontSize:14, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, resize:"vertical", outline:"none", fontFamily:"inherit", lineHeight:1.7 }}
          />
        </div>

        <div style={{ background:"#fff", borderRadius:16, padding:"16px 20px", marginBottom:20, border:"1px solid #ebe9e3" }}>
          <div onClick={() => setForm(f=>({...f, urgent:!f.urgent}))} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${form.urgent?"#e8445a":"#ebe9e3"}`, background:form.urgent?"#e8445a":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}>
              {form.urgent && <span style={{ color:"#fff", fontSize:13, fontWeight:900 }}>&#10003;</span>}
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:"#1a2744", margin:0 }}>&#9889; \uAE34\uAE09 \uC694\uCCAD</p>
              <p style={{ fontSize:12, color:"#8a8a9a", margin:"2px 0 0" }}>\uB204\uC218, \uB2E8\uC804, \uBCF4\uC77C\uB7EC \uACE0\uC7A5 \uB4F1 \uC989\uC2DC \uCC98\uB9AC\uAC00 \uD544\uC694\uD55C \uACBD\uC6B0</p>
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !form.desc.trim()}
          style={{ width:"100%", padding:"16px", borderRadius:14, background: !form.desc.trim() ? "#e0e0e0" : form.urgent ? "linear-gradient(135deg,#e8445a,#dc2626)" : "linear-gradient(135deg,#1a2744,#2d4270)", border:"none", color: !form.desc.trim() ? "#aaa" : "#fff", fontWeight:800, fontSize:16, cursor: form.desc.trim() ? "pointer" : "not-allowed", boxShadow: form.desc.trim() ? "0 4px 20px rgba(26,39,68,0.25)" : "none" }}
        >
          {submitting ? "\uC694\uCCAD \uC911..." : "&#128296; \uC218\uB9AC \uC694\uCCAD \uC811\uC218\uD558\uAE30"}
        </button>

        <p style={{ textAlign:"center", fontSize:11, color:"#bbb", marginTop:16 }}>
          \uC774 \uD398\uC774\uC9C0\uB294 \uC784\uB300\uC778\uC774 \uBC1C\uAE09\uD55C \uC804\uC6A9 \uB9C1\uD06C\uC785\uB2C8\uB2E4 &middot; Powered by Ownly
        </p>
      </div>
    </div>
  );
}
