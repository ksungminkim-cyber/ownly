export const runtime = "edge";

const SYSTEM_PROMPT = `당신은 대한민국 부동산 임대료 감정평가 전문가입니다.

[절대 규칙]
1. 반드시 순수한 한국어로만 응답하세요. 한자, 영어, 외래어 절대 금지.
2. JSON 형식으로만 응답하고 문자열 값 안에 줄바꿈 문자를 포함하지 마세요.
3. 제공된 실거래가 데이터를 최우선으로 사용하세요.
4. 데이터에 없는 내용은 반드시 "추정"이라고 명시하세요.
5. 모르거나 불확실한 수치는 범위로만 제시하세요.
6. floor 필드는 숫자만 ("1", "2" 형식, "층" 절대 붙이지 마세요).
7. rentPerPy: 반드시 월세(만원) ÷ 면적(평) 계산값. 예: 200만원 / 20평 = 10만원/평.`;

function buildStatsText(molitData) {
  const { stats, totalCount, months, apiTypes, isRent, notes, propertyType } = molitData;
  if (!stats) return "- 조회 결과 없음";

  const lines = [
    `- 조회 API: ${apiTypes.join(", ")}`,
    `- 조회 기간: ${months[months.length-1]} ~ ${months[0]}`,
    `- 총 거래 건수: ${totalCount}건`,
  ];

  if (isRent) {
    if (stats.avgRent > 0) {
      lines.push(`- 평균 월세: ${stats.avgRent}만원 (범위: ${stats.minRent}~${stats.maxRent}만원)`);
      lines.push(`- 평균 보증금: ${stats.avgDeposit}만원 (범위: ${stats.minDeposit}~${stats.maxDeposit}만원)`);
    }
    if (stats.avgRentPerPy) lines.push(`- 평당 평균 월세: ${stats.avgRentPerPy}만원/평 (범위: ${stats.minRentPerPy}~${stats.maxRentPerPy}만원/평)`);
    if (stats.avgAreaPy)    lines.push(`- 평균 전용면적: ${stats.avgAreaPy}평 (${stats.avgAreaSqm}㎡)`);
    lines.push(`- 거래 유형: 월세 ${stats.wolseCount}건 / 전세 ${stats.jeonseCount}건`);
  } else {
    // 매매 역산
    lines.push(`- ※ ${propertyType}은 전월세 실거래가 미공개 → 매매가 기준 수익률 역산`);
    if (stats.avgPrice > 0) lines.push(`- 평균 매매가: ${stats.avgPrice.toLocaleString()}만원 (범위: ${stats.minPrice.toLocaleString()}~${stats.maxPrice.toLocaleString()}만원)`);
    if (stats.avgPricePerPy) lines.push(`- 평당 평균 매매가: ${stats.avgPricePerPy.toLocaleString()}만원/평`);
    if (stats.avgRent > 0) lines.push(`- 역산 평균 월 임대료: ${stats.avgRent}만원 (수익률 역산)`);
    if (stats.avgRentPerPy) lines.push(`- 역산 평당 임대료: ${stats.avgRentPerPy}만원/평`);
    if (stats.avgAreaPy)    lines.push(`- 평균 면적: ${stats.avgAreaPy}평`);
  }

  if (notes.length) lines.push(`- 데이터 주의: ${notes.join(" / ")}`);
  return lines.join("\n");
}

function buildSamplesText(samples, isRent) {
  if (!samples.length) return "없음";
  return samples.slice(0, 8).map((s, i) => {
    if (isRent) {
      return `  ${i+1}. ${s.name}(${s.dong}) / ${s.areaPy}평(${s.areaSqm}㎡) / ${s.floor ? s.floor+"층" : "-"} / ${s.builtYear ? s.builtYear+"년" : "-"} / ${s.type} / 월세${s.rent}만원 보증금${s.deposit}만원 / 평당${s.rentPerPy||"-"}만원 / ${s.contract}`;
    } else {
      return `  ${i+1}. ${s.name}(${s.dong}) / ${s.areaPy}평(${s.areaSqm}㎡) / ${s.floor ? s.floor+"층" : "-"} / 매매가${s.price?.toLocaleString()}만원 / 역산월세${s.estRent}만원 / 평당역산${s.rentPerPy||"-"}만원 / ${s.contract}`;
    }
  }).join("\n");
}

