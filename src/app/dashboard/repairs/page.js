"use client"; import { useState } from "react"; import { useRouter } from "next/navigation"; import { useApp } from "../../../context/AppContext"; import { SectionLabel, toast, EmptyState } from "../../../components/shared"; const C = { navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", purple:"#5b4fcf", border:"#e8e6e0", surface:"#ffffff", faint:"#f8f7f4", muted:"#8a8a9a" }; const CATEGORIES = ["도배/장판","배관/수도","전기","에어컨/냉난방","창문/문","주방","욕실","외벽/지붕","기타"]; const CATEGORY_ICONS = {"도배/장판":"🎨","배관/수도":"🔧","전기":"⚡","에어컨/냉난방":"❄️","창문/문":"🚪","주방":"🍳","욕실":"🚿","외벽/지붕":"🏠","기타":"🔨"};

export default function RepairsPage() {
  // ✅ AppContext에서 repairs, addRepair 사용 (장부 자동 연동)
  const router = useRouter();
  const { tenants, repairs, addRepair, updateRepair, refreshData } = useApp();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("전체");
  const [filterStatus, setFilterStatus] = useState("전체");

  const STATUS_CONFIG = {
    open:        { label: "접수",   color: "#e8445a", bg: "rgba(232,68,90,0.1)" },
    in_progress: { label: "처리 중", color: "#e8960a", bg: "rgba(232,150,10,0.1)" },
    done:        { label: "완료",   color: "#0fa573", bg: "rgba(15,165,115,0.1)" },
  };

  const changeStatus = async (r, nextStatus) => {
    try {
      await updateRepair(r.id, { status: nextStatus, ...(nextStatus === "done" ? { completed_at: new Date().toISOString() } : {}) });
      toast(nextStatus === "in_progress" ? "처리 시작했습니다" : nextStatus === "done" ? "완료 처리됐습니다" : "상태 변경됐습니다");
    } catch (e) {
      toast("상태 변경 중 오류: " + (e.message || ""), "error");
    }
  };
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), category: "기타", vendor: "", cost: 0, memo: "", receipt_yn: false, tenant_id: "", property_name: "" });

  const save = async () => {
    if (!form.category) return;
    setSaving(true);
    try {
      const payload = { ...form, cost: Number(form.cost) || 0, tenant_id: form.tenant_id || null, property_name: form.property_name || (form.tenant_id ? tenants.find(t=>t.id===form.tenant_id)?.addr : "") };
      await addRepair(payload);
      toast("수리 이력이 저장됐습니다 — 간편 장부에도 자동 기록됐어요");
      setShowForm(false);
      setForm({ date: new Date().toISOString().slice(0,10), category:"기타", vendor:"", cost:0, memo:"", receipt_yn:false, tenant_id:"", property_name:"" });
    } catch (e) { toast(`저장 실패: ${e?.message || "알 수 없는 오류"}`, "error"); console.error("[repairs]", e); }
    finally { setSaving(false); }
  };

  let filtered = filterCat === "전체" ? (repairs||[]) : (repairs||[]).filter(r => r.category === filterCat);
  if (filterStatus !== "전체") filtered = filtered.filter(r => (r.status || "done") === filterStatus);
  const totalCost = filtered.reduce((s, r) => s + (r.cost || 0), 0);
  const openCount = (repairs||[]).filter(r => r.status === "open").length;
  const inProgCount = (repairs||[]).filter(r => r.status === "in_progress").length;

  return ( <div className="page-in page-padding" style={{ maxWidth: 900 }}> <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:26, flexWrap:"wrap", gap:12 }}> <div> <SectionLabel>MAINTENANCE</SectionLabel> <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, letterSpacing:"-.4px" }}>수리·유지보수 이력</h1>
      {/* ✅ 장부 자동 연동 안내 */}
      <p style={{ fontSize:13, color:C.muted, marginTop:3 }}>수리비 등록 시 <span style={{ color:"#5b4fcf", fontWeight:700 }}>간편 장부에 자동 기록</span>됩니다 · 세금 신고 시 필요경비로 활용하세요</p>
    </div> <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}><button onClick={() => router.push("/dashboard/repairs/analytics")} style={{ padding:"10px 16px", borderRadius:11, background:"rgba(91,79,207,0.08)", border:"1px solid rgba(91,79,207,0.25)", color:"#5b4fcf", fontWeight:700, fontSize:13, cursor:"pointer" }}>📊 분석 대시보드</button><button onClick={() => setShowForm(true)} style={{ padding:"10px 20px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ 수리 이력 추가</button></div> </div>

    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:13, marginBottom:20 }}> {[ { label:"전체 건수", value:`${(repairs||[]).length}건`, color:C.navy }, { label:"총 수리비용", value:`${(repairs||[]).reduce((s,r)=>s+(r.cost||0),0).toLocaleString()}만원`, color:C.rose }, { label:"영수증 보관", value:`${(repairs||[]).filter(r=>r.receipt_yn).length}건`, color:C.emerald }, ].map(k => ( <div key={k.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}> <p style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>{k.label}</p> <p style={{ fontSize:20, fontWeight:800, color:k.color }}>{k.value}</p> </div> ))} </div>

    {/* 상태 필터 */}
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
      {[
        { k: "전체", label: "전체" },
        { k: "open", label: `📥 접수 ${openCount > 0 ? `(${openCount})` : ""}` },
        { k: "in_progress", label: `⚙️ 처리 중 ${inProgCount > 0 ? `(${inProgCount})` : ""}` },
        { k: "done", label: "✅ 완료" },
      ].map(s => (
        <button key={s.k} onClick={() => setFilterStatus(s.k)}
          style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${filterStatus===s.k ? C.navy : C.border}`, background: filterStatus===s.k ? C.navy : "transparent", color: filterStatus===s.k ? "#fff" : C.muted }}>
          {s.label}
        </button>
      ))}
    </div>
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}> {["전체", ...CATEGORIES].map(c => ( <button key={c} onClick={() => setFilterCat(c)} style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${filterCat===c ? C.navy : C.border}`, background: filterCat===c ? C.navy : "transparent", color: filterCat===c ? "#fff" : C.muted }}>{CATEGORY_ICONS[c] || ""} {c}</button> ))} </div>

    {filtered.length === 0 ? (
      <EmptyState icon="🔨" title="수리 이력이 없습니다" desc="수리·교체 내역을 기록해두면 세금 신고 시 비용 처리에 도움이 됩니다" hint="수리비를 등록하면 간편 장부에도 자동으로 기록됩니다" />
    ) : (
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:17, overflow:"hidden" }}>
        <div style={{ padding:"10px 20px", background:"#0a0a10", display:"grid", gridTemplateColumns:"80px 70px 1fr 90px 70px 90px 80px", gap:8 }}>
          {["날짜","분류","상세","업체","비용","상태","작업"].map(h=>( <span key={h} style={{ fontSize:10, color:"#8a8a9a", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px" }}>{h}</span> ))}
        </div>
        {filtered.map((r, i) => (
          <div key={r.id} style={{ display:"grid", gridTemplateColumns:"80px 70px 1fr 90px 70px 90px 80px", gap:8, padding:"13px 20px", borderTop:`1px solid ${C.border}`, background:i%2===0?"transparent":C.faint, alignItems:"center" }}>
            <span style={{ fontSize:12, color:C.muted }}>{r.date}</span>
            <span style={{ fontSize:11, fontWeight:700, color:C.navy }}>{CATEGORY_ICONS[r.category]} {r.category}</span>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:C.navy, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                {r.property_name || "미지정"}
                {r.source === "tenant" && <span style={{ fontSize:9, fontWeight:800, color:"#5b4fcf", background:"rgba(91,79,207,0.1)", padding:"1px 6px", borderRadius:4 }}>👤 세입자 요청</span>}
                {r.priority === "urgent" && <span style={{ fontSize:9, fontWeight:800, color:"#e8445a", background:"rgba(232,68,90,0.1)", padding:"1px 6px", borderRadius:4 }}>🚨 긴급</span>}
              </p>
              {r.memo && <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>{r.memo}</p>}
            </div>
            <span style={{ fontSize:12, color:C.muted }}>{r.vendor || "-"}</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.rose }}>{r.cost ? (r.cost).toLocaleString() + "만" : "—"}</span>
            {(() => { const st = STATUS_CONFIG[r.status || "done"]; return <span style={{ fontSize:10, fontWeight:800, color:st.color, background:st.bg, padding:"3px 8px", borderRadius:20, whiteSpace:"nowrap", textAlign:"center" }}>{st.label}</span>; })()}
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {(r.status === "open" || !r.status) && r.source === "tenant" && (
                <button onClick={() => changeStatus(r, "in_progress")}
                  style={{ padding:"4px 8px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", border:"1px solid rgba(232,150,10,0.3)", background:"rgba(232,150,10,0.08)", color:"#e8960a" }}>처리 시작</button>
              )}
              {r.status === "in_progress" && (
                <button onClick={() => changeStatus(r, "done")}
                  style={{ padding:"4px 8px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", border:"1px solid rgba(15,165,115,0.3)", background:"rgba(15,165,115,0.08)", color:"#0fa573" }}>완료</button>
              )}
              {r.status === "done" && r.auto_generated && <span style={{ fontSize:9, fontWeight:700, color:"#5b4fcf" }}>📘 장부</span>}
              {r.status === "done" && !r.auto_generated && <span style={{ fontSize:9, color:C.muted }}>—</span>}
            </div>
          </div>
        ))}
        <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"flex-end", gap:20 }}>
          <span style={{ fontSize:12, color:C.muted }}>필터 합계</span>
          <span style={{ fontSize:14, fontWeight:800, color:C.rose }}>{totalCost.toLocaleString()}만원</span>
        </div>
      </div>
    )}

    {showForm && ( <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setShowForm(false)}> <div style={{ background:C.surface, borderRadius:20, padding:28, width:"min(480px,94vw)", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}> <h3 style={{ fontSize:17, fontWeight:800, color:C.navy, marginBottom:8 }}>수리 이력 추가</h3>
      {/* ✅ 장부 자동 기록 안내 */}
      <div style={{ background:"rgba(91,79,207,0.06)", border:"1px solid rgba(91,79,207,0.2)", borderRadius:8, padding:"8px 12px", marginBottom:18, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:14 }}>🤖</span>
        <p style={{ fontSize:11, color:"#5b4fcf", fontWeight:600 }}>저장 시 간편 장부에 수리비 지출이 자동으로 기록됩니다</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}> <div> <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>수리 날짜</p> <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }} /> </div> <div> <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>분류</p> <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}> {CATEGORIES.map(c=>( <button key={c} onClick={()=>setForm(f=>({...f,category:c}))} style={{ padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${form.category===c?C.navy:C.border}`, background:form.category===c?C.navy:"transparent", color:form.category===c?"#fff":C.muted }}>{CATEGORY_ICONS[c]} {c}</button> ))} </div> </div> {tenants.length > 0 && ( <div> <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>연결 임차인 (선택)</p> <select value={form.tenant_id} onChange={e=>setForm(f=>({...f,tenant_id:e.target.value}))} style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }}> <option value="">선택 안 함 (직접 입력)</option> {tenants.map(t=><option key={t.id} value={t.id}>{t.name} — {t.addr}</option>)} </select> </div> )} {!form.tenant_id && ( <div> <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>물건명</p> <input value={form.property_name} onChange={e=>setForm(f=>({...f,property_name:e.target.value}))} placeholder="예: 서울 마포구 101호" style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }} /> </div> )} <div> <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>업체명</p> <input value={form.vendor} onChange={e=>setForm(f=>({...f,vendor:e.target.value}))} placeholder="예: 홍길동 도배" style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }} /> </div> <div> <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>비용 (만원)</p> <input type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} placeholder="0" style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint }} /> </div> <div> <p style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:6 }}>메모</p> <textarea value={form.memo} onChange={e=>setForm(f=>({...f,memo:e.target.value}))} rows={2} placeholder="수리 내용 간단히..." style={{ width:"100%", padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.faint, resize:"vertical", outline:"none", fontFamily:"inherit" }} /> </div> <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}> <input type="checkbox" checked={form.receipt_yn} onChange={e=>setForm(f=>({...f,receipt_yn:e.target.checked}))} className="custom-check" /> <span style={{ fontSize:13, color:C.navy, fontWeight:600 }}>영수증 보관 완료</span> </label> <div style={{ display:"flex", gap:9, marginTop:4 }}> <button onClick={()=>setShowForm(false)} style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button> <button onClick={save} disabled={saving} className="btn-primary" style={{ flex:2, padding:"12px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>{saving ? "저장 중..." : "저장하기"}</button> </div> </div> </div> </div> )}

    <div style={{ marginTop: 28 }}> <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}> <div> <p style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>🤝 Ownly 제휴 업체</p> <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>검증된 업체와 연결해드립니다 · 수리·청소·인테리어</p> </div> <span style={{ fontSize: 10, fontWeight: 800, color: "#0fa573", background: "rgba(15,165,115,0.1)", padding: "3px 10px", borderRadius: 20 }}>파트너</span> </div> <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}> {[ { icon: "🧹", category: "입주청소", desc: "이사 후 전문 청소 서비스", tag: "평균 2시간", cta: "견적 문의", color: "#3b5bdb" }, { icon: "🎨", category: "도배·장판", desc: "방 단위 도배·장판 시공", tag: "당일 시공 가능", cta: "견적 문의", color: "#0fa573" }, { icon: "🔧", category: "설비·보일러", desc: "누수·보일러·전기 수리", tag: "긴급 출동", cta: "연결하기", color: "#e8960a" }, { icon: "❄️", category: "에어컨 청소", desc: "에어컨 분해 청소 전문", tag: "계절 특가", cta: "견적 문의", color: "#5b4fcf" }, { icon: "🪟", category: "창문·방충망", desc: "창문·방충망 교체 설치", tag: "당일 설치", cta: "연결하기", color: "#0891b2" }, { icon: "📸", category: "매물 사진촬영", desc: "임대 매물 전문 사진 촬영", tag: "2시간 출장", cta: "예약하기", color: "#be185d" }, ].map((partner) => ( <div key={partner.category} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all .15s" }} onClick={() => { window.location.href = `mailto:inquiry@mclean21.com?subject=온리 제휴 업체 연결 - ${partner.category}&body=안녕하세요, ${partner.category} 서비스 견적/예약을 문의드립니다.%0D%0A%0D%0A물건 주소:%0D%0A희망 일정:%0D%0A세부 요청사항:%0D%0A`; }} onMouseEnter={e => { e.currentTarget.style.borderColor = partner.color; e.currentTarget.style.boxShadow = `0 4px 14px ${partner.color}20`; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#ebe9e3"; e.currentTarget.style.boxShadow = "none"; }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}> <span style={{ fontSize: 24 }}>{partner.icon}</span> <span style={{ fontSize: 9, fontWeight: 700, color: partner.color, background: partner.color + "15", padding: "2px 7px", borderRadius: 20 }}>{partner.tag}</span> </div> <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>{partner.category}</p> <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 12, lineHeight: 1.5 }}>{partner.desc}</p> <button style={{ width: "100%", padding: "7px 0", borderRadius: 8, background: partner.color + "15", border: `1px solid ${partner.color}30`, color: partner.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{partner.cta} →</button> </div> ))} </div> </div>
  </div> ); }