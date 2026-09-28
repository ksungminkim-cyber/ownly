// src/app/api/contract-scan/route.js
// 임대차 계약서 사진 → AI 가 물건·계약 정보 추출 (등록은 사용자가 확인 후 기존 등록 모달에서 직접)
//  - 이미지는 메모리에서만 모델에 전달하고 스토리지·DB 어디에도 저장하지 않는다
//  - 주민등록번호·계좌번호는 프롬프트로 추출 금지 + 서버에서 필드 화이트리스트·패턴 제거로 이중 방어
//  - 인증: Authorization: Bearer <supabase access token>. 성공 건만 ai_usage(feature "contract_scan") 기록, 하루 10회 한도
//  - 운영 테스트: x-debug-token == CRON_SECRET 이면 로그인 없이 호출 가능(사용량 기록 없음)
export const runtime = "nodejs";
export const maxDuration = 60;

import { createClient } from "@supabase/supabase-js";
import { callVisionLLM, extractJson, llmConfigured } from "../../../lib/llm";

const FEATURE = "contract_scan";
const DAILY_LIMIT = 10;
const MAX_BYTES = 8 * 1024 * 1024;

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function userFrom(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : data?.user || null;
}

// 한국 시간 오늘 0시(UTC ISO)
function kstDayStartIso(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600_000);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600_000).toISOString();
}

// ── 순수 로직 (scratchpad 테스트가 이 구간을 그대로 떼어 실행) ── BEGIN-PURE
// 파일 앞부분 바이트로 실제 형식 판별 (클라이언트가 보낸 Content-Type 은 믿지 않음)
function sniffImageType(bytes) {
  if (!bytes || bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const ascii = (a, b) => String.fromCharCode(...bytes.slice(a, b));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && /^(heic|heix|hevc|mif1|msf1|heim|heis)$/.test(ascii(8, 12))) return "image/heic";
  return null;
}

// 주민등록번호(마스킹 포함) · 계좌번호로 보이는 10자리 이상 숫자열 제거
function scrubSensitive(s) {
  if (s == null) return s;
  return String(s)
    .replace(/\d{6}\s*[-–]\s*[1-8*][\d*]{6}/g, "[삭제됨]")
    .replace(/\d{13}/g, "[삭제됨]")
    .replace(/\d(?:[\d\s-]{8,}\d)/g, (m) => (m.replace(/\D/g, "").length >= 10 ? "[삭제됨]" : m));
}

function toNum(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[,\s원]|만원/g, ""));
  return Number.isFinite(n) ? n : null;
}

// 만원 단위 금액 — 모델이 원 단위로 돌려준 값(비현실적으로 큰 값)은 만원으로 보정
function toManwon(v, wonThreshold) {
  let n = toNum(v);
  if (n == null || n < 0) return null;
  if (n >= wonThreshold) n = n / 10000;
  return Math.round(n * 10) / 10;
}

// 원 단위 금액(모델이 계약서 숫자를 그대로 옮긴 값) → 만원. 모델은 단위 환산을 자주 틀리므로 환산은 서버가 한다.
// minWon 미만이면 모델이 이미 만원으로 준 것으로 보고 그대로 둔다 (예: 보증금 12000 → 1억2천만원)
function wonToManwon(v, minWon) {
  const n = toNum(v);
  if (n == null || n < 0) return null;
  if (n > 0 && n < minWon) return Math.round(n * 10) / 10;
  return Math.round((n / 10000) * 10) / 10;
}

