// 지역별 실시간 시장 통계 API
// MOLIT 실거래 데이터로 직접 계산 (외부 API 의존 없음)
//   - 임대수익률 (연 임대료 / 매매가)
//   - 평당 매매가
//   - 거래량 추이 (공실 프록시)
//   - 월별 가격 트렌드
// 캐싱: 24시간 ISR + fetch cache

export const runtime = "edge";
export const revalidate = 86400; // 24h

const MOLIT_BASE = "http://apis.data.go.kr/1613000/";
const MOLIT_ENDPOINTS = {
  apt_rent:   "RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
  apt_trade:  "RTMSDataSvcAptTrade/getRTMSDataSvcAptTradeDev",
  offi_rent:  "RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
  offi_trade: "RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade",
  villa_rent: "RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
  villa_trade:"RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade",
};

function getKey() {
  return process.env.MOLIT_SERVICE_KEY;
}

function monthsBack(n) {
  const out = [];
  const now = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

async function fetchMolit(type, lawdCd, ym) {
  const key = getKey();
  const path = MOLIT_ENDPOINTS[type];
  if (!key || !path || !lawdCd) return [];
  try {
    const url = `${MOLIT_BASE}${path}?serviceKey=${encodeURIComponent(key)}&LAWD_CD=${lawdCd}&DEAL_YMD=${ym}&pageNo=1&numOfRows=300&_type=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.response?.body?.items?.item;
    return Array.isArray(items) ? items : items ? [items] : [];
  } catch { return []; }
}

const SQM_PER_PYEONG = 3.3058;
const sqmToPy = (sqm) => sqm > 0 ? sqm / SQM_PER_PYEONG : 0;
const parseArea = (r) => Number(String(r.excluUseAr || r.totalFloorAr || 0).replace(/,/g, "").trim());
const parsePrice = (r) => Number(String(r.dealAmount || "0").replace(/,/g, "").trim());

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function avg(nums) {
  return nums.length ? Math.round(nums.reduce((s, v) => s + v, 0) / nums.length) : 0;
}

// 보증금을 월세로 환산 (전월세 전환율 6% 기준 - 임대차보호법)
const CONVERSION_RATE = 0.06;
const depositToMonthly = (deposit) => Math.round(deposit * CONVERSION_RATE / 12);

export async function POST(req) {
  const { lawdCd, propTypes = ["apt", "officetel"] } = await req.json();
  if (!lawdCd) return Response.json({ error: "lawdCd 필수" }, { status: 400 });
  if (!getKey()) return Response.json({ error: "MOLIT_SERVICE_KEY 미설정" }, { status: 500 });

  // 최근 6개월 (수익률·트렌드 계산용)
  const months = monthsBack(6);

  // 유형별 데이터 로딩 (병렬)
  const tasks = [];
  for (const ym of months) {
    if (propTypes.includes("apt")) {
      tasks.push(fetchMolit("apt_rent", lawdCd, ym).then(rows => ({ type: "apt", kind: "rent", ym, rows })));
      tasks.push(fetchMolit("apt_trade", lawdCd, ym).then(rows => ({ type: "apt", kind: "trade", ym, rows })));
    }
    if (propTypes.includes("officetel")) {
      tasks.push(fetchMolit("offi_rent", lawdCd, ym).then(rows => ({ type: "officetel", kind: "rent", ym, rows })));
      tasks.push(fetchMolit("offi_trade", lawdCd, ym).then(rows => ({ type: "officetel", kind: "trade", ym, rows })));
    }
  }
  const chunks = await Promise.all(tasks);

  // 유형별 합산
  const byType = {};
  for (const t of propTypes) {
    byType[t] = { rentRows: [], tradeRows: [], monthlyVolume: {} };
  }
  chunks.forEach(({ type, kind, ym, rows }) => {
    const bucket = byType[type];
    if (!bucket) return;
    if (kind === "rent") bucket.rentRows.push(...rows);
    else bucket.tradeRows.push(...rows);
    bucket.monthlyVolume[ym] = (bucket.monthlyVolume[ym] || 0) + rows.length;
  });

  // 유형별 통계 계산
  const result = {};
  for (const type of propTypes) {
    const { rentRows, tradeRows, monthlyVolume } = byType[type];

    // 1) 임대 통계
    const rents = rentRows
      .map(r => ({ rent: Number(r.monthlyRent || 0), dep: Number(r.deposit || 0), area: parseArea(r) }))
      .filter(x => (x.rent > 0 || x.dep > 0) && x.area > 0);

    // 보증금 환산 포함 월세 (전월세 환산율 6%)
    const effectiveMonthly = rents.map(x => x.rent + depositToMonthly(x.dep));
    const avgMonthlyRent = avg(effectiveMonthly);
    const medianMonthlyRent = median(effectiveMonthly);

    // 2) 매매 통계
    const trades = tradeRows
      .map(r => ({ price: parsePrice(r), area: parseArea(r) }))
      .filter(x => x.price > 0 && x.area > 0);
    const avgSalePrice = avg(trades.map(x => x.price));
    const medianSalePrice = median(trades.map(x => x.price));

    // 평당가 (만원/평)
    const pricePerPyeongList = trades.map(x => x.price / sqmToPy(x.area));
    const avgPricePerPyeong = Math.round(avg(pricePerPyeongList));
    const medianPricePerPyeong = Math.round(median(pricePerPyeongList));

    // 평당 월세 (만원/평/월)
    const rentPerPyeongList = rents.filter(x => x.area > 0).map(x => (x.rent + depositToMonthly(x.dep)) / sqmToPy(x.area));
    const avgRentPerPyeong = Math.round(avg(rentPerPyeongList) * 10) / 10;

    // 3) 임대수익률 = 연 임대료 / 매매가 × 100
    // 평당가 vs 평당 월세로 비교 (동일 면적 비교 가능)
    let yieldRate = 0;
    if (avgPricePerPyeong > 0 && avgRentPerPyeong > 0) {
      const annualRentPerPyeong = avgRentPerPyeong * 12;
      yieldRate = Math.round((annualRentPerPyeong / avgPricePerPyeong) * 1000) / 10; // %.1f
    }

    // 4) 거래량 추이 (공실 프록시)
    const sortedMonths = months.slice().sort();
    const recent3 = sortedMonths.slice(-3);
    const prior3 = sortedMonths.slice(-6, -3);
    const sumVolume = (mList) => mList.reduce((s, ym) => s + (monthlyVolume[ym] || 0), 0);
    const recentVol = sumVolume(recent3);
    const priorVol = sumVolume(prior3);
    const volumeChangePct = priorVol > 0
      ? Math.round(((recentVol - priorVol) / priorVol) * 100)
      : 0;

    // 5) 월별 매매 평균가 추이 (최근 6개월)
    const monthlyTradePrice = {};
    tradeRows.forEach(r => {
      const dy = r.dealYear, dm = String(r.dealMonth || "").padStart(2, "0");
      if (!dy || !dm) return;
      const ym = `${dy}${dm}`;
      const price = parsePrice(r);
      if (!monthlyTradePrice[ym]) monthlyTradePrice[ym] = [];
      if (price > 0) monthlyTradePrice[ym].push(price);
    });
    const priceTrend = sortedMonths.map(ym => ({
      ym,
      avgPrice: avg(monthlyTradePrice[ym] || []),
      count: (monthlyTradePrice[ym] || []).length,
    }));

    result[type] = {
      yieldRate,
      avgMonthlyRent,
      medianMonthlyRent,
      avgSalePrice,
      medianSalePrice,
      avgPricePerPyeong,
      medianPricePerPyeong,
      avgRentPerPyeong,
      sampleSize: { rent: rents.length, trade: trades.length },
      transactionVolume: {
        recent: recentVol,
        prior: priorVol,
        changePct: volumeChangePct,
      },
      priceTrend,
    };
  }

  return Response.json({
    lawdCd,
    period: { from: months[months.length - 1], to: months[0] },
    types: result,
    updatedAt: new Date().toISOString(),
  });
}
