// 국토부(MOLIT) 실거래 API 직접 호출 — 서버 전용 단일 지점.
// /api/market/molit 프록시와 /api/health 가 같은 함수를 쓴다. 헬스체크가 자기 자신을 HTTP 로 다시 부르지 않게 하여
// (호스트·인증·레이트리밋 등 자체 호출 변수 제거) "국토부가 실제로 무엇을 돌려줬는지"만 판정한다.
//
// 응답 분류:
//   ok        — resultCode 000/00 이고 본문 형식을 인식 (items 0건도 ok=true, totalCount 로 구분)
//   molitError — 국토부가 오류 코드를 돌려줌 (한도 초과·키 오류·점검 등)
//   unrecognized — HTTP 오류이거나 본문이 국토부 형식이 아님 (HTML 점검 페이지·게이트웨이 오류 등) → 호출자는 오류로 취급
import { parseMolitBody } from "./molitParse";

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

export function molitKeyFor(type) {
  const fallback = process.env.MOLIT_SERVICE_KEY;
  const map = {
    apt_rent: process.env.MOLIT_APT_RENT_KEY, apt_trade: process.env.MOLIT_APT_TRADE_KEY,
    villa_rent: process.env.MOLIT_VILLA_RENT_KEY, villa_trade: process.env.MOLIT_VILLA_TRADE_KEY,
    offi_rent: process.env.MOLIT_OFFI_RENT_KEY, offi_trade: process.env.MOLIT_OFFI_TRADE_KEY,
    house_rent: process.env.MOLIT_HOUSE_RENT_KEY, house_trade: process.env.MOLIT_HOUSE_TRADE_KEY,
    nrg_trade: process.env.MOLIT_NRG_TRADE_KEY, land_trade: process.env.MOLIT_LAND_TRADE_KEY,
  };
  return map[type] || fallback || null;
}
export function molitSupported(type) { return Boolean(URL_MAP[type]); }

export function buildMolitUrl({ type, lawdCd, dealYm, pageNo = "1", numOfRows = "100" }) {
  const url = new URL(URL_MAP[type]);
  url.searchParams.set("serviceKey", molitKeyFor(type));
  url.searchParams.set("LAWD_CD", lawdCd);
  url.searchParams.set("DEAL_YMD", dealYm);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(numOfRows));
  return url.toString();
}

// 본문 앞부분(진단용) — 서비스 키가 섞이지 않도록 URL 이 아니라 응답 본문만, 공백 정리 후 200자
const head = (text) => String(text || "").replace(/\s+/g, " ").trim().slice(0, 200);

/**
 * MOLIT 한 페이지 조회. 절대 throw 하지 않고 분류 결과를 돌려준다.
 * @returns {{ items:any[], totalCount:number, resultCode:string|null, resultMsg:string|null, molitError:string|null, httpStatus:number, bodyHead:string|null, ms:number }}
 */
export async function fetchMolitPage({ type, lawdCd, dealYm, pageNo = "1", numOfRows = "100", timeoutMs = 15000, cache = "no-store" }) {
  const t0 = Date.now();
  const empty = { items: [], totalCount: 0, resultCode: null, resultMsg: null, molitError: null, httpStatus: 0, bodyHead: null };
  if (!molitSupported(type)) return { ...empty, molitError: `지원하지 않는 타입: ${type}`, ms: 0 };
  if (!molitKeyFor(type)) return { ...empty, molitError: `${type} 서비스 키 미설정 (MOLIT_SERVICE_KEY 또는 MOLIT_${type.toUpperCase()}_KEY)`, ms: 0 };
  let res, text;
  try {
    res = await fetch(buildMolitUrl({ type, lawdCd, dealYm, pageNo, numOfRows }), { signal: AbortSignal.timeout(timeoutMs), cache });
    text = await res.text();
  } catch (e) {
    return { ...empty, molitError: `국토부 API 호출 실패: ${e?.name === "TimeoutError" ? `타임아웃 ${timeoutMs}ms` : e?.message || e}`, ms: Date.now() - t0 };
  }
  const httpStatus = res.status;
  const parsed = parseMolitBody(text);
  const codeMatch = text.match(/<resultCode>\s*([^<\s]+)\s*<\/resultCode>/i) || text.match(/<returnReasonCode>\s*([^<\s]+)\s*<\/returnReasonCode>/i) || text.match(/"resultCode"\s*:\s*"?([0-9A-Za-z]+)"?/);
  const msgMatch = text.match(/<resultMsg>\s*([\s\S]*?)\s*<\/resultMsg>/i) || text.match(/<returnAuthMsg>\s*([\s\S]*?)\s*<\/returnAuthMsg>/i) || text.match(/<errMsg>\s*([\s\S]*?)\s*<\/errMsg>/i) || text.match(/"resultMsg"\s*:\s*"([^"]*)"/);
  const totalMatch = text.match(/<totalCount>\s*(\d+)\s*<\/totalCount>/i) || text.match(/"totalCount"\s*:\s*"?(\d+)"?/);
  const resultCode = codeMatch ? codeMatch[1] : null;
  const resultMsg = msgMatch ? msgMatch[1].trim() : null;
  const totalCount = totalMatch ? parseInt(totalMatch[1], 10) : parsed.items.length;
  const base = { items: parsed.items, totalCount, resultCode, resultMsg, httpStatus, ms: Date.now() - t0 };

  if (parsed.error) return { ...base, molitError: parsed.error, bodyHead: head(text) };
  // HTTP 오류 또는 국토부 형식이 아닌 본문(점검 HTML·게이트웨이 오류 등): 0건으로 오인하지 않도록 오류로 분류
  if (!res.ok || (parsed.items.length === 0 && resultCode === null && !totalMatch)) {
    return { ...base, molitError: `국토부 응답 형식 인식 불가 (HTTP ${httpStatus}${res.headers.get("content-type") ? `, ${res.headers.get("content-type")}` : ""})`, bodyHead: head(text) };
  }
  return { ...base, molitError: null, bodyHead: parsed.items.length === 0 ? head(text) : null };
}
