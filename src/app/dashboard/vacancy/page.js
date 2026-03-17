"use client";
import { useState } from "react";
import { SectionLabel, EmptyState, Modal, AuthInput, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import PlanGate from "../../../components/PlanGate";
import AddressInput from "../../../components/AddressInput";

export default function VacancyPage() {
  return <PlanGate feature="vacancy"><VacancyContent /></PlanGate>;
}

function VacancyContent() {
  const { tenants, vacancies, setVacancies } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ addr: "", sub: "아파트", pType: "주거", vacantSince: "", expectedRent: "", note: "" });

  const totalUnits  = tenants.length + vacancies.length;
  const vacancyRate = totalUnits > 0 ? Math.round((vacancies.length / totalUnits) * 100) : 0;
  const monthlyLoss = vacancies.reduce((s, v) => s + (v.expectedRent || 0), 0);

  const addVacancy = () => {
    if (!form.addr) { toast("주소를 입력하세요", "error"); return; }
    setVacancies((prev) => [...prev, { id: Date.now(), ...form, expectedRent: Number(form.expectedRent || 0), vacantSince: form.vacantSince || new Date().toISOString().slice(0, 10) }]);
    toast("공실이 등록되었습니다");
    setShowModal(false);
    setForm({ addr: "", sub: "아파트", pType: "주거", vacantSince: "", expectedRent: "", note: "" });
  };

  const removeVacancy = (id) => {
    setVacancies((prev) => prev.filter((v) => v.id !== id));
    toast("공실이 해소 처리되었습니다");
  };

  const vacantDays = (since) => {
    const d = Math.ceil((new Date() - new Date(since)) / 86400000);
    return d < 0 ? 0 : d;
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>VACANCY MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>공실 관리</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>전체 {totalUnits}실 중 공실 {vacancies.length}실</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + 공실 등록
        </button>
      </div>

      <div className="dash-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13, marginBottom: 22 }}>
        {[
          { l: "공실률",       v: vacancyRate + "%",  c: vacancyRate > 10 ? C.rose : C.emerald, sub: vacancyRate > 10 ? "주의 필요" : "양호" },
          { l: "공실 수",      v: vacancies.length + "실", c: C.amber, sub: "전체 " + totalUnits + "실 중" },
          { l: "월간 손실 추정", v: monthlyLoss + "만원", c: C.rose, sub: "공실 기대 월세 합계" },
        ].map((k) => (
          <div key={k.l} style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 15, padding: "19px 22px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 7 }}>{k.l}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: k.c }}>{k.v}</p>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 3 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {vacancies.length === 0 ? (
        <EmptyState icon="✅" title="공실이 없습니다" desc="모든 호실이 임대 중입니다" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {vacancies.map((v) => (
            <div key={v.id} className="hover-lift" style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "17px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", gap: 7, marginBottom: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: v.pType === "상가" ? C.amber : C.indigo, background: v.pType === "상가" ? C.amber + "18" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{v.sub}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#e8445a", background: C.rose + "18", padding: "2px 7px", borderRadius: 5 }}>공실 D+{vacantDays(v.vacantSince)}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>서울 {v.addr}</p>
                  <p style={{ fontSize: 12, color: "#8a8a9a", marginTop: 2 }}>공실 시작: {v.vacantSince} · 기대 월세: {v.expectedRent}만원</p>
                  {v.note && <p style={{ fontSize: 11, color: "#1a2744", marginTop: 3 }}>{v.note}</p>}
                </div>
                <button onClick={() => removeVacancy(v.id)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.emerald}40`, background: C.emerald + "18", color: "#0fa573" }}>임대 완료</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a2744", marginBottom: 16 }}>공실 등록</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {["주거", "상가"].map((t) => (
              <button key={t} onClick={() => setForm((f) => ({ ...f, pType: t, sub: t === "주거" ? "아파트" : "1층 상가" }))} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `2px solid ${form.pType === t ? C.indigo : "#ebe9e3"}`, background: form.pType === t ? C.indigo + "18" : "transparent", color: form.pType === t ? C.indigo : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {t === "주거" ? "🏠 주거" : "🏪 상가"}
              </button>
            ))}
          </div>
          <AddressInput label="주소" value={form.addr} onChange={(v) => setForm((f) => ({ ...f, addr: v }))} onSelect={(v) => setForm((f) => ({ ...f, addr: v }))} placeholder="마포구 합정동 123" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label="공실 시작일" type="date" value={form.vacantSince} onChange={(e) => setForm((f) => ({ ...f, vacantSince: e.target.value }))} />
            <AuthInput label="기대 월세 (만원)" placeholder="120" value={form.expectedRent} onChange={(e) => setForm((f) => ({ ...f, expectedRent: e.target.value }))} icon="💰" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>메모</p>
            <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="공실 관련 메모..." rows={2} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={addVacancy} className="btn-primary" style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>등록</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
