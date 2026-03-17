"use client";
import { useState, useMemo } from "react";
import { Badge, SectionLabel, SearchBox, EmptyState, Modal, AuthInput, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

const CONTRACT_STATUS = {
  active:   { label: "진행중",   c: "#10b981", bg: "#10b98118" },
  expired:  { label: "만료",     c: "#6b7280", bg: "#6b728018" },
  pending:  { label: "대기중",   c: "#f59e0b", bg: "#f59e0b18" },
};

export default function ContractsPage() {
  const { tenants, contracts, addContract, updateContract } = useApp();
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({
    tenant_id: "", tenant_name: "", type: "월세",
    start_date: "", end_date: "", deposit: "", rent: "",
    special_terms: "", status: "active",
  });

  const resetForm = () => setForm({ tenant_id: "", tenant_name: "", type: "월세", start_date: "", end_date: "", deposit: "", rent: "", special_terms: "", status: "active" });

  const filtered = useMemo(() => {
    if (!search) return contracts;
    const q = search.toLowerCase();
    return contracts.filter((c) => c.tenant_name?.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q));
  }, [contracts, search]);

  const openAdd = () => { resetForm(); setEditTarget(null); setShowModal(true); };
  const openEdit = (c) => {
    setEditTarget(c);
    setForm({ tenant_id: c.tenant_id || "", tenant_name: c.tenant_name || "", type: c.type || "월세", start_date: c.start_date || "", end_date: c.end_date || "", deposit: String(c.deposit || ""), rent: String(c.rent || ""), special_terms: c.special_terms || "", status: c.status || "active" });
    setShowModal(true);
  };

  const saveContract = async () => {
    if (!form.tenant_name || !form.start_date || !form.end_date) { toast("필수 항목을 입력하세요", "error"); return; }
    setSaving(true);
    try {
      const payload = { ...form, deposit: Number(form.deposit || 0), rent: Number(form.rent || 0), tenant_id: form.tenant_id || null };
      if (editTarget) {
        await updateContract(editTarget.id, payload);
        toast("계약이 수정되었습니다");
      } else {
        await addContract(payload);
        toast("계약이 등록되었습니다");
      }
      setShowModal(false); resetForm(); setEditTarget(null);
    } catch (e) {
      toast("저장 중 오류가 발생했습니다", "error");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const dLeft = (end) => {
    if (!end) return 999;
    return Math.ceil((new Date(end) - new Date()) / 86400000);
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>CONTRACT MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>계약 관리</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>총 {contracts.length}건 · 진행중 {contracts.filter((c) => c.status === "active").length}건</p>
        </div>
        <button onClick={openAdd} className="btn-primary"
          style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + 계약 추가
        </button>
      </div>

      <div style={{ marginBottom: 16 }}><SearchBox value={search} onChange={setSearch} placeholder="세입자명, 계약 유형 검색..." /></div>

      {filtered.length === 0 ? (
        <EmptyState icon="📋" title={search ? "검색 결과가 없습니다" : "등록된 계약이 없습니다"} desc={search ? "다른 키워드로 검색해보세요" : "첫 계약을 등록해보세요"} action={!search ? "+ 계약 추가" : null} onAction={openAdd} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {filtered.map((c) => {
            const dl = dLeft(c.end_date);
            const s  = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.active;
            return (
              <div key={c.id} className="hover-lift" style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "17px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", gap: 13, alignItems: "center", flex: 1, minWidth: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: C.indigo + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>📋</div>
                    <div>
                      <div style={{ display: "flex", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2744", background: C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{c.type}</span>
                        <Badge label={s.label} map={{ [s.label]: s }} />
                        {dl <= 90 && <span style={{ fontSize: 10, fontWeight: 700, color: "#e8960a", background: C.amber + "18", padding: "2px 7px", borderRadius: 5 }}>D-{dl}</span>}
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{c.tenant_name}</p>
                      <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{c.start_date} ~ {c.end_date}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>{c.rent}만원<span style={{ fontSize: 11, color: "#8a8a9a" }}>/월</span></p>
                      <p style={{ fontSize: 11, color: "#8a8a9a" }}>보증금 {c.deposit}만원</p>
                    </div>
                    <button onClick={() => openEdit(c)} style={{ padding: "5px 12px", borderRadius: 8, background: "transparent", border: "1px solid #ebe9e3", color: "#1a2744", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>수정</button>
                  </div>
                </div>
                {c.special_terms && (
                  <div style={{ marginTop: 11, padding: "9px 13px", background: "#f8f7f4", borderRadius: 9, fontSize: 12, color: "#8a8a9a", lineHeight: 1.6 }}>
                    📝 {c.special_terms}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a2744" }}>{editTarget ? "계약 수정" : "계약 추가"}</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>세입자 선택</p>
              <select value={form.tenant_id} onChange={(e) => {
                const t = tenants.find((x) => String(x.id) === e.target.value);
                setForm((f) => ({ ...f, tenant_id: e.target.value, tenant_name: t?.name || "", rent: String(t?.rent || f.rent), deposit: String(t?.dep || f.deposit) }));
              }} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, appearance: "none", outline: "none" }}>
                <option value="">직접 입력</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <AuthInput label="세입자명 *" placeholder="홍길동" value={form.tenant_name} onChange={(e) => setForm((f) => ({ ...f, tenant_name: e.target.value }))} icon="👤" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["월세", "전세", "반전세"].map((t) => (
              <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                style={{ flex: 1, padding: "9px", borderRadius: 9, border: `2px solid ${form.type === t ? C.indigo : "#ebe9e3"}`, background: form.type === t ? C.indigo + "18" : "transparent", color: form.type === t ? C.indigo : C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label="계약 시작일 *" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
            <AuthInput label="계약 만료일 *" type="date" value={form.end_date}   onChange={(e) => setForm((f) => ({ ...f, end_date:   e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label="보증금 (만원)" placeholder="50000" value={form.deposit} onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))} icon="💵" />
            <AuthInput label="월세 (만원)"   placeholder="120"   value={form.rent}    onChange={(e) => setForm((f) => ({ ...f, rent:    e.target.value }))} icon="💰" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>특약 사항</p>
            <textarea value={form.special_terms} onChange={(e) => setForm((f) => ({ ...f, special_terms: e.target.value }))} placeholder="특약 사항을 입력하세요..." rows={3}
              style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={saveContract} disabled={saving} className="btn-primary"
              style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "저장 중..." : editTarget ? "저장하기" : "등록하기"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
