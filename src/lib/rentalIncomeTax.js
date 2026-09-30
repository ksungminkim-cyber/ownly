// 주택임대소득 분리과세 vs 종합과세 비교 — 순수 계산 (금액 단위: 만원)
// 기준: 2026년 귀속(2027년 5월 신고) 일반 계산. 실제 신고는 홈택스·세무사 확인.
// 이 파일은 계산만 담당합니다. 화면 문구·면책은 components/SeparateTaxCompare.js 에 있습니다.

export const RENTAL_TAX_BASIS = { year: 2026, filingLabel: "2027년 5월 신고" };

// ─── 법 규정 수치 (출처) ───
// 소득세법 제64조의2 ① — 주택임대 총수입금액 2천만원 이하이면 분리과세(14%) 선택 가능
export const SEPARATE_THRESHOLD = 2000;
export const SEPARATE_TAX_RATE = 0.14;
// 소득세법 제64조의2 ② — 필요경비율: 등록임대 60%, 미등록 50%
//   기본공제: 등록 400만원, 미등록 200만원 (주택임대소득 외 종합소득금액 2천만원 이하일 때만)
//   ※ 등록 요건: 지자체 임대사업자 + 세무서 사업자등록 + 임대료 증액 5% 이내 (민간임대주택법)
export const EXPENSE_RATE = { registered: 0.6, unregistered: 0.5 };
export const BASIC_DEDUCTION = { registered: 400, unregistered: 200 };
export const OTHER_INCOME_LIMIT = 2000;
// 지방세법 제92조 — 개인지방소득세 = 소득세의 10%
export const LOCAL_TAX_RATE = 0.1;
// 소득세법 제55조 — 종합소득세 기본세율 (2023년 귀속 이후, 누진공제 방식과 동일한 결과)
export const INCOME_TAX_BRACKETS = [
  { limit: 1400, rate: 0.06, base: 0 },
  { limit: 5000, rate: 0.15, base: 84 },
  { limit: 8800, rate: 0.24, base: 624 },
  { limit: 15000, rate: 0.35, base: 1536 },
  { limit: 30000, rate: 0.38, base: 3706 },
  { limit: 50000, rate: 0.40, base: 9406 },
  { limit: 100000, rate: 0.42, base: 17406 },
  { limit: Infinity, rate: 0.45, base: 38406 },
];
// 소득세법 제50조 — 본인 기본공제 150만원 (종합과세 시 소득공제 기본값)
export const PERSONAL_DEDUCTION = 150;
// 소득세법 제25조 ① / 시행령 제53조 — 간주임대료: 3주택 이상 + 보증금 합계 3억 초과
//   (보증금 합계 − 3억) × 60% × 정기예금이자율 − 해당 보증금 금융수익
//   정기예금이자율(시행규칙 제23조)은 매년 고시 — 기본값 3.1% 는 2025년 귀속 기준으로 알려진 값이며
//   2026년 귀속 고시율은 확인 필요 (화면에서 사용자가 수정 가능)
export const DEEMED = { minHouses: 3, depositFloor: 30000, ratio: 0.6, defaultInterestRate: 0.031, interestRateConfirmed: false };

const r1 = (v) => Math.round(v * 10) / 10; // 천원 단위(0.1만원) 반올림
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export function progressiveTax(base) {
  const b = num(base);
  if (b <= 0) return 0;
  let prev = 0;
  for (const { limit, rate, base: acc } of INCOME_TAX_BRACKETS) {
    if (b <= limit) return r1(acc + (b - prev) * rate);
    prev = limit;
  }
  return 0;
}

