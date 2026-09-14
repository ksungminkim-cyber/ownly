// src/app/api/market/molit/route.js
// 국토부 실거래가 API 통합 엔드포인트 — 실제 호출·파싱은 src/lib/molitFetch.js (헬스체크와 동일 경로)
//
// 응답: { items, totalCount, type, lawdCd, dealYm, resultCode, resultMsg, molitError, httpStatus, bodyHead }
//  - molitError 가 있으면 국토부 오류(한도 초과·키 오류·점검·형식 불일치). 호환을 위해 HTTP 200 유지.
//  - items 가 0건일 때만 bodyHead(응답 본문 앞 200자)를 실어 "진짜 0건"과 "이상 응답"을 구분할 수 있게 한다.

import { isRateLimited } from "../../../../lib/ratelimit";
import { fetchMolitPage, molitSupported, molitKeyFor } from "../../../../lib/molitFetch";

export async function GET(req) {
  if (isRateLimited(req, "molit", 120)) return Response.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "apt_rent";
  const lawdCd = searchParams.get("lawdCd");
  const dealYm = searchParams.get("dealYm");
  const pageNo = searchParams.get("pageNo") || "1";
  const numOfRows = searchParams.get("numOfRows") || "100";

  if (!lawdCd || !dealYm) return Response.json({ error: "lawdCd, dealYm 필수" }, { status: 400 });
  if (!molitSupported(type)) return Response.json({ error: `지원하지 않는 타입: ${type}` }, { status: 400 });
  if (!molitKeyFor(type)) {
    return Response.json({ error: `${type} 용 서비스 키가 설정되지 않았습니다. 환경변수 MOLIT_SERVICE_KEY 또는 MOLIT_${type.toUpperCase()}_KEY 를 설정하세요.` }, { status: 500 });
  }

  const r = await fetchMolitPage({ type, lawdCd, dealYm, pageNo, numOfRows, timeoutMs: 20000 });
  if (r.molitError) console.warn("[market/molit]", type, lawdCd, dealYm, r.molitError, r.bodyHead ? `| ${r.bodyHead.slice(0, 120)}` : "");
  return Response.json({ items: r.items, totalCount: r.totalCount, type, lawdCd, dealYm, resultCode: r.resultCode, resultMsg: r.resultMsg, molitError: r.molitError, httpStatus: r.httpStatus, bodyHead: r.bodyHead });
}
