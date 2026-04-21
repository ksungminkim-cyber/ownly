const PROMPTS = {
  주거: `당신은 대한민국 주거용 부동산 입지 분석 전문가입니다. 10년 이상 경력의 감정평가사 겸 부동산 컨설턴트로서 해당 주소의 임대인 관점 입지를 심층 분석하세요.

⚠️ 중요: 반드시 순수한 한국어로만 작성하세요. 한자(漢字), 영어, 베트남어, 일본어 등 외국어 단어와 한자를 절대 섞지 마세요. 예: '附近'→'인근', '地域'→'지역', '利用'→'이용', '主要'→'주요'처럼 모든 한자는 한글로 바꿔 쓰세요.

분석 주소: "{address}"
물건 유형: 주거 (아파트/빌라/단독주택)

다음 7가지 항목을 각 150자 이상 구체적으로 분석하세요:
1. 교통 접근성: 지하철역 도보 거리, 버스 노선 수, 주요 업무지구까지 소요시간
2. 학군: 배정 초중고교 학력 수준, 학원가 밀집도, 교육 환경
3. 생활 편의: 대형마트/병원/공원 접근성, 생활 인프라 수준
4. 임대 수요: 주변 인구 구성, 직주근접 수요, 1인~가족 세대 비율 전망
5. 가격 및 수익률: 주변 전월세 시세 수준, 예상 임대수익률 범위
6. 개발 호재: 신규 교통망, 재개발/재건축, 주변 대규모 개발 계획
7. 리스크: 공급 과잉 여부, 인구 감소, 환경/소음 등 입지 약점`,

  상가: `당신은 대한민국 상업용 부동산 입지 분석 전문가입니다. 10년 이상 경력의 상권 분석가로서 해당 주소의 임대인 관점 입지를 심층 분석하세요.

⚠️ 중요: 반드시 순수한 한국어로만 작성하세요. 한자(漢字), 영어, 베트남어, 일본어 등 외국어 단어와 한자를 절대 섞지 마세요. 예: '附近'→'인근', '地域'→'지역', '利用'→'이용', '主要'→'주요'처럼 모든 한자는 한글로 바꿔 쓰세요.

분석 주소: "{address}"
물건 유형: 상가 (1층 근린상가/집합상가)

다음 7가지 항목을 각 150자 이상 구체적으로 분석하세요:
1. 유동인구: 시간대별 유동인구 특성, 주요 고객층(연령/소득) 분석
2. 상권 성숙도: 상권 성장/정체/쇠퇴 단계, 주변 공실률 수준
3. 업종 적합성: 현재 상권의 주력 업종, 진입 가능한 업종 및 제한 업종
4. 접근성 및 가시성: 차량/보행 접근성, 간판 노출도, 주차 가능 여부
5. 임대 수익성: 주변 보증금/임대료 시세, 수익률 범위, 권리금 수준
6. 경쟁 강도: 반경 300m 내 유사 업종 현황, 대형 유통점 위협 여부
7. 리스크: 배달 앱 확산 영향, 온라인 전환 위험, 상권 이동 가능성`,

  오피스텔: `당신은 대한민국 오피스텔 입지 분석 전문가입니다. 10년 이상 경력의 부동산 투자 컨설턴트로서 해당 주소의 임대인 관점 입지를 심층 분석하세요.

⚠️ 중요: 반드시 순수한 한국어로만 작성하세요. 한자(漢字), 영어, 베트남어, 일본어 등 외국어 단어와 한자를 절대 섞지 마세요. 예: '附近'→'인근', '地域'→'지역', '利用'→'이용', '主要'→'주요'처럼 모든 한자는 한글로 바꿔 쓰세요.

분석 주소: "{address}"
물건 유형: 오피스텔 (업무용/주거용)

다음 7가지 항목을 각 150자 이상 구체적으로 분석하세요:
1. 직주근접성: 주요 업무지구(강남/여의도/판교 등)까지 통근 시간, 지하철 접근성
2. 1인 가구 수요: 주변 1인 가구 비율, 청년층/직장인 유입 현황, 수요 안정성
3. 임대 수익성: 주변 오피스텔 보증금/월세 시세, 수익률 범위(세전/세후), 공실률
4. 관리비 및 수익구조: 관리비 수준, 취득세/재산세 등 보유 비용, 실질 수익 계산
5. 주거 환경: 소음/채광/환기, 편의시설, 주변 생활 인프라
6. 공급 과잉 여부: 반경 500m 내 오피스텔 공급량, 신규 분양 예정 물량
7. 리스크: 준주택 규제 변화, 금리 상승 영향, 임차인 이탈 위험`,

  토지: `당신은 대한민국 토지 입지 분석 전문가입니다. 10년 이상 경력의 토지 전문 감정평가사로서 해당 주소의 투자자 관점 입지를 심층 분석하세요.

⚠️ 중요: 반드시 순수한 한국어로만 작성하세요. 한자(漢字), 영어, 베트남어, 일본어 등 외국어 단어와 한자를 절대 섞지 마세요. 예: '附近'→'인근', '地域'→'지역', '利用'→'이용', '主要'→'주요'처럼 모든 한자는 한글로 바꿔 쓰세요.

분석 주소: "{address}"
물건 유형: 토지 (나대지/농지/임야/대지)

다음 7가지 항목을 각 150자 이상 구체적으로 분석하세요:
1. 용도지역 및 규제: 예상 용도지역(주거/상업/공업/녹지), 건폐율/용적률, 개발행위 허가 가능성
2. 개발 잠재력: 인허가 가능한 건축 유형, 도시계획 변경 가능성, 미래 개발 시나리오
3. 교통 및 접근성: 도로 접면 여부, 진입로 확보, 대중교통 접근성
4. 주변 개발 현황: 인근 개발 사례, 지가 상승 추이, 지역 성장 모멘텀
5. 지가 수준: 공시지가 대비 시세 수준, 인근 실거래 사례, 적정 매입가 판단
6. 개발 비용 예측: 기반시설 설치 비용, 토목공사 예상 비용, 인허가 기간
7. 리스크: 토지거래허가구역 여부, 환경 규제, 군사 보호구역 등 개발 제한`
};

