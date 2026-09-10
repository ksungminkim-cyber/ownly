// 외부 의존성 헬스체크 — 매일 새벽 크론 (vercel.json) + 운영자 수동 호출
// 목적: 2026-08 Groq 모델 폐기로 AI 가 3주간 조용히 죽어 있던 사고의 재발 방지.
//       유료 혜택으로 파는 기능(AI 분석·실거래 조회)이 실제로 응답하는지 매일 확인하고, 실패하면 운영자에게 메일.
//
// GET /api/health?token=CRON_SECRET  (Vercel Cron 은 user-agent 로 허용)
// 검사 항목:
//   llm    — src/lib/llm.js 로 1문장 생성 (AI 분석·코멘트가 쓰는 동일 경로, 비용 수 원)
//   molit  — /api/market/molit 로 지난달 마포구 아파트 전월세 조회 → 1건 이상
//   db     — Supabase events 테이블 head 조회
// 응답: { ok, checks: { name: { ok, ms, detail } }, alerted }

export const runtime = "nodejs";
export const maxDuration = 60;

import { createClient } from "@supabase/supabase-js";
import { callLLM, llmConfigured, GROQ_MODEL, CLAUDE_MODEL } from "../../../lib/llm";

const CRON_TOKEN = process.env.CRON_SECRET || process.env.CRON_TOKEN || "";
const ALERT_TO = process.env.HEALTH_ALERT_EMAIL || "k.sungminkim@gmail.com";

function authorized(req) {
  const ua = req.headers.get("user-agent") || "";
  if (/vercel-cron/i.test(ua)) return true;
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const token = bearer || req.headers.get("x-cron-token") || new URL(req.url).searchParams.get("token");
  return Boolean(CRON_TOKEN && token === CRON_TOKEN);
}

async function timed(fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    return { ok: true, ms: Date.now() - t0, detail };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, detail: e?.message || String(e) };
  }
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
      // 국토부 API 는 새벽에 일시 오류·점검이 잦다 → 1회 재시도, 지난달이 비면 전전달로 한 번 더 확인.
      // 프록시가 돌려주는 molitError(한도 초과·키 오류 등)를 그대로 메일에 남긴다.
      const probe = async (ym) => {
        const res = await fetch(`${base}/api/market/molit?type=apt_rent&lawdCd=11440&dealYm=${ym}&numOfRows=20`, { signal: AbortSignal.timeout(20000) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
        if (data.molitError) throw new Error(`MOLIT 응답 오류: ${data.molitError}`);
        return Array.isArray(data.items) ? data.items.length : 0;
      };
      const d2 = new Date(); d2.setMonth(d2.getMonth() - 2);
      const prevYm = `${d2.getFullYear()}${String(d2.getMonth() + 1).padStart(2, "0")}`;
      let lastErr = null;
      for (const [attempt, ym] of [[1, lastYm], [2, lastYm], [3, prevYm]]) {
        try {
          const n = await probe(ym);
          if (n > 0) return `${n}건 (${ym}${attempt > 1 ? `, ${attempt}차 시도` : ""})`;
          lastErr = new Error(`실거래 0건 (${ym} 마포구)`);
        } catch (e) { lastErr = e; }
        await new Promise((r) => setTimeout(r, 4000));
      }
      throw lastErr;
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
  let alerted = false;
  if (failed.length > 0) {
    const lines = failed.map(([name, c]) => `[${name}] FAIL (${c.ms}ms): ${c.detail}`);
    lines.push("", `참고: LLM 모델 = groq:${GROQ_MODEL} / claude:${CLAUDE_MODEL} (src/lib/llm.js)`);
    lines.push(`확인: https://www.ownly.kr/api/health?token=... · 문서 CLAUDE.md §4 AI`);
    console.error("[health] FAIL", lines.join(" | "));
    const r = await sendAlert(`[온리 헬스체크] ${failed.map(([n]) => n).join(", ")} 실패`, lines);
    alerted = !r?.skipped;
  }

  return Response.json({ ok: failed.length === 0, checkedAt: new Date().toISOString(), checks, alerted }, { status: failed.length === 0 ? 200 : 503 });
}
