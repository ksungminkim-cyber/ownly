"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, SectionLabel, EmptyState, Modal, AuthInput, toast } from "../../../components/shared";
import { C, PAY_MAP } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

function parseBankSms(text) {
  if (!text) return null;
  const amtMatch = text.match(/([0-9,]+)\s*만원/) || text.match(/([0-9,]+)\s*원/);
  if (!amtMatch) return null;
  let rawAmt = parseInt(amtMatch[1].replace(/,/g, ""), 10);
  const isManWon = text.includes("만원");
  const amt = isManWon ? rawAmt : Math.round(rawAmt / 10000);
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
  const [payModal, setPayModal] = useState(null);   // 월세 납부 모달 tid
  const [maintModal, setMaintModal] = useState(null); // 관리비 납부 모달 tid
  const [payDate, setPayDate]   = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]     = useState(false);
  const [smsModal, setSmsModal]   = useState(false);
  const [smsText, setSmsText]     = useState("");
  const [smsParsed, setSmsParsed] = useState(null);
  const [smsTid, setSmsTid]       = useState(null);
  const [viewMode, setViewMode]   = useState("all"); // all | rent | maintenance

  // 상가·오피스텔 중 관리비 있는 임차인만 필터
  const hasMaintenance = (t) => (t.pType === "상가" || t.pType === "오피스텔") && (t.maintenance || 0) > 0;

  const rows = tenants.map((t) => ({
    t,
    p: payments.find((x) => x.tid === t.id && x.month === month),
  }));

  // 수치 계산
  const totalRentExp  = tenants.reduce((s, t) => s + (t.rent || 0), 0);
  const totalRentColl = rows.filter((r) => r.p?.status === "paid").reduce((s, r) => s + (r.p?.amt || 0), 0);
  const rentRate      = totalRentExp > 0 ? Math.round((totalRentColl / totalRentExp) * 100) : 0;

  const maintTenants  = tenants.filter(hasMaintenance);
  const totalMaintExp  = maintTenants.reduce((s, t) => s + (t.maintenance || 0), 0);
  const totalMaintColl = rows.filter((r) => hasMaintenance(r.t) && r.p?.maintenance_paid).reduce((s, r) => s + (r.t.maintenance || 0), 0);
  const maintRate      = totalMaintExp > 0 ? Math.round((totalMaintColl / totalMaintExp) * 100) : 0;

  const totalExp  = totalRentExp + totalMaintExp;
  const totalColl = totalRentColl + totalMaintColl;
  const totalRate = totalExp > 0 ? Math.round((totalColl / totalExp) * 100) : 0;

  const handleSmsChange = (text) => { setSmsText(text); setSmsParsed(parseBankSms(text)); };

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
      toast(t.name + "님 월세 납부 처리 완료");
      setPayModal(null);
    } catch { toast("저장 중 오류가 발생했습니다", "error"); }
    finally { setSaving(false); }
  };

  const markMaintPaid = async (tid) => {
    const t = tenants.find((x) => x.id === tid);
    if (!t) return;
    setSaving(true);
    try {
      const existing = payments.find((x) => x.tid === tid && x.month === month);
      await upsertPayment({
        tid, month,
        status: existing?.status || "unpaid",
        paid: existing?.paid || null,
        amt: existing?.amt || t.rent,
        maintenance_paid: true,
        maintenance_paid_date: payDate,
      });
      toast(t.name + "님 관리비 납부 처리 완료");
      setMaintModal(null);
    } catch { toast("저장 중 오류가 발생했습니다", "error"); }
    finally { setSaving(false); }
  };

  const markMaintUnpaid = async (tid) => {
    try {
      const existing = payments.find((x) => x.tid === tid && x.month === month);
      if (!existing) return;
      await upsertPayment({
        tid, month,
        status: existing.status,
        paid: existing.paid,
        amt: existing.amt,
        maintenance_paid: false,
        maintenance_paid_date: null,
      });
      toast("관리비 납부 취소 처리되었습니다", "warning");
    } catch { toast("처리 중 오류가 발생했습니다", "error"); }
  };

  const markUnpaid = async (tid) => {
    try {
      await deletePayment(tid, month);
      toast("납부 취소 처리되었습니다", "warning");
    } catch { toast("처리 중 오류가 발생했습니다", "error"); }
  };

  const displayRows = viewMode === "maintenance"
    ? rows.filter((r) => hasMaintenance(r.t))
    : viewMode === "rent"
    ? rows
    : rows;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 1020 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>PAYMENT MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>수금 현황</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>
            {new Date().getFullYear()}년 {month}월 · 전체 수금률 <span style={{ color: totalRate >= 80 ? C.emerald : C.rose, fontWeight: 700 }}>{totalRate}%</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setSmsModal(true)} style={{ padding: "8px 14px", borderRadius: 10, minHeight: 36, background: "rgba(15,165,115,0.1)", border: "1px solid rgba(15,165,115,0.3)", color: "#0fa573", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            📱 입금문자 파싱
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid #ebe9e3", borderRadius: 11, padding: "7px 11px" }}>
            <button onClick={() => setMonth((m) => Math.max(1, m - 1))} style={{ width: 26, height: 26, borderRadius: 7, background: "#f8f7f4", border: "none", color: "#1a2744", cursor: "pointer", fontSize: 14 }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", minWidth: 58, textAlign: "center" }}>{new Date().getFullYear()}년 {month}월</span>
            <button onClick={() => setMonth((m) => Math.min(12, m + 1))} style={{ width: 26, height: 26, borderRadius: 7, background: "#f8f7f4", border: "none", color: "#1a2744", cursor: "pointer", fontSize: 14 }}>›</button>
          </div>
        </div>
      </div>

      {/* 요약 카드 — 6개 */}
      <div className="dash-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { l: "월세 청구", v: totalRentExp + "만원", c: C.muted },
          { l: "월세 수금", v: totalRentColl + "만원", c: C.emerald },
          { l: "월세 미수금", v: (totalRentExp - totalRentColl) + "만원", c: C.rose },
          { l: "관리비 청구", v: totalMaintExp + "만원", c: C.muted, hide: maintTenants.length === 0 },
          { l: "관리비 수금", v: totalMaintColl + "만원", c: C.emerald, hide: maintTenants.length === 0 },
          { l: "전체 수금률", v: totalRate + "%", c: totalRate >= 80 ? C.emerald : C.rose },
        ].filter(k => !k.hide).map((k) => (
          <div key={k.l} style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "14px 16px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>{k.l}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* 진행률 바 */}
      <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>월세 수금</span>
          <span style={{ fontSize: 12, color: "#8a8a9a" }}>{totalRentColl} / {totalRentExp}만원 ({rentRate}%)</span>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: "#f8f7f4", overflow: "hidden", marginBottom: maintTenants.length > 0 ? 10 : 0 }}>
          <div style={{ height: "100%", width: rentRate + "%", borderRadius: 6, background: `linear-gradient(90deg,${C.indigo},${C.purple})`, transition: "width .5s" }} />
        </div>
        {maintTenants.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>🏢 관리비 수금</span>
              <span style={{ fontSize: 12, color: "#8a8a9a" }}>{totalMaintColl} / {totalMaintExp}만원 ({maintRate}%)</span>
            </div>
            <div style={{ height: 6, borderRadius: 6, background: "#f8f7f4", overflow: "hidden" }}>
              <div style={{ height: "100%", width: maintRate + "%", borderRadius: 6, background: `linear-gradient(90deg,${C.amber},#d97706)`, transition: "width .5s" }} />
            </div>
          </>
        )}
      </div>

      {/* 뷰 모드 탭 */}
      {maintTenants.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[{ v: "all", l: "전체" }, { v: "rent", l: "월세만" }, { v: "maintenance", l: "관리비 해당만" }].map(({ v, l }) => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${viewMode === v ? "#1a2744" : "#ebe9e3"}`, background: viewMode === v ? "#1a2744" : "transparent", color: viewMode === v ? "#fff" : "#8a8a9a" }}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* 테이블 */}
      {tenants.length === 0 ? (
        <EmptyState icon="💰" title="세입자가 없습니다" desc="물건을 먼저 등록하면 수금 현황을 확인할 수 있습니다" />
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 17, overflow: "hidden" }}>
          <div className="table-scroll-wrap" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0a0a10" }}>
                  {["세입자", "물건", "월세", "월세 상태", ...(maintTenants.length > 0 ? ["관리비", "관리비 상태"] : []), ""].map((h) => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map(({ t, p }) => {
                  const st = p?.status || "unpaid";
                  const s  = PAY_MAP[st];
                  const maintPaid = p?.maintenance_paid || false;
                  const showMaint = hasMaintenance(t);

                  return (
                    <tr key={t.id} className="trow" style={{ borderTop: "1px solid #ebe9e3", background: st === "unpaid" ? C.rose + "04" : "transparent" }}>
                      {/* 세입자 */}
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                          <div style={{ width: 30, height: 30, borderRadius: 9, background: (t.color || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: t.color || C.indigo }}>{t.name?.[0]}</div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{t.name}</p>
                            <p style={{ fontSize: 10, color: "#8a8a9a" }}>매월 1일</p>
                          </div>
                        </div>
                      </td>

                      {/* 물건 */}
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: t.pType === "상가" ? C.amber : t.pType === "토지" ? "#0d9488" : C.indigo, background: t.pType === "상가" ? C.amber + "18" : t.pType === "토지" ? "#0d948818" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span>
                        <p style={{ fontSize: 10, color: "#8a8a9a", marginTop: 2, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.addr}</p>
                      </td>

                      {/* 월세 금액 */}
                      <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#1a2744", whiteSpace: "nowrap" }}>
                        {t.rent}만원
                        {p?.paid && <p style={{ fontSize: 10, color: "#8a8a9a", marginTop: 2 }}>{String(p.paid).slice(5)}</p>}
                      </td>

                      {/* 월세 상태 + 액션 */}
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          <Badge label={s.label} map={{ [s.label]: { c: s.c, bg: s.bg } }} />
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {st === "unpaid" ? (
                              <>
                                <button onClick={() => setPayModal(t.id)} style={{ padding: "4px 9px", borderRadius: 7, background: C.indigo + "20", border: `1px solid ${C.indigo}40`, color: "#1a2744", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>납부처리</button>
                                <button onClick={() => { setSmsTid(t.id); setSmsModal(true); }} style={{ padding: "4px 7px", borderRadius: 7, background: "rgba(15,165,115,0.1)", border: "1px solid rgba(15,165,115,0.3)", color: "#0fa573", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>📱</button>
                                <button onClick={() => router.push("/dashboard/certified")} style={{ padding: "4px 7px", borderRadius: 7, background: C.rose + "12", border: `1px solid ${C.rose}30`, color: "#e8445a", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>📨</button>
                              </>
                            ) : (
                              <button onClick={() => markUnpaid(t.id)} style={{ padding: "4px 9px", borderRadius: 7, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>취소</button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 관리비 열 — 해당 임차인이 있을 때만 */}
                      {maintTenants.length > 0 && (
                        <>
                          <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: showMaint ? "#1a2744" : "#d1d5db", whiteSpace: "nowrap" }}>
                            {showMaint ? `${t.maintenance}만원` : "—"}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            {showMaint ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: maintPaid ? C.emerald : C.amber, background: maintPaid ? "rgba(15,165,115,0.1)" : "rgba(232,150,10,0.1)", padding: "3px 9px", borderRadius: 20, display: "inline-block" }}>
                                  {maintPaid ? "✅ 납부완료" : "💰 미납"}
                                </span>
                                {maintPaid ? (
                                  <button onClick={() => markMaintUnpaid(t.id)} style={{ padding: "4px 9px", borderRadius: 7, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>취소</button>
                                ) : (
                                  <button onClick={() => setMaintModal(t.id)} style={{ padding: "4px 9px", borderRadius: 7, background: C.amber + "20", border: `1px solid ${C.amber}40`, color: "#92400e", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>납부처리</button>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: "#d1d5db" }}>해당없음</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* 빈 열 */}
                      <td style={{ padding: "11px 14px" }} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 월세 납부 모달 */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} width={380}>
        {payModal && (() => {
          const t = tenants.find((x) => x.id === payModal);
          if (!t) return null;
          return (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>월세 납부 처리</h3>
              <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 18 }}>{t.name}님 {month}월 월세</p>
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

      {/* 관리비 납부 모달 */}
      <Modal open={!!maintModal} onClose={() => setMaintModal(null)} width={380}>
        {maintModal && (() => {
          const t = tenants.find((x) => x.id === maintModal);
          if (!t) return null;
          return (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>🏢 관리비 납부 처리</h3>
              <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 18 }}>{t.name}님 {month}월 관리비</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>관리비 금액</p>
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "#f8f7f4", border: "1px solid #ebe9e3", fontSize: 16, fontWeight: 800, color: C.amber }}>{t.maintenance}만원</div>
                </div>
                <AuthInput label="납부일" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                <div style={{ display: "flex", gap: 9 }}>
                  <button onClick={() => setMaintModal(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
                  <button onClick={() => markMaintPaid(maintModal)} disabled={saving} className="btn-primary"
                    style={{ flex: 2, padding: "11px", borderRadius: 10, background: `linear-gradient(135deg,${C.amber},#d97706)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {saving ? "처리 중..." : "납부 확인"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 입금문자 파싱 모달 */}
      <Modal open={smsModal} onClose={() => { setSmsModal(false); setSmsText(""); setSmsParsed(null); setSmsTid(null); }} width={420}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>입금 문자 파싱</h3>
        <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 16 }}>은행 입금 알림 문자를 붙여넣으면 금액·날짜를 자동으로 인식합니다</p>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>세입자 선택</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tenants.map((t) => (
              <button key={t.id} onClick={() => setSmsTid(t.id)}
                style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${smsTid === t.id ? C.emerald : "#ebe9e3"}`, background: smsTid === t.id ? "rgba(15,165,115,0.12)" : "transparent", color: smsTid === t.id ? "#0fa573" : "#8a8a9a" }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>입금 문자 내용</p>
          <textarea value={smsText} onChange={(e) => handleSmsChange(e.target.value)}
            placeholder={"예) [국민은행] 03/05 입금 120만원 잔액 340만원\n또는: 3월5일 하나은행 120만원 입금"}
            rows={4}
            style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
        </div>
        {smsText && (
          <div style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 14, background: smsParsed ? "rgba(15,165,115,0.07)" : "rgba(232,68,90,0.07)", border: `1px solid ${smsParsed ? "rgba(15,165,115,0.25)" : "rgba(232,68,90,0.25)"}` }}>
            {smsParsed ? (
              <div style={{ display: "flex", gap: 20 }}>
                <div><p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>인식된 금액</p><p style={{ fontSize: 16, fontWeight: 800, color: "#0fa573" }}>{smsParsed.amt}만원</p></div>
                <div><p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>인식된 날짜</p><p style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>{smsParsed.paidDate}</p></div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#e8445a", fontWeight: 600 }}>금액을 인식하지 못했습니다.</p>
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

      {/* ── 전문가 연결 CTA — 미납 있을 때만 표시 ── */}
      {tenants.some((t) => {
        const p = payments.find((x) => x.tid === t.id && x.month === month);
        return !p || p.status === "unpaid";
      }) && (
        <div style={{ marginTop: 20, background: "linear-gradient(135deg,rgba(232,68,90,0.05),rgba(232,68,90,0.02))", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 16, padding: "18px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(232,68,90,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⚖️</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 3 }}>미납 임차인 법적 대응이 필요하신가요?</p>
                <p style={{ fontSize: 12, color: "#8a8a9a" }}>내용증명 발송부터 명도소송까지 — 제휴 법무사가 도와드립니다</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => window.location.href = "/dashboard/certified"}
                style={{ padding: "9px 16px", borderRadius: 10, background: "transparent", border: "1px solid rgba(232,68,90,0.4)", color: "#e8445a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                내용증명 작성
              </button>
              <button onClick={() => alert("🚧 법무사 연결 서비스 준비 중입니다.\n빠른 시일 내에 오픈할게요!")}
                style={{ padding: "9px 16px", borderRadius: 10, background: "#e8445a", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                법무사 연결 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
