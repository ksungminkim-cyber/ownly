import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { address, propertyType } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `당신은 대한민국 부동산 입지 전문 애널리스트입니다.
다음 주소의 입지를 분석해주세요.

주소: "${address}"
물건 유형: ${propertyType || "미지정"}

아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:
{
  "score": 85,
  "grade": "A",
  "summary": "한 줄 핵심 요약 (20자 이내)",
  "sections": [
    { "icon": "🏪", "title": "상권 분석", "content": "상권 및 유동인구 분석 2-3문장" },
    { "icon": "🚇", "title": "교통 접근성", "content": "대중교통·도로 접근성 2-3문장" },
    { "icon": "🏫", "title": "학군", "content": "초중고 학군 수준 2-3문장" },
    { "icon": "📈", "title": "임대 수요", "content": "임차 수요 전망 2-3문장" },
    { "icon": "⚠️", "title": "리스크 요인", "content": "투자 시 주의사항 2-3문장" }
  ],
  "pros": ["장점1", "장점2", "장점3"],
  "cons": ["단점1", "단점2"],
  "recommendation": "임대인 관점 종합 의견 2-3문장"
}`
      }]
    });

    const text = message.content[0].text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);
    return Response.json(result);
  } catch (err) {
    console.error("AI 분석 오류:", err);
    return Response.json({ error: "분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
