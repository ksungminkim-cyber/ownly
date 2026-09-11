// 외부 의존성 헬스체크 — 매일 새벽 크론 (vercel.json) + 운영자 수동 호출
// 목적: 2026-08 Groq 모델 폐기로 AI 가 3주간 조용히 죽어 있던 사고의 재발 방지.
//       유료 혜택으로 파는 기능(AI 분석·실거래 조회)이 실제로 응답하는지 매일 확인하고, 실패하면 운영자에게 메일.
//
// GET /api/health?token=CRON_SECRET  (Vercel Cron 은 user-agent 로 허용)
// 검사 항목:
//   llm    — src/lib/llm.js 로 1문장 생성 (AI 분석·코멘트가 쓰는 동일 경로, 비용 수 원)
//   molit  — /api/market/molit 로 지난달 마포구 아파트 전월세 조회 → 1건 이상 (실패 시 재시도·강남구·전전달로 교차 확인)
//   db     — Supabase events 테이블 head 조회
// 응답: { ok, checks: { name: { ok, ms, detail, soft? } }, alerted, softOnly }
//
// 알림 규칙: llm·db 실패, MOLIT 의 HTTP/키/타임아웃 오류는 즉시 메일.
//   MOLIT 가 응답은 하는데 "실거래 0건"만 돌려주는 경우(soft)는 국토부 새벽 공백이 잦아 이틀 연속일 때만 메일 —
//   매 실행 결과를 events(event='health_check') 에 남기고 직전 실행을 비교한다.

export const runtime = "nodejs";
export const maxDuration = 60;

import { createClient } from "@supabase/supabase-js";
import { callLLM, llmConfigured, GROQ_MODEL, CLAUDE_MODEL } from "../../../lib/llm";
import { internalHeaders } from "../../../lib/ratelimit";

const CRON_TOKEN = process.env.CRON_SECRET || process.env.CRON_TOKEN || "";
const ALERT_TO = process.env.HEALTH_ALERT_EMAIL || "k.sungminkim@gmail.com";

function authorized(req) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const token = bearer || req.headers.get("x-cron-token") || new URL(req.url).searchParams.get("token");
  if (CRON_TOKEN) return token === CRON_TOKEN; // 시크릿이 있으면 토큰만 인정 (Vercel Cron 은 CRON_SECRET 을 Bearer 로 자동 주입)
  return /vercel-cron/i.test(req.headers.get("user-agent") || ""); // 시크릿 미설정 배포에서만 UA 폴백
}

async function timed(fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    return { ok: true, ms: Date.now() - t0, detail };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, detail: e?.message || String(e), ...(e?.soft ? { soft: true } : {}) };
  }
}

// 직전 실행 기록 조회 / 이번 실행 기록 저장 — events 테이블 (service role, user_id null)
async function loadPrevRun(sb) {
  const { data } = await sb.from("events").select("props,created_at").eq("event", "health_check").order("created_at", { ascending: false }).limit(1);
  return data?.[0] || null;
}
async function saveRun(sb, props) {
  const { error } = await sb.from("events").insert({ user_id: null, event: "health_check", props });
  if (error) console.warn("[health] run log insert failed:", error.message);
}

