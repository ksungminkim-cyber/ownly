export const runtime = "edge";

// ─── 유형별 API 설정 ───────────────────────────────────
// key는 문자열 직접 참조 (lazy 함수 패턴 edge에서 불안정)
const ENDPOINTS = {
  "아파트-전월세":     "getRTMSDataSvcAptRent",
  "오피스텔-전월세":   "getRTMSDataSvcOffiRent",
  "연립다세대-전월세": "getRTMSDataSvcRHRent",
  "단독다가구-전월세": "getRTMSDataSvcSHRent",
  "아파트-매매":       "getRTMSDataSvcAptTradeDev",
  "상업업무용-매매":   "getRTMSDataSvcNrgTrade",
  "토지-매매":         "getRTMSDataSvcLandTrade",
  "공장창고-매매":     "getRTMSDataSvcFctTrade",
};

const IS_RENT = {
  "아파트-전월세": true, "오피스텔-전월세": true,
  "연립다세대-전월세": true, "단독다가구-전월세": true,
  "아파트-매매": false, "상업업무용-매매": false,
  "토지-매매": false, "공장창고-매매": false,
};

const YIELD_RATE = {
  "상업업무용-매매": 0.035,
  "토지-매매": 0.02,
  "공장창고-매매": 0.05,
  "아파트-매매": 0.04,
};

const API_NOTES = {
  "상업업무용-매매": "상업용 부동산은 전월세 실거래 미공개 — 매매가 기준 수익률 3.5% 역산값",
  "토지-매매": "토지 임대 수익률 추정 어려움 — 매매가 기준 2% 역산, 참고용으로만 활용",
  "공장창고-매매": "공장·창고는 전월세 실거래 미공개 — 매매가 기준 5% 역산값",
};

// Ownly 유형 → API 배열
const TYPE_TO_APIS = {
  "주거":    ["아파트-전월세", "연립다세대-전월세", "단독다가구-전월세"],
  "오피스텔": ["오피스텔-전월세"],
  "상가":    ["상업업무용-매매"],
  "토지":    ["토지-매매"],
  "공장":    ["공장창고-매매"],
};

// ─── 환경변수 직접 읽기 함수 ───────────────────────────
function getKey(apiType) {
  if (apiType === "아파트-전월세")     return process.env.MOLIT_APT_RENT_KEY;
  if (apiType === "오피스텔-전월세")   return process.env.MOLIT_OFFI_RENT_KEY;
  if (apiType === "연립다세대-전월세") return process.env.MOLIT_VILLA_RENT_KEY;
  if (apiType === "단독다가구-전월세") return process.env.MOLIT_HOUSE_RENT_KEY;
  if (apiType === "아파트-매매")       return process.env.MOLIT_APT_TRADE_KEY;
  if (apiType === "상업업무용-매매")   return process.env.MOLIT_COMMERCIAL_KEY;
  if (apiType === "토지-매매")         return process.env.MOLIT_LAND_KEY;
  if (apiType === "공장창고-매매")     return process.env.MOLIT_FACTORY_KEY;
  return null;
}

