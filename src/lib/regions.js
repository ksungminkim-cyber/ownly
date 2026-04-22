// 구·시 → LAWD_CD (법정동코드) 매핑
// MOLIT 실거래가 API 호출 시 필요
export const LAWD_MAP = {
  "서울 강남구": "11680", "서울 서초구": "11650", "서울 송파구": "11710",
  "서울 강동구": "11740", "서울 마포구": "11440", "서울 용산구": "11170",
  "서울 성동구": "11200", "서울 광진구": "11215", "서울 동작구": "11590",
  "서울 영등포구": "11560", "서울 양천구": "11470", "서울 강서구": "11500",
  "서울 구로구": "11530", "서울 금천구": "11545", "서울 관악구": "11620",
  "서울 서대문구": "11410", "서울 은평구": "11380", "서울 종로구": "11110",
  "서울 중구": "11140", "서울 노원구": "11350", "서울 도봉구": "11320",
  "서울 강북구": "11305", "서울 성북구": "11290", "서울 동대문구": "11230",
  "서울 중랑구": "11260",
  "경기 성남시": "41130", "경기 수원시": "41110", "경기 용인시": "41460",
  "경기 고양시": "41280", "경기 화성시": "41590", "경기 안양시": "41170",
  "경기 부천시": "41190",
  "부산 해운대구": "26350", "부산 수영구": "26500",
  "인천 연수구": "28185", "인천 송도": "28185",
};

// 주소 문자열에서 LAWD 코드 추출 (예: "서울 마포구 연남동 123" → "11440")
export function findLawdCodeFromAddr(addr) {
  if (!addr || typeof addr !== "string") return null;
  for (const region of Object.keys(LAWD_MAP)) {
    if (addr.includes(region) || addr.startsWith(region)) return LAWD_MAP[region];
    // "서울 강남구" 중 "강남구"만으로 매칭
    const guPart = region.split(" ").slice(-1)[0];
    if (addr.includes(guPart) && addr.includes(region.split(" ")[0])) return LAWD_MAP[region];
  }
  return null;
}

// 주소에서 사람이 읽을 지역명 추출 (예: "서울 마포구 연남동 123" → "서울 마포구")
export function findRegionFromAddr(addr) {
  if (!addr || typeof addr !== "string") return null;
  for (const region of Object.keys(LAWD_MAP)) {
    if (addr.includes(region)) return region;
    const guPart = region.split(" ").slice(-1)[0];
    if (addr.includes(guPart) && addr.includes(region.split(" ")[0])) return region;
  }
  return null;
}