function buildPrompt(address, propertyType, molitData) {
  const hasData = molitData && molitData.totalCount > 0;
  const isRent  = hasData ? molitData.isRent : true;

  const dataSection = hasData
    ? `=== 국토교통부 실거래가 공식 데이터 ===\n${buildStatsText(molitData)}\n\n=== 실거래 샘플 (최신순) ===\n${buildSamplesText(molitData.samples || [], isRent)}`
    : `=== 데이터 없음 ===\n- 해당 지역/기간 실거래가 미조회\n- 모든 수치는 AI 추정값임을 명시하세요`;

  return `⚠️ 반드시 순수 한국어, JSON만 출력.

분석 대상: "${address}" (${propertyType})

${dataSection}

아래 JSON으로만 응답하세요:
{"rentRange":{"min":0,"max":0,"unit":"만원/월"},"depositRange":{"min":0,"max":0,"unit":"만원"},"marketPosition":"적정","marketPositionScore":0,"avgRent":0,"avgDeposit":0,"rentPerPy":0,"avgAreaPy":0,"dataSource":"${hasData ? "국토교통부 실거래가" : "AI 추정"}","dataPeriod":"${hasData ? molitData.months?.[molitData.months.length-1]+"~"+molitData.months?.[0] : "-"}","dataCount":${hasData ? molitData.totalCount : 0},"isRentData":${isRent},"comparables":[{"name":"-","dong":"-","areaPy":0,"areaSqm":0,"floor":"1","builtYear":"2015","rent":0,"deposit":0,"rentPerPy":0,"type":"월세","contract":"-"},{"name":"-","dong":"-","areaPy":0,"areaSqm":0,"floor":"2","builtYear":"2018","rent":0,"deposit":0,"rentPerPy":0,"type":"월세","contract":"-"},{"name":"-","dong":"-","areaPy":0,"areaSqm":0,"floor":"3","builtYear":"2020","rent":0,"deposit":0,"rentPerPy":0,"type":"월세","contract":"-"}],"priceRange":{"low":"하한가 조건 설명","mid":"중간가 조건 설명","high":"상한가 조건 설명"},"strategy":"실거래 기반 전략 2문장","vacancyRisk":"보통","bestTiming":"최적 임대 시기 1문장","negotiationTip":"협상 팁 1문장","priceTrend":"보합","trendReason":"추세 근거 1문장","dataNote":"${hasData && !isRent ? molitData.notes?.[0] || "매매가 기반 역산" : hasData ? "실거래가 기반 분석" : "⚠️ 실거래가 없음 — AI 추정값"}","marketSummary":"시장 요약 2문장"}

[필수 규칙]
- comparables: 위 실거래 샘플에서 실제 데이터 사용 (없으면 빈 배열 [])
- avgRent, rentRange: 위 통계 avgRent/minRent/maxRent 값 그대로 사용
- rentPerPy: avgRentPerPy 값 그대로 사용 (없으면 실제 계산: 월세/평형)
- 데이터 부족(10건 미만)이면 dataNote에 "데이터 부족, 신뢰도 낮음" 명시
- marketPosition: "고평가", "적정", "저평가" 중 하나
- vacancyRisk: "낮음", "보통", "높음" 중 하나
- priceTrend: "상승", "보합", "하락" 중 하나
- marketPositionScore: -2~2 정수
- floor: 숫자만 (예: "1", "2") — "층" 절대 붙이지 마세요`;
}

export async function POST(req) {
  try {
    const { address, propertyType = "주거", lawdCd } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: "Groq API 키 없음" }, { status: 500 });

    // 1단계: 실거래가 조회
    let molitData = null;
    if (lawdCd) {
      try {
        const baseUrl = new URL(req.url).origin;
        const r = await fetch(`${baseUrl}/api/molit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lawdCd, propertyType }),
        });
        if (r.ok) molitData = await r.json();
      } catch (e) { console.warn("국토부 조회 실패:", e.message); }
    }

    // 2단계: AI 분석
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: buildPrompt(address, propertyType, molitData) },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: `AI 오류: ${data?.error?.message}` }, { status: res.status });

    let text = data?.choices?.[0]?.message?.content || "";
    text = text.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
    const js = text.indexOf("{"), je = text.lastIndexOf("}");
    if (js === -1 || je === -1) return Response.json({ error: "AI 응답 형식 오류. 다시 시도해주세요." }, { status: 500 });

    text = text.slice(js, je+1).replace(/[\u0000-\u001F\u007F]/g, ch => ({"\n":"\\n","\r":"\\r","\t":"\\t"}[ch]||""));

    const result = JSON.parse(text);
    result.address      = address;
    result.propertyType = propertyType;
    result.analysisDate = new Date().toLocaleDateString("ko-KR");
    result.hasRealData  = !!(molitData && molitData.totalCount > 0);
    result.rawStats     = molitData?.stats || null;
    result.molitNotes   = molitData?.notes || [];
    result.apiTypes     = molitData?.apiTypes || [];
    return Response.json(result);

  } catch (err) {
    console.error("임대료 분석 오류:", err.message);
    return Response.json({ error: "오류: " + err.message }, { status: 500 });
  }
}
