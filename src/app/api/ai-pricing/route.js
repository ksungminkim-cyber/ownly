export const runtime = "edge";

const SYSTEM_PROMPT = `당신은 대한민국 부동산 임대료 감정평가 전문가입니다.

[절대 규칙]
1. 반드시 순수한 한국어로만 응답하세요. 한자, 영어, 외래어 절대 금지.
2. JSON 형식으로만 응답하고 문자열 값 안에 줄바꿈 문자를 포함하지 마세요.
3. 제공된 실거래가 데이터를 최우선으로 사용하세요. 데이터와 다른 수치를 만들지 마세요.
4. 실거래 데이터가 있으면 comparables에 실제 데이터를 그대로 사용하세요. 임의로 만들지 마세요.
5. 데이터로 알 수 없는 내용은 반드시 "추정" 또는 "불확실"이라고 명시하세요.
6. 확실하지 않은 수치는 범위로만 제시하고 단정하지 마세요.
7. 데이터가 부족하거나 신뢰도가 낮으면 dataNote에 솔직하게 명시하세요.
8. 절대로 없는 데이터를 있는 것처럼 만들어내지 마세요.`;

function buildPromptWithRealData(address, propertyType, molitData) {
  const { stats, samples, totalCount, months, isRent, apiType } = molitData;

  // 실거래 샘플 요약
  const sampleText = samples.slice(0, 8).map((s, i) => {
    if (isRent) {
      return `  ${i+1}. ${s.name||s.dong} / ${s.areaPyeong}평(${s.area}㎡) / ${s.floor}층 / ${s.builtYear}년 / ${s.type} / 월세${s.rent}만원 보증금${s.deposit}만원 / 계약${s.contract}`;
    } else {
      return `  ${i+1}. ${s.name||s.dong} / ${s.areaPyeong}평(${s.area}㎡) / ${s.floor}층 / ${s.builtYear}년 / 거래가${s.price?.toLocaleString()}만원 / 계약${s.contract}`;
    }
  }).join("\n");

  const statsText = stats ? (isRent ? `
- 조회 건수: ${totalCount}건 (최근 ${months.length}개월: ${months.join(", ")})
- 평균 월세: ${stats.avgRent}만원 (범위: ${stats.minRent}~${stats.maxRent}만원)
- 평균 보증금: ${stats.avgDeposit}만원 (범위: ${stats.minDeposit}~${stats.maxDeposit}만원)
- 평당 평균 월세: ${stats.avgRentPerPy || "산출불가"}만원/평
- 평균 면적: ${stats.avgAreaPyeong || "-"}평 (${stats.avgArea || "-"}㎡)
- 월세 거래: ${stats.wolseCount}건 / 전세 거래: ${stats.jeonseCount}건` : `
- 조회 건수: ${totalCount}건 (최근 ${months.length}개월: ${months.join(", ")})
- 평균 거래가: ${stats.avgPrice?.toLocaleString()}만원 (범위: ${stats.minPrice?.toLocaleString()}~${stats.maxPrice?.toLocaleString()}만원)
- 평균 평당가: ${stats.avgPricePerPy?.toLocaleString() || "산출불가"}만원/평`) : "- 데이터 없음";

  return `⚠️ 반드시 순수한 한국어로만 작성하세요. JSON만 출력하세요.

분석 대상: "${address}" (${propertyType})

=== 국토교통부 실거래가 공식 데이터 (${apiType}) ===
${statsText}

=== 실거래 샘플 (최신순) ===
${sampleText || "데이터 없음"}

위 실거래가 데이터를 기반으로 아래 JSON 구조로 분석하세요:
{"rentRange":{"min":0,"max":0,"unit":"만원/월"},"depositRange":{"min":0,"max":0,"unit":"만원"},"marketPosition":"적정","marketPositionScore":0,"avgRent":0,"avgDeposit":0,"rentPerPyeong":0,"rentPerSqm":0,"avgArea":0,"dataSource":"국토교통부 실거래가 공식 데이터","dataPeriod":"최근 3개월","dataCount":${totalCount},"comparables":[{"name":"샘플물건명","dong":"동이름","area":0,"areaPyeong":0,"floor":"층","builtYear":"년","rent":0,"deposit":0,"type":"월세","rentPerPyeong":0,"contract":"계약월"},{"name":"샘플물건명2","dong":"동이름","area":0,"areaPyeong":0,"floor":"층","builtYear":"년","rent":0,"deposit":0,"type":"월세","rentPerPyeong":0,"contract":"계약월"},{"name":"샘플물건명3","dong":"동이름","area":0,"areaPyeong":0,"floor":"층","builtYear":"년","rent":0,"deposit":0,"type":"월세","rentPerPyeong":0,"contract":"계약월"}],"priceRange":{"low":"하한가 설명 1문장","mid":"중간가 설명 1문장","high":"상한가 설명 1문장"},"strategy":"실거래가 데이터 기반 임대 전략 2문장","vacancyRisk":"보통","bestTiming":"임대 최적 시기 1문장","negotiationTip":"협상 팁 1문장","priceTrend":"보합","trendReason":"추세 근거 1문장","dataNote":"데이터 해석 시 주의사항 1문장","marketSummary":"해당 지역 시장 요약 2문장"}

[데이터 활용 규칙]
- comparables: 위 실거래 샘플에서 실제 데이터만 사용. 없으면 빈 배열 []
- rentRange.min/max: 위 통계의 minRent/maxRent 값 그대로 사용
- avgRent: 위 통계의 avgRent 값 그대로 사용
- avgDeposit: 위 통계의 avgDeposit 값 그대로 사용
- rentPerPyeong: 위 통계의 avgRentPerPy 값 그대로 사용
- 위 데이터와 다른 숫자를 임의로 만들지 마세요

[품질 규칙]
- 데이터 건수가 10건 미만이면 dataNote에 "데이터 부족으로 신뢰도 낮음" 명시
- 특정 시기(특정 연도, 특정 계절)에 쏠린 데이터면 dataNote에 명시
- marketPosition은 실거래가 데이터 기반으로만 판단, 추정 금지
- priceTrend는 3개월 데이터의 실제 추이 기반으로만 판단
- 확신할 수 없으면 "보합"으로 표시
- 상업업무용은 매매 실거래가 기반으로 임대 수익률(통상 3~5%)을 역산하여 월 임대료를 추정하고 dataNote에 "매매가 기반 임대료 추정"을 명시하세요
- 평당 임대료(rentPerPyeong)는 반드시 월세(만원) ÷ 면적(평) 계산값이어야 합니다. 예: 월세 200만원 / 20평 = 10만원/평

[형식 규칙]
- marketPosition: "고평가", "적정", "저평가" 중 하나
- vacancyRisk: "낮음", "보통", "높음" 중 하나  
- priceTrend: "상승", "보합", "하락" 중 하나
- marketPositionScore: -2에서 2 사이 정수
- floor 필드는 숫자만 입력 ("1", "2", "3" 형식 — "층" 절대 붙이지 마세요)
- rentPerPyeong: 월세 ÷ 면적(평) 계산값 (소수점 1자리)
- 모든 숫자는 숫자형`;
}

