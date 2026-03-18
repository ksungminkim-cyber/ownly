export const runtime = "edge";
export async function GET() {
  return Response.json({
    has_apt_rent: !!process.env.MOLIT_APT_RENT_KEY,
    has_villa:    !!process.env.MOLIT_VILLA_RENT_KEY,
    has_house:    !!process.env.MOLIT_HOUSE_RENT_KEY,
    apt_rent_len: process.env.MOLIT_APT_RENT_KEY?.length || 0,
    // URL 테스트
    test_url: `https://apis.data.go.kr/1613000/RTMSDataSvc/getRTMSDataSvcAptRent?serviceKey=TEST&LAWD_CD=11440&DEAL_YMD=202509&pageNo=1&numOfRows=3&_type=json`,
  });
}
