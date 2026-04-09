"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const CATS = ["도배/장판","배관/수도","전기","에어컨/냉난방","창문/문","주방","욕실","외벽/지붕","기타"];
const ICONS = {"도배/장판":"🎨","배관/수도":"🔧","전기":"⚡","에어컨/냉난방":"❄️","창문/문":"🚪","주방":"🍳","욕실":"🚿","외벽/지붕":"🏠","기타":"🔨"};

export default function RepairRequestPage() {
  const params = useParams();
  const tenantId = params.tenantId;
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cat, setCat] = useState("기타");
  const [desc, setDesc] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!tenantId) { setNotFound(true); setLoading(false); return; }
    supabase.from("tenants").select("id, name, address, user_id").eq("id", tenantId).single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); } else { setTenant(data); }
        setLoading(false);
      });
  }, [tenantId]);

  const submit = async () => {
    if (!desc.trim() || submitting) return;
    setSubmitting(true);
    setErrMsg("");
    const memo = urgent ? "[긴급] " + desc : desc;
    const { error } = await supabase.from("repairs").insert([{
      tenant_id: tenantId,
      user_id: tenant.user_id,
      category: cat,
      memo,
      date: new Date().toISOString().slice(0, 10),
      cost: 0,
      receipt_yn: false,
      vendor: "",
      property_name: tenant.address || "",
    }]);
    if (error) { setErrMsg(error.message); setSubmitting(false); }
    else { setDone(true); }
  };

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f4f0"}}><p style={{color:"#8a8a9a"}}>불러오는 중...</p></div>;

  if (notFound) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f4f0",padding:20}}>
      <div style={{textAlign:"center",maxWidth:320}}>
        <div style={{fontSize:48,marginBottom:16}}>🔍</div>
        <h2 style={{fontSize:18,fontWeight:800,color:"#1a2744",marginBottom:8}}>링크를 확인해주세요</h2>
        <p style={{fontSize:13,color:"#8a8a9a"}}>잘못된 링크이거나 만료된 링크입니다.</p>
      </div>
    </div>
  );

  if (done) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f4f0",padding:20}}>
      <div style={{textAlign:"center",maxWidth:360}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(15,165,115,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"0 auto 20px"}}>✅</div>
        <h2 style={{fontSize:20,fontWeight:900,color:"#1a2744",marginBottom:8}}>수리 요청이 접수됐습니다</h2>
        <p style={{fontSize:14,color:"#8a8a9a",lineHeight:1.7,marginBottom:24}}>임대인에게 알림이 전송됐습니다. 빠른 시일 내에 연락 드릴게요.</p>
        <div style={{background:"#fff",border:"1px solid #ebe9e3",borderRadius:14,padding:"16px 20px",textAlign:"left"}}>
          <p style={{fontSize:11,color:"#8a8a9a",fontWeight:700,marginBottom:6}}>접수 내용</p>
          <p style={{fontSize:13,fontWeight:700,color:"#1a2744",marginBottom:4}}>{ICONS[cat]} {cat}</p>
          <p style={{fontSize:13,color:"#4a5568"}}>{desc}</p>
          {urgent && <span style={{display:"inline-block",marginTop:8,fontSize:11,fontWeight:800,color:"#e8445a",background:"rgba(232,68,90,0.1)",padding:"2px 8px",borderRadius:20}}>⚡ 긴급</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f5f4f0",fontFamily:"'Pretendard','DM Sans',sans-serif",paddingBottom:40}}>
      <div style={{background:"#1a2744",padding:"20px 20px 24px"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(145deg,#2d4270,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
            </div>
            <span style={{fontSize:16,fontWeight:800,color:"#fff"}}>온리</span>
          </div>
          <h1 style={{fontSize:20,fontWeight:900,color:"#fff",marginBottom:4}}>🔨 수리 요청</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>{tenant?.address || ""} · {tenant?.name || ""}</p>
        </div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{background:"#fff",borderRadius:16,padding:"20px",marginBottom:14,border:"1px solid #ebe9e3"}}>
          <p style={{fontSize:12,fontWeight:800,color:"#8a8a9a",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>수리 분야</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{padding:"10px 4px",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",textAlign:"center",
                  border:`1.5px solid ${cat===c?"#1a2744":"#ebe9e3"}`,
                  background:cat===c?"#1a2744":"transparent",
                  color:cat===c?"#fff":"#4a5568"}}>
                <div style={{fontSize:18,marginBottom:3}}>{ICONS[c]}</div>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:"20px",marginBottom:14,border:"1px solid #ebe9e3"}}>
          <p style={{fontSize:12,fontWeight:800,color:"#8a8a9a",letterSpacing:"1px",textTransform:"uppercase",marginBottom:12}}>상세 내용 *</p>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={5}
            placeholder="어떤 문제가 발생했는지 자세히 알려주세요."
            style={{width:"100%",padding:"12px 14px",fontSize:14,color:"#1a2744",background:"#f8f7f4",
              border:`1px solid ${desc.trim()?"#1a2744":"#ebe9e3"}`,
              borderRadius:10,resize:"vertical",outline:"none",fontFamily:"inherit",lineHeight:1.7,boxSizing:"border-box"}}
          />
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:"16px 20px",marginBottom:20,border:"1px solid #ebe9e3"}}>
          <div onClick={() => setUrgent(u => !u)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
            <div style={{width:22,height:22,borderRadius:6,
              border:`2px solid ${urgent?"#e8445a":"#ebe9e3"}`,
              background:urgent?"#e8445a":"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {urgent && <span style={{color:"#fff",fontSize:13,fontWeight:900}}>✓</span>}
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:"#1a2744",margin:0}}>⚡ 긴급 요청</p>
              <p style={{fontSize:12,color:"#8a8a9a",margin:"2px 0 0"}}>누수, 단전, 보일러 고장 등 즉시 처리가 필요한 경우</p>
            </div>
          </div>
        </div>

        {errMsg && (
          <div style={{background:"rgba(232,68,90,0.08)",border:"1px solid rgba(232,68,90,0.3)",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
            <p style={{fontSize:12,color:"#e8445a",margin:0}}>⚠ {errMsg}</p>
          </div>
        )}

        <button onClick={submit} disabled={submitting || !desc.trim()}
          style={{width:"100%",padding:"16px",borderRadius:14,
            background: !desc.trim() ? "#e0e0e0" : urgent ? "linear-gradient(135deg,#e8445a,#dc2626)" : "linear-gradient(135deg,#1a2744,#2d4270)",
            border:"none",color: !desc.trim() ? "#aaa" : "#fff",
            fontWeight:800,fontSize:16,cursor: desc.trim() && !submitting ? "pointer" : "not-allowed",
            boxShadow: desc.trim() ? "0 4px 20px rgba(26,39,68,0.25)" : "none"}}>
          {submitting ? "접수 중..." : "🔨 수리 요청 접수하기"}
        </button>

        <p style={{textAlign:"center",fontSize:11,color:"#bbb",marginTop:16}}>
          이 페이지는 임대인이 발급한 전용 링크입니다 · Powered by Ownly
        </p>
      </div>
    </div>
  );
}
