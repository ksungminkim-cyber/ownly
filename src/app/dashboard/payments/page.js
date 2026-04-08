"use client"; import { useState, useEffect } from "react"; import { useRouter } from "next/navigation"; import { Badge, SectionLabel, EmptyState, Modal, AuthInput, toast, SkeletonTable } from "../../../components/shared"; import { C, PAY_MAP } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext";

function parseBankSms(text) { if (!text?.trim()) return null; let amt = null; const manMatch = text.match(/([0-9,]+)\s*만원/); if (manMatch) amt = parseInt(manMatch[1].replace(/,/g, ""), 10); if (!amt) { const wonMatch = text.match(/([0-9,]{4,})\s*원/); if (wonMatch) { const rawWon = parseInt(wonMatch[1].replace(/,/g, ""), 10); amt = Math.round(rawWon / 10000); } } if (!amt) { const kakaoMatch = text.match(/입금\s*([0-9,]+)/); if (kakaoMatch) { const raw = parseInt(kakaoMatch[1].replace(/,/g, ""), 10); amt = raw > 9999 ? Math.round(raw / 10000) : raw; } } if (!amt) return null; const today = new Date(); let paidDate = today.toISOString().slice(0, 10); const dateMatch = text.match(/(\d{1,2})[\/\-월](\d{1,2})/); if (dateMatch) { const m = String(dateMatch[1]).padStart(2, "0"); const d = String(dateMatch[2]).padStart(2, "0"); paidDate = `${today.getFullYear()}-${m}-${d}`; } const banks = ["카카오뱅크", "토스뱅크", "케이뱅크", "국민", "신한", "하나", "우리", "기업", "농협", "NH", "IBK", "KB", "SC"]; const bank = banks.find(b => text.includes(b)) || null; return { amt, paidDate, bank }; }

export function triggerDailyNotify(user, tenants, payments) { if (!user?.id || !user?.email || !tenants?.length) return; const today = new Date().toISOString().slice(0, 10); const key = `ownly_notified_${today}_${user.id}`; if (typeof window !== "undefined" && localStorage.getItem(key)) return; const month = new Date().getMonth() + 1; const year = new Date().getFullYear(); const hasUnpaid = tenants.some(t => { const p = (payments || []).find(x => x.tid === t.id && x.month === month && (x.year || year) === year); return !p || p.status !== "paid"; }); const hasExpiring = tenants.some(t => { const end = t.contract_end || t.end_date; if (!end) return false; const days = Math.ceil((new Date(end) - new Date()) / 86400000); return days > 0 && days <= 90; }); const isFirstOfMonth = new Date().getDate() === 1; const types = []; if (hasUnpaid) types.push("unpaid"); if (hasExpiring) types.push("expiring"); if (isFirstOfMonth) types.push("checklist"); if (types.length === 0) return; Promise.all(types.map(type => fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, userId: user.id, userEmail: user.email }), }).catch(() => {}))).then(() => { if (typeof window !== "undefined") localStorage.setItem(key, "1"); }); }

