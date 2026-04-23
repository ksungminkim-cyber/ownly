"use client"; import { useState, useMemo, useEffect } from "react"; import { useRouter } from "next/navigation"; import { Badge, SectionLabel, SearchBox, EmptyState, ConfirmDialog, Modal, AuthInput, SortButton, toast, InlineLoader } from "../../../components/shared"; import { C, STATUS_MAP, COLORS, daysLeft, groupByBuilding } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; import AddressInput from "../../../components/AddressInput"; import PlanLimitBanner from "../../../components/PlanLimitBanner"; function calcRentPerPyeong(rent, area_pyeong) { if (!rent || !area_pyeong || area_pyeong <= 0) return null; return Math.round((Number(rent) / Number(area_pyeong)) * 10) / 10; } function formatPayDay(pay_day) { if (!pay_day) return ""; if (Number(pay_day) === 99) return "말일"; return `매월 ${pay_day}일`; }

// biz 필드: 상가의 경우 JSON {industry,premium,rentFree,vatIncluded} 저장, 과거 데이터는 plain text 업종명으로 호환
function parseCommercialMeta(biz) {
  const empty = { industry: "", premium: 0, rentFree: 0, vatIncluded: false };
  if (!biz) return empty;
  try {
    const obj = JSON.parse(biz);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) return { ...empty, ...obj };
  } catch {}
  return { ...empty, industry: String(biz) };
}

function buildCommercialBiz(form) {
  if (form.pType !== "상가") return null;
  const hasAny = form.industry || form.premium || form.rentFree || form.vatIncluded;
  if (!hasAny) return null;
  return JSON.stringify({
    industry: form.industry || "",
    premium: form.premium ? Number(form.premium) : 0,
    rentFree: form.rentFree ? Number(form.rentFree) : 0,
    vatIncluded: !!form.vatIncluded,
  });
}

