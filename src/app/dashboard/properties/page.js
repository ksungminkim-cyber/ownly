"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge, SectionLabel, SearchBox, EmptyState, ConfirmDialog, Modal, AuthInput, SortButton, toast, InlineLoader } from "../../../components/shared";
import { C, STATUS_MAP, COLORS, daysLeft } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import AddressInput from "../../../components/AddressInput";

export default function PropertiesPage() {
  const { tenants, addTenant, updateTenant, deleteTenant, contracts, addContract, updateContract, loading, canUse, getPlanLimit } = useApp();
  const [activeTab, setActiveTab] = useState("properties");
  const [filter, setFilter] = useState("\uc804\uccb4");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "rent", dir: "desc" });
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pType: "\uc8fc\uac70", sub: "\uc544\ud30c\ud2b8", addr: "", rent: "", dep: "",
    name: "", phone: "", start: "", end: "", maintenance: "", pay_day: "5"
  });

  const [showContractModal, setShowContractModal] = useState(false);
  const [contractForm, setContractForm] = useState({ tenant_id: "", start_date: "", end_date: "", rent: "", deposit: "", special_terms: "" });
  const [contractEdit, setContractEdit] = useState(null);

  const resetForm = () => setForm({
    pType: "\uc8fc\uac70", sub: "\uc544\ud30c\ud2b8", addr: "", rent: "", dep: "",
    name: "", phone: "", start: "", end: "", maintenance: "", pay_day: "5"
  });

  const filtered = useMemo(() => {
    let list = [...tenants];
    if (filter !== "\uc804\uccb4") list = list.filter((t) => t.pType === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name?.toLowerCase().includes(q) || t.addr?.toLowerCase().includes(q) || t.sub?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let va, vb;
      if (sort.key === "rent") { va = a.rent; vb = b.rent; }
      else if (sort.key === "dLeft") { va = daysLeft(a.end_date); vb = daysLeft(b.end_date); }
      else if (sort.key === "dep") { va = a.dep; vb = b.dep; }
      else { va = a.name; vb = b.name; }
      if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sort.dir === "asc" ? va - vb : vb - va;
    });
    return list;
  }, [tenants, filter, search, sort]);

  const toggleSort = (key) => setSort(sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });

  const openEdit = (t) => {
    setEditTarget(t);
    setForm({
      pType: t.pType, sub: t.sub, addr: t.addr,
      rent: String(t.rent), dep: String(t.dep),
      name: t.name, phone: t.phone || "",
      start: t.start_date || "", end: t.end_date || "",
      maintenance: String(t.maintenance || ""),
      pay_day: String(t.pay_day || "5"),
    });
    setShowModal(true);
  };

  const saveTenant = async () => {
    if (!form.addr || !form.rent || !form.name) { toast("\ud544\uc218 \ud56d\ubaa9\uc744 \uc785\ub825\ud558\uc138\uc694", "error"); return; }
    const payDay = parseInt(form.pay_day || "5");
    if (isNaN(payDay) || payDay < 1 || payDay > 31) { toast("\ub0a9\ubd80\uc77c\uc740 1~31\uc77c \uc0ac\uc774\ub85c \uc785\ub825\ud558\uc138\uc694", "error"); return; }
    setSaving(true);
    try {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const payload = {
        name: form.name, phone: form.phone || "", pType: form.pType, sub: form.sub,
        addr: form.addr, dep: Number(form.dep || 0), rent: Number(form.rent),
        start_date: form.start || null, end_date: form.end || "2026-12-31",
        status: "\uc815\uc0c1", color, intent: "\ubbf8\ud655\uc778",
        maintenance: Number(form.maintenance || 0),
        pay_day: payDay,
        biz: null, contacts: [],
      };
      if (editTarget) {
        await updateTenant(editTarget.id, payload);
        toast("\ubb3c\uac74 \uc815\ubcf4\uac00 \uc218\uc815\ub418\uc5c8\uc2b5\ub2c8\ub2e4");
      } else {
        await addTenant(payload);
        toast("\uc0c8 \ubb3c\uac74\uc774 \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4");
      }
      setShowModal(false); resetForm(); setEditTarget(null);
    } catch (e) { toast("\uc800\uc7a5 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4", "error"); console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTenant(deleteTarget.id);
      toast(deleteTarget.name + "\ub2d8 \ubb3c\uac74\uc774 \uc0ad\uc81c\ub418\uc5c8\uc2b5\ub2c8\ub2e4");
    } catch { toast("\uc0ad\uc81c \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4", "error"); }
    setDeleteTarget(null);
  };

  const getEnd = (t) => t.end_date || t.end || "";

  return (
    <div className="page-in page-padding" style={{ maxWidth: 920 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>PROPERTY MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>{"\ubb3c\uac74 \uad00\ub9ac"}</h1>
        </div>
        <button onClick={() => {
          const limit = getPlanLimit("properties");
          if (limit !== Infinity && tenants.length >= limit) {
            alert(`\ud604\uc7ac \ud50c\ub79c\uc5d0\uc11c\ub294 \ubb3c\uac74\uc744 \ucd5c\ub300 ${limit}\uac1c\uae4c\uc9c0 \ub4f1\ub85d\ud560 \uc218 \uc788\uc5b4\uc694.\n\uc5c5\uadf8\ub808\uc774\ub4dc\ud558\uba74 \ub354 \ub9ce\uc774 \ub4f1\ub85d\ud560 \uc218 \uc788\uc5b4\uc694!`);
            window.location.href = "/dashboard/pricing"; return;
          }
          resetForm(); setEditTarget(null); setShowModal(true);
        }} className="btn-primary" style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + {"\ubb3c\uac74 \ucd94\uac00"}
        </button>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid #ebe9e3", paddingBottom: 0 }}>
        {[
          { key: "properties", label: "\ud83c\udfe0 \ubb3c\uac74 \ubaa9\ub85d", count: tenants.length },
          { key: "contracts",  label: "\ud83d\udcdd \uacc4\uc57d\uc11c",  count: contracts?.length || 0 },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", borderBottom: `2.5px solid ${activeTab === tab.key ? "#1a2744" : "transparent"}`, color: activeTab === tab.key ? "#1a2744" : "#8a8a9a", marginBottom: -1, transition: "all .15s" }}>
            {tab.label}
            <span style={{ fontSize: 11, background: activeTab === tab.key ? "#1a274415" : "#f0efe9", padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* 계약서 탭 */}
      {activeTab === "contracts" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button onClick={() => { setContractEdit(null); setContractForm({ tenant_id: "", start_date: "", end_date: "", rent: "", deposit: "", special_terms: "" }); setShowContractModal(true); }}
              style={{ padding: "9px 18px", borderRadius: 10, background: `linear-gradient(135deg,#1a2744,#5b4fcf)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              + {"\uacc4\uc57d\uc11c \uc791\uc131"}
            </button>
          </div>
          {!contracts?.length ? (
            <EmptyState icon="\ud83d\udcdd" title="\ub4f1\ub85d\ub41c \uacc4\uc57d\uc11c\uac00 \uc5c6\uc2b5\ub2c8\ub2e4" desc="\uacc4\uc57d\uc11c \uc791\uc131 \ubc84\ud2bc\uc73c\ub85c \uccab \uacc4\uc57d\uc11c\ub97c \ub4f1\ub85d\ud558\uc138\uc694" />
          ) : (
            <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}>
              {contracts.map((c, i) => {
                const tenant = tenants.find(t => t.id === c.tenant_id);
                const dl = c.end_date ? Math.ceil((new Date(c.end_date) - new Date()) / 86400000) : null;
                return (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < contracts.length - 1 ? "1px solid #f0efe9" : "none" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{tenant?.name || c.tenant_name || "\uc54c\uc218\uc5c6\uc74c"}</span>
                        {dl !== null && <span style={{ fontSize: 10, fontWeight: 700, color: dl <= 90 ? "#e8445a" : "#8a8a9a", background: dl <= 90 ? "rgba(232,68,90,0.1)" : "#f0efe9", padding: "2px 8px", borderRadius: 20 }}>{"\ub9cc\ub8cc D-"}{dl}</span>}
                      </div>
                      <p style={{ fontSize: 12, color: "#8a8a9a" }}>
                        {c.start_date || "\u2014"} ~ {c.end_date || "\u2014"} &nbsp;&middot;&nbsp; {"\uc6d4\uc138 "}{c.rent || tenant?.rent || "\u2014"}{"\ub9cc\uc6d0"} &nbsp;&middot;&nbsp; {"\ubcf4\uc99d\uae08 "}{c.deposit || tenant?.dep || "\u2014"}{"\ub9cc\uc6d0"}
                      </p>
                      {c.special_terms && <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 3 }}>{"\ud83d\udccc "}{c.special_terms.slice(0, 60)}{c.special_terms.length > 60 ? "..." : ""}</p>}
                    </div>
                    <button onClick={() => { setContractEdit(c); setContractForm({ tenant_id: c.tenant_id || "", start_date: c.start_date || "", end_date: c.end_date || "", rent: c.rent || "", deposit: c.deposit || "", special_terms: c.special_terms || "" }); setShowContractModal(true); }}
                      style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #ebe9e3", background: "transparent", color: "#1a2744" }}>{"\uc218\uc815"}</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 계약서 모달 */}
      <Modal open={showContractModal} onClose={() => setShowContractModal(false)}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 18 }}>{contractEdit ? "\uacc4\uc57d\uc11c \uc218\uc815" : "\uacc4\uc57d\uc11c \uc791\uc131"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>{"\uc138\uc785\uc790"}</p>
            <select value={contractForm.tenant_id} onChange={e => setContractForm(f => ({ ...f, tenant_id: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ebe9e3", fontSize: 13, color: "#1a2744", background: "#f8f7f4", outline: "none" }}>
              <option value="">{"\uc120\ud0dd\ud558\uc138\uc694"}</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name} \u2014 {t.addr}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label="\uacc4\uc57d \uc2dc\uc791\uc77c" type="date" value={contractForm.start_date} onChange={e => setContractForm(f => ({ ...f, start_date: e.target.value }))} />
            <AuthInput label="\uacc4\uc57d \uc885\ub8cc\uc77c" type="date" value={contractForm.end_date} onChange={e => setContractForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label="\uc6d4\uc138 (\ub9cc\uc6d0)" type="number" placeholder="120" value={contractForm.rent} onChange={e => setContractForm(f => ({ ...f, rent: e.target.value }))} icon="\ud83d\udcb0" />
            <AuthInput label="\ubcf4\uc99d\uae08 (\ub9cc\uc6d0)" type="number" placeholder="5000" value={contractForm.deposit} onChange={e => setContractForm(f => ({ ...f, deposit: e.target.value }))} icon="\ud83c\udfe6" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>{"\ud2b9\uc57d \uc0ac\ud56d"}</p>
            <textarea value={contractForm.special_terms} onChange={e => setContractForm(f => ({ ...f, special_terms: e.target.value }))} placeholder="\ud2b9\uc57d \uc0ac\ud56d\uc744 \uc785\ub825\ud558\uc138\uc694..." rows={3}
              style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowContractModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{"\ucde8\uc18c"}</button>
            <button onClick={async () => {
              setSaving(true);
              try {
                const tenant = tenants.find(t => t.id === contractForm.tenant_id);
                const payload = { ...contractForm, rent: Number(contractForm.rent || 0), deposit: Number(contractForm.deposit || 0), tenant_name: tenant?.name || "" };
                if (contractEdit) await updateContract(contractEdit.id, payload);
                else await addContract(payload);
                toast(contractEdit ? "\uacc4\uc57d\uc11c\uac00 \uc218\uc815\ub418\uc5c8\uc2b5\ub2c8\ub2e4" : "\uacc4\uc57d\uc11c\uac00 \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4");
                setShowContractModal(false);
              } catch { toast("\uc800\uc7a5 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4", "error"); }
              finally { setSaving(false); }
            }} disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,#1a2744,#5b4fcf)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "\uc800\uc7a5 \uc911..." : contractEdit ? "\uc218\uc815 \uc644\ub8cc" : "\uc800\uc7a5\ud558\uae30"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 물건 목록 탭 */}
      {activeTab === "properties" && (<>
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 7 }}>
            {["\uc804\uccb4", "\uc8fc\uac70", "\uc0c1\uac00", "\ud1a0\uc9c0"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 16px", borderRadius: 18, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter === f ? C.indigo : "#ebe9e3"}`, background: filter === f ? C.indigo + "20" : "transparent", color: filter === f ? C.indigo : C.muted }}>{f}</button>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}><SearchBox value={search} onChange={setSearch} placeholder="\uc774\ub984, \uc8fc\uc18c, \uc720\ud615 \uac80\uc0c9..." /></div>
          <div style={{ display: "flex", gap: 5 }}>
            <SortButton label="\uc6d4\uc138" active={sort.key === "rent"} dir={sort.dir} onClick={() => toggleSort("rent")} />
            <SortButton label="\ub9cc\ub8cc\uc77c" active={sort.key === "dLeft"} dir={sort.dir} onClick={() => toggleSort("dLeft")} />
            <SortButton label="\uc774\ub984" active={sort.key === "name"} dir={sort.dir} onClick={() => toggleSort("name")} />
          </div>
        </div>

        {loading ? <InlineLoader rows={4} /> : filtered.length === 0 ? (
          <EmptyState icon="\ud83c\udfe0" title={search ? "\uac80\uc0c9 \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4" : "\ub4f1\ub85d\ub41c \ubb3c\uac74\uc774 \uc5c6\uc2b5\ub2c8\ub2e4"} desc={search ? "\ub2e4\ub978 \ud0a4\uc6cc\ub4dc\ub85c \uac80\uc0c9\ud574\ubcf4\uc138\uc694" : "\uccab \ubb3c\uac74\uc744 \ucd94\uac00\ud574\ubcf4\uc138\uc694"} action={!search ? "+ \ubb3c\uac74 \ucd94\uac00" : null} onAction={() => { resetForm(); setShowModal(true); }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {filtered.map((t) => {
              const dl = daysLeft(getEnd(t));
              return (
                <div key={t.id} className="hover-lift" style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "17px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", gap: 13, alignItems: "center", flex: 1, minWidth: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: (t.color || t.c || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
                        {t.pType === "\uc0c1\uac00" ? "\ud83c\udfea" : t.pType === "\ud1a0\uc9c0" ? "\ud83c\udf31" : "\ud83c\udfe0"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: t.pType === "\uc0c1\uac00" ? C.amber : t.pType === "\ud1a0\uc9c0" ? "#0d9488" : C.indigo, background: t.pType === "\uc0c1\uac00" ? C.amber + "18" : t.pType === "\ud1a0\uc9c0" ? "#0d948818" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span>
                          <Badge label={t.status} map={STATUS_MAP} />
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{"\uc11c\uc6b8 "}{t.addr}</p>
                        <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{"\ud83d\udc64 "}{t.name} &middot; {t.phone} {t.pay_day ? `&middot; \ub9e4\uc6d4 ${t.pay_day}\uc77c \ub0a9\ubd80` : ""}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#1a2744" }}>{t.rent}{"\ub9cc\uc6d0"}<span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 400 }}>{"/\uc6d4"}</span></p>
                        <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{"\ubcf4\uc99d\uae08 "}{(t.dep / 10000).toFixed(1)}{"\uc5b5"}</p>
                        <p style={{ fontSize: 11, color: dl <= 60 ? C.amber : C.muted, marginTop: 3, fontWeight: 600 }}>{"\ub9cc\ub8cc D-"}{dl}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <button onClick={() => openEdit(t)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #ebe9e3", background: "transparent", color: "#1a2744" }}>{"\uc218\uc815"}</button>
                        <button onClick={() => setDeleteTarget(t)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${C.rose}33`, background: "transparent", color: "#e8445a" }}>{"\uc0ad\uc81c"}</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 물건 추가/수정 모달 */}
        <Modal open={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a2744" }}>{editTarget ? "\ubb3c\uac74 \uc218\uc815" : "\ubb3c\uac74 \ucd94\uac00"}</h2>
            <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 4 }}>{editTarget ? "\ubb3c\uac74 \uc815\ubcf4\ub97c \uc218\uc815\ud569\ub2c8\ub2e4" : "\uc0c8 \uc784\ub300 \ubb3c\uac74 \uc815\ubcf4\ub97c \uc785\ub825\ud558\uc138\uc694"}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* 물건 유형 */}
            <div style={{ display: "flex", gap: 10 }}>
              {[{ type: "\uc8fc\uac70", icon: "\ud83c\udfe0", defaultSub: "\uc544\ud30c\ud2b8" }, { type: "\uc0c1\uac00", icon: "\ud83c\udfea", defaultSub: "1\uce35 \uc0c1\uac00" }, { type: "\ud1a0\uc9c0", icon: "\ud83c\udf31", defaultSub: "\uc804\xb7\ub2f5" }].map(({ type, icon, defaultSub }) => (
                <button key={type} onClick={() => setForm((f) => ({ ...f, pType: type, sub: defaultSub }))}
                  style={{ flex: 1, padding: "11px", borderRadius: 10, border: `2px solid ${form.pType === type ? (type === "\uc0c1\uac00" ? C.amber : type === "\ud1a0\uc9c0" ? "#0d9488" : C.indigo) : "#ebe9e3"}`, background: form.pType === type ? (type === "\uc0c1\uac00" ? C.amber : type === "\ud1a0\uc9c0" ? "#0d9488" : C.indigo) + "18" : "transparent", color: form.pType === type ? (type === "\uc0c1\uac00" ? C.amber : type === "\ud1a0\uc9c0" ? "#0d9488" : C.indigo) : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {icon} {type}
                </button>
              ))}
            </div>
            {/* 세부 유형 */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{"\uc138\ubd80 \uc720\ud615"}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(form.pType === "\uc8fc\uac70" ? ["\uc544\ud30c\ud2b8", "\ube4c\ub77c", "\uc624\ud53c\uc2a4\ud154", "\ub2e8\ub3c5\uc8fc\ud0dd", "\ub2e4\uc138\ub300"] : form.pType === "\uc0c1\uac00" ? ["1\uce35 \uc0c1\uac00", "2\uce35 \uc774\uc0c1", "\uc9c0\ud558", "\uc0ac\ubb34\uc2e4", "\ucc3d\uace0\xb7\ubb3c\ub958"] : ["\uc804\xb7\ub2f5", "\uc784\uc57c", "\ub300\uc9c0", "\uc7a1\uc885\uc9c0", "\uae30\ud0c0 \ud1a0\uc9c0"]).map((s) => (
                  <button key={s} onClick={() => setForm((f) => ({ ...f, sub: s }))}
                    style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: form.sub === s ? (form.pType === "\uc0c1\uac00" ? C.amber : form.pType === "\ud1a0\uc9c0" ? "#0d9488" : C.indigo) : "#f0efe9", color: form.sub === s ? "#fff" : "#8a8a9a", transition: "all .15s" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <AuthInput label="\uc138\uc785\uc790 \uc774\ub984 *" placeholder="\ud64d\uae38\ub3d9" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} icon="\ud83d\udc64" />
              <AuthInput label="\uc5f0\ub77d\uc5ec" placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} icon="\ud83d\udcde" />
            </div>
            <AddressInput label="\uc8fc\uc18c" value={form.addr} onChange={(v) => setForm((f) => ({ ...f, addr: v }))} onSelect={(v) => setForm((f) => ({ ...f, addr: v }))} placeholder="\ub9c8\ud3ec\uad6c \ud569\uc815\ub3d9 123" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <AuthInput label={form.pType === "\ud1a0\uc9c0" ? "\ud1a0\uc9c0 \uac00\uc561 (\ub9cc\uc6d0)" : "\ubcf4\uc99d\uae08 (\ub9cc\uc6d0)"} placeholder={form.pType === "\ud1a0\uc9c0" ? "100000" : "50000"} value={form.dep} onChange={(e) => setForm((f) => ({ ...f, dep: e.target.value }))} icon="\ud83d\udcb5" />
              <AuthInput label={form.pType === "\ud1a0\uc9c0" ? "\uc6d4 \uc784\ub300\ub8cc (\ub9cc\uc6d0)" : "\uc6d4\uc138 (\ub9cc\uc6d0) *"} placeholder={form.pType === "\ud1a0\uc9c0" ? "50" : "120"} value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} icon="\ud83d\udcb0" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <AuthInput label="\uacc4\uc57d \uc2dc\uc791\uc77c" type="date" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} />
              <AuthInput label="\uacc4\uc57d \ub9cc\ub8cc\uc77c" type="date" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} />
            </div>

            {/* ── 납부일 필드 (신규) ── */}
            <div style={{ background: "rgba(26,39,68,0.03)", border: "1px solid rgba(26,39,68,0.1)", borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {"\ud83d\udcc5 \ub0a9\ubd80\uc77c \uc124\uc815"}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {[1, 5, 10, 15, 20, 25].map(d => (
                  <button key={d} onClick={() => setForm(f => ({ ...f, pay_day: String(d) }))}
                    style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${form.pay_day === String(d) ? C.indigo : "#ebe9e3"}`, background: form.pay_day === String(d) ? C.indigo : "transparent", color: form.pay_day === String(d) ? "#fff" : "#8a8a9a", transition: "all .15s" }}>
                    {d}{"\uc77c"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#8a8a9a" }}>{"\uc9c1\uc811 \uc785\ub825:"}</span>
                <input type="number" min={1} max={31} value={form.pay_day}
                  onChange={e => setForm(f => ({ ...f, pay_day: e.target.value }))}
                  style={{ width: 70, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #ebe9e3", fontSize: 13, fontWeight: 700, color: "#1a2744", textAlign: "center", outline: "none" }} />
                <span style={{ fontSize: 12, color: "#8a8a9a" }}>{"\uc77c  (\ub9e4\uc6d4)"}</span>
              </div>
              <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 8 }}>
                {"\uce74\uce74\uc624 \ub0a9\ubd80\uc77c \uc608\uc815 \uc54c\ub9bc\uc774 \uc774 \ub0a9\ubd80\uc77c \uae30\uc900 D-3\uc5d0 \uc790\ub3d9 \ubc1c\uc1a1\ub429\ub2c8\ub2e4."}
              </p>
            </div>

            {/* 관리비 */}
            {(form.pType === "\uc0c1\uac00" || form.sub === "\uc624\ud53c\uc2a4\ud154") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <AuthInput label="\uad00\ub9ac\ube44 (\ub9cc\uc6d0/\uc6d4)" placeholder="\uc608: 15" value={form.maintenance} onChange={(e) => setForm((f) => ({ ...f, maintenance: e.target.value }))} icon="\ud83c\udfe2" />
                <div style={{ background: "rgba(15,165,115,0.06)", border: "1px solid rgba(15,165,115,0.2)", borderRadius: 10, padding: "10px 13px", display: "flex", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#0fa573", marginBottom: 3 }}>{"\uc758 \uc6d4 \uc218\uc775"}</p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>
                      {form.rent && form.maintenance ? `\uc6d4 ${(Number(form.rent) + Number(form.maintenance)).toLocaleString()}\ub9cc\uc6d0` : form.rent ? `\uc6d4 ${Number(form.rent).toLocaleString()}\ub9cc\uc6d0` : "\u2014"}
                    </p>
                    <p style={{ fontSize: 10, color: "#8a8a9a", marginTop: 2 }}>{"\uc6d4\uc138 + \uad00\ub9ac\ube44"}</p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{"\ucde8\uc18c"}</button>
              <button onClick={saveTenant} disabled={saving} className="btn-primary"
                style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "\uc800\uc7a5 \uc911..." : editTarget ? "\uc800\uc7a5\ud558\uae30" : "\ub4f1\ub85d\ud558\uae30"}
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog open={!!deleteTarget} title="\ubb3c\uac74 \uc0ad\uc81c"
          desc={deleteTarget ? `${deleteTarget.name}\ub2d8\uc758 ${deleteTarget.addr} \ubb3c\uac74\uc744 \uc0ad\uc81c\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?` : ""}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />
      </>)}

      {/* 세무사 CTA */}
      <div style={{ marginTop: 20, background: "linear-gradient(135deg,rgba(59,91,219,0.05),rgba(91,79,207,0.03))", border: "1px solid rgba(59,91,219,0.15)", borderRadius: 16, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 28 }}>{"\ud83e\uddfe"}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 2 }}>{"\uc784\ub300 \uc18c\ub4dd\uc138 \uc2e0\uace0 \xb7 \uc808\uc138 \uc804\ub7b5\uc774 \ud544\uc694\ud558\uc2e0\uac00\uc694?"}</p>
              <p style={{ fontSize: 11, color: "#8a8a9a" }}>{"\uc81c\ud718 \uc138\ubb34\uc0ac\uac00 \uc784\ub300\uc778 \uc804\ubb38 \uc138\ubb34 \uc11c\ube44\uc2a4\ub97c \uc81c\uacf5\ud569\ub2c8\ub2e4 \xb7 \uccab \uc0c1\ub2f4 \ubb34\ub8cc"}</p>
            </div>
          </div>
          <button onClick={() => alert("\ud83d\udea7 \uc138\ubb34\uc0ac \uc5f0\uacb0 \uc11c\ube44\uc2a4 \uc900\ube44 \uc911\uc785\ub2c8\ub2e4.\n\ube60\ub978 \uc2dc\uc77c \ub0b4\uc5d0 \uc624\ud508\ud560\uac8c\uc694!")}
            style={{ padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg,#3b5bdb,#5b4fcf)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            {"\uc138\ubb34\uc0ac \uc5f0\uacb0 \u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}
