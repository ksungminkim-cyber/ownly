"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../context/AppContext";
import { SectionLabel, toast } from "../../../components/shared";

const C = { navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", purple:"#5b4fcf", indigo:"#3b5bdb", border:"#e8e6e0", surface:"#ffffff", faint:"#f8f7f4", muted:"#8a8a9a" };

const INCOME_CATS  = ["월세수입","보증금수입","관리비수입","기타수입"];
const EXPENSE_CATS = ["수리비","관리비","세금","보험료","대출이자","광고비","기타지출"];

export default function LedgerPage() {
  const { tenants } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(0); // 0 = 전체
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    type: "income", category:"월세수입", amount:0, memo:"", tenant_id:""
  });

  const load = async () => {
    setLoading(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("ledger").select("*").eq("user_id", user.id).order("date", { ascending:false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.amount || form.amount <= 0) { toast("금액을 입력해주세요", "error"); return; }
    setSaving(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("ledger").insert([{ ...form, user_id:user.id, amount:Number(form.amount), tenant_id:form.tenant_id||null }]);
      if (error) throw error;
      toast("장부가 저장됐습니다");
      setShowForm(false);
      setForm({ date:new Date().toISOString().slice(0,10), type:"income", category:"월세수입", amount:0, memo:"", tenant_id:"" });
      load();
    } catch { toast("저장 중 오류가 발생했습니다", "error"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await supabase.from("ledger").delete().eq("id", id);
    toast("삭제됐습니다", "warning");
    load();
  };

  // 필터
  const filtered = items.filter(i => {
    const d = new Date(i.date);
    if (d.getFullYear() !== viewYear) return false;
    if (viewMonth > 0 && d.getMonth()+1 !== viewMonth) return false;
    return true;
  });

  const totalIncome  = filtered.filter(i=>i.type==="income").reduce((s,i)=>s+(i.amount||0),0);
  const totalExpense = filtered.filter(i=>i.type==="expense").reduce((s,i)=>s+(i.amount||0),0);
  const netIncome = totalIncome - totalExpense;

  // 월별 집계
  const monthlyData = Array.from({length:12},(_,mi)=>{
    const m = mi+1;
    const inc = items.filter(i=>new Date(i.date).getFullYear()===viewYear&&new Date(i.date).getMonth()+1===m&&i.type==="income").reduce((s,i)=>s+(i.amount||0),0);
    const exp = items.filter(i=>new Date(i.date).getFullYear()===viewYear&&new Date(i.date).getMonth()+1===m&&i.type==="expense").reduce((s,i)=>s+(i.amount||0),0);
    return { m, inc, exp, net:inc-exp };
  });
  const maxVal = Math.max(...monthlyData.map(d=>Math.max(d.inc,d.exp)),1);

  return (
    <div className="page-in page-padding" style={{ maxWidth:960 }}>
      {/* 헤더 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:26, flexWrap:"wrap", gap:12 }}>
        <div>
          <SectionLabel>LEDGER</SectionLabel>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, letterSpacing:"-.4px" }}>간편 장부</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:3 }}>임대 수입과 지출을 한눈에 관리하세요</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {/* 연도 선택 */}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"7px 11px" }}>
            <button onClick={()=>setViewYear(y=>y-1)} style={{ width:26,height:26,borderRadius:7,border:"none",background:C.faint,cursor:"pointer",fontSize:14 }}>‹</button>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy, minWidth:58, textAlign:"center" }}>{viewYear}년</span>
            <button onClick={()=>setViewYear(y=>y+1)} style={{ width:26,height:26,borderRadius:7,border:"none",background:C.faint,cursor:"pointer",fontSize:14 }}>›</button>
          </div>
          <button onClick={()=>setShowForm(true)}
            style={{ padding:"10px 20px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            + 내역 추가
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:13, marginBottom:20 }}>
        {[
          { label:"총 수입", value:`${totalIncome.toLocaleString()}만원`, color:C.emerald, bg:"rgba(15,165,115,0.08)" },
          { label:"총 지출", value:`${totalExpense.toLocaleString()}만원`, color:C.rose, bg:"rgba(232,68,90,0.08)" },
          { label:"순수익", value:`${netIncome.toLocaleString()}만원`, color:netIncome>=0?C.indigo:C.rose, bg:netIncome>=0?"rgba(59,91,219,0.08)":"rgba(232,68,90,0.08)" },
        ].map(k=>(
          <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.color}22`, borderRadius:14, padding:"18px 20px" }}>
            <p style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>{k.label}</p>
            <p style={{ fontSize:22, fontWeight:900, color:k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* 월별 차트 */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px", marginBottom:20 }}>
        <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:16 }}>월별 수입/지출</p>
        <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:80 }}>
          {monthlyData.map(d=>(
            <div key={d.m} onClick={()=>setViewMonth(viewMonth===d.m?0:d.m)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer" }}>
              <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:64, gap:2 }}>
                {d.inc>0&&<div style={{ width:"100%", height:`${(d.inc/maxVal)*60}px`, background:viewMonth===d.m?C.emerald:C.emerald+"88", borderRadius:"3px 3px 0 0", minHeight:2 }} />}
                {d.exp>0&&<div style={{ width:"100%", height:`${(d.exp/maxVal)*60}px`, background:viewMonth===d.m?C.rose:C.rose+"88", borderRadius:"3px 3px 0 0", minHeight:2 }} />}
              </div>
              <span style={{ fontSize:9, color:viewMonth===d.m?C.navy:C.muted, fontWeight:viewMonth===d.m?800:500 }}>{d.m}월</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:16, marginTop:8 }}>
          <span style={{ fontSize:11, color:C.emerald }}>■ 수입</span>
          <span style={{ fontSize:11, color:C.rose }}>■ 지출</span>
          {viewMonth>0&&<span style={{ fontSize:11, color:C.navy, fontWeight:700 }}>{viewMonth}월 선택됨 (클릭 해제: 전체)</span>}
        </div>
      </div>

      {/* 월 필터 탭 */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
        {[{v:0,l:"전체"},...Array.from({length:12},(_,i)=>({v:i+1,l:`${i+1}월`}))].map(({v,l})=>(
          <button key={v} onClick={()=>setViewMonth(v)}
            style={{ padding:"5px 11px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer",
              border:`1px solid ${viewMonth===v?C.navy:C.border}`,
              background:viewMonth===v?C.navy:"transparent",
              color:viewMonth===v?"#fff":C.muted }}>
            {l}
          </button>
        ))}
      </div>

      {/* 내역 목록 */}
      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:C.muted }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, background:C.faint, borderRadius:16 }}>
          <p style={{ fontSize:36, marginBottom:12 }}>📒</p>
          <p style={{ fontSize:16, fontWeight:700, color:C.navy }}>내역이 없습니다</p>
          <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>수입·지출 내역을 추가해 보세요</p>
        </div>
      ) : (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:17, overflow:"hidden" }}>
          <div style={{ padding:"10px 20px", background:"#0a0a10", display:"grid", gridTemplateColumns:"90px 60px 100px 1fr 100px 40px", gap:8 }}>
            {["날짜","구분","분류","메모/연결","금액",""].map(h=>(
              <span key={h} style={{ fontSize:10, color:"#4b5563", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px" }}>{h}</span>
            ))}
          </div>
          {filtered.map((item,i)=>{
            const tenant = item.tenant_id ? tenants.find(t=>t.id===item.tenant_id) : null;
            return (
              <div key={item.id} style={{ display:"grid", gridTemplateColumns:"90px 60px 100px 1fr 100px 40px", gap:8, padding:"12px 20px", borderTop:`1px solid ${C.border}`, background:i%2===0?"transparent":C.faint, alignItems:"center" }}>
                <span style={{ fontSize:12, color:C.muted }}>{item.date}</span>
                <span style={{ fontSize:11, fontWeight:800, color:item.type==="income"?C.emerald:C.rose, background:item.type==="income"?"rgba(15,165,115,0.1)":"rgba(232,68,90,0.1)", padding:"2px 8px", borderRadius:20, textAlign:"center" }}>
                  {item.type==="income"?"수입":"지출"}
                </span>
                <span style={{ fontSize:12, color:C.navy, fontWeight:600 }}>{item.category}</span>
                <div>
                  {item.memo&&<p style={{ fontSize:13, color:C.navy }}>{item.memo}</p>}
                  {tenant&&<p style={{ fontSize:11, color:C.muted }}>👤 {tenant.name}</p>}
                </div>
                <span style={{ fontSize:14, fontWeight:800, color:item.type==="income"?C.emerald:C.rose }}>
                  {item.type==="income"?"+":"-"}{(item.amount||0).toLocaleString()}만원
                </span>
                <button onClick={()=>del(item.id)} style={{ width:28,height:28,borderRadius:7,border:"none",background:"rgba(232,68,90,0.1)",color:C.rose,fontSize:12,cursor:"pointer" }}>✕</button>
              </div>
            );
          })}
          <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"flex-end", gap:24 }}>
            <span style={{ fontSize:12, color:C.emerald, fontWeight:700 }}>수입 {totalIncome.toLocaleString()}만원</span>
            <span style={{ fontSize:12, color:C.rose, fontWeight:700 }}>지출 {totalExpense.toLocaleString()}만원</span>
            <span style={{ fontSize:14, fontWeight:900, color:netIncome>=0?C.indigo:C.rose }}>순수익 {netIncome.toLocaleString()}만원</span>
          </div>
        </div>
      )}

      {/* 추가 모달 */}
      {showForm && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>setShowForm(false)}>
          <div style={{ background:C.surface,borderRadius:20,padding:28,width:"min(460px,94vw)",maxHeight:"90vh",overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:17, fontWeight:800, color:C.navy, marginBottom:20 }}>내역 추가</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* 수입/지출 토글 */}
              <div style={{ display:"flex", gap:8 }}>
                {[{v:"income",l:"💰 수입",c:C.emerald},{v:"expense",l:"💸 지출",c:C.rose}].map(({v,l,c})=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,type:v,category:v==="income"?INCOME_CATS[0]:EXPENSE_CATS[0]}))}
                    style={{ flex:1, padding:"11px", borderRadius:11, fontWeight:700, fontSize:13, cursor:"pointer",
                      border:`2px solid ${form.type===v?c:C.border}`,
                      background:form.type===v?`${c}15`:"transparent",
                      color:form.type===v?c:C.muted }}>
                    {l}
                  </button>
                ))}
              </div>

              {/* 날짜 */}
              <div>
                <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>날짜</p>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                  style={{ width:"100%",padding:"11px 13px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.navy,background:C.faint }} />
              </div>

              {/* 분류 */}
              <div>
                <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>분류</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(form.type==="income"?INCOME_CATS:EXPENSE_CATS).map(c=>(
                    <button key={c} onClick={()=>setForm(f=>({...f,category:c}))}
                      style={{ padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
                        border:`1px solid ${form.category===c?(form.type==="income"?C.emerald:C.rose):C.border}`,
                        background:form.category===c?`${form.type==="income"?C.emerald:C.rose}18`:"transparent",
                        color:form.category===c?(form.type==="income"?C.emerald:C.rose):C.muted }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* 금액 */}
              <div>
                <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>금액 (만원)</p>
                <input type="number" value={form.amount||""} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0"
                  style={{ width:"100%",padding:"11px 13px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.navy,background:C.faint }} />
              </div>

              {/* 연결 임차인 */}
              {tenants.length>0&&(
                <div>
                  <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>연결 임차인 (선택)</p>
                  <select value={form.tenant_id} onChange={e=>setForm(f=>({...f,tenant_id:e.target.value}))}
                    style={{ width:"100%",padding:"11px 13px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.navy,background:C.faint }}>
                    <option value="">선택 안 함</option>
                    {tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              {/* 메모 */}
              <div>
                <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>메모</p>
                <input value={form.memo} onChange={e=>setForm(f=>({...f,memo:e.target.value}))} placeholder="간단한 메모..."
                  style={{ width:"100%",padding:"11px 13px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.navy,background:C.faint }} />
              </div>

              <div style={{ display:"flex",gap:9,marginTop:4 }}>
                <button onClick={()=>setShowForm(false)} style={{ flex:1,padding:"12px",borderRadius:11,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,fontWeight:600,fontSize:13,cursor:"pointer" }}>취소</button>
                <button onClick={save} disabled={saving} className="btn-primary"
                  style={{ flex:2,padding:"12px",borderRadius:11,background:`linear-gradient(135deg,${C.navy},${C.purple})`,border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer" }}>
                  {saving?"저장 중...":"저장하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
