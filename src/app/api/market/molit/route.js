// src/app/api/market/molit/route.js
// 국토부 실거래가 API 통합 엔드포인트

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "apt_rent"; // apt_rent | apt_trade | villa_rent | villa_trade | offi_rent
  const lawdCd = searchParams.get("lawdCd"); // 법정동코드 5자리
  const dealYm = searchParams.get("dealYm"); // YYYYMM
  const pageNo = searchParams.get("pageNo") || "1";
  const numOfRows = searchParams.get("numOfRows") || "100";

  if (!lawdCd || !dealYm) {
    return Response.json({ error: "lawdCd, dealYm 필수" }, { status: 400 });
  }

  const KEY_MAP = {
    apt_rent:   process.env.MOLIT_APT_RENT_KEY,
    apt_trade:  process.env.MOLIT_APT_TRADE_KEY,
    villa_rent: process.env.MOLIT_VILLA_RENT_KEY,
    offi_rent:  process.env.MOLIT_OFFI_RENT_KEY,
    house_rent: process.env.MOLIT_HOUSE_RENT_KEY,
  };

  const URL_MAP = {
    apt_rent:   "http://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
    apt_trade:  "http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTradeDev",
    villa_rent: "http://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
    offi_rent:  "http://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
    house_rent: "http://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent",
  };

  const serviceKey = KEY_MAP[type];
  const baseUrl = URL_MAP[type];

  if (!serviceKey || !baseUrl) {
    return Response.json({ error: "지원하지 않는 타입" }, { status: 400 });
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
