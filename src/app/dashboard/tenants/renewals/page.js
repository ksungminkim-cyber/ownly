"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { SectionLabel, toast, EmptyState } from "../../../../components/shared";
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
  const { tenants, loading } = useApp();
  const [filter, setFilter] = useState(120);
  const [selected, setSelected] = useState({});
  const [capPct, setCapPct] = useState(5);

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
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
