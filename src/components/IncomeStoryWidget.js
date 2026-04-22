"use client";

// 대시보드 히어로 위젯 — 이번 달 수금 스토리 + 연환산·트렌드
// 사용자가 대시보드 진입 시 즉시 "내 임대 수익 상황"을 파악하도록 설계
export default function IncomeStoryWidget({ tenants = [], payments = [], onNavigate }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const activeTenants = tenants.filter(t => t.status !== "공실");
  if (activeTenants.length === 0) return null;

  const expectedThisMonth = activeTenants.reduce((s, t) => s + (Number(t.rent) || 0), 0);
  const paidThisMonth = payments
    .filter(p => p.status === "paid" && (p.year || year) === year && p.month === month)
    .reduce((s, p) => s + (Number(p.amt ?? p.amount) || 0), 0);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  const paidLastMonth = payments
    .filter(p => p.status === "paid" && (p.year || prevYear) === prevYear && p.month === prevMonth)
    .reduce((s, p) => s + (Number(p.amt ?? p.amount) || 0), 0);

  const change = paidLastMonth > 0 ? Math.round(((paidThisMonth - paidLastMonth) / paidLastMonth) * 100) : null;
  const annualGross = expectedThisMonth * 12;
  const collectionRate = expectedThisMonth > 0 ? Math.round((paidThisMonth / expectedThisMonth) * 100) : 0;

  // 공실 수 & 손실
  const vacancies = tenants.filter(t => t.status === "공실");
  const vacancyLoss = vacancies.reduce((s, t) => s + (Number(t.rent) || 0), 0);

  // 납부일 남은 날짜 (평균)
  const today = now.getDate();
  const daysToCollect = activeTenants.filter(t => (t.pay_day || 5) >= today).length;

  const statusText = collectionRate >= 100 ? "🎉 이번 달 수금 완료" :
                     collectionRate >= 80  ? "👍 순조로운 수금 중" :
                     daysToCollect > 0     ? `⏳ ${daysToCollect}건 납부 예정` :
                                              "⚠️ 미납 확인 필요";

  return (
    <div style={{
      background: "linear-gradient(135deg,#1a2744 0%,#2d4270 55%,#5b4fcf 100%)",
      borderRadius: 18, padding: "22px 24px 20px", marginBottom: 14,
      color: "#fff", position: "relative", overflow: "hidden",
      boxShadow: "0 8px 32px rgba(26,39,68,0.18)",
    }}>
      {/* 배경 장식 */}
      <div aria-hidden style={{ position: "absolute", top: -50, right: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.08),transparent 70%)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", bottom: -30, left: -20, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(91,79,207,0.15),transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", opacity: .75, textTransform: "uppercase" }}>
            {year}년 {month}월 임대 수익
          </p>
          <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
            {statusText}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <p style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, letterSpacing: "-.5px" }}>
            {paidThisMonth.toLocaleString()}
          </p>
          <p style={{ fontSize: 15, opacity: .85, fontWeight: 700 }}>만원 수금</p>
          <p style={{ fontSize: 12, opacity: .55, marginLeft: 4 }}>
            / 예상 {expectedThisMonth.toLocaleString()}만원
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.15)", overflow: "hidden", marginBottom: 16 }}>
          <div style={{
            height: "100%", width: `${Math.min(collectionRate, 100)}%`,
            background: collectionRate >= 100 ? "#22c55e" : "linear-gradient(90deg,#0fa573,#22c55e)",
            transition: "width .6s", boxShadow: "0 0 12px rgba(34,197,94,0.4)",
          }} />
        </div>

        {/* 통계 3종 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          <div onClick={() => onNavigate?.("/dashboard/payments")} style={{ cursor: "pointer" }}>
            <p style={{ fontSize: 10, opacity: .6, marginBottom: 3 }}>수금률</p>
            <p style={{ fontSize: 17, fontWeight: 800 }}>{collectionRate}%</p>
          </div>
          <div onClick={() => onNavigate?.("/dashboard/tax")} style={{ cursor: "pointer" }}>
            <p style={{ fontSize: 10, opacity: .6, marginBottom: 3 }}>연 환산 (세전)</p>
            <p style={{ fontSize: 17, fontWeight: 800 }}>{(annualGross/10000).toFixed(1)}억</p>
          </div>
          <div>
            <p style={{ fontSize: 10, opacity: .6, marginBottom: 3 }}>전월 대비</p>
            <p style={{ fontSize: 17, fontWeight: 800, color: change === null ? "#fff" : change > 0 ? "#4ade80" : change < 0 ? "#fbbf24" : "#fff" }}>
              {change === null ? "—" : change === 0 ? "동일" : `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}%`}
            </p>
          </div>
        </div>

        {vacancies.length > 0 && (
          <div onClick={() => onNavigate?.("/dashboard/vacancy")}
            style={{ marginTop: 14, padding: "10px 13px", background: "rgba(251,191,36,0.15)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.25)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <p style={{ fontSize: 12, fontWeight: 700 }}>
              🚪 공실 {vacancies.length}실 — 이번 달 손실 <b style={{ color: "#fbbf24" }}>{vacancyLoss.toLocaleString()}만원</b>
            </p>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>해소 전략 →</span>
          </div>
        )}
      </div>
    </div>
  );
}
