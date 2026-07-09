"use client";
import { useState, useEffect } from "react";
import { SectionLabel, EmptyState, Modal, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";
import PlanGate from "../../../components/PlanGate";
import { REASON_TEMPLATES } from "../../../lib/certifiedTemplates";

// 내용증명 발송 상태
const STATUS_META = {
  drafted:   { label: "작성됨",   color: "#6a6a7a", bg: "rgba(106,106,122,0.10)" },
  sent:      { label: "발송완료", color: "#1e7fcb", bg: "rgba(30,127,203,0.10)" },
  received:  { label: "수령확인", color: "#0fa573", bg: "rgba(15,165,115,0.10)" },
  completed: { label: "종결",     color: "#1a2744", bg: "rgba(26,39,68,0.10)" },
};

export default function CertifiedPage() {
  return <PlanGate feature="certified"><CertifiedContent /></PlanGate>;
}

// 공통 라벨 컴포넌트
function FormLabel({ children }) {
  return <p style={{ fontSize:11, color:"#8a8a9a", fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", marginBottom:7 }}>{children}</p>;
}
function FormInput({ label, ...props }) {
  return (
    <div>
      {label && <FormLabel>{label}</FormLabel>}
      <input {...props} style={{ width:"100%", padding:"11px 13px", fontSize:13, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, outline:"none", fontFamily:"inherit", boxSizing:"border-box", ...props.style }} />
    </div>
  );
}

function CertifiedContent() {
  const { tenants, user, getPlanLimit } = useApp();
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [trackingTarget, setTrackingTarget] = useState(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [postMethodInput, setPostMethodInput] = useState("postal");

  // 폼 상태
  const initForm = () => ({
    selectedTenant: "",
    reason: "임대료 미납",
    // 발신인
    senderName: "", senderAddr: "", senderPhone: "",
    // 수신인
    receiverName: "", receiverAddr: "", receiverPhone: "",
    // 물건·계약
    propertyAddr: "", contractStart: "", contractEnd: "",
    rentAmt: "", depositAmt: "",
    // 사유별 추가 항목
    unpaidPeriod: "", unpaidAmt: "", deductAmt: "", refundAmt: "",
    violationDetail: "", terminationReason: "",
    // 이행 기한
    deadlineDays: "7",
    // 커스텀 내용
    customContent: "",
  });
  const [form, setForm] = useState(initForm());
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target ? e.target.value : e }));

  // 세입자 선택 시 자동 채우기
  const onSelectTenant = (tid) => {
    setForm(f => ({ ...f, selectedTenant: tid }));
    if (!tid) return;
    const t = tenants.find(x => String(x.id) === String(tid));
    if (!t) return;
    setForm(f => ({
      ...f,
      selectedTenant: tid,
      receiverName:  t.name || "",
      receiverPhone: t.phone || "",
      receiverAddr:  t.addr || "",
      propertyAddr:  t.addr || "",
      contractStart: t.start_date || "",
      contractEnd:   t.end_date || "",
      rentAmt:       t.rent ? String(t.rent) : "",
      depositAmt:    t.dep ? String(t.dep) : "",
    }));
  };

  // 본문 자동 생성
  const generateBody = () => {
    const tmpl = REASON_TEMPLATES[form.reason];
    if (!tmpl) return "";
    return tmpl.template({
      propertyAddr:     form.propertyAddr,
      contractStart:    form.contractStart,
      contractEnd:      form.contractEnd,
      rentAmt:          form.rentAmt,
      depositAmt:       form.depositAmt,
      unpaidPeriod:     form.unpaidPeriod,
      unpaidAmt:        form.unpaidAmt,
      deductAmt:        form.deductAmt,
      refundAmt:        form.refundAmt,
      violationDetail:  form.violationDetail,
      terminationReason:form.terminationReason,
      deadlineDays:     form.deadlineDays,
      customContent:    form.customContent,
    });
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("certified_mail").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setHistory(data); setLoading(false); });
  }, [user]);

  const openCreate = () => { setEditTarget(null); setForm(initForm()); setShowModal(true); };
  const openEdit = (h) => {
    setEditTarget(h);
    try {
      const saved = JSON.parse(h.form_data || "{}");
      setForm({ ...initForm(), ...saved, reason: h.reason });
    } catch { setForm({ ...initForm(), reason: h.reason }); }
    setShowModal(true);
  };

  const save = async () => {
    if (!form.receiverName.trim()) { toast("수신인(세입자) 이름을 입력하세요", "error"); return; }
    // 플랜별 월 작성 한도 강제 (무료 1건 · 플러스 10건 · 프로 무제한)
    if (!editTarget) {
      const limit = getPlanLimit("certified");
      if (typeof limit === "number" && isFinite(limit)) {
        const ym = new Date().toISOString().slice(0, 7);
        const monthCount = history.filter(x => (x.created_at || "").slice(0, 7) === ym).length;
        if (monthCount >= limit) {
          toast(`이번 달 내용증명 한도(${limit}건)를 모두 사용했어요 — 플랜을 올리면 더 발급할 수 있습니다`, "warning");
          return;
        }
      }
    }
    setSaving(true);
    const body = generateBody();
    const row = {
      user_id:     user.id,
      tenant_id:   form.selectedTenant || null,
      tenant_name: form.receiverName,
      reason:      form.reason,
      content:     body,
      form_data:   JSON.stringify(form),
    };
    try {
      if (editTarget) {
        const { data, error } = await supabase.from("certified_mail").update(row).eq("id", editTarget.id).select().single();
        if (error) throw error;
        setHistory(prev => prev.map(h => h.id === data.id ? data : h));
        toast("수정되었습니다");
      } else {
        const { data, error } = await supabase.from("certified_mail").insert(row).select().single();
        if (error) throw error;
        setHistory(prev => [data, ...prev]);
        toast("저장되었습니다");
      }
      setShowModal(false);
    } catch (e) { toast("오류: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("certified_mail").delete().eq("id", deleteTarget.id);
    if (error) { toast("삭제 오류", "error"); return; }
    setHistory(prev => prev.filter(h => h.id !== deleteTarget.id));
    if (showDetail?.id === deleteTarget.id) setShowDetail(null);
    setDeleteTarget(null);
    toast("삭제되었습니다");
  };

  // PDF 인쇄
  const printPDF = (h) => {
    let formData = {};
    try { formData = JSON.parse(h.form_data || "{}"); } catch {}
    const today = new Date(h.created_at).toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" });
    const tmpl = REASON_TEMPLATES[h.reason] || REASON_TEMPLATES["기타"];

    localStorage.setItem("ownly_certified_print", JSON.stringify({ h, formData, today, legalBasis: tmpl.legalBasis }));
    window.open("/dashboard/certified/print", "_blank");
  };

  const tmpl = REASON_TEMPLATES[form.reason] || REASON_TEMPLATES["기타"];
  const showUnpaid      = form.reason === "임대료 미납";
  const showViolation   = form.reason === "계약 위반 시정 요구";
  const showTermination = form.reason === "명도 요청";
  const showDeposit     = form.reason === "보증금 반환 청구";
  const showCustom      = form.reason === "기타";

  // 등기번호 모달이 열리면 기존 값 미리 채움
  useEffect(() => {
    if (trackingTarget) {
      setTrackingInput(trackingTarget.tracking_no || "");
      setPostMethodInput(trackingTarget.post_method || "postal");
    }
  }, [trackingTarget]);

  // 등기번호 저장
  const saveTracking = async () => {
    if (!trackingTarget) return;
    try {
      const patch = {
        tracking_no: trackingInput.trim() || null,
        post_method: postMethodInput,
      };
      // 등기번호를 처음 입력하는 경우 상태를 sent 로 자동 승격
      if (trackingInput.trim() && (trackingTarget.status === "drafted" || !trackingTarget.status)) {
        patch.status = "sent";
        if (!trackingTarget.sent_at) patch.sent_at = new Date().toISOString().slice(0,10);
      }
      const { data, error } = await supabase.from("certified_mail").update(patch).eq("id", trackingTarget.id).select().single();
      if (error) throw error;
      setHistory(prev => prev.map(x => x.id === data.id ? data : x));
      setTrackingTarget(null);
      toast("등기번호가 저장되었습니다");
    } catch (e) {
      toast("저장 실패: " + (e?.message || ""), "error");
    }
  };

  // 상태 변경 (DB 즉시 반영)
  const updateStatus = async (h, nextStatus) => {
    const patch = { status: nextStatus };
    if (nextStatus === "sent" && !h.sent_at) patch.sent_at = new Date().toISOString().slice(0,10);
    if (nextStatus === "received" && !h.received_at) patch.received_at = new Date().toISOString().slice(0,10);
    try {
      const { data, error } = await supabase.from("certified_mail").update(patch).eq("id", h.id).select().single();
      if (error) throw error;
      setHistory(prev => prev.map(x => x.id === data.id ? data : x));
      toast(`상태가 ${STATUS_META[nextStatus]?.label || nextStatus}(으)로 변경되었습니다`);
    } catch (e) {
      toast("상태 변경 실패: " + (e?.message || ""), "error");
    }
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 920 }}>
      {/* 헤더 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:22, flexWrap:"wrap", gap:12 }}>
        <div>
          <SectionLabel>CERTIFIED MAIL</SectionLabel>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#1a2744" }}>내용증명</h1>
          <p style={{ fontSize:13, color:"#8a8a9a", marginTop:3 }}>총 {history.length}건 저장</p>
        </div>
        <button onClick={openCreate} style={{ padding:"10px 20px", borderRadius:11, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          + 내용증명 작성
        </button>
      </div>

      {/* 우체국 정식 발송 가이드 — 정직한 안내 (외부 연동 없음을 명시) */}
      <div style={{ marginBottom:16, padding:"14px 18px", background:"rgba(232,150,10,0.06)", border:"1px solid rgba(232,150,10,0.2)", borderRadius:12 }}>
        <p style={{ fontSize:12, fontWeight:800, color:"#c9920a", marginBottom:6 }}>📮 법적 효력 있는 정식 발송 방법</p>
        <p style={{ fontSize:12, color:"#6a6a7a", lineHeight:1.7, margin:0 }}>
          이 페이지는 <b style={{ color:"#1a2744" }}>법적 효력을 가진 내용증명 작성·보관 도구</b>입니다. 정식 발송은 본 서비스 내에서 자동 처리되지 않으니, 작성한 PDF를 가지고 다음 중 한 가지 방법으로 직접 보내주세요.
        </p>
        <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
          <a href="https://service.epost.go.kr/iservice/usr/postal/usrpst1003.jsp" target="_blank" rel="noopener noreferrer" style={{ padding:"7px 13px", borderRadius:8, background:"#fff", border:"1px solid #c9920a40", color:"#c9920a", fontSize:11, fontWeight:700, textDecoration:"none" }}>📨 우체국 전자내용증명 (24시간 발송)</a>
          <a href="https://www.epost.go.kr/main.retrieveMainPage.do" target="_blank" rel="noopener noreferrer" style={{ padding:"7px 13px", borderRadius:8, background:"#fff", border:"1px solid #c9920a40", color:"#c9920a", fontSize:11, fontWeight:700, textDecoration:"none" }}>🏤 가까운 우체국 방문 (배달증명)</a>
        </div>
        <p style={{ fontSize:11, color:"#8a8a9a", lineHeight:1.6, margin:"8px 0 0" }}>
          발송 후 등기번호를 받으셨다면 아래 목록에서 해당 항목의 상태를 <b>발송완료</b>로 바꾸고 등기번호를 입력해 두시면 추후 분쟁 시 근거가 됩니다.
        </p>
      </div>

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:C.muted }}>불러오는 중...</div>
      ) : history.length === 0 ? (
        <EmptyState icon="📨" title="작성된 내용증명이 없습니다" desc="내용증명 작성 버튼으로 첫 문서를 작성하세요" hint="내용증명은 법적 효력이 있는 공식 통보 수단입니다" action="+ 내용증명 작성" onAction={openCreate} />
      ) : (
        <div style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:16, overflow:"hidden" }}>
          {history.map((h, i) => {
            const t = REASON_TEMPLATES[h.reason] || REASON_TEMPLATES["기타"];
            const status = h.status || "drafted";
            const sm = STATUS_META[status] || STATUS_META.drafted;
            return (
              <div key={h.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom: i < history.length-1 ? "1px solid #f0efe9" : "none", flexWrap:"wrap", gap:10 }}>
                <div style={{ display:"flex", gap:12, alignItems:"center", flex:1, minWidth:240 }}>
                  <div style={{ width:40, height:40, borderRadius:11, background:"rgba(26,39,68,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{t.icon}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#1a2744" }}>{h.tenant_name}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:C.rose, background:C.rose+"15", padding:"2px 8px", borderRadius:20 }}>{h.reason}</span>
                      <span style={{ fontSize:10, fontWeight:800, color:sm.color, background:sm.bg, padding:"2px 8px", borderRadius:20 }}>{sm.label}</span>
                    </div>
                    <p style={{ fontSize:12, color:"#8a8a9a", margin:0 }}>
                      작성 {new Date(h.created_at).toLocaleDateString("ko-KR")}
                      {h.sent_at && <> · 발송 {new Date(h.sent_at).toLocaleDateString("ko-KR")}</>}
                      {h.tracking_no && <> · 등기 <b style={{ color:"#1a2744" }}>{h.tracking_no}</b></>}
                      {h.received_at && <> · 수령 {new Date(h.received_at).toLocaleDateString("ko-KR")}</>}
                    </p>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0, alignItems:"center", flexWrap:"wrap" }}>
                  <select
                    value={status}
                    onChange={(e) => updateStatus(h, e.target.value)}
                    aria-label="발송 상태 변경"
                    style={{ padding:"5px 8px", fontSize:11, fontWeight:700, color:sm.color, background:sm.bg, border:`1px solid ${sm.color}40`, borderRadius:7, cursor:"pointer", minHeight:30 }}
                  >
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <button onClick={() => setTrackingTarget(h)} style={{ padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", border:"1px solid #ebe9e3", background:"transparent", color:"#6a6a7a" }}>📦 등기번호</button>
                  <button onClick={() => setShowDetail(h)} style={{ padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", border:"1px solid #ebe9e3", background:"transparent", color:"#8a8a9a" }}>보기</button>
                  <button onClick={() => openEdit(h)} style={{ padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${C.indigo}40`, background:C.indigo+"10", color:C.indigo }}>수정</button>
                  <button onClick={() => printPDF(h)} style={{ padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${C.emerald}40`, background:C.emerald+"10", color:C.emerald }}>📄 PDF</button>
                  <button onClick={() => setDeleteTarget(h)} style={{ padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${C.rose}40`, background:C.rose+"10", color:C.rose }}>삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 작성/수정 모달 ── */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditTarget(null); }} width={660} padding="24px">
        <h2 style={{ fontSize:18, fontWeight:800, color:"#1a2744", marginBottom:20 }}>
          {editTarget ? "내용증명 수정" : "내용증명 작성"}
        </h2>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* 발송 사유 */}
          <div>
            <FormLabel>발송 사유</FormLabel>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {Object.entries(REASON_TEMPLATES).map(([r, t]) => (
                <button key={r} onClick={() => setForm(f => ({ ...f, reason:r, deadlineDays:String(t.deadline) }))}
                  style={{ padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
                    border:`1px solid ${form.reason===r?C.rose:"#ebe9e3"}`,
                    background:form.reason===r?C.rose+"15":"transparent",
                    color:form.reason===r?C.rose:"#8a8a9a" }}>
                  {t.icon} {r}
                </button>
              ))}
            </div>
            {/* 법적 근거 */}
            <div style={{ marginTop:8, padding:"8px 12px", background:"rgba(26,39,68,0.04)", borderRadius:8, fontSize:11, color:"#8a8a9a" }}>
              📚 법적 근거: <b style={{ color:"#1a2744" }}>{tmpl.legalBasis}</b>
            </div>
          </div>

          <hr style={{ border:"none", borderTop:"1px solid #f0efe9" }} />

          {/* 발신인 + 수신인 2열 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ background:"#f8f7f4", borderRadius:12, padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
              <p style={{ fontSize:11, fontWeight:800, color:"#1a2744", letterSpacing:"1px", marginBottom:2 }}>📤 발신인 (임대인)</p>
              <FormInput label="성명" placeholder="홍길동" value={form.senderName} onChange={set("senderName")} />
              <FormInput label="주소" placeholder="서울시 마포구..." value={form.senderAddr} onChange={set("senderAddr")} />
              <FormInput label="연락처" placeholder="010-0000-0000" value={form.senderPhone} onChange={set("senderPhone")} />
            </div>
            <div style={{ background:"#f8f7f4", borderRadius:12, padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
              <p style={{ fontSize:11, fontWeight:800, color:"#1a2744", letterSpacing:"1px", marginBottom:2 }}>📥 수신인 (임차인)</p>
              {/* 세입자 불러오기 */}
              <div>
                <FormLabel>세입자 선택</FormLabel>
                <select value={form.selectedTenant} onChange={e => onSelectTenant(e.target.value)}
                  style={{ width:"100%", padding:"9px 11px", fontSize:12, color:"#1a2744", background:"#fff", border:"1px solid #ebe9e3", borderRadius:9, outline:"none" }}>
                  <option value="">직접 입력</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name} — {t.addr}</option>)}
                </select>
              </div>
              <FormInput label="성명 *" placeholder="임차인 성명" value={form.receiverName} onChange={set("receiverName")} />
              <FormInput label="주소" placeholder="임차 목적물 주소" value={form.receiverAddr} onChange={set("receiverAddr")} />
              <FormInput label="연락처" placeholder="010-0000-0000" value={form.receiverPhone} onChange={set("receiverPhone")} />
            </div>
          </div>

          {/* 임대 목적물 및 계약 정보 */}
          <div style={{ background:"#f8f7f4", borderRadius:12, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:800, color:"#1a2744", letterSpacing:"1px", marginBottom:12 }}>🏠 임대 목적물 및 계약 정보</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <FormInput label="임대 목적물 주소" placeholder="서울시 마포구 합정동 123" value={form.propertyAddr} onChange={set("propertyAddr")} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                <FormInput label="계약 시작일" type="date" value={form.contractStart} onChange={set("contractStart")} />
                <FormInput label="계약 종료일" type="date" value={form.contractEnd} onChange={set("contractEnd")} />
                <FormInput label="월 임대료 (만원)" type="number" placeholder="120" value={form.rentAmt} onChange={set("rentAmt")} />
              </div>
              <FormInput label="보증금 (만원)" type="number" placeholder="5000" value={form.depositAmt} onChange={set("depositAmt")} />
            </div>
          </div>

          {/* 사유별 추가 항목 */}
          {showUnpaid && (
            <div style={{ background:"rgba(232,68,90,0.04)", border:"1px solid rgba(232,68,90,0.15)", borderRadius:12, padding:"14px 16px" }}>
              <p style={{ fontSize:11, fontWeight:800, color:C.rose, marginBottom:12 }}>💴 미납 정보</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <FormInput label="미납 기간" placeholder="예: 2024년 10월 ~ 12월 (3개월)" value={form.unpaidPeriod} onChange={set("unpaidPeriod")} />
                <FormInput label="미납 금액 (만원)" type="number" placeholder="360" value={form.unpaidAmt} onChange={set("unpaidAmt")} />
              </div>
            </div>
          )}
          {showViolation && (
            <div style={{ background:"rgba(232,150,10,0.04)", border:"1px solid rgba(232,150,10,0.15)", borderRadius:12, padding:"14px 16px" }}>
              <p style={{ fontSize:11, fontWeight:800, color:C.amber, marginBottom:10 }}>⚠️ 계약 위반 내용</p>
              <div>
                <FormLabel>위반 사항 상세</FormLabel>
                <textarea value={form.violationDetail} onChange={set("violationDetail")} rows={2}
                  placeholder="예: 무단 전대, 무단 개조, 소음 등 계약서 위반 내용"
                  style={{ width:"100%", padding:"10px 12px", fontSize:13, color:"#1a2744", background:"#fff", border:"1px solid #ebe9e3", borderRadius:9, resize:"vertical", outline:"none", fontFamily:"inherit" }} />
              </div>
            </div>
          )}
          {showTermination && (
            <div style={{ background:"rgba(26,39,68,0.04)", border:"1px solid rgba(26,39,68,0.1)", borderRadius:12, padding:"14px 16px" }}>
              <p style={{ fontSize:11, fontWeight:800, color:"#1a2744", marginBottom:10 }}>🏠 명도 사유</p>
              <FormInput label="계약 종료 사유" placeholder="예: 계약 기간 만료, 계약 해지" value={form.terminationReason} onChange={set("terminationReason")} />
            </div>
          )}
          {showDeposit && (
            <div style={{ background:"rgba(15,165,115,0.04)", border:"1px solid rgba(15,165,115,0.15)", borderRadius:12, padding:"14px 16px" }}>
              <p style={{ fontSize:11, fontWeight:800, color:C.emerald, marginBottom:12 }}>💰 보증금 반환 정보</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <FormInput label="공제 금액 (만원)" type="number" placeholder="0" value={form.deductAmt} onChange={set("deductAmt")} />
                <FormInput label="반환 청구액 (만원)" type="number" placeholder="5000" value={form.refundAmt} onChange={set("refundAmt")} />
              </div>
            </div>
          )}
          {showCustom && (
            <div>
              <FormLabel>내용 직접 입력</FormLabel>
              <textarea value={form.customContent} onChange={set("customContent")} rows={4}
                placeholder="내용증명 본문을 직접 입력하세요..."
                style={{ width:"100%", padding:"11px 13px", fontSize:13, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, resize:"vertical", outline:"none", fontFamily:"inherit" }} />
            </div>
          )}

          {/* 이행 기한 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:12, alignItems:"center" }}>
            <FormInput label="이행 기한 (일)" type="number" placeholder="7" value={form.deadlineDays} onChange={set("deadlineDays")} />
            <div style={{ background:"rgba(91,79,207,0.06)", border:"1px solid rgba(91,79,207,0.2)", borderRadius:10, padding:"10px 14px" }}>
              <p style={{ fontSize:11, color:C.purple, fontWeight:700, marginBottom:3 }}>📅 이행 기한</p>
              <p style={{ fontSize:12, color:"#1a2744" }}>수령일로부터 <b>{form.deadlineDays || "7"}일</b> 이내 이행 요구</p>
            </div>
          </div>

          {/* 안내 */}
          <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:10, padding:"10px 14px" }}>
            <p style={{ fontSize:12, color:"#0369a1" }}>💡 저장 후 PDF 출력 버튼을 클릭하면 공식 내용증명 서식으로 출력됩니다. 출력 후 우체국에서 내용증명 우편으로 발송하세요.</p>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { setShowModal(false); setEditTarget(null); }}
              style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid #ebe9e3", color:"#8a8a9a", fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button>
            <button onClick={save} disabled={saving}
              style={{ flex:2, padding:"12px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "저장 중..." : editTarget ? "수정 완료" : "저장하기"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 상세 보기 모달 */}
      {showDetail && (
        <Modal open={!!showDetail} onClose={() => setShowDetail(null)} width={600}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:"#1a2744" }}>내용증명 상세</h2>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setShowDetail(null); openEdit(showDetail); }}
                style={{ padding:"7px 14px", borderRadius:9, background:C.indigo+"15", border:`1px solid ${C.indigo}`, color:C.indigo, fontWeight:700, fontSize:12, cursor:"pointer" }}>✏️ 수정</button>
              <button onClick={() => printPDF(showDetail)}
                style={{ padding:"7px 14px", borderRadius:9, background:C.navy, border:"none", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer" }}>📄 PDF 출력</button>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#1a2744", background:"#f5f4f0", padding:"5px 12px", borderRadius:8 }}>수신: {showDetail.tenant_name}</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.rose, background:C.rose+"15", padding:"5px 12px", borderRadius:8 }}>{showDetail.reason}</span>
            <span style={{ fontSize:12, color:"#8a8a9a", background:"#f5f4f0", padding:"5px 12px", borderRadius:8 }}>{new Date(showDetail.created_at).toLocaleDateString("ko-KR")}</span>
          </div>
          <div style={{ background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:12, padding:"20px", minHeight:160, fontSize:13, lineHeight:2, color:"#1a2744", whiteSpace:"pre-wrap", maxHeight:400, overflowY:"auto" }}>
            {showDetail.content}
          </div>
        </Modal>
      )}

      {/* 등기번호·발송 방법 입력 */}
      {trackingTarget && (
        <Modal open={!!trackingTarget} onClose={() => setTrackingTarget(null)} width={460}>
          <h2 style={{ fontSize:17, fontWeight:800, color:"#1a2744", marginBottom:6 }}>📦 발송 정보 등록</h2>
          <p style={{ fontSize:12, color:"#8a8a9a", marginBottom:16 }}>{trackingTarget.tenant_name} — {trackingTarget.reason}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <FormLabel>발송 방법</FormLabel>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[
                  { id:"postal", label:"🏤 우체국 방문" },
                  { id:"epost", label:"📨 우체국 전자내용증명" },
                  { id:"other", label:"기타" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setPostMethodInput(opt.id)}
                    style={{ padding:"7px 12px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer",
                      border:`1px solid ${postMethodInput===opt.id?C.indigo:"#ebe9e3"}`,
                      background:postMethodInput===opt.id?C.indigo+"12":"transparent",
                      color:postMethodInput===opt.id?C.indigo:"#8a8a9a" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <FormInput label="등기번호 (선택)" placeholder="예: 1234-5678-9012" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} />
            <p style={{ fontSize:11, color:"#8a8a9a", lineHeight:1.6, margin:0 }}>
              등기번호를 입력하면 추후 분쟁 시 발송 증빙으로 활용할 수 있습니다.
              등기번호 저장 시 상태가 자동으로 <b>발송완료</b>로 바뀝니다.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setTrackingTarget(null)}
                style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid #ebe9e3", color:"#8a8a9a", fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button>
              <button onClick={saveTracking}
                style={{ flex:2, padding:"12px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>저장</button>
            </div>
          </div>
        </Modal>
      )}

      {/* 삭제 확인 */}
      {deleteTarget && (
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
          <div style={{ textAlign:"center", padding:"8px 0" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🗑️</div>
            <h2 style={{ fontSize:18, fontWeight:800, color:"#1a2744", marginBottom:8 }}>삭제하시겠습니까?</h2>
            <p style={{ fontSize:13, color:C.muted, marginBottom:24 }}><strong>{deleteTarget.tenant_name}</strong> — {deleteTarget.reason}</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid #ebe9e3", color:"#8a8a9a", fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button>
              <button onClick={confirmDelete}
                style={{ flex:1, padding:"12px", borderRadius:11, background:`linear-gradient(135deg,${C.rose},#dc2626)`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>삭제</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