export default function PaymentsPage() {
  const router = useRouter();
  const { tenants, payments, upsertPayment, deletePayment, user, loading } = useApp();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [payModal, setPayModal] = useState(null);
  const [maintModal, setMaintModal] = useState(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [smsModal, setSmsModal] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [smsParsed, setSmsParsed] = useState(null);
  const [smsTid, setSmsTid] = useState(null);

  useEffect(() => { if (user && tenants.length > 0) { triggerDailyNotify(user, tenants, payments); } }, [user, tenants.length]);

  if (loading) return <SkeletonTable rows={5} cols={4} />;

  const hasMaintenance = (t) => (t.pType === "상가" || t.pType === "오피스텔") && (t.maintenance || 0) > 0;
  const rows = tenants
    .filter(t => t.status !== "공실")
    .map((t) => ({ t, p: payments.find((x) => x.tid === t.id && x.month === month) }));

  const totalRentExp = rows.reduce((s, { t }) => s + (t.rent || 0), 0);
  const totalRentColl = rows.filter((r) => r.p?.status === "paid").reduce((s, r) => s + (r.p?.amt || r.t.rent || 0), 0);
  const rentRate = totalRentExp > 0 ? Math.round((totalRentColl / totalRentExp) * 100) : 0;
  const maintTenants = rows.filter(({ t }) => hasMaintenance(t));
  const totalMaintExp = maintTenants.reduce((s, { t }) => s + (t.maintenance || 0), 0);
  const totalMaintColl = maintTenants.filter((r) => r.p?.maintenance_paid).reduce((s, r) => s + (r.t.maintenance || 0), 0);
  const maintRate = totalMaintExp > 0 ? Math.round((totalMaintColl / totalMaintExp) * 100) : 0;
  const totalExp = totalRentExp + totalMaintExp;
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
      await upsertPayment({ tid, month, status: existing?.status || "unpaid", paid: existing?.paid || null, amt: existing?.amt || t.rent, maintenance_paid: true, maintenance_paid_date: payDate });
      toast(t.name + "님 관리비 납부 처리 완료");
      setMaintModal(null);
    } catch { toast("저장 중 오류가 발생했습니다", "error"); }
    finally { setSaving(false); }
  };

  const markMaintUnpaid = async (tid) => {
    try {
      const existing = payments.find((x) => x.tid === tid && x.month === month);
      if (!existing) return;
      await upsertPayment({ tid, month, status: existing.status, paid: existing.paid, amt: existing.amt, maintenance_paid: false, maintenance_paid_date: null });
      toast("관리비 납부 취소 처리되었습니다", "warning");
    } catch { toast("처리 중 오류가 발생했습니다", "error"); }
  };

  const markUnpaid = async (tid) => {
    try { await deletePayment(tid, month); toast("납부 취소 처리되었습니다", "warning"); }
    catch { toast("처리 중 오류가 발생했습니다", "error"); }
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 860 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>PAYMENT MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>수금 현황</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>
            {new Date().getFullYear()}년 {month}월 · 전체 수금률{" "}
            <span style={{ color: totalRate >= 80 ? C.emerald : C.rose, fontWeight: 700 }}>{totalRate}%</span>
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

      {/* KPI 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { l: "월세 청구", v: totalRentExp.toLocaleString() + "만원", c: C.muted },
          { l: "월세 수금", v: totalRentColl.toLocaleString() + "만원", c: C.emerald },
          { l: "월세 미수금", v: (totalRentExp - totalRentColl).toLocaleString() + "만원", c: C.rose },
          ...(maintTenants.length > 0 ? [
            { l: "관리비 청구", v: totalMaintExp.toLocaleString() + "만원", c: C.muted },
            { l: "관리비 수금", v: totalMaintColl.toLocaleString() + "만원", c: C.amber },
          ] : []),
          { l: "전체 수금률", v: totalRate + "%", c: totalRate >= 80 ? C.emerald : C.rose },
        ].map((k) => (
          <div key={k.l} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "12px 14px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{k.l}</p>
            <p style={{ fontSize: 17, fontWeight: 800, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* 진행률 바 */}
      <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>월세 수금</span>
          <span style={{ fontSize: 12, color: "#8a8a9a" }}>{totalRentColl.toLocaleString()} / {totalRentExp.toLocaleString()}만원 ({rentRate}%)</span>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: "#f8f7f4", overflow: "hidden", marginBottom: maintTenants.length > 0 ? 10 : 0 }}>
          <div style={{ height: "100%", width: rentRate + "%", borderRadius: 6, background: `linear-gradient(90deg,${C.indigo},${C.purple})`, transition: "width .5s" }} />
        </div>
        {maintTenants.length > 0 && (<>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>🏢 관리비 수금</span>
            <span style={{ fontSize: 12, color: "#8a8a9a" }}>{totalMaintColl.toLocaleString()} / {totalMaintExp.toLocaleString()}만원 ({maintRate}%)</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: "#f8f7f4", overflow: "hidden" }}>
            <div style={{ height: "100%", width: maintRate + "%", borderRadius: 6, background: `linear-gradient(90deg,${C.amber},#d97706)`, transition: "width .5s" }} />
          </div>
        </>)}
      </div>

      {/* ✅ 카드형 수금 목록 — 가로 테이블 대신 카드로 교체, 월세/관리비 개별 처리 */}
      {rows.length === 0 ? (
        <EmptyState icon="💰" title="세입자가 없습니다" desc="물건을 먼저 등록하면 수금 현황을 확인할 수 있습니다" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map(({ t, p }) => {
            const rentSt = p?.status || "unpaid";
            const rentPaid = rentSt === "paid";
            const maintPaid = p?.maintenance_paid || false;
            const showMaint = hasMaintenance(t);
            const s = PAY_MAP[rentSt];

            return (
              <div key={t.id} style={{ background: "#fff", border: `1px solid ${!rentPaid ? "rgba(232,68,90,0.2)" : "#ebe9e3"}`, borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${!rentPaid ? C.rose : C.emerald}` }}>
                {/* 세입자 정보 헤더 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: (t.color || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: t.color || C.indigo, flexShrink: 0 }}>{t.name?.[0]}</div>
                    <div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{t.name}</p>
                        {t.biz && <span style={{ fontSize: 10, fontWeight: 700, color: C.indigo, background: C.indigo + "18", padding: "1px 6px", borderRadius: 4 }}>{t.biz}</span>}
                      </div>
                      <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 1 }}>
                        {t.addr}
                        {t.phone && <> · <a href={`tel:${t.phone}`} style={{ color: "#0fa573", textDecoration: "none", fontWeight: 600 }}>📞 {t.phone}</a></>}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.pType === "상가" ? C.amber : t.pType === "토지" ? "#0d9488" : C.indigo, background: t.pType === "상가" ? C.amber + "18" : t.pType === "토지" ? "#0d948818" : C.indigo + "18", padding: "2px 8px", borderRadius: 5, flexShrink: 0 }}>{t.sub}</span>
                </div>

                {/* ✅ 월세 + 관리비 개별 처리 행 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {/* 월세 행 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: rentPaid ? "rgba(15,165,115,0.04)" : "rgba(232,68,90,0.04)", borderRadius: 10, padding: "10px 13px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", minWidth: 30 }}>월세</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#1a2744" }}>{Number(t.rent).toLocaleString()}만원</span>
                      {p?.paid && <span style={{ fontSize: 10, color: "#8a8a9a" }}>{String(p.paid).slice(5)} 납부</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.c, background: s.bg, padding: "3px 10px", borderRadius: 20 }}>{s.label}</span>
                      {!rentPaid ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => { setPayModal(t.id); setPayDate(new Date().toISOString().slice(0,10)); }} style={{ padding: "5px 11px", borderRadius: 8, background: C.indigo + "20", border: `1px solid ${C.indigo}40`, color: "#1a2744", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>납부처리</button>
                          <button onClick={() => { setSmsTid(t.id); setSmsModal(true); }} style={{ padding: "5px 8px", borderRadius: 8, background: "rgba(15,165,115,0.1)", border: "1px solid rgba(15,165,115,0.3)", color: "#0fa573", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📱</button>
                          <button onClick={() => router.push("/dashboard/certified")} style={{ padding: "5px 8px", borderRadius: 8, background: C.rose + "12", border: `1px solid ${C.rose}30`, color: "#e8445a", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📨</button>
                        </div>
                      ) : (
                        <button onClick={() => markUnpaid(t.id)} style={{ padding: "5px 10px", borderRadius: 8, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>취소</button>
                      )}
                    </div>
                  </div>

                  {/* 관리비 행 — 해당 세입자만 표시 */}
                  {showMaint && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: maintPaid ? "rgba(15,165,115,0.04)" : "rgba(232,150,10,0.04)", borderRadius: 10, padding: "10px 13px" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", minWidth: 30 }}>관리비</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#1a2744" }}>{Number(t.maintenance).toLocaleString()}만원</span>
                        {p?.maintenance_paid_date && <span style={{ fontSize: 10, color: "#8a8a9a" }}>{String(p.maintenance_paid_date).slice(5)} 납부</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: maintPaid ? C.emerald : C.amber, background: maintPaid ? "rgba(15,165,115,0.1)" : "rgba(232,150,10,0.1)", padding: "3px 10px", borderRadius: 20 }}>
                          {maintPaid ? "✅ 납부완료" : "💰 미납"}
                        </span>
                        {maintPaid ? (
                          <button onClick={() => markMaintUnpaid(t.id)} style={{ padding: "5px 10px", borderRadius: 8, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>취소</button>
                        ) : (
                          <button onClick={() => { setMaintModal(t.id); setPayDate(new Date().toISOString().slice(0,10)); }} style={{ padding: "5px 11px", borderRadius: 8, background: C.amber + "20", border: `1px solid ${C.amber}40`, color: "#92400e", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>납부처리</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 월세 납부 모달 */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} width={380}>
        {payModal && (() => { const t = tenants.find((x) => x.id === payModal); if (!t) return null; return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>월세 납부 처리</h3>
            <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 18 }}>{t.name}님 {month}월 월세</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>납부 금액</p>
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "#f8f7f4", border: "1px solid #ebe9e3", fontSize: 16, fontWeight: 800, color: "#0fa573" }}>{Number(t.rent).toLocaleString()}만원</div>
              </div>
              <AuthInput label="납부일" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              <div style={{ display: "flex", gap: 9 }}>
                <button onClick={() => setPayModal(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
                <button onClick={() => markPaid(payModal)} disabled={saving} className="btn-primary" style={{ flex: 2, padding: "11px", borderRadius: 10, background: `linear-gradient(135deg,${C.emerald},#059669)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{saving ? "처리 중..." : "납부 확인"}</button>
              </div>
            </div>
          </div>
        ); })()}
      </Modal>

      {/* 관리비 납부 모달 */}
      <Modal open={!!maintModal} onClose={() => setMaintModal(null)} width={380}>
        {maintModal && (() => { const t = tenants.find((x) => x.id === maintModal); if (!t) return null; return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>🏢 관리비 납부 처리</h3>
            <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 18 }}>{t.name}님 {month}월 관리비</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>관리비 금액</p>
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "#f8f7f4", border: "1px solid #ebe9e3", fontSize: 16, fontWeight: 800, color: C.amber }}>{Number(t.maintenance).toLocaleString()}만원</div>
              </div>
              <AuthInput label="납부일" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              <div style={{ display: "flex", gap: 9 }}>
                <button onClick={() => setMaintModal(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
                <button onClick={() => markMaintPaid(maintModal)} disabled={saving} className="btn-primary" style={{ flex: 2, padding: "11px", borderRadius: 10, background: `linear-gradient(135deg,${C.amber},#d97706)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{saving ? "처리 중..." : "납부 확인"}</button>
              </div>
            </div>
          </div>
        ); })()}
      </Modal>

      {/* 입금문자 파싱 모달 */}
      <Modal open={smsModal} onClose={() => { setSmsModal(false); setSmsText(""); setSmsParsed(null); setSmsTid(null); }} width={440}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>📱 입금 문자 파싱</h3>
        <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 14 }}>카카오뱅크·토스·국민·신한·하나·우리 입금 알림을 붙여넣으면 금액과 날짜를 자동으로 인식합니다</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
          {["카카오뱅크", "토스", "국민은행", "신한은행", "하나은행", "우리은행", "NH농협", "기업은행"].map(b => (
            <span key={b} style={{ fontSize: 10, fontWeight: 600, color: "#5b4fcf", background: "rgba(91,79,207,0.08)", padding: "2px 8px", borderRadius: 20 }}>{b}</span>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>세입자 선택</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tenants.filter(t => t.status !== "공실").map((t) => (
              <button key={t.id} onClick={() => setSmsTid(t.id)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${smsTid === t.id ? C.emerald : "#ebe9e3"}`, background: smsTid === t.id ? "rgba(15,165,115,0.12)" : "transparent", color: smsTid === t.id ? "#0fa573" : "#8a8a9a" }}>
                {t.name} ({(t.rent||0).toLocaleString()}만)
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>입금 문자 내용</p>
          <textarea value={smsText} onChange={(e) => handleSmsChange(e.target.value)} placeholder={"예시:\n[카카오뱅크] 03/05 입금 1,100,000원 잔액 2,340,000원"} rows={4} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
        </div>
        {smsText && (
          <div style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 14, background: smsParsed ? "rgba(15,165,115,0.07)" : "rgba(232,68,90,0.07)", border: `1px solid ${smsParsed ? "rgba(15,165,115,0.25)" : "rgba(232,68,90,0.25)"}` }}>
            {smsParsed ? (
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <div><p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>인식된 금액</p><p style={{ fontSize: 18, fontWeight: 900, color: "#0fa573" }}>{Number(smsParsed.amt).toLocaleString()}만원</p></div>
                <div><p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>인식된 날짜</p><p style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>{smsParsed.paidDate}</p></div>
                {smsParsed.bank && <div><p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>은행</p><p style={{ fontSize: 13, fontWeight: 700, color: "#5b4fcf" }}>{smsParsed.bank}</p></div>}
              </div>
            ) : (
              <div><p style={{ fontSize: 12, color: "#e8445a", fontWeight: 700, marginBottom: 4 }}>❌ 금액을 인식하지 못했습니다</p><p style={{ fontSize: 11, color: "#8a8a9a" }}>금액이 "120만원" 또는 "1,200,000원" 형식으로 포함되어 있는지 확인하세요</p></div>
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={() => { setSmsModal(false); setSmsText(""); setSmsParsed(null); setSmsTid(null); }} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
          <button onClick={confirmSmsPay} disabled={saving || !smsParsed || !smsTid} className="btn-primary" style={{ flex: 2, padding: "11px", borderRadius: 10, background: smsParsed && smsTid ? `linear-gradient(135deg,${C.emerald},#059669)` : "#e0e0e0", border: "none", color: smsParsed && smsTid ? "#fff" : "#aaa", fontWeight: 700, fontSize: 13, cursor: smsParsed && smsTid ? "pointer" : "not-allowed" }}>
            {saving ? "처리 중..." : "납부 처리"}
          </button>
        </div>
      </Modal>

      {/* 미납 법적 대응 배너 */}
      {rows.some(({ p }) => !p || p.status === "unpaid") && (
        <div style={{ marginTop: 20, background: "linear-gradient(135deg,rgba(232,68,90,0.05),rgba(232,68,90,0.02))", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 16, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(232,68,90,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚖️</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 2 }}>미납 임차인 법적 대응이 필요하신가요?</p>
                <p style={{ fontSize: 11, color: "#8a8a9a" }}>내용증명 발송부터 명도소송까지 — 제휴 법무사가 도와드립니다</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => router.push("/dashboard/certified")} style={{ padding: "8px 14px", borderRadius: 10, background: "transparent", border: "1px solid rgba(232,68,90,0.4)", color: "#e8445a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>내용증명 작성</button>
              <button onClick={() => alert("🚧 법무사 연결 서비스 준비 중입니다.\n빠른 시일 내에 오픈할게요!")} style={{ padding: "8px 14px", borderRadius: 10, background: "#e8445a", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>법무사 연결 →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}