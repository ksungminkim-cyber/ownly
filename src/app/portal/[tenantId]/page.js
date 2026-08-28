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
      {/* 헤더 — 그라데이션 + 글래스 카드 느낌 */}
      <div style={{ background: "var(--grad-primary)", color: "#fff", padding: "32px 20px 28px", position: "relative", overflow: "hidden" }}>
        {/* 배경 원형 글로우 */}
        <div aria-hidden style={{ position: "absolute", top: -80, right: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,108,255,0.35), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 520, margin: "0 auto", position: "relative" }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2px", opacity: .8, marginBottom: 8 }}>ONWLY · 세입자 포털</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6, letterSpacing: "-0.5px" }}>{t.name}님, 반갑습니다</h1>
          <p style={{ fontSize: 13, opacity: .85, lineHeight: 1.6 }}>{t.address}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.18)", padding: "5px 11px", borderRadius: 999, backdropFilter: "blur(8px)" }}>{t.sub || t.pType}</span>
            {t.biz && <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.18)", padding: "5px 11px", borderRadius: 999, backdropFilter: "blur(8px)" }}>{t.biz}</span>}
            {daysLeft !== null && daysLeft > 0 && daysLeft <= 90 && <span style={{ fontSize: 11, fontWeight: 800, background: "rgba(232,150,10,0.28)", color: "#ffd88a", padding: "5px 11px", borderRadius: 999 }}>📅 만료 D-{daysLeft}</span>}
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
          ].map(tt => (
            <button key={tt.k} onClick={() => setTab(tt.k)} aria-current={tab === tt.k}
              style={{ padding: "14px 12px", fontSize: 13, fontWeight: tab === tt.k ? 800 : 600, cursor: "pointer", border: "none", background: "transparent", color: tab === tt.k ? "var(--accent)" : "var(--text-muted)", borderBottom: tab === tt.k ? "3px solid var(--accent)" : "3px solid transparent", flex: 1, transition: "all var(--t-fast) var(--ease)" }}>
              {tt.label}
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

        {tab === "payments" && (() => {
          const paidCount = history.filter(h => h.p?.status === "paid").length;
          const rate = history.length > 0 ? Math.round((paidCount / history.length) * 100) : 0;
          const nowD = new Date();
          const curMonthPay = payments.find(p => p.year === nowD.getFullYear() && p.month === nowD.getMonth() + 1);
          const curPaid = curMonthPay?.status === "paid";
          const totalDue = (t.rent || 0) + (t.maintenance || 0);
          return (
            <>
              {/* 이번 달 청구서 — 임대인이 링크만 공유해도 고지서 역할 */}
              {totalDue > 0 && (
                <div className="surface-card" style={{ padding: "16px 18px", marginBottom: 12, background: curPaid ? "rgba(15,165,115,0.05)" : "#fff", border: `1.5px solid ${curPaid ? "rgba(15,165,115,0.3)" : "var(--border)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>🧾 {nowD.getMonth() + 1}월 청구서</p>
                      <p className="num" style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: 0 }}>{totalDue.toLocaleString()}만원</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "3px 0 0" }}>
                        월세 {(t.rent || 0).toLocaleString()}만원{(t.maintenance || 0) > 0 && ` + 관리비 ${t.maintenance.toLocaleString()}만원`} · 납부일 매월 {t.pay_day}일
                      </p>
                    </div>
                    <span className={`chip ${curPaid ? "chip-success" : "chip-warn"}`} style={{ fontSize: 12 }}>
                      {curPaid ? "✓ 납부 완료" : "납부 대기"}
                    </span>
                  </div>
                </div>
              )}
              {/* 납부 요약 카드 */}
              {history.length > 0 && (
                <div className="surface-card" style={{ padding: "16px 18px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>최근 {history.length}개월 납부율</p>
                    <p className="num" style={{ fontSize: 24, fontWeight: 900, color: rate >= 90 ? "#0fa573" : rate >= 70 ? "#e8960a" : "#e8445a" }}>{rate}%</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="chip chip-success" style={{ fontSize: 11 }}>{paidCount}건 납부</span>
                    {history.length - paidCount > 0 && <span className="chip chip-danger" style={{ fontSize: 11, marginLeft: 4 }}>{history.length - paidCount}건 미납</span>}
                  </div>
                </div>
              )}

              <button onClick={() => router.push(`/portal/${tenantId}/receipt`)} className="btn btn-soft" style={{ width: "100%", marginBottom: 12 }}>
                🧾 납부확인서 발급 — 연말정산 월세 세액공제용
              </button>

              <div className="surface-card" style={{ overflow: "hidden", padding: 0 }}>
                {history.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <p style={{ fontSize: 36, marginBottom: 10 }}>💰</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>납부 기록이 없습니다</p>
                  </div>
                ) : history.map((row, i) => {
                  const paid = row.p?.status === "paid";
                  return (
                    <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none", transition: "background var(--t-fast) var(--ease)" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{row.y}년 {row.m}월</p>
                        {row.p?.paid_date && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{row.p.paid_date} 납부</p>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="num" style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{(row.p?.amount || t.rent || 0).toLocaleString()}만원</span>
                        <span className={`chip ${paid ? "chip-success" : "chip-danger"}`} style={{ fontSize: 10 }}>{paid ? "✓ 납부" : "미납"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {tab === "repairs" && (
          <>
            <button onClick={() => router.push(`/request/${tenantId}`)} className="btn btn-fill btn-lg" style={{ width: "100%", marginBottom: 14 }}>
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

        <div style={{ marginTop: 24, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 18px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", marginBottom: 4 }}>🏠 이 계약은 온리(Ownly)로 관리되고 있습니다</p>
          <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.7, marginBottom: 12 }}>납부 이력·수리 요청·계약 정보가 한곳에 기록됩니다.<br/>혹시 임대 중인 부동산이 있으시다면 무료로 시작해보세요.</p>
          <a href="/login?mode=signup" style={{ display: "inline-block", padding: "9px 20px", borderRadius: 10, background: "#1a2744", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>임대인용 온리 무료 시작 →</a>
          <p style={{ fontSize: 10, color: "#c0c0cc", marginTop: 10 }}><a href="https://www.ownly.kr" style={{ color: "#a0a0b0", textDecoration: "none" }}>ownly.kr</a></p>
        </div>
      </div>
    </div>
  );
}
