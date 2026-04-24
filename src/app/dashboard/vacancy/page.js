"use client"; import { useState, useMemo } from "react"; import { useRouter } from "next/navigation"; import { SectionLabel, EmptyState, Modal, AuthInput, toast, ConfirmDialog } from "../../../components/shared"; import { C, COLORS } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; import { supabase } from "../../../lib/supabase"; import PlanGate from "../../../components/PlanGate"; import AddressInput from "../../../components/AddressInput";

const TYPE_CONFIG = { 주거: { icon: "🏠", color: C.indigo, subs: ["아파트","빌라","오피스텔","단독주택","원룸","투룸"] }, 상가: { icon: "🏪", color: C.amber, subs: ["1층 상가","집합상가","근린상가","오피스"] }, 오피스텔: { icon: "🏢", color: C.purple, subs: ["오피스텔(주거)","오피스텔(업무)"] }, 토지: { icon: "🌳", color: "#0d9488", subs: ["나대지","농지","임야","대지"] } };

// 공실 기간별 액션플랜 단계
const ACTION_PLAN = {
  new: {
    label: "신규 공실 (0~14일)", color: "#0fa573", icon: "📢",
    steps: [
      { id: "photo", icon: "📸", text: "매물 사진 촬영 (밝은 낮 시간, 최소 10장)" },
      { id: "copy", icon: "📋", text: "아래 매물 정보 복사 → 네이버·직방·다방 동시 등록" },
      { id: "agent", icon: "🤝", text: "인근 중개사 2~3곳에 매물 공유" },
      { id: "price", icon: "💰", text: "AI 시세 분석으로 적정 임대료 확인" },
    ]
  },
  warn: {
    label: "주의 단계 (15~60일)", color: C.amber, icon: "⚠️",
    steps: [
      { id: "reprice", icon: "📉", text: "임대료 5~10% 인하 검토 (AI 시세 재확인)" },
      { id: "moreagent", icon: "🏘️", text: "중개사 추가 접촉 — 이번 달 내 성사 시 중개비 인센티브 제안" },
      { id: "listing", icon: "🔄", text: "매물 게시 갱신 (7일마다 끌어올리기)" },
      { id: "repair", icon: "🔧", text: "소규모 수리·청소로 매물 컨디션 개선" },
    ]
  },
  danger: {
    label: "중기 공실 (61~90일)", color: "#f97316", icon: "🔔",
    steps: [
      { id: "bigcut", icon: "💸", text: "임대료 10~20% 인하 또는 보증금 조정 고려" },
      { id: "remodel", icon: "🎨", text: "도배·장판 등 리모델링으로 경쟁력 회복" },
      { id: "tax", icon: "🧾", text: "공실 기간 필요경비(관리비·대출이자) 세금 관리 탭에 등록" },
      { id: "shortterm", icon: "📅", text: "단기 임대 또는 용도 변경 검토" },
    ]
  },
  critical: {
    label: "장기 공실 (91~180일)", color: C.rose, icon: "🚨",
    steps: [
      { id: "consult", icon: "👨‍💼", text: "세무사·공인중개사 전문 상담 — 매각 vs 유지 손익 비교" },
      { id: "pricereset", icon: "🔃", text: "시세 20~30% 인하 또는 권리금 조정 협상" },
      { id: "contents", icon: "🏪", text: "팝업스토어·단기 임대 플랫폼 활용 검토" },
      { id: "sellplan", icon: "📊", text: "보유·매각 시뮬레이션으로 의사결정 근거 확보" },
    ]
  },
  longterm: {
    label: "초장기 공실 (180일+)", color: "#7c1d1d", icon: "⛔",
    steps: [
      { id: "rezone", icon: "🏗️", text: "용도 변경·리모델링 전환 검토 (상가→사무실·주거, 사무실→쉐어오피스)" },
      { id: "rentfree", icon: "🎁", text: "렌트프리 1~3개월 제안 + 단계별 임대료 구조 (1년차 저가, 2년차 정상) 설계" },
      { id: "brokerboost", icon: "💎", text: "중개수수료 2배 인센티브 제시 — 복수 중개사 경쟁 유도" },
      { id: "shortplatform", icon: "🏪", text: "공유오피스·팝업·위워크 스타일 단기 임대 플랫폼 적극 활용" },
      { id: "sellcompare", icon: "⚖️", text: "매각 vs 유지 시뮬레이션 — 기회비용(1년 손실)을 기준가에 반영" },
      { id: "taxoptimize", icon: "🧾", text: "장기 공실 필요경비 종합소득세 절세 구조 최적화 (세무사 상담 필수)" },
    ]
  }
};

