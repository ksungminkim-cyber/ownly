export const runtime = "edge";

function getApiKey(apiType) {
  const keyMap = {
    "아파트-전월세":     process.env.MOLIT_APT_RENT_KEY,
    "아파트-매매":       process.env.MOLIT_APT_TRADE_KEY,
    "오피스텔-전월세":   process.env.MOLIT_OFFI_RENT_KEY,
    "연립다세대-전월세": process.env.MOLIT_VILLA_RENT_KEY,
    "단독다가구-전월세": process.env.MOLIT_HOUSE_RENT_KEY,
    "상업업무용-매매":   process.env.MOLIT_COMMERCIAL_KEY,
    "토지-매매":         process.env.MOLIT_LAND_KEY,
    "공장창고-매매":     process.env.MOLIT_FACTORY_KEY,
  };
  return keyMap[apiType];
}

function getEndpoint(apiType) {
  const endpointMap = {
    "아파트-전월세":     "getRTMSDataSvcAptRent",
    "아파트-매매":       "getRTMSDataSvcAptTradeDev",
    "오피스텔-전월세":   "getRTMSDataSvcOffiRent",
    "연립다세대-전월세": "getRTMSDataSvcRHRent",
    "단독다가구-전월세": "getRTMSDataSvcSHRent",
    "상업업무용-매매":   "getRTMSDataSvcNrgTrade",
    "토지-매매":         "getRTMSDataSvcLandTrade",
    "공장창고-매매":     "getRTMSDataSvcFctTrade",
  };
  return endpointMap[apiType];
}

function resolveApiType(propertyType) {
  const map = {
    "주거":    "아파트-전월세",
    "아파트":  "아파트-전월세",
    "오피스텔":"오피스텔-전월세",
    "상가":    "상업업무용-매매",
    "토지":    "토지-매매",
    "공장":    "공장창고-매매",
    "연립":    "연립다세대-전월세",
    "빌라":    "연립다세대-전월세",
    "단독":    "단독다가구-전월세",
    "다가구":  "단독다가구-전월세",
  };
  return map[propertyType] || "아파트-전월세";
}

function getRecentMonths(count = 3) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

async function fetchMolitData(endpoint, apiKey, lawdCd, dealYmd) {
  const url = `https://apis.data.go.kr/1613000/RTMSDataSvc/${endpoint}?serviceKey=${encodeURIComponent(apiKey)}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&pageNo=1&numOfRows=100&_type=json`;
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.response?.body?.items?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } catch { return []; }
}

function normalizeRentItem(item) {
  const rent    = parseInt(String(item.월세금액 || item.월세 || "0").replace(/,/g, "")) || 0;
  const deposit = parseInt(String(item.보증금액 || item.전세금 || item.보증금 || "0").replace(/,/g, "")) || 0;
  const area    = parseFloat(item.전용면적 || "0") || 0;
  const areaPy  = Math.round(area / 3.306 * 10) / 10;
  return {
    name:        item.아파트 || item.연립다세대 || item.단지명 || "-",
    dong:        item.법정동 || item.동 || "",
    floor:       item.층 || "-",
    builtYear:   item.건축년도 || "-",
    contract:    `${item.년}-${item.월}`,
    area:        Math.round(area * 10) / 10,
    areaPyeong:  areaPy,
    rent, deposit,
    type:        rent > 0 ? "월세" : "전세",
    rentPerPyeong: areaPy > 0 && rent > 0 ? Math.round(rent / areaPy * 10) / 10 : null,
  };
}

function normalizeTradeItem(item) {
  const price  = parseInt(String(item.거래금액 || "0").replace(/,/g, "")) || 0;
  const area   = parseFloat(item.전용면적 || item.대지면적 || "0") || 0;
  const areaPy = Math.round(area / 3.306 * 10) / 10;
  return {
    name:         item.아파트 || item.도로명 || "-",
    dong:         item.법정동 || item.동 || "",
    floor:        item.층 || "-",
    builtYear:    item.건축년도 || "-",
    contract:     `${item.년}-${item.월}`,
    area:         Math.round(area * 10) / 10,
    areaPyeong:   areaPy,
    price,
    pricePerPyeong: areaPy > 0 && price > 0 ? Math.round(price / areaPy) : null,
  };
}

function calcStats(items, isRent) {
  if (!items.length) return null;
  if (isRent) {
    const rents   = items.filter(i => i.rent > 0).map(i => i.rent);
    const deps    = items.map(i => i.deposit).filter(Boolean);
    const perPy   = items.filter(i => i.rentPerPyeong).map(i => i.rentPerPyeong);
    const areas   = items.map(i => i.area).filter(Boolean);
    const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    return {
      count:          items.length,
      avgRent:        avg(rents),
      minRent:        rents.length ? Math.min(...rents) : 0,
      maxRent:        rents.length ? Math.max(...rents) : 0,
      avgDeposit:     avg(deps),
      minDeposit:     deps.length ? Math.min(...deps) : 0,
      maxDeposit:     deps.length ? Math.max(...deps) : 0,
      avgRentPerPy:   perPy.length ? Math.round(perPy.reduce((a,b)=>a+b,0)/perPy.length * 10)/10 : null,
      avgArea:        areas.length ? Math.round(areas.reduce((a,b)=>a+b,0)/areas.length * 10)/10 : null,
      avgAreaPyeong:  areas.length ? Math.round(areas.reduce((a,b)=>a+b,0)/areas.length / 3.306 * 10)/10 : null,
      jeonseCount:    items.filter(i => i.type === "전세").length,
      wolseCount:     items.filter(i => i.type === "월세").length,
    };
  } else {
    const prices = items.map(i => i.price).filter(Boolean);
    const perPy  = items.filter(i => i.pricePerPyeong).map(i => i.pricePerPyeong);
    const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    return {
      count:          items.length,
      avgPrice:       avg(prices),
      minPrice:       prices.length ? Math.min(...prices) : 0,
      maxPrice:       prices.length ? Math.max(...prices) : 0,
      avgPricePerPy:  perPy.length ? Math.round(perPy.reduce((a,b)=>a+b,0)/perPy.length) : null,
    };
  }
}

export async function POST(req) {
  try {
    const { lawdCd, propertyType = "주거" } = await req.json();
    if (!lawdCd) return Response.json({ error: "법정동코드가 필요합니다." }, { status: 400 });

    const apiType  = resolveApiType(propertyType);
    const apiKey   = getApiKey(apiType);
    const endpoint = getEndpoint(apiType);
    if (!apiKey) return Response.json({ error: `${apiType} API 키가 미설정입니다.` }, { status: 500 });

    const months = getRecentMonths(3);
    const lawdShort = String(lawdCd).slice(0, 5);

    const results = await Promise.all(months.map(ym => fetchMolitData(endpoint, apiKey, lawdShort, ym)));
    const allItems = results.flat();
    const isRent = apiType.includes("전월세");

    const normalized = allItems
      .map(item => isRent ? normalizeRentItem(item) : normalizeTradeItem(item))
      .filter(item => isRent ? (item.rent > 0 || item.deposit > 0) : item.price > 0);

    const stats   = calcStats(normalized, isRent);
    const samples = normalized.slice(0, 15);

    return Response.json({ apiType, isRent, months, totalCount: normalized.length, stats, samples, lawdCd: lawdShort });
  } catch (err) {
    console.error("국토부 API 오류:", err.message);
    return Response.json({ error: "실거래가 조회 오류: " + err.message }, { status: 500 });
  }
}