async function sendAlert(subject, lines) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { skipped: true };
  const html = `<div style="font-family:sans-serif;max-width:560px"><h2 style="color:#e8445a">${subject}</h2><pre style="background:#f5f4f0;padding:14px;border-radius:8px;white-space:pre-wrap">${lines.join("\n")}</pre><p style="font-size:12px;color:#888">ownly 헬스체크 · ${new Date().toISOString()}</p></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from: "온리 <noreply@ownly.kr>", to: [ALERT_TO], subject, html }),
  });
  return res.json().catch(() => ({}));
}

export async function GET(req) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const host = req.headers.get("host") || "www.ownly.kr";
  const base = `${host.includes("localhost") ? "http" : "https"}://${host}`;
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  const lastYm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;

  const [llm, molit, db] = await Promise.all([
    timed(async () => {
      if (!llmConfigured()) throw new Error("AI API 키 미설정 (GROQ_API_KEY / ANTHROPIC_API_KEY)");
      const r = await callLLM({ system: "Reply with exactly one short Korean sentence.", user: "온리 헬스체크입니다. 정상이라고 한 문장으로 답하세요.", maxTokens: 60, effort: "low", temperature: 0 });
      if (!r.text) throw new Error("빈 응답");
      return `${r.provider}:${r.model} · ${r.text.slice(0, 40)}`;
    }),
    timed(async () => {
      // 국토부 API 는 새벽에 일시 오류·빈 응답이 잦다 → 지난달 마포구 2회, 강남구 1회, 전전달 마포구 1회까지 교차 확인.
      // 프록시가 돌려주는 molitError(한도 초과·키 오류 등)는 그대로 메일에 남기고, 전부 "0건"이면 soft 실패로 분류한다.
      const probe = async (ym, lawdCd) => {
        const res = await fetch(`${base}/api/market/molit?type=apt_rent&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=20`, { signal: AbortSignal.timeout(10000), headers: internalHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
        if (data.molitError) throw new Error(`MOLIT 응답 오류: ${data.molitError}`);
        return Array.isArray(data.items) ? data.items.length : 0;
      };
      const d2 = new Date(); d2.setMonth(d2.getMonth() - 2);
      const prevYm = `${d2.getFullYear()}${String(d2.getMonth() + 1).padStart(2, "0")}`;
      const attempts = [[lastYm, "11440", "마포구"], [lastYm, "11440", "마포구"], [lastYm, "11680", "강남구"], [prevYm, "11440", "마포구"]];
      const notes = [];
      let hardErr = null;
      for (let i = 0; i < attempts.length; i++) {
        const [ym, cd, name] = attempts[i];
        try {
          const n = await probe(ym, cd);
          if (n > 0) return `${n}건 (${ym} ${name}${i > 0 ? `, ${i + 1}차 시도` : ""})`;
          notes.push(`${i + 1}차 ${ym} ${name}: 0건`);
        } catch (e) {
          hardErr = e;
          notes.push(`${i + 1}차 ${ym} ${name}: ${e?.message || e}`);
        }
        if (i < attempts.length - 1) await new Promise((r) => setTimeout(r, 5000));
      }
      const err = new Error((hardErr ? "MOLIT 오류 — " : "실거래 0건 (응답은 정상, 국토부 데이터 공백 가능성) — ") + notes.join(" / "));
      err.soft = !hardErr; // 전부 0건 = 국토부 새벽 공백일 가능성 → 이틀 연속일 때만 메일
      throw err;
    }),
    timed(async () => {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { error } = await sb.from("events").select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return "ok";
    }),
  ]);

  const checks = { llm, molit, db };
  const failed = Object.entries(checks).filter(([, c]) => !c.ok);

  // 직전 실행과 비교 — MOLIT soft 실패는 연속 2회일 때만 알림 대상
  const sbLog = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const prev = await loadPrevRun(sbLog).catch(() => null);
  const prevMolitFailed = prev?.props?.checks?.molit?.ok === false;
  const softOnly = failed.length === 1 && failed[0][0] === "molit" && Boolean(molit.soft) && !prevMolitFailed;
  await saveRun(sbLog, { ok: failed.length === 0, softOnly, checks: Object.fromEntries(Object.entries(checks).map(([k, c]) => [k, { ok: c.ok, ms: c.ms, soft: !!c.soft, detail: String(c.detail).slice(0, 300) }])) }).catch(() => {});

  let alerted = false;
  if (failed.length > 0 && !softOnly) {
    const lines = failed.map(([name, c]) => `[${name}] FAIL (${c.ms}ms): ${c.detail}${c.soft ? " (직전 실행도 실패 → 연속)" : ""}`);
    lines.push("", `참고: LLM 모델 = groq:${GROQ_MODEL} / claude:${CLAUDE_MODEL} (src/lib/llm.js)`);
    lines.push(`확인: https://www.ownly.kr/api/health?token=... · 문서 CLAUDE.md §4 AI`);
    console.error("[health] FAIL", lines.join(" | "));
    const r = await sendAlert(`[온리 헬스체크] ${failed.map(([n]) => n).join(", ")} 실패`, lines);
    alerted = !r?.skipped;
  }

  if (softOnly) console.warn("[health] MOLIT soft fail (첫 회 — 메일 생략):", molit.detail);
  return Response.json({ ok: failed.length === 0, softOnly, checkedAt: new Date().toISOString(), checks, alerted }, { status: failed.length === 0 || softOnly ? 200 : 503 });
}
