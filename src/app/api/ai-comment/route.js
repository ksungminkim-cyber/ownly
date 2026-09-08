// 자연어 AI 인사이트 코멘트 생성 API
// 벤치마크·갱신·위험도 데이터 → 2~3문장 전문가 코멘트
// LLM 호출은 src/lib/llm.js (Claude 우선, Groq 폴백). 클라이언트가 24시간 캐시하므로 호출량은 적음.
// 비로그인 위젯에서도 호출되므로 IP 당 시간당 한도로 비용 남용 방지.

export const runtime = "nodejs";
export const maxDuration = 30;

import { callLLM, llmConfigured } from "../../../lib/llm";

const RATE_LIMIT = 30;                  // IP당 시간당 허용 횟수
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  if (rateMap.size > 5000) {
    for (const [k, v] of rateMap) if (now - v.start > RATE_WINDOW_MS) rateMap.delete(k);
  }
  const rec = rateMap.get(ip);
  if (!rec || now - rec.start > RATE_WINDOW_MS) { rateMap.set(ip, { start: now, count: 1 }); return false; }
  rec.count += 1;
  return rec.count > RATE_LIMIT;
}

function buildPrompt(type, ctx) {
  if (type === "benchmark") {
    return `당신은 15년 경력의 한국 부동산 임대료 전문가입니다. 아래 데이터를 보고 임대인에게 **2~3문장** 자연어 인사이트를 한국어로 제공하세요.

지역: ${ctx.region || "—"}
물건 유형: ${ctx.type || "주거"}
내 평균 월세: ${ctx.myRent}만원
지역 중위값: ${ctx.median}만원
지역 분포: 하위 25%=${ctx.p25}만원, 상위 25%=${ctx.p75}만원
최근 3개월 거래 수: ${ctx.count}건

규칙:
- 반드시 2~3문장 (80자 내외 × 3)
- 갭이 있다면 구체적 금액·비율 언급
- "인상 여력" "유지 권장" 등 실행 가능한 조언 포함
- 지역 특성 한 번 언급 (예: "강남구는 업무지 영향으로...")
- 순수 한글. 마크다운 금지
- 주어/동사 명확한 완결 문장`;
  }
  if (type === "renewal") {
    return `당신은 한국 부동산 임대차 갱신 협상 전문가입니다. 아래 갱신 상황에 대해 **2~3문장** 실용적 조언을 한국어로 제공하세요.

현재 월세: ${ctx.currentRent}만원
지역 시세 중위값: ${ctx.median}만원
제안 갱신가: ${ctx.suggested}만원 (${ctx.changePct >= 0 ? "+" : ""}${ctx.changePct}%)
만료까지: D-${ctx.daysLeft}
지역: ${ctx.region}

규칙:
- 반드시 2~3문장
- 세입자와의 협상 관점에서 조언
- "5% 상한" "정기예금 환산" 등 법적/경제 근거 한 줄 포함
- 공실 리스크 vs 인상 필요성 균형
- 순수 한글. 마크다운 금지`;
  }
  if (type === "risk") {
    return `당신은 한국 부동산 임대 관리 전문가입니다. 아래 세입자 납부 패턴을 보고 임대인에게 **2문장** 대응 조언을 한국어로 제공하세요.

세입자: ${ctx.name}
최근 6개월 미납 횟수: ${ctx.unpaidCount}회
평균 납부 지연일: ${ctx.avgDelay}일
최근 2개월 지연 여부: ${ctx.recentLate}
위험 등급: ${ctx.level}

규칙:
- 반드시 2문장
- 단계적 대응 제시 (먼저 X, 반복 시 Y)
- 과민 반응 X, 친절한 톤
- 순수 한글`;
  }
  return "임대 관련 인사이트를 2~3문장으로 한국어로 제공하세요.";
}

export async function POST(req) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    if (isRateLimited(ip)) return Response.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });

    const { type, context } = await req.json();
    if (!type || !context) return Response.json({ error: "type·context 필수" }, { status: 400 });
    if (!llmConfigured()) return Response.json({ error: "AI 코멘트가 일시적으로 준비되지 않았습니다." }, { status: 503 });

    let llm;
    try {
      llm = await callLLM({
        system: "You are a Korean real estate expert. Respond in natural Korean (한글) with 2-3 complete sentences. No markdown, no bullet points, no numbers at line start. Just flowing prose.",
        user: buildPrompt(type, context),
        maxTokens: 600, effort: "low", temperature: 0.7,
      });
    } catch (e) {
      console.error("[ai-comment] llm failed:", e?.message);
      return Response.json({ error: "AI 코멘트 생성에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
    }

    // 마크다운 제거 안전장치
    const clean = llm.text.replace(/^\*\*|\*\*$/g, "").replace(/^[#*\-]\s+/gm, "").trim();
    return Response.json({ comment: clean, engine: llm.provider });
  } catch (err) {
    console.error("[ai-comment]", err.message);
    return Response.json({ error: "서버 오류: " + err.message }, { status: 500 });
  }
}
