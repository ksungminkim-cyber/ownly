"use client";
import { useState, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { SectionLabel, EmptyState, Modal, AuthInput, toast, ConfirmDialog, Badge } from "../../../../components/shared";
import { C, STATUS_MAP, COLORS, daysLeft } from "../../../../lib/constants";
import { useApp } from "../../../../context/AppContext";

// /exceljs.min.js (이미 public에 존재) 로딩
async function loadExcelJS() {
  if (typeof window === "undefined") return null;
  if (window.ExcelJS) return window.ExcelJS;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/exceljs.min.js";
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
  return window.ExcelJS;
}

const BULK_COLUMNS = ["호실", "유형", "세부유형", "월세(만)", "보증금(만)", "관리비(만)", "계약시작", "계약만료", "세입자", "전화", "공실여부"];
const BULK_EXAMPLES = [
  ["1층", "상가", "1층 상가", 500, 8000, 80, "2025-03-01", "2027-02-28", "GS25", "010-1234-5678", ""],
  ["2층", "상가", "2층 이상", 300, 5000, 60, "", "", "", "", "Y"],
  ["3층", "상가", "2층 이상", 300, 5000, 60, "", "", "", "", "Y"],
];

export default function BuildingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { buildings, tenants, addTenant, updateBuilding, deleteBuilding, loading } = useApp();
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
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
      <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} building={building} addTenant={addTenant} />

      <ConfirmDialog open={confirmDelete} title="건물 삭제"
        desc={`${building.name || building.address}을(를) 삭제하시겠습니까? 소속 호실(${units.length}개)은 건물 연결만 해제되며, 호실 자체는 유지됩니다.`}
        onConfirm={handleDeleteBuilding} onCancel={() => setConfirmDelete(false)} danger />
    </div>
  );
}