function getActionPlan(days) {
  if (days >= 180) return ACTION_PLAN.longterm;
  if (days >= 91) return ACTION_PLAN.critical;
  if (days >= 61) return ACTION_PLAN.danger;
  if (days >= 15) return ACTION_PLAN.warn;
  return ACTION_PLAN.new;
}

function buildListingText(v, gf) { const sub = gf(v,"sub_type","sub")||""; const addr = gf(v,"addr","address")||""; const rent = Number(gf(v,"expected_rent","expectedRent")||0); const dep = Number(gf(v,"deposit","dep")||0); const maint = Number(v.maintenance||0); return [`[${sub||gf(v,"p_type","pType")||"주거"} 임대 매물]`,`📍 위치: ${addr}`,dep>0?`💵 보증금: ${dep.toLocaleString()}만원`:null,rent>0?`💰 월세: ${rent.toLocaleString()}만원`:null,maint>0?`🏢 관리비: ${maint.toLocaleString()}만원 별도`:null,v.note?`📝 특이사항: ${v.note}`:null,"","✅ 즉시 입주 가능","📞 문의 주시면 빠른 답변 드립니다"].filter(l=>l!==null).join("\n"); }

// 상가 biz 필드(JSON 또는 plain text)에서 업종명만 추출
function extractIndustry(biz) {
  if (!biz) return "";
  try {
    const obj = JSON.parse(biz);
    if (obj && typeof obj === "object") return obj.industry || "";
  } catch {}
  return String(biz);
}

export default function VacancyPage() { return <PlanGate feature="vacancy"><VacancyContent /></PlanGate>; }

