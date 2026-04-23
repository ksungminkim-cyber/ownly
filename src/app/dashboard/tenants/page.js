"use client"; import { useState, useMemo } from "react"; import { useRouter } from "next/navigation"; import { Badge, SectionLabel, SearchBox, EmptyState, Modal, toast, SkeletonTable } from "../../../components/shared"; import { C, STATUS_MAP, INTENT_MAP, daysLeft } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; import TenantNotes from "../../../components/TenantNotes"; import RenewalGuide from "../../../components/RenewalGuide"; import RentHistoryChart from "../../../components/RentHistoryChart"; import TenantCreditScore from "../../../components/TenantCreditScore";
// ✅ ② 갱신 제안서 컴포넌트
function RenewalProposal({ tenant, onClose }) {
  const endDate = tenant.end_date || tenant.end || "";
  const currentRent = Number(tenant.rent) || 0;
  const maxIncrease = Math.floor(currentRent * 1.05); // 5% 상한
  const [proposedRent, setProposedRent] = useState(maxIncrease);
  const [proposedDep, setProposedDep] = useState(Number(tenant.dep) || 0);
  const [newEndYears, setNewEndYears] = useState(2);
  const [memo, setMemo] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const newStartDate = endDate ? new Date(new Date(endDate).getTime() + 86400000).toISOString().slice(0, 10) : today;
  const newEndDate = newStartDate ? new Date(new Date(newStartDate).setFullYear(new Date(newStartDate).getFullYear() + newEndYears)).toISOString().slice(0, 10) : "";
  const increaseRate = currentRent > 0 ? ((proposedRent - currentRent) / currentRent * 100).toFixed(1) : 0;
  const isOver5pct = Number(increaseRate) > 5;

  const printProposal = () => {
    const content = `
      <html><head><meta charset="utf-8"><style>
        body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        h1 { font-size: 22px; text-align: center; margin-bottom: 8px; }
        .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td { padding: 10px 14px; border: 1px solid #ddd; font-size: 14px; }
        td:first-child { background: #f5f5f5; font-weight: bold; width: 40%; }
        .highlight { background: #fff3cd !important; }
        .footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 16px; }
        .sign { margin-top: 60px; display: flex; justify-content: space-between; }
      </style></head><body>
        <h1>임대차 계약 갱신 제안서</h1>
        <p class="subtitle">작성일: ${today}</p>
        <table>
          <tr><td>임차인</td><td>${tenant.name}</td></tr>
          <tr><td>임대 물건</td><td>${tenant.addr}</td></tr>
          <tr><td>현행 계약 만료일</td><td>${endDate}</td></tr>
          <tr><td>현행 월세</td><td>${currentRent.toLocaleString()}만원</td></tr>
          <tr><td>현행 보증금</td><td>${(Number(tenant.dep)||0).toLocaleString()}만원</td></tr>
        </table>
        <table>
          <tr><td colspan="2" style="background:#e8f4fd;font-weight:bold;text-align:center;">갱신 제안 조건</td></tr>
          <tr><td>갱신 계약 기간</td><td>${newStartDate} ~ ${newEndDate} (${newEndYears}년)</td></tr>
          <tr class="highlight"><td>제안 월세</td><td>${proposedRent.toLocaleString()}만원 (${increaseRate > 0 ? '+' : ''}${increaseRate}% 인상)</td></tr>
          <tr><td>제안 보증금</td><td>${proposedDep.toLocaleString()}만원</td></tr>
          ${memo ? `<tr><td>특약 사항</td><td>${memo}</td></tr>` : ""}
        </table>
        <p style="font-size:12px;color:#666;">※ 임대차 3법에 따라 계약 갱신 시 임대료 인상은 5%를 초과할 수 없습니다.<br>※ 본 제안서는 임대인이 제안하는 갱신 조건이며, 법적 효력이 없습니다.</p>
        <div class="sign">
          <div>임대인 서명: _______________</div>
          <div>임차인 확인: _______________</div>
        </div>
        <div class="footer">Ownly(온리) 임대 관리 플랫폼에서 자동 생성 · ${today}</div>
      </body></html>
    `;
    const w = window.open("", "_blank");
    w.document.write(content);
    w.document.close();
    w.print();
  };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>📄 갱신 제안서 생성</h3>
      <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 18 }}>{tenant.name}님 · 만료 {new Date(endDate) > new Date() ? `D-${Math.ceil((new Date(endDate)-new Date())/86400000)}` : "만료됨"}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 4 }}>현행 월세</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#1a2744" }}>{currentRent.toLocaleString()}만원</p>
          </div>
          <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 4 }}>5% 상한 최대</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#0fa573" }}>{maxIncrease.toLocaleString()}만원</p>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>제안 월세 (만원)</p>
          <input type="number" value={proposedRent} onChange={e=>setProposedRent(Number(e.target.value))} style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${isOver5pct?"#e8445a":"#ebe9e3"}`, borderRadius: 10, fontSize: 14, fontWeight: 700, color: "#1a2744", background: "#f8f7f4" }} />
          {isOver5pct && <p style={{ fontSize: 11, color: "#e8445a", fontWeight: 700, marginTop: 5 }}>⚠️ 임대차 3법 5% 상한 초과 — 법적 분쟁 소지가 있습니다</p>}
          {!isOver5pct && Number(increaseRate) > 0 && <p style={{ fontSize: 11, color: "#0fa573", fontWeight: 600, marginTop: 5 }}>✅ 인상률 {increaseRate}% — 임대차 3법 범위 내</p>}
        </div>
        <div>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>제안 보증금 (만원)</p>
          <input type="number" value={proposedDep} onChange={e=>setProposedDep(Number(e.target.value))} style={{ width: "100%", padding: "11px 13px", border: "1px solid #ebe9e3", borderRadius: 10, fontSize: 13, color: "#1a2744", background: "#f8f7f4" }} />
        </div>
        <div>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>갱신 기간</p>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2].map(y => (
              <button key={y} onClick={() => setNewEndYears(y)} style={{ flex: 1, padding: "10px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${newEndYears===y?"#5b4fcf":"#ebe9e3"}`, background: newEndYears===y?"rgba(91,79,207,0.1)":"transparent", color: newEndYears===y?"#5b4fcf":"#8a8a9a" }}>{y}년</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>특약 사항 (선택)</p>
          <textarea value={memo} onChange={e=>setMemo(e.target.value)} rows={2} placeholder="예: 반려동물 불가, 에어컨 설치 후 갱신 등" style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
        </div>
        <div style={{ background: "rgba(91,79,207,0.06)", borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#5b4fcf", marginBottom: 6 }}>📋 갱신 제안 요약</p>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#1a2744", marginBottom: 3 }}><span>갱신 기간</span><span style={{ fontWeight: 700 }}>{newStartDate} ~ {newEndDate}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#1a2744", marginBottom: 3 }}><span>제안 월세</span><span style={{ fontWeight: 700, color: isOver5pct?"#e8445a":"#0fa573" }}>{proposedRent.toLocaleString()}만원 ({increaseRate > 0 ? "+" : ""}{increaseRate}%)</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#1a2744" }}><span>제안 보증금</span><span style={{ fontWeight: 700 }}>{proposedDep.toLocaleString()}만원</span></div>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
          <button onClick={printProposal} style={{ flex: 2, padding: "12px", borderRadius: 11, background: "linear-gradient(135deg,#5b4fcf,#7c3aed)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📄 PDF 출력 / 인쇄</button>
        </div>
      </div>
    </div>
  );
}

export default function TenantsPage() { const router = useRouter(); const { tenants, repairs, updateTenantContacts, updateTenantIntent, loading, user } = useApp(); if (loading) return <SkeletonTable rows={6} cols={3} />; const [selected, setSelected] = useState(null); const [filter, setFilter] = useState("전체"); const [search, setSearch] = useState(""); const [showContact, setShowContact] = useState(false); const [contactNote, setContactNote] = useState({ type: "납부확인", note: "" }); const [saving, setSaving] = useState(false);
  // ✅ ⑧ 수리이력 탭
  const [detailTab, setDetailTab] = useState("contract");
  const [showRenewal, setShowRenewal] = useState(false); // ✅ ② 갱신 제안서 모달
  const getEnd = (t) => t.end_date || t.end || ""; const filtered = useMemo(() => { let list = [...tenants]; if (filter === "만료임박") list = list.filter((t) => daysLeft(getEnd(t)) <= 90); else if (filter === "미납") list = list.filter((t) => t.status === "미납"); else if (filter !== "전체") list = list.filter((t) => t.pType === filter); if (search) { const q = search.toLowerCase(); list = list.filter((t) => t.name?.toLowerCase().includes(q) || t.addr?.toLowerCase().includes(q)); } return list; }, [tenants, filter, search]); const sel = selected ? tenants.find((t) => t.id === selected.id) : null;
  // ✅ 선택된 세입자의 수리이력
  const selRepairs = useMemo(() => sel ? (repairs||[]).filter(r => r.tenant_id === sel.id) : [], [sel, repairs]);
  const addContact = async () => { if (!sel || !contactNote.note.trim()) { toast("내용을 입력하세요", "error"); return; } setSaving(true); try { const newContact = { date: new Date().toISOString().slice(0, 10), type: contactNote.type, note: contactNote.note }; const updatedContacts = [newContact, ...(sel.contacts || [])]; await updateTenantContacts(sel.id, updatedContacts); toast("연락 기록이 저장되었습니다"); setShowContact(false); setContactNote({ type: "납부확인", note: "" }); } catch (e) { toast(`저장 실패: ${e?.message || "알 수 없는 오류"}`, "error"); console.error("[tenants.save]", e);} finally { setSaving(false); } }; const handleUpdateIntent = async (intent) => { if (!sel) return; try { await updateTenantIntent(sel.id, intent); toast("갱신 의향이 변경되었습니다"); } catch (e) { toast(`변경 실패: ${e?.message || "알 수 없는 오류"}`, "error"); console.error("[tenants.change]", e); } };

  // ✅ 전체 현황 요약
  const summaryStats = useMemo(() => { const active = tenants.filter(t => t.status !== "공실"); const totalRent = active.reduce((s, t) => s + (t.rent || 0), 0); const avgRent = active.length > 0 ? Math.round(totalRent / active.length) : 0; const unpaid = active.filter(t => t.status === "미납").length; const expiring60 = active.filter(t => daysLeft(getEnd(t)) <= 60 && daysLeft(getEnd(t)) >= 0).length; const byType = { 주거: 0, 상가: 0, 토지: 0 }; tenants.forEach(t => { if (byType[t.pType] !== undefined) byType[t.pType]++; }); return { total: active.length, totalRent, avgRent, unpaid, expiring60, byType }; }, [tenants]);

  return ( <div className="page-in tenant-split" style={{ display: "flex", height: "100%", minHeight: "calc(100vh - 0px)" }}> <div className="tenant-list-panel" style={{ width: 310, borderRight: "1px solid #ebe9e3", display: "flex", flexDirection: "column", flexShrink: 0 }}> <div style={{ padding: "26px 18px 14px", borderBottom: "1px solid var(--border)" }}> <SectionLabel>TENANT MANAGEMENT</SectionLabel> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}><h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>세입자 관리</h1><button onClick={() => router.push("/dashboard/tenants/renewals")} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(91,79,207,0.08)", border: "1px solid rgba(91,79,207,0.25)", color: "#5b4fcf", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>📅 갱신 일괄 관리 →</button></div> <div style={{ marginTop: 10 }}><SearchBox value={search} onChange={setSearch} placeholder="이름, 주소 검색..." /></div> </div> <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", gap: 5, flexWrap: "wrap" }}> {["전체", "주거", "상가", "토지", "만료임박", "미납"].map((f) => ( <button key={f} onClick={() => setFilter(f)} style={{ padding: "4px 10px", borderRadius: 13, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter === f ? C.indigo : "var(--border)"}`, background: filter === f ? C.indigo + "20" : "transparent", color: filter === f ? C.indigo : C.muted, minHeight: 30 }}>{f}</button> ))} </div> <div style={{ flex: 1, overflowY: "auto" }}> {filtered.length === 0 ? ( <div style={{ padding: 24, textAlign: "center" }}> <div style={{ fontSize: 32, marginBottom: 10 }}>{search ? "🔍" : tenants.length === 0 ? "🏠" : "👤"}</div> <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", marginBottom: 6 }}>{search ? "검색 결과 없음" : tenants.length === 0 ? "등록된 물건이 없습니다" : "해당 조건의 세입자 없음"}</p> {tenants.length === 0 && <button onClick={() => router.push("/dashboard/properties")} style={{ padding: "8px 18px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>물건 등록하러 가기 →</button>} </div> ) : filtered.map((t) => { const isSelected = sel?.id === t.id; const dl = daysLeft(getEnd(t)); return ( <div key={t.id} onClick={() => { setSelected(t); setDetailTab("contract"); }} style={{ padding: "13px 16px", borderBottom: "1px solid #ebe9e3", cursor: "pointer", borderLeft: "3px solid " + (isSelected ? C.indigo : "transparent"), background: isSelected ? "#f8f7f4" : "transparent", transition: "all .15s" }} onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f5f4f0"; }} onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}> <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}> <div style={{ width: 34, height: 34, borderRadius: 10, background: (t.color || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: t.color || C.indigo, flexShrink: 0 }}>{t.name?.[0]}</div> <div style={{ flex: 1, minWidth: 0 }}> <div style={{ display: "flex", justifyContent: "space-between" }}> <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{t.name}</p> <Badge label={t.status} map={STATUS_MAP} /> </div> <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.sub} · {t.addr}</p>
                {/* ✅ ⑤ 전화번호 목록에서 바로 표시 */}
                {t.phone && (
                  <a href={`tel:${t.phone}`} onClick={e => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#0fa573", textDecoration: "none", marginTop: 4, background: "rgba(15,165,115,0.08)", padding: "2px 8px", borderRadius: 20 }}>
                    📞 {t.phone}
                  </a>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: t.phone ? 4 : 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>{Number(t.rent).toLocaleString()}만원/월</span>
                  <span style={{ fontSize: 12, color: dl <= 60 ? C.amber : C.muted }}>D-{dl}</span>
                </div>
              </div> </div> </div> ); })} </div> </div>

    {!sel ? (
      <div style={{ flex: 1, padding: "28px 30px", overflowY: "auto" }}>
        {tenants.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <EmptyState icon="👤" title="세입자를 선택하세요" desc="왼쪽 목록에서 세입자를 클릭하면 상세 정보를 볼 수 있습니다" />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>TENANT OVERVIEW</p>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1a2744", marginBottom: 2 }}>전체 세입자 현황</h2>
              <p style={{ fontSize: 12, color: "#8a8a9a" }}>좌측 목록에서 세입자를 선택하면 상세 정보를 볼 수 있습니다</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[ { l: "총 세입자", v: summaryStats.total + "명", c: "#1a2744", icon: "👤" }, { l: "월 총 수입", v: summaryStats.totalRent.toLocaleString() + "만원", c: C.emerald, icon: "💰" }, { l: "평균 월세", v: summaryStats.avgRent.toLocaleString() + "만원", c: C.indigo, icon: "📊" }, { l: "미납", v: summaryStats.unpaid + "건", c: summaryStats.unpaid > 0 ? C.rose : C.emerald, icon: summaryStats.unpaid > 0 ? "⚠️" : "✅" }, ].map(k => ( <div key={k.l} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 16px" }}> <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{k.icon} {k.l}</p> <p style={{ fontSize: 20, fontWeight: 900, color: k.c }}>{k.v}</p> </div> ))} </div>
            {summaryStats.expiring60 > 0 && ( <div onClick={() => setFilter("만료임박")} style={{ background: "rgba(232,150,10,0.06)", border: "1px solid rgba(232,150,10,0.25)", borderRadius: 12, padding: "13px 16px", marginBottom: 16, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}> <div> <p style={{ fontSize: 13, fontWeight: 800, color: "#e8960a" }}>📅 계약 만료 임박 {summaryStats.expiring60}건</p> <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 3 }}>60일 이내 만료 예정 · 갱신 협상이 필요합니다</p> </div> <span style={{ fontSize: 11, fontWeight: 700, color: "#e8960a" }}>필터 보기 →</span> </div> )}
            <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}> <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>유형별 분포</p> {Object.entries({ 주거: "🏠", 상가: "🏪", 토지: "🌱" }).map(([type, icon]) => { const count = summaryStats.byType[type] || 0; const pct = summaryStats.total > 0 ? Math.round((count / summaryStats.total) * 100) : 0; return ( <div key={type} style={{ marginBottom: 10 }}> <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}> <span style={{ fontSize: 12, fontWeight: 600, color: "#1a2744" }}>{icon} {type}</span> <span style={{ fontSize: 12, color: "#8a8a9a" }}>{count}명 ({pct}%)</span> </div> <div style={{ height: 5, borderRadius: 5, background: "#f0efe9", overflow: "hidden" }}> <div style={{ height: "100%", width: pct + "%", borderRadius: 5, background: type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo }} /> </div> </div> ); })} </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>빠른 이동</p>
              {[ { icon: "💰", label: "수금 현황 확인", page: "payments", color: C.emerald }, { icon: "📅", label: "캘린더 보기", page: "calendar", color: C.indigo }, { icon: "📝", label: "계약서 관리", page: "properties", color: "#5b4fcf" }, ].map(({ icon, label, page, color }) => ( <button key={page} onClick={() => router.push("/dashboard/" + page)} style={{ padding: "11px 14px", borderRadius: 10, background: color + "10", border: `1px solid ${color}25`, color: "#1a2744", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}>{icon} {label}</button> ))}
            </div>
          </>
        )}
      </div>
    ) : (
      <div style={{ flex: 1, padding: "26px 30px", overflowY: "auto" }}>
        <button onClick={() => setSelected(null)} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#8a8a9a", background: "none", border: "1px solid #ebe9e3", borderRadius: 8, cursor: "pointer", padding: "5px 12px", fontWeight: 600, marginBottom: 20 }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a2744"; e.currentTarget.style.color = "#1a2744"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#ebe9e3"; e.currentTarget.style.color = "#8a8a9a"; }}>← 전체 현황</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: (sel.color || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 800, color: sel.color || C.indigo }}>{sel.name?.[0]}</div>
            <div>
              <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a2744" }}>{sel.name}</h2>
                <Badge label={sel.status} map={STATUS_MAP} />
                <Badge label={sel.intent} map={INTENT_MAP} />
              </div>
              <p style={{ fontSize: 12, color: "#8a8a9a" }}>{sel.sub} · {sel.addr}</p>
              {/* ✅ ⑤ 상세에서도 전화번호 강조 */}
              {sel.phone && <a href={`tel:${sel.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#0fa573", textDecoration: "none", marginTop: 4 }}>📞 {sel.phone}</a>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setShowContact(true)} style={{ padding: "7px 13px", borderRadius: 8, background: C.indigo + "18", border: `1px solid ${C.indigo}40`, color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ 연락 기록</button>
            {sel.phone && <a href={`tel:${sel.phone}`} style={{ padding: "7px 13px", borderRadius: 8, background: "rgba(15,165,115,0.1)", border: "1px solid rgba(15,165,115,0.3)", color: "#0fa573", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>📞 전화</a>}
            <button onClick={() => router.push("/dashboard/certified")} style={{ padding: "7px 13px", borderRadius: 8, background: C.rose + "18", border: `1px solid ${C.rose}40`, color: "#e8445a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📨 내용증명</button>
            {/* ✅ ⑤ 세입자 포털 링크 (통합 — 납부·수리·계약 조회) */}
            <button onClick={() => { const url = `${window.location.origin}/portal/${sel.id}`; navigator.clipboard ? navigator.clipboard.writeText(url).then(()=>toast("🔐 세입자 포털 링크가 복사됐습니다 — 납부·수리·계약 통합 조회 페이지")) : toast(url); }} style={{ padding: "7px 13px", borderRadius: 8, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔐 세입자 포털</button>
            {/* ✅ ⑤-2 수리 요청 전용 링크 (포털 내 포함되지만 간편 접근용) */}
            <button onClick={() => { const url = `${window.location.origin}/request/${sel.id}`; navigator.clipboard ? navigator.clipboard.writeText(url).then(()=>toast("🔧 수리 요청 링크가 복사됐습니다 — 세입자에게 전송하세요")) : toast(url); }} style={{ padding: "7px 13px", borderRadius: 8, background: "rgba(232,150,10,0.1)", border: "1px solid rgba(232,150,10,0.3)", color: "#e8960a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔧 수리 요청 링크</button>
            {/* ✅ ⑦ 계약 확인 링크 */}
            <button onClick={() => { const url = `${window.location.origin}/contract/${sel.id}`; navigator.clipboard ? navigator.clipboard.writeText(url).then(()=>toast("📄 계약 확인 링크가 복사됐습니다 — 세입자에게 전송하세요")) : toast(url); }} style={{ padding: "7px 13px", borderRadius: 8, background: "rgba(91,79,207,0.1)", border: "1px solid rgba(91,79,207,0.3)", color: "#5b4fcf", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📄 계약 확인 링크</button>
            {/* ✅ ② 갱신 제안서 PDF */}
            {daysLeft(getEnd(sel)) <= 120 && (
              <button onClick={() => setShowRenewal(true)} style={{ padding: "7px 13px", borderRadius: 8, background: "rgba(91,79,207,0.12)", border: "1px solid rgba(91,79,207,0.3)", color: "#5b4fcf", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📄 갱신 제안서</button>
            )}
            {daysLeft(getEnd(sel)) <= 90 && ( <select onChange={(e) => { if (e.target.value) { handleUpdateIntent(e.target.value); e.target.value = ""; } }} defaultValue="" style={{ padding: "7px 13px", borderRadius: 8, background: C.amber + "18", border: `1px solid ${C.amber}40`, color: "#e8960a", fontSize: 12, fontWeight: 700, cursor: "pointer", appearance: "none" }}> <option value="" disabled>갱신 의향 변경</option> {["갱신의향 있음", "협의중", "갱신의향 없음", "미확인"].map((v) => <option key={v} value={v}>{v}</option>)} </select> )}
          </div>
        </div>

        {sel.status === "미납" && ( <div style={{ background: "rgba(232,68,90,0.06)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}> <div> <p style={{ fontSize: 12, fontWeight: 800, color: "#e8445a", marginBottom: 2 }}>⚠️ 미납 세입자</p> <p style={{ fontSize: 11, color: "#8a8a9a" }}>수금 현황 확인 후 내용증명 발송을 권장합니다</p> </div> <div style={{ display: "flex", gap: 6 }}> <button onClick={() => router.push("/dashboard/payments")} style={{ padding: "6px 11px", borderRadius: 8, background: "transparent", border: "1px solid #e8445a50", color: "#e8445a", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>수금확인</button> <button onClick={() => router.push("/dashboard/certified")} style={{ padding: "6px 11px", borderRadius: 8, background: "#e8445a", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>내용증명 →</button> </div> </div> )}
        <div style={{ marginBottom: 14 }}><TenantCreditScore tenant={sel} /></div>
        {daysLeft(getEnd(sel)) > 0 && daysLeft(getEnd(sel)) <= 120 && <RenewalGuide tenant={sel} daysLeft={daysLeft(getEnd(sel))} />}
        {sel.status !== "미납" && daysLeft(getEnd(sel)) <= 90 && ( <div style={{ background: "rgba(232,150,10,0.06)", border: "1px solid rgba(232,150,10,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}> <div> <p style={{ fontSize: 12, fontWeight: 800, color: "#e8960a", marginBottom: 2 }}>📅 계약 만료 {daysLeft(getEnd(sel))}일 전</p> <p style={{ fontSize: 11, color: "#8a8a9a" }}>갱신 또는 퇴거 여부를 조속히 확인하세요</p> </div> <button onClick={() => router.push("/dashboard/contracts")} style={{ padding: "6px 11px", borderRadius: 8, background: "#e8960a", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>계약서 확인 →</button> </div> )}

        {/* ✅ ⑧ 상세 탭 — 계약정보 / 수리이력 / 연락기록 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #ebe9e3" }}>
          {[
            { key: "contract", label: "📋 계약 정보" },
            { key: "repairs", label: `🔨 수리 이력 ${selRepairs.length > 0 ? "("+selRepairs.length+")" : ""}` },
            { key: "contacts", label: "📝 연락 기록" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setDetailTab(tab.key)} style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", borderBottom: `2.5px solid ${detailTab === tab.key ? "#1a2744" : "transparent"}`, color: detailTab === tab.key ? "#1a2744" : "#8a8a9a", marginBottom: -1 }}>{tab.label}</button>
          ))}
        </div>

        {detailTab === "contract" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 13, padding: "18px" }}>
              <SectionLabel>CONTRACT</SectionLabel>
              {[ ["보증금", (sel.dep / 10000).toFixed(1) + "억원", undefined], ["월세", Number(sel.rent).toLocaleString() + "만원", C.emerald], ["만료일", getEnd(sel), daysLeft(getEnd(sel)) <= 90 ? C.amber : undefined], ["잔여일", "D-" + daysLeft(getEnd(sel)), daysLeft(getEnd(sel)) <= 60 ? C.rose : C.emerald], ].map(([l, v, a]) => ( <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #ebe9e3" }}> <span style={{ fontSize: 12, color: "#8a8a9a" }}>{l}</span> <span style={{ fontSize: 13, fontWeight: 600, color: a || C.text }}>{v}</span> </div> ))}
            </div>
            <RentHistoryChart tenant={sel} />
          </div>
        )}

        {detailTab === "repairs" && (
          <div>
            {selRepairs.length === 0 ? (
              <EmptyState icon="🔨" title="수리 이력이 없습니다" desc="수리 이력 페이지에서 이 세입자의 수리내역을 등록하세요" action="수리 이력 추가" onAction={() => router.push("/dashboard/repairs")} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selRepairs.map(r => (
                  <div key={r.id} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>🔨 {r.category}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.rose }}>{(r.cost||0).toLocaleString()}만원</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#8a8a9a" }}>{r.date} {r.vendor ? "· " + r.vendor : ""}</p>
                    {r.memo && <p style={{ fontSize: 12, color: "#1a2744", marginTop: 4 }}>{r.memo}</p>}
                  </div>
                ))}
                <div style={{ textAlign: "right", fontSize: 12, color: C.rose, fontWeight: 700 }}>총 수리비: {selRepairs.reduce((s,r) => s+(r.cost||0),0).toLocaleString()}만원</div>
              </div>
            )}
          </div>
        )}

        {detailTab === "contacts" && (
          <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 13, padding: "18px" }}>
            <TenantNotes tenantId={sel.id} userId={user?.id} />
          </div>
        )}
      </div>
    )}

    {/* ✅ ② 갱신 제안서 PDF 모달 */}
    <Modal open={showRenewal} onClose={() => setShowRenewal(false)} width={500}>
      {sel && <RenewalProposal tenant={sel} onClose={() => setShowRenewal(false)} />}
    </Modal>

    <Modal open={showContact} onClose={() => setShowContact(false)} width={420}> <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 16 }}>연락 기록 추가</h3> <div style={{ display: "flex", flexDirection: "column", gap: 13 }}> <div> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>연락 유형</p> <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}> {["납부확인", "수리요청", "갱신협의", "미납독촉", "기타"].map((t) => ( <button key={t} onClick={() => setContactNote((n) => ({ ...n, type: t }))} style={{ padding: "5px 11px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${contactNote.type === t ? C.indigo : "#ebe9e3"}`, background: contactNote.type === t ? C.indigo + "20" : "transparent", color: contactNote.type === t ? C.indigo : C.muted }}>{t}</button> ))} </div> </div> <div> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>내용</p> <textarea value={contactNote.note} onChange={(e) => setContactNote((n) => ({ ...n, note: e.target.value }))} placeholder="연락 내용을 입력하세요..." rows={3} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none" }} /> </div> <div style={{ display: "flex", gap: 9 }}> <button onClick={() => setShowContact(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button> <button onClick={addContact} disabled={saving} className="btn-primary" style={{ flex: 2, padding: "11px", borderRadius: 10, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{saving ? "저장 중..." : "저장하기"}</button> </div> </div> </Modal>
  </div> ); }