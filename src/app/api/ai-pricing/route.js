export const runtime = "edge";

const SYSTEM_PROMPT = `당신은 대한민국 부동산 임대료 감정평가 전문가입니다.
반드시 순수한 한국어로만 응답하세요. 한자, 영어, 외래어를 절대 사용하지 마세요.
제공된 실거래가 데이터를 기반으로 분석하세요. 데이터에 없는 내용은 추정이라고 명시하세요.
JSON 형식으로만 응답하고 문자열 값 안에 줄바꿈 문자를 포함하지 마세요.`;

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

규칙:
- comparables는 위 실거래 샘플에서 실제 데이터를 사용하세요
- rentRange와 avgRent는 위 통계 데이터 기반으로 작성
- 데이터가 부족하면 dataNote에 반드시 명시
- marketPosition: "고평가", "적정", "저평가" 중 하나
- vacancyRisk: "낮음", "보통", "높음" 중 하나  
- priceTrend: "상승", "보합", "하락" 중 하나
- marketPositionScore: -2에서 2 사이 정수
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
