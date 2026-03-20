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

Output ONLY this JSON structure with real Korean market data. No explanation, no markdown:
{
  "rentRange": { "min": 80, "max": 120, "unit": "만원/월" },
  "depositRange": { "min": 3000, "max": 5000, "unit": "만원" },
  "marketPosition": "적정",
  "marketPositionScore": 0,
  "avgRent": 100,
  "avgDeposit": 4000,
  "pricePerSqm": 3,
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
- All numbers must be actual numbers not strings
- All text must be in Korean (한글)`;
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
            content: "You are a Korean real estate pricing expert. Output ONLY valid JSON. No markdown, no backticks, no extra text. Korean text only for all string values."
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

    // response_format: json_object 사용 시 content는 이미 valid JSON string
    // 단순 파싱만 시도, 실패 시 {} 범위만 추출
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // fallback: { } 범위 추출
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

    result.address = address;
    result.propertyType = propertyType;
    result.analysisDate = new Date().toLocaleDateString("ko-KR");

    return Response.json(result);

  } catch (err) {
    console.error("임대료 분석 오류:", err.message);
    return Response.json({ error: "분석 중 오류: " + err.message }, { status: 500 });
  }
}