function toDate(v) {
  if (!v) return null;
  const m = String(v).trim().match(/^(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1990 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function toPhone(v) {
  if (!v) return null;
  const digits = String(v).replace(/\D/g, "");
  const m = digits.match(/^(01[016789])(\d{3,4})(\d{4})$/) || digits.match(/^(02)(\d{3,4})(\d{4})$/) || digits.match(/^(0\d{2})(\d{3,4})(\d{4})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function toText(v, max) {
  if (v == null) return null;
  const s = scrubSensitive(String(v)).replace(/\s+/g, " ").trim();
  if (!s || /^(null|none|unknown|미상|없음|-)$/i.test(s)) return null;
  return s.slice(0, max);
}

// 모델 응답(JSON) → 화이트리스트 필드만, 형식 검증·단위 보정·민감정보 제거
function normalizeScan(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const pType = ["주거", "상가", "토지"].includes(o.property_type) ? o.property_type : null;
  let payDay = null;
  if (/말일/.test(String(o.pay_day ?? ""))) payDay = 99;
  else {
    const p = toNum(o.pay_day);
    if (p === 99 || (Number.isInteger(p) && p >= 1 && p <= 31)) payDay = p;
  }
  const area = toNum(o.area_m2);
  const conf = toNum(o.confidence);
  return {
    address: toText(o.address, 200),
    property_type: pType,
    sub_type: toText(o.sub_type, 20),
    // 1순위: 원 단위(*_won) → 서버 환산. 2순위(예전 형식): *_manwon — 비현실적으로 큰 값은 원 단위로 간주. 저장 전 사용자가 확인
    deposit_manwon: o.deposit_won != null ? wonToManwon(o.deposit_won, 100_000) : toManwon(o.deposit_manwon, 1_000_000),
    monthly_rent_manwon: o.monthly_rent_won != null ? wonToManwon(o.monthly_rent_won, 10_000) : toManwon(o.monthly_rent_manwon, 100_000),
    maintenance_manwon: o.maintenance_won != null ? wonToManwon(o.maintenance_won, 10_000) : toManwon(o.maintenance_manwon, 10_000),
    start_date: toDate(o.start_date),
    end_date: toDate(o.end_date),
    pay_day: payDay,
    tenant_name: toText(o.tenant_name, 30),
    tenant_phone: toPhone(o.tenant_phone),
    area_m2: area != null && area > 0 && area < 100000 ? Math.round(area * 100) / 100 : null,
    confidence: conf != null ? Math.min(1, Math.max(0, conf)) : null,
    notes: toText(o.notes, 300),
  };
}
// ── END-PURE

const SYSTEM = `당신은 한국 주택·상가 임대차 계약서 사진에서 정보를 옮겨 적는 도우미입니다.
규칙:
- 사진에 실제로 보이는 값만 옮깁니다. 읽을 수 없거나 없는 값은 반드시 null. 추측·계산·보완 금지.
- 주민등록번호, 외국인등록번호, 계좌번호, 사업자등록번호, 서명·도장 내용은 절대 출력하지 마세요(notes 에도 금지).
- 금액은 계약서에 적힌 그대로 "원" 단위 정수로 옮깁니다. 괄호 안 아라비아 숫자(₩120,000,000 등)가 있으면 그 숫자를 쉼표 없이 그대로 쓰세요. 한글 금액만 있으면 원 단위로 바꿔 적습니다. 예: "금 일억이천만원정 (₩120,000,000)" → 120000000, "월 550,000원" → 550000, "금 오천만원" → 50000000. 단위 환산(만원 등)은 하지 마세요.
- 전세 계약이면 monthly_rent_won 은 0 입니다(월세 칸이 비어 있고 전세라고 적혀 있을 때만).
- 날짜는 YYYY-MM-DD. start_date 는 임대차 기간 시작일(인도일), end_date 는 종료일. 계약 체결일과 혼동하지 마세요.
- tenant_name/tenant_phone 은 "임차인" 칸의 값만. 임대인·중개사 정보는 넣지 마세요.
- property_type 은 "주거" | "상가" | "토지" 중 하나(상가건물 임대차 표준계약서면 상가).
- sub_type 은 계약서의 건물 구조·용도 표기(예: 아파트, 오피스텔, 다세대, 빌라, 단독주택, 근린생활시설, 사무실).
- pay_day 는 차임 지급일(매월 N일)의 N. "말일"이면 99.
- area_m2 는 임차할 부분(전용) 면적 ㎡ 숫자.
- confidence 는 사진 판독 전반에 대한 자신감 0~1. notes 에는 판독이 애매했던 항목을 한국어로 짧게.`;

const PROMPT = `이 임대차 계약서 사진에서 아래 JSON 형식으로만 답하세요.
{"address":string|null,"property_type":"주거"|"상가"|"토지"|null,"sub_type":string|null,"deposit_won":number|null,"monthly_rent_won":number|null,"maintenance_won":number|null,"start_date":"YYYY-MM-DD"|null,"end_date":"YYYY-MM-DD"|null,"pay_day":number|null,"tenant_name":string|null,"tenant_phone":string|null,"area_m2":number|null,"confidence":number,"notes":string|null}
계약서가 아니거나 글자를 읽을 수 없으면 모든 값을 null, confidence 0, notes 에 이유를 적으세요.`;

export async function POST(req) {
  try {
    const dbg = req.headers.get("x-debug-token");
    const debug = Boolean(dbg && process.env.CRON_SECRET && dbg === process.env.CRON_SECRET);

    let user = null;
    let used = 0;
    if (!debug) {
      user = await userFrom(req);
      if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
      const { count, error } = await admin().from("ai_usage").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("feature", FEATURE).gte("used_at", kstDayStartIso());
      if (error) console.error("[contract-scan] ai_usage count failed:", error.message);
      used = count || 0;
      if (used >= DAILY_LIMIT) {
        return Response.json({ error: `계약서 사진 분석은 하루 ${DAILY_LIMIT}회까지 가능해요. 내일 다시 시도하거나 직접 입력해주세요.`, code: "quota_exceeded", used, limit: DAILY_LIMIT }, { status: 429 });
      }
    }

    if (!llmConfigured()) return Response.json({ error: "AI 분석이 일시적으로 준비되지 않았습니다. 직접 입력해주세요." }, { status: 503 });

    const form = await req.formData().catch(() => null);
    const file = form?.get("image");
    if (!file || typeof file === "string") return Response.json({ error: "사진 파일이 없습니다." }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: "8MB 이하 사진만 분석할 수 있어요." }, { status: 413 });

    const buf = Buffer.from(await file.arrayBuffer());
    const mediaType = sniffImageType(buf.subarray(0, 16));
    if (mediaType === "image/heic") return Response.json({ error: "HEIC 사진은 바로 분석할 수 없어요. JPG로 저장하거나 화면에서 다시 선택해주세요." }, { status: 415 });
    if (!mediaType) return Response.json({ error: "JPG·PNG·WEBP 사진만 분석할 수 있어요." }, { status: 415 });

    let llm;
    try {
      llm = await callVisionLLM({ system: SYSTEM, prompt: PROMPT, imageBase64: buf.toString("base64"), mediaType, json: true, maxTokens: 1200 });
    } catch (e) {
      console.error("[contract-scan] vision failed:", e?.message);
      return Response.json({ error: "AI 분석 서버가 응답하지 않았어요. 잠시 후 다시 시도하거나 직접 입력해주세요.", ...(debug ? { detail: String(e?.message || e).slice(0, 300) } : {}) }, { status: 502 });
    }

    let parsed;
    try { parsed = extractJson(llm.text); }
    catch { return Response.json({ error: "계약서 내용을 읽지 못했어요. 밝은 곳에서 글자가 잘 보이게 다시 찍어주세요." }, { status: 422 }); }

    const fields = normalizeScan(parsed);
    const found = Object.entries(fields).filter(([k, v]) => !["confidence", "notes"].includes(k) && v != null).length;
    if (found === 0) {
      return Response.json({ error: "사진에서 계약 정보를 찾지 못했어요. 계약서 전체가 나오도록 밝게 다시 찍어주세요.", code: "not_recognized", notes: fields.notes }, { status: 422 });
    }

    const result = { fields, provider: llm.provider, model: llm.model };
    if (debug) {
      result.debug = { raw: scrubSensitive(llm.text).slice(0, 2000), mediaType, bytes: buf.length };
    } else {
      const { error: usageErr } = await admin().from("ai_usage").insert({
        user_id: user.id, feature: FEATURE, year: new Date().getFullYear(), month: new Date().getMonth() + 1, used_at: new Date().toISOString(),
      });
      if (usageErr) console.error("[contract-scan] ai_usage insert failed:", usageErr.message);
      result.usage = { used: used + 1, limit: DAILY_LIMIT };
    }
    return Response.json(result);
  } catch (err) {
    console.error("[contract-scan] error:", err?.message);
    return Response.json({ error: "분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
