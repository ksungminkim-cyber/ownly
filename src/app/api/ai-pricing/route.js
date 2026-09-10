// AI 임대료 분석: MOLIT 실거래 데이터 선조회 → LLM 분석 (src/lib/llm.js — Claude 우선, Groq 폴백)
// 상가·토지처럼 월세 실거래가 없는 유형은 매매가 기반 수익률 역산
//
// 한도 정책 (서버에서 강제 — 클라이언트 체크는 UX 용):
//  - 로그인 유저(Authorization: Bearer <supabase access token>): 월 한도 = 얼리 액세스 중 서포터 60회 / 일반 30회,
//    정식 과금 후 PLANS[plan].limits.aiPricing. 성공 시 ai_usage 에 서버가 기록.
//  - 비로그인(/diagnose 공개 진단): IP 당 시간당 10회
export const runtime = "nodejs";
export const maxDuration = 60;

import { createClient } from "@supabase/supabase-js";
import { callLLM, extractJson, llmConfigured } from "../../../lib/llm";
import { PLANS, EARLY_ACCESS_FREE, EARLY_SUPPORTER } from "../../../lib/constants";
import { paidPlanOf, activePlanOf } from "../../../lib/plan";
import { internalHeaders } from "../../../lib/ratelimit";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Bearer 토큰 → 유저 + 이번 달 AI 분석 한도/사용량
async function resolveQuota(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const sb = admin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  const user = data.user;

  const { data: sub } = await sb.from("subscriptions").select("plan,status,current_period_end,kakao_sid,billing_key").eq("user_id", user.id).maybeSingle();
  const paid = paidPlanOf(sub);          // 결제 수단이 등록된 실제 유료 구독 (얼리 서포터 판정)
  const plan = activePlanOf(sub);        // 정식 과금 후 기능 게이트 (trial 포함)
  const limit = EARLY_ACCESS_FREE
    ? (paid !== "free" ? EARLY_SUPPORTER.aiMonthly : PLANS.pro.limits.aiPricing)
    : ((PLANS[plan] || PLANS.free).limits.aiPricing || 0);

  const now = new Date();
  const { count } = await sb.from("ai_usage").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).eq("feature", "aiPricing").eq("year", now.getFullYear()).eq("month", now.getMonth() + 1);
  return { user, plan, limit, used: count || 0, supporter: EARLY_ACCESS_FREE && paid !== "free" };
}

// MOLIT 접근은 검증된 내부 프록시(/api/market/molit — XML 파싱·키 관리 단일 지점)를 통해서만 한다.
// 직접 호출 시 응답 포맷(JSON/XML) 차이로 실거래가 누락되던 문제를 없애기 위함.
const SITE_BASE = process.env.SITE_URL || "https://www.ownly.kr";
const MOLIT_TYPES = new Set(["apt_rent", "apt_trade", "villa_rent", "villa_trade", "offi_rent", "offi_trade", "house_rent", "house_trade", "nrg_trade", "land_trade"]);

function last3MonthsYM() {
  const now = new Date();
  const out = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

// diag: 운영 진단용 수집기 (x-debug-token 헤더가 CRON_SECRET 과 일치할 때만 응답에 포함)
async function fetchMolitRows(type, lawdCd, base = SITE_BASE, diag = null, numMonths = 3) {
  if (!MOLIT_TYPES.has(type) || !lawdCd) return [];
  const months = last3MonthsYM().slice(0, numMonths);
  // 월별 조회를 병렬로 — 응답 시간 단축 (LLM 호출 전 대기 최소화)
  const perMonth = await Promise.all(months.map(async (ym) => {
    const url = `${base}/api/market/molit?type=${type}&lawdCd=${encodeURIComponent(lawdCd)}&dealYm=${ym}&numOfRows=100`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: internalHeaders() });
      if (!res.ok) { diag?.errors.push(`${type} ${ym} HTTP ${res.status}`); return []; }
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      if (diag) diag.rows[`${type}:${ym}`] = items.length;
      return items;
    } catch (e) {
      console.warn("[ai-pricing] MOLIT proxy failed:", type, ym, e?.message);
      diag?.errors.push(`${type} ${ym} ${e?.name || ""} ${e?.message || ""}`.trim());
      return [];
    }
  }));
  return perMonth.flat();
}

