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
    if (!d) return "\uBBF8\uC124\uC815";
    if (Number(d) === 99) return "\uB9E4\uC6D4 \uB9D0\uC77C";
    return `\uB9E4\uC6D4 ${d}\uC77C`;
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>&#9203;</div>
        <p style={{ fontSize:14, color:"#8a8a9a" }}>\uBD88\uB7EC\uC624\uB294 \uC911...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"'Pretendard',sans-serif", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:320 }}>
        <div style={{ fontSize:44, marginBottom:16 }}>&#128269;</div>
        <h2 style={{ fontSize:18, fontWeight:800, color:"#1a2744", marginBottom:8 }}>\uB9C1\uD06C\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694</h2>
        <p style={{ fontSize:13, color:"#8a8a9a", lineHeight:1.7 }}>\uC798\uBABB\uB41C \uB9C1\uD06C\uC774\uAC70\uB098 \uB9CC\uB8CC\uB41C \uB9C1\uD06C\uC785\uB2C8\uB2E4. \uC784\uB300\uC778\uC5D0\uAC8C \uB2E4\uC2DC \uC694\uCCAD\uD574\uC8FC\uC138\uC694.</p>
      </div>
    </div>
  );

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
      <div style={{ background:"#1a2744", padding:"20px 20px 24px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(145deg,#2d4270,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
            </div>
            <div>
              <p style={{ fontSize:16, fontWeight:800, color:"#fff", margin:0 }}>\uC628\uB9AC</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0 }}>\uC784\uB300 \uACC4\uC57D \uD655\uC778</p>
            </div>
          </div>
          <h1 style={{ fontSize:20, fontWeight:900, color:"#fff", marginBottom:4 }}>\uB0B4 \uACC4\uC57D \uC815\uBCF4</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", margin:0 }}>{data.name}\uB2D8\uC758 \uC784\uB300\uCC28 \uACC4\uC57D \uD604\uD669</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"24px 20px 40px" }}>
        {isExpired && (
          <div style={{ background:"rgba(232,68,90,0.1)", border:"1px solid rgba(232,68,90,0.3)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:18 }}>&#9888;&#65039;</span>
            <div>
              <p style={{ fontSize:13, fontWeight:800, color:"#e8445a", margin:0 }}>\uACC4\uC57D \uAE30\uAC04\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4</p>
              <p style={{ fontSize:11, color:"#8a8a9a", margin:"2px 0 0" }}>\uC784\uB300\uC778\uC5D0\uAC8C \uAC31\uC2E0 \uC5EC\uBD80\uB97C \uD655\uC778\uD558\uC138\uC694</p>
            </div>
          </div>
        )}
        {isExpiringSoon && (
          <div style={{ background:"rgba(232,150,10,0.1)", border:"1px solid rgba(232,150,10,0.3)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:18 }}>&#128197;</span>
            <div>
              <p style={{ fontSize:13, fontWeight:800, color:"#e8960a", margin:0 }}>\uACC4\uC57D \uB9CC\uB8CC D-{dl}</p>
              <p style={{ fontSize:11, color:"#8a8a9a", margin:"2px 0 0" }}>\uC784\uB300\uC778\uACFC \uAC31\uC2E0 \uC5EC\uBD80\uB97C \uBBF8\uB9AC \uC0C1\uC758\uD558\uC138\uC694</p>
            </div>
          </div>
        )}

        <div style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:18, overflow:"hidden", marginBottom:14, boxShadow:"0 2px 12px rgba(26,39,68,0.06)" }}>
          <div style={{ background:"linear-gradient(135deg,rgba(26,39,68,0.04),rgba(91,79,207,0.04))", padding:"16px 20px", borderBottom:"1px solid #ebe9e3" }}>
            <p style={{ fontSize:11, fontWeight:800, color:"#8a8a9a", letterSpacing:"1px", textTransform:"uppercase", margin:"0 0 4px" }}>\uC784\uB300 \uBB3C\uAC74</p>
            <p style={{ fontSize:16, fontWeight:800, color:"#1a2744", margin:0 }}>{addr}</p>
            {data.sub_type && <p style={{ fontSize:12, color:"#8a8a9a", margin:"3px 0 0" }}>{data.sub_type}</p>}
          </div>
          <div style={{ padding:"16px 20px" }}>
            {[
              { label:"\uC6D4\uC138", value:`${rent.toLocaleString()}\uB9CC\uC6D0`, color:"#1a2744", bold:true },
              maint > 0 ? { label:"\uAD00\uB9AC\uBE44", value:`${maint.toLocaleString()}\uB9CC\uC6D0 \uBCC4\uB3C4`, color:"#8a8a9a" } : null,
              maint > 0 ? { label:"\uCD1D \uC6D4 \uB0A9\uBD80\uC561", value:`${rentTotal.toLocaleString()}\uB9CC\uC6D0`, color:"#4f46e5", bold:true } : null,
              { label:"\uBCF4\uC99D\uAE08", value:`${dep.toLocaleString()}\uB9CC\uC6D0`, color:"#1a2744" },
              { label:"\uB0A9\uBD80\uC77C", value:formatPayDay(data.pay_day), color:"#1a2744" },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f5f4f0" }}>
                <span style={{ fontSize:13, color:"#8a8a9a" }}>{row.label}</span>
                <span style={{ fontSize:14, fontWeight:row.bold?800:600, color:row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:18, padding:"16px 20px", marginBottom:14, boxShadow:"0 2px 12px rgba(26,39,68,0.06)" }}>
          <p style={{ fontSize:11, fontWeight:800, color:"#8a8a9a", letterSpacing:"1px", textTransform:"uppercase", marginBottom:14 }}>\uACC4\uC57D \uAE30\uAC04</p>
          {[
            { label:"\uACC4\uC57D \uC2DC\uC791", value:startDate || "\uBBF8\uC785\uB825" },
            { label:"\uACC4\uC57D \uB9CC\uB8CC", value:endDate || "\uBBF8\uC785\uB825" },
            dl !== null ? { label:"\uB9CC\uB8CC\uAE4C\uC9C0", value:dl >= 0 ? `D-${dl}` : `D+${Math.abs(dl)} (\uB9CC\uB8CC\uB428)`, color:dl < 0?"#e8445a":dl<=90?"#e8960a":"#0fa573" } : null,
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f5f4f0" }}>
              <span style={{ fontSize:13, color:"#8a8a9a" }}>{row.label}</span>
              <span style={{ fontSize:14, fontWeight:row.color?800:600, color:row.color||"#1a2744" }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ background:"rgba(26,39,68,0.04)", borderRadius:12, padding:"14px 16px", marginBottom:24 }}>
          <p style={{ fontSize:12, color:"#8a8a9a", lineHeight:1.7, margin:0 }}>
            &bull; \uBCF8 \uD398\uC774\uC9C0\uB294 \uC784\uB300\uC778\uC774 \uBC1C\uAE09\uD55C \uACC4\uC57D \uD655\uC778 \uB9C1\uD06C\uC785\uB2C8\uB2E4.<br/>
            &bull; \uACC4\uC57D \uB0B4\uC6A9 \uBCC0\uACBD\uC740 \uC784\uB300\uC778\uC5D0\uAC8C \uC9C1\uC811 \uBB38\uC758\uD558\uC138\uC694.<br/>
            &bull; \uC774 \uB9C1\uD06C\uB294 \uC5B8\uC81C\uB4E0\uC9C0 \uD655\uC778 \uAC00\uB2A5\uD569\uB2C8\uB2E4.
          </p>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#c0c0cc" }}>
          Powered by <span style={{ fontWeight:700, color:"#8a8a9a" }}>Ownly</span> &middot; \uC784\uB300 \uAD00\uB9AC \uD50C\uB7AB\uD3FC
        </p>
      </div>
    </div>
  );
}
