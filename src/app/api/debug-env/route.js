export const runtime = "edge";
export async function GET() {
  const key = process.env.MOLIT_APT_RENT_KEY || "";
  const keyPreview = key ? key.slice(0,12) + "..." : "없음";

  let results = {};

  if (key) {
    // 테스트 1: 아파트 전월세, 마포구, 2024년 9월
    const urls = [
      { label: "apt_rent_encoded", url: `https://apis.data.go.kr/1613000/RTMSDataSvc/getRTMSDataSvcAptRent?serviceKey=${encodeURIComponent(key)}&LAWD_CD=11440&DEAL_YMD=202409&pageNo=1&numOfRows=3&_type=json` },
      { label: "apt_rent_raw",     url: `https://apis.data.go.kr/1613000/RTMSDataSvc/getRTMSDataSvcAptRent?serviceKey=${key}&LAWD_CD=11440&DEAL_YMD=202409&pageNo=1&numOfRows=3&_type=json` },
      { label: "apt_rent_xml",     url: `https://apis.data.go.kr/1613000/RTMSDataSvc/getRTMSDataSvcAptRent?serviceKey=${key}&LAWD_CD=11440&DEAL_YMD=202409&pageNo=1&numOfRows=3` },
    ];

    for (const { label, url } of urls) {
      try {
        const r = await fetch(url, { headers: { "Accept": "*/*" } });
        const body = await r.text();
        results[label] = { status: r.status, body: body.slice(0, 400) };
      } catch (e) {
        results[label] = { error: e.message };
      }
    }
  }

  return Response.json({ keyPreview, keyLen: key.length, results });
}
