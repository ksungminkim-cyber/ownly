"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { daysLeft } from "../../../../lib/constants";

const C = {
  navy:"#1a2744", amber:"#e8960a", rose:"#e8445a", emerald:"#0fa573",
  surface:"var(--surface)", border:"var(--border)", muted:"var(--text-muted)", faint:"var(--surface2)"
};
const KAKAO = "#FEE500";

const TAB_ITEMS = [
  { key: "unpaid",   label: "미납 알림",        icon: "⚠️" },
  { key: "upcoming", label: "납부일 예정 알림",  icon: "🔔" },
  { key: "expiring", label: "계약 만료 알림",    icon: "📅" },
];

function isOwnerMgt(t) {
  if (t.pType === "상가") return true;
  if (t.pType === "주거") return !["아파트","오피스텔"].includes(t.sub);
  return false;
}

export default function KakaoAlertPage() {
  const router = useRouter();
  const { tenants, payments } = useApp();
  const [tab, setTab] = useState("unpaid");
  const [sent, setSent] = useState({});
  const [sending, setSending] = useState({});
  const [error, setError] = useState({});
  const [preview, setPreview] = useState(null);

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  const paidTids = new Set(
    payments
      .filter(p => p.year === year && p.month === month && p.paid_date)
      .map(p => p.tid || p.tenant_id)
  );

  const unpaid   = tenants.filter(t => t.status === "미납" || !paidTids.has(t.id));
  const upcoming = tenants.filter(t => {
    if (paidTids.has(t.id)) return false;
    if (t.status === "미납") return false;
    const payDay = t.pay_day || 5;
    const daysUntilPay = payDay - today;
    return daysUntilPay >= 0 && daysUntilPay <= 3;
  });
  const expiring = tenants.filter(t => {
    const dl = daysLeft(t.end_date || t.end || "");
    return dl >= 0 && dl <= 60;
  });

  const counts = { unpaid: unpaid.length, upcoming: upcoming.length, expiring: expiring.length };
  const getList = () => tab === "unpaid" ? unpaid : tab === "upcoming" ? upcoming : expiring;

  const send = async (t) => {
    const key = tab + "_" + t.id;
    if (!t.phone) {
      setError(e => ({ ...e, [key]: "전화번호가 없습니다. 물건 관리에서 입력해주세요." }));
      return;
    }
    setSending(s => ({ ...s, [key]: true }));
    setError(e => ({ ...e, [key]: null }));
    try {
      const dl = daysLeft(t.end_date || t.end || "");
      const payDay = t.pay_day || 5;
      const daysUntilPay = payDay - today;
      const res = await fetch("/api/kakao/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab, tenant: { ...t, daysLeft: dl, daysUntilPay } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(e => ({ ...e, [key]: data.error || "발송 실패" }));
      } else {
        setSent(s => ({ ...s, [key]: true }));
        setPreview(null);
      }
    } catch (err) {
      setError(e => ({ ...e, [key]: err.message }));
    }
    setSending(s => ({ ...s, [key]: false }));
  };

  const getPreviewMsg = (t) => {
    const dl          = daysLeft(t.end_date || t.end || "");
    const rent        = (t.rent || 0).toLocaleString();
    const mgt         = (t.maintenance || 0).toLocaleString();
    const total       = ((t.rent || 0) + (t.maintenance || 0)).toLocaleString();
    const hasMgt      = isOwnerMgt(t) && (t.maintenance || 0) > 0;
    const addr        = t.addr || "해당 물건";
    const payDay      = t.pay_day || 5;
    const daysUntilPay = payDay - today;
    const todayStr    = now.toLocaleDateString("ko-KR");

    if (tab === "unpaid") {
      if (hasMgt) return `[온리 수금 알림]\n\n${t.name}님, 안녕하세요.\n온리(Ownly) 임대관리 서비스입니다.\n\n이번 달 월세 및 관리비가 미납 상태입니다.\n\n■ 임대 주소: ${addr}\n■ 월세: ${rent}만원\n■ 관리비: ${mgt}만원\n■ 합계: ${total}만원\n■ 납부 요청일: ${todayStr}까지`;
      return `[온리 수금 알림]\n\n${t.name}님, 안녕하세요.\n온리(Ownly) 임대관리 서비스입니다.\n\n이번 달 월세가 미납 상태입니다.\n\n■ 임대 주소: ${addr}\n■ 미납 금액: ${rent}만원\n■ 납부 요청일: ${todayStr}까지`;
    }
    if (tab === "upcoming") {
      const dStr = daysUntilPay === 0 ? "오늘" : `${daysUntilPay}일 후`;
      if (hasMgt) return `[온리 납부 안내]\n\n${t.name}님, 안녕하세요.\n온리(Ownly) 임대관리 서비스입니다.\n\n월세 및 관리비 납부일이 ${dStr}(${payDay}일)입니다.\n\n■ 임대 주소: ${addr}\n■ 월세: ${rent}만원\n■ 관리비: ${mgt}만원\n■ 합계: ${total}만원\n■ 납부일: 매월 ${payDay}일`;
      return `[온리 납부 안내]\n\n${t.name}님, 안녕하세요.\n온리(Ownly) 임대관리 서비스입니다.\n\n월세 납부일이 ${dStr}(${payDay}일)입니다.\n\n■ 임대 주소: ${addr}\n■ 납부 금액: ${rent}만원\n■ 납부일: 매월 ${payDay}일`;
    }
    return `[온리 계약 만료 안내]\n\n${t.name}님, 안녕하세요.\n온리(Ownly) 임대관리 서비스입니다.\n\n임대차 계약 만료일이 ${dl}일 남았습니다.\n\n■ 임대 주소: ${addr}\n■ 계약 만료일: ${t.end_date || t.end || "미정"}\n■ 잔여일: D-${dl}\n\n갱신 여부를 조속히 알려주시면 감사하겠습니다.`;
  };

  const list = getList();

  return (
    <div className="page-in page-padding" style={{ maxWidth: 720, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        ← 대시보드로
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${KAKAO},#e6ce00)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>💬</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.4px" }}>카카오 알림 발송</h1>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.amber, background: "rgba(232,150,10,0.12)", padding: "3px 8px", borderRadius: 6 }}>PRO</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>미납·납부예정·계약만료 세입자에게 카카오 알림톡을 발송합니다</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="tab-scroll" style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {TAB_ITEMS.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setPreview(null); }}
            style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 36, whiteSpace: "nowrap", flexShrink: 0, border: `1px solid ${tab === tb.key ? C.navy : "var(--border)"}`, background: tab === tb.key ? C.navy : "transparent", color: tab === tb.key ? "#fff" : C.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{tb.icon}</span><span>{tb.label}</span>
            {counts[tb.key] > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, background: tab === tb.key ? "rgba(255,255,255,0.2)" : C.rose + "20", color: tab === tb.key ? "#fff" : C.rose, padding: "1px 6px", borderRadius: 20 }}>{counts[tb.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* 세입자 목록 카드 */}
      <div style={{ background: C.surface, border: "1px solid var(--border)", borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(26,39,68,0.06)" }}>
        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>{tab === "unpaid" ? "🎉" : "✅"}</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
              {tab === "unpaid" ? "미납 건이 없어요!" : tab === "upcoming" ? "납부일 D-3 이내 세입자 없음" : "만료 임박 계약 없음"}
            </p>
            <p style={{ fontSize: 13, color: C.muted }}>
              {tab === "unpaid" ? "모든 세입자가 이번 달 납부 완료" : tab === "upcoming" ? "납부일 D-3 이내인 미납 세입자가 없습니다" : "60일 이내 만료 예정인 계약이 없습니다"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map(t => {
              const key          = tab + "_" + t.id;
              const isSent       = sent[key];
              const isSending    = sending[key];
              const errMsg       = error[key];
              const dl           = daysLeft(t.end_date || t.end || "");
              const hasMgt       = isOwnerMgt(t) && (t.maintenance || 0) > 0;
              const dispAmt      = (t.rent || 0) + (hasMgt ? (t.maintenance || 0) : 0);
              const payDay       = t.pay_day || 5;
              const daysUntilPay = payDay - today;
              const isPreviewOpen = preview?.id === t.id && preview?.tab === tab;

              return (
                <div key={t.id} style={{ border: `1px solid ${isSent ? C.emerald + "40" : "var(--border)"}`, borderRadius: 16, padding: 18, background: isSent ? "rgba(15,165,115,0.04)" : C.faint, transition: "all .3s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{t.name}</p>
                        {hasMgt && <span style={{ fontSize: 10, fontWeight: 700, color: "#5b4fcf", background: "rgba(91,79,207,0.1)", padding: "2px 6px", borderRadius: 5 }}>관리비포함</span>}
                        {!t.phone && <span style={{ fontSize: 10, fontWeight: 700, color: C.rose, background: "rgba(232,68,90,0.1)", padding: "2px 6px", borderRadius: 5 }}>번호없음</span>}
                        {tab === "upcoming" && <span style={{ fontSize: 10, fontWeight: 700, color: C.navy, background: "rgba(26,39,68,0.08)", padding: "2px 6px", borderRadius: 5 }}>납부일 {payDay}일</span>}
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.sub} · {t.addr}</p>
                      {t.phone && <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t.phone}</p>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 17, fontWeight: 900, color: tab === "expiring" ? C.amber : tab === "upcoming" ? C.navy : C.rose }}>
                        {tab === "expiring" ? `D-${dl}` : tab === "upcoming" ? (daysUntilPay === 0 ? "D-day" : `D-${daysUntilPay}`) : `${dispAmt.toLocaleString()}만원`}
                      </p>
                      <p style={{ fontSize: 11, color: C.muted }}>
                        {tab === "expiring" ? (t.end_date || t.end || "") : tab === "upcoming" ? "납부예정" : "미납"}
                      </p>
                    </div>
                  </div>

                  {errMsg && (
                    <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(232,68,90,0.08)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 8 }}>
                      <p style={{ fontSize: 12, color: C.rose, fontWeight: 600 }}>⚠️ {errMsg}</p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setPreview(isPreviewOpen ? null : { ...t, tab })}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: C.surface, border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 40 }}>
                      미리보기
                    </button>
                    <button onClick={() => send(t)} disabled={isSent || isSending || !t.phone}
                      style={{ flex: 2, padding: "10px 0", borderRadius: 10, minHeight: 40, background: isSent ? C.emerald : isSending ? "#94a3b8" : !t.phone ? "#e5e7eb" : KAKAO, color: isSent || isSending ? "#fff" : !t.phone ? "#9ca3af" : "#1a1a1a", border: "none", fontSize: 13, fontWeight: 800, cursor: isSent || !t.phone ? "not-allowed" : "pointer", transition: "all .2s" }}>
                      {isSent ? "✅ 발송 완료" : isSending ? "발송 중..." : !t.phone ? "전화번호 없음" : "💬 카카오 알림 발송"}
                    </button>
                  </div>

                  {/* ✅ 미리보기 — 카드 외부로 분리, 스크롤 가능하게 */}
                  {isPreviewOpen && (
                    <div style={{
                      marginTop: 12,
                      background: "#fff",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}>
                      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "#f8f7f4" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "1px" }}>알림 메시지 미리보기</p>
                      </div>
                      {/* ✅ 스크롤 가능한 미리보기 영역 */}
                      <div style={{ maxHeight: 260, overflowY: "auto", padding: "14px 16px", WebkitOverflowScrolling: "touch" }}>
                        <pre style={{
                          fontSize: 12,
                          color: "var(--text)",
                          lineHeight: 1.9,
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          margin: 0,
                        }}>
                          {getPreviewMsg(t)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 안내 박스 */}
      <div style={{ background: "rgba(254,229,0,0.08)", border: `1px solid ${KAKAO}40`, borderRadius: 14, padding: "14px 18px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#b8a000", marginBottom: 4 }}>💡 솔라피 알림톡 연동</p>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          알림톡 발송 실패 시 SMS로 대체 발송됩니다. 납부일 설정은 물건 관리 → 수정에서 할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
