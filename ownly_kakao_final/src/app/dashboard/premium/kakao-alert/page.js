"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { daysLeft } from "../../../../lib/constants";

const C = {
  navy:"#1a2744", amber:"#e8960a", rose:"#e8445a", emerald:"#0fa573",
  surface:"var(--surface)", border:"var(--border)", muted:"var(--text-muted)", faint:"var(--surface2)"
};
const KAKAO = "#FEE500";

const TAB_ITEMS = [
  { key: "unpaid",   label: "미납 알림",       icon: "⚠️" },
  { key: "upcoming", label: "납부일 예정 알림", icon: "🔔" },
  { key: "expiring", label: "계약 만료 알림",   icon: "📅" },
];

function isOwnerMgt(t) {
  if (t.pType === "상가") return true;
  if (t.pType === "주거") return !["아파트","오피스텔"].includes(t.sub);
  return false;
}

// ✅ 카카오 알림톡 템플릿과 완전히 동일한 미리보기
function getPreviewMsg(t, tabKey) {
  const today = new Date();
  const todayStr = today.toLocaleDateString("ko-KR");
  const name    = t.name || "임차인";
  const addr    = t.addr || "해당 물건";
  const rent    = (t.rent || 0).toLocaleString();
  const mgt     = (t.maintenance || 0).toLocaleString();
  const total   = ((t.rent || 0) + (t.maintenance || 0)).toLocaleString();
  const payDay  = t.pay_day || 5;
  const dl      = daysLeft(t.end_date || t.end || "");
  const endDate = t.end_date || t.end || "미정";
  const hasMgt  = isOwnerMgt(t) && (t.maintenance || 0) > 0;

  // upcoming_with_mgt — 월세·관리비 납부 예정 안내
  if (tabKey === "upcoming" && hasMgt) {
    return {
      highlight: `${total}만원 납부 예정`,
      body:
`[온리 납부 안내]

${name}님, 안녕하세요.
온리(Ownly) 임대관리 서비스입니다.

월세 및 관리비 납부일이 ${payDay}일 남았습니다.
미리 준비해 두시면 감사하겠습니다.

📋 납부 정보
──────────────────
- 임대 주소: ${addr}
- 월세: ${rent}만원
- 관리비: ${mgt}만원
- 합계: ${total}만원
- 납부 예정일: 매월 ${payDay}일

※ 본 메시지는 임대인 요청으로
  온리(Ownly) 서비스를 통해 발송되었습니다.`
    };
  }

  // upcoming — 월세 납부 예정 안내
  if (tabKey === "upcoming") {
    return {
      highlight: `납부 예정일 D-${payDay}`,
      body:
`[온리 납부 안내]

${name}님, 안녕하세요.
온리(Ownly) 임대관리 서비스입니다.

월세 납부일이 ${payDay}일 남았습니다.
미리 준비해 두시면 감사하겠습니다.

📋 납부 정보
──────────────────
- 임대 주소: ${addr}
- 납부 금액: ${rent}만원
- 납부 예정일: 매월 ${payDay}일

※ 본 메시지는 임대인 요청으로
  온리(Ownly) 서비스를 통해 발송되었습니다.`
    };
  }

  // unpaid_with_mgt — 월세·관리비 미납 안내
  if (tabKey === "unpaid" && hasMgt) {
    return {
      highlight: `${total}만원 미납`,
      body:
`[온리 수금 알림]

${name}님, 안녕하세요.
온리(Ownly) 임대관리 서비스입니다.

이번 달 월세 및 관리비가 미납 상태입니다.

📋 납부 안내
──────────────────
- 임대 주소: ${addr}
- 월세: ${rent}만원
- 관리비: ${mgt}만원
- 합계: ${total}만원
- 납부 요청일: ${todayStr}까지

납부 완료 후 별도 연락이 없으면
임대인에게 직접 확인 부탁드립니다.

※ 본 메시지는 임대인 요청으로
  온리(Ownly) 서비스를 통해 발송되었습니다.`
    };
  }

  // unpaid — 미납 알림
  if (tabKey === "unpaid") {
    return {
      highlight: `${rent}만원 미납`,
      body:
`${name}님, 안녕하세요.
온리(Ownly) 임대관리 서비스입니다.

이번 달 월세가 미납 상태입니다.
빠른 처리를 부탁드립니다.

📋 납부 안내
──────────────────
- 임대 주소: ${addr}
- 미납 금액: ${rent}만원
- 납부 요청일: ${todayStr}

납부 완료 후 별도 연락이 없으면
임대인에게 직접 확인 부탁드립니다.

※ 본 메시지는 임대인 요청으로
  온리(Ownly) 서비스를 통해 발송되었습니다.`
    };
  }

  // expiring — 임대차 계약 만료 안내
  return {
    highlight: `계약 만료 D-${dl}`,
    body:
`[온리 계약 만료 안내]

${name}님, 안녕하세요.
온리(Ownly) 임대관리 서비스입니다.

임대차 계약 만료일이 ${dl}일 남았습니다.

📋 계약 정보
──────────────────
- 임대 주소: ${addr}
- 계약 만료일: ${endDate}
- 잔여일: ${dl}일

⚠️ 계약 갱신을 원하실 경우
만료일 1개월 전까지 임대인에게
연락 주시기 바랍니다.

※ 본 메시지는 임대인 요청으로
  온리(Ownly) 서비스를 통해 발송되었습니다.`
  };
}

