export const runtime = "edge";

const SYSTEM_PROMPT = `당신은 대한민국 부동산 임대료 감정평가 전문가입니다.
반드시 순수한 한국어로만 응답하세요. 한자, 영어, 외래어를 절대 사용하지 마세요.
요청된 JSON 형식으로만 응답하고, 문자열 값 안에 줄바꿈 문자를 포함하지 마세요.
JSON 외에 어떠한 텍스트도 출력하지 마세요.`;

function buildPrompt(address, propertyType) {
  return `⚠️ 아래 지시를 반드시 따르세요:
1. 반드시 순수한 한국어로만 작성하세요 (한자, 영어, 외래어 절대 금지)
2. JSON 형식으로만 응답하고 다른 텍스트는 출력하지 마세요

분석 주소: "${address}"
물건 유형: ${propertyType}

아래 형식의 JSON만 출력하세요. 숫자값은 반드시 숫자 타입이어야 합니다:
{"rentRange":{"min":80,"max":120,"unit":"만원/월"},"depositRange":{"min":3000,"max":5000,"unit":"만원"},"marketPosition":"적정","marketPositionScore":0,"avgRent":100,"avgDeposit":4000,"pricePerSqm":3,"comparables":[{"type":"유사 물건 예시 1","rent":90,"deposit":3000,"note":"반경 300미터 이내"},{"type":"유사 물건 예시 2","rent":105,"deposit":4000,"note":"동일 유형 물건"},{"type":"유사 물건 예시 3","rent":115,"deposit":5000,"note":"리모델링 완료"}],"strategy":"이 지역의 임대 전략을 2문장으로 작성합니다.","vacancyRisk":"보통","bestTiming":"임대 최적 시기를 1문장으로 작성합니다.","negotiationTip":"협상 팁을 1문장으로 작성합니다.","priceTrend":"보합","trendReason":"가격 추세 이유를 1문장으로 작성합니다."}

위 JSON 구조에서 실제 "${address}" 주소에 맞는 값으로 모두 교체하여 출력하세요.
marketPosition은 "고평가", "적정", "저평가" 중 하나여야 합니다.
vacancyRisk는 "낮음", "보통", "높음" 중 하나여야 합니다.
priceTrend는 "상승", "보합", "하락" 중 하나여야 합니다.
marketPositionScore는 -2에서 2 사이의 정수여야 합니다.`;
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
        max_tokens: 1500,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: `분석 오류: ${data?.error?.message || "API 오류"}` }, { status: res.status });
    }

    let text = data?.choices?.[0]?.message?.content;
    if (!text) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    // 코드블록 제거
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    // JSON 추출
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
