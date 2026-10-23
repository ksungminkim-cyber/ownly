"use client";
import { CountUp } from "./Trendy";

// 대시보드 첫 블록 — 이번 달 수금을 한 숫자와 수금률 링으로 보여준다.
// 그라데이션 박스·이모지 없이 흰 바탕에 큰 숫자(세리프)와 가는 선만 쓴다.
const RING_R = 34;
const RING_C = 2 * Math.PI * RING_R; // ≈ 213.6 (globals.css ring-in 키프레임과 동일)

export default function IncomeStoryWidget({ tenants = [], payments = [], onNavigate }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const activeTenants = tenants.filter((t) => t.status !== "공실");
  if (activeTenants.length === 0) return null;

  const expectedThisMonth = activeTenants.reduce((s, t) => s + (Number(t.rent) || 0), 0);
  const paidThisMonth = payments
    .filter((p) => (p.status === "paid" || p.status === "partial") && (p.year || year) === year && p.month === month)
    .reduce((s, p) => s + (Number(p.amt ?? p.amount) || 0), 0);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const paidLastMonth = payments
    .filter((p) => (p.status === "paid" || p.status === "partial") && (p.year || prevYear) === prevYear && p.month === prevMonth)
    .reduce((s, p) => s + (Number(p.amt ?? p.amount) || 0), 0);

  const change = paidLastMonth > 0 ? Math.round(((paidThisMonth - paidLastMonth) / paidLastMonth) * 100) : null;
  const annualGross = expectedThisMonth * 12;
  const collectionRate = expectedThisMonth > 0 ? Math.round((paidThisMonth / expectedThisMonth) * 100) : 0;
  const pct = Math.min(collectionRate, 100);

  const vacancies = tenants.filter((t) => t.status === "공실");
  const vacancyLoss = vacancies.reduce((s, t) => s + (Number(t.rent) || 0), 0);

  const today = now.getDate();
  const daysToCollect = activeTenants.filter((t) => (t.pay_day || 5) >= today).length;

  const status =
    collectionRate >= 100
      ? { text: "이번 달 수금이 끝났습니다", color: "#0fa573" }
      : collectionRate >= 80
        ? { text: "순조롭게 들어오고 있습니다", color: "#0fa573" }
        : daysToCollect > 0
          ? { text: `${daysToCollect}건이 납부일 전입니다`, color: "var(--text-muted)" }
          : { text: "미납 확인이 필요합니다", color: "#e8445a" };

  const ringColor = pct >= 100 ? "#0fa573" : "#1a2744";

  return (
    <section className="surface-card" style={{ padding: "22px 24px 18px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px" }}>
            {year}년 {month}월 수금
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span className="display-num" style={{ fontSize: 46, color: "var(--text)" }}>
              <CountUp value={paidThisMonth} duration={900} />
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>만원</span>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>예상 {expectedThisMonth.toLocaleString()}만원 중</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: status.color, margin: "10px 0 0" }}>{status.text}</p>
        </div>

        <div
          onClick={() => onNavigate?.("/dashboard/payments")}
          role="button"
          tabIndex={0}
          aria-label={`수금률 ${collectionRate}%`}
          style={{ position: "relative", width: 92, height: 92, flexShrink: 0, cursor: "pointer" }}
        >
          <svg viewBox="0 0 92 92" width="92" height="92" style={{ transform: "rotate(-90deg)", display: "block" }}>
            <circle cx="46" cy="46" r={RING_R} fill="none" strokeWidth="8" stroke="var(--surface3)" />
            <circle
              className="ring-fill"
              cx="46"
              cy="46"
              r={RING_R}
              fill="none"
              strokeWidth="8"
              stroke={ringColor}
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - pct / 100)}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            <span className="num" style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {collectionRate}%
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, marginTop: 3 }}>수금률</span>
          </div>
        </div>
      </div>

      <div
        className="hairline"
        style={{ marginTop: 16, paddingTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}
      >
        <div onClick={() => onNavigate?.("/dashboard/tax")} style={{ cursor: "pointer", minWidth: 0 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>연 환산 (세전)</p>
          <p className="num" style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
            {(annualGross / 10000).toFixed(1)}억
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>전월 대비</p>
          <p
            className="num"
            style={{ fontSize: 16, fontWeight: 800, color: change === null ? "var(--text)" : change > 0 ? "#0fa573" : change < 0 ? "#e8960a" : "var(--text)" }}
          >
            {change === null ? "—" : change === 0 ? "동일" : `${change > 0 ? "+" : "−"}${Math.abs(change)}%`}
          </p>
        </div>
        <div onClick={() => onNavigate?.("/dashboard/vacancy")} style={{ cursor: vacancies.length ? "pointer" : "default", minWidth: 0 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>공실</p>
          <p className="num" style={{ fontSize: 16, fontWeight: 800, color: vacancies.length ? "#e8445a" : "var(--text)" }}>
            {vacancies.length ? `${vacancies.length}실 · −${vacancyLoss.toLocaleString()}만` : "없음"}
          </p>
        </div>
      </div>
    </section>
  );
}
