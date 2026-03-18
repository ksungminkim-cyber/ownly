export const runtime = "edge";
export async function GET() {
  const key = process.env.MOLIT_APT_RENT_KEY || "";

  // 키 앞 10자리만 노출
  const keyPreview = key ? key.slice(0,10) + "..." : "없음";
  const keyLen     = key.length;

  // 디코딩된 키로 직접 호출
  let apiResult = null;
  let apiError  = null;
  if (key) {
    try {
      // 방법 1: encodeURIComponent 사용
      const url1 = `https://apis.data.go.kr/1613000/RTMSDataSvc/getRTMSDataSvcAptRent?serviceKey=${encodeURIComponent(key)}&LAWD_CD=11440&DEAL_YMD=202509&pageNo=1&numOfRows=3&_type=json`;
      const r1 = await fetch(url1, { headers: { Accept: "application/json" } });
      const t1 = await r1.text();
      const isXml1 = t1.trim().startsWith("<");

      // 방법 2: 키 그대로 (디코딩된 키 사용)
      const url2 = `https://apis.data.go.kr/1613000/RTMSDataSvc/getRTMSDataSvcAptRent?serviceKey=${key}&LAWD_CD=11440&DEAL_YMD=202509&pageNo=1&numOfRows=3&_type=json`;
      const r2 = await fetch(url2, { headers: { Accept: "application/json" } });
      const t2 = await r2.text();
      const isXml2 = t2.trim().startsWith("<");

      apiResult = {
        method1_encoded: {
          status: r1.status,
          isXml: isXml1,
          preview: t1.slice(0, 300),
        },
        method2_raw: {
          status: r2.status,
          isXml: isXml2,
          preview: t2.slice(0, 300),
        },
      };
    } catch (e) {
      apiError = e.message;
    }
  }

  return Response.json({ keyPreview, keyLen, apiResult, apiError });
}