// ── 엑셀 일괄 업로드 모달 ────────────────────────────────────
function BulkUploadModal({ open, onClose, building, addTenant }) {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const parseFile = async (file) => {
    try {
      const ExcelJS = await loadExcelJS();
      if (!ExcelJS) { toast("엑셀 라이브러리 로드 실패", "error"); return; }
      const wb = new ExcelJS.Workbook();
      const buf = await file.arrayBuffer();
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = new TextDecoder("utf-8").decode(buf);
        const parsed = text.split(/\r?\n/).filter(l => l.trim()).map(l => l.split(",").map(c => c.trim()));
        processRows(parsed);
      } else {
        await wb.xlsx.load(buf);
        const ws = wb.worksheets[0];
        if (!ws) { toast("시트를 찾을 수 없습니다", "error"); return; }
        const raw = [];
        const rowCount = ws.rowCount || ws.lastRow?.number || 1;
        for (let r = 1; r <= rowCount; r++) {
          const row = ws.getRow(r);
          const cells = [];
          for (let c = 1; c <= BULK_COLUMNS.length; c++) {
            const cell = row.getCell(c);
            let v = cell.value;
            // ExcelJS는 날짜·공식·링크 등을 객체로 반환할 수 있어서 정규화
            if (v && typeof v === "object") {
              if (v instanceof Date) v = v.toISOString().slice(0, 10);
              else if ("text" in v) v = v.text;
              else if ("result" in v) v = v.result;
              else if ("richText" in v) v = v.richText.map(t => t.text).join("");
              else v = String(v);
            }
            cells.push(v == null ? "" : String(v));
          }
          // 모든 셀이 빈 행은 스킵
          if (cells.every(c => !c.trim())) continue;
          raw.push(cells);
        }
        if (raw.length === 0) { toast("읽을 행이 없습니다. 템플릿 형식이 맞는지 확인해주세요", "error"); return; }
        processRows(raw);
      }
    } catch (e) {
      toast("파일 파싱 오류: " + (e.message || ""), "error");
    }
  };

  const processRows = (raw) => {
    if (raw.length === 0) { setErrors(["빈 파일입니다"]); setRows([]); return; }
    // 첫 줄이 헤더인 경우 스킵 (한국어/영어)
    const header = raw[0].map(c => String(c).trim());
    const hasHeader = BULK_COLUMNS.some(col => header.some(h => h.includes(col.split("(")[0])));
    const dataRows = hasHeader ? raw.slice(1) : raw;
    const errs = [];
    const parsed = dataRows.map((r, i) => {
      const rowNum = hasHeader ? i + 2 : i + 1;
      // 배열 인덱스로 명시적 접근 — destructure 시 undefined 전파 방지
      const unit = String(r[0] || "").trim();
      const pType = String(r[1] || "상가").trim();
      const sub = String(r[2] || "").trim();
      const rent = r[3];
      const dep = r[4];
      const mgt = r[5];
      const start = String(r[6] || "").trim();
      const end = String(r[7] || "").trim();
      const name = String(r[8] || "").trim();
      const phone = String(r[9] || "").trim();
      const vacantFlag = String(r[10] || "").trim().toLowerCase();
      // 완전 빈 행 스킵 (호실·월세·이름 모두 비어있으면)
      if (!unit && !rent && !name) return null;
      const isVacant = ["y", "yes", "공실", "o", "1", "true"].includes(vacantFlag);
      const rentN = Number(String(rent || "0").replace(/,/g, "").replace(/\D/g, "").slice(0, 10)) || 0;
      const depN = Number(String(dep || "0").replace(/,/g, "").replace(/\D/g, "").slice(0, 10)) || 0;
      const mgtN = Number(String(mgt || "0").replace(/,/g, "").replace(/\D/g, "").slice(0, 10)) || 0;
      if (!rentN && !isVacant) errs.push(`행 ${rowNum}: 월세가 없습니다 (공실이면 공실여부에 Y)`);
      if (!unit) errs.push(`행 ${rowNum}: 호실 번호가 없습니다`);
      return {
        unit,
        pType,
        sub,
        rent: rentN,
        dep: depN,
        mgt: mgtN,
        start,
        end,
        name: name || (isVacant ? "공실" : ""),
        phone,
        isVacant,
        rowNum,
      };
    }).filter(Boolean);
    setRows(parsed);
    setErrors(errs);
  };

  const handleUpload = async () => {
    if (rows.length === 0) return;
    setUploading(true);
    let success = 0;
    const failRows = [];
    for (const r of rows) {
      try {
        await addTenant({
          building_id: building.id,
          name: r.name || (r.isVacant ? "공실" : ""),
          phone: r.phone,
          pType: r.pType,
          sub: r.sub,
          addr: `${building.address} ${r.unit}`.trim(),
          dep: r.dep,
          rent: r.rent,
          start_date: r.start || null,
          end_date: r.end || (r.isVacant ? null : "2027-12-31"),
          status: r.isVacant ? "공실" : "정상",
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          intent: r.isVacant ? "공실" : "미확인",
          maintenance: r.mgt,
          pay_day: 5,
          biz: null,
          contacts: [],
          area_pyeong: null,
        });
        success++;
      } catch (e) {
        console.error("bulk row fail:", r, e);
        failRows.push(`행 ${r.rowNum}(${r.unit}): ${e.message || "오류"}`);
      }
    }
    setUploading(false);
    if (failRows.length > 0) {
      toast(`성공 ${success}건 · 실패 ${failRows.length}건`, "error");
      setErrors(failRows);
      // 성공한 행만 미리보기에서 제거
      if (success > 0) setRows([]);
    } else {
      toast(`🎉 ${success}건 일괄 등록 완료!`);
      setRows([]);
      setErrors([]);
      onClose();
    }
  };

  const downloadTemplate = async () => {
    const ExcelJS = await loadExcelJS();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("호실 일괄 등록");
    ws.columns = BULK_COLUMNS.map(c => ({ header: c, key: c, width: 14 }));
    ws.getRow(1).font = { bold: true };
    BULK_EXAMPLES.forEach(ex => ws.addRow(ex));
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "호실_일괄등록_템플릿.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} width={720}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 6 }}>📥 호실 일괄 업로드</h2>
      <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 14 }}>
        <b>{building?.name || building?.address}</b>에 호실을 한 번에 등록합니다. 엑셀(.xlsx) 또는 CSV 파일.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => fileInputRef.current?.click()}
          style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${C.indigo}40`, background: C.indigo + "10", color: C.indigo, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📎 파일 선택</button>
        <button onClick={downloadTemplate}
          style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid #ebe9e3", background: "#fff", color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📄 템플릿 다운로드</button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.csv" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
      </div>

      <div style={{ fontSize: 11, color: "#8a8a9a", background: "#f8f7f4", borderRadius: 8, padding: "10px 12px", marginBottom: 14, lineHeight: 1.7 }}>
        컬럼 순서: <b>{BULK_COLUMNS.join(" | ")}</b><br/>
        공실 등록: 월세·세입자 비워두고 <b>공실여부</b>에 <b>Y</b> 입력. 주소는 자동으로 &quot;건물 주소 + 호실&quot;로 구성됩니다.
      </div>

      {errors.length > 0 && (
        <div style={{ background: "rgba(232,68,90,0.06)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#e8445a" }}>
          {errors.map((er, i) => <p key={i}>{er}</p>)}
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ border: "1px solid #ebe9e3", borderRadius: 10, overflow: "hidden", marginBottom: 14, maxHeight: 300, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8f7f4" }}>
                {["호실", "유형", "월세", "보증금", "공실"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#8a8a9a", fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f0efe9" }}>
                  <td style={{ padding: "7px 10px", color: "#1a2744", fontWeight: 600 }}>{r.unit}</td>
                  <td style={{ padding: "7px 10px", color: "#8a8a9a" }}>{r.sub || r.pType}</td>
                  <td style={{ padding: "7px 10px", color: "#1a2744" }}>{r.rent.toLocaleString()}만</td>
                  <td style={{ padding: "7px 10px", color: "#8a8a9a" }}>{r.dep.toLocaleString()}만</td>
                  <td style={{ padding: "7px 10px" }}>{r.isVacant ? <span style={{ color: "#e8445a", fontWeight: 700 }}>🚪 공실</span> : <span style={{ color: "#0fa573" }}>{r.name}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #ebe9e3", background: "transparent", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
        <button onClick={handleUpload} disabled={uploading || rows.length === 0} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: rows.length === 0 ? "#e0e0e0" : `linear-gradient(135deg,${C.indigo},${C.purple})`, color: rows.length === 0 ? "#aaa" : "#fff", fontWeight: 700, fontSize: 13, cursor: rows.length === 0 ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
          {uploading ? "업로드 중..." : `${rows.length}건 일괄 등록`}
        </button>
      </div>
    </Modal>
  );
}
