export const runtime = "edge";

// 주요 시군구 → 법정동코드 매핑 (카카오 API 없을 때 fallback)
// 구 이름이 시도마다 겹치므로(중구·서구·동구·강서구) 시도별로 나눠 둔다
const SIGUNGU_CODE_MAP = {
  "서울": {
  "종로구":"11110","중구":"11140","용산구":"11170","성동구":"11200","광진구":"11215",
  "동대문구":"11230","중랑구":"11260","성북구":"11290","강북구":"11305","도봉구":"11320",
  "노원구":"11350","은평구":"11380","서대문구":"11410","마포구":"11440","양천구":"11470",
  "강서구":"11500","구로구":"11530","금천구":"11545","영등포구":"11560","동작구":"11590",
  "관악구":"11620","서초구":"11650","강남구":"11680","송파구":"11710","강동구":"11740",
  },
  "경기": {
  "수원시":"41110","성남시":"41130","의정부시":"41150","안양시":"41170","부천시":"41190",
  "광명시":"41210","평택시":"41220","동두천시":"41250","안산시":"41270","고양시":"41280",
  "과천시":"41290","구리시":"41310","남양주시":"41360","오산시":"41370","시흥시":"41390",
  "군포시":"41410","의왕시":"41430","하남시":"41450","용인시":"41460","파주시":"41480",
  "이천시":"41500","안성시":"41550","김포시":"41570","화성시":"41590","광주시":"41610",
  },
  "인천": {
  "중구":"28110","동구":"28140","미추홀구":"28177","연수구":"28185","남동구":"28200",
  "부평구":"28237","계양구":"28245","서구":"28260","강화군":"28710","옹진군":"28720",
  },
  "부산": {
  "중구":"26110","서구":"26140","동구":"26170","영도구":"26200","부산진구":"26230",
  "동래구":"26260","남구":"26290","북구":"26320","해운대구":"26350","사하구":"26380",
  "금정구":"26410","강서구":"26440","연제구":"26470","수영구":"26500","사상구":"26530",
  },
};

function extractSigunguFromAddress(address) {
  // 주소에 시도가 적혀 있으면 그 시도 안에서만, 없으면 전체(서울 우선)에서 찾는다
  const sidos = Object.keys(SIGUNGU_CODE_MAP);
  const named = sidos.filter(s => address.includes(s));
  for (const sido of named.length ? named : sidos) {
    for (const [name, code] of Object.entries(SIGUNGU_CODE_MAP[sido])) {
      if (address.includes(name)) return { sigunguCode: code, sigunguName: name };
    }
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

// ── 카카오 로컬 API 헬퍼 ──
const KAKAO = "https://dapi.kakao.com/v2/local";
async function kakaoGet(path, key) {
  const res = await fetch(KAKAO + path, { headers: { Authorization: `KakaoAK ${key}` } });
  if (!res.ok) return null;
  return res.json();
}

function fromAddressDoc(doc, source) {
  // 법정동코드(b_code)는 지번 주소(doc.address)에만 있다 — road_address 에서 읽으면 도로명 주소는 항상 빈 코드가 된다
  const bcode = doc?.address?.b_code || "";
  if (!doc || !bcode) return null;
  const addr = doc.road_address || doc.address;
  return {
    bcode,
    sigunguCode: bcode.slice(0, 5),
    sidoName:    addr?.region_1depth_name || "",
    sigunguName: addr?.region_2depth_name || "",
    dongName:    addr?.region_3depth_name || addr?.region_3depth_h_name || "",
    fullAddress: doc.address_name,
    x: doc.x, y: doc.y,
    source,
  };
}

async function searchAddress(q, key) {
  const data = await kakaoGet(`/search/address.json?query=${encodeURIComponent(q)}&page=1&size=1`, key);
  return data?.documents?.[0] || null;
}

// 임대인이 실제로 치는 입력은 정식 주소가 아닌 경우가 많다 ("잠실 엘스 101동", "합정동 123", "범어동 삼성아파트").
// 주소 검색이 비면 ① 뒤 토큰(동·호·번지)을 떼어 가며 다시 찾고 ② 그래도 없으면 장소(키워드) 검색으로
// 단지·건물 좌표를 얻어 법정동 코드로 바꾼다. 2026-11 실측: 현실 입력 24건 중 8건이 여기서 실패하고 있었다.
async function resolveLoose(address, key) {
  const tokens = address.trim().split(/\s+/);
  // 동·호·층·번지 숫자를 뗀 낱말들
  const kw = address.replace(/\d+\s*(동|호|층)(?=\s|$)/g, " ").replace(/(^|\s)[\d-]+(?=\s|$)/g, " ").replace(/\s+/g, " ").trim();
  const lastWord = kw.split(" ").pop() || "";
  // 마지막 낱말이 행정구역·도로명이 아니면(엘스·헬리오시티·삼성아파트·오피스텔) 단지·건물 이름으로 보고 장소 검색을 먼저 한다.
  // 동 이름만 잘라 주소 검색하면 같은 이름의 다른 지역 동(예: 범어동 → 영천시)으로 잡힐 수 있다.
  const placeFirst = !!lastWord && !/(시|군|구|동|읍|면|리|가|로|길)$/.test(lastWord);

  const byTrim = async () => {
    for (let n = tokens.length - 1; n >= 1 && n >= tokens.length - 3; n--) {
      const hit = fromAddressDoc(await searchAddress(tokens.slice(0, n).join(" "), key), "kakao-trim");
      if (hit) return hit;
    }
    return null;
  };
  const byPlace = async () => {
    for (const q of kw && kw !== address ? [kw, address] : [address]) {
      const data = await kakaoGet(`/search/keyword.json?query=${encodeURIComponent(q)}&page=1&size=1`, key);
      const place = data?.documents?.[0];
      if (!place?.x || !place?.y) continue;
      const reg = await kakaoGet(`/geo/coord2regioncode.json?x=${place.x}&y=${place.y}`, key);
      const r = (reg?.documents || []).find((d) => d.region_type === "B");
      if (r?.code) {
        return {
          bcode: r.code,
          sigunguCode: r.code.slice(0, 5),
          sidoName: r.region_1depth_name || "",
          sigunguName: r.region_2depth_name || "",
          dongName: r.region_3depth_name || "",
          fullAddress: place.road_address_name || place.address_name || address,
          placeName: place.place_name || "",
          x: place.x, y: place.y,
          source: "kakao-place",
        };
      }
    }
    return null;
  };
  return placeFirst ? (await byPlace()) || (await byTrim()) : (await byTrim()) || (await byPlace());
}

export async function POST(req) {
  try {
    const { address } = await req.json();
    if (!address) return Response.json({ error: "주소가 필요합니다." }, { status: 400 });

    // 카카오 API 시도
    const kakaoKey = process.env.KAKAO_REST_API_KEY || process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (kakaoKey) {
      try {
        const exact = fromAddressDoc(await searchAddress(address, kakaoKey), "kakao");
        if (exact) return Response.json(exact);
      } catch (e) {
        console.warn("카카오 API 실패, fallback 사용:", e.message);
      }
    }

    // Fallback: 주소 문자열에서 시군구 추출
    const fallback = extractSigunguFromAddress(address);
    const regions  = extractRegionNames(address);
    // 문자열에 시군구가 없으면 느슨한 검색(토큰 줄이기 → 장소 검색)을 먼저 시도
    if (kakaoKey) {
      try {
        const loose = await resolveLoose(address, kakaoKey);
        if (loose) return Response.json(loose);
      } catch (e) {
        console.warn("카카오 느슨한 검색 실패:", e.message);
      }
    }
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
