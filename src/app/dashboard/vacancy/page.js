"use client"; import { useState, useMemo } from "react"; import { useRouter } from "next/navigation"; import { SectionLabel, EmptyState, Modal, AuthInput, toast, ConfirmDialog } from "../../../components/shared"; import { C, COLORS } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; import PlanGate from "../../../components/PlanGate"; import AddressInput from "../../../components/AddressInput";

const TYPE_CONFIG = { 주거: { icon: "🏠", color: C.indigo, subs: ["아파트","빌라","오피스텔","단독주택","원룸","투룸"] }, 상가: { icon: "🏪", color: C.amber, subs: ["1층 상가","집합상가","근린상가","오피스"] }, 오피스텔: { icon: "🏢", color: C.purple, subs: ["오피스텔(주거)","오피스텔(업무)"] }, 토지: { icon: "🌳", color: "#0d9488", subs: ["나대지","농지","임야","대지"] } };

function buildListingText(v, gf) {
  const sub = gf(v,"sub_type","sub")||""; const addr = gf(v,"addr","address")||"";
  const rent = Number(gf(v,"expected_rent","expectedRent")||0); const dep = Number(gf(v,"deposit","dep")||0); const maint = Number(v.maintenance||0);
  return [`[${sub||gf(v,"p_type","pType")||"주거"} 임대 매물]`,`📍 위치: ${addr}`,dep>0?`💵 보증금: ${dep.toLocaleString()}만원`:null,rent>0?`💰 월세: ${rent.toLocaleString()}만원`:null,maint>0?`🏢 관리비: ${maint.toLocaleString()}만원 별도`:null,v.note?`📝 특이사항: ${v.note}`:null,"","✅ 즉시 입주 가능","📞 문의 주시면 빠른 답변 드립니다"].filter(l=>l!==null).join("\n");
}

export default function VacancyPage() { return <PlanGate feature="vacancy"><VacancyContent /></PlanGate>; }

