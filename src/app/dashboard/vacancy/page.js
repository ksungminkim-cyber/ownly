"use client";
import { useState } from "react";
import { SectionLabel, EmptyState, Modal, ConfirmDialog, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

export default function VacancyPage() {
  const { tenants, vacancies, addVacancy, deleteVacancy } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ addr: "", sub_type: "아파트", p_type: "주거", vacant_since: "", expected_rent: "", note: "" });

  const totalUnits  = tenants.length + vacancies.length;
  const vacancyRate = totalUnits > 0 ? Math.round((vacancies.length / totalUnits) * 100) : 0;
  const monthlyLoss = vacancies.reduce((s, v) => s + (Number(v.expected_rent) || 0), 0);

  const vacantDays = (since) => {
    if (!since) return 0;
    const d = Math.ceil((new Date() - new Date(since)) / 86400000);
    return d < 0 ? 0 : d;
  };

  const handleAdd = async () => {
    if (!form.addr.trim()) { toast("주소를 입력하세요", "error"); return; }
    setSaving(true);
    try {
      await addVacancy({
        addr: form.addr,
        sub_type: form.sub_type,
        p_type: form.p_type,
        vacant_since: form.vacant_since || new Date().toISOString().slice(0, 10),
        expected_rent: Number(form.expected_rent || 0),
        note: form.note,
      });
      toast("공실이 등록되었습니다");
      setShowModal(false);
      setForm({ addr: "", sub_type: "아파트", p_type: "주거", vacant_since: "", expected_rent: "", note: "" });
    } catch (e) {
      toast("저장 오류: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVacancy(deleteTarget);
      toast("공실이 해소 처리되었습니다");
    } catch (e) {
      toast("오류: " + e.message, "error");
    }
    setDeleteTarget(null);
  };

  const inp = (key, ph, type = "text") => (
    <input
      type={type}
      value={form[key]}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      placeholder={ph}
      style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: C.text, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 9, outline: "none", boxSizing: "border-box" }}
    />
  );

  const label = (txt) => (
    <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>{txt}</p>
  );

  const SUB_TYPES = ["아파트", "오피스텔", "빌라", "단독주택", "상가", "사무실", "기타"];

  return (
    <div className="page-in page-padding" style={{ padding: "36px 40px", maxWidth: 960 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>VACANCY MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>공실 관리</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>전체 {totalUnits}실 중 공실 {vacancies.length}실</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"
          style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + 공실 등록
        </button>
      </div>

      {/* KPI 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13, marginBottom: 24 }}>
        {[
          { l: "공실률",        v: vacancyRate + "%",      c: vacancyRate > 10 ? C.rose : C.emerald, sub: vacancyRate > 10 ? "주의 필요" : "양호" },
          { l: "공실 수",       v: vacancies.length + "실", c: C.amber,  sub: `전체 ${totalUnits}실 중` },
          { l: "월간 손실 추정", v: monthlyLoss + "만원",   c: C.rose,   sub: "공실 기대 월세 합계" },
        ].map((k) => (
          <div key={k.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 15, padding: "19px 22px" }}>
            <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 7 }}>{k.l}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: k.c }}>{k.v}</p>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* 공실 목록 */}
      {vacancies.length === 0 ? (
        <EmptyState icon="✅" title="공실이 없습니다" desc="모든 호실이 임대 중입니다" action="+ 공실 등록" onAction={() => setShowModal(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {vacancies.map((v) => {
            const days = vacantDays(v.vacant_since);
            const urgency = days > 90 ? C.rose : days > 30 ? C.amber : C.muted;
            return (
              <div key={v.id} className="hover-lift" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                    {/* 공실 아이콘 */}
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: C.amber + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏠</div>
                    <div>
                      <div style={{ display: "flex", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: v.p_type === "상가" ? C.amber : C.indigo, background: v.p_type === "상가" ? C.amber + "18" : C.indigo + "18", padding: "2px 8px", borderRadius: 5 }}>{v.sub_type}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: urgency, background: urgency + "18", padding: "2px 8px", borderRadius: 5 }}>공실 D+{days}</span>
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{v.addr}</p>
                      <div style={{ display: "flex", gap: 16, marginTop: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: C.muted }}>공실 시작: <span style={{ color: C.text }}>{v.vacant_since}</span></span>
                        <span style={{ fontSize: 12, color: C.muted }}>기대 월세: <span style={{ color: C.emerald, fontWeight: 700 }}>{v.expected_rent}만원</span></span>
                      </div>
                      {v.note && <p style={{ fontSize: 12, color: C.indigo, marginTop: 5 }}>📝 {v.note}</p>}
                    </div>
                  </div>
                  {/* 손실 계산 */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>누적 손실 추정</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: C.rose }}>
                        {Math.round((v.expected_rent || 0) * days / 30)}만원
                      </p>
                    </div>
                    <button onClick={() => setDeleteTarget(v.id)}
                      style={{ padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.emerald}40`, background: C.emerald + "18", color: C.emerald, whiteSpace: "nowrap" }}>
                      ✅ 임대 완료
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 공실 등록 모달 */}
      <Modal open={showModal} onClose={() => setShowModal(false)} width={480}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 18 }}>공실 등록</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            {label("주소 *")}
            {inp("addr", "서울시 마포구 신수동 123-4")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              {label("유형")}
              <select value={form.p_type} onChange={(e) => setForm((f) => ({ ...f, p_type: e.target.value }))}
                style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: C.text, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 9, outline: "none" }}>
                <option>주거</option>
                <option>상가</option>
              </select>
            </div>
            <div>
              {label("세부 유형")}
              <select value={form.sub_type} onChange={(e) => setForm((f) => ({ ...f, sub_type: e.target.value }))}
                style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: C.text, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 9, outline: "none" }}>
                {SUB_TYPES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              {label("공실 시작일")}
              {inp("vacant_since", "", "date")}
            </div>
            <div>
              {label("기대 월세 (만원)")}
              {inp("expected_rent", "150", "number")}
            </div>
          </div>

          <div>
            {label("메모")}
            <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="리모델링 예정, 즉시 입주 가능 등"
              rows={3}
              style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: C.text, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 9, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => setShowModal(false)}
              style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              취소
            </button>
            <button onClick={handleAdd} disabled={saving} className="btn-primary"
              style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "저장 중..." : "공실 등록"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 임대 완료 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="임대 완료 처리"
        desc="이 공실을 임대 완료로 처리하시겠습니까? 공실 목록에서 제거됩니다."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