// ✅ 임대 조건 히스토리 컴포넌트
function LeaseHistoryTab({ tenants, contracts }) {
  const [selectedAddr, setSelectedAddr] = useState("전체");

  // 주소별 물건 목록 추출
  const addrs = useMemo(() => {
    const set = new Set(tenants.map(t => t.addr).filter(Boolean));
    return ["전체", ...Array.from(set)];
  }, [tenants]);

  // 계약+세입자 이력 합산
  const allHistory = useMemo(() => {
    const items = [];

    // contracts 테이블의 계약 이력
    (contracts || []).forEach(c => {
      const tenant = tenants.find(t => t.id === c.tenant_id);
      if (tenant) {
        items.push({
          id: `c_${c.id}`,
          addr: tenant.addr,
          name: tenant.name || c.tenant_name || "—",
          pType: tenant.pType,
          sub: tenant.sub,
          rent: Number(c.rent || tenant.rent || 0),
          dep: Number(c.deposit || tenant.dep || 0),
          start: c.start_date,
          end: c.end_date,
          special: c.special_terms || "",
          source: "계약서",
          color: tenant.color,
        });
      }
    });

    // contracts에 없는 현재 세입자도 이력에 포함
    tenants.forEach(t => {
      const alreadyIn = items.find(i => i.addr === t.addr && i.name === t.name && i.start === t.start_date);
      if (!alreadyIn) {
        items.push({
          id: `t_${t.id}`,
          addr: t.addr,
          name: t.name,
          pType: t.pType,
          sub: t.sub,
          rent: Number(t.rent || 0),
          dep: Number(t.dep || 0),
          start: t.start_date,
          end: t.end_date,
          special: "",
          source: "현재",
          color: t.color,
          isCurrent: t.status !== "공실",
        });
      }
    });

    return items.sort((a, b) => {
      if (!a.start) return 1;
      if (!b.start) return -1;
      return new Date(b.start) - new Date(a.start);
    });
  }, [tenants, contracts]);

  const filtered = selectedAddr === "전체"
    ? allHistory
    : allHistory.filter(h => h.addr === selectedAddr);

  // 주소별 그룹핑
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(h => {
      if (!g[h.addr]) g[h.addr] = [];
      g[h.addr].push(h);
    });
    return g;
  }, [filtered]);

  // 임대료 트렌드: 같은 주소의 이력에서 월세 변화 계산
  const rentTrend = (items) => {
    if (items.length < 2) return null;
    const sorted = [...items].filter(i => i.rent > 0 && i.start).sort((a, b) => new Date(a.start) - new Date(b.start));
    if (sorted.length < 2) return null;
    const first = sorted[0].rent;
    const last = sorted[sorted.length - 1].rent;
    const diff = last - first;
    const pct = ((diff / first) * 100).toFixed(1);
    return { diff, pct, first, last };
  };

  if (allHistory.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="임대 이력이 없습니다"
        desc="계약서를 등록하거나 물건을 추가하면 이력이 쌓입니다"
      />
    );
  }

  return (
    <div>
      {/* 주소 필터 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {addrs.map(addr => (
          <button key={addr} onClick={() => setSelectedAddr(addr)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${selectedAddr === addr ? "#1a2744" : "#ebe9e3"}`, background: selectedAddr === addr ? "#1a2744" : "transparent", color: selectedAddr === addr ? "#fff" : "#8a8a9a", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {addr === "전체" ? "전체" : addr.length > 16 ? addr.slice(0, 16) + "..." : addr}
          </button>
        ))}
      </div>

      {/* 물건별 이력 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {Object.entries(grouped).map(([addr, items]) => {
          const trend = rentTrend(items);
          const typeColor = items[0]?.pType === "상가" ? C.amber : items[0]?.pType === "토지" ? "#0d9488" : C.indigo;

          return (
            <div key={addr} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}>
              {/* 물건 헤더 */}
              <div style={{ padding: "14px 20px", background: "#f8f7f4", borderBottom: "1px solid #ebe9e3", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 2 }}>{addr}</p>
                  <p style={{ fontSize: 12, color: "#8a8a9a" }}>총 {items.length}건의 임대 이력</p>
                </div>
                {trend && (
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 2 }}>임대료 변화</p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: trend.diff > 0 ? "#0fa573" : trend.diff < 0 ? "#e8445a" : "#8a8a9a" }}>
                      {trend.first.toLocaleString()}만 → {trend.last.toLocaleString()}만원
                      <span style={{ fontSize: 11, marginLeft: 4 }}>({trend.diff > 0 ? "+" : ""}{trend.pct}%)</span>
                    </p>
                  </div>
                )}
              </div>

              {/* 타임라인 */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ position: "relative" }}>
                  {/* 세로 타임라인 선 */}
                  <div style={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, background: "#f0efe9", zIndex: 0 }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {items.map((h, i) => (
                      <div key={h.id} style={{ display: "flex", gap: 16, position: "relative", zIndex: 1 }}>
                        {/* 타임라인 도트 */}
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: h.isCurrent ? typeColor : "#e8e6e0", border: `2px solid ${h.isCurrent ? typeColor : "#d0cfc8"}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                          {h.isCurrent && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                        </div>

                        {/* 이력 카드 */}
                        <div style={{ flex: 1, background: h.isCurrent ? typeColor + "08" : "#fafaf8", border: `1px solid ${h.isCurrent ? typeColor + "30" : "#ebe9e3"}`, borderRadius: 12, padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>{h.name}</span>
                              {h.isCurrent && (
                                <span style={{ fontSize: 12, fontWeight: 700, color: typeColor, background: typeColor + "18", padding: "2px 7px", borderRadius: 10 }}>현재</span>
                              )}
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#8a8a9a", background: "#f0efe9", padding: "2px 6px", borderRadius: 5 }}>{h.source}</span>
                            </div>
                            <span style={{ fontSize: 11, color: "#8a8a9a" }}>
                              {h.start || "—"} ~ {h.end || "—"}
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8 }}>
                            {[
                              { l: "월세", v: `${h.rent.toLocaleString()}만원`, c: "#0fa573" },
                              { l: "보증금", v: h.dep > 0 ? `${h.dep.toLocaleString()}만원` : "—", c: "#1a2744" },
                              { l: "수익률", v: h.dep > 0 ? `${((h.rent * 12 / h.dep) * 100).toFixed(1)}%` : "—", c: h.dep > 0 && (h.rent * 12 / h.dep) * 100 >= 5 ? "#0fa573" : "#e8960a" },
                            ].map(k => (
                              <div key={k.l} style={{ background: "#fff", borderRadius: 8, padding: "6px 10px" }}>
                                <p style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 700, marginBottom: 2 }}>{k.l}</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: k.c }}>{k.v}</p>
                              </div>
                            ))}
                          </div>

                          {h.special && (
                            <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 8, padding: "6px 10px", background: "rgba(26,39,68,0.04)", borderRadius: 8 }}>
                              📌 특약: {h.special}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PropertiesPage() { const router = useRouter(); const { tenants, buildings, addTenant, updateTenant, deleteTenant, contracts, addContract, updateContract, loading, canUse, getPlanLimit, user, userPlan } = useApp(); const [activeTab, setActiveTab] = useState("properties"); const [filter, setFilter] = useState("전체"); const [search, setSearch] = useState(""); const [sort, setSort] = useState({ key: "rent", dir: "desc" }); const [viewMode, setViewMode] = useState("flat"); const [expandedBuildings, setExpandedBuildings] = useState({}); const [showModal, setShowModal] = useState(false); const [editTarget, setEditTarget] = useState(null); const [deleteTarget, setDeleteTarget] = useState(null); const [saving, setSaving] = useState(false); const [form, setForm] = useState({ pType: "주거", sub: "아파트", addr: "", rent: "", dep: "", name: "", phone: "", start: "", end: "", maintenance: "", pay_day: "5", area_pyeong: "", isVacant: false, industry: "", premium: "", rentFree: "", vatIncluded: false, building_id: null });

  // URL 쿼리로 호실 추가 자동 오픈 (/dashboard/properties?newUnit=1&buildingId=...&addr=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const newUnit = params.get("newUnit");
    const bid = params.get("buildingId");
    const addr = params.get("addr");
    if (newUnit === "1" && (bid || addr)) {
      setEditTarget(null);
      setForm(f => ({ ...f, addr: addr || "", building_id: bid || null }));
      setShowModal(true);
      const u = new URL(window.location.href);
      u.searchParams.delete("newUnit"); u.searchParams.delete("buildingId"); u.searchParams.delete("addr");
      window.history.replaceState({}, "", u.toString());
    }
  }, []); const [showContractModal, setShowContractModal] = useState(false); const [contractForm, setContractForm] = useState({ tenant_id: "", start_date: "", end_date: "", rent: "", deposit: "", special_terms: "" }); const [contractEdit, setContractEdit] = useState(null); const resetForm = () => setForm({ pType: "주거", sub: "아파트", addr: "", rent: "", dep: "", name: "", phone: "", start: "", end: "", maintenance: "", pay_day: "5", area_pyeong: "", isVacant: false, industry: "", premium: "", rentFree: "", vatIncluded: false });
  const [showQuick, setShowQuick] = useState(false);
  const [quick, setQuick] = useState({ addr: "", rent: "", name: "", end: "" });
  const saveQuick = async () => {
    if (!quick.addr) { toast("주소를 입력하세요", "error"); return; }
    if (!quick.rent || Number(quick.rent) <= 0) { toast("월세를 입력하세요", "error"); return; }
    setSaving(true);
    try {
      const today = new Date();
      const nextYear = new Date(); nextYear.setFullYear(today.getFullYear() + 1);
      await addTenant({
        name: quick.name || "미등록",
        phone: "",
        pType: "주거", sub: "아파트",
        addr: quick.addr,
        dep: 0,
        rent: Number(quick.rent),
        start_date: today.toISOString().slice(0, 10),
        end_date: quick.end || nextYear.toISOString().slice(0, 10),
        status: "정상",
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        intent: "미확인",
        maintenance: 0,
        pay_day: 5,
        biz: null, contacts: [],
        area_pyeong: null, building_id: null,
      });
      toast(`✨ "${quick.addr}" 물건 등록 완료! 연간 예상 수입 ${(Number(quick.rent) * 12).toLocaleString()}만원`);
      setShowQuick(false);
      setQuick({ addr: "", rent: "", name: "", end: "" });
    } catch (e) {
      const msg = e?.message || e?.details || "알 수 없는 오류";
      toast("저장 실패: " + msg + " — 다시 시도하거나 상세 입력을 이용해주세요", "error");
      console.error("[quickAdd]", e);
    } finally {
      setSaving(false);
    }
  }; const filtered = useMemo(() => { let list = [...tenants]; if (filter !== "전체") list = list.filter((t) => t.pType === filter); if (search) { const q = search.toLowerCase(); list = list.filter((t) => t.name?.toLowerCase().includes(q) || t.addr?.toLowerCase().includes(q) || t.sub?.toLowerCase().includes(q)); } list.sort((a, b) => { let va, vb; if (sort.key === "rent") { va = a.rent; vb = b.rent; } else if (sort.key === "dLeft") { va = daysLeft(a.end_date); vb = daysLeft(b.end_date); } else if (sort.key === "dep") { va = a.dep; vb = b.dep; } else if (sort.key === "rentPerPyeong") { va = calcRentPerPyeong(a.rent, a.area_pyeong) ?? -1; vb = calcRentPerPyeong(b.rent, b.area_pyeong) ?? -1; } else { va = a.name; vb = b.name; } if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); return sort.dir === "asc" ? va - vb : vb - va; }); return list; }, [tenants, filter, search, sort]); const toggleSort = (key) => setSort(sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }); const openEdit = (t) => { setEditTarget(t); const commercial = parseCommercialMeta(t.biz); setForm({ pType: t.pType, sub: t.sub, addr: t.addr, rent: String(t.rent || ""), dep: String(t.dep || ""), name: t.name || "", phone: t.phone || "", start: t.start_date || "", end: t.end_date || "", maintenance: String(t.maintenance || ""), pay_day: String(t.pay_day || "5"), area_pyeong: t.area_pyeong ? String(t.area_pyeong) : "", isVacant: t.status === "공실", industry: commercial.industry, premium: commercial.premium ? String(commercial.premium) : "", rentFree: commercial.rentFree ? String(commercial.rentFree) : "", vatIncluded: !!commercial.vatIncluded }); setShowModal(true); }; const saveTenant = async () => { if (!form.addr) { toast("주소를 입력하세요", "error"); return; } if (!form.isVacant && (!form.rent || !form.name)) { toast("세입자 이름과 월세를 입력하세요", "error"); return; } if (form.isVacant && !form.rent) { toast("기대 월세를 입력하세요", "error"); return; } const payDayRaw = form.pay_day === "99" ? 99 : parseInt(form.pay_day || "5"); if (isNaN(payDayRaw) || (payDayRaw !== 99 && (payDayRaw < 1 || payDayRaw > 31))) { toast("납부일은 1~31일 또는 말일로 입력하세요", "error"); return; } setSaving(true); try { const color = COLORS[Math.floor(Math.random() * COLORS.length)]; const payload = { name: form.isVacant ? (form.name || "공실") : form.name, phone: form.phone || "", pType: form.pType, sub: form.sub, addr: form.addr, dep: Number(form.dep || 0), rent: Number(form.rent), start_date: form.start || null, end_date: form.end || (form.isVacant ? null : "2026-12-31"), status: form.isVacant ? "공실" : "정상", color, intent: form.isVacant ? "공실" : "미확인", maintenance: Number(form.maintenance || 0), pay_day: payDayRaw, biz: buildCommercialBiz(form), contacts: [], area_pyeong: form.area_pyeong ? Number(form.area_pyeong) : null, building_id: form.building_id || null, }; if (editTarget) { await updateTenant(editTarget.id, payload); toast("물건 정보가 수정되었습니다"); } else { await addTenant(payload); toast(form.isVacant ? "공실 물건이 등록되었습니다" : "새 물건이 등록되었습니다"); } setShowModal(false); resetForm(); setEditTarget(null); } catch (e) { const msg = e?.message || e?.details || e?.hint || "알 수 없는 오류"; toast(`저장 실패: ${msg}`, "error"); console.error("[saveTenant]", e); } finally { setSaving(false); } }; const handleDelete = async () => { if (!deleteTarget) return; try { await deleteTenant(deleteTarget.id); toast(deleteTarget.name + "님 물건이 삭제되었습니다"); } catch (e) { toast(`삭제 실패: ${e?.message || "알 수 없는 오류"}`, "error"); console.error("[deleteTenant]", e); } setDeleteTarget(null); }; const getEnd = (t) => t.end_date || t.end || ""; return ( <div className="page-in page-padding" style={{ maxWidth: 920 }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12 }}> <div> <SectionLabel>PROPERTY MANAGEMENT</SectionLabel> <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>물건 관리</h1> </div> <button onClick={() => { const limit = getPlanLimit("properties"); if (limit !== Infinity && tenants.length >= limit) { toast(`현재 플랜의 한도(${limit}개)에 도달했어요 — 플랜 페이지로 이동합니다`, "warning"); setTimeout(() => router.push("/dashboard/pricing"), 900); return; } setQuick({ addr: "", rent: "", name: "", end: "" }); setShowQuick(true); }} className="btn-primary" style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ 물건 추가</button> </div>

  {/* 플랜 한도 배너 (75%+ 시 노출) */}
  <PlanLimitBanner used={tenants.length} limit={getPlanLimit("properties")} featureLabel="등록 물건" currentPlan={userPlan} />

  {/* ✅ 탭 — 물건목록 / 임대이력 / 계약서 3개로 확장 */}
  <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid #ebe9e3", paddingBottom: 0 }}>
    {[
      { key: "properties", label: "🏠 물건 목록", count: tenants.length },
      { key: "history", label: "📋 임대 이력", count: (contracts?.length || 0) + tenants.length },
      { key: "contracts", label: "📝 계약서", count: contracts?.length || 0 },
    ].map(tab => (
      <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", borderBottom: `2.5px solid ${activeTab === tab.key ? "#1a2744" : "transparent"}`, color: activeTab === tab.key ? "#1a2744" : "#8a8a9a", marginBottom: -1, transition: "all .15s" }}>
        {tab.label} <span style={{ fontSize: 11, background: activeTab === tab.key ? "#1a274415" : "#f0efe9", padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>{tab.count}</span>
      </button>
    ))}
  </div>

  {/* ✅ 임대 이력 탭 */}
  {activeTab === "history" && <LeaseHistoryTab tenants={tenants} contracts={contracts} />}

  {activeTab === "contracts" && ( <div> <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}> <button onClick={() => { setContractEdit(null); setContractForm({ tenant_id: "", start_date: "", end_date: "", rent: "", deposit: "", special_terms: "" }); setShowContractModal(true); }} style={{ padding: "9px 18px", borderRadius: 10, background: `linear-gradient(135deg,#1a2744,#5b4fcf)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ 계약서 작성</button> </div> {!contracts?.length ? ( <EmptyState icon="📝" title="등록된 계약서가 없습니다" desc="계약서 작성 버튼으로 첫 계약서를 등록하세요" /> ) : ( <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}> {contracts.map((c, i) => { const tenant = tenants.find(t => t.id === c.tenant_id); const dl = c.end_date ? Math.ceil((new Date(c.end_date) - new Date()) / 86400000) : null; return ( <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < contracts.length - 1 ? "1px solid #f0efe9" : "none" }}> <div> <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}> <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{tenant?.name || c.tenant_name || "알수없음"}</span> {dl !== null && <span style={{ fontSize: 12, fontWeight: 700, color: dl <= 90 ? "#e8445a" : "#8a8a9a", background: dl <= 90 ? "rgba(232,68,90,0.1)" : "#f0efe9", padding: "2px 8px", borderRadius: 20 }}>만료 D-{dl}</span>} </div> <p style={{ fontSize: 12, color: "#8a8a9a" }}>{c.start_date || "—"} ~ {c.end_date || "—"} · 월세 {Number(c.rent || tenant?.rent || 0).toLocaleString()}만원 · 보증금 {Number(c.deposit || tenant?.dep || 0).toLocaleString()}만원</p> {c.special_terms && <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 3 }}>📌 {c.special_terms.slice(0, 60)}{c.special_terms.length > 60 ? "..." : ""}</p>} </div> <div style={{ display: "flex", gap: 6, flexShrink: 0 }}> <button onClick={() => { try { const landlord = { name: user?.user_metadata?.landlord_name || user?.user_metadata?.nickname || "", phone: user?.user_metadata?.phone || "", addr: user?.user_metadata?.landlord_addr || "", reg: user?.user_metadata?.business_no || "", signature: user?.user_metadata?.signature_url || "" }; localStorage.setItem("ownly_contract_print", JSON.stringify({ contract: c, tenant, landlord })); window.open("/dashboard/contracts/export", "_blank"); } catch (e) { toast("PDF 생성 중 오류: " + e.message, "error"); } }} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(91,79,207,0.3)", background: "rgba(91,79,207,0.06)", color: "#5b4fcf" }}>📄 PDF</button> <button onClick={() => { setContractEdit(c); setContractForm({ tenant_id: c.tenant_id || "", start_date: c.start_date || "", end_date: c.end_date || "", rent: c.rent || "", deposit: c.deposit || "", special_terms: c.special_terms || "" }); setShowContractModal(true); }} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #ebe9e3", background: "transparent", color: "#1a2744" }}>수정</button> </div> </div> ); })} </div> )} </div> )}

  <Modal open={showContractModal} onClose={() => setShowContractModal(false)}> <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 18 }}>{contractEdit ? "계약서 수정" : "계약서 작성"}</h2> <div style={{ display: "flex", flexDirection: "column", gap: 13 }}> <div> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>세입자</p> <select value={contractForm.tenant_id} onChange={e => setContractForm(f => ({ ...f, tenant_id: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ebe9e3", fontSize: 13, color: "#1a2744", background: "#f8f7f4", outline: "none" }}><option value="">선택하세요</option>{tenants.map(t => <option key={t.id} value={t.id}>{t.name} — {t.addr}</option>)}</select> </div> <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><AuthInput label="계약 시작일" type="date" value={contractForm.start_date} onChange={e => setContractForm(f => ({ ...f, start_date: e.target.value }))} /><AuthInput label="계약 종료일" type="date" value={contractForm.end_date} onChange={e => setContractForm(f => ({ ...f, end_date: e.target.value }))} /></div> <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><AuthInput label="월세 (만원)" type="number" placeholder="120" value={contractForm.rent} onChange={e => setContractForm(f => ({ ...f, rent: e.target.value }))} icon="💰" /><AuthInput label="보증금 (만원)" type="number" placeholder="5000" value={contractForm.deposit} onChange={e => setContractForm(f => ({ ...f, deposit: e.target.value }))} icon="🏦" /></div> <div><p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>특약 사항</p><textarea value={contractForm.special_terms} onChange={e => setContractForm(f => ({ ...f, special_terms: e.target.value }))} placeholder="특약 사항을 입력하세요..." rows={3} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none", fontFamily: "inherit" }} /></div> <div style={{ display: "flex", gap: 10 }}><button onClick={() => setShowContractModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button><button onClick={async () => { setSaving(true); try { const tenant = tenants.find(t => t.id === contractForm.tenant_id); const payload = { ...contractForm, rent: Number(contractForm.rent || 0), deposit: Number(contractForm.deposit || 0), tenant_name: tenant?.name || "" }; if (contractEdit) await updateContract(contractEdit.id, payload); else await addContract(payload); toast(contractEdit ? "계약서가 수정되었습니다" : "계약서가 등록되었습니다"); setShowContractModal(false); } catch { toast("저장 중 오류가 발생했습니다", "error"); } finally { setSaving(false); } }} disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,#1a2744,#5b4fcf)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "저장 중..." : contractEdit ? "수정 완료" : "저장하기"}</button></div> </div> </Modal>

  {activeTab === "properties" && (<> <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}> <div style={{ display: "flex", gap: 7 }}>{["전체", "주거", "상가", "토지"].map((f) => (<button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 16px", borderRadius: 18, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter === f ? C.indigo : "#ebe9e3"}`, background: filter === f ? C.indigo + "20" : "transparent", color: filter === f ? C.indigo : C.muted }}>{f}</button>))}</div> <div style={{ flex: 1, minWidth: 180 }}><SearchBox value={search} onChange={setSearch} placeholder="이름, 주소, 유형 검색..." /></div> <div style={{ display: "flex", gap: 5 }}><SortButton label="월세" active={sort.key === "rent"} dir={sort.dir} onClick={() => toggleSort("rent")} /><SortButton label="평당" active={sort.key === "rentPerPyeong"} dir={sort.dir} onClick={() => toggleSort("rentPerPyeong")} /><SortButton label="만료일" active={sort.key === "dLeft"} dir={sort.dir} onClick={() => toggleSort("dLeft")} /><SortButton label="이름" active={sort.key === "name"} dir={sort.dir} onClick={() => toggleSort("name")} /></div> <div style={{ display: "flex", gap: 0, background: "#f0efe9", borderRadius: 10, padding: 3 }}><button onClick={() => setViewMode("flat")} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: viewMode === "flat" ? "#fff" : "transparent", color: viewMode === "flat" ? C.navy : C.muted, boxShadow: viewMode === "flat" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>📋 평면</button><button onClick={() => setViewMode("grouped")} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: viewMode === "grouped" ? "#fff" : "transparent", color: viewMode === "grouped" ? C.navy : C.muted, boxShadow: viewMode === "grouped" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>🏢 건물별</button></div> </div> {loading ? <InlineLoader rows={4} /> : filtered.length === 0 ? (<EmptyState icon="🏠" title={search ? "검색 결과가 없습니다" : "등록된 물건이 없습니다"} desc={search ? "다른 키워드로 검색해보세요" : "첫 물건을 추가해보세요"} action={!search ? "+ 물건 추가" : null} onAction={() => { resetForm(); setShowModal(true); }} />) : viewMode === "grouped" ? (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{groupByBuilding(filtered, buildings).map((g) => { const isOpen = !!expandedBuildings[g.key]; const vacant = g.units.filter(u => u.status === "공실").length; const monthlyRent = g.units.reduce((s, u) => s + (Number(u.rent) || 0), 0); const expiringCount = g.units.filter(u => { const dl = daysLeft(getEnd(u)); return dl > 0 && dl <= 60; }).length; const vacancyRate = g.units.length > 0 ? Math.round((vacant / g.units.length) * 100) : 0; return (<div key={g.key} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, overflow: "hidden" }}><div onClick={() => setExpandedBuildings(prev => ({ ...prev, [g.key]: !isOpen }))} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, background: isOpen ? "#f8f7f4" : "#fff", transition: "background .15s" }}><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 18 }}>🏢</span><p style={{ fontSize: 15, fontWeight: 800, color: "#1a2744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.addr || "(주소 미등록)"}</p></div><div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11 }}><span style={{ color: "#8a8a9a" }}>호실 <b style={{ color: "#1a2744" }}>{g.units.length}개</b></span>{vacant > 0 && <span style={{ color: "#e8445a", fontWeight: 700 }}>🚪 공실 {vacant}개 ({vacancyRate}%)</span>}{vacant === 0 && <span style={{ color: "#0fa573", fontWeight: 700 }}>✓ 전원 임대 중</span>}<span style={{ color: "#8a8a9a" }}>월 수입 <b style={{ color: "#1a2744" }}>{monthlyRent.toLocaleString()}만원</b></span>{expiringCount > 0 && <span style={{ color: "#e8960a", fontWeight: 700 }}>📅 만료 임박 {expiringCount}건</span>}</div></div><div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}><button onClick={(e) => { e.stopPropagation(); const limit = getPlanLimit("properties"); if (limit !== Infinity && tenants.length >= limit) { alert(`현재 플랜에서는 물건을 최대 ${limit}개까지 등록할 수 있어요.`); return; } resetForm(); setEditTarget(null); setForm(f => ({ ...f, addr: g.addr })); setShowModal(true); }} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.indigo}`, background: C.indigo + "10", color: C.indigo }}>+ 호실 추가</button><span style={{ fontSize: 14, color: "#8a8a9a" }}>{isOpen ? "▲" : "▼"}</span></div></div>{isOpen && (<div style={{ borderTop: "1px solid #ebe9e3", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>{g.units.map((t) => { const dl = daysLeft(getEnd(t)); return (<div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fafaf8", borderRadius: 10, flexWrap: "wrap", gap: 10 }}><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}><span style={{ fontSize: 12, fontWeight: 700, color: t.pType === "상가" ? C.amber : t.pType === "토지" ? "#0d9488" : C.indigo, background: t.pType === "상가" ? C.amber + "18" : t.pType === "토지" ? "#0d948818" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span><Badge label={t.status} map={STATUS_MAP} />{t.status !== "공실" && <span style={{ fontSize: 11, color: "#8a8a9a" }}>{t.name}</span>}</div><p style={{ fontSize: 11, color: "#8a8a9a" }}>월세 <b style={{ color: "#1a2744" }}>{Number(t.rent).toLocaleString()}만</b> · 보증금 {(t.dep / 10000).toFixed(1)}억 · 만료 D-{dl}</p></div><div style={{ display: "flex", gap: 4 }}><button onClick={() => openEdit(t)} style={{ padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #ebe9e3", background: "#fff", color: "#1a2744" }}>수정</button><button onClick={() => setDeleteTarget(t)} style={{ padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${C.rose}33`, background: "#fff", color: "#e8445a" }}>삭제</button></div></div>); })}</div>)}</div>); })}</div>) : (<div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{filtered.map((t) => { const dl = daysLeft(getEnd(t)); const rentPerPyeong = calcRentPerPyeong(t.rent, t.area_pyeong); return (<div key={t.id} className="hover-lift" style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "17px 20px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}><div style={{ display: "flex", gap: 13, alignItems: "center", flex: 1, minWidth: 0 }}><div style={{ width: 42, height: 42, borderRadius: 12, background: (t.color || t.c || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>{t.pType === "상가" ? "🏪" : t.pType === "토지" ? "🌱" : "🏠"}</div><div style={{ minWidth: 0 }}><div style={{ display: "flex", gap: 7, marginBottom: 5, flexWrap: "wrap" }}><span style={{ fontSize: 12, fontWeight: 700, color: t.pType === "상가" ? C.amber : t.pType === "토지" ? "#0d9488" : C.indigo, background: t.pType === "상가" ? C.amber + "18" : t.pType === "토지" ? "#0d948818" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span><Badge label={t.status} map={STATUS_MAP} />{t.area_pyeong && (<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 7px", borderRadius: 5 }}>{t.area_pyeong}평</span>)}</div><p style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>서울 {t.addr}</p><p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>👤 {t.name} · {t.phone}{t.pay_day ? ` · ${formatPayDay(t.pay_day)} 납부` : ""}</p></div></div><div style={{ display: "flex", alignItems: "center", gap: 16 }}><div style={{ textAlign: "right" }}><p style={{ fontSize: 18, fontWeight: 800, color: "#1a2744" }}>{Number(t.rent).toLocaleString()}만원<span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 400 }}>/월</span></p><p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>보증금 {(t.dep / 10000).toFixed(1)}억</p>{rentPerPyeong !== null ? (<p style={{ fontSize: 11, color: "#5b4fcf", fontWeight: 700, marginTop: 3 }}>평당 {rentPerPyeong}만원</p>) : (<p style={{ fontSize: 12, color: "#c4c2bc", marginTop: 3 }}>평형 미입력</p>)}{t.rent > 0 && t.dep > 0 && (() => { const r = Math.round((t.rent * 12) / t.dep * 1000) / 10; return <p style={{ fontSize: 11, fontWeight: 800, marginTop: 2, color: r >= 5 ? "#0fa573" : r >= 3 ? "#e8960a" : "#e8445a" }}>수익률 {r}%</p>; })()}<p style={{ fontSize: 11, color: dl <= 60 ? C.amber : C.muted, marginTop: 3, fontWeight: 600 }}>만료 D-{dl}</p></div><div style={{ display: "flex", flexDirection: "column", gap: 4 }}><button onClick={() => openEdit(t)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #ebe9e3", background: "transparent", color: "#1a2744" }}>수정</button><button onClick={() => setDeleteTarget(t)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${C.rose}33`, background: "transparent", color: "#e8445a" }}>삭제</button></div></div></div></div>); })}</div>)}
  <Modal open={showQuick} onClose={() => setShowQuick(false)} width={440}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744" }}>빠른 물건 등록</h2>
      </div>
      <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.6 }}>필수 정보만 입력하고 바로 시작하세요. 세부 정보는 나중에 언제든 수정할 수 있어요.</p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".5px" }}>주소 <span style={{ color: "#e8445a" }}>*</span></p>
        <AddressInput value={quick.addr} onChange={(v) => setQuick(q => ({ ...q, addr: v }))} onSelect={(v) => setQuick(q => ({ ...q, addr: v }))} placeholder="서울 마포구 합정동 123" />
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".5px" }}>월세 (만원) <span style={{ color: "#e8445a" }}>*</span></p>
        <input type="number" value={quick.rent} onChange={(e) => setQuick(q => ({ ...q, rent: e.target.value }))} placeholder="120"
          style={{ width: "100%", padding: "11px 13px", fontSize: 14, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none" }} />
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".5px" }}>세입자 이름 <span style={{ color: "#6a6a7a", fontWeight: 400 }}>(선택)</span></p>
        <input type="text" value={quick.name} onChange={(e) => setQuick(q => ({ ...q, name: e.target.value }))} placeholder="나중에 추가해도 됩니다"
          style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none" }} />
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".5px" }}>계약 만료일 <span style={{ color: "#6a6a7a", fontWeight: 400 }}>(선택 · 미입력 시 1년 후)</span></p>
        <input type="date" value={quick.end} onChange={(e) => setQuick(q => ({ ...q, end: e.target.value }))}
          style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none" }} />
      </div>
      {quick.rent && Number(quick.rent) > 0 && (
        <div style={{ padding: "10px 13px", background: "rgba(15,165,115,0.06)", border: "1px solid rgba(15,165,115,0.2)", borderRadius: 10 }}>
          <p style={{ fontSize: 11, color: "#0fa573", fontWeight: 700, marginBottom: 3 }}>💰 예상 수입</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744" }}>월 {Number(quick.rent).toLocaleString()}만 · <span style={{ color: "#0fa573" }}>연 {(Number(quick.rent) * 12).toLocaleString()}만원</span></p>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button onClick={() => setShowQuick(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #ebe9e3", background: "transparent", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
        <button onClick={saveQuick} disabled={saving} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
          {saving ? "저장 중..." : "빠르게 등록 →"}
        </button>
      </div>
      <button onClick={() => { setShowQuick(false); resetForm(); setForm(f => ({ ...f, addr: quick.addr, rent: quick.rent, name: quick.name, end: quick.end })); setShowModal(true); }}
        style={{ padding: "8px", borderRadius: 8, background: "transparent", border: "none", color: "#5b4fcf", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        📝 상세 정보까지 입력하기 →
      </button>
    </div>
  </Modal>

  <Modal open={showModal} onClose={null}><div style={{ marginBottom: 20 }}><h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a2744" }}>{editTarget ? "물건 수정" : "물건 추가"}</h2><p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 4 }}>{editTarget ? "물건 정보를 수정합니다" : "새 임대 물건 정보를 입력하세요"}</p></div><div style={{ display: "flex", flexDirection: "column", gap: 14 }}><div style={{ display: "flex", gap: 10 }}>{[{ type: "주거", icon: "🏠", defaultSub: "아파트" }, { type: "상가", icon: "🏪", defaultSub: "1층 상가" }, { type: "토지", icon: "🌱", defaultSub: "전·답" }].map(({ type, icon, defaultSub }) => (<button key={type} onClick={() => setForm((f) => ({ ...f, pType: type, sub: defaultSub }))} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `2px solid ${form.pType === type ? (type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo) : "#ebe9e3"}`, background: form.pType === type ? (type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo) + "18" : "transparent", color: form.pType === type ? (type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo) : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{icon} {type}</button>))}</div><div><p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>세부 유형</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(form.pType === "주거" ? ["아파트", "빌라", "오피스텔", "단독주택", "다세대"] : form.pType === "상가" ? ["1층 상가", "2층 이상", "지하", "사무실", "창고·물류"] : ["전·답", "임야", "대지", "잡종지", "기타 토지"]).map((s) => (<button key={s} onClick={() => setForm((f) => ({ ...f, sub: s }))} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: form.sub === s ? (form.pType === "상가" ? C.amber : form.pType === "토지" ? "#0d9488" : C.indigo) : "#f0efe9", color: form.sub === s ? "#fff" : "#8a8a9a", transition: "all .15s" }}>{s}</button>))}</div></div><label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderRadius: 10, background: form.isVacant ? "rgba(232,68,90,0.06)" : "#f8f7f4", border: `1px solid ${form.isVacant ? "rgba(232,68,90,0.25)" : "#ebe9e3"}`, cursor: "pointer" }}><input type="checkbox" checked={form.isVacant} onChange={(e) => setForm((f) => ({ ...f, isVacant: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#e8445a", cursor: "pointer" }} /><span style={{ fontSize: 13, fontWeight: 700, color: form.isVacant ? "#e8445a" : "#1a2744" }}>🚪 공실 상태로 등록</span><span style={{ fontSize: 11, color: "#8a8a9a", marginLeft: "auto" }}>세입자 없이 등록 가능</span></label><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><AuthInput label={form.isVacant ? "세입자 이름" : "세입자 이름 *"} placeholder={form.isVacant ? "공실 (비워두셔도 됩니다)" : "홍길동"} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} icon="👤" /><AuthInput label="연락처" placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} icon="📞" /></div><AddressInput label="주소" value={form.addr} onChange={(v) => setForm((f) => ({ ...f, addr: v }))} onSelect={(v) => setForm((f) => ({ ...f, addr: v }))} placeholder="마포구 합정동 123" /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><AuthInput label={form.pType === "토지" ? "토지 가액 (만원)" : "보증금 (만원)"} placeholder={form.pType === "토지" ? "100000" : "50000"} value={form.dep} onChange={(e) => setForm((f) => ({ ...f, dep: e.target.value }))} icon="💵" /><AuthInput label={form.pType === "토지" ? "월 임대료 (만원)" : "월세 (만원) *"} placeholder={form.pType === "토지" ? "50" : "120"} value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} icon="💰" /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><AuthInput label="전용면적 (평)" placeholder="예: 15 (약 49㎡)" type="number" value={form.area_pyeong} onChange={(e) => setForm((f) => ({ ...f, area_pyeong: e.target.value }))} icon="📐" /><div style={{ background: "rgba(91,79,207,0.05)", border: "1px solid rgba(91,79,207,0.2)", borderRadius: 10, padding: "10px 13px", display: "flex", alignItems: "center" }}><div><p style={{ fontSize: 11, fontWeight: 700, color: "#5b4fcf", marginBottom: 3 }}>평당 월세</p><p style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>{calcRentPerPyeong(form.rent, form.area_pyeong) ? `${calcRentPerPyeong(form.rent, form.area_pyeong)}만원/평` : "—"}</p><p style={{ fontSize: 12, color: "#8a8a9a", marginTop: 2 }}>월세 ÷ 평형</p></div></div></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><AuthInput label="계약 시작일" type="date" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} /><AuthInput label="계약 만료일" type="date" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} /></div><div style={{ background: "rgba(26,39,68,0.03)", border: "1px solid rgba(26,39,68,0.1)", borderRadius: 12, padding: "14px 16px" }}><p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>📅 납부일 설정</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>{[1, 5, 10, 15, 20, 25].map(d => (<button key={d} onClick={() => setForm(f => ({ ...f, pay_day: String(d) }))} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${form.pay_day === String(d) ? C.indigo : "#ebe9e3"}`, background: form.pay_day === String(d) ? C.indigo : "transparent", color: form.pay_day === String(d) ? "#fff" : "#8a8a9a", transition: "all .15s" }}>{d}일</button>))}<button onClick={() => setForm(f => ({ ...f, pay_day: "99" }))} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${form.pay_day === "99" ? C.indigo : "#ebe9e3"}`, background: form.pay_day === "99" ? C.indigo : "transparent", color: form.pay_day === "99" ? "#fff" : "#8a8a9a", transition: "all .15s" }}>말일</button></div>{form.pay_day !== "99" && (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12, color: "#8a8a9a" }}>직접 입력:</span><input type="number" min={1} max={31} value={form.pay_day} onChange={e => setForm(f => ({ ...f, pay_day: e.target.value }))} style={{ width: 70, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #ebe9e3", fontSize: 13, fontWeight: 700, color: "#1a2744", textAlign: "center", outline: "none" }} /><span style={{ fontSize: 12, color: "#8a8a9a" }}>일 (매월)</span></div>)}{form.pay_day === "99" && (<p style={{ fontSize: 12, color: "#5b4fcf", fontWeight: 600 }}>💡 매월 말일(28~31일)에 납부 처리됩니다</p>)}</div>{(form.pType === "상가" || form.sub === "오피스텔") && (<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><AuthInput label="관리비 (만원/월)" placeholder="예: 15" value={form.maintenance} onChange={(e) => setForm((f) => ({ ...f, maintenance: e.target.value }))} icon="🏢" /><div style={{ background: "rgba(15,165,115,0.06)", border: "1px solid rgba(15,165,115,0.2)", borderRadius: 10, padding: "10px 13px", display: "flex", alignItems: "center" }}><div><p style={{ fontSize: 11, fontWeight: 700, color: "#0fa573", marginBottom: 3 }}>총 월 수익</p><p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>{form.rent && form.maintenance ? `월 ${(Number(form.rent) + Number(form.maintenance)).toLocaleString()}만원` : form.rent ? `월 ${Number(form.rent).toLocaleString()}만원` : "—"}</p><p style={{ fontSize: 12, color: "#8a8a9a", marginTop: 2 }}>월세 + 관리비</p></div></div></div>)}

{form.pType === "상가" && (<div style={{ background: "rgba(232,150,10,0.04)", border: "1px solid rgba(232,150,10,0.2)", borderRadius: 12, padding: "14px 16px" }}><p style={{ fontSize: 11, fontWeight: 800, color: C.amber, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>🏪 상가 전용 정보</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}><div><p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 6 }}>업종</p><select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ebe9e3", fontSize: 13, color: "#1a2744", background: "#fff", outline: "none" }}><option value="">선택 안 함</option>{["음식점","카페·디저트","소매·잡화","서비스(미용·세탁 등)","의료·약국","교육·학원","금융·중개","공방·창고","기타"].map(o => <option key={o} value={o}>{o}</option>)}</select></div><AuthInput label="권리금 (만원)" placeholder="예: 5000 (없으면 비워두기)" value={form.premium} onChange={e => setForm(f => ({ ...f, premium: e.target.value }))} icon="💎" /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><AuthInput label="렌트프리 (개월)" placeholder="예: 2" value={form.rentFree} onChange={e => setForm(f => ({ ...f, rentFree: e.target.value }))} icon="🎁" /><label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderRadius: 10, background: "#fff", border: "1px solid #ebe9e3", cursor: "pointer" }}><input type="checkbox" checked={form.vatIncluded} onChange={e => setForm(f => ({ ...f, vatIncluded: e.target.checked }))} style={{ width: 16, height: 16, accentColor: C.amber }} /><span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>월세에 부가세 포함</span></label></div></div>)}<div style={{ display: "flex", gap: 10, marginTop: 6 }}><button onClick={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button><button onClick={saveTenant} disabled={saving} className="btn-primary" style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "저장 중..." : editTarget ? "저장하기" : "등록하기"}</button></div></div></Modal>
  <ConfirmDialog open={!!deleteTarget} title="물건 삭제" desc={deleteTarget ? `${deleteTarget.name}님의 ${deleteTarget.addr} 물건을 삭제하시겠습니까?` : ""} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />
  </>)}

  <div style={{ marginTop: 20, background: "linear-gradient(135deg,rgba(59,91,219,0.05),rgba(91,79,207,0.03))", border: "1px solid rgba(59,91,219,0.15)", borderRadius: 16, padding: "16px 20px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}><div style={{ display: "flex", gap: 12, alignItems: "center" }}><span style={{ fontSize: 28 }}>🧾</span><div><p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 2 }}>임대 소득세 신고 · 절세 전략이 필요하신가요?</p><p style={{ fontSize: 11, color: "#8a8a9a" }}>제휴 세무사가 임대인 전문 세무 서비스를 제공합니다 · 첫 상담 무료</p></div></div><button onClick={() => { window.location.href = "mailto:inquiry@mclean21.com?subject=온리 세무사 연결 문의&body=안녕하세요, 임대 소득세 신고/절세 전략 상담을 문의드립니다.%0D%0A%0D%0A보유 물건 수:%0D%0A신고 연도:%0D%0A주요 관심사 (절세/신고대행/등등):%0D%0A"; }} style={{ padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg,#3b5bdb,#5b4fcf)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>세무사 연결 →</button></div></div>
</div> ); }