function VacancyContent() {
  const router = useRouter();
  const { tenants, vacancies, addVacancy, deleteVacancy, updateTenant } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("전체");
  const [completeTarget, setCompleteTarget] = useState(null);
  const [copyTarget, setCopyTarget] = useState(null);

  const initForm = () => ({ addr:"", pType:"주거", sub:"아파트", vacantSince:new Date().toISOString().slice(0,10), expectedRent:"", dep:"", maintenance:"", note:"" });
  const [form, setForm] = useState(initForm());
  const set = (k) => (val) => setForm(f=>({...f,[k]:val}));
  const gf = (v,...keys) => { for(const k of keys) if(v[k]!==undefined&&v[k]!==null) return v[k]; return ""; };

  const tenantVacancies = useMemo(()=>tenants.filter(t=>t.status==="공실").map(t=>({_source:"tenant",id:"t_"+t.id,tenantId:t.id,addr:t.addr,p_type:t.pType,sub_type:t.sub,vacant_since:t.start_date||new Date().toISOString().slice(0,10),expected_rent:t.rent||0,deposit:t.dep||0,maintenance:t.maintenance||0,note:t.biz?`호실: ${t.biz}`:"",color:t.color})),[tenants]);
  const allVacancies = useMemo(()=>{ const s=new Set(vacancies.map(v=>v.addr)); return [...vacancies,...tenantVacancies.filter(tv=>!s.has(tv.addr))]; },[vacancies,tenantVacancies]);
  const totalUnits = tenants.filter(t=>t.status!=="공실").length + allVacancies.length;
  const vacancyRate = totalUnits>0 ? Math.round((allVacancies.length/totalUnits)*100) : 0;
  const monthlyLoss = allVacancies.reduce((s,v)=>s+(Number(v.expected_rent)||0),0);
  const cumulativeLoss = allVacancies.reduce((s,v)=>{ const r=Number(gf(v,"expected_rent","expectedRent")||0); const mo=Math.max(0,(new Date()-new Date(v.vacant_since||new Date().toISOString().slice(0,10)))/(1000*60*60*24*30.44)); return s+r*mo; },0);
  const vacantDays = (since)=>{ const d=Math.ceil((new Date()-new Date(since))/86400000); return d<0?0:d; };
  const filtered = filterType==="전체" ? allVacancies : allVacancies.filter(v=>(gf(v,"p_type","pType")||"주거")===filterType);
  const showMaint = form.pType==="상가"||form.pType==="오피스텔";
  const totalRent = Number(form.expectedRent||0)+Number(form.maintenance||0);

  const handleAdd = async()=>{ if(!form.addr){toast("주소를 입력하세요","error");return;} setSaving(true); try{ await addVacancy({addr:form.addr,p_type:form.pType,sub_type:form.sub,vacant_since:form.vacantSince,expected_rent:Number(form.expectedRent||0),deposit:Number(form.dep||0),maintenance:Number(form.maintenance||0),note:form.note,color:COLORS[Math.floor(Math.random()*COLORS.length)]}); toast("공실이 등록되었습니다"); setShowModal(false); setForm(initForm()); }catch{ toast("등록 중 오류가 발생했습니다","error"); }finally{ setSaving(false); } };
  const handleComplete = async()=>{ const v=completeTarget; if(!v)return; try{ v._source==="tenant" ? await updateTenant(v.tenantId,{status:"정상"}) : await deleteVacancy(v.id); toast("임대 완료 처리되었습니다"); setCompleteTarget(null); router.push("/dashboard/properties"); }catch{ toast("처리 중 오류가 발생했습니다","error"); setCompleteTarget(null); } };

  const copyListing = (v) => {
    const text = buildListingText(v, gf);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(()=>toast("📋 복사 완료! 네이버·직방·다방에 바로 붙여넣기 하세요")).catch(()=>setCopyTarget(v));
    } else { setCopyTarget(v); }
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth:960 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:22, flexWrap:"wrap", gap:12 }}>
        <div>
          <SectionLabel>VACANCY MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#1a2744" }}>공실 관리</h1>
          <p style={{ fontSize:13, color:"#8a8a9a", marginTop:3 }}>전체 {totalUnits}실 중 공실 {allVacancies.length}실 {tenantVacancies.length>0&&<span style={{ fontSize:11, color:"#5b4fcf", marginLeft:6, fontWeight:600 }}>물건 관리 연동 {tenantVacancies.length}건 포함</span>}</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>router.push("/dashboard/premium/ai-report")} style={{ padding:"10px 16px", borderRadius:11, background:"rgba(15,165,115,0.1)", border:"1px solid rgba(15,165,115,0.3)", color:"#0fa573", fontWeight:700, fontSize:12, cursor:"pointer" }}>🤖 AI 적정 시세</button>
          <button onClick={()=>setShowModal(true)} className="btn-primary" style={{ padding:"10px 20px", borderRadius:11, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ 공실 등록</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:13, marginBottom:20 }}>
        {[{l:"공실률",v:vacancyRate+"%",c:vacancyRate>10?C.rose:C.emerald,sub:vacancyRate>10?"주의 필요":"양호"},{l:"공실 수",v:allVacancies.length+"실",c:C.amber,sub:`전체 ${totalUnits}실 중`},{l:"월간 손실 추정",v:monthlyLoss.toLocaleString()+"만원",c:C.rose,sub:"공실 기대 월세 합계"},{l:"누적 손실 추정",v:Math.round(cumulativeLoss).toLocaleString()+"만원",c:"#c2410c",sub:"공실 시작일 기준"},{l:"평균 공실 기간",v:allVacancies.length>0?Math.round(allVacancies.reduce((s,v)=>s+vacantDays(gf(v,"vacant_since","vacantSince")||new Date().toISOString().slice(0,10)),0)/allVacancies.length)+"일":"—",c:C.navy,sub:"공실 평균"}].map(k=>(
          <div key={k.l} style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:15, padding:"18px 20px" }}>
            <p style={{ fontSize:10, color:"#8a8a9a", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:7 }}>{k.l}</p>
            <p style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</p>
            <p style={{ fontSize:11, color:"#8a8a9a", marginTop:3 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {allVacancies.length>0 && (
        <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
          {["전체",...Object.keys(TYPE_CONFIG)].map(t=>(
            <button key={t} onClick={()=>setFilterType(t)} style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${filterType===t?"#1a2744":"#ebe9e3"}`, background:filterType===t?"#1a2744":"transparent", color:filterType===t?"#fff":"#8a8a9a" }}>
              {t!=="전체"?TYPE_CONFIG[t]?.icon+" ":""}{t}
            </button>
          ))}
        </div>
      )}

      {allVacancies.length===0 ? <EmptyState icon="✅" title="공실이 없습니다" desc="모든 호실이 임대 중입니다" action="공실 등록" onAction={()=>setShowModal(true)} />
      : filtered.length===0 ? <EmptyState icon="🔍" title="해당 유형의 공실이 없습니다" desc="다른 유형 필터를 선택해보세요" />
      : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(v=>{
            const pType=gf(v,"p_type","pType")||"주거"; const sub=gf(v,"sub_type","sub")||""; const addr=gf(v,"addr","address")||"";
            const since=gf(v,"vacant_since","vacantSince")||new Date().toISOString().slice(0,10);
            const rent=Number(gf(v,"expected_rent","expectedRent")||0); const dep=Number(gf(v,"deposit","dep")||0); const maint=Number(v.maintenance||0);
            const days=vacantDays(since); const cfg=TYPE_CONFIG[pType]||TYPE_CONFIG["주거"];
            const urgency=days>=90?{c:C.rose,label:"⚠️ 장기공실"}:days>=30?{c:C.amber,label:"🔔 주의"}:{c:C.emerald,label:"🟢 신규"};
            const cardLoss=Math.round(rent*Math.max(0,days/30.44));
            const guide=days>=90
              ?{msg:"장기공실 90일 초과 — 임대료 인하 또는 리모델링 검토를 권장합니다. AI 시세 분석으로 주변 시세를 확인하세요.",c:C.rose,icon:"🚨"}
              :days>=30
              ?{msg:"30일 이상 공실 — 네이버·직방 매물 노출을 확인하고 중개사 접촉을 늘리세요. 아래 복사 버튼으로 즉시 공유하세요.",c:C.amber,icon:"💡"}
              :{msg:"매물 등록 직후 — 아래 복사 버튼으로 네이버·직방·다방에 즉시 게시하세요. 평균 2주 이내 임대 완료됩니다.",c:"#0fa573",icon:"📢"};
            return (
              <div key={v.id} className="hover-lift" style={{ background:"#fff", border:`1px solid ${urgency.c}22`, borderRadius:16, padding:"18px 22px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, fontWeight:700, color:cfg.color, background:cfg.color+"18", padding:"2px 8px", borderRadius:5 }}>{cfg.icon} {sub||pType}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:urgency.c, background:urgency.c+"15", padding:"2px 8px", borderRadius:5 }}>{urgency.label} D+{days}</span>
                      {v._source==="tenant"&&<span style={{ fontSize:10, fontWeight:700, color:"#5b4fcf", background:"rgba(91,79,207,0.1)", padding:"2px 8px", borderRadius:5 }}>🔗 물건 관리 연동</span>}
                      {days>=90&&<span style={{ fontSize:10, fontWeight:700, color:"#fff", background:C.rose, padding:"2px 8px", borderRadius:5 }}>누적손실 {cardLoss.toLocaleString()}만원</span>}
                    </div>
                    <p style={{ fontSize:15, fontWeight:700, color:"#1a2744", marginBottom:5 }}>{addr}</p>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                      {rent>0&&<span style={{ fontSize:12, color:"#8a8a9a" }}>💰 기대 월세 <b style={{ color:"#1a2744" }}>{rent.toLocaleString()}만원</b></span>}
                      {dep>0&&<span style={{ fontSize:12, color:"#8a8a9a" }}>🏦 보증금 <b style={{ color:"#1a2744" }}>{dep.toLocaleString()}만원</b></span>}
                      {maint>0&&<span style={{ fontSize:12, color:"#8a8a9a" }}>🏢 관리비 <b style={{ color:"#1a2744" }}>{maint.toLocaleString()}만원</b></span>}
                    </div>
                    {v.note&&<p style={{ fontSize:12, color:"#8a8a9a", marginTop:5 }}>📝 {v.note}</p>}
                    <p style={{ fontSize:11, color:"#8a8a9a", marginTop:4 }}>공실 시작: {since}</p>
                    {/* ✅ ① 기간별 액션 가이드 */}
                    <div style={{ marginTop:10, padding:"9px 13px", background:guide.c+"10", border:`1px solid ${guide.c}30`, borderRadius:9, display:"flex", alignItems:"flex-start", gap:8 }}>
                      <span style={{ fontSize:14, flexShrink:0 }}>{guide.icon}</span>
                      <p style={{ fontSize:11, color:guide.c, fontWeight:600, margin:0, lineHeight:1.6 }}>{guide.msg}</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:7, alignItems:"stretch", minWidth:140 }}>
                    <button onClick={()=>setCompleteTarget(v)} style={{ padding:"8px 14px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${C.emerald}40`, background:C.emerald+"12", color:"#0fa573" }}>✅ 임대 완료</button>
                    {/* ✅ ① 매물 정보 원클릭 복사 */}
                    <button onClick={()=>copyListing(v)} style={{ padding:"8px 14px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", border:"1px solid rgba(59,91,219,0.35)", background:"rgba(59,91,219,0.07)", color:"#3b5bdb" }}>📋 매물 정보 복사</button>
                    <button onClick={()=>router.push("/dashboard/premium/ai-report")} style={{ padding:"8px 14px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", border:"1px solid rgba(15,165,115,0.3)", background:"rgba(15,165,115,0.06)", color:"#0fa573" }}>🤖 AI 시세 분석</button>
                    <p style={{ fontSize:10, color:"#8a8a9a", textAlign:"center", margin:0 }}>공실 {days}일째</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!copyTarget} onClose={()=>setCopyTarget(null)} width={480}>
        {copyTarget&&(
          <div>
            <h3 style={{ fontSize:16, fontWeight:800, color:"#1a2744", marginBottom:6 }}>📋 매물 정보 복사</h3>
            <p style={{ fontSize:12, color:"#8a8a9a", marginBottom:14 }}>아래를 선택 후 복사 → 네이버·직방·다방에 붙여넣기</p>
            <textarea readOnly value={buildListingText(copyTarget,gf)} rows={10} onClick={e=>e.target.select()} style={{ width:"100%", padding:"12px", fontSize:13, background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, resize:"none", fontFamily:"inherit", color:"#1a2744", cursor:"text" }} />
            <button onClick={()=>setCopyTarget(null)} style={{ width:"100%", marginTop:10, padding:"11px", borderRadius:10, background:"#1a2744", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>닫기</button>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!completeTarget} title="임대 완료 처리" desc={completeTarget?`${gf(completeTarget,"addr","address")} 공실을 임대 완료 처리합니다. 처리 후 물건 관리 페이지로 이동해서 새 세입자 정보를 입력하시겠습니까?`:""} onConfirm={handleComplete} onCancel={()=>setCompleteTarget(null)} />

      <Modal open={showModal} onClose={()=>{ setShowModal(false); setForm(initForm()); }}>
        <h2 style={{ fontSize:19, fontWeight:800, color:"#1a2744", marginBottom:16 }}>공실 등록</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:8 }}>물건 유형</p><div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}>{Object.entries(TYPE_CONFIG).map(([type,cfg])=><button key={type} onClick={()=>setForm(f=>({...f,pType:type,sub:cfg.subs[0]}))} style={{ padding:"9px 0", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", border:`2px solid ${form.pType===type?cfg.color:"#ebe9e3"}`, background:form.pType===type?cfg.color+"18":"transparent", color:form.pType===type?cfg.color:"#8a8a9a" }}>{cfg.icon} {type}</button>)}</div></div>
          <div><p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:8 }}>세부 유형</p><div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{(TYPE_CONFIG[form.pType]?.subs||[]).map(s=><button key={s} onClick={()=>setForm(f=>({...f,sub:s}))} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${form.sub===s?TYPE_CONFIG[form.pType]?.color:"#ebe9e3"}`, background:form.sub===s?TYPE_CONFIG[form.pType]?.color+"18":"transparent", color:form.sub===s?TYPE_CONFIG[form.pType]?.color:"#8a8a9a" }}>{s}</button>)}</div></div>
          <AddressInput label="주소" value={form.addr} onChange={set("addr")} onSelect={set("addr")} placeholder="마포구 합정동 123" />
          <AuthInput label="공실 시작일" type="date" value={form.vacantSince} onChange={e=>setForm(f=>({...f,vacantSince:e.target.value}))} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}><AuthInput label="기대 월세 (만원)" placeholder="120" value={form.expectedRent} onChange={e=>setForm(f=>({...f,expectedRent:e.target.value}))} icon="💰" /><AuthInput label="보증금 (만원)" placeholder="5000" value={form.dep} onChange={e=>setForm(f=>({...f,dep:e.target.value}))} icon="🏦" /></div>
          {showMaint&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}><AuthInput label="관리비 (만원/월)" placeholder="15" value={form.maintenance} onChange={e=>setForm(f=>({...f,maintenance:e.target.value}))} icon="🏢" /><div style={{ background:"rgba(15,165,115,0.06)", border:"1px solid rgba(15,165,115,0.2)", borderRadius:10, padding:"10px 13px" }}><p style={{ fontSize:11, fontWeight:700, color:"#0fa573", marginBottom:3 }}>총 월 수익 (예상)</p><p style={{ fontSize:14, fontWeight:800, color:"#1a2744" }}>{totalRent>0?`${totalRent.toLocaleString()}만원`:"—"}</p></div></div>}
          <div><p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:7 }}>메모</p><textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="공실 관련 메모..." rows={2} style={{ width:"100%", padding:"11px 13px", fontSize:13, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, resize:"vertical", outline:"none", fontFamily:"inherit" }} /></div>
          <div style={{ display:"flex", gap:10 }}><button onClick={()=>{ setShowModal(false); setForm(initForm()); }} style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid #ebe9e3", color:"#8a8a9a", fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button><button onClick={handleAdd} disabled={saving} className="btn-primary" style={{ flex:2, padding:"12px", borderRadius:11, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>{saving?"등록 중...":"등록하기"}</button></div>
        </div>
      </Modal>
    </div>
  );
}
