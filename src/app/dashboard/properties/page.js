"use client"; import { useState, useMemo } from "react"; import { useRouter } from "next/navigation"; import { Badge, SectionLabel, SearchBox, EmptyState, ConfirmDialog, Modal, AuthInput, SortButton, toast, InlineLoader } from "../../../components/shared"; import { C, STATUS_MAP, COLORS, daysLeft } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; import AddressInput from "../../../components/AddressInput"; function calcRentPerPyeong(rent, area_pyeong) { if (!rent || !area_pyeong || area_pyeong <= 0) return null; return Math.round((Number(rent) / Number(area_pyeong)) * 10) / 10; } function formatPayDay(pay_day) { if (!pay_day) return ""; if (Number(pay_day) === 99) return "말일"; return `매월 ${pay_day}일`; }

// ✅ 주소 기준 그룹핑 헬퍼
function groupByAddress(tenants) {
  const map = {};
  tenants.forEach(t => {
    const key = t.addr || "주소없음";
    if (!map[key]) map[key] = [];
    map[key].push(t);
  });
  // 단일 물건 주소는 그룹 아님, 2개 이상만 그룹
  return map;
}

// ✅ 공실 여부 판단: name이 "공실" 이거나 status가 "공실"
function isVacant(t) {
  return t.status === "공실" || t.name === "공실";
}

