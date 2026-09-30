"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { SectionLabel, toast, EmptyState, Modal } from "../../../../components/shared";
import { daysLeft } from "../../../../lib/constants";

const FILTERS = [
  { key: 30,  label: "🚨 D-30 이내" },
  { key: 60,  label: "⚠️ D-60 이내" },
  { key: 120, label: "📅 D-120 이내" },
  { key: 180, label: "📋 D-180 이내" },
];

function getEnd(t) { return t.end_date || t.end || t.contract_end; }

function renderMessage(t, suggested) {
  const endDate = getEnd(t);
  const endStr = endDate ? new Date(endDate).toLocaleDateString("ko-KR") : "만료일";
  const currentRent = Number(t.rent) || 0;
  const depStr = t.dep ? `보증금 ${(t.dep / 10000).toFixed(1)}억원 · ` : "";
  return `[계약 갱신 관련 안내]\n${t.name || "임차인"}님께,\n\n안녕하세요, ${t.addr || "임대"} 임대인입니다.\n${endStr} 계약 만료를 앞두고 갱신 관련 말씀드리고자 연락드립니다.\n\n${depStr}주택임대차보호법상 계약 갱신 시 임대료 인상 상한은 5%입니다.\n이에 따라 다음 계약은 월 ${suggested.toLocaleString()}만원 (${suggested > currentRent ? "+" + (suggested - currentRent).toLocaleString() + "만원 인상" : "현재가 유지"})으로 제안드립니다.\n\n검토하시고 편하신 시간에 연락 주시면 감사하겠습니다.\n감사합니다.`;
}

