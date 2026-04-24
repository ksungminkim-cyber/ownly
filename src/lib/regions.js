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

// ─── 공개 시세 페이지(/sise)용 카탈로그 ───
// SEO slug + 그룹핑 포함
export const REGIONS = [
  // 서울 (25개구)
  { code: "11110", slug: "seoul-jongno",    name: "서울 종로구",   sido: "서울특별시", sigungu: "종로구",   region: "seoul" },
  { code: "11140", slug: "seoul-junggu",    name: "서울 중구",     sido: "서울특별시", sigungu: "중구",     region: "seoul" },
  { code: "11170", slug: "seoul-yongsan",   name: "서울 용산구",   sido: "서울특별시", sigungu: "용산구",   region: "seoul" },
  { code: "11200", slug: "seoul-seongdong", name: "서울 성동구",   sido: "서울특별시", sigungu: "성동구",   region: "seoul" },
  { code: "11215", slug: "seoul-gwangjin",  name: "서울 광진구",   sido: "서울특별시", sigungu: "광진구",   region: "seoul" },
  { code: "11230", slug: "seoul-dongdaemun", name: "서울 동대문구", sido: "서울특별시", sigungu: "동대문구", region: "seoul" },
  { code: "11260", slug: "seoul-jungnang",  name: "서울 중랑구",   sido: "서울특별시", sigungu: "중랑구",   region: "seoul" },
  { code: "11290", slug: "seoul-seongbuk",  name: "서울 성북구",   sido: "서울특별시", sigungu: "성북구",   region: "seoul" },
  { code: "11305", slug: "seoul-gangbuk",   name: "서울 강북구",   sido: "서울특별시", sigungu: "강북구",   region: "seoul" },
  { code: "11320", slug: "seoul-dobong",    name: "서울 도봉구",   sido: "서울특별시", sigungu: "도봉구",   region: "seoul" },
  { code: "11350", slug: "seoul-nowon",     name: "서울 노원구",   sido: "서울특별시", sigungu: "노원구",   region: "seoul" },
  { code: "11380", slug: "seoul-eunpyeong", name: "서울 은평구",   sido: "서울특별시", sigungu: "은평구",   region: "seoul" },
  { code: "11410", slug: "seoul-seodaemun", name: "서울 서대문구", sido: "서울특별시", sigungu: "서대문구", region: "seoul" },
  { code: "11440", slug: "seoul-mapo",      name: "서울 마포구",   sido: "서울특별시", sigungu: "마포구",   region: "seoul" },
  { code: "11470", slug: "seoul-yangcheon", name: "서울 양천구",   sido: "서울특별시", sigungu: "양천구",   region: "seoul" },
  { code: "11500", slug: "seoul-gangseo",   name: "서울 강서구",   sido: "서울특별시", sigungu: "강서구",   region: "seoul" },
  { code: "11530", slug: "seoul-guro",      name: "서울 구로구",   sido: "서울특별시", sigungu: "구로구",   region: "seoul" },
  { code: "11545", slug: "seoul-geumcheon", name: "서울 금천구",   sido: "서울특별시", sigungu: "금천구",   region: "seoul" },
  { code: "11560", slug: "seoul-yeongdeungpo", name: "서울 영등포구", sido: "서울특별시", sigungu: "영등포구", region: "seoul" },
  { code: "11590", slug: "seoul-dongjak",   name: "서울 동작구",   sido: "서울특별시", sigungu: "동작구",   region: "seoul" },
  { code: "11620", slug: "seoul-gwanak",    name: "서울 관악구",   sido: "서울특별시", sigungu: "관악구",   region: "seoul" },
  { code: "11650", slug: "seoul-seocho",    name: "서울 서초구",   sido: "서울특별시", sigungu: "서초구",   region: "seoul" },
  { code: "11680", slug: "seoul-gangnam",   name: "서울 강남구",   sido: "서울특별시", sigungu: "강남구",   region: "seoul" },
  { code: "11710", slug: "seoul-songpa",    name: "서울 송파구",   sido: "서울특별시", sigungu: "송파구",   region: "seoul" },
  { code: "11740", slug: "seoul-gangdong",  name: "서울 강동구",   sido: "서울특별시", sigungu: "강동구",   region: "seoul" },

  // 경기 핵심
  { code: "41135", slug: "seongnam-bundang", name: "성남 분당구",   sido: "경기도", sigungu: "성남시 분당구", region: "gyeonggi" },
  { code: "41131", slug: "seongnam-sujeong", name: "성남 수정구",   sido: "경기도", sigungu: "성남시 수정구", region: "gyeonggi" },
  { code: "41133", slug: "seongnam-jungwon", name: "성남 중원구",   sido: "경기도", sigungu: "성남시 중원구", region: "gyeonggi" },
  { code: "41285", slug: "goyang-ilsandong", name: "고양 일산동구", sido: "경기도", sigungu: "고양시 일산동구", region: "gyeonggi" },
  { code: "41287", slug: "goyang-ilsanseo",  name: "고양 일산서구", sido: "경기도", sigungu: "고양시 일산서구", region: "gyeonggi" },
  { code: "41281", slug: "goyang-deogyang",  name: "고양 덕양구",   sido: "경기도", sigungu: "고양시 덕양구", region: "gyeonggi" },
  { code: "41463", slug: "yongin-giheung",   name: "용인 기흥구",   sido: "경기도", sigungu: "용인시 기흥구", region: "gyeonggi" },
  { code: "41465", slug: "yongin-suji",      name: "용인 수지구",   sido: "경기도", sigungu: "용인시 수지구", region: "gyeonggi" },
  { code: "41117", slug: "suwon-yeongtong",  name: "수원 영통구",   sido: "경기도", sigungu: "수원시 영통구", region: "gyeonggi" },
  { code: "41115", slug: "suwon-paldal",     name: "수원 팔달구",   sido: "경기도", sigungu: "수원시 팔달구", region: "gyeonggi" },
  { code: "41195", slug: "anyang-dongan",    name: "안양 동안구",   sido: "경기도", sigungu: "안양시 동안구", region: "gyeonggi" },
  { code: "41570", slug: "gimpo",            name: "김포시",        sido: "경기도", sigungu: "김포시",        region: "gyeonggi" },
  { code: "41590", slug: "hwaseong",         name: "화성시",        sido: "경기도", sigungu: "화성시",        region: "gyeonggi" },

  // 광역시
  { code: "26290", slug: "busan-haeundae", name: "부산 해운대구", sido: "부산광역시", sigungu: "해운대구", region: "busan" },
  { code: "26230", slug: "busan-busanjin", name: "부산진구",       sido: "부산광역시", sigungu: "부산진구", region: "busan" },
  { code: "27170", slug: "daegu-suseong",  name: "대구 수성구",   sido: "대구광역시", sigungu: "수성구",   region: "daegu" },
  { code: "28245", slug: "incheon-yeonsu", name: "인천 연수구",   sido: "인천광역시", sigungu: "연수구",   region: "incheon" },
  { code: "28260", slug: "incheon-namdong", name: "인천 남동구",  sido: "인천광역시", sigungu: "남동구",   region: "incheon" },
  { code: "30230", slug: "daejeon-yuseong", name: "대전 유성구",  sido: "대전광역시", sigungu: "유성구",   region: "daejeon" },
];

export const REGION_GROUPS = {
  seoul:    { label: "서울특별시",   emoji: "🏙️", order: 1 },
  gyeonggi: { label: "경기도",        emoji: "🏘️", order: 2 },
  incheon:  { label: "인천광역시",   emoji: "✈️", order: 3 },
  busan:    { label: "부산광역시",   emoji: "🌊", order: 4 },
  daegu:    { label: "대구광역시",   emoji: "🏛️", order: 5 },
  daejeon:  { label: "대전광역시",   emoji: "🔬", order: 6 },
  gwangju:  { label: "광주광역시",   emoji: "🌸", order: 7 },
};

export function findRegionBySlug(slug) {
  return REGIONS.find(r => r.slug === slug) || null;
}

export function groupRegions() {
  const groups = {};
  REGIONS.forEach(r => {
    if (!groups[r.region]) groups[r.region] = [];
    groups[r.region].push(r);
  });
  return groups;
}