// ─── 국토부 신고 지연: 현재 -2~-7개월 조회 ───────────────
function getMonths(count = 5) {
  const months = [];
  const now = new Date();
  for (let i = 2; i < count + 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

// ─── API 단일 호출 ────────────────────────────────────────
async function fetchOne(endpoint, apiKey, lawdCd, dealYmd) {
  const url = `https://apis.data.go.kr/1613000/RTMSDataSvc/${endpoint}?serviceKey=${encodeURIComponent(apiKey)}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&pageNo=1&numOfRows=100&_type=json`;
  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json, text/json" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    // XML 오류 응답 처리
    if (text.trim().startsWith("<")) return [];
    const data = JSON.parse(text);
    const body  = data?.response?.body;
    if (!body || body.totalCount === 0) return [];
    const items = body?.items?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } catch (e) {
    console.error(`fetchOne error [${endpoint}/${dealYmd}]:`, e.message);
    return [];
  }
}

// ─── 아이템 정규화 ────────────────────────────────────────
function toNum(v) { return parseInt(String(v || "0").replace(/,/g, ""), 10) || 0; }
function toFloat(v) { return parseFloat(String(v || "0").replace(/,/g, "")) || 0; }

function normalizeItem(raw, apiType, year, month) {
  const isRent = IS_RENT[apiType];
  const areaSqm = toFloat(raw["전용면적"] || raw["대지면적"] || raw["연면적"] || "0");
  const areaPy  = areaSqm > 0 ? Math.round(areaSqm / 3.306 * 10) / 10 : 0;

  // 건물명/단지명 통합
  const name = raw["아파트"] || raw["단지명"] || raw["연립다세대"] || raw["건물명"] ||
               raw["공장명"] || raw["지역"] || raw["도로명"] || "-";
  const dong  = raw["법정동"] || raw["지역"] || "";
  // 층 — 숫자만 추출
  const floorRaw = raw["층"] || "";
  const floor = String(floorRaw).replace(/[^0-9\-]/g, "") || "-";
  const built = String(raw["건축년도"] || "").replace(/[^0-9]/g,"");
  const contract = `${year}-${String(month).padStart(2,"0")}`;

  if (isRent) {
    const deposit = toNum(raw["보증금액"] || raw["보증금"] || raw["전세금"]);
    const rent    = toNum(raw["월세금액"] || raw["월세"]);
    const rentPerPy = areaPy > 0 && rent > 0 ? Math.round(rent / areaPy * 10) / 10 : null;
    return { apiType, name, dong, floor, built, contract, areaSqm, areaPy,
             deposit, rent, type: rent > 0 ? "월세" : "전세", rentPerPy };
  } else {
    const price   = toNum(raw["거래금액"]);
    const yr      = YIELD_RATE[apiType] || 0.04;
    const estRent = price > 0 ? Math.round(price * yr / 12) : 0;
    const pricePerPy = areaPy > 0 && price > 0 ? Math.round(price / areaPy) : null;
    const rentPerPy  = areaPy > 0 && estRent > 0 ? Math.round(estRent / areaPy * 10) / 10 : null;
    return { apiType, name, dong, floor, built, contract, areaSqm, areaPy,
             price, pricePerPy, estRent, rent: estRent, deposit: null,
             type: "매매역산", rentPerPy, yieldRate: yr };
  }
}

// ─── 통계 ─────────────────────────────────────────────────
function calcStats(items, isRent) {
  const valid = items.filter(i => i.rent > 0 || (!isRent && i.price > 0));
  if (!valid.length) return null;
  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;

  const rents    = valid.map(i=>i.rent).filter(Boolean);
  const deposits = valid.map(i=>i.deposit).filter(Boolean);
  const perPy    = valid.map(i=>i.rentPerPy).filter(Boolean);
  const areas    = valid.map(i=>i.areaPy).filter(Boolean);
  const prices   = valid.map(i=>i.price).filter(Boolean);
  const ppPy     = valid.map(i=>i.pricePerPy).filter(Boolean);

  return {
    count:      valid.length,
    isRent,
    avgRent:    avg(rents), minRent: rents.length?Math.min(...rents):0, maxRent: rents.length?Math.max(...rents):0,
    avgDeposit: avg(deposits), minDeposit: deposits.length?Math.min(...deposits):0, maxDeposit: deposits.length?Math.max(...deposits):0,
    avgRentPerPy: perPy.length ? Math.round(perPy.reduce((a,b)=>a+b,0)/perPy.length*10)/10 : null,
    minRentPerPy: perPy.length?Math.min(...perPy):null, maxRentPerPy: perPy.length?Math.max(...perPy):null,
    avgAreaPy:  areas.length?Math.round(areas.reduce((a,b)=>a+b,0)/areas.length*10)/10:null,
    avgAreaSqm: areas.length?Math.round(areas.reduce((a,b)=>a+b,0)/areas.length*3.306*10)/10:null,
    avgPrice:   avg(prices), minPrice: prices.length?Math.min(...prices):0, maxPrice: prices.length?Math.max(...prices):0,
    avgPricePerPy: ppPy.length?Math.round(ppPy.reduce((a,b)=>a+b,0)/ppPy.length):null,
    wolseCount:   valid.filter(i=>i.type==="월세").length,
    jeonseCount:  valid.filter(i=>i.type==="전세").length,
    tradeCount:   valid.filter(i=>i.type==="매매역산").length,
  };
}

// ─── 메인 ─────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { lawdCd, propertyType = "주거" } = await req.json();
    if (!lawdCd) return Response.json({ error: "법정동코드 필요" }, { status: 400 });

    const apiTypeList = TYPE_TO_APIS[propertyType] || TYPE_TO_APIS["주거"];
    const months      = getMonths(5);
    const lawdShort   = String(lawdCd).slice(0, 5);
    const isRent      = apiTypeList.some(t => IS_RENT[t]);

    const allItems    = [];
    const usedTypes   = [];
    const notes       = [];
    const debugInfo   = [];

    for (const apiType of apiTypeList) {
      const apiKey   = getKey(apiType);
      const endpoint = ENDPOINTS[apiType];

      if (!apiKey) {
        notes.push(`${apiType}: API 키 미설정`);
        debugInfo.push(`${apiType}: NO_KEY`);
        continue;
      }

      debugInfo.push(`${apiType}: key_ok(${apiKey.slice(0,6)}...) endpoint=${endpoint}`);

      // 월별 병렬 호출
      const fetched = await Promise.all(
        months.map(ym =>
          fetchOne(endpoint, apiKey, lawdShort, ym)
            .then(raws => raws.map(raw => normalizeItem(raw, apiType, ym.slice(0,4), ym.slice(4,6))))
        )
      );

      const items = fetched.flat().filter(i => i.rent > 0 || (!IS_RENT[apiType] && i.price > 0));
      debugInfo.push(`${apiType}: ${items.length}건`);

      if (items.length > 0) usedTypes.push(apiType);
      allItems.push(...items);
      if (API_NOTES[apiType]) notes.push(API_NOTES[apiType]);
    }

    const stats   = calcStats(allItems, isRent);
    const samples = allItems
      .sort((a,b) => (b.contract||"").localeCompare(a.contract||""))
      .slice(0, 15);

    return Response.json({
      propertyType, apiTypes: usedTypes, isRent, months,
      totalCount: allItems.length, stats, samples, notes,
      lawdCd: lawdShort, debugInfo,
    });

  } catch (err) {
    console.error("molit error:", err.message);
    return Response.json({ error: err.message, stack: err.stack?.slice(0,300) }, { status: 500 });
  }
}
