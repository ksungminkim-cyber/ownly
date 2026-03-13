export async function POST(req) {
  try {
    const { address, propertyType } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });

    const prompt = `당신은 대한민국 부동산 입지 전문 애널리스트입니다.
다음 주소의 입지를 분석해주세요.

주소: "${address}"
물건 유형: ${propertyType || "주거"}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운, 코드블록, 추가 텍스트 없이 JSON만 출력하세요:
{"score":82,"grade":"B","summary":"역세권 중심 주거 수요 양호","sections":[{"icon":"🏪","title":"상권 분석","content":"주변 상권 및 유동인구 분석 2-3문장"},{"icon":"🚇","title":"교통 접근성","content":"지하철 버스 등 대중교통 접근성 2-3문장"},{"icon":"🏫","title":"학군","content":"인근 초중고 학군 수준 2-3문장"},{"icon":"📈","title":"임대 수요","content":"임차 수요 및 공실률 전망 2-3문장"},{"icon":"⚠️","title":"리스크 요인","content":"투자 시 유의사항 2-3문장"}],"pros":["장점1","장점2","장점3"],"cons":["단점1","단점2"],"recommendation":"임대인 관점의 종합 의견 2-3문장"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini API 오류:", res.status, JSON.stringify(data));
      return Response.json({ error: `분석 오류: ${data?.error?.message || "API 오류"}` }, { status: res.status });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const result = JSON.parse(clean);
    return Response.json(result);

  } catch (err) {
    console.error("AI 분석 오류:", err.message);
    return Response.json({ error: "분석 중 오류: " + err.message }, { status: 500 });
  }
}
