export async function POST(req) {
  try {
    const { address, propertyType } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });

    const prompt = `당신은 대한민국 부동산 입지 전문 애널리스트입니다.
다음 주소의 입지를 분석해주세요.

주소: "${address}"
물건 유형: ${propertyType || "주거"}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드블록 없이 순수 JSON만 출력하세요.
JSON 문자열 값 안에는 줄바꿈(\\n) 없이 한 줄로 작성하세요.

{"score":82,"grade":"B","summary":"한 줄 요약","sections":[{"icon":"🏪","title":"상권 분석","content":"한 줄로 작성"},{"icon":"🚇","title":"교통 접근성","content":"한 줄로 작성"},{"icon":"🏫","title":"학군","content":"한 줄로 작성"},{"icon":"📈","title":"임대 수요","content":"한 줄로 작성"},{"icon":"⚠️","title":"리스크 요인","content":"한 줄로 작성"}],"pros":["장점1","장점2","장점3"],"cons":["단점1","단점2"],"recommendation":"한 줄로 작성"}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "당신은 대한민국 부동산 입지 분석 전문가입니다. 순수 JSON만 응답하고, 문자열 값 안에 줄바꿈 문자를 절대 포함하지 마세요.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Groq API 오류:", res.status, JSON.stringify(data));
      return Response.json({ error: `분석 오류: ${data?.error?.message || "API 오류"}` }, { status: res.status });
    }

    let text = data?.choices?.[0]?.message?.content;
    if (!text) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    // 제어문자 및 마크다운 코드블록 제거
    text = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // JSON 블록만 추출 ({ ... } 범위)
    const jsonStart = text.indexOf("{");
    const jsonEnd   = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return Response.json({ error: "AI가 올바른 형식으로 응답하지 않았습니다. 다시 시도해주세요." }, { status: 500 });
    }
    text = text.slice(jsonStart, jsonEnd + 1);

    // 문자열 리터럴 밖의 제어문자 제거
    text = text.replace(/[\u0000-\u001F\u007F]/g, (ch) => {
      // JSON 파서가 허용하는 이스케이프 시퀀스로 변환
      const safe = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };
      return safe[ch] || "";
    });

    const result = JSON.parse(text);
    return Response.json(result);

  } catch (err) {
    console.error("AI 분석 오류:", err.message);
    return Response.json({ error: "분석 중 오류: " + err.message }, { status: 500 });
  }
}
