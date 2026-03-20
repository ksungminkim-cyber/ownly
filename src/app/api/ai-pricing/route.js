export const runtime = "edge";

function buildPricingPrompt(address, propertyType) {
  const typeMap = {
    "주거": "주거용 (아파트/빌라/단독주택)",
    "상가": "상업용 (상가/점포)",
    "오피스텔": "오피스텔 (원룸/사무용)",
    "토지": "토지"
  };
  const typeKo = typeMap[propertyType] || "주거용";

  return `당신은 15년 경력의 한국 부동산 임대 전문가입니다.
아래 주소와 물건 유형을 보고 현재 시장 기준의 적정 임대료를 분석해주세요.

주소: ${address}
물건 유형: ${typeKo}

반드시 아래 JSON 형식으로만 응답하세요. JSON 외 텍스트, 마크다운, 백틱 없이 순수 JSON만 출력하세요.
모든 문자열은 반드시 한국어(한글)로 작성하세요.

{
  "rentRange": { "min": 숫자, "max": 숫자, "unit": "만원/월" },
  "depositRange": { "min": 숫자, "max": 숫자, "unit": "만원" },
  "marketPosition": "적정",
  "marketPositionScore": 0,
  "avgRent": 숫자,
  "avgDeposit": 숫자,
  "pricePerSqm": 숫자,
  "comparables": [
    { "type": "유사 물건 설명", "rent": 숫자, "deposit": 숫자, "note": "설명" },
    { "type": "유사 물건 설명", "rent": 숫자, "deposit": 숫자, "note": "설명" },
    { "type": "유사 물건 설명", "rent": 숫자, "deposit": 숫자, "note": "설명" }
  ],
  "strategy": "2~3문장의 임대 전략",
  "vacancyRisk": "보통",
  "bestTiming": "임대 최적 시기 1문장",
  "negotiationTip": "협상 팁 1~2문장",
  "priceTrend": "보합",
  "trendReason": "가격 추세 이유 1문장"
}

규칙:
- marketPosition: "고평가", "적정", "저평가" 중 하나
- marketPositionScore: -2~2 사이 정수
- vacancyRisk: "낮음", "보통", "높음" 중 하나
- priceTrend: "상승", "보합", "하락" 중 하나
- 숫자값은 반드시 숫자형(문자열 아님)
- 반드시 JSON만 출력 (다른 텍스트 절대 금지)`;
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
            content: "당신은 한국 부동산 임대 전문가입니다. 반드시 순수 JSON만 출력하세요. 마크다운, 백틱, JSON 외 텍스트 절대 금지."
          },
          {
            role: "user",
            content: buildPricingPrompt(address, propertyType)
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: `분석 오류: ${data?.error?.message}` }, { status: res.status });

    let text = data?.choices?.[0]?.message?.content;
    if (!text) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    // 마크다운 제거
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    // JSON 블록 추출
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
    result.address      = address;
    result.propertyType = propertyType;
    result.analysisDate = new Date().toLocaleDateString("ko-KR");
    return Response.json(result);

  } catch (err) {
    console.error("임대료 분석 오류:", err.message);
    return Response.json({ error: "분석 중 오류: " + err.message }, { status: 500 });
  }
}
