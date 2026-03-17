"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, SectionLabel, EmptyState, Modal, AuthInput, toast } from "../../../components/shared";
import { C, PAY_MAP } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

// ── 은행 입금 문자 파싱 ──────────────────────────────────────────
function parseBankSms(text) {
  if (!text) return null;
  // 금액 패턴: 숫자(콤마 가능) + 원 or 만원
  const amtMatch = text.match(/([0-9,]+)\s*만원/) || text.match(/([0-9,]+)\s*원/);
  if (!amtMatch) return null;
  let rawAmt = parseInt(amtMatch[1].replace(/,/g, ""), 10);
  // "만원" 단위면 그대로, "원" 단위면 만원 변환
  const isManWon = text.includes("만원");
  const amt = isManWon ? rawAmt : Math.round(rawAmt / 10000);

  // 날짜 패턴: MM/DD, MM-DD, MM월DD일
  const dateMatch = text.match(/(\d{1,2})[\/\-월](\d{1,2})/);
  const today = new Date();
  let paidDate = today.toISOString().slice(0, 10);
  if (dateMatch) {
    const m = String(dateMatch[1]).padStart(2, "0");
    const d = String(dateMatch[2]).padStart(2, "0");
    paidDate = `${today.getFullYear()}-${m}-${d}`;
  }
  return { amt, paidDate };
}

