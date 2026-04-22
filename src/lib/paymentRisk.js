// 수금 위험 예측 — 과거 납부 패턴 기반 이번 달 미납 위험도 계산
// 순수 함수, 클라이언트/서버 공용

const HISTORY_MONTHS = 6;
const ON_TIME_DAYS = 3; // pay_day ± 3일 이내면 정시
const LATE_DAYS = 10;   // pay_day + 10일 초과면 지연

function monthsBack(n, fromYear, fromMonth) {
  const out = [];
  let y = fromYear, m = fromMonth;
  for (let i = 0; i < n; i++) {
    out.push({ year: y, month: m });
    m--;
    if (m < 1) { m = 12; y--; }
  }
  return out;
}

// tenant: { id, pay_day }
// payments: 전체 payments 배열 (filtered by tid)
// fromDate: 평가 기준 날짜 (기본 오늘 — 이번 달 제외하고 과거 6개월)
export function calcPaymentRisk(tenant, allPayments, fromDate = new Date()) {
  const tid = tenant.id;
  const payDay = Number(tenant.pay_day) || 5;
  const tenantPayments = (allPayments || []).filter(p => (p.tid || p.tenant_id) === tid);

  if (tenantPayments.length === 0) {
    return { score: 0, level: "unknown", reason: "이력 없음", history: [] };
  }

  // 이번 달은 제외 — 아직 평가 불가
  const thisYear = fromDate.getFullYear();
  const thisMonth = fromDate.getMonth() + 1;
  const pastMonths = monthsBack(HISTORY_MONTHS, thisYear, thisMonth).filter(
    ({ year, month }) => !(year === thisYear && month === thisMonth)
  ).slice(0, HISTORY_MONTHS);

  let paidCount = 0;
  let unpaidCount = 0;
  let totalDelayDays = 0;
  let delaySamples = 0;
  let recentTwoLate = 0;
  const history = [];

  pastMonths.forEach(({ year, month }, idx) => {
    const p = tenantPayments.find(
      p => ((p.year || thisYear) === year) && p.month === month
    );

    if (!p || p.status !== "paid") {
      unpaidCount++;
      history.push({ year, month, status: "unpaid" });
      if (idx < 2) recentTwoLate++;
    } else {
      paidCount++;
      const paidDate = p.paid || p.paid_date;
      if (paidDate) {
        try {
          const paid = new Date(paidDate);
          // 기대 납부일 = (해당 연·월의 pay_day)
          const expected = new Date(year, month - 1, Math.min(payDay, 28));
          const delayDays = Math.max(0, Math.ceil((paid - expected) / 86400000));
          totalDelayDays += delayDays;
          delaySamples++;
          const tag = delayDays <= ON_TIME_DAYS ? "ontime" : delayDays <= LATE_DAYS ? "slight" : "late";
          history.push({ year, month, status: "paid", delayDays, tag });
          if (idx < 2 && delayDays > LATE_DAYS) recentTwoLate++;
        } catch {
          history.push({ year, month, status: "paid" });
        }
      } else {
        history.push({ year, month, status: "paid" });
      }
    }
  });

  const totalEvaluated = paidCount + unpaidCount;
  if (totalEvaluated === 0) {
    return { score: 0, level: "unknown", reason: "이력 없음", history };
  }

  const unpaidRate = unpaidCount / totalEvaluated; // 0~1
  const avgDelay = delaySamples > 0 ? totalDelayDays / delaySamples : 0;
  const delayFactor = Math.min(1, avgDelay / 14); // 14일 이상이면 max
  const recentFactor = recentTwoLate / 2; // 0, 0.5, 1

  // 가중 점수: 미납비율 60% + 지연일 25% + 최근 2개월 15%
  const score = Math.round(
    unpaidRate * 60 +
    delayFactor * 25 +
    recentFactor * 15
  );

  let level, reason;
  if (score >= 70) { level = "critical"; reason = `과거 ${unpaidCount}회 미납 · 평균 ${Math.round(avgDelay)}일 지연`; }
  else if (score >= 40) { level = "high"; reason = avgDelay > LATE_DAYS ? `평균 ${Math.round(avgDelay)}일 지연 납부` : `${unpaidCount}회 미납 기록`; }
  else if (score >= 15) { level = "medium"; reason = `평균 ${Math.round(avgDelay)}일 늦게 납부`; }
  else { level = "low"; reason = "정상 납부"; }

  return { score, level, reason, history, stats: { paidCount, unpaidCount, avgDelay: Math.round(avgDelay), recentTwoLate } };
}

export const RISK_CONFIG = {
  unknown:  { label: "—",       color: "#a0a0b0", bg: "transparent" },
  low:      { label: "안정",    color: "#0fa573", bg: "rgba(15,165,115,0.1)" },
  medium:   { label: "보통",    color: "#5b4fcf", bg: "rgba(91,79,207,0.1)" },
  high:     { label: "주의",    color: "#e8960a", bg: "rgba(232,150,10,0.12)" },
  critical: { label: "고위험",   color: "#e8445a", bg: "rgba(232,68,90,0.12)" },
};
