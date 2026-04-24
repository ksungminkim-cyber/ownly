// 지역(시군구) 단위 임대·매매 시장 집계 API
// MOLIT 실거래를 3개월치 수집 → 월세/보증금/평당/면적분포/건축연도별/월별 추이 통계
// 공개 시세 페이지(/sise/[slug])에서 소비
// 캐싱: fetch의 Next.js revalidate로 24시간 CDN 캐시

export const runtime = "edge";
export const revalidate = 86400; // 24h

const MOLIT_BASE = "http://apis.data.go.kr/1613000/";
const MOLIT_ENDPOINTS = {
  apt_rent:   "RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
  apt_trade:  "RTMSDataSvcAptTrade/getRTMSDataSvcAptTradeDev",
  villa_rent: "RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
  offi_rent:  "RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
};

function getKey(type) {
  const envVar = `MOLIT_${type.toUpperCase()}_KEY`;
  return process.env[envVar] || process.env.MOLIT_SERVICE_KEY;
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
  const key = getKey(type);
  const path = MOLIT_ENDPOINTS[type];
  if (!key || !path || !lawdCd) return [];
  try {
    const url = `${MOLIT_BASE}${path}?serviceKey=${encodeURIComponent(key)}&LAWD_CD=${lawdCd}&DEAL_YMD=${ym}&pageNo=1&numOfRows=200&_type=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.response?.body?.items?.item;
    return Array.isArray(items) ? items : items ? [items] : [];
  } catch {
    return [];
  }
}

const sqmToPy = (sqm) => sqm > 0 ? Math.round(sqm / 3.3058 * 10) / 10 : 0;
const parseArea = (r) => Number(String(r.excluUseAr || r.totalFloorAr || r.bldArea || 0).replace(/,/g, "").trim());
const parsePrice = (r) => Number(String(r.dealAmount || "0").replace(/,/g, "").trim());

function median(nums) {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function avg(nums) {
  return nums.length ? Math.round(nums.reduce((s, v) => s + v, 0) / nums.length) : 0;
}

export async function POST(req) {
  const { lawdCd } = await req.json();
  if (!lawdCd) return Response.json({ error: "lawdCd 필수" }, { status: 400 });

  const months = monthsBack(3);

  // 월세 실거래 — 아파트/빌라/오피스텔 병렬
  const rentTasks = [];
  for (const ym of months) {
    rentTasks.push(fetchMolit("apt_rent", lawdCd, ym).then(rows => rows.map(r => ({ ...r, _type: "apt", _ym: ym }))));
    rentTasks.push(fetchMolit("villa_rent", lawdCd, ym).then(rows => rows.map(r => ({ ...r, _type: "villa", _ym: ym }))));
    rentTasks.push(fetchMolit("offi_rent", lawdCd, ym).then(rows => rows.map(r => ({ ...r, _type: "offi", _ym: ym }))));
  }
  const tradeTasks = months.map(ym => fetchMolit("apt_trade", lawdCd, ym).then(rows => rows.map(r => ({ ...r, _ym: ym }))));

  const [rentChunks, tradeChunks] = await Promise.all([
    Promise.all(rentTasks),
    Promise.all(tradeTasks),
  ]);
  const rentAll = rentChunks.flat();
  const tradeAll = tradeChunks.flat();

  // 유효 월세 행 (monthlyRent > 0) 중 면적 있는 것
  const validRent = rentAll
    .filter(r => Number(r.monthlyRent || 0) > 0 && parseArea(r) > 0)
    .map(r => ({
      type: r._type,
      rent: Number(r.monthlyRent),
      deposit: Number(r.deposit || 0),
      areaSqm: parseArea(r),
      py: sqmToPy(parseArea(r)),
      floor: r.floor ? Number(r.floor) : null,
      buildYear: r.buildYear ? Number(r.buildYear) : null,
      name: r.aptName || r.houseType || r.offiNm || "(이름 없음)",
      ym: r._ym,
      day: r.dealDay ? Number(r.dealDay) : null,
    }));

  if (validRent.length === 0) {
    return Response.json({
      lawdCd,
      empty: true,
      message: "이 지역의 최근 3개월 임대 실거래 데이터가 없습니다.",
    });
  }

  const monthlyList = validRent.map(x => x.rent).sort((a, b) => a - b);
  const depList = validRent.filter(x => x.deposit > 0).map(x => x.deposit).sort((a, b) => a - b);
  const perPyList = validRent.map(x => x.rent / x.py);
  const pyList = validRent.map(x => x.py);

  // 면적대별 분포
  const sizeBuckets = { small: 0, medium: 0, large: 0, xl: 0 };
  validRent.forEach(x => {
    if (x.py < 10) sizeBuckets.small++;
    else if (x.py < 20) sizeBuckets.medium++;
    else if (x.py < 30) sizeBuckets.large++;
    else sizeBuckets.xl++;
  });

  // 건축연도별 (10년 단위)
  const ageBuckets = { new: 0, mid: 0, old: 0, veryOld: 0, unknown: 0 };
  validRent.forEach(x => {
    if (!x.buildYear) { ageBuckets.unknown++; return; }
    const age = 2026 - x.buildYear;
    if (age <= 5)       ageBuckets.new++;
    else if (age <= 15) ageBuckets.mid++;
    else if (age <= 30) ageBuckets.old++;
    else                ageBuckets.veryOld++;
  });

  // 월별 추이
  const monthly = {};
  validRent.forEach(x => {
    if (!monthly[x.ym]) monthly[x.ym] = [];
    monthly[x.ym].push(x.rent);
  });
  const trend = Object.keys(monthly).sort().map(ym => ({
    ym,
    median: median(monthly[ym]),
    count: monthly[ym].length,
  }));

  // 유형별 통계
  const byType = {};
  ["apt", "villa", "offi"].forEach(t => {
    const subset = validRent.filter(x => x.type === t);
    if (subset.length > 0) {
      byType[t] = {
        count: subset.length,
        medianRent: median(subset.map(x => x.rent)),
        medianDep: median(subset.filter(x => x.deposit > 0).map(x => x.deposit)),
        avgPerPy: Math.round(subset.map(x => x.rent / x.py).reduce((s, v) => s + v, 0) / subset.length * 10) / 10,
      };
    }
  });

  // 최근 거래 10건 (최신순)
  const recentTx = [...validRent]
    .sort((a, b) => (b.ym + String(b.day || 0).padStart(2, "0")).localeCompare(a.ym + String(a.day || 0).padStart(2, "0")))
    .slice(0, 10)
    .map(x => ({
      name: x.name,
      type: x.type,
      rent: x.rent,
      deposit: x.deposit,
      py: x.py,
      floor: x.floor,
      buildYear: x.buildYear,
      ym: x.ym,
      day: x.day,
    }));

  // 매매 시세 (참고)
  const tradeValid = tradeAll
    .filter(r => parsePrice(r) > 0 && parseArea(r) > 0)
    .map(r => ({
      price: parsePrice(r),
      py: sqmToPy(parseArea(r)),
    }));
  const trade = tradeValid.length > 0 ? {
    count: tradeValid.length,
    medianPrice: median(tradeValid.map(x => x.price)),
    medianPricePerPy: median(tradeValid.map(x => Math.round(x.price / x.py))),
    avgAreaPy: Math.round(tradeValid.reduce((s, x) => s + x.py, 0) / tradeValid.length * 10) / 10,
  } : null;

  return Response.json({
    lawdCd,
    empty: false,
    updatedAt: new Date().toISOString(),
    total: { rentTx: validRent.length, tradeTx: tradeValid.length },
    rent: {
      medianMonthly: median(monthlyList),
      avgMonthly: avg(monthlyList),
      p25: monthlyList[Math.floor(monthlyList.length * 0.25)] || 0,
      p75: monthlyList[Math.floor(monthlyList.length * 0.75)] || 0,
      medianDeposit: median(depList),
      avgAreaPy: Math.round(pyList.reduce((s, v) => s + v, 0) / pyList.length * 10) / 10,
      avgRentPerPy: Math.round(perPyList.reduce((s, v) => s + v, 0) / perPyList.length * 10) / 10,
    },
    trade,
    byType,
    sizeBuckets,
    ageBuckets,
    trend,
    recentTx,
  });
}