const RECOMMENDATION_HINT = {
  manage: "기존 소유 임대인 관점의 종합 운영 전략 200자 이상. 현 시점 적정 임대료 수준, 공실 해소를 위한 가격·조건 조정 방향, 추천 업종이나 타깃 임차인, 주의사항을 포함해 구체적으로 작성",
  new: "신규 매입 검토 투자자 관점의 종합 판단 200자 이상. 매입 추천 여부, 적정 투자 금액대, 예상 수익률, 주의사항을 포함해 구체적으로 작성",
};

function buildPrompt(address, propertyType, mode) {
  const template = PROMPTS[propertyType] || PROMPTS["주거"];
  const base = template.replace("{address}", address);
  const recoHint = RECOMMENDATION_HINT[mode] || RECOMMENDATION_HINT.manage;
  return base + `

반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드블록 없이 순수 JSON만 출력하세요.
JSON 문자열 값 안에는 줄바꿈 없이 작성하세요.

{"score":82,"grade":"B","summary":"한 줄 핵심 요약 (50자 이내)","sections":[{"icon":"🚇","title":"교통 접근성","content":"구체적 분석 내용 150자 이상"},{"icon":"🏫","title":"학군","content":"구체적 분석 내용 150자 이상"},{"icon":"🏪","title":"생활 편의","content":"구체적 분석 내용 150자 이상"},{"icon":"👥","title":"임대 수요","content":"구체적 분석 내용 150자 이상"},{"icon":"💰","title":"수익성","content":"구체적 분석 내용 150자 이상"},{"icon":"🏗️","title":"개발 호재","content":"구체적 분석 내용 150자 이상"},{"icon":"⚠️","title":"리스크","content":"구체적 분석 내용 150자 이상"}],"pros":["구체적 장점1","구체적 장점2","구체적 장점3","구체적 장점4"],"cons":["구체적 리스크1","구체적 리스크2","구체적 리스크3"],"recommendation":"${recoHint}","analysisDate":"${new Date().toLocaleDateString("ko-KR")}","propertyType":"${propertyType}"}`;
}

// 한글 텍스트에 포함되면 안 되는 외국 문자 (한자, 히라가나/가타카나, 베트남어 등 확장 라틴 발음 부호)
// ASCII/한글/숫자/일반 문장 부호는 허용
const FOREIGN_CHAR_REGEX = /[\u00C0-\u024F\u1E00-\u1EFF\u3040-\u30FF\u4E00-\u9FFF]/;

