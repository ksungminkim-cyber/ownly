"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../context/AppContext";
import { SectionLabel, toast } from "../../../components/shared";

const C = { navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", purple:"#5b4fcf", border:"#e8e6e0", surface:"#ffffff", faint:"#f8f7f4", muted:"#8a8a9a" };

const CATEGORIES = ["도배/장판","배관/수도","전기","에어컨/냉난방","창문/문","주방","욕실","외벽/지붕","기타"];
const CATEGORY_ICONS = {"도배/장판":"🎨","배관/수도":"🔧","전기":"⚡","에어컨/냉난방":"❄️","창문/문":"🚪","주방":"🍳","욕실":"🚿","외벽/지붕":"🏠","기타":"🔨"};

export default function RepairsPage() {
  const { tenants } = useApp();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("전체");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    category: "기타", vendor: "", cost: 0,
    memo: "", receipt_yn: false, tenant_id: "", property_name: ""
  });

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("repairs").select("*").eq("user_id", user.id).order("date", { ascending: false });
    setRepairs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.category) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { ...form, user_id: user.id, cost: Number(form.cost) || 0,
        tenant_id: form.tenant_id || null, property_name: form.property_name || (form.tenant_id ? tenants.find(t=>t.id===form.tenant_id)?.addr : "") };
      const { error } = await supabase.from("repairs").insert([payload]);
      if (error) throw error;
      toast("수리 이력이 저장됐습니다");
      setShowForm(false);
      setForm({ date: new Date().toISOString().slice(0,10), category:"기타", vendor:"", cost:0, memo:"", receipt_yn:false, tenant_id:"", property_name:"" });
      load();
    } catch { toast("저장 중 오류가 발생했습니다", "error"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await supabase.from("repairs").delete().eq("id", id);
    toast("삭제됐습니다", "warning");
    load();
  };

  const filtered = filterCat === "전체" ? repairs : repairs.filter(r => r.category === filterCat);
  const totalCost = filtered.reduce((s, r) => s + (r.cost || 0), 0);

  return (
    <div className="page-in page-padding" style={{ maxWidth: 900 }}>
      {/* 헤더 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:26, flexWrap:"wrap", gap:12 }}>
        <div>
          <SectionLabel>MAINTENANCE</SectionLabel>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, letterSpacing:"-.4px" }}>수리·유지보수 이력</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:3 }}>물건별 수리 내역을 기록하고 세금 신고 시 비용 증빙으로 활용하세요</p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding:"10px 20px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          + 수리 이력 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:13, marginBottom:20 }}>
        {[
          { label:"전체 건수", value:`${repairs.length}건`, color:C.navy },
          { label:"총 수리비용", value:`${repairs.reduce((s,r)=>s+(r.cost||0),0).toLocaleString()}만원`, color:C.rose },
          { label:"영수증 보관", value:`${repairs.filter(r=>r.receipt_yn).length}건`, color:C.emerald },
        ].map(k => (
          <div key={k.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
            <p style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>{k.label}</p>
            <p style={{ fontSize:20, fontWeight:800, color:k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {["전체", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
              border:`1px solid ${filterCat===c ? C.navy : C.border}`,
              background: filterCat===c ? C.navy : "transparent",
              color: filterCat===c ? "#fff" : C.muted }}>
            {CATEGORY_ICONS[c] || ""} {c}
          </button>
        ))}
      </div>

      {/* 이력 목록 */}
      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:C.muted }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, background:C.faint, borderRadius:16 }}>
          <p style={{ fontSize:36, marginBottom:12 }}>🔨</p>
          <p style={{ fontSize:16, fontWeight:700, color:C.navy }}>수리 이력이 없습니다</p>
          <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>수리·교체 내역을 기록해두면 세금 신고 시 비용 처리에 도움이 됩니다</p>
        </div>
      ) : (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:17, overflow:"hidden" }}>
          <div style={{ padding:"10px 20px", background:"#0a0a10", display:"grid", gridTemplateColumns:"90px 80px 1fr 100px 80px 80px 40px", gap:8 }}>
            {["날짜","분류","상세","업체","비용","영수증",""].map(h=>(
              <span key={h} style={{ fontSize:10, color:"#8a8a9a", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px" }}>{h}</span>
            ))}
          </div>
          {filtered.map((r, i) => (
            <div key={r.id} style={{ display:"grid", gridTemplateColumns:"90px 80px 1fr 100px 80px 80px 40px", gap:8, padding:"13px 20px", borderTop:`1px solid ${C.border}`, background:i%2===0?"transparent":C.faint, alignItems:"center" }}>
              <span style={{ fontSize:12, color:C.muted }}>{r.date}</span>
              <span style={{ fontSize:11, fontWeight:700, color:C.navy }}>{CATEGORY_ICONS[r.category]} {r.category}</span>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:C.navy }}>{r.property_name || "미지정"}</p>
                {r.memo && <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>{r.memo}</p>}
              </div>
              <span style={{ fontSize:12, color:C.muted }}>{r.vendor || "-"}</span>
              <span style={{ fontSize:13, fontWeight:700, color:C.rose }}>{(r.cost||0).toLocaleString()}만원</span>
              <span style={{ fontSize:11, color:r.receipt_yn?C.emerald:C.muted }}>{r.receipt_yn?"✅ 보관":"—"}</span>
              <button onClick={()=>del(r.id)} style={{ width:28, height:28, borderRadius:7, border:"none", background:"rgba(232,68,90,0.1)", color:C.rose, fontSize:12, cursor:"pointer" }}>✕</button>
            </div>
          ))}
          <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"flex-end", gap:20 }}>
            <span style={{ fontSize:12, color:C.muted }}>필터 합계</span>
            <span style={{ fontSize:14, fontWeight:800, color:C.rose }}>{totalCost.toLocaleString()}만원</span>
          </div>
        </div>
      )}

      {/* 추가 모달 */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setShowForm(false)}>
          <div style={{ background:C.surface, borderRadius:20, padding:28, width:"min(480px,94vw)", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:17, fontWeight:800, color:C.navy, marginBottom:20 }}>수리 이력 추가</h3>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* 날짜 */}
              <div>
                <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>수리 날짜</p>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                  style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }} />
              </div>

              {/* 분류 */}
              <div>
                <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>분류</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {CATEGORIES.map(c=>(
                    <button key={c} onClick={()=>setForm(f=>({...f,category:c}))}
                      style={{ padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
                        border:`1px solid ${form.category===c?C.navy:C.border}`,
                        background:form.category===c?C.navy:"transparent",
                        color:form.category===c?"#fff":C.muted }}>
                      {CATEGORY_ICONS[c]} {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* 임차인/물건 */}
              {tenants.length > 0 && (
                <div>
                  <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>연결 임차인 (선택)</p>
                  <select value={form.tenant_id} onChange={e=>setForm(f=>({...f,tenant_id:e.target.value}))}
                    style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }}>
                    <option value="">선택 안 함 (직접 입력)</option>
                    {tenants.map(t=><option key={t.id} value={t.id}>{t.name} — {t.addr}</option>)}
                  </select>
                </div>
              )}

              {!form.tenant_id && (
                <div>
                  <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>물건명</p>
                  <input value={form.property_name} onChange={e=>setForm(f=>({...f,property_name:e.target.value}))} placeholder="예: 서울 마포구 101호"
                    style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }} />
                </div>
              )}

              {/* 업체명 */}
              <div>
                <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>업체명</p>
                <input value={form.vendor} onChange={e=>setForm(f=>({...f,vendor:e.target.value}))} placeholder="예: 홍길동 도배"
                  style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }} />
              </div>

              {/* 비용 */}
              <div>
                <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>비용 (만원)</p>
                <input type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} placeholder="0"
                  style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }} />
              </div>

              {/* 메모 */}
              <div>
                <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>메모</p>
                <textarea value={form.memo} onChange={e=>setForm(f=>({...f,memo:e.target.value}))} rows={2} placeholder="수리 내용 간단히..."
                  style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint, resize:"vertical", outline:"none", fontFamily:"inherit" }} />
              </div>

              {/* 영수증 */}
              <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                <input type="checkbox" checked={form.receipt_yn} onChange={e=>setForm(f=>({...f,receipt_yn:e.target.checked}))} className="custom-check" />
                <span style={{ fontSize:13, color:C.navy, fontWeight:600 }}>영수증 보관 완료</span>
              </label>

              {/* 버튼 */}
              <div style={{ display:"flex", gap:9, marginTop:4 }}>
                <button onClick={()=>setShowForm(false)}
                  style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button>
                <button onClick={save} disabled={saving} className="btn-primary"
                  style={{ flex:2, padding:"12px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  {saving ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