export default function RenewalsPage() {
  const router = useRouter();
  const { tenants, loading, addContract, updateTenant } = useApp();
  const [filter, setFilter] = useState(120);
  const [selected, setSelected] = useState({});
  const [capPct, setCapPct] = useState(5);
  const [confirmT, setConfirmT] = useState(null); // 갱신 확정 모달 대상

  const expiring = useMemo(() => {
    return tenants
      .filter(t => t.status !== "공실")
      .map(t => {
        const end = getEnd(t);
        const dl = end ? daysLeft(end) : null;
        return { ...t, daysLeft: dl };
      })
      .filter(t => t.daysLeft !== null && t.daysLeft > 0 && t.daysLeft <= filter)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [tenants, filter]);

  const selectedList = expiring.filter(t => selected[t.id]);
  const allSelectedOnFilter = expiring.length > 0 && expiring.every(t => selected[t.id]);
  const toggleAll = () => {
    if (allSelectedOnFilter) {
      const next = { ...selected };
      expiring.forEach(t => delete next[t.id]);
      setSelected(next);
    } else {
      const next = { ...selected };
      expiring.forEach(t => { next[t.id] = true; });
      setSelected(next);
    }
  };

  const suggestedFor = (t) => Math.round(Number(t.rent) * (1 + capPct / 100));

  const copyBulk = () => {
    if (selectedList.length === 0) { toast("발송할 세입자를 선택하세요", "error"); return; }
    const msgs = selectedList.map((t) => `=== ${t.name || "세입자"} (${t.addr || ""}) ===\n` + renderMessage(t, suggestedFor(t)));
    const joined = msgs.join("\n\n\n");
    try {
      navigator.clipboard.writeText(joined).then(() => toast(`📋 ${selectedList.length}명 협상문이 복사됐습니다`));
    } catch {
      toast("클립보드 접근 실패", "error");
    }
  };

  const copySingle = (t) => {
    try {
      navigator.clipboard.writeText(renderMessage(t, suggestedFor(t))).then(() => toast(`📋 ${t.name}님 협상문 복사됨`));
    } catch {}
  };

  const totalCurrent = selectedList.reduce((s, t) => s + Number(t.rent), 0);
  const totalSuggested = selectedList.reduce((s, t) => s + suggestedFor(t), 0);
  const totalIncrease = totalSuggested - totalCurrent;
  const annualIncrease = totalIncrease * 12;

  if (loading) return <div className="page-in page-padding" style={{ textAlign: "center", padding: 40, color: "#8a8a9a" }}>불러오는 중...</div>;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 920 }}>
      <div style={{ marginBottom: 22 }}>
        <button onClick={() => router.push("/dashboard/tenants")} style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← 세입자 관리</button>
        <SectionLabel>BULK RENEWAL</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>갱신 일괄 관리</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>만료 임박 세입자 일괄 선택 + 협상문 자동 생성</p>
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setSelected({}); }}
            style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${filter === f.key ? "#1a2744" : "#ebe9e3"}`, background: filter === f.key ? "#1a2744" : "transparent", color: filter === f.key ? "#fff" : "#8a8a9a" }}>
            {f.label}
          </button>
        ))}
      </div>

      {expiring.length === 0 ? (
        <EmptyState icon="✨" title="만료 임박 세입자가 없습니다" desc="다른 D-일수 필터를 선택하거나 모든 세입자가 장기 계약 중입니다" />
      ) : (
        <>
          {/* 인상률 설정 */}
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>일괄 인상률 (갱신 계약 5% 상한)</p>
              <input type="range" min="0" max="5" step="0.5" value={capPct} onChange={(e) => setCapPct(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#5b4fcf" }} />
            </div>
            <div style={{ minWidth: 80, textAlign: "right" }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#5b4fcf", lineHeight: 1 }}>+{capPct}%</p>
              <p style={{ fontSize: 10, color: "#a0a0b0", marginTop: 3 }}>모든 세입자에 적용</p>
            </div>
          </div>

          {/* 선택 상단 바 */}
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "12px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={allSelectedOnFilter} onChange={toggleAll} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>
                전체 선택 ({selectedList.length}/{expiring.length})
              </span>
            </label>
            {selectedList.length > 0 && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#8a8a9a" }}>
                  월 <b style={{ color: "#5b4fcf" }}>+{totalIncrease.toLocaleString()}만원</b> · 연 <b style={{ color: "#5b4fcf" }}>+{annualIncrease.toLocaleString()}만원</b>
                </span>
                <button onClick={copyBulk}
                  style={{ padding: "8px 16px", borderRadius: 9, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  📋 {selectedList.length}명 협상문 복사
                </button>
              </div>
            )}
          </div>

          {/* 세입자 리스트 */}
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, overflow: "hidden" }}>
            {expiring.map((t, i) => {
              const dl = t.daysLeft;
              const urgent = dl <= 30;
              const warn = dl > 30 && dl <= 60;
              const sug = suggestedFor(t);
              const inc = sug - Number(t.rent);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < expiring.length - 1 ? "1px solid #f0efe9" : "none", background: selected[t.id] ? "rgba(91,79,207,0.04)" : "#fff" }}>
                  <input type="checkbox" checked={!!selected[t.id]} onChange={(e) => setSelected(s => ({ ...s, [t.id]: e.target.checked }))} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{t.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: urgent ? "#e8445a" : warn ? "#e8960a" : "#5b4fcf", background: urgent ? "rgba(232,68,90,0.1)" : warn ? "rgba(232,150,10,0.1)" : "rgba(91,79,207,0.08)", padding: "2px 8px", borderRadius: 4 }}>D-{dl}</span>
                      <span style={{ fontSize: 10, color: "#a0a0b0" }}>{getEnd(t)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#8a8a9a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.addr}</p>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 12, color: "#8a8a9a" }}>{Number(t.rent).toLocaleString()}만 → <b style={{ color: "#5b4fcf" }}>{sug.toLocaleString()}만</b></p>
                      {inc > 0 && <p style={{ fontSize: 10, color: "#0fa573", fontWeight: 700 }}>+{inc.toLocaleString()}만</p>}
                    </div>
                    <button onClick={() => setConfirmT(t)} className="btn btn-accent btn-sm" style={{ whiteSpace: "nowrap" }}>갱신 확정</button>
                    <button onClick={() => copySingle(t)}
                      style={{ padding: "6px 10px", borderRadius: 7, background: "rgba(91,79,207,0.08)", border: "1px solid rgba(91,79,207,0.2)", color: "#5b4fcf", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                      복사
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 18, padding: "14px 18px", background: "rgba(91,79,207,0.04)", border: "1px solid rgba(91,79,207,0.15)", borderRadius: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#5b4fcf", marginBottom: 4 }}>💡 사용 팁</p>
            <ul style={{ fontSize: 11, color: "#6a6a7a", lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
              <li>슬라이더로 일괄 인상률 조정 (0~5% 법적 상한)</li>
              <li>일괄 복사 후 카톡에 붙여넣으면 세입자별로 구분된 메시지 확인 가능</li>
              <li>개별 맞춤이 필요하면 각 행의 '복사' 버튼 사용</li>
              <li>시세 대비 상세 분석은 세입자 관리 → 개별 세입자 → 갱신 가이드 확인</li>
              <li>협상이 끝나면 &lsquo;갱신 확정&rsquo;으로 새 조건을 저장하세요 — 계약 이력에 갱신 기록이 남고 세입자 월세·보증금·만료일이 바뀝니다</li>
            </ul>
          </div>
        </>
      )}

      <Modal open={!!confirmT} onClose={() => setConfirmT(null)} width={460}>
        {confirmT && (
          <RenewalConfirm
            key={confirmT.id}
            tenant={confirmT}
            suggested={suggestedFor(confirmT)}
            onClose={() => setConfirmT(null)}
            onSave={async ({ contract, tenantPatch }) => {
              await addContract(contract);
              await updateTenant(confirmT.id, tenantPatch);
              setSelected(s => { const n = { ...s }; delete n[confirmT.id]; return n; });
              setConfirmT(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function addYears(dateStr, n) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  d.setFullYear(d.getFullYear() + n);
  return d.toISOString().slice(0, 10);
}
// 갱신 전후 인상률(%) — 세입자 상세 갱신 제안서와 같은 계산
function rateOf(prev, next) {
  return prev > 0 ? Number(((next - prev) / prev * 100).toFixed(1)) : 0;
}

function RenewalConfirm({ tenant, suggested, onClose, onSave }) {
  const prevRent = Number(tenant.rent) || 0;
  const prevDep = Number(tenant.dep) || 0;
  const end = getEnd(tenant) || "";
  const newStart = end ? addDays(end, 1) : "";
  const [rent, setRent] = useState(suggested);
  const [dep, setDep] = useState(prevDep);
  const [newEnd, setNewEnd] = useState(() => (end ? addYears(end, 2) : ""));
  const [rightUsed, setRightUsed] = useState(false);
  const [registered, setRegistered] = useState(() => !!tenant.registered_rental); /* 물건 관리에서 입력한 등록임대 여부가 기본값 */
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const rentRate = rateOf(prevRent, Number(rent) || 0);
  const depRate = rateOf(prevDep, Number(dep) || 0);
  const over5 = rentRate > 5 || depRate > 5;
  const capApplies = rightUsed || registered;

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, color: "var(--text)", background: "var(--surface2)" };
  const labelStyle = { fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginBottom: 6 };

  const submit = async () => {
    if (!newEnd) { toast("새 만료일을 입력하세요", "error"); return; }
    if (newStart && newEnd <= newStart) { toast("새 만료일은 갱신 시작일 이후여야 합니다", "error"); return; }
    setSaving(true);
    try {
      await onSave({
        contract: {
          tenant_id: tenant.id,
          tenant_name: tenant.name || "",
          type: "갱신",
          start_date: newStart || null,
          end_date: newEnd,
          rent: Number(rent) || 0,
          deposit: Number(dep) || 0,
          special_terms: memo,
          renewal_right_used: rightUsed,
          prev_rent: prevRent,
          prev_deposit: prevDep,
        },
        tenantPatch: { rent: Number(rent) || 0, dep: Number(dep) || 0, end_date: newEnd },
      });
      toast(`✅ ${tenant.name}님 갱신 조건이 저장됐습니다`);
    } catch (e) {
      toast(`저장 실패: ${e?.message || "알 수 없는 오류"}`, "error");
      console.error("[renewals.confirm]", e);
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>갱신 확정</h3>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>{tenant.name} · 현재 월세 {prevRent.toLocaleString()}만원 · 보증금 {prevDep.toLocaleString()}만원 · 만료 {end || "-"}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <p style={labelStyle}>새 월세 (만원)</p>
            <input type="number" min="0" value={rent} onChange={e => setRent(e.target.value)} style={inputStyle} />
            <p className="num" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{rentRate > 0 ? "+" : ""}{rentRate}%</p>
          </div>
          <div>
            <p style={labelStyle}>새 보증금 (만원)</p>
            <input type="number" min="0" value={dep} onChange={e => setDep(e.target.value)} style={inputStyle} />
            <p className="num" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{depRate > 0 ? "+" : ""}{depRate}%</p>
          </div>
        </div>
        <div>
          <p style={labelStyle}>새 만료일 {newStart ? `(갱신 시작 ${newStart})` : ""}</p>
          <input type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} style={inputStyle} />
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
          <input type="checkbox" checked={rightUsed} onChange={e => setRightUsed(e.target.checked)} />
          세입자가 계약갱신청구권을 사용함
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
          <input type="checkbox" checked={registered} onChange={e => setRegistered(e.target.checked)} />
          <span>등록임대주택(임대사업자 등록 물건) <span style={{ color: "var(--text-faint)" }}>— 물건 관리의 등록임대 설정을 불러옴 · 여기서 바꾼 값은 경고 판단용이며 저장되지 않음</span></span>
        </label>
        {over5 && capApplies && (
          <div className="chip chip-danger" style={{ borderRadius: 10, padding: "8px 12px", whiteSpace: "normal", lineHeight: 1.5, fontSize: 12 }}>⚠️ 인상률이 5%를 넘습니다 (월세 {rentRate}% · 보증금 {depRate}%). {rightUsed ? "계약갱신청구권 행사 시" : "등록임대주택은"} 5% 상한이 적용되어 분쟁·과태료 소지가 있습니다.</div>
        )}
        {over5 && !capApplies && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>인상률이 5%를 넘습니다. 청구권을 쓰지 않은 합의 갱신이고 등록임대가 아니라면 5% 상한이 바로 적용되지 않을 수 있지만, 개별 사정에 따라 다르므로 확인하세요.</p>
        )}
        <div>
          <p style={labelStyle}>특약·메모 (선택)</p>
          <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        </div>
        <p style={{ fontSize: 10, color: "var(--text-faint)", lineHeight: 1.5 }}>※ 인상률은 월세·보증금을 각각 비교한 단순 계산입니다. 보증금↔월세 전환이 섞이면 법정 전환율로 환산해야 하므로 참고용으로만 보세요 (2026-09 기준 법령 가정, 법률 자문 아님). 금액이 바뀐 갱신 계약은 전월세 신고 대상일 수 있습니다.</p>
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>취소</button>
          <button onClick={submit} disabled={saving} className="btn btn-accent" style={{ flex: 2 }}>{saving ? "저장 중..." : "갱신 확정 저장"}</button>
        </div>
      </div>
    </div>
  );
}