export default function PaymentsPage() {
  const router = useRouter();
  const { tenants, payments, upsertPayment, deletePayment } = useApp();
  const [month, setMonth]       = useState(new Date().getMonth() + 1);
  const [payModal, setPayModal] = useState(null);
  const [payDate, setPayDate]   = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]     = useState(false);
  // 문자 파싱
  const [smsModal, setSmsModal]   = useState(false);
  const [smsText, setSmsText]     = useState("");
  const [smsParsed, setSmsParsed] = useState(null);
  const [smsTid, setSmsTid]       = useState(null);

  const rows      = tenants.map((t) => ({ t, p: payments.find((x) => x.tid === t.id && x.month === month) }));
  const totalExp  = tenants.reduce((s, t) => s + (t.rent || 0), 0);
  const totalColl = rows.filter((r) => r.p?.status === "paid").reduce((s, r) => s + (r.p?.amt || 0), 0);
  const rate      = totalExp > 0 ? Math.round((totalColl / totalExp) * 100) : 0;

  const handleSmsChange = (text) => {
    setSmsText(text);
    setSmsParsed(parseBankSms(text));
  };

  const confirmSmsPay = async () => {
    if (!smsTid || !smsParsed) return;
    setSaving(true);
    try {
      const t = tenants.find((x) => x.id === smsTid);
      await upsertPayment({ tid: smsTid, month, status: "paid", paid: smsParsed.paidDate, amt: smsParsed.amt || t?.rent });
      toast((t?.name || "") + "님 납부 처리 완료");
      setSmsModal(false); setSmsText(""); setSmsParsed(null); setSmsTid(null);
    } catch { toast("처리 중 오류가 발생했습니다", "error"); }
    finally { setSaving(false); }
  };

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
    <div className="page-in page-padding" style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>PAYMENT MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>수금 현황</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>
            {new Date().getFullYear()}년 {month}월 · 수금률 <span style={{ color: rate >= 80 ? C.emerald : C.rose, fontWeight: 700 }}>{rate}%</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* 은행 문자 파싱 버튼 */}
          <button onClick={() => setSmsModal(true)} style={{
            padding: "8px 14px", borderRadius: 10, minHeight: 36,
            background: "rgba(15,165,115,0.1)", border: "1px solid rgba(15,165,115,0.3)",
            color: "#0fa573", fontWeight: 700, fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            📱 입금문자 파싱
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid #ebe9e3", borderRadius: 11, padding: "7px 11px" }}>
            <button onClick={() => setMonth((m) => Math.max(1, m - 1))} style={{ width: 26, height: 26, borderRadius: 7, background: "#f8f7f4", border: "none", color: "#1a2744", cursor: "pointer", fontSize: 14 }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", minWidth: 58, textAlign: "center" }}>{new Date().getFullYear()}년 {month}월</span>
            <button onClick={() => setMonth((m) => Math.min(12, m + 1))} style={{ width: 26, height: 26, borderRadius: 7, background: "#f8f7f4", border: "none", color: "#1a2744", cursor: "pointer", fontSize: 14 }}>›</button>
          </div>
        </div>
      </div>

      <div className="dash-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 20 }}>
        {[
          { l: "청구 총액", v: totalExp + "만원",               c: C.muted },
          { l: "수금 완료", v: totalColl + "만원",              c: C.emerald },
          { l: "미수금",    v: (totalExp - totalColl) + "만원", c: C.rose },
          { l: "수금률",    v: rate + "%",                      c: rate >= 80 ? C.emerald : C.rose },
        ].map((k) => (
          <div key={k.l} style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{k.l}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "15px 20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>이번 달 수금 진행</span>
          <span style={{ fontSize: 12, color: "#8a8a9a" }}>{totalColl} / {totalExp}만원</span>
        </div>
        <div style={{ height: 7, borderRadius: 8, background: "#f8f7f4", overflow: "hidden" }}>
          <div style={{ height: "100%", width: rate + "%", borderRadius: 8, background: `linear-gradient(90deg,${C.indigo},${C.purple})`, transition: "width .5s" }} />
        </div>
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon="💰" title="세입자가 없습니다" desc="물건을 먼저 등록하면 수금 현황을 확인할 수 있습니다" />
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 17, overflow: "hidden" }}>
          <div className="table-scroll-wrap" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
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
                  <tr key={t.id} className="trow" style={{ borderTop: "1px solid #ebe9e3", background: st === "unpaid" ? C.rose + "04" : "transparent" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: (t.color || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: t.color || C.indigo }}>{t.name?.[0]}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{t.name}</p>
                          <p style={{ fontSize: 10, color: "#8a8a9a" }}>매월 5일</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700,
                        color: t.pType === "상가" ? C.amber : t.pType === "토지" ? "#0d9488" : C.indigo,
                        background: t.pType === "상가" ? C.amber + "18" : t.pType === "토지" ? "#0d948818" : C.indigo + "18",
                        padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span>
                      <p style={{ fontSize: 10, color: "#8a8a9a", marginTop: 2 }}>{t.addr}</p>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{t.rent}만원</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: p?.paid ? C.text : C.muted }}>{p?.paid ? String(p.paid).slice(5) : "—"}</td>
                    <td style={{ padding: "12px 16px" }}><Badge label={s.label} map={{ [s.label]: { c: s.c, bg: s.bg } }} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      {st === "unpaid" ? (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <button onClick={() => setPayModal(t.id)} style={{ padding: "5px 11px", borderRadius: 8, background: C.indigo + "20", border: `1px solid ${C.indigo}40`, color: "#1a2744", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>납부처리</button>
                          <button onClick={() => { setSmsTid(t.id); setSmsModal(true); }} style={{ padding: "5px 9px", borderRadius: 8, background: "rgba(15,165,115,0.1)", border: "1px solid rgba(15,165,115,0.3)", color: "#0fa573", fontSize: 10, fontWeight: 700, cursor: "pointer" }} title="입금문자 파싱">📱</button>
                          <button onClick={() => router.push("/dashboard/certified")} style={{ padding: "5px 9px", borderRadius: 8, background: C.rose + "12", border: `1px solid ${C.rose}30`, color: "#e8445a", fontSize: 10, fontWeight: 700, cursor: "pointer" }} title="내용증명 발송">📨</button>
                        </div>
                      ) : (
                        <button onClick={() => markUnpaid(t.id)} style={{ padding: "5px 11px", borderRadius: 8, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>취소</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Modal open={!!payModal} onClose={() => setPayModal(null)} width={380}>
        {payModal && (() => {
          const t = tenants.find((x) => x.id === payModal);
          if (!t) return null;
          return (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>납부 처리</h3>
              <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 20 }}>{t.name}님 {month}월 월세</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>납부 금액</p>
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "#f8f7f4", border: "1px solid #ebe9e3", fontSize: 16, fontWeight: 800, color: "#0fa573" }}>{t.rent}만원</div>
                </div>
                <AuthInput label="납부일" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                <div style={{ display: "flex", gap: 9 }}>
                  <button onClick={() => setPayModal(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
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

      {/* 📱 은행 입금 문자 파싱 모달 */}
      <Modal open={smsModal} onClose={() => { setSmsModal(false); setSmsText(""); setSmsParsed(null); setSmsTid(null); }} width={420}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>입금 문자 파싱</h3>
        <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 16 }}>은행 입금 알림 문자를 붙여넣으면 금액·날짜를 자동으로 인식합니다</p>

        {/* 세입자 선택 (미납만) */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>세입자 선택</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tenants.map((t) => (
              <button key={t.id} onClick={() => setSmsTid(t.id)}
                style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${smsTid === t.id ? C.emerald : "#ebe9e3"}`,
                  background: smsTid === t.id ? "rgba(15,165,115,0.12)" : "transparent",
                  color: smsTid === t.id ? "#0fa573" : "#8a8a9a" }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* 문자 입력 */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>입금 문자 내용</p>
          <textarea value={smsText} onChange={(e) => handleSmsChange(e.target.value)}
            placeholder={"예) [국민은행] 03/05 입금 120만원 잔액 340만원\n또는: 3월5일 하나은행 120만원 입금"}
            rows={4}
            style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
        </div>

        {/* 파싱 결과 프리뷰 */}
        {smsText && (
          <div style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 14,
            background: smsParsed ? "rgba(15,165,115,0.07)" : "rgba(232,68,90,0.07)",
            border: `1px solid ${smsParsed ? "rgba(15,165,115,0.25)" : "rgba(232,68,90,0.25)"}` }}>
            {smsParsed ? (
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>인식된 금액</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#0fa573" }}>{smsParsed.amt}만원</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>인식된 날짜</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>{smsParsed.paidDate}</p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#e8445a", fontWeight: 600 }}>금액을 인식하지 못했습니다. 문자 내용을 확인해주세요.</p>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={() => { setSmsModal(false); setSmsText(""); setSmsParsed(null); setSmsTid(null); }}
            style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
          <button onClick={confirmSmsPay} disabled={saving || !smsParsed || !smsTid} className="btn-primary"
            style={{ flex: 2, padding: "11px", borderRadius: 10, background: smsParsed && smsTid ? `linear-gradient(135deg,${C.emerald},#059669)` : "#e0e0e0", border: "none", color: smsParsed && smsTid ? "#fff" : "#aaa", fontWeight: 700, fontSize: 13, cursor: smsParsed && smsTid ? "pointer" : "not-allowed" }}>
            {saving ? "처리 중..." : "납부 처리"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