// 임대 데이터 통계 — 월세(monthlyRent) > 0인 행만 + 면적 기반 평당 월세 집계
// MOLIT 숫자 필드는 "57,700" 처럼 천 단위 콤마가 포함됨 → 콤마 제거 후 숫자화 (아니면 NaN 으로 전부 탈락)
const num = (v) => Number(String(v ?? 0).replace(/,/g, "").trim()) || 0;

function analyzeRentRows(rows) {
  // 면적 읽기 유틸 (MOLIT: excluUseAr = 전용면적㎡, totalFloorAr = 단독주택 연면적)
  const areaSqm = (r) => num(r.excluUseAr || r.totalFloorAr || r.bldArea || 0);
  const toPyeong = (sqm) => sqm > 0 ? Math.round(sqm / 3.3058 * 10) / 10 : 0;

  const monthly = rows.map(r => num(r.monthlyRent)).filter(v => v > 0).sort((a, b) => a - b);
  if (monthly.length === 0) return null;
  const median = monthly[Math.floor(monthly.length / 2)];
  const avg = Math.round(monthly.reduce((s, v) => s + v, 0) / monthly.length);
  const p25 = monthly[Math.floor(monthly.length * 0.25)];
  const p75 = monthly[Math.floor(monthly.length * 0.75)];

  const deposits = rows.filter(r => num(r.monthlyRent) > 0).map(r => num(r.deposit)).filter(v => v > 0).sort((a, b) => a - b);
  const medDep = deposits.length > 0 ? deposits[Math.floor(deposits.length / 2)] : 0;

  // 평당 월세 — 월세·면적 모두 유효한 행만 사용
  const rentPerPyList = rows
    .map(r => ({ rent: num(r.monthlyRent), py: toPyeong(areaSqm(r)) }))
    .filter(x => x.rent > 0 && x.py > 0)
    .map(x => x.rent / x.py);
  const avgRentPerPy = rentPerPyList.length > 0
    ? Math.round(rentPerPyList.reduce((s, v) => s + v, 0) / rentPerPyList.length * 10) / 10
    : 0;

  const pyList = rows.map(r => toPyeong(areaSqm(r))).filter(v => v > 0);
  const avgAreaPy = pyList.length > 0
    ? Math.round(pyList.reduce((s, v) => s + v, 0) / pyList.length * 10) / 10
    : 0;

  // 샘플 comparables — 실제 MOLIT 3건 골라서 반환 (면적·월세·보증금 포함)
  const samples = rows
    .filter(r => num(r.monthlyRent) > 0 && areaSqm(r) > 0)
    .slice(0, 3)
    .map(r => ({
      type: `${r.aptNm || r.aptName || r.mhouseNm || r.houseType || r.offiNm || "인근 실거래"}${r.floor ? ` ${r.floor}층` : ""}`,
      rent: num(r.monthlyRent),
      deposit: num(r.deposit),
      areaPyeong: toPyeong(areaSqm(r)),
      note: `${r.dealYear || ""}.${String(r.dealMonth || "").padStart(2, "0")} 실거래 · ${r.buildYear ? `${r.buildYear}년 준공` : ""}`.trim(),
    }));

  return { median, avg, p25, p75, medDep, avgRentPerPy, avgAreaPy, count: monthly.length, rentCount: monthly.length, totalRows: rows.length, samples };
}