function buildFallbackPrompt(address, propertyType) {
  return `⚠️ 반드시 순수한 한국어로만 작성하세요. JSON만 출력하세요.

분석 대상: "${address}" (${propertyType})
※ 실거래가 데이터 조회 실패 — AI 추정으로 분석합니다. 모든 수치는 추정값입니다.

{"rentRange":{"min":0,"max":0,"unit":"만원/월"},"depositRange":{"min":0,"max":0,"unit":"만원"},"marketPosition":"적정","marketPositionScore":0,"avgRent":0,"avgDeposit":0,"rentPerPyeong":0,"rentPerSqm":0,"avgArea":0,"dataSource":"AI 추정 (실거래가 데이터 없음)","dataPeriod":"-","dataCount":0,"comparables":[{"name":"추정 유사물건1","dong":"-","area":0,"areaPyeong":0,"floor":"-","builtYear":"-","rent":0,"deposit":0,"type":"월세","rentPerPyeong":0,"contract":"-"},{"name":"추정 유사물건2","dong":"-","area":0,"areaPyeong":0,"floor":"-","builtYear":"-","rent":0,"deposit":0,"type":"월세","rentPerPyeong":0,"contract":"-"},{"name":"추정 유사물건3","dong":"-","area":0,"areaPyeong":0,"floor":"-","builtYear":"-","rent":0,"deposit":0,"type":"월세","rentPerPyeong":0,"contract":"-"}],"priceRange":{"low":"추정 하한가 설명","mid":"추정 중간가 설명","high":"추정 상한가 설명"},"strategy":"AI 추정 기반 임대 전략 2문장","vacancyRisk":"보통","bestTiming":"임대 최적 시기 1문장","negotiationTip":"협상 팁 1문장","priceTrend":"보합","trendReason":"추세 근거 1문장","dataNote":"⚠️ 실거래가 데이터 없음 — 모든 수치는 AI 추정값으로 실제와 다를 수 있습니다","marketSummary":"해당 지역 시장 요약 2문장"}

위 구조에서 "${address}" 지역의 ${propertyType} 시장 추정값을 작성하세요. 반드시 dataNote에 추정임을 명시하세요.`;
}

export async function POST(req) {
  try {
    const { address, propertyType = "주거", lawdCd } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: "Groq API 키가 없습니다." }, { status: 500 });

    // 1단계: 실거래가 조회 시도
    let molitData = null;
    let prompt;
    const baseUrl = req.url ? new URL(req.url).origin : "https://www.ownly.kr";

    if (lawdCd) {
      try {
        const molitRes = await fetch(`${baseUrl}/api/molit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lawdCd, propertyType }),
        });
        if (molitRes.ok) {
          molitData = await molitRes.json();
        }
      } catch (e) {
        console.warn("국토부 API 조회 실패, AI 추정으로 전환:", e.message);
      }
    }

    // 2단계: 프롬프트 선택
    if (molitData && molitData.totalCount > 0) {
      prompt = buildPromptWithRealData(address, propertyType, molitData);
    } else {
      prompt = buildFallbackPrompt(address, propertyType);
    }

    // 3단계: Groq AI 분석
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: `AI 분석 오류: ${data?.error?.message}` }, { status: res.status });

    let text = data?.choices?.[0]?.message?.content || "";
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd   = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return Response.json({ error: "AI가 올바른 형식으로 응답하지 않았습니다." }, { status: 500 });

    text = text.slice(jsonStart, jsonEnd + 1);
    text = text.replace(/[\u0000-\u001F\u007F]/g, ch => ({ "\n":"\\n","\r":"\\r","\t":"\\t" }[ch] || ""));

    const result = JSON.parse(text);
    result.address = address;
    result.propertyType = propertyType;
    result.analysisDate = new Date().toLocaleDateString("ko-KR");
    result.hasRealData = !!(molitData && molitData.totalCount > 0);
    result.rawStats = molitData?.stats || null;
    return Response.json(result);

  } catch (err) {
    console.error("임대료 분석 오류:", err.message);
    return Response.json({ error: "분석 중 오류: " + err.message }, { status: 500 });
  }
}
