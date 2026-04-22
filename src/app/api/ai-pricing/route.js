export const runtime = "edge";

function buildPricingPrompt(address, propertyType, options = {}) {
  const typeMap = {
    "주거": "residential (apartment/villa/house)",
    "상가": "commercial (retail store/shop)",
    "오피스텔": "officetel (studio/office)",
    "토지": "land"
  };
  const typeEn = typeMap[propertyType] || "residential";
  const typeSpecific = {
    "주거": "아파트·빌라·다가구 기준 전월세 시세. 방 수·평형·층수가 가격에 큰 영향.",
    "상가": "1층/지상층/지하·전용면적·유동인구·업종 규제에 따라 가격이 크게 달라짐. 권리금 포함 여부는 별도로 고려.",
    "오피스텔": "원룸/투룸·주거용/업무용에 따라 시세 차이가 큼. 서울 주요 업무지구는 월세 100~200만원대.",
    "토지": "용도지역·도로 접면·평당 시세 중심. 월 임대는 농지·주차장 수준으로 한정적.",
  }[propertyType] || "";
  const myRentHint = options.myRent ? `임대인이 입력한 현재 월세: ${options.myRent}만원 (참고용)` : "";
  const myAreaHint = options.areaPyeong ? `전용면적: ${options.areaPyeong}평` : "";

  return `당신은 15년 경력의 한국 부동산 임대료 전문 감정평가사입니다.
아래 주소의 2026년 현재 시점 적정 임대료를 추정하세요.

주소: "${address}"
물건 유형: ${propertyType} (${typeEn})
${typeSpecific}
${myRentHint}
${myAreaHint}

추정 방법:
1) 해당 지역(구/동)의 최근 1년 국토부 실거래가 추세를 근거로 삼으세요
2) 동일 유형·유사 면적의 전월세 거래를 참고하세요
3) 지역 수요·공급(역세권·업무지구·학군)을 반영하세요
4) 상가라면 1층 vs 상층, 유동인구, 주차, 간판 노출도를 반영하세요

단위 규칙:
- rent/avgRent/comparables.rent: "만원/월" 단위 정수 (예: 120 = 120만원/월)
- deposit/avgDeposit/comparables.deposit: "만원" 단위 정수 (예: 5000 = 5,000만원)
- pricePerSqm: "만원/평" 단위 (예: 150 = 150만원/평)
- 원(KRW) 단위 금액(900000 등) 금지. 반드시 만원 단위.

JSON 형식으로만 응답 (마크다운·코드블록·주석 금지):
{
  "rentRange": { "min": 80, "max": 120, "unit": "만원/월" },
  "depositRange": { "min": 3000, "max": 5000, "unit": "만원" },
  "marketPosition": "적정",
  "marketPositionScore": 0,
  "avgRent": 100,
  "avgDeposit": 4000,
  "pricePerSqm": 150,
  "comparables": [
    { "type": "인근 유사 매물 A (동·평수 유사)", "rent": 90, "deposit": 3000, "note": "반경 300m 내 유사 면적·리모델링 전" },
    { "type": "인근 유사 매물 B", "rent": 100, "deposit": 4000, "note": "동일 건물 유형·최근 6개월 거래" },
    { "type": "인근 프리미엄 매물", "rent": 115, "deposit": 5000, "note": "리모델링 완료·가구 포함" }
  ],
  "strategy": "임대 전략 3문장. 적정 월세·보증금 구간 제시 + 지역 특성에 맞는 마케팅 포인트 + 공실 최소화 팁",
  "vacancyRisk": "보통",
  "bestTiming": "임대 최적 시기 1문장 (예: 3~4월 신학기 직전)",
  "negotiationTip": "협상 팁 1~2문장 (어떤 조건을 유연하게 하면 성사 확률이 오르는지)",
  "priceTrend": "보합",
  "trendReason": "가격 추세 이유 1문장 (수급·금리·개발계획 등 근거)"
}

규칙:
- marketPosition: "고평가" | "적정" | "저평가" 중 하나
- marketPositionScore: -2~2 정수 (고평가=+1~2, 적정=0, 저평가=-1~-2)
- vacancyRisk: "낮음" | "보통" | "높음"
- priceTrend: "상승" | "보합" | "하락"
- 모든 텍스트 순수 한글만. 한자·영어·외국어 섞지 말 것
- 추정치임을 명시하지 않아도 되나, 지역 특성을 구체적으로 반영할 것
- JSON 객체만 반환`;
}

export async function POST(req) {
  try {
    const { address, propertyType = "주거", myRent, areaPyeong } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a Korean real estate pricing expert. Output ONLY valid JSON. No markdown, no backticks, no extra text. All rent/deposit numbers must be in 만원 units (e.g. use 90 for 90만원, not 900000). All string values in Korean (한글)."
          },
          {
            role: "user",
            content: buildPricingPrompt(address, propertyType, { myRent, areaPyeong })
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return Response.json({ error: `Groq 응답 파싱 실패: ${rawText.substring(0, 300)}` }, { status: 500 });
    }

    if (!res.ok) {
      const errMsg = data?.error?.message || data?.error || JSON.stringify(data);
      return Response.json({ error: `분석 오류: ${errMsg}` }, { status: res.status });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start === -1 || end === -1) {
        return Response.json({ error: "AI가 올바른 형식으로 응답하지 않았습니다." }, { status: 500 });
      }
      try {
        result = JSON.parse(content.slice(start, end + 1));
      } catch (e) {
        return Response.json({ error: `AI 응답 파싱 실패: ${e.message}` }, { status: 500 });
      }
    }

    // 혹시 AI가 원 단위로 반환했을 경우 만원으로 자동 변환
    const toMan = (v) => (v && v >= 10000 ? Math.round(v / 10000) : v);
    if (result.avgRent >= 10000) result.avgRent = toMan(result.avgRent);
    if (result.avgDeposit >= 10000) result.avgDeposit = toMan(result.avgDeposit);
    if (result.rentRange) {
      result.rentRange.min = toMan(result.rentRange.min);
      result.rentRange.max = toMan(result.rentRange.max);
    }
    if (result.depositRange) {
      result.depositRange.min = toMan(result.depositRange.min);
      result.depositRange.max = toMan(result.depositRange.max);
    }
    if (result.comparables) {
      result.comparables = result.comparables.map(c => ({
        ...c,
        rent: toMan(c.rent),
        deposit: toMan(c.deposit),
      }));
    }
    if (result.pricePerSqm >= 10000) result.pricePerSqm = toMan(result.pricePerSqm);

    result.address = address;
    result.propertyType = propertyType;
    result.analysisDate = new Date().toLocaleDateString("ko-KR");

    return Response.json(result);

  } catch (err) {
    console.error("임대료 분석 오류:", err.message);
    return Response.json({ error: "분석 중 오류: " + err.message }, { status: 500 });
  }
}
