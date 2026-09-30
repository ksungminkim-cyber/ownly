"use client";
import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";
import { SectionLabel, toast, Modal } from "../../../components/shared";
import { latestPair, worsenedItems, conditionLabel } from "../../../lib/inspections";

const C = {
  navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a",
  amber:"#e8960a", border:"#e8e6e0", muted:"#8a8a9a",
  faint:"#f8f7f4", surface:"#ffffff", accent:"#4f46e5",
};

// 미납 월세 후보 — payments 기준. 월별로 paid 기록이 있으면 완납, partial 이면 (월세 - 받은 금액), 기록이 없으면 월세 전액.
// 집계 시작: 계약 시작일과 ownly 등록일(created_at) 중 늦은 달 (등록 전 기간은 기록이 없어 미납으로 오판하므로 제외).
// 집계 끝: 이번 달(납부일이 지났을 때만)과 계약 종료월 중 이른 달. 월세는 현재 등록된 월세 기준.
function unpaidMonths(t, payments, now = new Date()) {
  const rent = Number(t.rent) || 0;
  if (rent <= 0) return [];
  const payDay = Number(t.pay_day ?? t.payment_day ?? 5);
  const starts = [t.start_date || t.start, t.created_at].filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d));
  if (starts.length === 0) return [];
  const start = new Date(Math.max(...starts));
  const first = new Date(start.getFullYear(), start.getMonth() + (start.getDate() > payDay ? 1 : 0), 1);
  let last = new Date(now.getFullYear(), now.getMonth() - (now.getDate() > payDay ? 0 : 1), 1);
  const endD = new Date(t.end_date || t.end || "");
  if (!isNaN(endD) && endD < last) last = new Date(endD.getFullYear(), endD.getMonth(), 1);
  const out = [];
  for (let d = first; d <= last; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const y = d.getFullYear(), m = d.getMonth() + 1;
    const recs = payments.filter(p => (p.tid ?? p.tenant_id) === t.id && Number(p.month) === m && Number(p.year || now.getFullYear()) === y);
    if (recs.some(p => p.status === "paid")) continue;
    const got = recs.filter(p => p.status === "partial").reduce((s, p) => s + (Number(p.amount ?? p.amt) || 0), 0);
    const due = Math.max(0, rent - got);
    if (due > 0) out.push({ key: `u-${y}-${m}`, label: `미납 월세 ${y}년 ${m}월${got > 0 ? ` (부분납부 ${got.toLocaleString()}만원 차감)` : ""}`, amount: due });
  }
  return out;
}

// ?tenant=<id> 로 세입자 선택, &from=inspection 이면 퇴실 점검에서 나빠진 항목을 공제 후보로 보여준다
export default function DepositReturnPage() {
  return (
    <Suspense fallback={<div className="page-in page-padding" style={{ color: C.muted, fontSize: 13 }}>불러오는 중...</div>}>
      <DepositReturnContent />
    </Suspense>
  );
}

function DepositReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const fromInspection = params?.get("from") === "inspection";
  const { tenants, repairs, payments, user } = useApp();
  const printRef = useRef(null);
  const [picked, setPicked] = useState({}); // 체크한 공제 후보 key
  const [saved, setSaved] = useState([]); // 저장된 정산서
  const [savedState, setSavedState] = useState("loading"); // loading | ok | error
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);

  const [selectedTenant, setSelectedTenant] = useState(() => params?.get("tenant") || "");
  const [insp, setInsp] = useState(null); // { tenantId, state: "ok"|"error", rows } — 퇴실 점검 후보용
  const [inspAmounts, setInspAmounts] = useState({}); // 후보 key → 사용자가 입력한 금액(만원)
  const [deductions, setDeductions] = useState([
    { id: 1, label: "미납 월세", amount: "" },
    { id: 2, label: "수리비 공제", amount: "" },
    { id: 3, label: "원상복구 비용", amount: "" },
  ]);
  const [memo, setMemo] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0,10));

  const sel = tenants.find(t => t.id === selectedTenant);
  const deposit = sel ? (sel.dep || sel.deposit || 0) : 0;
  const candidates = useMemo(() => {
    if (!sel) return { unpaid: [], repair: [] };
    const repair = (repairs || [])
      .filter(r => r.tenant_id === sel.id && (Number(r.cost) || 0) > 0)
      .map(r => ({ key: `r-${r.id}`, label: `수리비 ${r.category || ""}${r.date ? ` (${r.date})` : ""}`.trim(), amount: Number(r.cost) || 0, status: r.status }));
    return { unpaid: unpaidMonths(sel, payments || []), repair };
  }, [sel, payments, repairs]);
  const inspLoaded = fromInspection && insp?.tenantId === selectedTenant ? insp : null;
  const inspPair = useMemo(() => latestPair(inspLoaded?.rows || []), [inspLoaded]);
  const inspCandidates = (inspPair.moveIn && inspPair.moveOut ? worsenedItems(inspPair.moveIn, inspPair.moveOut) : []).map(r => ({
    key: `i-${r.area}`,
    label: `퇴실 점검 ${r.area} (${conditionLabel(r.before.condition)} → ${conditionLabel(r.after.condition)})`,
    amount: Math.max(0, Number(inspAmounts[`i-${r.area}`]) || 0),
    note: r.after.note,
  }));
  const pickedItems = [...candidates.unpaid, ...candidates.repair, ...inspCandidates].filter(c => picked[c.key]);
  const totalDeduct = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0) + pickedItems.reduce((s, c) => s + c.amount, 0);
  const returnAmount = Math.max(0, deposit - totalDeduct);
  const asOf = new Date().toISOString().slice(0, 10);

  // 저장된 정산서 불러오기 (deposit_settlements — 2026-09-28 마이그레이션)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("deposit_settlements").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) { console.error("[deposit-return.load]", error); setSavedState("error"); return; }
      setSaved(data || []);
      setSavedState("ok");
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // 퇴실 점검 기록 불러오기 (move_inspections — 2026-09-30 마이그레이션). from=inspection 일 때만
  useEffect(() => {
    if (!fromInspection || !user?.id || !selectedTenant) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("move_inspections").select("*").eq("user_id", user.id).eq("tenant_id", selectedTenant);
      if (cancelled) return;
      if (error) console.error("[deposit-return.inspections]", error);
      setInsp({ tenantId: selectedTenant, state: error ? "error" : "ok", rows: data || [] });
    })();
    return () => { cancelled = true; };
  }, [fromInspection, user?.id, selectedTenant]);

  const handleSave = async () => {
    if (!sel) { toast("세입자를 선택하세요", "error"); return; }
    if (!user?.id) { toast("로그인 후 저장할 수 있습니다", "error"); return; }
    setSaving(true);
    try {
      const items = [
        ...pickedItems.map(c => ({ label: c.label, amount: c.amount })),
        ...deductions.filter(d => Number(d.amount) > 0).map(d => ({ label: d.label || "공제", amount: Number(d.amount) || 0 })),
      ];
      const row = {
        user_id: user.id,
        tenant_id: sel.id,
        tenant_name: sel.name || "",
        deposit: Math.round(Number(deposit) || 0),
        deductions: items,
        refund: Math.round(returnAmount),
        memo: `반환 예정일 ${returnDate}${memo ? ` · ${memo}` : ""}`,
      };
      const { data, error } = await supabase.from("deposit_settlements").insert([row]).select().single();
      if (error) throw error;
      setSaved(s => [data, ...s]);
      toast("정산서를 저장했습니다");
    } catch (e) {
      toast(`저장 실패: ${e?.message || "알 수 없는 오류"}`, "error");
      console.error("[deposit-return.save]", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 정산서를 삭제할까요? 되돌릴 수 없습니다.")) return;
    const { error } = await supabase.from("deposit_settlements").delete().eq("id", id);
    if (error) { toast(`삭제 실패: ${error.message}`, "error"); return; }
    setSaved(s => s.filter(x => x.id !== id));
    setViewing(v => (v?.id === id ? null : v));
    toast("정산서를 삭제했습니다");
  };

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
        <select value={selectedTenant} onChange={e => { setSelectedTenant(e.target.value); setPicked({}); setInspAmounts({}); }}
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

      {/* 공제 후보 — 수금·수리 기록에서 자동으로 불러오되, 포함 여부는 임대인이 직접 체크 */}
      {sel && (
        <div className="surface-card" style={{ padding: "18px 20px", marginBottom: 16 }}>
          <p className="section-eyebrow" style={{ marginBottom: 4 }}>공제 후보 불러오기</p>
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>{asOf} 기준 · ownly 수금·수리 기록에서 찾은 항목입니다. 체크한 항목만 공제에 포함됩니다.</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>미납·부분납부 잔액</p>
          {candidates.unpaid.length === 0 ? (
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>기록상 미납 월세가 없습니다.</p>
          ) : candidates.unpaid.map(c => (
            <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: C.navy, cursor: "pointer" }}>
              <input type="checkbox" checked={!!picked[c.key]} onChange={e => setPicked(p => ({ ...p, [c.key]: e.target.checked }))} />
              <span style={{ flex: 1 }}>{c.label}</span>
              <span className="num" style={{ fontWeight: 700, color: C.rose }}>{c.amount.toLocaleString()}만원</span>
            </label>
          ))}
          <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "12px 0 6px" }}>이 세입자의 수리비 <span style={{ fontWeight: 500, color: C.muted }}>— 세입자 부담분인지는 직접 판단하세요</span></p>
          {candidates.repair.length === 0 ? (
            <p style={{ fontSize: 12, color: C.muted }}>등록된 수리비가 없습니다.</p>
          ) : candidates.repair.map(c => (
            <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: C.navy, cursor: "pointer" }}>
              <input type="checkbox" checked={!!picked[c.key]} onChange={e => setPicked(p => ({ ...p, [c.key]: e.target.checked }))} />
              <span style={{ flex: 1 }}>{c.label}{c.status ? <span className="chip" style={{ marginLeft: 6, padding: "1px 8px", fontSize: 10 }}>{c.status}</span> : null}</span>
              <span className="num" style={{ fontWeight: 700, color: C.rose }}>{c.amount.toLocaleString()}만원</span>
            </label>
          ))}
          {fromInspection && (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "12px 0 6px" }}>퇴실 점검에서 나빠진 항목 <span style={{ fontWeight: 500, color: C.muted }}>— 금액은 직접 입력하세요</span></p>
              {!inspLoaded ? (
                <p style={{ fontSize: 12, color: C.muted }}>점검 기록을 불러오는 중...</p>
              ) : inspLoaded.state === "error" ? (
                <p style={{ fontSize: 12, color: C.muted }}>점검 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
              ) : !(inspPair.moveIn && inspPair.moveOut) ? (
                <p style={{ fontSize: 12, color: C.muted }}>이 세입자의 입주·퇴실 점검 기록이 모두 있어야 비교할 수 있습니다.</p>
              ) : inspCandidates.length === 0 ? (
                <p style={{ fontSize: 12, color: C.muted }}>입주 때보다 상태가 나빠진 항목이 없습니다.</p>
              ) : inspCandidates.map(c => (
                <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: C.navy, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!picked[c.key]} onChange={e => setPicked(p => ({ ...p, [c.key]: e.target.checked }))} />
                  <span style={{ flex: 1 }}>{c.label}{c.note ? <span style={{ fontSize: 11, color: C.muted }}> · {c.note}</span> : null}</span>
                  <input type="number" min="0" value={inspAmounts[c.key] ?? ""} placeholder="0" onChange={e => setInspAmounts(a => ({ ...a, [c.key]: e.target.value }))}
                    style={{ width: 90, padding: "6px 8px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.rose, fontWeight: 700, background: C.faint, textAlign: "right" }} />
                  <span style={{ fontSize: 11, color: C.muted }}>만원</span>
                </label>
              ))}
            </>
          )}
          <p style={{ fontSize: 10, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>※ 미납액은 계약 시작일과 ownly 등록일 중 늦은 달부터 납부일이 지난 달까지, 수금 기록이 없거나 부분납부인 달을 현재 월세 기준으로 계산한 참고값입니다. 월세 변경 이력·현금 수령 등 기록되지 않은 사항은 반영되지 않으니 실제 공제 전 세입자와 확인하세요. 통상적인 사용에 따른 마모 수리비는 세입자에게 청구하기 어려울 수 있습니다.</p>
        </div>
      )}

      {/* 공제 항목 */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" }}>공제 항목</p>
          <button onClick={addDeduction} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "rgba(26,39,68,0.06)", border: `1px solid ${C.border}`, color: C.navy, cursor: "pointer" }}>+ 항목 추가</button>
        </div>
        {pickedItems.map(c => (
          <div key={c.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 12px", marginBottom: 8, background: C.faint, borderRadius: 10, fontSize: 13, color: C.navy }}>
            <span>{c.label} <span style={{ fontSize: 10, color: C.muted }}>(후보에서 선택)</span></span>
            <span className="num" style={{ fontWeight: 700, color: C.rose }}>{c.amount.toLocaleString()}만원</span>
          </div>
        ))}
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
      <button onClick={handleSave} disabled={!sel || saving || savedState === "error"} className="btn btn-soft" style={{ width: "100%", marginTop: 10, padding: "13px" }}>
        {saving ? "저장 중..." : "💾 정산서 저장"}
      </button>

      {/* 저장된 정산서 */}
      <div className="surface-card" style={{ padding: "18px 20px", marginTop: 24 }}>
        <p className="section-eyebrow" style={{ marginBottom: 10 }}>저장된 정산서</p>
        {savedState === "loading" && <p style={{ fontSize: 12, color: C.muted }}>불러오는 중...</p>}
        {savedState === "error" && <p style={{ fontSize: 12, color: C.muted }}>정산서 저장소를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요 (계산·인쇄는 그대로 이용할 수 있습니다).</p>}
        {savedState === "ok" && saved.length === 0 && <p style={{ fontSize: 12, color: C.muted }}>아직 저장한 정산서가 없습니다.</p>}
        {savedState === "ok" && saved.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{s.tenant_name || "(세입자 삭제됨)"}</p>
              <p style={{ fontSize: 11, color: C.muted }}>{String(s.created_at || "").slice(0, 10)} 작성 · 보증금 {(s.deposit || 0).toLocaleString()}만원 → 반환 <b className="num" style={{ color: C.navy }}>{(s.refund || 0).toLocaleString()}만원</b></p>
            </div>
            <button onClick={() => setViewing(s)} className="btn btn-ghost btn-sm">열람</button>
            <button onClick={() => handleDelete(s.id)} className="btn btn-ghost btn-sm" style={{ color: C.rose }}>삭제</button>
          </div>
        ))}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} width={460}>
        {viewing && (
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 4 }}>보증금 반환 정산서</h3>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{viewing.tenant_name || "(세입자 삭제됨)"} · {String(viewing.created_at || "").slice(0, 10)} 작성</p>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}><span style={{ color: C.muted }}>보증금</span><span className="num" style={{ fontWeight: 700 }}>{(viewing.deposit || 0).toLocaleString()}만원</span></div>
            {(Array.isArray(viewing.deductions) ? viewing.deductions : []).map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}><span style={{ color: C.navy }}>{d.label || "공제"}</span><span className="num" style={{ fontWeight: 700, color: C.rose }}>-{(Number(d.amount) || 0).toLocaleString()}만원</span></div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 15, fontWeight: 800, color: C.navy }}><span>실 반환 보증금</span><span className="num">{(viewing.refund || 0).toLocaleString()}만원</span></div>
            {viewing.memo && <p style={{ fontSize: 12, color: C.muted }}>{viewing.memo}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => handleDelete(viewing.id)} className="btn btn-ghost" style={{ flex: 1, color: C.rose }}>삭제</button>
              <button onClick={() => setViewing(null)} className="btn btn-fill" style={{ flex: 2 }}>닫기</button>
            </div>
          </div>
        )}
      </Modal>

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
                {pickedItems.map(c => (
                  <tr key={c.key} style={{ borderBottom: "1px solid #e8e6e0" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#1a2744" }}>{c.label}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: "#e8445a", fontWeight: 700, textAlign: "right" }}>-{c.amount.toLocaleString()}만원</td>
                  </tr>
                ))}
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
