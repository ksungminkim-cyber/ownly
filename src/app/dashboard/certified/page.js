"use client";
import { useState } from "react";
import { SectionLabel, EmptyState, Modal, AuthInput, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import PlanGate from "../../../components/PlanGate";

export default function CertifiedPage() {
  return <PlanGate feature="certified"><CertifiedContent /></PlanGate>;
}

function CertifiedContent() {
  const { tenants } = useApp();
  const [showModal, setShowModal]     = useState(false);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [reason, setReason]           = useState("미납");
  const [content, setContent]         = useState("");
  const [history, setHistory]         = useState([]);

  const REASONS = ["미납", "퇴거 요청", "계약 위반", "재계약 거절", "기타"];

  const send = () => {
    if (!selectedTenant || !content.trim()) { toast("내용을 입력하세요", "error"); return; }
    const tenant = tenants.find((t) => String(t.id) === selectedTenant);
    setHistory((prev) => [{
      id: Date.now(),
      tenantName: tenant?.name || "알수없음",
      reason,
      content,
      date: new Date().toISOString().slice(0, 10),
    }, ...prev]);
    toast("내용증명이 발송되었습니다");
    setShowModal(false);
    setContent("");
    setSelectedTenant("");
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>CERTIFIED MAIL</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>내용증명</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>총 {history.length}건 발송</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#1a2744", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + 내용증명 작성
        </button>
      </div>

      {history.length === 0 ? (
        <EmptyState icon="📨" title="발송 내역이 없습니다" desc="내용증명 작성 버튼으로 첫 발송을 시작하세요" action="+ 내용증명 작성" onAction={() => setShowModal(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {history.map((h) => (
            <div key={h.id} className="hover-lift" style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "17px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{h.tenantName}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#e8445a", background: C.rose + "18", padding: "2px 8px", borderRadius: 5 }}>{h.reason}</span>
                </div>
                <span style={{ fontSize: 11, color: "#8a8a9a" }}>{h.date}</span>
              </div>
              <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.6 }}>{h.content.slice(0, 120)}{h.content.length > 120 ? "..." : ""}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a2744", marginBottom: 16 }}>내용증명 작성</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>수신인 (세입자)</p>
            <select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} style={{ width: "100%", padding: "11px 14px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none" }}>
              <option value="">선택하세요</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.addr}</option>)}
            </select>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>발송 사유</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${reason === r ? C.rose : "#ebe9e3"}`, background: reason === r ? C.rose + "20" : "transparent", color: reason === r ? C.rose : C.muted }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>내용</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용증명 본문을 입력하세요..."
              rows={6}
              style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none", lineHeight: 1.7 }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={send} className="btn-primary" style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${C.rose},#dc2626)`, border: "none", color: "#1a2744", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>발송하기</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
