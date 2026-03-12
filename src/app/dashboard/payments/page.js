"use client";
import { useState } from "react";
import { Badge, SectionLabel, EmptyState, Modal, AuthInput, toast } from "../../../components/shared";
import { C, PAY_MAP } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

export default function PaymentsPage() {
  const { tenants, payments, upsertPayment, deletePayment } = useApp();
  const [month, setMonth]       = useState(new Date().getMonth() + 1);
  const [payModal, setPayModal] = useState(null);
  const [payDate, setPayDate]   = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]     = useState(false);

  const rows      = tenants.map((t) => ({ t, p: payments.find((x) => x.tid === t.id && x.month === month) }));
  const totalExp  = tenants.reduce((s, t) => s + (t.rent || 0), 0);
  const totalColl = rows.filter((r) => r.p?.status === "paid").reduce((s, r) => s + (r.p?.amt || 0), 0);
  const rate      = totalExp > 0 ? Math.round((totalColl / totalExp) * 100) : 0;

  const markPaid = async (tid) => {
    const t = tenants.find((x) => x.id === tid);
    if (!t) return;
    setSaving(true);
    try {
      await upsertPayment({ tid, month, status: "paid", paid: payDate, amt: t.rent });
      toast(t.name + "님 납부 처리 완료");
      setPayModal(null);
    } catch {
      toast("저장 중 오류가 발생했습니다", "error");
    } finally {
      setSaving(false);
    }
  };

  const markUnpaid = async (tid) => {
    try {
      await deletePayment(tid, month);
      toast("납부 취소 처리되었습니다", "warning");
    } catch {
      toast("처리 중 오류가 발생했습니다", "error");
    }
  };

  return (
    <div className="page-in page-padding" style={{ padding: "36px 40px", maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>PAYMENT MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-.4px" }}>수금 현황</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
            {new Date().getFullYear()}년 {month}월 · 수금률 <span style={{ color: rate >= 80 ? C.emerald : C.rose, fontWeight: 700 }}>{rate}%</span>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 11, padding: "7px 11px" }}>
          <button onClick={() => setMonth((m) => Math.max(1, m - 1))} style={{ width: 26, height: 26, borderRadius: 7, background: C.faint, border: "none", color: C.text, cursor: "pointer", fontSize: 14 }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", minWidth: 58, textAlign: "center" }}>{new Date().getFullYear()}년 {month}월</span>
          <button onClick={() => setMonth((m) => Math.min(12, m + 1))} style={{ width: 26, height: 26, borderRadius: 7, background: C.faint, border: "none", color: C.text, cursor: "pointer", fontSize: 14 }}>›</button>
        </div>
      </div>

      <div className="dash-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 20 }}>
        {[
          { l: "청구 총액", v: totalExp + "만원",               c: C.muted },
          { l: "수금 완료", v: totalColl + "만원",              c: C.emerald },
          { l: "미수금",    v: (totalExp - totalColl) + "만원", c: C.rose },
          { l: "수금률",    v: rate + "%",                      c: rate >= 80 ? C.emerald : C.rose },
        ].map((k) => (
          <div key={k.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{k.l}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "15px 20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>이번 달 수금 진행</span>
          <span style={{ fontSize: 12, color: C.muted }}>{totalColl} / {totalExp}만원</span>
        </div>
        <div style={{ height: 7, borderRadius: 8, background: C.faint, overflow: "hidden" }}>
          <div style={{ height: "100%", width: rate + "%", borderRadius: 8, background: `linear-gradient(90deg,${C.indigo},${C.purple})`, transition: "width .5s" }} />
        </div>
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon="💰" title="세입자가 없습니다" desc="물건을 먼저 등록하면 수금 현황을 확인할 수 있습니다" />
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 17, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0a0a10" }}>
                {["세입자", "물건", "청구금액", "납부일", "상태", ""].map((h) => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, color: "#4b5563", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ t, p }) => {
                const st = p?.status || "unpaid";
                const s  = PAY_MAP[st];
                return (
                  <tr key={t.id} className="trow" style={{ borderTop: `1px solid ${C.border}`, background: st === "unpaid" ? C.rose + "04" : "transparent" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: (t.color || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: t.color || C.indigo }}>{t.name?.[0]}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.name}</p>
                          <p style={{ fontSize: 10, color: C.muted }}>매월 5일</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.pType === "상가" ? C.amber : C.indigo, background: t.pType === "상가" ? C.amber + "18" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span>
                      <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{t.addr}</p>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#fff" }}>{t.rent}만원</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: p?.paid ? C.text : C.muted }}>{p?.paid ? String(p.paid).slice(5) : "—"}</td>
                    <td style={{ padding: "12px 16px" }}><Badge label={s.label} map={{ [s.label]: { c: s.c, bg: s.bg } }} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      {st === "unpaid" ? (
                        <button onClick={() => setPayModal(t.id)} style={{ padding: "5px 11px", borderRadius: 8, background: C.indigo + "20", border: `1px solid ${C.indigo}40`, color: C.indigo, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>납부처리</button>
                      ) : (
                        <button onClick={() => markUnpaid(t.id)} style={{ padding: "5px 11px", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>취소</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!payModal} onClose={() => setPayModal(null)} width={380}>
        {payModal && (() => {
          const t = tenants.find((x) => x.id === payModal);
          if (!t) return null;
          return (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>납부 처리</h3>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{t.name}님 {month}월 월세</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>납부 금액</p>
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: C.faint, border: `1px solid ${C.border}`, fontSize: 16, fontWeight: 800, color: C.emerald }}>{t.rent}만원</div>
                </div>
                <AuthInput label="납부일" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                <div style={{ display: "flex", gap: 9 }}>
                  <button onClick={() => setPayModal(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
                  <button onClick={() => markPaid(payModal)} disabled={saving} className="btn-primary"
                    style={{ flex: 2, padding: "11px", borderRadius: 10, background: `linear-gradient(135deg,${C.emerald},#059669)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {saving ? "처리 중..." : "납부 확인"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
