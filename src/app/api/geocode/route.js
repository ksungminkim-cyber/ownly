export const runtime = "edge";

// 주요 시군구 → 법정동코드 매핑 (카카오 API 없을 때 fallback)
const SIGUNGU_CODE_MAP = {
  // 서울
  "종로구":"11110","중구":"11140","용산구":"11170","성동구":"11200","광진구":"11215",
  "동대문구":"11230","중랑구":"11260","성북구":"11290","강북구":"11305","도봉구":"11320",
  "노원구":"11350","은평구":"11380","서대문구":"11410","마포구":"11440","양천구":"11470",
  "강서구":"11500","구로구":"11530","금천구":"11545","영등포구":"11560","동작구":"11590",
  "관악구":"11620","서초구":"11650","강남구":"11680","송파구":"11710","강동구":"11740",
  // 경기
  "수원시":"41110","성남시":"41130","의정부시":"41150","안양시":"41170","부천시":"41190",
  "광명시":"41210","평택시":"41220","동두천시":"41250","안산시":"41270","고양시":"41280",
  "과천시":"41290","구리시":"41310","남양주시":"41360","오산시":"41370","시흥시":"41390",
  "군포시":"41410","의왕시":"41430","하남시":"41450","용인시":"41460","파주시":"41480",
  "이천시":"41500","안성시":"41550","김포시":"41570","화성시":"41590","광주시":"41610",
  // 인천
  "중구":"28110","동구":"28140","미추홀구":"28177","연수구":"28185","남동구":"28200",
  "부평구":"28237","계양구":"28245","서구":"28260","강화군":"28710","옹진군":"28720",
  // 부산
  "중구":"26110","서구":"26140","동구":"26170","영도구":"26200","부산진구":"26230",
  "동래구":"26260","남구":"26290","북구":"26320","해운대구":"26350","사하구":"26380",
  "금정구":"26410","강서구":"26440","연제구":"26470","수영구":"26500","사상구":"26530",
};

function extractSigunguFromAddress(address) {
  for (const [name, code] of Object.entries(SIGUNGU_CODE_MAP)) {
    if (address.includes(name)) return { sigunguCode: code, sigunguName: name };
  }
  return null;
}

function extractRegionNames(address) {
  const sidoList = ["서울","부산","대구","인천","광주","대전","울산","세종","경기","강원","충북","충남","전북","전남","경북","경남","제주"];
  let sidoName = "", sigunguName = "", dongName = "";
  for (const sido of sidoList) {
    if (address.includes(sido)) { sidoName = sido; break; }
  }
  const match = address.match(/([가-힣]+[시군구])\s/);
  if (match) sigunguName = match[1];
  const dongMatch = address.match(/([가-힣\d]+[동읍면리])/);
  if (dongMatch) dongName = dongMatch[1];
  return { sidoName, sigunguName, dongName };
}

export async function POST(req) {
  try {
    const { address } = await req.json();
    if (!address) return Response.json({ error: "주소가 필요합니다." }, { status: 400 });

    // 카카오 API 시도
    const kakaoKey = process.env.KAKAO_REST_API_KEY || process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (kakaoKey) {
      try {
        const res = await fetch(
          `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}&page=1&size=1`,
          { headers: { "Authorization": `KakaoAK ${kakaoKey}` } }
        );
        const data = await res.json();
        const doc = data?.documents?.[0];
        if (doc) {
          const addr = doc.road_address || doc.address;
          const bcode = addr?.b_code || addr?.region_3depth_h_code || "";
          return Response.json({
            bcode,
            sigunguCode: bcode.slice(0, 5),
            sidoName:    addr?.region_1depth_name || "",
            sigunguName: addr?.region_2depth_name || "",
            dongName:    addr?.region_3depth_name || addr?.region_3depth_h_name || "",
            fullAddress: doc.address_name,
            x: doc.x, y: doc.y,
            source: "kakao",
          });
        }
      } catch (e) {
        console.warn("카카오 API 실패, fallback 사용:", e.message);
      }
    }

    // Fallback: 주소 문자열에서 시군구 추출
    const fallback = extractSigunguFromAddress(address);
    const regions  = extractRegionNames(address);
    if (fallback) {
      return Response.json({
        bcode: fallback.sigunguCode + "00000",
        sigunguCode: fallback.sigunguCode,
        sidoName:    regions.sidoName,
        sigunguName: fallback.sigunguName,
        dongName:    regions.dongName,
        fullAddress: address,
        source: "fallback",
      });
    }

    return Response.json({ error: "주소에서 지역 코드를 추출할 수 없습니다." }, { status: 404 });

  } catch (err) {
    return Response.json({ error: "주소 변환 오류: " + err.message }, { status: 500 });
  }
}
