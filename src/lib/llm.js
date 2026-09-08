// 서버 전용 LLM 호출 계층 — AI 임대료 분석(/api/ai-pricing)·인사이트 코멘트(/api/ai-comment)가 공용으로 사용
//
// 2026-08-16 Groq 가 llama-3.3-70b-versatile 을 종료하면서 프로덕션 AI 기능이 통째로 죽었던 사고의 재발 방지:
//  - 제공자 두 곳(Anthropic Claude · Groq)을 모두 지원하고, 키가 있는 쪽을 우선 사용
//  - 우선 제공자가 실패(모델 폐기·장애·한도)하면 다른 제공자로 즉시 재시도
//  - 모델 ID 는 이 파일 한 곳에서만 관리
//
// 환경변수: ANTHROPIC_API_KEY (있으면 1순위), GROQ_API_KEY (2순위 또는 폴백)

import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-opus-5";
export const GROQ_MODEL = "openai/gpt-oss-120b"; // llama-3.3-70b-versatile 공식 후속 (Groq 프로덕션 티어)

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const GROQ_KEY = process.env.GROQ_API_KEY || "";

export function llmConfigured() {
  return Boolean(ANTHROPIC_KEY || GROQ_KEY);
}

// ── 응답 텍스트에서 JSON 객체만 안전하게 추출 ─────────────────────
export function extractJson(text) {
  if (!text) throw new Error("빈 응답");
  try { return JSON.parse(text); } catch {}
  const cleaned = String(text).replace(/```(?:json)?/gi, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
  if (s >= 0 && e > s) return JSON.parse(cleaned.slice(s, e + 1));
  throw new Error("JSON 파싱 실패");
}

// ── Anthropic ─────────────────────────────────────────────────────
async function callClaude({ system, user, maxTokens, effort, json }) {
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY, timeout: 50_000, maxRetries: 1 });
  const res = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: json ? `${system}\n\nRespond with a single valid JSON object only. No markdown, no code fences, no commentary.` : system,
    messages: [{ role: "user", content: user }],
    output_config: { effort },
  });
  if (res.stop_reason === "refusal") throw new Error("모델이 요청을 거절했습니다");
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  if (!text) throw new Error("빈 응답");
  return { text, provider: "anthropic", model: CLAUDE_MODEL };
}

// ── Groq (OpenAI 호환) ────────────────────────────────────────────
async function callGroq({ system, user, maxTokens, json, temperature }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        temperature,
        // gpt-oss 계열은 추론 토큰이 완료 토큰 예산에 포함되어 답이 중간에 잘릴 수 있음 → 추론 낮춤 + 여유 확보
        max_tokens: maxTokens + 2500,
        reasoning_effort: "low",
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    const raw = await res.text();
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error(`Groq 응답 파싱 실패: ${raw.slice(0, 200)}`); }
    if (!res.ok) throw new Error(data?.error?.message || `Groq HTTP ${res.status}`);
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("빈 응답");
    return { text, provider: "groq", model: GROQ_MODEL };
  } finally { clearTimeout(timer); }
}

/**
 * LLM 호출 — 키가 있는 제공자 순으로 시도하고, 실패하면 다음 제공자로 폴백.
 * @param {object} o
 * @param {string} o.system   시스템 프롬프트
 * @param {string} o.user     사용자 프롬프트
 * @param {boolean} [o.json]  true 면 JSON 객체를 기대 (파싱은 호출자가 extractJson 으로)
 * @param {number} [o.maxTokens]
 * @param {"low"|"medium"|"high"} [o.effort]  Claude 추론 깊이
 * @param {number} [o.temperature]            Groq 온도
 * @returns {Promise<{text:string, provider:string, model:string}>}
 */
export async function callLLM({ system, user, json = false, maxTokens = 2000, effort = "low", temperature = 0.3 }) {
  const chain = [];
  if (ANTHROPIC_KEY) chain.push(() => callClaude({ system, user, maxTokens, effort, json }));
  if (GROQ_KEY) chain.push(() => callGroq({ system, user, maxTokens, json, temperature }));
  if (chain.length === 0) throw new Error("AI API 키가 설정되지 않았습니다 (ANTHROPIC_API_KEY 또는 GROQ_API_KEY)");

  let lastErr;
  for (const attempt of chain) {
    try { return await attempt(); }
    catch (e) { lastErr = e; console.error("[llm] provider failed:", e?.message); }
  }
  throw lastErr;
}
