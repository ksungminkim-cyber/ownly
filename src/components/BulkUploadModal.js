"use client";
// 엑셀(.xlsx)·CSV 물건 일괄 업로드 모달 — 건물 상세(호실 등록)·물건 관리·온보딩에서 공용
// building 이 있으면 첫 컬럼은 "호실"(주소 = 건물 주소 + 호실), 없으면 첫 컬럼은 "주소"(building_id null)
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal, toast } from "./shared";
import { C, COLORS } from "../lib/constants";
import { useApp } from "../context/AppContext";
import { isSampleTenant } from "../lib/sampleData";

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

const TAIL_COLUMNS = ["유형", "세부유형", "월세(만)", "보증금(만)", "관리비(만)", "계약시작", "계약만료", "세입자", "전화", "공실여부"];
const BUILDING_COLUMNS = ["호실", ...TAIL_COLUMNS];
const STANDALONE_COLUMNS = ["주소", ...TAIL_COLUMNS];
const BUILDING_EXAMPLES = [
  ["1층", "상가", "1층 상가", 500, 8000, 80, "2025-03-01", "2027-02-28", "GS25", "010-1234-5678", ""],
  ["2층", "상가", "2층 이상", 300, 5000, 60, "", "", "", "", "Y"],
  ["3층", "상가", "2층 이상", 300, 5000, 60, "", "", "", "", "Y"],
];
const STANDALONE_EXAMPLES = [
  ["서울 마포구 합정동 123 101호", "주거", "원룸", 60, 1000, 5, "2025-03-01", "2027-02-28", "홍길동", "010-1234-5678", ""],
  ["서울 마포구 합정동 123 102호", "주거", "원룸", 60, 1000, 5, "", "", "", "", "Y"],
  ["경기 성남시 분당구 정자동 45 1층", "상가", "1층 상가", 300, 5000, 30, "2024-06-01", "2026-05-31", "OO카페", "", ""],
];