// 매매 데이터 통계 — 상가/토지는 전월세 데이터가 없으므로 매매가로 임대료 역산
function analyzeTradeRows(rows, propertyType) {
  // 면적 읽기: 상가는 bldArea (건축면적), 토지는 dealArea (거래면적)
  const areaSqm = (r) => Number(String(r.bldArea || r.buildingAr || r.dealArea || r.plottageAr || 0).replace(/,/g, "").trim());
  const toPyeong = (sqm) => sqm > 0 ? Math.round(sqm / 3.3058 * 10) / 10 : 0;

  const prices = rows.map(r => Number(String(r.dealAmount || "0").replace(/,/g, "").trim())).filter(v => v > 0).sort((a, b) => a - b);
  if (prices.length === 0) return null;

  const median = prices[Math.floor(prices.length / 2)];
  const avg = Math.round(prices.reduce((s, v) => s + v, 0) / prices.length);

  // Cap Rate: 상가 5%, 토지 2%, 기타 4%
  const capRate = propertyType === "상가" ? 0.05 : propertyType === "토지" ? 0.02 : 0.04;
  const estimatedMonthlyRent = Math.round((median * capRate) / 12);
  const estimatedDeposit = estimatedMonthlyRent * 10;

  // 면적 통계 (평당 역산)
  const pyList = rows.map(r => toPyeong(areaSqm(r))).filter(v => v > 0);
  const avgAreaPy = pyList.length > 0
    ? Math.round(pyList.reduce((s, v) => s + v, 0) / pyList.length * 10) / 10
    : 0;
  const avgRentPerPy = avgAreaPy > 0 ? Math.round(estimatedMonthlyRent / avgAreaPy * 10) / 10 : 0;

  // 샘플 comparables — 실제 매매 3건으로 월세 역산
  const samples = rows
    .filter(r => Number(String(r.dealAmount || "0").replace(/,/g, "").trim()) > 0 && areaSqm(r) > 0)
    .slice(0, 3)
    .map(r => {
      const price = Number(String(r.dealAmount || "0").replace(/,/g, "").trim());
      const py = toPyeong(areaSqm(r));
      return {
        type: `${r.bldNm || r.aptNm || "인근 매매 실거래"}${r.floor ? ` ${r.floor}층` : ""}`,
        rent: Math.round((price * capRate) / 12),
        deposit: Math.round((price * capRate) / 12) * 10,
        areaPyeong: py,
        note: `매매 ${(price/10000).toFixed(1)}억 기반 추정 · 수익률 ${(capRate*100).toFixed(1)}%`,
      };
    });

  return {
    median: estimatedMonthlyRent,
    avg: estimatedMonthlyRent,
    p25: Math.round((prices[Math.floor(prices.length * 0.25)] * capRate) / 12),
    p75: Math.round((prices[Math.floor(prices.length * 0.75)] * capRate) / 12),
    medDep: estimatedDeposit,
    avgRentPerPy,
    avgAreaPy,
    count: prices.length,
    rentCount: 0,
    totalRows: rows.length,
    salesData: { medianPrice: median, avgPrice: avg, capRate },
    isEstimatedFromSales: true,
    samples,
  };
}

// 유형별 MOLIT 데이터 집계
async function fetchMarketData(propertyType, lawdCd, base, diag) {
  if (propertyType === "주거") {
    // 아파트 + 빌라 + 단독 임대 합산
    const [apt, villa, house] = await Promise.all([
      fetchMolitRows("apt_rent", lawdCd, base, diag),
      fetchMolitRows("villa_rent", lawdCd, base, diag),
      fetchMolitRows("house_rent", lawdCd, base, diag),
    ]);
    const all = [...apt, ...villa, ...house];
    const stats = analyzeRentRows(all);
    return stats ? { ...stats, source: "apt+villa+house rent", hasRealData: true } : null;
  }
  if (propertyType === "오피스텔") {
    const rows = await fetchMolitRows("offi_rent", lawdCd, base, diag);
    const stats = analyzeRentRows(rows);
    return stats ? { ...stats, source: "offi_rent", hasRealData: true } : null;
  }
  if (propertyType === "상가") {
    // 월세 데이터 없음 → 상업·업무용 매매가 기반 역산
    const rows = await fetchMolitRows("nrg_trade", lawdCd, base, diag);
    const stats = analyzeTradeRows(rows, "상가");
    return stats ? { ...stats, source: "nrg_trade (sales→rent estimate)", hasRealData: true } : null;
  }
  if (propertyType === "토지") {
    const rows = await fetchMolitRows("land_trade", lawdCd, base, diag);
    const stats = analyzeTradeRows(rows, "토지");
    return stats ? { ...stats, source: "land_trade (sales→rent estimate)", hasRealData: true } : null;
  }
  return null;
}