function hasForeignChars(text) {
  return FOREIGN_CHAR_REGEX.test(text);
}

function stripForeignChars(text) {
  return text.replace(new RegExp(FOREIGN_CHAR_REGEX.source, "g"), "");
}

function sanitizeReport(report) {
  if (!report || typeof report !== "object") return report;
  const cleaned = { ...report };
  const stringKeys = ["summary", "recommendation"];
  for (const k of stringKeys) {
    if (typeof cleaned[k] === "string" && hasForeignChars(cleaned[k])) {
      cleaned[k] = stripForeignChars(cleaned[k]);
    }
  }
  if (Array.isArray(cleaned.sections)) {
    cleaned.sections = cleaned.sections.map((s) => ({
      ...s,
      content: typeof s.content === "string" && hasForeignChars(s.content)
        ? stripForeignChars(s.content) : s.content,
    }));
  }
  if (Array.isArray(cleaned.pros)) {
    cleaned.pros = cleaned.pros.map((p) => typeof p === "string" && hasForeignChars(p) ? stripForeignChars(p) : p);
  }
  if (Array.isArray(cleaned.cons)) {
    cleaned.cons = cleaned.cons.map((p) => typeof p === "string" && hasForeignChars(p) ? stripForeignChars(p) : p);
  }
  return cleaned;
}

function reportHasForeignChars(report) {
  if (!report) return false;
  const check = (v) => typeof v === "string" && hasForeignChars(v);
  if (check(report.summary) || check(report.recommendation)) return true;
  if (Array.isArray(report.sections) && report.sections.some((s) => check(s.content))) return true;
  if (Array.isArray(report.pros) && report.pros.some(check)) return true;
  if (Array.isArray(report.cons) && report.cons.some(check)) return true;
  return false;
}

async function callLLM(apiKey, prompt, extraSystem = "") {
  const sys = "당신은 대한민국 부동산 입지 분석 전문가입니다. 반드시 순수한 한국어로만 응답하세요. 한자(漢字), 영어, 베트남어, 일본어, 스페인어 등 어떤 외국어 단어도 절대 섞지 마세요. 예를 들어 '附近', '地域', '利用', '主要' 같은 한자와 'sát', 'của', 'quyết' 같은 외래어를 절대 사용하지 마세요. 모든 단어는 한글로만 작성하세요. 요청된 JSON 형식으로만 응답하고, 각 분석 항목은 반드시 구체적인 수치와 지역 특성을 포함해 150자 이상 작성하세요. 문자열 값 안에 줄바꿈 문자를 포함하지 마세요." + (extraSystem ? " " + extraSystem : "");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 3000,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message || "API 오류");
    err.status = res.status;
    throw err;
  }

  let text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI 응답이 비어있습니다.");

  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const jsonStart = text.indexOf("{");
  const jsonEnd   = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("AI가 올바른 형식으로 응답하지 않았습니다.");
  }
  text = text.slice(jsonStart, jsonEnd + 1);
  text = text.replace(/[\u0000-\u001F\u007F]/g, (ch) => {
    const safe = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };
    return safe[ch] || "";
  });
  return JSON.parse(text);
}

export async function POST(req) {
  try {
    const { address, propertyType, mode } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });

    const reportMode = mode === "new" ? "new" : "manage";
    const prompt = buildPrompt(address, propertyType || "주거", reportMode);

    let result = await callLLM(apiKey, prompt);

    // 외국 문자(한자, 베트남어 등) 혼입 시 1회 재시도 후 최종 sanitize
    if (reportHasForeignChars(result)) {
      try {
        result = await callLLM(
          apiKey,
          prompt,
          "이전 응답에 한자나 베트남어 등 외국 문자가 섞여 있었습니다. 이번엔 반드시 순수 한글과 숫자·기호만 사용해 다시 작성하세요.",
        );
      } catch (e) {
        console.warn("AI 재시도 실패:", e.message);
      }
      if (reportHasForeignChars(result)) {
        result = sanitizeReport(result);
      }
    }

    result.address = address;
    result.propertyType = propertyType || "주거";
    result.mode = reportMode;
    result.analysisDate = new Date().toLocaleDateString("ko-KR");
    return Response.json(result);

  } catch (err) {
    console.error("AI 분석 오류:", err.message);
    const status = err.status || 500;
    return Response.json({ error: "분석 중 오류: " + err.message }, { status });
  }
}
