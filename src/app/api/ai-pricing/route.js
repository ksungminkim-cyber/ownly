export const runtime = "edge";

const PRICING_PROMPTS = {
  주거: (address) => `당신은 대한민국 주거용 부동산 임대료 전문 감정평가사입니다.
⚠️ 반드시 순수한 한국어로만 작성하세요. 한자, 영어, 외래어를 절대 사용하지 마세요.

분석 주소: "${address}"
물건 유형: 주거 (아파트/빌라/원룸/단독주택)

해당 주소 인근의 실거래 시세를 기반으로 적정 임대료를 분석하세요.
아래 JSON 형식으로만 응답하고 markdown 코드블록 없이 JSON만 출력하세요:
{
  "rentRange": { "min": 숫자, "max": 숫자, "unit": "만원/월" },
  "depositRange": { "min": 숫자, "max": 숫자, "unit": "만원" },
  "marketPosition": "고평가|적정|저평가",
  "marketPositionScore": -2에서+2사이정수,
  "avgRent": 숫자,
  "avgDeposit": 숫자,
  "pricePerSqm": 숫자,
  "comparables": [
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" },
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" },
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" }
  ],
  "strategy": "문자열 (적정 임대 전략 2~3문장, 구체적 수치 포함)",
  "vacancyRisk": "낮음|보통|높음",
  "bestTiming": "문자열 (임대 최적 시기 1문장)",
  "negotiationTip": "문자열 (협상 팁 1~2문장)",
  "priceTrend": "상승|보합|하락",
  "trendReason": "문자열 (추세 이유 1문장)"
}`,

  상가: (address) => `당신은 대한민국 상업용 부동산 임대료 전문 감정평가사입니다.
⚠️ 반드시 순수한 한국어로만 작성하세요.

분석 주소: "${address}"
물건 유형: 상가

아래 JSON 형식으로만 응답:
{
  "rentRange": { "min": 숫자, "max": 숫자, "unit": "만원/월" },
  "depositRange": { "min": 숫자, "max": 숫자, "unit": "만원" },
  "marketPosition": "고평가|적정|저평가",
  "marketPositionScore": -2에서+2사이정수,
  "avgRent": 숫자,
  "avgDeposit": 숫자,
  "pricePerSqm": 숫자,
  "comparables": [
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" },
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" },
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" }
  ],
  "strategy": "문자열",
  "vacancyRisk": "낮음|보통|높음",
  "bestTiming": "문자열",
  "negotiationTip": "문자열",
  "priceTrend": "상승|보합|하락",
  "trendReason": "문자열"
}`,

  오피스텔: (address) => `당신은 대한민국 오피스텔 임대료 전문 감정평가사입니다.
⚠️ 반드시 순수한 한국어로만 작성하세요.

분석 주소: "${address}"
물건 유형: 오피스텔

아래 JSON 형식으로만 응답:
{
  "rentRange": { "min": 숫자, "max": 숫자, "unit": "만원/월" },
  "depositRange": { "min": 숫자, "max": 숫자, "unit": "만원" },
  "marketPosition": "고평가|적정|저평가",
  "marketPositionScore": -2에서+2사이정수,
  "avgRent": 숫자,
  "avgDeposit": 숫자,
  "pricePerSqm": 숫자,
  "comparables": [
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" },
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" },
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" }
  ],
  "strategy": "문자열",
  "vacancyRisk": "낮음|보통|높음",
  "bestTiming": "문자열",
  "negotiationTip": "문자열",
  "priceTrend": "상승|보합|하락",
  "trendReason": "문자열"
}`,

  토지: (address) => `당신은 대한민국 토지 임대료 전문 감정평가사입니다.
⚠️ 반드시 순수한 한국어로만 작성하세요.

분석 주소: "${address}"
물건 유형: 토지

아래 JSON 형식으로만 응답:
{
  "rentRange": { "min": 숫자, "max": 숫자, "unit": "만원/월" },
  "depositRange": { "min": 숫자, "max": 숫자, "unit": "만원" },
  "marketPosition": "고평가|적정|저평가",
  "marketPositionScore": -2에서+2사이정수,
  "avgRent": 숫자,
  "avgDeposit": 숫자,
  "pricePerSqm": 숫자,
  "comparables": [
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" },
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" },
    { "type": "문자열", "rent": 숫자, "deposit": 숫자, "note": "문자열" }
  ],
  "strategy": "문자열",
  "vacancyRisk": "낮음|보통|높음",
  "bestTiming": "문자열",
  "negotiationTip": "문자열",
  "priceTrend": "상승|보합|하락",
  "trendReason": "문자열"
}`
};

export async function POST(req) {
  try {
    const { address, propertyType = "주거" } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });

    const promptFn = PRICING_PROMPTS[propertyType] || PRICING_PROMPTS["주거"];
    const prompt = promptFn(address);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "당신은 대한민국 부동산 임대료 감정평가 전문가입니다. 반드시 순수한 한국어로만 응답하세요. 한자, 영어, 외래어를 절대 사용하지 마세요. 요청된 JSON 형식으로만 응답하고 문자열 값 안에 줄바꿈 문자를 포함하지 마세요." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: `분석 오류: ${data?.error?.message}` }, { status: res.status });

    let text = data?.choices?.[0]?.message?.content;
    if (!text) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd   = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return Response.json({ error: "올바른 형식으로 응답하지 않았습니다." }, { status: 500 });

    text = text.slice(jsonStart, jsonEnd + 1);
    text = text.replace(/[\u0000-\u001F\u007F]/g, (ch) => ({ "\n": "\\n", "\r": "\\r", "\t": "\\t" }[ch] || ""));

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