function buildPricingPrompt(address, propertyType, marketStats, options = {}) {
  const myRentHint = options.myRent ? `임대인이 입력한 현재 월세: ${options.myRent}만원` : "";
  const myAreaHint = options.areaPyeong ? `전용면적: ${options.areaPyeong}평` : "";

  const dataBlock = marketStats
    ? `
🏢 **실거래 데이터 근거 (국토교통부)**:
- 데이터 소스: ${marketStats.source}
- 분석 거래 수: ${marketStats.totalRows}건 (유효 ${marketStats.count}건)
- 월세 중위값: ${marketStats.median.toLocaleString()}만원
- 월세 평균: ${marketStats.avg.toLocaleString()}만원
- 25%~75% 구간: ${marketStats.p25}~${marketStats.p75}만원
- 중위 보증금: ${marketStats.medDep.toLocaleString()}만원
- 평균 전용면적: ${marketStats.avgAreaPy || "집계 불가"}평
- 평당 월세 (계산값): ${marketStats.avgRentPerPy || "집계 불가"}만원/평
${marketStats.isEstimatedFromSales ? `- ⚠️ 매매 실거래(중위 ${marketStats.salesData.medianPrice.toLocaleString()}만원)에 수익률 ${(marketStats.salesData.capRate*100).toFixed(1)}%를 적용해 역산한 추정치` : ""}

**중요**: 위 실제 수치를 근거로 답하세요. comparables는 반드시 areaPyeong(전용면적 평) 포함.`
    : `
⚠️ **주의**: 이 지역의 실거래 데이터를 조회할 수 없었습니다.
일반 시장 지식에 근거해 **추정치**로 분석하되, 보수적으로 수치를 제시하세요.`;

  return `당신은 15년 경력의 한국 부동산 임대료 전문 감정평가사입니다.
아래 주소의 2026년 현재 시점 적정 임대료를 추정하세요.

주소: "${address}"
물건 유형: ${propertyType}
${myRentHint}
${myAreaHint}
${dataBlock}

추정 방법:
1) 실거래 데이터가 있으면 그 수치를 기반으로 ±10% 범위 내에서 판단
2) 없으면 일반 시장 지식 + 지역 특성으로 추정
3) 상가라면 1층 vs 상층, 유동인구, 주차, 간판 노출도를 반영
4) 토지라면 용도지역·도로 접면을 기반으로 농지·주차장 수준 임대료 범위

단위 규칙:
- rent/avgRent/comparables.rent: "만원/월" 단위 정수 (예: 120 = 120만원/월)
- deposit/avgDeposit/comparables.deposit: "만원" 단위 정수 (예: 5000 = 5,000만원)
- pricePerSqm: "만원/평" 단위

JSON 형식으로만 응답 (마크다운·코드블록·주석 금지):
{
  "rentRange": { "min": 80, "max": 120, "unit": "만원/월" },
  "depositRange": { "min": 3000, "max": 5000, "unit": "만원" },
  "marketPosition": "적정",
  "marketPositionScore": 0,
  "avgRent": 100,
  "avgDeposit": 4000,
  "avgAreaPy": 20,
  "rentPerPy": 5.0,
  "comparables": [
    { "type": "인근 유사 매물 A", "rent": 90, "deposit": 3000, "areaPyeong": 18, "note": "반경 300m 내" },
    { "type": "인근 유사 매물 B", "rent": 100, "deposit": 4000, "areaPyeong": 20, "note": "최근 6개월 거래" },
    { "type": "인근 프리미엄 매물", "rent": 115, "deposit": 5000, "areaPyeong": 22, "note": "리모델링 완료" }
  ],
  "strategy": "임대 전략 3문장",
  "vacancyRisk": "보통",
  "bestTiming": "최적 시기 1문장",
  "negotiationTip": "협상 팁 1~2문장",
  "priceTrend": "보합",
  "trendReason": "추세 이유 1문장"
}

규칙:
- marketPosition: "고평가" | "적정" | "저평가" 중 하나
- marketPositionScore: -2~2 정수
- vacancyRisk: "낮음" | "보통" | "높음"
- priceTrend: "상승" | "보합" | "하락"
- 모든 텍스트 순수 한글
- JSON 객체만 반환`;
}

