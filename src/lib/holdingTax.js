// 부동산 보유세 계산 (재산세 + 종합부동산세)
// 2024년 세법 기준 · 참고용 추정치
// 단위: 만원

// ─── 재산세 (지방세) ───

/**
 * 주택 재산세 계산
 * 과세표준 = 시가표준액(공시가격) × 공정시장가액비율(60%)
 * 4구간 누진세율
 */
export function calcHousingPropertyTax(publicPrice) {
  if (!publicPrice || publicPrice <= 0) return 0;
  const base = Math.round(publicPrice * 0.6); // 공정시장가액비율 60%
  let tax = 0;
  if (base <= 6000) {
    tax = base * 0.001;
  } else if (base <= 15000) {
    tax = 6 + (base - 6000) * 0.0015;
  } else if (base <= 30000) {
    tax = 19.5 + (base - 15000) * 0.0025;
  } else {
    tax = 57 + (base - 30000) * 0.004;
  }
  return Math.round(tax);
}

/**
 * 건축물(상가) 재산세
 * 과세표준 = 시가표준액 × 70%
 * 일반 0.25%
 */
export function calcCommercialPropertyTax(publicPrice) {
  if (!publicPrice || publicPrice <= 0) return 0;
  const base = Math.round(publicPrice * 0.7);
  return Math.round(base * 0.0025);
}

/**
 * 토지 재산세 (별도합산)
 * 과세표준 = 공시가 × 70%
 * 3구간: 2억/10억
 */
export function calcLandPropertyTaxSeparate(publicPrice) {
  if (!publicPrice || publicPrice <= 0) return 0;
  const base = Math.round(publicPrice * 0.7);
  let tax = 0;
  if (base <= 20000) {
    tax = base * 0.002;
  } else if (base <= 100000) {
    tax = 40 + (base - 20000) * 0.003;
  } else {
    tax = 280 + (base - 100000) * 0.004;
  }
  return Math.round(tax);
}

// ─── 종합부동산세 (국세) ───

/**
 * 주택 종합부동산세
 * 공정시장가액비율 60% (2024)
 * 1세대1주택자: 12억 공제 / 다주택자: 9억 공제
 * 7구간 누진세율 (2024 개정)
 */
export function calcHousingComprehensiveTax({
  publicPriceSum,    // 보유 주택 공시가 합계
  is1Home = false,   // 1세대1주택자 여부
  is3Plus = false,   // 3주택 이상 (조정대상지역 포함)
}) {
  if (!publicPriceSum || publicPriceSum <= 0) return { tax: 0, base: 0, exemption: 0 };
  const exemption = is1Home ? 120000 : 90000; // 12억 또는 9억
  const fairMarket = Math.round(publicPriceSum * 0.6); // 공정시장가액비율 60%
  const base = Math.max(0, fairMarket - exemption);
  if (base === 0) return { tax: 0, base: 0, exemption };

  // 세율 (2024 기준)
  const RATES_NORMAL = [
    { upTo: 30000,  rate: 0.005, base: 0    },   // 3억 이하
    { upTo: 60000,  rate: 0.007, base: 150  },   // 3~6억
    { upTo: 120000, rate: 0.010, base: 360  },   // 6~12억
    { upTo: 250000, rate: 0.013, base: 960  },   // 12~25억
    { upTo: 500000, rate: 0.015, base: 2650 },   // 25~50억
    { upTo: 940000, rate: 0.020, base: 6400 },   // 50~94억
    { upTo: Infinity, rate: 0.027, base: 15200 },// 94억 초과
  ];
  const RATES_HEAVY = [
    { upTo: 30000,  rate: 0.005, base: 0     },
    { upTo: 60000,  rate: 0.007, base: 150   },
    { upTo: 120000, rate: 0.010, base: 360   },
    { upTo: 250000, rate: 0.020, base: 960   },
    { upTo: 500000, rate: 0.030, base: 3560  },
    { upTo: 940000, rate: 0.040, base: 11060 },
    { upTo: Infinity, rate: 0.050, base: 28660 },
  ];
  const rates = is3Plus ? RATES_HEAVY : RATES_NORMAL;
  let tax = 0;
  for (const r of rates) {
    if (base <= r.upTo) {
      const excess = base - (rates[rates.indexOf(r) - 1]?.upTo || 0);
      tax = r.base + excess * r.rate;
      break;
    }
  }
  return { tax: Math.round(tax), base, exemption };
}

/**
 * 토지 종합부동산세 (별도합산)
 * 80억 초과분에 대해 부과
 * 0.5%~0.7%
 */
export function calcLandComprehensiveTax(publicPriceSum) {
  if (!publicPriceSum || publicPriceSum <= 0) return { tax: 0, base: 0, exemption: 800000 };
  const exemption = 800000; // 80억
  const fairMarket = Math.round(publicPriceSum * 0.8); // 공정시장가액비율 80%
  const base = Math.max(0, fairMarket - exemption);
  if (base === 0) return { tax: 0, base: 0, exemption };
  let rate = 0.005;
  if (base > 200000) rate = 0.006;
  if (base > 1300000) rate = 0.007;
  return { tax: Math.round(base * rate), base, exemption };
}

// ─── 종합 보유세 계산 ───

export function calcTotalHoldingTax({
  housingPriceSum = 0,
  commercialPriceSum = 0,
  landPriceSum = 0,
  is1Home = false,
  is3Plus = false,
  isJointOwnership = false,
}) {
  // 재산세
  const housingPropertyTax = calcHousingPropertyTax(housingPriceSum);
  const commercialPropertyTax = calcCommercialPropertyTax(commercialPriceSum);
  const landPropertyTax = calcLandPropertyTaxSeparate(landPriceSum);

  // 종부세
  const housingComprehensive = calcHousingComprehensiveTax({ publicPriceSum: housingPriceSum, is1Home, is3Plus });
  const landComprehensive = calcLandComprehensiveTax(landPriceSum);

  // 부부공동명의 시 종부세 50% 감면 (단순 가정)
  const jointDiscount = isJointOwnership ? 0.5 : 1;
  const housingCompFinal = Math.round(housingComprehensive.tax * jointDiscount);
  const landCompFinal = Math.round(landComprehensive.tax * jointDiscount);

  const totalProperty = housingPropertyTax + commercialPropertyTax + landPropertyTax;
  const totalComprehensive = housingCompFinal + landCompFinal;
  const grandTotal = totalProperty + totalComprehensive;

  return {
    propertyTax: {
      housing: housingPropertyTax,
      commercial: commercialPropertyTax,
      land: landPropertyTax,
      total: totalProperty,
    },
    comprehensiveTax: {
      housing: housingCompFinal,
      housingDetail: housingComprehensive,
      land: landCompFinal,
      landDetail: landComprehensive,
      total: totalComprehensive,
    },
    grandTotal,
  };
}
