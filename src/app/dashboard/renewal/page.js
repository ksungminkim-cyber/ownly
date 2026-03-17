"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../context/AppContext";
import { SectionLabel, Badge, toast } from "../../../components/shared";
import { daysLeft } from "../../../lib/constants";

const C = { navy:"#1a2744", purple:"#5b4fcf", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", border:"#e8e6e0", surface:"#ffffff", faint:"#f8f7f4", muted:"#8a8a9a" };

const INTENT_OPTIONS = [
  { value:"갱신 의향 있음",  label:"갱신 의향 있음",  color:C.emerald, icon:"✅", bg:"rgba(15,165,115,0.1)" },
  { value:"퇴거 예정",       label:"퇴거 예정",       color:C.rose,    icon:"🚪", bg:"rgba(232,68,90,0.1)" },
  { value:"미정/연락 중",    label:"미정/연락 중",    color:C.amber,   icon:"📞", bg:"rgba(232,150,10,0.1)" },
  { value:"갱신 의향 없음",  label:"갱신 의향 없음",  color:C.muted,   icon:"❌", bg:"rgba(138,138,154,0.1)" },
];

const CONTACT_TYPES = ["전화","문자","카카오톡","직접방문","이메일"];

function getUrgency(dl) {
  if (dl <= 30)  return { color:C.rose,    label:"⚠️ 긴급", bg:"rgba(232,68,90,0.08)" };
  if (dl <= 60)  return { color:C.amber,   label:"🔔 주의", bg:"rgba(232,150,10,0.08)" };
  if (dl <= 90)  return { color:C.navy,    label:"📋 관리", bg:"rgba(26,39,68,0.05)" };
  return null;
}

export default function RenewalPage() {
  const router = useRouter();
  const { tenants, updateTenantIntent, addContact } = useApp();
  const [savingId, setSavingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [contactForm, setContactForm] = useState({ type:"전화", note:"" });
  const [filter, setFilter] = useState("전체");

  // 만료 90일 이내 + 전체 보기 옵션
  const expiring = tenants.filter(t => {
    const end = t.end_date || t.end || "";
    const dl = daysLeft(end);
    return dl > 0 && dl <= 90;
  }).sort((a,b) => daysLeft(a.end_date||a.end||"") - daysLeft(b.end_date||b.end||""));

  const all = tenants.filter(t => {
    const end = t.end_date || t.end || "";
    return daysLeft(end) > 0;
  }).sort((a,b) => daysLeft(a.end_date||a.end||"") - daysLeft(b.end_date||b.end||""));

  const displayList = filter === "만료임박" ? expiring : all;
  const filtered = filter === "전체" ? displayList : displayList.filter(t => t.intent === filter);

  const updateIntent = async (tenantId, intent) => {
    setSavingId(tenantId);
    try {
      await updateTenantIntent(tenantId, intent);
      toast("의향이 업데이트됐습니다");
    } catch { toast("저장 실패", "error"); }
    finally { setSavingId(null); }
  };

  const saveContact = async (tenantId) => {
    if (!contactForm.note.trim()) { toast("내용을 입력해주세요", "error"); return; }
    setSavingId(tenantId + "_contact");
    try {
      await addContact(tenantId, { type:contactForm.type, note:contactForm.note, date:new Date().toISOString().slice(0,10) });
      toast("연락 기록이 저장됐습니다");
      setContactForm({ type:"전화", note:"" });
      setExpandedId(null);
    } catch { toast("저장 실패", "error"); }
    finally { setSavingId(null); }
  };

  const getIntentMeta = (intent) => INTENT_OPTIONS.find(o=>o.value===intent) || { color:C.muted, icon:"—", bg:"transparent" };

  return (
    <div className="page-in page-padding" style={{ maxWidth:900 }}>
      {/* 헤더 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:26, flexWrap:"wrap", gap:12 }}>
        <div>
          <SectionLabel>RENEWAL TRACKING</SectionLabel>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, letterSpacing:"-.4px" }}>갱신 의향 추적</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:3 }}>계약 만료 임차인의 갱신·퇴거 의향을 관리하세요</p>
        </div>
        {/* 요약 뱃지 */}
        <div style={{ display:"flex", gap:8 }}>
          {[
            { label:"긴급(30일↓)", count:tenants.filter(t=>daysLeft(t.end_date||t.end||"")<=30&&daysLeft(t.end_date||t.end||"")>0).length, color:C.rose },
            { label:"주의(60일↓)", count:tenants.filter(t=>{const d=daysLeft(t.end_date||t.end||"");return d>30&&d<=60;}).length, color:C.amber },
            { label:"관리(90일↓)", count:expiring.length, color:C.navy },
          ].map(b=>(
            <div key={b.label} style={{ textAlign:"center", padding:"10px 14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12 }}>
              <p style={{ fontSize:20, fontWeight:900, color:b.color }}>{b.count}</p>
              <p style={{ fontSize:10, color:C.muted, marginTop:2 }}>{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 필터 */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {["전체","만료임박", ...INTENT_OPTIONS.map(o=>o.value)].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
              border:`1px solid ${filter===f?C.navy:C.border}`,
              background:filter===f?C.navy:"transparent",
              color:filter===f?"#fff":C.muted }}>
            {f}
          </button>
        ))}
      </div>

      {/* 임차인 없음 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, background:C.faint, borderRadius:16 }}>
          <p style={{ fontSize:36, marginBottom:12 }}>🎉</p>
          <p style={{ fontSize:16, fontWeight:700, color:C.navy }}>
            {filter==="만료임박" ? "90일 이내 만료 임차인이 없습니다" : "해당 조건의 임차인이 없습니다"}
          </p>
          <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>모든 계약이 안정적으로 관리되고 있습니다</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.map(t => {
            const end = t.end_date || t.end || "";
            const dl = daysLeft(end);
            const urgency = getUrgency(dl);
            const intentMeta = getIntentMeta(t.intent);
            const isExpanded = expandedId === t.id;
            const recentContacts = (t.contacts || []).slice(0,3);

            return (
              <div key={t.id} style={{ background:urgency?.bg||C.surface, border:`1.5px solid ${urgency?.color||C.border}22`, borderRadius:16, overflow:"hidden" }}>
                {/* 메인 카드 */}
                <div style={{ padding:"16px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>

                    {/* 임차인 정보 */}
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <div style={{ width:42, height:42, borderRadius:12, background:(t.color||C.navy)+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:800, color:t.color||C.navy, flexShrink:0 }}>
                        {t.name?.[0]}
                      </div>
                      <div>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                          <h3 style={{ fontSize:16, fontWeight:800, color:C.navy }}>{t.name}</h3>
                          {urgency && <span style={{ fontSize:11, fontWeight:700, color:urgency.color, background:urgency.color+"18", padding:"2px 8px", borderRadius:20 }}>{urgency.label}</span>}
                        </div>
                        <p style={{ fontSize:12, color:C.muted }}>{t.sub} · {t.addr}</p>
                        <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>📅 만료: <b style={{ color:dl<=30?C.rose:dl<=60?C.amber:C.navy }}>{end}</b> (D-{dl})</p>
                      </div>
                    </div>

                    {/* 의향 선택 + 액션 */}
                    <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
                        {INTENT_OPTIONS.map(opt=>(
                          <button key={opt.value} onClick={()=>updateIntent(t.id, opt.value)} disabled={savingId===t.id}
                            style={{ padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer",
                              border:`1.5px solid ${t.intent===opt.value?opt.color:C.border}`,
                              background:t.intent===opt.value?opt.bg:"transparent",
                              color:t.intent===opt.value?opt.color:C.muted,
                              opacity:savingId===t.id?0.6:1 }}>
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>setExpandedId(isExpanded?null:t.id)}
                          style={{ padding:"6px 12px", borderRadius:8, background:C.faint, border:`1px solid ${C.border}`, fontSize:12, fontWeight:600, color:C.navy, cursor:"pointer" }}>
                          {isExpanded?"접기":"+ 연락 기록"}
                        </button>
                        <button onClick={()=>router.push("/dashboard/payments")}
                          style={{ padding:"6px 12px", borderRadius:8, background:"rgba(232,150,10,0.1)", border:`1px solid ${C.amber}30`, fontSize:12, fontWeight:700, color:C.amber, cursor:"pointer" }}>
                          수금 확인
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 최근 연락 미리보기 */}
                  {recentContacts.length > 0 && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                      {recentContacts.map((c,i)=>(
                        <div key={i} style={{ fontSize:11, color:C.muted, background:C.faint, padding:"4px 10px", borderRadius:20 }}>
                          <b style={{ color:C.navy }}>{c.type}</b> {c.date?.slice(5)} — {c.note?.slice(0,20)}{c.note?.length>20?"...":""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 연락 기록 입력 (확장) */}
                {isExpanded && (
                  <div style={{ padding:"16px 20px", background:"rgba(26,39,68,0.03)", borderTop:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:12 }}>연락 기록 추가</p>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                      {CONTACT_TYPES.map(ct=>(
                        <button key={ct} onClick={()=>setContactForm(f=>({...f,type:ct}))}
                          style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
                            border:`1px solid ${contactForm.type===ct?C.navy:C.border}`,
                            background:contactForm.type===ct?C.navy:"transparent",
                            color:contactForm.type===ct?"#fff":C.muted }}>
                          {ct}
                        </button>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <input value={contactForm.note} onChange={e=>setContactForm(f=>({...f,note:e.target.value}))}
                        placeholder="연락 내용 입력 (예: 갱신 의사 확인, 월세 협의 중...)"
                        style={{ flex:1, padding:"10px 13px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.navy, background:C.surface, outline:"none" }} />
                      <button onClick={()=>saveContact(t.id)} disabled={savingId===t.id+"_contact"}
                        style={{ padding:"10px 16px", borderRadius:10, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }}>
                        {savingId===t.id+"_contact"?"저장 중...":"저장"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
