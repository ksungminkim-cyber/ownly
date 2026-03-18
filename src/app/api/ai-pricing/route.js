export const runtime = "edge";

function buildPricingPrompt(address, propertyType) {
  const typeMap = {
    "주거": "residential (apartment/villa/house)",
    "상가": "commercial (retail store/shop)",
    "오피스텔": "officetel (studio/office)",
    "토지": "land"
  };
  const typeEn = typeMap[propertyType] || "residential";

  return `⚠️ CRITICAL: Respond ONLY in Korean language. No Chinese characters, no English words, no Vietnamese words. All text must be pure Korean (한글).
⚠️ CRITICAL: Output ONLY valid JSON. No markdown, no backticks, no explanation text outside JSON.

You are a Korean real estate rent pricing expert with 15+ years of experience.
Analyze this address and estimate appropriate rent prices based on current Korean market data.

Address: "${address}"
Property type: ${propertyType} (${typeEn})

Output this exact JSON structure (replace all placeholder values with real Korean market data):
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
  "strategy": "해당 지역 시세와 물건 특성을 고려한 임대 전략을 2-3문장으로 작성하세요.",
  "vacancyRisk": "보통",
  "bestTiming": "임대 최적 시기를 1문장으로 작성하세요.",
  "negotiationTip": "협상 팁을 1-2문장으로 작성하세요.",
  "priceTrend": "보합",
  "trendReason": "가격 추세 이유를 1문장으로 작성하세요."
}

Rules:
- marketPosition must be exactly one of: "고평가", "적정", "저평가"
- marketPositionScore must be integer between -2 and 2
- vacancyRisk must be exactly one of: "낮음", "보통", "높음"
- priceTrend must be exactly one of: "상승", "보합", "하락"
- All numeric values (rent, deposit, etc.) must be actual numbers, not strings
- All string values must be in Korean only
- Return ONLY the JSON object, nothing else`;
}

export async function POST(req) {
  try {
    const { address, propertyType = "주거" } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a Korean real estate pricing expert. You MUST output ONLY valid JSON with no markdown formatting, no backticks, no text outside the JSON. All string values inside the JSON must be in Korean (한글) only."
          },
          { role: "user", content: buildPricingPrompt(address, propertyType) }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: `분석 오류: ${data?.error?.message}` }, { status: res.status });

    let text = data?.choices?.[0]?.message?.content;
    if (!text) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    // 안전한 파싱
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd   = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return Response.json({ error: "AI가 올바른 형식으로 응답하지 않았습니다. 다시 시도해주세요." }, { status: 500 });
    }
    text = text.slice(jsonStart, jsonEnd + 1);
    // 제어문자 정리
    text = text.replace(/[\u0000-\u001F\u007F]/g, (ch) => {
      const safe = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };
      return safe[ch] || "";
    });

    const result = JSON.parse(text);
    result.address = address;
    result.propertyType = propertyType;
    result.analysisDate = new Date().toLocaleDateString("ko-KR");
    return Response.json(result);

  } catch (err) {
    console.error("임대료 분석 오류:", err.message);
    return Response.json({ error: "분석 중 오류: " + err.message }, { status: 500 });
  }
}
