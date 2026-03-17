export const runtime = "edge";

// ─────────────────────────────────────────────────────
// API 설정 맵
// ─────────────────────────────────────────────────────
const API_CONFIG = {
  "아파트-전월세": {
    key:      () => process.env.MOLIT_APT_RENT_KEY,
    endpoint: "getRTMSDataSvcAptRent",
    isRent:   true,
    fields:   { name:"아파트", area:"전용면적", deposit:"보증금액", rent:"월세금액", floor:"층", built:"건축년도", dong:"법정동" },
  },
  "아파트-매매": {
    key:      () => process.env.MOLIT_APT_TRADE_KEY,
    endpoint: "getRTMSDataSvcAptTradeDev",
    isRent:   false,
    fields:   { name:"아파트", area:"전용면적", price:"거래금액", floor:"층", built:"건축년도", dong:"법정동" },
    yieldRate: 0.04,  // 4% 수익률로 임대료 역산
  },
  "오피스텔-전월세": {
    key:      () => process.env.MOLIT_OFFI_RENT_KEY,
    endpoint: "getRTMSDataSvcOffiRent",
    isRent:   true,
    fields:   { name:"단지명", area:"전용면적", deposit:"보증금", rent:"월세", floor:"층", built:"건축년도", dong:"법정동" },
  },
  "연립다세대-전월세": {
    key:      () => process.env.MOLIT_VILLA_RENT_KEY,
    endpoint: "getRTMSDataSvcRHRent",
    isRent:   true,
    fields:   { name:"연립다세대", area:"전용면적", deposit:"보증금액", rent:"월세금액", floor:"층", built:"건축년도", dong:"법정동" },
  },
  "단독다가구-전월세": {
    key:      () => process.env.MOLIT_HOUSE_RENT_KEY,
    endpoint: "getRTMSDataSvcSHRent",
    isRent:   true,
    fields:   { name:"지역", area:"전용면적", deposit:"보증금액", rent:"월세금액", floor:"층", built:null, dong:"지역" },
  },
  "상업업무용-매매": {
    key:      () => process.env.MOLIT_COMMERCIAL_KEY,
    endpoint: "getRTMSDataSvcNrgTrade",
    isRent:   false,
    fields:   { name:"건물명", area:"전용면적", price:"거래금액", floor:"층", built:"건축년도", dong:"법정동" },
    yieldRate: 0.035,  // 상가 통상 3.5% 수익률
    note:     "상업용 부동산은 전월세 실거래가 미공개 — 매매가 기준 수익률 3.5% 역산값입니다",
  },
  "토지-매매": {
    key:      () => process.env.MOLIT_LAND_KEY,
    endpoint: "getRTMSDataSvcLandTrade",
    isRent:   false,
    fields:   { name:"지역", area:"대지면적", price:"거래금액", floor:null, built:null, dong:"지역" },
    yieldRate: 0.02,   // 토지 임대 수익률 낮음 (2%)
    note:     "토지는 임대 수익률 추정이 어렵습니다. 매매가 기준 2% 역산값으로 참고용으로만 활용하세요",
  },
  "공장창고-매매": {
    key:      () => process.env.MOLIT_FACTORY_KEY,
    endpoint: "getRTMSDataSvcFctTrade",
    isRent:   false,
    fields:   { name:"공장명", area:"전용면적", price:"거래금액", floor:"층", built:null, dong:"법정동" },
    yieldRate: 0.05,   // 공장창고 5% 수익률
    note:     "공장·창고는 전월세 실거래가 미공개 — 매매가 기준 수익률 5% 역산값입니다",
  },
};

// ─────────────────────────────────────────────────────
// Ownly 유형 → API 목록 매핑 (복수 병합 지원)
// ─────────────────────────────────────────────────────
const TYPE_TO_APIS = {
  "주거":    ["아파트-전월세", "연립다세대-전월세", "단독다가구-전월세"],
  "오피스텔": ["오피스텔-전월세"],
  "상가":    ["상업업무용-매매"],
  "토지":    ["토지-매매"],
  "공장":    ["공장창고-매매"],
};

