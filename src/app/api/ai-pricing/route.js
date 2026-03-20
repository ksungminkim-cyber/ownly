export const runtime = "edge";

function buildPricingPrompt(address, propertyType) {
  const typeMap = {
    "주거": "residential (apartment/villa/house)",
    "상가": "commercial (retail store/shop)",
    "오피스텔": "officetel (studio/office)",
    "토지": "land"
  };
  const typeEn = typeMap[propertyType] || "residential";

  return `You are a Korean real estate rent pricing expert with 15+ years of experience.
Analyze this address and estimate appropriate rent prices based on current Korean market data.

Address: "${address}"
Property type: ${propertyType} (${typeEn})

IMPORTANT UNIT RULES:
- All rent values must be in "만원/월" unit. Example: 90 means 90만원/월
- All deposit values must be in "만원" unit. Example: 3000 means 3000만원
- pricePerSqm must be in "만원/평" unit. Example: 150 means 150만원/평
- Do NOT use raw won amounts like 900000. Use 90 instead of 900000.

Output ONLY this JSON structure with real Korean market data for the given address:
{
  "rentRange": { "min": 80, "max": 120, "unit": "만원/월" },
  "depositRange": { "min": 3000, "max": 5000, "unit": "만원" },
  "marketPosition": "적정",
  "marketPositionScore": 0,
  "avgRent": 100,
  "avgDeposit": 4000,
  "pricePerSqm": 150,
  "comparables": [
    { "type": "인근 유사 물건 1", "rent": 90, "deposit": 3000, "note": "반경 300m 내 유사 면적" },
    { "type": "인근 유사 물건 2", "rent": 100, "deposit": 4000, "note": "동일 건물 유형" },
    { "type": "인근 유사 물건 3", "rent": 115, "deposit": 5000, "note": "리모델링 완료 물건" }
  ],
  "strategy": "임대 전략 2-3문장",
  "vacancyRisk": "보통",
  "bestTiming": "임대 최적 시기 1문장",
  "negotiationTip": "협상 팁 1-2문장",
  "priceTrend": "보합",
  "trendReason": "가격 추세 이유 1문장"
}

Rules:
- marketPosition: "고평가" | "적정" | "저평가"
- marketPositionScore: integer -2 to 2
- vacancyRisk: "낮음" | "보통" | "높음"
- priceTrend: "상승" | "보합" | "하락"
- All rent/deposit numbers in 만원 units (e.g. 90, not 900000)
- All text in Korean (한글)
- Return ONLY the JSON object`;
}

export async function POST(req) {
  try {
    const { address, propertyType = "주거" } = await req.json();
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
            content: buildPricingPrompt(address, propertyType)
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
