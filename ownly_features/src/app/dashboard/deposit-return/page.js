"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { SectionLabel, toast } from "../../../components/shared";

const C = {
  navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a",
  amber:"#e8960a", border:"#e8e6e0", muted:"#8a8a9a",
  faint:"#f8f7f4", surface:"#ffffff", accent:"#4f46e5",
};

export default function DepositReturnPage() {
  const router = useRouter();
  const { tenants, repairs } = useApp();
  const printRef = useRef(null);

  const [selectedTenant, setSelectedTenant] = useState("");
  const [deductions, setDeductions] = useState([
    { id: 1, label: "미납 월세", amount: "" },
    { id: 2, label: "수리비 공제", amount: "" },
    { id: 3, label: "원상복구 비용", amount: "" },
  ]);
  const [memo, setMemo] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0,10));

  const sel = tenants.find(t => t.id === selectedTenant);
  const deposit = sel ? (sel.dep || sel.deposit || 0) : 0;
  const totalDeduct = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const returnAmount = Math.max(0, deposit - totalDeduct);

  const addDeduction = () => setDeductions(d => [...d, { id: Date.now(), label: "", amount: "" }]);
  const removeDeduction = (id) => setDeductions(d => d.filter(x => x.id !== id));
  const updateDeduction = (id, field, val) => setDeductions(d => d.map(x => x.id === id ? { ...x, [field]: val } : x));

  const handlePrint = () => {
    if (!sel) { toast("세입자를 선택하세요", "error"); return; }
    window.print();
  };

  const today = new Date().toLocaleDateString("ko-KR");

  return (
    <div className="page-in page-padding" style={{ maxWidth: 720 }}>
      <button onClick={() => router.back()} style={{ fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0, fontWeight: 600 }}>← 뒤로</button>

      <div style={{ marginBottom: 28 }}>
        <SectionLabel>DEPOSIT RETURN</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.navy, letterSpacing: "-.5px", marginBottom: 6 }}>보증금 반환 계산서</h1>
        <p style={{ fontSize: 13, color: C.muted }}>미납금·수리비를 공제한 실제 반환액을 계산하고 PDF로 저장하세요</p>
      </div>

      {/* 세입자 선택 */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>세입자 선택</p>
        <select value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)}
          style={{ width: "100%", padding: "11px 13px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.navy, background: C.faint, cursor: "pointer" }}>
          <option value="">세입자를 선택하세요</option>
          {tenants.map(t => (
            <option key={t.id} value={t.id}>{t.name} — {t.addr || t.address || ""} (보증금 {(t.dep||t.deposit||0).toLocaleString()}만원)</option>
          ))}
        </select>
        {sel && (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { l: "보증금", v: `${deposit.toLocaleString()}만원`, c: C.accent },
              { l: "월세", v: `${(sel.rent||0).toLocaleString()}만원`, c: C.emerald },
              { l: "계약 종료", v: sel.end_date || sel.end || "-", c: C.amber },
            ].map(k => (
              <div key={k.l} style={{ background: C.faint, borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{k.l}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: k.c }}>{k.v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 공제 항목 */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" }}>공제 항목</p>
          <button onClick={addDeduction} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "rgba(26,39,68,0.06)", border: `1px solid ${C.border}`, color: C.navy, cursor: "pointer" }}>+ 항목 추가</button>
        </div>
        {deductions.map((d, i) => (
          <div key={d.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 36px", gap: 8, marginBottom: 8 }}>
            <input value={d.label} onChange={e => updateDeduction(d.id, "label", e.target.value)} placeholder={`공제 항목 ${i+1}`}
              style={{ padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.navy, background: C.faint }} />
            <div style={{ position: "relative" }}>
              <input type="number" value={d.amount} onChange={e => updateDeduction(d.id, "amount", e.target.value)} placeholder="0"
                style={{ width: "100%", padding: "10px 36px 10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.rose, fontWeight: 700, background: C.faint }} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.muted }}>만원</span>
            </div>
            <button onClick={() => removeDeduction(d.id)} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "rgba(232,68,90,0.08)", color: C.rose, cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        ))}
        {totalDeduct > 0 && (
          <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(232,68,90,0.06)", borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: C.muted }}>총 공제액</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.rose }}>-{totalDeduct.toLocaleString()}만원</span>
          </div>
        )}
      </div>

      {/* 반환액 */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},#2d4270)`, borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>실 반환 보증금</p>
        <p style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{returnAmount.toLocaleString()}만원</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
          보증금 {deposit.toLocaleString()}만원 - 공제 {totalDeduct.toLocaleString()}만원
        </p>
      </div>

      {/* 반환일 + 메모 */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>반환 예정일</p>
            <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.navy, background: C.faint }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>특이사항 메모</p>
            <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 도배 미복구 합의, 청소비 포함 등"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.navy, background: C.faint }} />
          </div>
        </div>
      </div>

      {/* 출력 버튼 */}
      <button onClick={handlePrint} disabled={!sel}
        style={{ width: "100%", padding: "15px", borderRadius: 14, background: sel ? `linear-gradient(135deg,${C.navy},#2d4270)` : "#ccc", border: "none", color: "#fff", fontWeight: 800, fontSize: 15, cursor: sel ? "pointer" : "not-allowed", boxShadow: sel ? "0 4px 20px rgba(26,39,68,0.25)" : "none" }}>
        🖨️ 보증금 반환 계산서 PDF 출력
      </button>

      {/* 인쇄 전용 영역 */}
      <div id="deposit-return-print" style={{ display: "none" }}>
        <style>{`
          @media print {
            body > * { display: none !important; }
            #deposit-return-print { display: block !important; }
            @page { margin: 20mm; size: A4; }
          }
        `}</style>
        {sel && (
          <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 680, margin: "0 auto" }}>
            <div style={{ textAlign: "center", borderBottom: "2px solid #1a2744", paddingBottom: 16, marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", margin: "0 0 4px" }}>보증금 반환 계산서</h1>
              <p style={{ fontSize: 12, color: "#8a8a9a", margin: 0 }}>온리(Ownly) 임대 관리 · {today}</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <tbody>
                {[
                  ["세입자명", sel.name],
                  ["주소", sel.addr || sel.address || ""],
                  ["계약 종료일", sel.end_date || sel.end || "-"],
                  ["보증금", `${deposit.toLocaleString()}만원`],
                  ["반환 예정일", returnDate],
                ].map(([k,v]) => (
                  <tr key={k} style={{ borderBottom: "1px solid #e8e6e0" }}>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#8a8a9a", fontWeight: 700, width: 120 }}>{k}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#1a2744", fontWeight: 600 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 10 }}>공제 내역</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead>
                <tr style={{ background: "#f5f4f0" }}>
                  <th style={{ padding: "8px 12px", fontSize: 11, color: "#8a8a9a", textAlign: "left" }}>항목</th>
                  <th style={{ padding: "8px 12px", fontSize: 11, color: "#8a8a9a", textAlign: "right" }}>금액</th>
                </tr>
              </thead>
              <tbody>
                {deductions.filter(d => d.label || d.amount).map(d => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #e8e6e0" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#1a2744" }}>{d.label || "-"}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#e8445a", fontWeight: 700, textAlign: "right" }}>-{Number(d.amount||0).toLocaleString()}만원</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "1.5px solid #1a2744" }}>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 800, color: "#1a2744" }}>총 공제액</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 800, color: "#e8445a", textAlign: "right" }}>-{totalDeduct.toLocaleString()}만원</td>
                </tr>
              </tbody>
            </table>
            <div style={{ background: "#1a2744", borderRadius: 10, padding: "16px 20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>실 반환 보증금</span>
              <span style={{ fontSize: 22, fontWeight: 900 }}>{returnAmount.toLocaleString()}만원</span>
            </div>
            {memo && <p style={{ fontSize: 12, color: "#8a8a9a", borderTop: "1px solid #e8e6e0", paddingTop: 12 }}>특이사항: {memo}</p>}
            <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ textAlign: "center", borderTop: "1px solid #1a2744", paddingTop: 8 }}>
                <p style={{ fontSize: 12, color: "#8a8a9a" }}>임대인 서명</p>
              </div>
              <div style={{ textAlign: "center", borderTop: "1px solid #1a2744", paddingTop: 8 }}>
                <p style={{ fontSize: 12, color: "#8a8a9a" }}>임차인 확인</p>
              </div>
            </div>
            <p style={{ textAlign: "center", fontSize: 10, color: "#b0aead", marginTop: 20 }}>온리(Ownly) · ownly.kr · {today}</p>
          </div>
        )}
      </div>
    </div>
  );
}