// ─────────────────────────────────────────────────────
// 국토부 API 신고 지연: 현재 기준 2~7개월 전 데이터 조회
// ─────────────────────────────────────────────────────
function getRecentMonths(count = 5) {
  const months = [];
  const now = new Date();
  for (let i = 2; i < count + 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

// ─────────────────────────────────────────────────────
// 단일 API 호출
// ─────────────────────────────────────────────────────
async function fetchOne(endpoint, apiKey, lawdCd, dealYmd) {
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

// ─────────────────────────────────────────────────────
// 아이템 정규화 — API 설정의 fields 기반으로 통합
// ─────────────────────────────────────────────────────
function normalizeItem(raw, config, apiType, year, month) {
  const f = config.fields;
  const toNum = v => parseInt(String(v || "0").replace(/,/g, "")) || 0;
  const toFloat = v => parseFloat(v || "0") || 0;

  const areaSqm   = toFloat(raw[f.area]);
  const areaPy    = areaSqm > 0 ? Math.round(areaSqm / 3.306 * 10) / 10 : 0;

  const base = {
    apiType,
    name:      (f.name ? raw[f.name] : null) || raw["건물명"] || raw["단지명"] || raw["아파트"] || "-",
    dong:      (f.dong ? raw[f.dong] : null) || raw["법정동"] || raw["지역"] || "",
    floor:     f.floor ? String(raw[f.floor] || "-").replace("층","") : null,  // "층" 제거
    builtYear: f.built ? String(raw[f.built] || "") : "",
    contract:  `${year}-${String(month).padStart(2,"0")}`,
    areaSqm:   Math.round(areaSqm * 10) / 10,
    areaPy,
  };

  if (config.isRent) {
    // 전월세: 직접 임대료
    const deposit = toNum(raw[f.deposit]);
    const rent    = toNum(raw[f.rent]);
    return {
      ...base,
      deposit,
      rent,
      type:          rent > 0 ? "월세" : "전세",
      rentPerPy:     areaPy > 0 && rent > 0 ? Math.round(rent / areaPy * 10) / 10 : null,
      depositPerPy:  areaPy > 0 && deposit > 0 ? Math.round(deposit / areaPy) : null,
    };
  } else {
    // 매매: 임대료 역산
    const price    = toNum(raw[f.price]);
    const yield_   = config.yieldRate || 0.04;
    const estRent  = price > 0 ? Math.round(price * yield_ / 12) : 0;  // 연수익률로 월 임대료 역산
    const pricePerPy = areaPy > 0 && price > 0 ? Math.round(price / areaPy) : null;
    const rentPerPy  = areaPy > 0 && estRent > 0 ? Math.round(estRent / areaPy * 10) / 10 : null;
    return {
      ...base,
      price,
      pricePerPy,
      estRent,          // 역산 임대료
      rentPerPy,        // 역산 평당 임대료
      yieldRate: yield_,
      deposit:   null,
      rent:      estRent,
      type:      "매매역산",
    };
  }
}

// ─────────────────────────────────────────────────────
// 통계 계산
// ─────────────────────────────────────────────────────
function calcStats(items, isRent) {
  const valid = items.filter(i => (isRent ? i.rent > 0 || i.deposit > 0 : i.price > 0 || i.estRent > 0));
  if (!valid.length) return null;

  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
  const rents    = valid.map(i => i.rent  || i.estRent || 0).filter(Boolean);
  const deposits = valid.map(i => i.deposit).filter(Boolean);
  const perPy    = valid.map(i => i.rentPerPy).filter(Boolean);
  const areas    = valid.map(i => i.areaPy).filter(Boolean);
  const prices   = valid.map(i => i.price).filter(Boolean);

  return {
    count:         valid.length,
    isRent,
    // 임대료
    avgRent:       avg(rents),
    minRent:       rents.length ? Math.min(...rents) : 0,
    maxRent:       rents.length ? Math.max(...rents) : 0,
    // 보증금
    avgDeposit:    avg(deposits),
    minDeposit:    deposits.length ? Math.min(...deposits) : 0,
    maxDeposit:    deposits.length ? Math.max(...deposits) : 0,
    // 평당 임대료
    avgRentPerPy:  perPy.length ? Math.round(perPy.reduce((a,b)=>a+b,0)/perPy.length * 10)/10 : null,
    minRentPerPy:  perPy.length ? Math.min(...perPy) : null,
    maxRentPerPy:  perPy.length ? Math.max(...perPy) : null,
    // 면적
    avgAreaPy:     areas.length ? Math.round(areas.reduce((a,b)=>a+b,0)/areas.length * 10)/10 : null,
    avgAreaSqm:    areas.length ? Math.round(areas.reduce((a,b)=>a+b,0)/areas.length * 3.306 * 10)/10 : null,
    // 매매 (비임대 유형)
    avgPrice:      avg(prices),
    minPrice:      prices.length ? Math.min(...prices) : 0,
    maxPrice:      prices.length ? Math.max(...prices) : 0,
    avgPricePerPy: valid.map(i=>i.pricePerPy).filter(Boolean).length
                   ? Math.round(valid.map(i=>i.pricePerPy).filter(Boolean).reduce((a,b)=>a+b,0)/valid.map(i=>i.pricePerPy).filter(Boolean).length)
                   : null,
    // 타입 분포
    wolseCount:  valid.filter(i=>i.type==="월세").length,
    jeonseCount: valid.filter(i=>i.type==="전세").length,
    tradeCount:  valid.filter(i=>i.type==="매매역산").length,
  };
}

// ─────────────────────────────────────────────────────
// 메인 핸들러
// ─────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { lawdCd, propertyType = "주거" } = await req.json();
    if (!lawdCd) return Response.json({ error: "법정동코드 필요" }, { status: 400 });

    const apiTypes = TYPE_TO_APIS[propertyType] || TYPE_TO_APIS["주거"];
    const months   = getRecentMonths(5);
    const lawdShort = String(lawdCd).slice(0, 5);

    // 모든 API 병렬 호출
    const allItems = [];
    const usedApiTypes = [];
    const notes = [];

    for (const apiType of apiTypes) {
      const config = API_CONFIG[apiType];
      const apiKey = config.key();
      if (!apiKey) { notes.push(`${apiType} API 키 미설정`); continue; }

      const results = await Promise.all(
        months.map(ym => {
          const [yr, mo] = [ym.slice(0,4), ym.slice(4,6)];
          return fetchOne(config.endpoint, apiKey, lawdShort, ym)
            .then(items => items.map(raw => normalizeItem(raw, config, apiType, yr, mo)));
        })
      );

      const items = results.flat().filter(i =>
        config.isRent ? (i.rent > 0 || i.deposit > 0) : (i.price > 0)
      );

      allItems.push(...items);
      if (items.length > 0) usedApiTypes.push(apiType);
      if (config.note) notes.push(config.note);
    }

    const isRent = apiTypes.some(t => API_CONFIG[t].isRent);
    const stats  = calcStats(allItems, isRent);
    const samples = allItems
      .sort((a,b) => (b.contract||"").localeCompare(a.contract||""))
      .slice(0, 15);

    return Response.json({
      propertyType,
      apiTypes: usedApiTypes,
      isRent,
      months,
      totalCount: allItems.length,
      stats,
      samples,
      notes,
      lawdCd: lawdShort,
    });

  } catch (err) {
    console.error("국토부 API 오류:", err.message);
    return Response.json({ error: "실거래가 조회 오류: " + err.message }, { status: 500 });
  }
}
