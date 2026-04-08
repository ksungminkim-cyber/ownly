"use client"; import { useState, useMemo } from "react"; import { SectionLabel, EmptyState, Modal, AuthInput, toast } from "../../../components/shared"; import { C, COLORS } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; import PlanGate from "../../../components/PlanGate"; import AddressInput from "../../../components/AddressInput"; const TYPE_CONFIG = { 주거: { icon: "🏠", color: C.indigo, subs: ["아파트","빌라","오피스텔","단독주택","원룸","투룸"] }, 상가: { icon: "🏪", color: C.amber, subs: ["1층 상가","집합상가","근린상가","오피스"] }, 오피스텔: { icon: "🏢", color: C.purple, subs: ["오피스텔(주거)","오피스텔(업무)"] }, 토지: { icon: "🌳", color: "#0d9488", subs: ["나대지","농지","임야","대지"] }, }; export default function VacancyPage() { return <PlanGate feature="vacancy"><VacancyContent /></PlanGate>; } function VacancyContent() { const { tenants, vacancies, addVacancy, deleteVacancy, updateTenant } = useApp(); const [showModal, setShowModal] = useState(false); const [saving, setSaving] = useState(false); const [filterType, setFilterType] = useState("전체"); const initForm = () => ({ addr: "", pType: "주거", sub: "아파트", vacantSince: new Date().toISOString().slice(0,10), expectedRent: "", dep: "", maintenance: "", note: "" }); const [form, setForm] = useState(initForm()); const set = (k) => (val) => setForm(f => ({ ...f, [k]: val }));

  // ✅ #6: tenants 중 status="공실"인 것도 통합 표시
  const tenantVacancies = useMemo(() => tenants.filter(t => t.status === "공실").map(t => ({
    _source: "tenant",
    id: "t_" + t.id,
    tenantId: t.id,
    addr: t.addr,
    p_type: t.pType,
    sub_type: t.sub,
    vacant_since: t.start_date || new Date().toISOString().slice(0, 10),
    expected_rent: t.rent || 0,
    deposit: t.dep || 0,
    maintenance: t.maintenance || 0,
    note: t.biz ? `호실: ${t.biz}` : "",
    color: t.color,
  })), [tenants]);

  // 통합 공실 목록 (vacancies 테이블 + tenants 공실)
  const allVacancies = useMemo(() => {
    const dedupAddrs = new Set(vacancies.map(v => v.addr));
    // tenants 공실 중 이미 vacancies에 같은 주소가 있으면 제외 (중복 방지)
    const newTenantVac = tenantVacancies.filter(tv => !dedupAddrs.has(tv.addr));
    return [...vacancies, ...newTenantVac];
  }, [vacancies, tenantVacancies]);

  const totalUnits = tenants.filter(t => t.status !== "공실").length + allVacancies.length;
  const vacancyRate = totalUnits > 0 ? Math.round((allVacancies.length / totalUnits) * 100) : 0; const monthlyLoss = allVacancies.reduce((s, v) => s + (Number(v.expected_rent) || 0), 0); const cumulativeLoss = allVacancies.reduce((s, v) => { const rent = Number(v.expected_rent || 0); const since = v.vacant_since || new Date().toISOString().slice(0, 10); const months = Math.max(0, (new Date() - new Date(since)) / (1000 * 60 * 60 * 24 * 30.44)); return s + rent * months; }, 0); const handleAdd = async () => { if (!form.addr) { toast("주소를 입력하세요", "error"); return; } setSaving(true); try { await addVacancy({ addr: form.addr, p_type: form.pType, sub_type: form.sub, vacant_since: form.vacantSince, expected_rent: Number(form.expectedRent || 0), deposit: Number(form.dep || 0), maintenance: Number(form.maintenance || 0), note: form.note, color: COLORS[Math.floor(Math.random() * COLORS.length)], }); toast("공실이 등록되었습니다"); setShowModal(false); setForm(initForm()); } catch { toast("등록 중 오류가 발생했습니다", "error"); } finally { setSaving(false); } };

  // ✅ #6: 임대 완료 처리 — tenants 공실이면 status 업데이트, vacancies면 delete
  const handleComplete = async (v) => {
    try {
      if (v._source === "tenant") {
        await updateTenant(v.tenantId, { status: "정상" });
        toast("임대 완료 처리되었습니다 — 물건 관리에서 세입자 정보를 업데이트해주세요");
      } else {
        await deleteVacancy(v.id);
        toast("공실이 해소 처리되었습니다");
      }
    } catch { toast("처리 중 오류가 발생했습니다", "error"); }
  };

  const vacantDays = (since) => { const d = Math.ceil((new Date() - new Date(since)) / 86400000); return d < 0 ? 0 : d; }; const getField = (v, ...keys) => { for (const k of keys) if (v[k] !== undefined && v[k] !== null) return v[k]; return ""; }; const filtered = filterType === "전체" ? allVacancies : allVacancies.filter(v => (getField(v, "p_type", "pType") || "주거") === filterType); const showMaint = form.pType === "상가" || form.pType === "오피스텔"; const totalRent = (Number(form.expectedRent || 0) + Number(form.maintenance || 0));

  return ( <div className="page-in page-padding" style={{ maxWidth: 960 }}> <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:22, flexWrap:"wrap", gap:12 }}> <div> <SectionLabel>VACANCY MANAGEMENT</SectionLabel> <h1 style={{ fontSize:24, fontWeight:800, color:"#1a2744" }}>공실 관리</h1>
        {/* ✅ #6: 통합 카운트 표시 */}
        <p style={{ fontSize:13, color:"#8a8a9a", marginTop:3 }}>전체 {totalUnits}실 중 공실 {allVacancies.length}실
          {tenantVacancies.length > 0 && <span style={{ fontSize:11, color:"#5b4fcf", marginLeft:6, fontWeight:600 }}>물건 관리 연동 {tenantVacancies.length}건 포함</span>}
        </p>
      </div> <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding:"10px 20px", borderRadius:11, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ 공실 등록</button> </div>

    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:13, marginBottom:20 }}> {[ { l:"공실률", v:vacancyRate+"%", c:vacancyRate>10?C.rose:C.emerald, sub:vacancyRate>10?"주의 필요":"양호" }, { l:"공실 수", v:allVacancies.length+"실", c:C.amber, sub:`전체 ${totalUnits}실 중` }, { l:"월간 손실 추정", v:monthlyLoss.toLocaleString()+"만원", c:C.rose, sub:"공실 기대 월세 합계" }, { l:"누적 손실 추정", v:Math.round(cumulativeLoss).toLocaleString()+"만원", c:"#c2410c", sub:"공실 시작일 기준 합산" }, { l:"평균 공실 기간", v: allVacancies.length > 0 ? Math.round(allVacancies.reduce((s,v)=>s+vacantDays(getField(v,"vacant_since","vacantSince")||new Date().toISOString().slice(0,10)),0)/allVacancies.length)+"일" : "—", c:C.navy, sub:"공실 평균" }, ].map(k => ( <div key={k.l} style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:15, padding:"18px 20px" }}> <p style={{ fontSize:10, color:"#8a8a9a", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:7 }}>{k.l}</p> <p style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</p> <p style={{ fontSize:11, color:"#8a8a9a", marginTop:3 }}>{k.sub}</p> </div> ))} </div>

    {allVacancies.length > 0 && ( <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}> {["전체", ...Object.keys(TYPE_CONFIG)].map(t => ( <button key={t} onClick={() => setFilterType(t)} style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${filterType===t?"#1a2744":"#ebe9e3"}`, background:filterType===t?"#1a2744":"transparent", color:filterType===t?"#fff":"#8a8a9a" }}> {t !== "전체" ? TYPE_CONFIG[t]?.icon + " " : ""}{t} </button> ))} </div> )}

    {allVacancies.length === 0 ? ( <EmptyState icon="✅" title="공실이 없습니다" desc="모든 호실이 임대 중입니다" action="공실 등록" onAction={() => setShowModal(true)} /> ) : filtered.length === 0 ? ( <EmptyState icon="🔍" title="해당 유형의 공실이 없습니다" desc="다른 유형 필터를 선택해보세요" /> ) : (
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(v => {
          const pType = getField(v, "p_type", "pType") || "주거"; const sub = getField(v, "sub_type", "sub") || ""; const addr = getField(v, "addr", "address") || ""; const since = getField(v, "vacant_since", "vacantSince") || new Date().toISOString().slice(0,10); const rent = Number(getField(v, "expected_rent", "expectedRent") || 0); const dep = Number(getField(v, "deposit", "dep") || 0); const maint = Number(v.maintenance || 0); const days = vacantDays(since); const cfg = TYPE_CONFIG[pType] || TYPE_CONFIG["주거"]; const urgency = days >= 90 ? { c:C.rose, label:"⚠️ 장기공실" } : days >= 30 ? { c:C.amber, label:"🔔 주의" } : { c:C.emerald, label:"🟢 신규" }; const cardCumulativeLoss = Math.round(rent * Math.max(0, days / 30.44)); const fromTenant = v._source === "tenant";
          return ( <div key={v.id} className="hover-lift" style={{ background:"#fff", border:`1px solid ${urgency.c}22`, borderRadius:16, padding:"18px 22px" }}> <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}> <div style={{ flex:1 }}> <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, fontWeight:700, color:cfg.color, background:cfg.color+"18", padding:"2px 8px", borderRadius:5 }}>{cfg.icon} {sub || pType}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:urgency.c, background:urgency.c+"15", padding:"2px 8px", borderRadius:5 }}>{urgency.label} D+{days}</span>
                  {/* ✅ #6: 물건 관리에서 연동된 것 표시 */}
                  {fromTenant && <span style={{ fontSize:10, fontWeight:700, color:"#5b4fcf", background:"rgba(91,79,207,0.1)", padding:"2px 8px", borderRadius:5 }}>🔗 물건 관리 연동</span>}
                  {days >= 90 && <span style={{ fontSize:10, fontWeight:700, color:"#fff", background:C.rose, padding:"2px 8px", borderRadius:5 }}>누적손실 {cardCumulativeLoss.toLocaleString()}만원</span>}
                </div>
                <p style={{ fontSize:15, fontWeight:700, color:"#1a2744", marginBottom:5 }}>{addr}</p>
                <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                  {rent > 0 && <span style={{ fontSize:12, color:"#8a8a9a" }}>💰 기대 월세 <b style={{ color:"#1a2744" }}>{rent.toLocaleString()}만원</b></span>}
                  {dep > 0 && <span style={{ fontSize:12, color:"#8a8a9a" }}>🏦 보증금 <b style={{ color:"#1a2744" }}>{dep.toLocaleString()}만원</b></span>}
                  {maint > 0 && <span style={{ fontSize:12, color:"#8a8a9a" }}>🏢 관리비 <b style={{ color:"#1a2744" }}>{maint.toLocaleString()}만원</b></span>}
                  {rent+maint > 0 && <span style={{ fontSize:12, color:C.emerald, fontWeight:700 }}>총 {(rent+maint).toLocaleString()}만원/월</span>}
                </div>
                {v.note && <p style={{ fontSize:12, color:"#8a8a9a", marginTop:6 }}>📝 {v.note}</p>}
                <p style={{ fontSize:11, color:"#8a8a9a", marginTop:5 }}>공실 시작: {since}</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
                <button onClick={() => handleComplete(v)} style={{ padding:"8px 16px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${C.emerald}40`, background:C.emerald+"18", color:"#0fa573", whiteSpace:"nowrap" }}>✅ 임대 완료</button>
                <p style={{ fontSize:10, color:"#8a8a9a" }}>공실 {days}일째</p>
              </div>
            </div>
          </div> );
        })}
      </div>
    )}

    <Modal open={showModal} onClose={() => { setShowModal(false); setForm(initForm()); }}> <h2 style={{ fontSize:19, fontWeight:800, color:"#1a2744", marginBottom:16 }}>공실 등록</h2> <div style={{ display:"flex", flexDirection:"column", gap:14 }}> <div> <p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:8 }}>물건 유형</p> <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}> {Object.entries(TYPE_CONFIG).map(([type, cfg]) => ( <button key={type} onClick={() => setForm(f => ({ ...f, pType:type, sub:cfg.subs[0] }))} style={{ padding:"9px 0", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", border:`2px solid ${form.pType===type ? cfg.color : "#ebe9e3"}`, background:form.pType===type ? cfg.color+"18" : "transparent", color:form.pType===type ? cfg.color : "#8a8a9a" }}>{cfg.icon} {type}</button> ))} </div> </div> <div> <p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:8 }}>세부 유형</p> <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}> {(TYPE_CONFIG[form.pType]?.subs || []).map(s => ( <button key={s} onClick={() => setForm(f => ({ ...f, sub:s }))} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${form.sub===s ? TYPE_CONFIG[form.pType]?.color : "#ebe9e3"}`, background:form.sub===s ? TYPE_CONFIG[form.pType]?.color+"18" : "transparent", color:form.sub===s ? TYPE_CONFIG[form.pType]?.color : "#8a8a9a" }}>{s}</button> ))} </div> </div> <AddressInput label="주소" value={form.addr} onChange={set("addr")} onSelect={set("addr")} placeholder="마포구 합정동 123" /> <AuthInput label="공실 시작일" type="date" value={form.vacantSince} onChange={e => setForm(f => ({ ...f, vacantSince:e.target.value }))} /> <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}> <AuthInput label="기대 월세 (만원)" placeholder="120" value={form.expectedRent} onChange={e => setForm(f => ({ ...f, expectedRent:e.target.value }))} icon="💰" /> <AuthInput label="보증금 (만원)" placeholder="5000" value={form.dep} onChange={e => setForm(f => ({ ...f, dep:e.target.value }))} icon="🏦" /> </div> {showMaint && ( <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}> <AuthInput label="관리비 (만원/월)" placeholder="15" value={form.maintenance} onChange={e => setForm(f => ({ ...f, maintenance:e.target.value }))} icon="🏢" /> <div style={{ background:"rgba(15,165,115,0.06)", border:"1px solid rgba(15,165,115,0.2)", borderRadius:10, padding:"10px 13px", display:"flex", alignItems:"center" }}> <div> <p style={{ fontSize:11, fontWeight:700, color:"#0fa573", marginBottom:3 }}>총 월 수익 (예상)</p> <p style={{ fontSize:14, fontWeight:800, color:"#1a2744" }}>{totalRent > 0 ? `${totalRent.toLocaleString()}만원` : "—"}</p> <p style={{ fontSize:10, color:"#8a8a9a", marginTop:2 }}>월세 + 관리비</p> </div> </div> </div> )} <div> <p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:7 }}>메모</p> <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note:e.target.value }))} placeholder="공실 관련 메모... (예: 도배 후 임대 예정)" rows={2} style={{ width:"100%", padding:"11px 13px", fontSize:13, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, resize:"vertical", outline:"none", fontFamily:"inherit" }} /> </div> <div style={{ display:"flex", gap:10 }}> <button onClick={() => { setShowModal(false); setForm(initForm()); }} style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid #ebe9e3", color:"#8a8a9a", fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button> <button onClick={handleAdd} disabled={saving} className="btn-primary" style={{ flex:2, padding:"12px", borderRadius:11, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>{saving ? "등록 중..." : "등록하기"}</button> </div> </div> </Modal>
  </div> ); }