export default function PropertiesPage() { const { tenants, addTenant, updateTenant, deleteTenant, contracts, addContract, updateContract, loading, canUse, getPlanLimit } = useApp(); const [activeTab, setActiveTab] = useState("properties"); const [filter, setFilter] = useState("전체"); const [search, setSearch] = useState(""); const [sort, setSort] = useState({ key: "rent", dir: "desc" }); const [showModal, setShowModal] = useState(false); const [editTarget, setEditTarget] = useState(null); const [deleteTarget, setDeleteTarget] = useState(null); const [saving, setSaving] = useState(false);
  // ✅ 접힌 그룹 상태 관리
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const toggleGroup = (addr) => setCollapsedGroups(p => ({ ...p, [addr]: !p[addr] }));

  const [form, setForm] = useState({ pType: "주거", sub: "아파트", addr: "", rent: "", dep: "", name: "", phone: "", start: "", end: "", maintenance: "", pay_day: "5", area_pyeong: "", isVacant: false, unitLabel: "" }); const [showContractModal, setShowContractModal] = useState(false); const [contractForm, setContractForm] = useState({ tenant_id: "", start_date: "", end_date: "", rent: "", deposit: "", special_terms: "" }); const [contractEdit, setContractEdit] = useState(null); const resetForm = () => setForm({ pType: "주거", sub: "아파트", addr: "", rent: "", dep: "", name: "", phone: "", start: "", end: "", maintenance: "", pay_day: "5", area_pyeong: "", isVacant: false, unitLabel: "" }); const filtered = useMemo(() => { let list = [...tenants]; if (filter !== "전체") list = list.filter((t) => t.pType === filter); if (search) { const q = search.toLowerCase(); list = list.filter((t) => t.name?.toLowerCase().includes(q) || t.addr?.toLowerCase().includes(q) || t.sub?.toLowerCase().includes(q)); } list.sort((a, b) => { let va, vb; if (sort.key === "rent") { va = a.rent; vb = b.rent; } else if (sort.key === "dLeft") { va = daysLeft(a.end_date); vb = daysLeft(b.end_date); } else if (sort.key === "dep") { va = a.dep; vb = b.dep; } else if (sort.key === "rentPerPyeong") { va = calcRentPerPyeong(a.rent, a.area_pyeong) ?? -1; vb = calcRentPerPyeong(b.rent, b.area_pyeong) ?? -1; } else { va = a.name; vb = b.name; } if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); return sort.dir === "asc" ? va - vb : vb - va; }); return list; }, [tenants, filter, search, sort]);

  // ✅ 그룹핑된 뷰 계산 (주소 기준)
  const groupedView = useMemo(() => {
    const groups = {};
    filtered.forEach(t => {
      const key = t.addr || "주소없음";
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    // 순서 유지: 첫 번째 물건의 정렬 순서 기준
    const keys = Object.keys(groups);
    return keys.map(addr => ({ addr, items: groups[addr] }));
  }, [filtered]);

  const toggleSort = (key) => setSort(sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }); const openEdit = (t) => { setEditTarget(t); setForm({ pType: t.pType, sub: t.sub, addr: t.addr, rent: String(t.rent), dep: String(t.dep), name: t.status === "공실" ? "" : t.name, phone: t.phone || "", start: t.start_date || "", end: t.end_date || "", maintenance: String(t.maintenance || ""), pay_day: String(t.pay_day || "5"), area_pyeong: t.area_pyeong ? String(t.area_pyeong) : "", isVacant: t.status === "공실", unitLabel: t.biz || "" }); setShowModal(true); }; const saveTenant = async () => { if (!form.addr) { toast("주소를 입력하세요", "error"); return; } if (!form.isVacant && (!form.rent || !form.name)) { toast("필수 항목을 입력하세요", "error"); return; } const payDayRaw = form.pay_day === "99" ? 99 : parseInt(form.pay_day || "5"); if (!form.isVacant && (isNaN(payDayRaw) || (payDayRaw !== 99 && (payDayRaw < 1 || payDayRaw > 31)))) { toast("납부일은 1~31일 또는 말일로 입력하세요", "error"); return; } setSaving(true); try { const color = COLORS[Math.floor(Math.random() * COLORS.length)]; const payload = { name: form.isVacant ? "공실" : form.name, phone: form.isVacant ? "" : (form.phone || ""), pType: form.pType, sub: form.sub, addr: form.addr, dep: Number(form.dep || 0), rent: Number(form.rent || 0), start_date: form.start || null, end_date: form.end || "2026-12-31", status: form.isVacant ? "공실" : "정상", color, intent: "미확인", maintenance: Number(form.maintenance || 0), pay_day: form.isVacant ? 0 : payDayRaw, biz: form.unitLabel || null, contacts: [], area_pyeong: form.area_pyeong ? Number(form.area_pyeong) : null, }; if (editTarget) { await updateTenant(editTarget.id, payload); toast("물건 정보가 수정되었습니다"); } else { await addTenant(payload); toast(form.isVacant ? "공실이 등록되었습니다" : "새 물건이 등록되었습니다"); } setShowModal(false); resetForm(); setEditTarget(null); } catch (e) { toast("저장 중 오류가 발생했습니다", "error"); console.error(e); } finally { setSaving(false); } }; const handleDelete = async () => { if (!deleteTarget) return; try { await deleteTenant(deleteTarget.id); toast(deleteTarget.name + "님 물건이 삭제되었습니다"); } catch { toast("삭제 중 오류가 발생했습니다", "error"); } setDeleteTarget(null); }; const getEnd = (t) => t.end_date || t.end || "";

  // ✅ 그룹 헤더 렌더링
  const renderGroupHeader = (addr, items) => {
    const isCollapsed = collapsedGroups[addr];
    const vacantCount = items.filter(t => t.status === "공실").length;
    const occupiedCount = items.length - vacantCount;
    const totalRent = items.filter(t => t.status !== "공실").reduce((s, t) => s + (t.rent || 0), 0);
    return (
      <div key={"gh-" + addr} onClick={() => toggleGroup(addr)} style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 12, padding: "13px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCollapsed ? 0 : 6 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🏢</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{addr}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
              총 {items.length}호 · 입주 {occupiedCount}호{vacantCount > 0 ? ` · ` : ""}
              {vacantCount > 0 && <span style={{ color: "#fbbf24", fontWeight: 700 }}>공실 {vacantCount}호</span>}
              {totalRent > 0 && ` · 월 ${totalRent.toLocaleString()}만원`}
            </p>
          </div>
        </div>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, transition: "transform .2s", display: "inline-block", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</span>
      </div>
    );
  };

  // ✅ 개별 물건 카드 렌더링
  const renderTenantCard = (t, isSubItem) => {
    const dl = daysLeft(getEnd(t));
    const rentPerPyeong = calcRentPerPyeong(t.rent, t.area_pyeong);
    const vacant = t.status === "공실";
    return (
      <div key={t.id} className="hover-lift" style={{ background: vacant ? "rgba(251,191,36,0.04)" : "#ffffff", border: `1px solid ${vacant ? "#fbbf2440" : "#ebe9e3"}`, borderRadius: 12, padding: "14px 18px", marginLeft: isSubItem ? 16 : 0, borderLeft: isSubItem ? `3px solid ${vacant ? "#fbbf24" : C.indigo + "60"}` : undefined }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: vacant ? "#fbbf2420" : (t.color || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
              {vacant ? "🔑" : t.pType === "상가" ? "🏪" : t.pType === "토지" ? "🌱" : "🏠"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
                {t.biz && <span style={{ fontSize: 10, fontWeight: 800, color: "#1a2744", background: "#e8e6ff", padding: "2px 7px", borderRadius: 5 }}>{t.biz}</span>}
                <span style={{ fontSize: 10, fontWeight: 700, color: t.pType === "상가" ? C.amber : t.pType === "토지" ? "#0d9488" : C.indigo, background: t.pType === "상가" ? C.amber + "18" : t.pType === "토지" ? "#0d948818" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span>
                {vacant ? <span style={{ fontSize: 10, fontWeight: 800, color: "#d97706", background: "#fef3c7", padding: "2px 8px", borderRadius: 5 }}>공실</span> : <Badge label={t.status} map={STATUS_MAP} />}
                {t.area_pyeong && <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 7px", borderRadius: 5 }}>{t.area_pyeong}평</span>}
              </div>
              {!isSubItem && <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{t.addr}</p>}
              {vacant
                ? <p style={{ fontSize: 11, color: "#d97706", marginTop: 2, fontWeight: 600 }}>🔑 임차인 없음 · 공실 중</p>
                : <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>👤 {t.name} · {t.phone}{t.pay_day ? ` · ${formatPayDay(t.pay_day)} 납부` : ""}</p>
              }
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {!vacant && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 17, fontWeight: 800, color: "#1a2744" }}>{Number(t.rent).toLocaleString()}만원<span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 400 }}>/월</span></p>
                <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 1 }}>보증금 {(t.dep / 10000).toFixed(1)}억</p>
                {rentPerPyeong !== null && <p style={{ fontSize: 11, color: "#5b4fcf", fontWeight: 700, marginTop: 2 }}>평당 {rentPerPyeong}만원</p>}
                <p style={{ fontSize: 11, color: dl <= 60 ? C.amber : C.muted, marginTop: 2, fontWeight: 600 }}>만료 D-{dl}</p>
              </div>
            )}
            {vacant && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#d97706" }}>공실</p>
                {t.rent > 0 && <p style={{ fontSize: 11, color: "#8a8a9a" }}>희망 {Number(t.rent).toLocaleString()}만원</p>}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button onClick={() => openEdit(t)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #ebe9e3", background: "transparent", color: "#1a2744" }}>수정</button>
              <button onClick={() => setDeleteTarget(t)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${C.rose}33`, background: "transparent", color: "#e8445a" }}>삭제</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return ( <div className="page-in page-padding" style={{ maxWidth: 920 }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12 }}> <div> <SectionLabel>PROPERTY MANAGEMENT</SectionLabel> <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>물건 관리</h1> </div> <button onClick={() => { const limit = getPlanLimit("properties"); if (limit !== Infinity && tenants.length >= limit) { alert(`현재 플랜에서는 물건을 최대 ${limit}개까지 등록할 수 있어요.\n업그레이드하면 더 많이 등록할 수 있어요!`); window.location.href = "/dashboard/pricing"; return; } resetForm(); setEditTarget(null); setShowModal(true); }} className="btn-primary" style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}> + 물건 추가 </button> </div> <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid #ebe9e3", paddingBottom: 0 }}> {[ { key: "properties", label: "🏠 물건 목록", count: tenants.length }, { key: "contracts", label: "📝 계약서", count: contracts?.length || 0 }, ].map(tab => ( <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", borderBottom: `2.5px solid ${activeTab === tab.key ? "#1a2744" : "transparent"}`, color: activeTab === tab.key ? "#1a2744" : "#8a8a9a", marginBottom: -1, transition: "all .15s" }}> {tab.label} <span style={{ fontSize: 11, background: activeTab === tab.key ? "#1a274415" : "#f0efe9", padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>{tab.count}</span> </button> ))} </div> {activeTab === "contracts" && ( <div> <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}> <button onClick={() => { setContractEdit(null); setContractForm({ tenant_id: "", start_date: "", end_date: "", rent: "", deposit: "", special_terms: "" }); setShowContractModal(true); }} style={{ padding: "9px 18px", borderRadius: 10, background: `linear-gradient(135deg,#1a2744,#5b4fcf)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}> + 계약서 작성 </button> </div> {!contracts?.length ? ( <EmptyState icon="📝" title="등록된 계약서가 없습니다" desc="계약서 작성 버튼으로 첫 계약서를 등록하세요" /> ) : ( <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}> {contracts.map((c, i) => { const tenant = tenants.find(t => t.id === c.tenant_id); const dl = c.end_date ? Math.ceil((new Date(c.end_date) - new Date()) / 86400000) : null; return ( <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < contracts.length - 1 ? "1px solid #f0efe9" : "none" }}> <div> <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}> <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{tenant?.name || c.tenant_name || "알수없음"}</span> {dl !== null && <span style={{ fontSize: 10, fontWeight: 700, color: dl <= 90 ? "#e8445a" : "#8a8a9a", background: dl <= 90 ? "rgba(232,68,90,0.1)" : "#f0efe9", padding: "2px 8px", borderRadius: 20 }}>만료 D-{dl}</span>} </div> <p style={{ fontSize: 12, color: "#8a8a9a" }}> {c.start_date || "—"} ~ {c.end_date || "—"} &nbsp;·&nbsp; 월세 {Number(c.rent || tenant?.rent || 0).toLocaleString()}만원 &nbsp;·&nbsp; 보증금 {Number(c.deposit || tenant?.dep || 0).toLocaleString()}만원 </p> {c.special_terms && <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 3 }}>📌 {c.special_terms.slice(0, 60)}{c.special_terms.length > 60 ? "..." : ""}</p>} </div> <button onClick={() => { setContractEdit(c); setContractForm({ tenant_id: c.tenant_id || "", start_date: c.start_date || "", end_date: c.end_date || "", rent: c.rent || "", deposit: c.deposit || "", special_terms: c.special_terms || "" }); setShowContractModal(true); }} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #ebe9e3", background: "transparent", color: "#1a2744" }}>수정</button> </div> ); })} </div> )} </div> )} <Modal open={showContractModal} onClose={() => setShowContractModal(false)}> <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 18 }}>{contractEdit ? "계약서 수정" : "계약서 작성"}</h2> <div style={{ display: "flex", flexDirection: "column", gap: 13 }}> <div> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>세입자</p> <select value={contractForm.tenant_id} onChange={e => setContractForm(f => ({ ...f, tenant_id: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ebe9e3", fontSize: 13, color: "#1a2744", background: "#f8f7f4", outline: "none" }}> <option value="">선택하세요</option> {tenants.filter(t => t.status !== "공실").map(t => <option key={t.id} value={t.id}>{t.name} — {t.addr}</option>)} </select> </div> <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}> <AuthInput label="계약 시작일" type="date" value={contractForm.start_date} onChange={e => setContractForm(f => ({ ...f, start_date: e.target.value }))} /> <AuthInput label="계약 종료일" type="date" value={contractForm.end_date} onChange={e => setContractForm(f => ({ ...f, end_date: e.target.value }))} /> </div> <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}> <AuthInput label="월세 (만원)" type="number" placeholder="120" value={contractForm.rent} onChange={e => setContractForm(f => ({ ...f, rent: e.target.value }))} icon="💰" /> <AuthInput label="보증금 (만원)" type="number" placeholder="5000" value={contractForm.deposit} onChange={e => setContractForm(f => ({ ...f, deposit: e.target.value }))} icon="🏦" /> </div> <div> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>특약 사항</p> <textarea value={contractForm.special_terms} onChange={e => setContractForm(f => ({ ...f, special_terms: e.target.value }))} placeholder="특약 사항을 입력하세요..." rows={3} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none", fontFamily: "inherit" }} /> </div> <div style={{ display: "flex", gap: 10 }}> <button onClick={() => setShowContractModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button> <button onClick={async () => { setSaving(true); try { const tenant = tenants.find(t => t.id === contractForm.tenant_id); const payload = { ...contractForm, rent: Number(contractForm.rent || 0), deposit: Number(contractForm.deposit || 0), tenant_name: tenant?.name || "" }; if (contractEdit) await updateContract(contractEdit.id, payload); else await addContract(payload); toast(contractEdit ? "계약서가 수정되었습니다" : "계약서가 등록되었습니다"); setShowContractModal(false); } catch { toast("저장 중 오류가 발생했습니다", "error"); } finally { setSaving(false); } }} disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,#1a2744,#5b4fcf)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}> {saving ? "저장 중..." : contractEdit ? "수정 완료" : "저장하기"} </button> </div> </div> </Modal> {activeTab === "properties" && (<> <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}> <div style={{ display: "flex", gap: 7 }}> {["전체", "주거", "상가", "토지"].map((f) => ( <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 16px", borderRadius: 18, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter === f ? C.indigo : "#ebe9e3"}`, background: filter === f ? C.indigo + "20" : "transparent", color: filter === f ? C.indigo : C.muted }}>{f}</button> ))} </div> <div style={{ flex: 1, minWidth: 180 }}><SearchBox value={search} onChange={setSearch} placeholder="이름, 주소, 유형 검색..." /></div> <div style={{ display: "flex", gap: 5 }}> <SortButton label="월세" active={sort.key === "rent"} dir={sort.dir} onClick={() => toggleSort("rent")} /> <SortButton label="평당" active={sort.key === "rentPerPyeong"} dir={sort.dir} onClick={() => toggleSort("rentPerPyeong")} /> <SortButton label="만료일" active={sort.key === "dLeft"} dir={sort.dir} onClick={() => toggleSort("dLeft")} /> <SortButton label="이름" active={sort.key === "name"} dir={sort.dir} onClick={() => toggleSort("name")} /> </div> </div>
      {loading ? <InlineLoader rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon="🏠" title={search ? "검색 결과가 없습니다" : "등록된 물건이 없습니다"} desc={search ? "다른 키워드로 검색해보세요" : "첫 물건을 추가해보세요"} action={!search ? "+ 물건 추가" : null} onAction={() => { resetForm(); setShowModal(true); }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groupedView.map(({ addr, items }) => {
            const isGroup = items.length > 1;
            const isCollapsed = collapsedGroups[addr];
            if (!isGroup) {
              // 단일 물건: 기존 카드 그대로
              return renderTenantCard(items[0], false);
            }
            // 다중 물건: 그룹 헤더 + 하위 카드
            return (
              <div key={addr}>
                {renderGroupHeader(addr, items)}
                {!isCollapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
                    {items.map(t => renderTenantCard(t, true))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Modal open={showModal} onClose={null}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a2744" }}>{editTarget ? "물건 수정" : "물건 추가"}</h2>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 4 }}>{editTarget ? "물건 정보를 수정합니다" : "새 임대 물건 정보를 입력하세요"}</p>
        </div>
        {/* ✅ 공실 토글 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: form.isVacant ? "#fef3c720" : "#f8f7f4", border: `1.5px solid ${form.isVacant ? "#fbbf24" : "#ebe9e3"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }} onClick={() => setForm(f => ({ ...f, isVacant: !f.isVacant }))}>
          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${form.isVacant ? "#f59e0b" : "#ebe9e3"}`, background: form.isVacant ? "#f59e0b" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {form.isVacant && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1 }}>✓</span>}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: form.isVacant ? "#d97706" : "#1a2744" }}>🔑 공실로 등록</p>
            <p style={{ fontSize: 11, color: "#8a8a9a" }}>임차인 없이 빈 호실로 등록합니다</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10 }}> {[{ type: "주거", icon: "🏠", defaultSub: "아파트" }, { type: "상가", icon: "🏪", defaultSub: "1층 상가" }, { type: "토지", icon: "🌱", defaultSub: "전·답" }].map(({ type, icon, defaultSub }) => ( <button key={type} onClick={() => setForm((f) => ({ ...f, pType: type, sub: defaultSub }))} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `2px solid ${form.pType === type ? (type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo) : "#ebe9e3"}`, background: form.pType === type ? (type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo) + "18" : "transparent", color: form.pType === type ? (type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo) : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{icon} {type}</button> ))} </div>
          <div> <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>세부 유형</p> <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}> {(form.pType === "주거" ? ["아파트", "빌라", "오피스텔", "단독주택", "다세대"] : form.pType === "상가" ? ["1층 상가", "2층 이상", "지하", "사무실", "창고·물류"] : ["전·답", "임야", "대지", "잡종지", "기타 토지"]).map((s) => ( <button key={s} onClick={() => setForm((f) => ({ ...f, sub: s }))} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: form.sub === s ? (form.pType === "상가" ? C.amber : form.pType === "토지" ? "#0d9488" : C.indigo) : "#f0efe9", color: form.sub === s ? "#fff" : "#8a8a9a", transition: "all .15s" }}>{s}</button> ))} </div> </div>
          {/* ✅ 호실/업체명 라벨 */}
          <AuthInput label="호실·업체명 (선택)" placeholder="예: 101호, 1층 편의점, 2층 학원" value={form.unitLabel} onChange={(e) => setForm((f) => ({ ...f, unitLabel: e.target.value }))} icon="🏷️" />
          {!form.isVacant && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <AuthInput label="세입자 이름 *" placeholder="홍길동" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} icon="👤" />
              <AuthInput label="연락처" placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} icon="📞" />
            </div>
          )}
          <AddressInput label="주소" value={form.addr} onChange={(v) => setForm((f) => ({ ...f, addr: v }))} onSelect={(v) => setForm((f) => ({ ...f, addr: v }))} placeholder="마포구 합정동 123" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label={form.pType === "토지" ? "토지 가액 (만원)" : form.isVacant ? "희망 보증금 (만원)" : "보증금 (만원)"} placeholder={form.pType === "토지" ? "100000" : "50000"} value={form.dep} onChange={(e) => setForm((f) => ({ ...f, dep: e.target.value }))} icon="💵" />
            <AuthInput label={form.pType === "토지" ? "월 임대료 (만원)" : form.isVacant ? "희망 월세 (만원)" : "월세 (만원) *"} placeholder={form.pType === "토지" ? "50" : "120"} value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} icon="💰" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label="전용면적 (평)" placeholder="예: 15 (약 49㎡)" type="number" value={form.area_pyeong} onChange={(e) => setForm((f) => ({ ...f, area_pyeong: e.target.value }))} icon="📐" />
            <div style={{ background: "rgba(91,79,207,0.05)", border: "1px solid rgba(91,79,207,0.2)", borderRadius: 10, padding: "10px 13px", display: "flex", alignItems: "center" }}> <div> <p style={{ fontSize: 11, fontWeight: 700, color: "#5b4fcf", marginBottom: 3 }}>평당 월세</p> <p style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>{calcRentPerPyeong(form.rent, form.area_pyeong) ? `${calcRentPerPyeong(form.rent, form.area_pyeong)}만원/평` : "—"}</p> <p style={{ fontSize: 10, color: "#8a8a9a", marginTop: 2 }}>월세 ÷ 평형</p> </div> </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label="계약 시작일" type="date" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} />
            <AuthInput label="계약 만료일" type="date" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} />
          </div>
          {!form.isVacant && (
            <div style={{ background: "rgba(26,39,68,0.03)", border: "1px solid rgba(26,39,68,0.1)", borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>📅 납부일 설정</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}> {[1, 5, 10, 15, 20, 25].map(d => ( <button key={d} onClick={() => setForm(f => ({ ...f, pay_day: String(d) }))} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${form.pay_day === String(d) ? C.indigo : "#ebe9e3"}`, background: form.pay_day === String(d) ? C.indigo : "transparent", color: form.pay_day === String(d) ? "#fff" : "#8a8a9a", transition: "all .15s" }}>{d}일</button> ))} <button onClick={() => setForm(f => ({ ...f, pay_day: "99" }))} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${form.pay_day === "99" ? C.indigo : "#ebe9e3"}`, background: form.pay_day === "99" ? C.indigo : "transparent", color: form.pay_day === "99" ? "#fff" : "#8a8a9a", transition: "all .15s" }}>말일</button> </div>
              {form.pay_day !== "99" && ( <div style={{ display: "flex", alignItems: "center", gap: 8 }}> <span style={{ fontSize: 12, color: "#8a8a9a" }}>직접 입력:</span> <input type="number" min={1} max={31} value={form.pay_day} onChange={e => setForm(f => ({ ...f, pay_day: e.target.value }))} style={{ width: 70, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #ebe9e3", fontSize: 13, fontWeight: 700, color: "#1a2744", textAlign: "center", outline: "none" }} /> <span style={{ fontSize: 12, color: "#8a8a9a" }}>일 (매월)</span> </div> )}
              {form.pay_day === "99" && ( <p style={{ fontSize: 12, color: "#5b4fcf", fontWeight: 600 }}>💡 매월 말일(28~31일)에 납부 처리됩니다</p> )}
            </div>
          )}
          {(form.pType === "상가" || form.sub === "오피스텔") && !form.isVacant && ( <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}> <AuthInput label="관리비 (만원/월)" placeholder="예: 15" value={form.maintenance} onChange={(e) => setForm((f) => ({ ...f, maintenance: e.target.value }))} icon="🏢" /> <div style={{ background: "rgba(15,165,115,0.06)", border: "1px solid rgba(15,165,115,0.2)", borderRadius: 10, padding: "10px 13px", display: "flex", alignItems: "center" }}> <div> <p style={{ fontSize: 11, fontWeight: 700, color: "#0fa573", marginBottom: 3 }}>총 월 수익</p> <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}> {form.rent && form.maintenance ? `월 ${(Number(form.rent) + Number(form.maintenance)).toLocaleString()}만원` : form.rent ? `월 ${Number(form.rent).toLocaleString()}만원` : "—"} </p> <p style={{ fontSize: 10, color: "#8a8a9a", marginTop: 2 }}>월세 + 관리비</p> </div> </div> </div> )}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button onClick={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={saveTenant} disabled={saving} className="btn-primary" style={{ flex: 2, padding: "12px", borderRadius: 11, background: form.isVacant ? "linear-gradient(135deg,#d97706,#f59e0b)" : `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}> {saving ? "저장 중..." : editTarget ? "저장하기" : form.isVacant ? "공실 등록" : "등록하기"} </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} title="물건 삭제" desc={deleteTarget ? `${deleteTarget.name}님의 ${deleteTarget.addr} 물건을 삭제하시겠습니까?` : ""} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />
    </>)}
    <div style={{ marginTop: 20, background: "linear-gradient(135deg,rgba(59,91,219,0.05),rgba(91,79,207,0.03))", border: "1px solid rgba(59,91,219,0.15)", borderRadius: 16, padding: "16px 20px" }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}> <div style={{ display: "flex", gap: 12, alignItems: "center" }}> <span style={{ fontSize: 28 }}>🧾</span> <div> <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 2 }}>임대 소득세 신고 · 절세 전략이 필요하신가요?</p> <p style={{ fontSize: 11, color: "#8a8a9a" }}>제휴 세무사가 임대인 전문 세무 서비스를 제공합니다 · 첫 상담 무료</p> </div> </div> <button onClick={() => alert("🚧 세무사 연결 서비스 준비 중입니다.\n빠른 시일 내에 오픈할게요!")} style={{ padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg,#3b5bdb,#5b4fcf)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}> 세무사 연결 → </button> </div> </div>
  </div> ); }