// 간이 레이트리밋 — 비로그인 호출(/diagnose)로 Groq·MOLIT 비용이 무제한 노출되는 것 방지.
// 서버리스 인스턴스별 메모리 기준이라 완전하지 않지만 대량 남용은 차단됨.
const RATE_LIMIT = 10;                  // IP당 허용 횟수
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1시간
const rateMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  if (rateMap.size > 5000) {
    for (const [k, v] of rateMap) if (now - v.start > RATE_WINDOW_MS) rateMap.delete(k);
  }
  const rec = rateMap.get(ip);
  if (!rec || now - rec.start > RATE_WINDOW_MS) {
    rateMap.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT;
}

export async function POST(req) {
  try {
    if (!llmConfigured()) return Response.json({ error: "AI 분석이 일시적으로 준비되지 않았습니다. 잠시 후 다시 시도해주세요." }, { status: 503 });

    // 로그인 유저는 월 한도, 비로그인은 IP 시간당 한도
    const quota = await resolveQuota(req);
    if (quota) {
      if (quota.limit <= 0) {
        return Response.json({ error: "AI 임대료 분석은 유료 플랜 기능입니다.", code: "plan_required" }, { status: 403 });
      }
      if (quota.used >= quota.limit) {
        return Response.json({
          error: quota.supporter
            ? `이번 달 AI 분석 ${quota.limit}회를 모두 사용했습니다. 다음 달 1일에 초기화됩니다.`
            : `이번 달 AI 분석 ${quota.limit}회를 모두 사용했습니다. 얼리 서포터 구독 시 월 ${EARLY_SUPPORTER.aiMonthly}회로 늘어납니다.`,
          code: "quota_exceeded", used: quota.used, limit: quota.limit,
        }, { status: 429 });
      }
    } else {
      const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
      if (isRateLimited(ip)) {
        return Response.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
      }
    }

    const { address, propertyType = "주거", lawdCd, myRent, areaPyeong } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });
    // 내부 MOLIT 프록시 호출용 베이스 — 현재 배포 호스트 우선 (프리뷰·로컬에서도 동작)
    const host = req.headers.get("host") || "";
    const reqBase = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : SITE_BASE;
    // 운영 진단: x-debug-token 이 CRON_SECRET 과 일치하면 MOLIT 조회 결과/오류를 응답에 동봉
    const dbg = req.headers.get("x-debug-token");
    const diag = dbg && process.env.CRON_SECRET && dbg === process.env.CRON_SECRET ? { version: "2026-09-09a", base: reqBase, rows: {}, errors: [] } : null;

    // 1. MOLIT 실거래 데이터 선조회
    let marketStats = null;
    if (lawdCd) {
      try {
        marketStats = await fetchMarketData(propertyType, lawdCd, reqBase, diag);
      } catch (e) {
        console.warn("MOLIT fetch 실패:", e.message);
      }
    }

    // 2. LLM 호출 (Claude 우선 → Groq 폴백)
    let llm;
    try {
      llm = await callLLM({
        system: "You are a Korean real estate pricing expert. Output ONLY valid JSON. No markdown. All rent/deposit in 만원 units. All text in Korean.",
        user: buildPricingPrompt(address, propertyType, marketStats, { myRent, areaPyeong }),
        json: true, maxTokens: 2500, effort: "medium", temperature: 0.3,
      });
    } catch (e) {
      console.error("[ai-pricing] llm failed:", e?.message);
      return Response.json({ error: "AI 분석 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요. (사용 횟수는 차감되지 않았습니다)" }, { status: 502 });
    }

    let result;
    try { result = extractJson(llm.text); }
    catch (e) {
      console.error("[ai-pricing] parse failed:", e?.message, llm.text?.slice(0, 200));
      return Response.json({ error: "AI 응답을 해석하지 못했습니다. 다시 시도해주세요. (사용 횟수는 차감되지 않았습니다)" }, { status: 502 });
    }
    if (!result || typeof result !== "object" || !result.rentRange) {
      return Response.json({ error: "AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요. (사용 횟수는 차감되지 않았습니다)" }, { status: 502 });
    }

    // 원 단위 자동 변환
    const toMan = (v) => (v && v >= 10000 ? Math.round(v / 10000) : v);
    if (result.avgRent >= 10000) result.avgRent = toMan(result.avgRent);
    if (result.avgDeposit >= 10000) result.avgDeposit = toMan(result.avgDeposit);
    if (result.rentRange) {
      result.rentRange.min = toMan(result.rentRange.min);
      result.rentRange.max = toMan(result.rentRange.max);
    }
    if (result.depositRange) {
      result.depositRange.min = toMan(result.depositRange.min);
      result.depositRange.max = toMan(result.depositRange.max);
    }
    if (result.comparables) {
      result.comparables = result.comparables.map(c => ({ ...c, rent: toMan(c.rent), deposit: toMan(c.deposit) }));
    }

    // 실거래 샘플이 있으면 AI comparables를 대체 (실 데이터 우선)
    if (marketStats?.samples?.length) {
      result.comparables = marketStats.samples;
    }

    // 평당 월세 — AI 값이 이상하거나 비어있으면 실측값으로 덮어씀
    if (marketStats?.avgRentPerPy && (!result.rentPerPy || result.rentPerPy <= 0 || result.rentPerPy > 200)) {
      result.rentPerPy = marketStats.avgRentPerPy;
    }
    if (marketStats?.avgAreaPy && !result.avgAreaPy) {
      result.avgAreaPy = marketStats.avgAreaPy;
    }

    // 메타데이터 추가
    result.address = address;
    result.propertyType = propertyType;
    result.analysisDate = new Date().toLocaleDateString("ko-KR");
    result.hasRealData = !!marketStats;
    result.marketStats = marketStats;
    result.rawStats = marketStats ? {
      avgRentPerPy: marketStats.avgRentPerPy,
      avgAreaPy: marketStats.avgAreaPy,
      median: marketStats.median,
      medDep: marketStats.medDep,
      count: marketStats.count,
    } : null;
    result.dataNote = marketStats
      ? (marketStats.isEstimatedFromSales
          ? `📊 ${marketStats.source.split(" ")[0]} 실거래 ${marketStats.totalRows}건의 매매가를 기반으로 수익률 역산 (${propertyType} 월세 실거래 미공개)`
          : `📊 국토부 실거래 ${marketStats.totalRows}건 (유효 ${marketStats.count}건, 평균 ${marketStats.avgAreaPy}평) 분석`)
      : null;

    result.engine = llm.provider;
    if (diag) result.debug = diag;

    // 3. 성공한 분석만 사용량 기록 (로그인 유저) — 실패·오류는 차감하지 않음
    if (quota) {
      const now = new Date();
      const { error: usageErr } = await admin().from("ai_usage").insert({
        user_id: quota.user.id, feature: "aiPricing", year: now.getFullYear(), month: now.getMonth() + 1, used_at: now.toISOString(),
      });
      if (usageErr) console.error("[ai-pricing] ai_usage insert failed:", usageErr.message);
      result.usage = { used: quota.used + 1, limit: quota.limit };
    }

    return Response.json(result);
  } catch (err) {
    console.error("임대료 분석 오류:", err.message);
    return Response.json({ error: "분석 오류: " + err.message }, { status: 500 });
  }
}