function VacancyContent() {
  const router = useRouter();
  const { tenants, vacancies, addVacancy, deleteVacancy, updateTenant, setVacancies } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("전체");
  const [completeTarget, setCompleteTarget] = useState(null);
  const [copyTarget, setCopyTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // 편집 중인 공실 id (null이면 신규)
  const [openPlan, setOpenPlan] = useState(null); // 액션플랜 열린 공실 id
  const [checkedSteps, setCheckedSteps] = useState({}); // {vacancyId_stepId: bool}

  const initForm = () => ({ addr:"", pType:"주거", sub:"아파트", vacantSince:new Date().toISOString().slice(0,10), expectedRent:"", dep:"", maintenance:"", note:"" });
  const [form, setForm] = useState(initForm());
  const set = (k) => (val) => setForm(f=>({...f,[k]:val}));
  const gf = (v,...keys) => { for(const k of keys) if(v[k]!==undefined&&v[k]!==null) return v[k]; return ""; };

  const tenantVacancies = useMemo(()=>tenants.filter(t=>t.status==="공실").map(t=>{const industry=extractIndustry(t.biz);return {_source:"tenant",id:"t_"+t.id,tenantId:t.id,addr:t.addr,p_type:t.pType,sub_type:t.sub,vacant_since:t.start_date||new Date().toISOString().slice(0,10),expected_rent:t.rent||0,deposit:t.dep||0,maintenance:t.maintenance||0,note:industry?`추천 업종: ${industry}`:"",color:t.color};}),[tenants]);
  const allVacancies = useMemo(()=>{ const s=new Set(vacancies.map(v=>v.addr)); return [...vacancies,...tenantVacancies.filter(tv=>!s.has(tv.addr))]; },[vacancies,tenantVacancies]);
  const totalUnits = tenants.filter(t=>t.status!=="공실").length + allVacancies.length;
  const vacancyRate = totalUnits>0 ? Math.round((allVacancies.length/totalUnits)*100) : 0;
  const monthlyLoss = allVacancies.reduce((s,v)=>s+(Number(v.expected_rent)||0),0);
  const cumulativeLoss = allVacancies.reduce((s,v)=>{ const r=Number(gf(v,"expected_rent","expectedRent")||0); const mo=Math.max(0,(new Date()-new Date(v.vacant_since||new Date().toISOString().slice(0,10)))/(1000*60*60*24*30.44)); return s+r*mo; },0);
  const vacantDays = (since)=>{ const d=Math.ceil((new Date()-new Date(since))/86400000); return d<0?0:d; };
  const filtered = filterType==="전체" ? allVacancies : allVacancies.filter(v=>(gf(v,"p_type","pType")||"주거")===filterType);
  const showMaint = form.pType==="상가"||form.pType==="오피스텔";
  const totalRent = Number(form.expectedRent||0)+Number(form.maintenance||0);

  const toggleStep = (vacId, stepId) => {
    const key = `${vacId}_${stepId}`;
    setCheckedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdd = async()=>{
    if(!form.addr){toast("주소를 입력하세요","error");return;}
    setSaving(true);
    try{
      const payload = { addr:form.addr, p_type:form.pType, sub_type:form.sub, vacant_since:form.vacantSince, expected_rent:Number(form.expectedRent||0), deposit:Number(form.dep||0), maintenance:Number(form.maintenance||0), note:form.note };
      if (editTarget) {
        // 수정
        const { data: updated, error } = await supabase.from("vacancies").update(payload).eq("id", editTarget).select().single();
        if (error) throw error;
        setVacancies(prev => prev.map(v => v.id === editTarget ? updated : v));
        toast("공실 정보가 수정되었습니다");
      } else {
        // 신규
        await addVacancy({ ...payload, color:COLORS[Math.floor(Math.random()*COLORS.length)] });
        toast("공실이 등록되었습니다");
      }
      setShowModal(false); setEditTarget(null); setForm(initForm());
    }catch(err){ toast("처리 중 오류: " + (err.message || ""), "error"); }
    finally{ setSaving(false); }
  };
  const handleDelete = async()=>{
    const v = deleteTarget;
    if (!v) return;
    try {
      await deleteVacancy(v.id);
      toast("공실이 삭제되었습니다");
      setDeleteTarget(null);
    } catch { toast("삭제 중 오류가 발생했습니다","error"); setDeleteTarget(null); }
  };
  const startEdit = (v) => {
    setEditTarget(v.id);
    setForm({
      addr: gf(v,"addr","address") || "",
      pType: gf(v,"p_type","pType") || "주거",
      sub: gf(v,"sub_type","sub") || "아파트",
      vacantSince: gf(v,"vacant_since","vacantSince") || new Date().toISOString().slice(0,10),
      expectedRent: String(gf(v,"expected_rent","expectedRent") || ""),
      dep: String(gf(v,"deposit","dep") || ""),
      maintenance: String(v.maintenance || ""),
      note: v.note || "",
    });
    setShowModal(true);
  };
  const handleComplete = async()=>{ const v=completeTarget; if(!v)return; try{ v._source==="tenant" ? await updateTenant(v.tenantId,{status:"정상"}) : await deleteVacancy(v.id); toast("임대 완료 처리되었습니다"); setCompleteTarget(null); router.push("/dashboard/properties"); }catch{ toast("처리 중 오류가 발생했습니다","error"); setCompleteTarget(null); } };
  const copyListing = (v) => { const text = buildListingText(v, gf); if (navigator.clipboard) { navigator.clipboard.writeText(text).then(()=>toast("📋 복사 완료! 네이버·직방·다방에 바로 붙여넣기 하세요")).catch(()=>setCopyTarget(v)); } else { setCopyTarget(v); } };

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

      {/* ✅ 상단 지표 카드 - 누적 손실 강조 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:13, marginBottom: cumulativeLoss > 0 ? 0 : 20 }}>
        {[
          {l:"공실률",v:vacancyRate+"%",c:vacancyRate>10?C.rose:C.emerald,sub:vacancyRate>10?"주의 필요":"양호"},
          {l:"공실 수",v:allVacancies.length+"실",c:C.amber,sub:`전체 ${totalUnits}실 중`},
          {l:"월간 손실 추정",v:monthlyLoss.toLocaleString()+"만원",c:C.rose,sub:"공실 기대 월세 합계"},
          {l:"평균 공실 기간",v:allVacancies.length>0?Math.round(allVacancies.reduce((s,v)=>s+vacantDays(gf(v,"vacant_since","vacantSince")||new Date().toISOString().slice(0,10)),0)/allVacancies.length)+"일":"—",c:C.navy,sub:"공실 평균"},
        ].map(k=>(
          <div key={k.l} style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:15, padding:"18px 20px" }}>
            <p style={{ fontSize:10, color:"#8a8a9a", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:7 }}>{k.l}</p>
            <p style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</p>
            <p style={{ fontSize:11, color:"#8a8a9a", marginTop:3 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ✅ 누적 손실 강조 배너 */}
      {cumulativeLoss > 0 && (
        <div style={{ margin:"14px 0 20px", padding:"18px 22px", background:"linear-gradient(135deg, #7f1d1d, #991b1b)", borderRadius:15, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>공실 시작일 기준 누적 손실 추정</p>
            <p style={{ fontSize:32, fontWeight:900, color:"#fff", margin:0, letterSpacing:"-1px" }}>
              {Math.round(cumulativeLoss).toLocaleString()}<span style={{ fontSize:16, fontWeight:600, marginLeft:4 }}>만원</span>
            </p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)", marginTop:4 }}>
              하루 더 공실이면 <b style={{ color:"#fca5a5" }}>+{Math.round(monthlyLoss/30).toLocaleString()}만원</b> 추가 손실
            </p>
          </div>
          <button onClick={()=>router.push("/dashboard/premium/ai-report")} style={{ padding:"11px 20px", borderRadius:11, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }}>
            🤖 AI 시세 분석으로 해결하기 →
          </button>
        </div>
      )}

      {allVacancies.length>0 && (
        <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
          {["전체",...Object.keys(TYPE_CONFIG)].map(t=>(
            <button key={t} onClick={()=>setFilterType(t)} style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${filterType===t?"#1a2744":"#ebe9e3"}`, background:filterType===t?"#1a2744":"transparent", color:filterType===t?"#fff":"#8a8a9a" }}>
              {t!=="전체"?TYPE_CONFIG[t]?.icon+" ":""}{t}
            </button>
          ))}
        </div>
      )}

      {allVacancies.length===0 ? (
        <EmptyState icon="✅" title="공실이 없습니다" desc="모든 호실이 임대 중입니다" action="공실 등록" onAction={()=>setShowModal(true)} />
      ) : filtered.length===0 ? (
        <EmptyState icon="🔍" title="해당 유형의 공실이 없습니다" desc="다른 유형 필터를 선택해보세요" />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {filtered.map(v=>{
            const pType=gf(v,"p_type","pType")||"주거";
            const sub=gf(v,"sub_type","sub")||"";
            const addr=gf(v,"addr","address")||"";
            const since=gf(v,"vacant_since","vacantSince")||new Date().toISOString().slice(0,10);
            const rent=Number(gf(v,"expected_rent","expectedRent")||0);
            const dep=Number(gf(v,"deposit","dep")||0);
            const maint=Number(v.maintenance||0);
            const days=vacantDays(since);
            const cfg=TYPE_CONFIG[pType]||TYPE_CONFIG["주거"];
            const urgency=days>=180?{c:"#7c1d1d",label:"⛔ 초장기"}:days>=91?{c:C.rose,label:"🚨 장기공실"}:days>=61?{c:"#f97316",label:"🔔 중기"}:days>=15?{c:C.amber,label:"⚠️ 주의"}:{c:C.emerald,label:"🟢 신규"};
            const cardLoss=Math.round(rent*Math.max(0,days/30.44));
            const plan = getActionPlan(days);
            const isOpen = openPlan === v.id;
            const doneCount = plan.steps.filter(s => checkedSteps[`${v.id}_${s.id}`]).length;

            return (
              <div key={v.id} style={{ background:"#fff", border:`1.5px solid ${urgency.c}30`, borderRadius:16, overflow:"hidden" }}>
                {/* 카드 메인 */}
                <div style={{ padding:"18px 22px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, fontWeight:700, color:cfg.color, background:cfg.color+"18", padding:"2px 8px", borderRadius:5 }}>{cfg.icon} {sub||pType}</span>
                        <span style={{ fontSize:10, fontWeight:700, color:urgency.c, background:urgency.c+"15", padding:"2px 8px", borderRadius:5 }}>{urgency.label} D+{days}</span>
                        {v._source==="tenant"&&<span style={{ fontSize:10, fontWeight:700, color:"#5b4fcf", background:"rgba(91,79,207,0.1)", padding:"2px 8px", borderRadius:5 }}>🔗 물건 관리 연동</span>}
                      </div>
                      <p style={{ fontSize:15, fontWeight:700, color:"#1a2744", marginBottom:5 }}>{addr}</p>
                      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                        {rent>0&&<span style={{ fontSize:12, color:"#8a8a9a" }}>💰 기대 월세 <b style={{ color:"#1a2744" }}>{rent.toLocaleString()}만원</b></span>}
                        {dep>0&&<span style={{ fontSize:12, color:"#8a8a9a" }}>🏦 보증금 <b style={{ color:"#1a2744" }}>{dep.toLocaleString()}만원</b></span>}
                        {maint>0&&<span style={{ fontSize:12, color:"#8a8a9a" }}>🏢 관리비 <b style={{ color:"#1a2744" }}>{maint.toLocaleString()}만원</b></span>}
                      </div>
                      {v.note&&<p style={{ fontSize:12, color:"#8a8a9a", marginTop:5 }}>📝 {v.note}</p>}
                      <p style={{ fontSize:11, color:"#8a8a9a", marginTop:4 }}>공실 시작: {since}</p>

                      {/* 누적 손실 인라인 */}
                      {cardLoss > 0 && (
                        <div style={{ marginTop:8, display:"inline-flex", alignItems:"center", gap:6, background:urgency.c+"12", border:`1px solid ${urgency.c}30`, borderRadius:8, padding:"5px 10px" }}>
                          <span style={{ fontSize:11, fontWeight:800, color:urgency.c }}>누적 손실 추정 {cardLoss.toLocaleString()}만원</span>
                          <span style={{ fontSize:10, color:urgency.c, opacity:0.7 }}>({days}일 기준)</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display:"flex", flexDirection:"column", gap:7, alignItems:"stretch", minWidth:140 }}>
                      <button onClick={()=>setCompleteTarget(v)} style={{ padding:"8px 14px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${C.emerald}40`, background:C.emerald+"12", color:"#0fa573" }}>✅ 임대 완료</button>
                      <button onClick={()=>copyListing(v)} style={{ padding:"8px 14px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", border:"1px solid rgba(59,91,219,0.35)", background:"rgba(59,91,219,0.07)", color:"#3b5bdb" }}>📋 매물 정보 복사</button>
                      <button onClick={()=>router.push("/dashboard/premium/ai-report")} style={{ padding:"8px 14px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", border:"1px solid rgba(15,165,115,0.3)", background:"rgba(15,165,115,0.06)", color:"#0fa573" }}>🤖 AI 시세 분석</button>
                      {v._source === "tenant" ? (
                        <button onClick={()=>router.push("/dashboard/properties")} style={{ padding:"7px 14px", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer", border:"1px solid #ebe9e3", background:"transparent", color:"#8a8a9a" }}>📋 물건 관리에서 수정</button>
                      ) : (
                        <div style={{ display:"flex", gap:5 }}>
                          <button onClick={()=>startEdit(v)} style={{ flex:1, padding:"7px 0", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer", border:"1px solid #ebe9e3", background:"transparent", color:"#6a6a7a" }}>✏️ 수정</button>
                          <button onClick={()=>setDeleteTarget(v)} style={{ flex:1, padding:"7px 0", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer", border:`1px solid ${C.rose}40`, background:"transparent", color:C.rose }}>🗑️ 삭제</button>
                        </div>
                      )}
                      <p style={{ fontSize:10, color:"#8a8a9a", textAlign:"center", margin:0 }}>공실 {days}일째</p>
                    </div>
                  </div>
                </div>

                {/* ✅ 액션플랜 위자드 토글 */}
                <div
                  onClick={()=>setOpenPlan(isOpen ? null : v.id)}
                  style={{ padding:"11px 22px", background:plan.color+"0d", borderTop:`1px solid ${plan.color}20`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:14 }}>{plan.icon}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:plan.color }}>{plan.label} 액션플랜</span>
                    <span style={{ fontSize:11, color:plan.color, background:plan.color+"20", padding:"1px 8px", borderRadius:10, fontWeight:600 }}>{doneCount}/{plan.steps.length} 완료</span>
                  </div>
                  <span style={{ fontSize:12, color:plan.color, fontWeight:700 }}>{isOpen ? "▲ 닫기" : "▼ 펼치기"}</span>
                </div>

                {/* 액션플랜 스텝 */}
                {isOpen && (
                  <div style={{ padding:"14px 22px 18px", background:plan.color+"06", borderTop:`1px dashed ${plan.color}20` }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {plan.steps.map((step, i) => {
                        const done = !!checkedSteps[`${v.id}_${step.id}`];
                        return (
                          <div
                            key={step.id}
                            onClick={()=>toggleStep(v.id, step.id)}
                            style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:done?"rgba(15,165,115,0.06)":"#fff", border:`1px solid ${done?"#0fa57340":"#ebe9e3"}`, borderRadius:10, cursor:"pointer", transition:"all .15s" }}
                          >
                            <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${done?"#0fa573":plan.color+"60"}`, background:done?"#0fa573":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              {done && <span style={{ color:"#fff", fontSize:13, fontWeight:900 }}>✓</span>}
                            </div>
                            <span style={{ fontSize:13, color:"#8a8a9a", fontWeight:700, flexShrink:0 }}>0{i+1}</span>
                            <span style={{ fontSize:13 }}>{step.icon}</span>
                            <span style={{ fontSize:13, color:done?"#8a8a9a":"#1a2744", fontWeight:done?400:600, textDecoration:done?"line-through":"none", flex:1 }}>{step.text}</span>
                          </div>
                        );
                      })}
                    </div>
                    {doneCount === plan.steps.length && (
                      <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(15,165,115,0.1)", borderRadius:10, textAlign:"center" }}>
                        <p style={{ fontSize:13, fontWeight:700, color:"#0fa573", margin:0 }}>🎉 이 단계 액션플랜 완료! 임대 완료 처리를 해주세요.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!copyTarget} onClose={()=>setCopyTarget(null)} width={480}>
        {copyTarget&&( <div> <h3 style={{ fontSize:16, fontWeight:800, color:"#1a2744", marginBottom:6 }}>📋 매물 정보 복사</h3> <p style={{ fontSize:12, color:"#8a8a9a", marginBottom:14 }}>아래를 선택 후 복사 → 네이버·직방·다방에 붙여넣기</p> <textarea readOnly value={buildListingText(copyTarget,gf)} rows={10} onClick={e=>e.target.select()} style={{ width:"100%", padding:"12px", fontSize:13, background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, resize:"none", fontFamily:"inherit", color:"#1a2744", cursor:"text" }} /> <button onClick={()=>setCopyTarget(null)} style={{ width:"100%", marginTop:10, padding:"11px", borderRadius:10, background:"#1a2744", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>닫기</button> </div> )}
      </Modal>

      <ConfirmDialog open={!!completeTarget} title="임대 완료 처리" desc={completeTarget?`${gf(completeTarget,"addr","address")} 공실을 임대 완료 처리합니다. 처리 후 물건 관리 페이지로 이동해서 새 세입자 정보를 입력하시겠습니까?`:""} onConfirm={handleComplete} onCancel={()=>setCompleteTarget(null)} />

      <ConfirmDialog open={!!deleteTarget} title="공실 삭제" desc={deleteTarget?`"${gf(deleteTarget,"addr","address")}" 공실을 삭제합니다. 되돌릴 수 없습니다. 계속하시겠습니까?`:""} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)} />

      <Modal open={showModal} onClose={()=>{ setShowModal(false); setEditTarget(null); setForm(initForm()); }}>
        <h2 style={{ fontSize:19, fontWeight:800, color:"#1a2744", marginBottom:16 }}>{editTarget ? "공실 수정" : "공실 등록"}</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:8 }}>물건 유형</p><div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}>{Object.entries(TYPE_CONFIG).map(([type,cfg])=><button key={type} onClick={()=>setForm(f=>({...f,pType:type,sub:cfg.subs[0]}))} style={{ padding:"9px 0", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", border:`2px solid ${form.pType===type?cfg.color:"#ebe9e3"}`, background:form.pType===type?cfg.color+"18":"transparent", color:form.pType===type?cfg.color:"#8a8a9a" }}>{cfg.icon} {type}</button>)}</div></div>
          <div><p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:8 }}>세부 유형</p><div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{(TYPE_CONFIG[form.pType]?.subs||[]).map(s=><button key={s} onClick={()=>setForm(f=>({...f,sub:s}))} style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${form.sub===s?TYPE_CONFIG[form.pType]?.color:"#ebe9e3"}`, background:form.sub===s?TYPE_CONFIG[form.pType]?.color+"18":"transparent", color:form.sub===s?TYPE_CONFIG[form.pType]?.color:"#8a8a9a" }}>{s}</button>)}</div></div>
          <AddressInput label="주소" value={form.addr} onChange={set("addr")} onSelect={set("addr")} placeholder="마포구 합정동 123" />
          <AuthInput label="공실 시작일" type="date" value={form.vacantSince} onChange={e=>setForm(f=>({...f,vacantSince:e.target.value}))} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}><AuthInput label="기대 월세 (만원)" placeholder="120" value={form.expectedRent} onChange={e=>setForm(f=>({...f,expectedRent:e.target.value}))} icon="💰" /><AuthInput label="보증금 (만원)" placeholder="5000" value={form.dep} onChange={e=>setForm(f=>({...f,dep:e.target.value}))} icon="🏦" /></div>
          {showMaint&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}><AuthInput label="관리비 (만원/월)" placeholder="15" value={form.maintenance} onChange={e=>setForm(f=>({...f,maintenance:e.target.value}))} icon="🏢" /><div style={{ background:"rgba(15,165,115,0.06)", border:"1px solid rgba(15,165,115,0.2)", borderRadius:10, padding:"10px 13px" }}><p style={{ fontSize:11, fontWeight:700, color:"#0fa573", marginBottom:3 }}>총 월 수익 (예상)</p><p style={{ fontSize:14, fontWeight:800, color:"#1a2744" }}>{totalRent>0?`${totalRent.toLocaleString()}만원`:"—"}</p></div></div>}
          <div><p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:7 }}>메모</p><textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="공실 관련 메모..." rows={2} style={{ width:"100%", padding:"11px 13px", fontSize:13, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, resize:"vertical", outline:"none", fontFamily:"inherit" }} /></div>
          <div style={{ display:"flex", gap:10 }}><button onClick={()=>{ setShowModal(false); setEditTarget(null); setForm(initForm()); }} style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid #ebe9e3", color:"#8a8a9a", fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button><button onClick={handleAdd} disabled={saving} className="btn-primary" style={{ flex:2, padding:"12px", borderRadius:11, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>{saving?(editTarget?"수정 중...":"등록 중..."):(editTarget?"수정하기":"등록하기")}</button></div>
        </div>
      </Modal>
    </div>
  );
}
