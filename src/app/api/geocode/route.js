export const runtime = "edge";

// 카카오 주소검색 API로 법정동코드(법정코드 10자리) 추출
export async function POST(req) {
  try {
    const { address } = await req.json();
    if (!address) return Response.json({ error: "주소가 필요합니다." }, { status: 400 });

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || process.env.KAKAO_REST_API_KEY;
    if (!kakaoKey) return Response.json({ error: "카카오 API 키가 없습니다." }, { status: 500 });

    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}&page=1&size=1`,
      { headers: { "Authorization": `KakaoAK ${kakaoKey}` } }
    );
    const data = await res.json();
    const doc = data?.documents?.[0];
    if (!doc) return Response.json({ error: "주소를 찾을 수 없습니다." }, { status: 404 });

    const addr = doc.road_address || doc.address;
    const bcode = addr?.b_code || addr?.region_3depth_h_code || "";
    const sigunguCode = bcode.slice(0, 5);
    const sidoName    = addr?.region_1depth_name || "";
    const sigunguName = addr?.region_2depth_name || "";
    const dongName    = addr?.region_3depth_name || addr?.region_3depth_h_name || "";

    return Response.json({
      bcode,           // 법정동코드 10자리
      sigunguCode,     // 시군구코드 5자리 (국토부 API 파라미터)
      sidoName,
      sigunguName,
      dongName,
      fullAddress: doc.address_name,
      x: doc.x,
      y: doc.y,
    });
  } catch (err) {
    return Response.json({ error: "주소 변환 오류: " + err.message }, { status: 500 });
  }
}
