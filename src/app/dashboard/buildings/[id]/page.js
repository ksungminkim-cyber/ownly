"use client";
import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { SectionLabel, EmptyState, Modal, AuthInput, toast, ConfirmDialog, Badge } from "../../../../components/shared";
import { C, STATUS_MAP, daysLeft } from "../../../../lib/constants";
import { useApp } from "../../../../context/AppContext";
import BulkUploadModal from "../../../../components/BulkUploadModal";

export default function BuildingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { buildings, tenants, updateBuilding, deleteBuilding, loading } = useApp();
  const building = buildings.find(b => b.id === params.id);
  const units = useMemo(() => tenants.filter(t => t.building_id === params.id), [tenants, params.id]);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  if (loading && !building) return <div style={{ padding: 40, textAlign: "center" }}>불러오는 중...</div>;
  if (!building) {
    return (
      <div className="page-in page-padding" style={{ maxWidth: 720, textAlign: "center", padding: "60px 20px" }}>
        <EmptyState icon="🏢" title="존재하지 않는 건물입니다" desc="건물 목록에서 다시 확인해주세요" action="건물 목록으로" onAction={() => router.push("/dashboard/buildings")} />
      </div>
    );
  }

  const vacant = units.filter(u => u.status === "공실").length;
  const vacancyRate = units.length > 0 ? Math.round((vacant / units.length) * 100) : 0;
  const monthlyRent = units.reduce((s, u) => s + (Number(u.rent) || 0), 0);
  const monthlyMgt = units.reduce((s, u) => s + (Number(u.maintenance) || 0), 0);
  const totalDep = units.reduce((s, u) => s + (Number(u.dep) || 0), 0);
  const expiring = units.filter(u => { const dl = daysLeft(u.end_date); return dl > 0 && dl <= 60; }).length;

  const openEditMeta = () => {
    setEditForm({
      name: building.name || "",
      address: building.address || "",
      built_year: building.built_year || "",
      total_floors: building.total_floors || "",
      parking_spots: building.parking_spots || "",
      memo: building.memo || "",
    });
    setEditMode(true);
  };

  const saveMeta = async () => {
    setSaving(true);
    try {
      await updateBuilding(building.id, {
        name: editForm.name || null,
        address: editForm.address,
        built_year: editForm.built_year ? Number(editForm.built_year) : null,
        total_floors: editForm.total_floors ? Number(editForm.total_floors) : null,
        parking_spots: editForm.parking_spots ? Number(editForm.parking_spots) : null,
        memo: editForm.memo || null,
      });
      toast("건물 정보가 수정되었습니다");
      setEditMode(false);
    } catch (e) { toast("저장 오류: " + (e.message || ""), "error"); } finally { setSaving(false); }
  };

  const handleDeleteBuilding = async () => {
    try {
      await deleteBuilding(building.id);
      toast("건물이 삭제되었습니다. 호실은 건물 연결만 해제됩니다.");
      router.push("/dashboard/buildings");
    } catch (e) { toast("삭제 오류: " + (e.message || ""), "error"); }
    setConfirmDelete(false);
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 960 }}>
      <button onClick={() => router.push("/dashboard/buildings")}
        style={{ background: "none", border: "none", color: "#8a8a9a", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>← 건물 목록으로</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SectionLabel>BUILDING DETAIL</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>🏢 {building.name || building.address}</h1>
          {building.name && <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>{building.address}</p>}
          <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap", fontSize: 12, color: "#8a8a9a" }}>
            {building.built_year && <span>🗓 {building.built_year}년 준공</span>}
            {building.total_floors && <span>🏬 총 {building.total_floors}층</span>}
            {building.parking_spots != null && <span>🚗 주차 {building.parking_spots}대</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={openEditMeta} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #ebe9e3", background: "#fff", color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✏️ 수정</button>
          <button onClick={() => setConfirmDelete(true)} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.rose}33`, background: "transparent", color: "#e8445a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🗑 삭제</button>
        </div>
      </div>

      {/* 집계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { l: "호실", v: units.length + "개", c: "#1a2744" },
          { l: "공실", v: vacant + `개 ${units.length > 0 ? `(${vacancyRate}%)` : ""}`, c: vacant > 0 ? "#e8445a" : "#0fa573" },
          { l: "월 수입", v: monthlyRent.toLocaleString() + "만", c: "#0fa573" },
          { l: "월 관리비", v: monthlyMgt.toLocaleString() + "만", c: "#e8960a" },
          { l: "총 보증금", v: (totalDep / 10000).toFixed(1) + "억", c: "#1a2744" },
          { l: "만료 임박", v: expiring + "건", c: expiring > 0 ? "#e8960a" : "#8a8a9a" },
        ].map(k => (
          <div key={k.l} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{k.l}</p>
            <p style={{ fontSize: 17, fontWeight: 800, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* 호실 목록 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>호실 목록</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setBulkOpen(true)}
            style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.indigo}40`, background: C.indigo + "10", color: C.indigo, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📥 엑셀 일괄 업로드</button>
          <button onClick={() => router.push(`/dashboard/properties?newUnit=1&buildingId=${building.id}&addr=${encodeURIComponent(building.address)}`)}
            style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: C.indigo, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ 호실 추가</button>
        </div>
      </div>

      {units.length === 0 ? (
        <EmptyState icon="🚪" title="등록된 호실이 없습니다" desc="호실을 추가하거나 엑셀로 일괄 등록하세요" action="+ 호실 추가" onAction={() => router.push(`/dashboard/properties?newUnit=1&buildingId=${building.id}&addr=${encodeURIComponent(building.address)}`)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {units.map(t => {
            const dl = daysLeft(t.end_date);
            return (
              <div key={t.id} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.pType === "상가" ? C.amber : t.pType === "토지" ? "#0d9488" : C.indigo, background: (t.pType === "상가" ? C.amber : t.pType === "토지" ? "#0d9488" : C.indigo) + "18", padding: "3px 8px", borderRadius: 5, flexShrink: 0 }}>{t.sub || t.pType}</span>
                  <Badge label={t.status} map={STATUS_MAP} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.status === "공실" ? "(공실)" : t.name}</p>
                    <p style={{ fontSize: 11, color: "#8a8a9a" }}>월세 {Number(t.rent || 0).toLocaleString()}만 · 보증금 {(t.dep / 10000).toFixed(1)}억 · 만료 D-{dl}</p>
                  </div>
                </div>
                <button onClick={() => router.push("/dashboard/properties")}
                  style={{ padding: "5px 11px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #ebe9e3", background: "#fff", color: "#1a2744" }}>열기</button>
              </div>
            );
          })}
        </div>
      )}

      {/* 수정 모달 */}
      <Modal open={editMode} onClose={() => setEditMode(false)}>
        {editForm && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 14 }}>건물 정보 수정</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <AuthInput label="건물 이름" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              <AuthInput label="주소 *" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
              <div className="grid-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <AuthInput label="준공년도" value={editForm.built_year} onChange={e => setEditForm(f => ({ ...f, built_year: e.target.value }))} />
                <AuthInput label="총 층수" value={editForm.total_floors} onChange={e => setEditForm(f => ({ ...f, total_floors: e.target.value }))} />
                <AuthInput label="주차 대수" value={editForm.parking_spots} onChange={e => setEditForm(f => ({ ...f, parking_spots: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 6 }}>메모</p>
                <textarea value={editForm.memo} onChange={e => setEditForm(f => ({ ...f, memo: e.target.value }))} rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ebe9e3", fontSize: 13, background: "#f8f7f4", resize: "vertical", outline: "none", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #ebe9e3", background: "transparent", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
                <button onClick={saveMeta} disabled={saving} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "저장 중..." : "저장"}</button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* 일괄 업로드 모달 */}
      <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} building={building} />

      <ConfirmDialog open={confirmDelete} title="건물 삭제"
        desc={`${building.name || building.address}을(를) 삭제하시겠습니까? 소속 호실(${units.length}개)은 건물 연결만 해제되며, 호실 자체는 유지됩니다.`}
        onConfirm={handleDeleteBuilding} onCancel={() => setConfirmDelete(false)} danger />
    </div>
  );
}
