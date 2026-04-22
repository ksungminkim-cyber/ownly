"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const STATUS_CONFIG = {
  open:        { label: "접수",   color: "#e8445a", bg: "rgba(232,68,90,0.1)" },
  in_progress: { label: "처리 중", color: "#e8960a", bg: "rgba(232,150,10,0.1)" },
  done:        { label: "완료",   color: "#0fa573", bg: "rgba(15,165,115,0.1)" },
};

const CAT_ICON = {
  "도배/장판": "🎨", "배관/수도": "🔧", "전기": "⚡", "에어컨/냉난방": "❄️",
  "창문/문": "🚪", "주방": "🍳", "욕실": "🚿", "외벽/지붕": "🏠", "기타": "🔨",
};

function monthKey(y, m) { return `${y}-${String(m).padStart(2, "0")}`; }

function buildPaymentHistory(payments, startDate) {
  const now = new Date();
  const months = [];
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const cur = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cur >= start && months.length < 12) {
    const y = cur.getFullYear(), m = cur.getMonth() + 1;
    const p = payments.find(p => p.year === y && p.month === m);
    months.push({ y, m, p, key: monthKey(y, m) });
    cur.setMonth(cur.getMonth() - 1);
  }
  return months;
}

export default function TenantPortalPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("info");

  useEffect(() => {
    fetch(`/api/portal/${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7f4", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <p style={{ color: "#8a8a9a" }}>불러오는 중...</p>
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7f4", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 6 }}>페이지를 찾을 수 없습니다</h2>
        <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.7 }}>임대인에게 포털 링크를 다시 요청해주세요.</p>
      </div>
    </div>
  );

  const t = data.tenant;
  const payments = data.payments || [];
  const repairs = data.repairs || [];
  const history = buildPaymentHistory(payments, t.start_date);
  const daysLeft = t.contract_end ? Math.ceil((new Date(t.contract_end) - new Date()) / 86400000) : null;
  const openRepairs = repairs.filter(r => r.status === "open" || r.status === "in_progress").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", color: "#1a2744" }}>
      {/* 헤더 */}
      <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", padding: "28px 20px 24px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", opacity: .7, marginBottom: 6 }}>ONWLY 세입자 포털</p>
          <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{t.name}님</h1>
          <p style={{ fontSize: 13, opacity: .85, lineHeight: 1.5 }}>{t.address}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 6 }}>{t.sub || t.pType}</span>
            {t.biz && <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 6 }}>{t.biz}</span>}
            {daysLeft !== null && daysLeft > 0 && daysLeft <= 90 && <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(232,150,10,0.25)", color: "#ffd88a", padding: "4px 10px", borderRadius: 6 }}>만료 D-{daysLeft}</span>}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ebe9e3", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 4, padding: "0 20px" }}>
          {[
            { k: "info", label: "📋 계약 정보" },
            { k: "payments", label: "💰 납부 이력" },
            { k: "repairs", label: openRepairs > 0 ? `🔧 수리 (${openRepairs})` : "🔧 수리" },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{ padding: "14px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: tab === t.k ? "#1a2744" : "#8a8a9a", borderBottom: tab === t.k ? "2.5px solid #1a2744" : "2.5px solid transparent", flex: 1 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 80px" }}>
        {tab === "info" && (
          <>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ebe9e3", marginBottom: 14 }}>
              {[
                { label: "보증금", value: (t.deposit || 0).toLocaleString() + "만원" },
                { label: "월세", value: (t.rent || 0).toLocaleString() + "만원" },
                ...(t.maintenance > 0 ? [{ label: "관리비", value: t.maintenance.toLocaleString() + "만원" }] : []),
                { label: "납부일", value: `매월 ${t.pay_day}일` },
                { label: "계약 시작", value: t.start_date || "—" },
                { label: "계약 종료", value: t.contract_end ? `${t.contract_end}${daysLeft !== null ? ` (D-${daysLeft})` : ""}` : "—" },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid #f0efe9" : "none" }}>
                  <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 700 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(26,39,68,0.04)", borderRadius: 12, padding: "14px 16px", fontSize: 12, color: "#6a6a7a", lineHeight: 1.7 }}>
              💡 계약 조건 변경·갱신 관련 문의는 임대인에게 직접 연락해주세요.
            </div>
          </>
        )}

        {tab === "payments" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ebe9e3", overflow: "hidden" }}>
            {history.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#8a8a9a" }}>납부 기록이 없습니다</div>
            ) : history.map((row, i) => {
              const paid = row.p?.status === "paid";
              return (
                <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: i < history.length - 1 ? "1px solid #f0efe9" : "none" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{row.y}년 {row.m}월</p>
                    {row.p?.paid_date && <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{row.p.paid_date} 납부</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>{(row.p?.amount || t.rent || 0).toLocaleString()}만원</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: paid ? "#0fa573" : "#e8445a", background: paid ? "rgba(15,165,115,0.1)" : "rgba(232,68,90,0.1)", padding: "3px 10px", borderRadius: 20 }}>{paid ? "✓ 납부" : "미납"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "repairs" && (
          <>
            <button onClick={() => router.push(`/request/${tenantId}`)}
              style={{ width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              🔧 새 수리 요청 접수
            </button>
            {repairs.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ebe9e3", padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔨</div>
                <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.6 }}>등록된 수리 요청이 없습니다</p>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ebe9e3", overflow: "hidden" }}>
                {repairs.map((r, i) => {
                  const st = STATUS_CONFIG[r.status || "done"];
                  return (
                    <div key={r.id} style={{ padding: "14px 18px", borderBottom: i < repairs.length - 1 ? "1px solid #f0efe9" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14 }}>{CAT_ICON[r.category] || "🔨"}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{r.category}</span>
                          {r.priority === "urgent" && <span style={{ fontSize: 9, fontWeight: 800, color: "#e8445a", background: "rgba(232,68,90,0.1)", padding: "2px 7px", borderRadius: 4 }}>🚨 긴급</span>}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: st.color, background: st.bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{st.label}</span>
                      </div>
                      {r.memo && <p style={{ fontSize: 12, color: "#6a6a7a", lineHeight: 1.6, marginBottom: 4 }}>{r.memo}</p>}
                      <p style={{ fontSize: 11, color: "#a0a0b0" }}>
                        {r.date || "—"}
                        {r.completed_at && ` · 완료 ${r.completed_at.slice(0, 10)}`}
                      </p>
                      {r.response_memo && (
                        <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(15,165,115,0.06)", border: "1px solid rgba(15,165,115,0.15)", borderRadius: 8, fontSize: 11, color: "#0fa573", lineHeight: 1.6 }}>
                          📝 임대인 답변: {r.response_memo}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#a0a0b0", lineHeight: 1.6 }}>
          온리(Ownly) 임대 자산 관리 플랫폼 · <a href="https://www.ownly.kr" style={{ color: "#5b4fcf", fontWeight: 700, textDecoration: "none" }}>ownly.kr</a>
        </div>
      </div>
    </div>
  );
}