// ✅ 전용 PreviewModal — body portal로 직접 렌더링, 잘림 없음
function PreviewModal({ open, onClose, tenant, tab, onSend, isSent, isSending }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!open || !mounted || !tenant) return null;

  const preview = getPreviewMsg(tenant, tab);

  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "rgba(26,39,68,0.45)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", boxSizing: "border-box",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 440,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 22,
        boxShadow: "0 40px 100px rgba(26,39,68,0.2)",
        display: "flex", flexDirection: "column",
        maxHeight: "calc(100vh - 40px)",
        overflow: "hidden",
      }}>
        {/* 헤더 */}
        <div style={{ padding: "20px 22px 14px", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "1px", marginBottom: 3 }}>알림톡 미리보기</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{tenant.name}</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${KAKAO},#e6ce00)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
          </div>
        </div>

        {/* ✅ 카카오 말풍선 스타일 미리보기 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px", WebkitOverflowScrolling: "touch" }}>
          {/* 강조 핵심문구 */}
          <div style={{ background: KAKAO, borderRadius: "12px 12px 0 0", padding: "10px 14px", marginBottom: 0 }}>
            <p style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", marginBottom: 2 }}>알림톡 도착</p>
            <p style={{ fontSize: 14, fontWeight: 900, color: "#1a1a1a" }}>{preview.highlight}</p>
          </div>
          {/* 본문 */}
          <div style={{ background: "#f8f7f4", borderRadius: "0 0 12px 12px", padding: "14px", border: "1px solid #ebe9e3", borderTop: "none" }}>
            <pre style={{
              fontSize: 12, color: "var(--text)", lineHeight: 1.8,
              whiteSpace: "pre-wrap", fontFamily: "inherit",
              wordBreak: "break-word", margin: 0,
            }}>
              {preview.body}
            </pre>
            {/* 온리 바로가기 버튼 */}
            <div style={{ marginTop: 14, padding: "10px", borderRadius: 8, background: "#fff", border: "1px solid #ebe9e3", textAlign: "center", cursor: "pointer" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>온리 바로가기</span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ padding: "14px 22px 20px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid var(--border)", color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>닫기</button>
            <button onClick={onSend} disabled={isSent || isSending || !tenant.phone}
              style={{ flex: 2, padding: "12px", borderRadius: 11, border: "none", fontWeight: 800, fontSize: 13, cursor: isSent || !tenant.phone ? "not-allowed" : "pointer", background: isSent ? C.emerald : KAKAO, color: isSent ? "#fff" : "#1a1a1a" }}>
              {isSent ? "✅ 발송 완료" : isSending ? "발송 중..." : "💬 이대로 발송하기"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function KakaoAlertPage() {
  const router = useRouter();
  const { tenants, payments } = useApp();
  const [tab, setTab] = useState("unpaid");
  const [sent, setSent] = useState({});
  const [sending, setSending] = useState({});
  const [error, setError] = useState({});
  const [previewModal, setPreviewModal] = useState(null);

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
    const d = (t.pay_day || 5) - today;
    return d >= 0 && d <= 3;
  });
  const expiring = tenants.filter(t => {
    const dl = daysLeft(t.end_date || t.end || "");
    return dl >= 0 && dl <= 60;
  });

  const counts = { unpaid: unpaid.length, upcoming: upcoming.length, expiring: expiring.length };
  const getList = () => tab === "unpaid" ? unpaid : tab === "upcoming" ? upcoming : expiring;

  const send = async (t, tabKey) => {
    const key = (tabKey || tab) + "_" + t.id;
    if (!t.phone) { setError(e => ({ ...e, [key]: "전화번호가 없습니다. 물건 관리에서 입력해주세요." })); return; }
    setSending(s => ({ ...s, [key]: true }));
    setError(e => ({ ...e, [key]: null }));
    try {
      const dl = daysLeft(t.end_date || t.end || "");
      const res = await fetch("/api/kakao/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab: tabKey || tab, tenant: { ...t, daysLeft: dl, daysUntilPay: (t.pay_day || 5) - today } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(e => ({ ...e, [key]: data.error || "발송 실패" })); }
      else { setSent(s => ({ ...s, [key]: true })); setPreviewModal(null); }
    } catch (err) { setError(e => ({ ...e, [key]: err.message })); }
    setSending(s => ({ ...s, [key]: false }));
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

      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {TAB_ITEMS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 36, whiteSpace: "nowrap", flexShrink: 0, border: `1px solid ${tab === tb.key ? C.navy : "var(--border)"}`, background: tab === tb.key ? C.navy : "transparent", color: tab === tb.key ? "#fff" : C.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{tb.icon}</span><span>{tb.label}</span>
            {counts[tb.key] > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, background: tab === tb.key ? "rgba(255,255,255,0.2)" : C.rose + "20", color: tab === tb.key ? "#fff" : C.rose, padding: "1px 6px", borderRadius: 20 }}>{counts[tb.key]}</span>
            )}
          </button>
        ))}
      </div>

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

              return (
                <div key={t.id} style={{ border: `1px solid ${isSent ? C.emerald + "40" : "var(--border)"}`, borderRadius: 16, padding: 18, background: isSent ? "rgba(15,165,115,0.04)" : C.faint }}>
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
                      <p style={{ fontSize: 11, color: C.muted }}>{tab === "expiring" ? (t.end_date || t.end || "") : tab === "upcoming" ? "납부예정" : "미납"}</p>
                    </div>
                  </div>

                  {errMsg && (
                    <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(232,68,90,0.08)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 8 }}>
                      <p style={{ fontSize: 12, color: C.rose, fontWeight: 600 }}>⚠️ {errMsg}</p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setPreviewModal({ tenant: t, tab })}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: C.surface, border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 40 }}>
                      미리보기
                    </button>
                    <button onClick={() => send(t)} disabled={isSent || isSending || !t.phone}
                      style={{ flex: 2, padding: "10px 0", borderRadius: 10, minHeight: 40, background: isSent ? C.emerald : isSending ? "#94a3b8" : !t.phone ? "#e5e7eb" : KAKAO, color: isSent || isSending ? "#fff" : !t.phone ? "#9ca3af" : "#1a1a1a", border: "none", fontSize: 13, fontWeight: 800, cursor: isSent || !t.phone ? "not-allowed" : "pointer" }}>
                      {isSent ? "✅ 발송 완료" : isSending ? "발송 중..." : !t.phone ? "전화번호 없음" : "💬 카카오 알림 발송"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: "rgba(254,229,0,0.08)", border: `1px solid ${KAKAO}40`, borderRadius: 14, padding: "14px 18px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#b8a000", marginBottom: 4 }}>💡 솔라피 알림톡 연동</p>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          알림톡 발송 실패 시 SMS로 대체 발송됩니다. 납부일 설정은 물건 관리 → 수정에서 할 수 있습니다.
        </p>
      </div>

      <PreviewModal
        open={!!previewModal}
        onClose={() => setPreviewModal(null)}
        tenant={previewModal?.tenant}
        tab={previewModal?.tab}
        onSend={() => send(previewModal.tenant, previewModal.tab)}
        isSent={!!(previewModal && sent[previewModal.tab + "_" + previewModal.tenant?.id])}
        isSending={!!(previewModal && sending[previewModal.tab + "_" + previewModal.tenant?.id])}
      />
    </div>
  );
}
