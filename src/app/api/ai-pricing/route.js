export const runtime = "edge";

const SYSTEM_PROMPT = `당신은 대한민국 부동산 임대료 감정평가 전문가입니다.
반드시 순수한 한국어로만 응답하세요. 한자, 영어, 외래어를 절대 사용하지 마세요.
요청된 JSON 형식으로만 응답하고, 문자열 값 안에 줄바꿈 문자를 포함하지 마세요.
JSON 외에 어떠한 텍스트도 출력하지 마세요.`;

function buildPrompt(address, propertyType) {
  return `⚠️ 반드시 순수한 한국어로만 작성하세요. JSON만 출력하세요.

분석 주소: "${address}"
물건 유형: ${propertyType}

아래 JSON 구조로만 응답하세요. 모든 숫자는 숫자형, 문자열은 한글로:

{"rentRange":{"min":80,"max":120,"unit":"만원/월"},"depositRange":{"min":3000,"max":5000,"unit":"만원"},"marketPosition":"적정","marketPositionScore":0,"avgRent":100,"avgDeposit":4000,"rentPerPyeong":5,"rentPerSqm":1.5,"avgArea":20,"comparables":[{"type":"인근 유사 물건 1","area":20,"floor":"2층","builtYear":2015,"rent":90,"deposit":3000,"distance":"반경 200미터","note":"동일 유형, 비슷한 면적"},{"type":"인근 유사 물건 2","area":25,"floor":"1층","builtYear":2010,"rent":110,"deposit":4000,"distance":"반경 400미터","note":"1층 프리미엄 적용"},{"type":"인근 유사 물건 3","area":18,"floor":"3층","builtYear":2020,"rent":95,"deposit":3500,"distance":"반경 300미터","note":"신축, 소형 면적"}],"priceRange":{"low":"시세 하한 설명 1문장","mid":"시세 중간 설명 1문장","high":"시세 상한 설명 1문장"},"strategy":"이 지역 임대 전략 2문장으로 구체적 수치 포함하여 작성하세요.","vacancyRisk":"보통","bestTiming":"임대 최적 시기 1문장으로 작성하세요.","negotiationTip":"협상 팁 1문장으로 작성하세요.","priceTrend":"보합","trendReason":"가격 추세 이유 1문장으로 작성하세요.","marketSummary":"해당 주소 임대 시장 전반 요약 2문장으로 작성하세요."}

위 구조에서 "${address}" 주소의 실제 ${propertyType} 시장 데이터로 교체하여 출력하세요.
rentPerPyeong: 평당 월 임대료(만원), rentPerSqm: 제곱미터당 월 임대료(만원), avgArea: 인근 유사 물건 평균 면적(평)
marketPosition은 반드시 "고평가", "적정", "저평가" 중 하나
vacancyRisk는 반드시 "낮음", "보통", "높음" 중 하나
priceTrend는 반드시 "상승", "보합", "하락" 중 하나
marketPositionScore는 -2에서 2 사이 정수`;
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
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(address, propertyType) },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: `분석 오류: ${data?.error?.message || "API 오류"}` }, { status: res.status });
    }

    let text = data?.choices?.[0]?.message?.content;
    if (!text) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd   = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return Response.json({ error: "AI가 올바른 형식으로 응답하지 않았습니다. 다시 시도해주세요." }, { status: 500 });
    }
    text = text.slice(jsonStart, jsonEnd + 1);
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
