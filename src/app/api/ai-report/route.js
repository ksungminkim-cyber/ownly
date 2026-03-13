export async function POST(req) {
  try {
    const { address, propertyType } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const prompt = `당신은 대한민국 부동산 입지 전문 애널리스트입니다.
다음 주소의 입지를 분석해주세요.

주소: "${address}"
물건 유형: ${propertyType || "미지정"}

아래 JSON 형식으로만 응답하세요. 다른 텍스트나 마크다운은 절대 포함하지 마세요:
{"score":85,"grade":"A","summary":"한 줄 핵심 요약 20자 이내","sections":[{"icon":"🏪","title":"상권 분석","content":"상권 및 유동인구 분석 2-3문장"},{"icon":"🚇","title":"교통 접근성","content":"대중교통 도로 접근성 2-3문장"},{"icon":"🏫","title":"학군","content":"초중고 학군 수준 2-3문장"},{"icon":"📈","title":"임대 수요","content":"임차 수요 전망 2-3문장"},{"icon":"⚠️","title":"리스크 요인","content":"투자 시 주의사항 2-3문장"}],"pros":["장점1","장점2","장점3"],"cons":["단점1","단점2"],"recommendation":"임대인 관점 종합 의견 2-3문장"}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || "API 오류";
      console.error("Anthropic API 오류:", res.status, errMsg);
      if (res.status === 400 && errMsg.includes("credit")) {
        return Response.json({ error: "API 크레딧이 부족합니다. Anthropic Console에서 충전해주세요." }, { status: 402 });
      }
      return Response.json({ error: `분석 오류: ${errMsg}` }, { status: res.status });
    }

    const text = data.content?.[0]?.text?.replace(/```json|```/g, "").trim();
    if (!text) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    const result = JSON.parse(text);
    return Response.json(result);
  } catch (err) {
    console.error("AI 분석 오류:", err.message);
    return Response.json({ error: "분석 중 오류가 발생했습니다: " + err.message }, { status: 500 });
  }
}