export function calcDeemedRent({ houseCount, depositSum, interestRate = DEEMED.defaultInterestRate, financialIncome = 0 }) {
  const houses = num(houseCount);
  const deposits = num(depositSum);
  if (houses < DEEMED.minHouses) return { applies: false, amount: 0, reason: `주택 ${DEEMED.minHouses}채 미만` };
  if (deposits <= DEEMED.depositFloor) return { applies: false, amount: 0, reason: "보증금 합계 3억원 이하" };
  const amount = Math.max(0, r1((deposits - DEEMED.depositFloor) * DEEMED.ratio * num(interestRate) - num(financialIncome)));
  return { applies: true, amount, reason: "3주택 이상 · 보증금 합계 3억원 초과" };
}

/**
 * @param {object} p
 * @param {number} p.rentIncome        연간 월세 수입금액 (만원)
 * @param {number} [p.deemedRent]      간주임대료 (만원)
 * @param {boolean} p.registered       등록임대 여부
 * @param {number} p.otherIncome       주택임대 외 종합소득금액 (만원)
 * @param {"actual"|"rate"} [p.expenseMode] 종합과세 필요경비 방식
 * @param {number} [p.actualExpense]   실제 장부 경비 (만원)
 * @param {number} [p.simpleExpenseRate] 단순경비율 (0~1, 사용자 입력)
 * @param {number} [p.incomeDeduction] 종합소득공제 합계 (기본 본인공제 150만원)
 */
export function compareRentalIncomeTax(p) {
  const revenue = r1(num(p.rentIncome) + num(p.deemedRent));
  const other = Math.max(0, num(p.otherIncome));
  const key = p.registered ? "registered" : "unregistered";
  const incomeDeduction = p.incomeDeduction === undefined ? PERSONAL_DEDUCTION : Math.max(0, num(p.incomeDeduction));

  // 분리과세
  const eligible = revenue <= SEPARATE_THRESHOLD;
  const sepExpense = r1(revenue * EXPENSE_RATE[key]);
  const deductionApplies = other <= OTHER_INCOME_LIMIT;
  const sepDeduction = deductionApplies ? BASIC_DEDUCTION[key] : 0;
  const sepTaxable = Math.max(0, r1(revenue - sepExpense - sepDeduction));
  const sepIncomeTax = r1(sepTaxable * SEPARATE_TAX_RATE);
  const sepLocal = r1(sepIncomeTax * LOCAL_TAX_RATE);
  const separate = {
    eligible, expenseRate: EXPENSE_RATE[key], expense: sepExpense,
    deductionApplies, deduction: sepDeduction, taxable: sepTaxable,
    incomeTax: sepIncomeTax, localTax: sepLocal, total: eligible ? r1(sepIncomeTax + sepLocal) : null,
  };

  // 종합과세 — 주택임대 소득을 더했을 때 늘어나는 세액(증분)으로 비교
  const compExpense = p.expenseMode === "rate" ? r1(revenue * Math.min(1, Math.max(0, num(p.simpleExpenseRate)))) : Math.max(0, num(p.actualExpense));
  const rentalIncome = Math.max(0, r1(revenue - compExpense)); // 결손(음수)은 0 처리 — 보수적
  const baseWithout = Math.max(0, r1(other - incomeDeduction));
  const baseWith = Math.max(0, r1(other + rentalIncome - incomeDeduction));
  const taxWith = progressiveTax(baseWith);
  const taxWithout = progressiveTax(baseWithout);
  const compIncomeTax = r1(taxWith - taxWithout);
  const compLocal = r1(compIncomeTax * LOCAL_TAX_RATE);
  const comprehensive = {
    expense: compExpense, rentalIncome, taxBase: baseWith, taxWith, taxWithout,
    incomeTax: compIncomeTax, localTax: compLocal, total: r1(compIncomeTax + compLocal),
  };

  let better = "comprehensive";
  let diff = null;
  if (eligible) {
    diff = r1(Math.abs(separate.total - comprehensive.total));
    better = separate.total < comprehensive.total ? "separate" : separate.total > comprehensive.total ? "comprehensive" : "same";
  }
  return { revenue, separate, comprehensive, better, diff };
}
