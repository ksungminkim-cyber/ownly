"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SectionLabel, EmptyState, Modal, AuthInput, toast, ConfirmDialog } from "../../../components/shared";
import { C, daysLeft, buildingKey } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

export default function BuildingsPage() {
  const router = useRouter();
  const { buildings, tenants, addBuilding, loading } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", built_year: "", total_floors: "", parking_spots: "", memo: "" });

  const resetForm = () => setForm({ name: "", address: "", built_year: "", total_floors: "", parking_spots: "", memo: "" });

  // 건물별 집계 + 주소 기반 가상 건물(등록 안 된 물건들) 포함
  const buildingCards = useMemo(() => {
    const cards = buildings.map(b => {
      const units = tenants.filter(t => t.building_id === b.id);
      return { ...b, units, virtual: false };
    });
    // 건물에 소속되지 않은 tenants를 addr 기반으로 그룹화해 가상 건물 카드로 노출
    const unassigned = tenants.filter(t => !t.building_id);
    const virtualMap = new Map();
    for (const t of unassigned) {
      const key = buildingKey(t.addr);
      if (!key) continue;
      if (!virtualMap.has(key)) virtualMap.set(key, { id: `virtual:${key}`, address: key, name: null, virtual: true, units: [] });
      virtualMap.get(key).units.push(t);
    }
    return [...cards, ...Array.from(virtualMap.values())].sort((a, b) => b.units.length - a.units.length);
  }, [buildings, tenants]);

  const handleSave = async () => {
    if (!form.address) { toast("주소를 입력하세요", "error"); return; }
    setSaving(true);
    try {
      await addBuilding({
        name: form.name || null,
        address: form.address,
        built_year: form.built_year ? Number(form.built_year) : null,
        total_floors: form.total_floors ? Number(form.total_floors) : null,
        parking_spots: form.parking_spots ? Number(form.parking_spots) : null,
        memo: form.memo || null,
      });
      toast("건물이 등록되었습니다");
      setShowModal(false);
      resetForm();
    } catch (e) {
      toast("등록 중 오류: " + (e.message || ""), "error");
    } finally { setSaving(false); }
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>BUILDING MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>건물 관리</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>등록 건물 {buildings.length}개 · 연결된 호실 {tenants.filter(t => t.building_id).length}개</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ 건물 등록</button>
      </div>

      {loading ? (
        <p style={{ color: "#8a8a9a", textAlign: "center", padding: 40 }}>불러오는 중...</p>
      ) : buildingCards.length === 0 ? (
        <EmptyState icon="🏢" title="등록된 건물이 없습니다" desc="건물을 등록하면 호실 단위로 수익을 관리할 수 있어요" action="+ 건물 등록" onAction={() => setShowModal(true)} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
          {buildingCards.map(b => {
            const vacant = b.units.filter(u => u.status === "공실").length;
            const vacancyRate = b.units.length > 0 ? Math.round((vacant / b.units.length) * 100) : 0;
            const monthlyRent = b.units.reduce((s, u) => s + (Number(u.rent) || 0), 0);
            const expiring = b.units.filter(u => { const dl = daysLeft(u.end_date); return dl > 0 && dl <= 60; }).length;
            return (
              <div key={b.id}
                onClick={() => !b.virtual && router.push(`/dashboard/buildings/${b.id}`)}
                style={{ background: "#fff", border: `1.5px solid ${b.virtual ? "#ebe9e3" : C.indigo + "30"}`, borderRadius: 14, padding: "18px 20px", cursor: b.virtual ? "default" : "pointer", transition: "all .15s" }}
                onMouseEnter={(e) => { if (!b.virtual) e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,39,68,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 22 }}>🏢</span>
                      {b.virtual && <span style={{ fontSize: 10, fontWeight: 700, color: "#8a8a9a", background: "#f0efe9", padding: "2px 7px", borderRadius: 5 }}>미등록 (주소 기반)</span>}
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#1a2744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name || b.address}</p>
                    {b.name && <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.address}</p>}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ padding: "8px 12px", background: "#f8f7f4", borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 2 }}>호실</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#1a2744" }}>{b.units.length}개</p>
                  </div>
                  <div style={{ padding: "8px 12px", background: vacant > 0 ? "rgba(232,68,90,0.06)" : "rgba(15,165,115,0.06)", borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 2 }}>공실</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: vacant > 0 ? "#e8445a" : "#0fa573" }}>{vacant}개 {b.units.length > 0 && `(${vacancyRate}%)`}</p>
                  </div>
                  <div style={{ padding: "8px 12px", background: "#f8f7f4", borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 2 }}>월 수입</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#1a2744" }}>{monthlyRent.toLocaleString()}만</p>
                  </div>
                  <div style={{ padding: "8px 12px", background: expiring > 0 ? "rgba(232,150,10,0.06)" : "#f8f7f4", borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 2 }}>만료 임박</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: expiring > 0 ? "#e8960a" : "#1a2744" }}>{expiring}건</p>
                  </div>
                </div>
                {!b.virtual && (
                  <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: C.indigo, textAlign: "right" }}>호실 상세 보기 →</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 14 }}>건물 등록</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AuthInput label="건물 이름 (선택)" placeholder="예: 강남 테헤란로 빌딩" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <AuthInput label="주소 *" placeholder="예: 서울 강남구 테헤란로 100" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <AuthInput label="준공년도" placeholder="2015" value={form.built_year} onChange={e => setForm(f => ({ ...f, built_year: e.target.value }))} />
            <AuthInput label="총 층수" placeholder="5" value={form.total_floors} onChange={e => setForm(f => ({ ...f, total_floors: e.target.value }))} />
            <AuthInput label="주차 대수" placeholder="10" value={form.parking_spots} onChange={e => setForm(f => ({ ...f, parking_spots: e.target.value }))} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 6 }}>메모</p>
            <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} rows={3} placeholder="대지면적, 용도지역, 특이사항 등"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ebe9e3", fontSize: 13, color: "#1a2744", background: "#f8f7f4", resize: "vertical", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => { setShowModal(false); resetForm(); }}
              style={{ flex: 1, padding: "12px", borderRadius: 11, border: "1px solid #ebe9e3", background: "transparent", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: "12px", borderRadius: 11, border: "none", background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "저장 중..." : "등록"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
