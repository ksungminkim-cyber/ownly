"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { daysLeft } from "../../../../lib/constants";

const C = { navy:"#1a2744", amber:"#e8960a", rose:"#e8445a", emerald:"#0fa573", surface:"var(--surface)", border:"var(--border)", muted:"var(--text-muted)", faint:"var(--surface2)" };
const KAKAO = "#FEE500";

const TAB_ITEMS = [
  { key: "unpaid", label: "미납 알림", icon: "⚠️" },
  { key: "upcoming", label: "납부일 예정 알림", icon: "🔔" },
  { key: "expiring", label: "계약 만료 알림", icon: "📅" },
];

export default function KakaoAlertPage() {
  const router = useRouter();
  const { tenants } = useApp();
  const [tab, setTab]       = useState("unpaid");
  const [sent, setSent]     = useState({});
  const [preview, setPreview] = useState(null);

  const unpaid    = tenants.filter(t => t.status === "미납");
  const upcoming  = tenants.filter(t => {
    // 납부일이 5일인 세입자 — D-3, D-0 기준
    const today = new Date().getDate();
    return today >= 2 && today <= 5 && t.status !== "미납";
  });
  const expiring  = tenants.filter(t => {
    const dl = daysLeft(t.end_date || t.end || "");
    return dl > 0 && dl <= 30;
  });

  const getList = () => {
    if (tab === "unpaid")   return unpaid;
    if (tab === "upcoming") return upcoming;
    if (tab === "expiring") return expiring;
    return [];
  };

  const getMessageUnpaid = (t) =>
`[온리 수금 알림]
안녕하세요, ${t.name || "임차인"}님.

${t.addr || "해당 물건"}의 이번 달 월세가 아직 미납 상태입니다.

• 미납 금액: ${(t.rent || 0).toLocaleString()}만원
• 요청 기한: ${new Date().toLocaleDateString("ko-KR")}

빠른 시일 내 납부 부탁드립니다.
문의: inquiry@mclean21.com

온리(Ownly) 임대 관리`;

  const getMessageUpcoming = (t) =>
`[온리 납부 안내]
안녕하세요, ${t.name || "임차인"}님.

이번 달 월세 납부일이 다가왔습니다.

• 납부 금액: ${(t.rent || 0).toLocaleString()}만원
• 납부 예정일: 매월 5일

편리한 납부 부탁드립니다.
문의: inquiry@mclean21.com

온리(Ownly) 임대 관리`;

  const getMessageExpiring = (t) =>
`[온리 계약 만료 안내]
안녕하세요, ${t.name || "임차인"}님.

임대차 계약 만료일이 ${daysLeft(t.end_date || t.end || "")}일 남았습니다.

• 계약 만료일: ${t.end_date || t.end || "미정"}
• 갱신 여부를 조속히 알려주시면 감사하겠습니다.

문의: inquiry@mclean21.com

온리(Ownly) 임대 관리`;

  const getMessage = (t) => {
    if (tab === "unpaid")   return getMessageUnpaid(t);
    if (tab === "upcoming") return getMessageUpcoming(t);
    return getMessageExpiring(t);
  };

  const send = (t) => {
    setSent(s => ({ ...s, [tab + "_" + t.id]: true }));
    setPreview(null);
  };

  const list = getList();
  const counts = { unpaid: unpaid.length, upcoming: upcoming.length, expiring: expiring.length };

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
      <div className="tab-scroll" style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TAB_ITEMS.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setPreview(null); }}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 36,
              whiteSpace: "nowrap",
              border: `1px solid ${tab === tb.key ? C.navy : "var(--border)"}`,
              background: tab === tb.key ? C.navy : "transparent",
              color: tab === tb.key ? "#fff" : C.muted,
              display: "flex", alignItems: "center", gap: 6,
            }}>
            <span>{tb.icon}</span>
            <span>{tb.label}</span>
            {counts[tb.key] > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, background: tab === tb.key ? "rgba(255,255,255,0.2)" : C.rose + "20", color: tab === tb.key ? "#fff" : C.rose, padding: "1px 6px", borderRadius: 20 }}>{counts[tb.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div style={{ background: C.surface, border: `1px solid var(--border)`, borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(26,39,68,0.06)" }}>
        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>{tab === "unpaid" ? "🎉" : "✅"}</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
              {tab === "unpaid" ? "미납 건이 없어요!" : tab === "upcoming" ? "납부 예정 세입자 없음" : "만료 임박 계약 없음"}
            </p>
            <p style={{ fontSize: 13, color: C.muted }}>
              {tab === "unpaid" ? "모든 세입자가 정상 납부 중입니다" : ""}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map(t => {
              const sentKey = tab + "_" + t.id;
              const isSent = sent[sentKey];
              const dl = daysLeft(t.end_date || t.end || "");
              return (
                <div key={t.id} style={{
                  border: `1px solid ${isSent ? C.emerald + "40" : "var(--border)"}`,
                  borderRadius: 16, padding: 18,
                  background: isSent ? "rgba(15,165,115,0.04)" : C.faint, transition: "all .3s"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 3 }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: C.muted }}>{t.sub} · {t.addr}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 17, fontWeight: 900, color: tab === "expiring" ? C.amber : C.rose }}>
                        {tab === "expiring" ? `D-${dl}` : `${(t.rent || 0).toLocaleString()}만원`}
                      </p>
                      <p style={{ fontSize: 11, color: C.muted }}>
                        {tab === "expiring" ? "만료까지" : tab === "unpaid" ? "미납" : "납부예정"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setPreview(preview?.id === t.id && preview?.tab === tab ? null : { ...t, tab })}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: C.surface, border: `1px solid var(--border)`, color: "var(--text)", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 40 }}>
                      미리보기
                    </button>
                    <button onClick={() => send(t)} disabled={isSent}
                      style={{ flex: 2, padding: "10px 0", borderRadius: 10, minHeight: 40,
                        background: isSent ? C.emerald : KAKAO,
                        color: isSent ? "#fff" : "#1a1a1a",
                        border: "none", fontSize: 13, fontWeight: 800, cursor: isSent ? "not-allowed" : "pointer", transition: "all .2s" }}>
                      {isSent ? "✅ 발송 완료" : "💬 카카오 알림 발송"}
                    </button>
                  </div>
                  {preview?.id === t.id && preview?.tab === tab && (
                    <div style={{ marginTop: 12, background: C.surface, border: `1px solid var(--border)`, borderRadius: 12, padding: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, letterSpacing: "1px" }}>알림 메시지 미리보기</p>
                      <pre style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{getMessage(t)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: "rgba(254,229,0,0.08)", border: `1px solid ${KAKAO}40`, borderRadius: 14, padding: "14px 18px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#b8a000", marginBottom: 4 }}>💡 카카오 알림톡 연동 안내</p>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          실제 카카오 알림톡 발송을 위해서는 카카오 비즈니스 채널 등록이 필요합니다.<br/>
          현재는 미리보기 기능만 제공되며, 실제 발송 기능은 순차적으로 오픈됩니다.
        </p>
      </div>
    </div>
  );
}
