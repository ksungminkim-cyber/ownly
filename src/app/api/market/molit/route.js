// src/app/api/market/molit/route.js
// 국토부 실거래가 API 통합 엔드포인트

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "apt_rent";
  const lawdCd = searchParams.get("lawdCd");
  const dealYm = searchParams.get("dealYm");
  const pageNo = searchParams.get("pageNo") || "1";
  const numOfRows = searchParams.get("numOfRows") || "100";

  if (!lawdCd || !dealYm) {
    return Response.json({ error: "lawdCd, dealYm 필수" }, { status: 400 });
  }

  // 공통 서비스 키 fallback — 유형별 키 미설정 시 MOLIT_SERVICE_KEY 사용
  const fallback = process.env.MOLIT_SERVICE_KEY;
  const KEY_MAP = {
    apt_rent:     process.env.MOLIT_APT_RENT_KEY     || fallback,
    apt_trade:    process.env.MOLIT_APT_TRADE_KEY    || fallback,
    villa_rent:   process.env.MOLIT_VILLA_RENT_KEY   || fallback,
    villa_trade:  process.env.MOLIT_VILLA_TRADE_KEY  || fallback,
    offi_rent:    process.env.MOLIT_OFFI_RENT_KEY    || fallback,
    offi_trade:   process.env.MOLIT_OFFI_TRADE_KEY   || fallback,
    house_rent:   process.env.MOLIT_HOUSE_RENT_KEY   || fallback,
    house_trade:  process.env.MOLIT_HOUSE_TRADE_KEY  || fallback,
    nrg_trade:    process.env.MOLIT_NRG_TRADE_KEY    || fallback,   // 상업·업무용 매매
    land_trade:   process.env.MOLIT_LAND_TRADE_KEY   || fallback,   // 토지 매매
  };

  const URL_MAP = {
    apt_rent:    "http://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
    apt_trade:   "http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTradeDev",
    villa_rent:  "http://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
    villa_trade: "http://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade",
    offi_rent:   "http://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
    offi_trade:  "http://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade",
    house_rent:  "http://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent",
    house_trade: "http://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade",
    nrg_trade:   "http://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade",
    land_trade:  "http://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade",
  };

  const serviceKey = KEY_MAP[type];
  const baseUrl = URL_MAP[type];

  if (!baseUrl) {
    return Response.json({ error: `지원하지 않는 타입: ${type}` }, { status: 400 });
  }
  if (!serviceKey) {
    return Response.json({
      error: `${type} 용 서비스 키가 설정되지 않았습니다. 환경변수 MOLIT_SERVICE_KEY 또는 MOLIT_${type.toUpperCase()}_KEY 를 설정하세요.`,
    }, { status: 500 });
  }

  const url = new URL(baseUrl);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("LAWD_CD", lawdCd);
  url.searchParams.set("DEAL_YMD", dealYm);
  url.searchParams.set("pageNo", pageNo);
  url.searchParams.set("numOfRows", numOfRows);

  try {
    const res = await fetch(url.toString());
    const xml = await res.text();

    // XML → JSON 파싱
    const items = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const itemXml = match[1];
      const obj = {};
      const fields = itemXml.matchAll(/<(\w+)>\s*([\s\S]*?)\s*<\/\1>/g);
      for (const [, key, val] of fields) {
        obj[key] = val.trim();
      }
      items.push(obj);
    }

    // totalCount 추출
    const totalMatch = xml.match(/<totalCount>(\d+)<\/totalCount>/);
    const totalCount = totalMatch ? parseInt(totalMatch[1]) : items.length;

    return Response.json({ items, totalCount, type, lawdCd, dealYm });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