export default function BulkUploadModal({ open, onClose, building = null }) {
  const router = useRouter();
  const { tenants, addTenant, getPlanLimit } = useApp();
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const COLUMNS = building ? BUILDING_COLUMNS : STANDALONE_COLUMNS;
  const firstLabel = COLUMNS[0];

  // 무료 물건 한도 — 샘플 물건은 제외하고 셈 (물건 관리 화면과 같은 기준)
  const limit = getPlanLimit("properties");
  const used = tenants.filter((t) => !isSampleTenant(t)).length;
  const remaining = limit === Infinity || limit == null ? Infinity : Math.max(0, limit - used);
  const overflow = rows.length > remaining ? rows.length - remaining : 0;

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
          for (let c = 1; c <= COLUMNS.length; c++) {
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
    const hasHeader = COLUMNS.some(col => header.some(h => h.includes(col.split("(")[0])));
    const dataRows = hasHeader ? raw.slice(1) : raw;
    const errs = [];
    const parsed = dataRows.map((r, i) => {
      const rowNum = hasHeader ? i + 2 : i + 1;
      // 배열 인덱스로 명시적 접근 — destructure 시 undefined 전파 방지
      const unit = String(r[0] || "").trim();
      const pType = String(r[1] || (building ? "상가" : "주거")).trim();
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
      if (!unit) errs.push(building ? `행 ${rowNum}: 호실 번호가 없습니다` : `행 ${rowNum}: 주소가 없습니다`);
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
    if (remaining <= 0) { toast(`현재 플랜의 물건 한도(${limit}개)에 도달해 더 등록할 수 없어요 — 플랜을 올리면 더 등록할 수 있습니다`, "warning"); return; }
    // 한도를 넘는 행은 저장하지 않음 (위에서부터 한도까지만)
    const target = remaining === Infinity ? rows : rows.slice(0, remaining);
    const skipped = rows.length - target.length;
    setUploading(true);
    let success = 0;
    const failRows = [];
    for (const r of target) {
      try {
        await addTenant({
          building_id: building ? building.id : null,
          name: r.name || (r.isVacant ? "공실" : ""),
          phone: r.phone,
          pType: r.pType,
          sub: r.sub,
          addr: building ? `${building.address} ${r.unit}`.trim() : r.unit,
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
    const skipMsg = skipped > 0 ? `물건 한도(${limit}개)로 ${skipped}건은 저장하지 않았습니다` : "";
    if (failRows.length > 0) {
      toast(`성공 ${success}건 · 실패 ${failRows.length}건`, "error");
      setErrors(skipMsg ? [...failRows, skipMsg] : failRows);
      // 성공한 행만 미리보기에서 제거
      if (success > 0) setRows([]);
    } else {
      toast(skipMsg ? `${success}건 등록 완료 · ${skipMsg}` : `🎉 ${success}건 일괄 등록 완료!`, skipMsg ? "warning" : undefined);
      setRows([]);
      setErrors([]);
      onClose();
    }
  };

  const downloadTemplate = async () => {
    const ExcelJS = await loadExcelJS();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(building ? "호실 일괄 등록" : "물건 일괄 등록");
    ws.columns = COLUMNS.map((c, i) => ({ header: c, key: c, width: !building && i === 0 ? 34 : 14 }));
    ws.getRow(1).font = { bold: true };
    (building ? BUILDING_EXAMPLES : STANDALONE_EXAMPLES).forEach(ex => ws.addRow(ex));
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = building ? "호실_일괄등록_템플릿.xlsx" : "물건_일괄등록_템플릿.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} width={720}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 6 }}>{building ? "📥 호실 일괄 업로드" : "📥 엑셀로 물건 여러 개 올리기"}</h2>
      <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 14 }}>
        {building
          ? <><b>{building?.name || building?.address}</b>에 호실을 한 번에 등록합니다. 엑셀(.xlsx) 또는 CSV 파일.</>
          : <>여러 물건을 한 번에 등록합니다. 엑셀(.xlsx) 또는 CSV 파일. 건물로 묶는 것은 등록 후 건물 화면에서 할 수 있습니다.</>}
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => fileInputRef.current?.click()}
          style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${C.indigo}40`, background: C.indigo + "10", color: C.indigo, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📎 파일 선택</button>
        <button onClick={downloadTemplate}
          style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid #ebe9e3", background: "#fff", color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📄 템플릿 다운로드</button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.csv" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); e.target.value = ""; }} />
      </div>

      <div style={{ fontSize: 11, color: "#8a8a9a", background: "#f8f7f4", borderRadius: 8, padding: "10px 12px", marginBottom: 14, lineHeight: 1.7 }}>
        컬럼 순서: <b>{COLUMNS.join(" | ")}</b><br/>
        {building
          ? <>공실 등록: 월세·세입자 비워두고 <b>공실여부</b>에 <b>Y</b> 입력. 주소는 자동으로 &quot;건물 주소 + 호실&quot;로 구성됩니다.</>
          : <>공실 등록: 월세·세입자 비워두고 <b>공실여부</b>에 <b>Y</b> 입력. <b>{firstLabel}</b>에는 동·호수까지 전체 주소를 적어주세요.</>}
      </div>

      {overflow > 0 && (
        <div style={{ background: "rgba(232,150,10,0.07)", border: "1px solid rgba(232,150,10,0.3)", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#b45309", lineHeight: 1.6 }}>
          {remaining > 0
            ? <>현재 플랜의 물건 한도는 {limit}개(샘플 제외 {used}개 등록됨)라 위에서부터 <b>{remaining}건만</b> 등록되고, 나머지 <b>{overflow}건</b>은 저장되지 않습니다.</>
            : <>현재 플랜의 물건 한도({limit}개)에 이미 도달해 등록할 수 없습니다.</>}
          {" "}<button onClick={() => router.push("/dashboard/pricing")} style={{ padding: 0, border: "none", background: "transparent", color: C.indigo, fontSize: 12, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>플랜 보기</button>
        </div>
      )}

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
                {[firstLabel, "유형", "월세", "보증금", "공실"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#8a8a9a", fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f0efe9", opacity: i >= remaining ? 0.4 : 1 }}>
                  <td style={{ padding: "7px 10px", color: "#1a2744", fontWeight: 600 }}>{r.unit}{i >= remaining && <span style={{ marginLeft: 6, fontSize: 10, color: "#b45309" }}>한도 초과</span>}</td>
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
        <button onClick={handleUpload} disabled={uploading || rows.length === 0 || remaining <= 0} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: rows.length === 0 || remaining <= 0 ? "#e0e0e0" : `linear-gradient(135deg,${C.indigo},${C.purple})`, color: rows.length === 0 || remaining <= 0 ? "#aaa" : "#fff", fontWeight: 700, fontSize: 13, cursor: rows.length === 0 || remaining <= 0 ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
          {uploading ? "업로드 중..." : `${Math.min(rows.length, remaining)}건 일괄 등록`}
        </button>
      </div>
    </Modal>
  );
}
