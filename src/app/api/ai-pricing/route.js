// 개선된 AI 임대료 분석: MOLIT 실거래 데이터 선조회 → Groq 분석
// 상가·토지처럼 월세 실거래가 없는 유형은 매매가 기반 수익률 역산
export const runtime = "edge";

const MOLIT_BASE = "http://apis.data.go.kr/1613000/";
const MOLIT_ENDPOINTS = {
  apt_rent:    "RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
  apt_trade:   "RTMSDataSvcAptTrade/getRTMSDataSvcAptTradeDev",
  villa_rent:  "RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
  villa_trade: "RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade",
  offi_rent:   "RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
  offi_trade:  "RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade",
  house_rent:  "RTMSDataSvcSHRent/getRTMSDataSvcSHRent",
  house_trade: "RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade",
  nrg_trade:   "RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade",
  land_trade:  "RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade",
};

function getMolitKey(type) {
  const fallback = process.env.MOLIT_SERVICE_KEY;
  const envVar = `MOLIT_${type.toUpperCase()}_KEY`;
  return process.env[envVar] || fallback;
}

function last3MonthsYM() {
  const now = new Date();
  const out = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

async function fetchMolitRows(type, lawdCd, numMonths = 3) {
  const key = getMolitKey(type);
  const baseUrl = MOLIT_ENDPOINTS[type];
  if (!key || !baseUrl || !lawdCd) return [];
  const months = last3MonthsYM().slice(0, numMonths);
  const rows = [];
  for (const ym of months) {
    try {
      const url = `${MOLIT_BASE}${baseUrl}?serviceKey=${encodeURIComponent(key)}&LAWD_CD=${lawdCd}&DEAL_YMD=${ym}&pageNo=1&numOfRows=100&_type=json`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const items = data?.response?.body?.items?.item;
      if (Array.isArray(items)) rows.push(...items);
      else if (items) rows.push(items);
    } catch {}
  }
  return rows;
}

// 임대 데이터 통계 — 월세(monthlyRent) > 0인 행만 + 면적 기반 평당 월세 집계
function analyzeRentRows(rows) {
  // 면적 읽기 유틸 (MOLIT: excluUseAr = 전용면적㎡, totalFloorAr = 단독주택 연면적)
  const areaSqm = (r) => Number(String(r.excluUseAr || r.totalFloorAr || r.bldArea || 0).replace(/,/g, "").trim());
  const toPyeong = (sqm) => sqm > 0 ? Math.round(sqm / 3.3058 * 10) / 10 : 0;

  const monthly = rows.map(r => Number(r.monthlyRent || 0)).filter(v => v > 0).sort((a, b) => a - b);
  if (monthly.length === 0) return null;
  const median = monthly[Math.floor(monthly.length / 2)];
  const avg = Math.round(monthly.reduce((s, v) => s + v, 0) / monthly.length);
  const p25 = monthly[Math.floor(monthly.length * 0.25)];
  const p75 = monthly[Math.floor(monthly.length * 0.75)];

  const deposits = rows.map(r => Number(r.deposit || 0)).filter(v => v > 0).sort((a, b) => a - b);
  const medDep = deposits.length > 0 ? deposits[Math.floor(deposits.length / 2)] : 0;

  // 평당 월세 — 월세·면적 모두 유효한 행만 사용
  const rentPerPyList = rows
    .map(r => ({ rent: Number(r.monthlyRent || 0), py: toPyeong(areaSqm(r)) }))
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
    .filter(r => Number(r.monthlyRent || 0) > 0 && areaSqm(r) > 0)
    .slice(0, 3)
    .map(r => ({
      type: `${r.aptName || r.houseType || r.offiNm || "인근 실거래"}${r.floor ? ` ${r.floor}층` : ""}`,
      rent: Number(r.monthlyRent),
      deposit: Number(r.deposit || 0),
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
async function fetchMarketData(propertyType, lawdCd) {
  if (propertyType === "주거") {
    // 아파트 + 빌라 + 단독 임대 합산
    const [apt, villa, house] = await Promise.all([
      fetchMolitRows("apt_rent", lawdCd),
      fetchMolitRows("villa_rent", lawdCd),
      fetchMolitRows("house_rent", lawdCd),
    ]);
    const all = [...apt, ...villa, ...house];
    const stats = analyzeRentRows(all);
    return stats ? { ...stats, source: "apt+villa+house rent", hasRealData: true } : null;
  }
  if (propertyType === "오피스텔") {
    const rows = await fetchMolitRows("offi_rent", lawdCd);
    const stats = analyzeRentRows(rows);
    return stats ? { ...stats, source: "offi_rent", hasRealData: true } : null;
  }
  if (propertyType === "상가") {
    // 월세 데이터 없음 → 상업·업무용 매매가 기반 역산
    const rows = await fetchMolitRows("nrg_trade", lawdCd);
    const stats = analyzeTradeRows(rows, "상가");
    return stats ? { ...stats, source: "nrg_trade (sales→rent estimate)", hasRealData: true } : null;
  }
  if (propertyType === "토지") {
    const rows = await fetchMolitRows("land_trade", lawdCd);
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

export async function POST(req) {
  try {
    const { address, propertyType = "주거", lawdCd, myRent, areaPyeong } = await req.json();
    if (!address) return Response.json({ error: "주소를 입력해주세요." }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: "AI API 키 미설정 (GROQ_API_KEY)" }, { status: 500 });

    // 1. MOLIT 실거래 데이터 선조회
    let marketStats = null;
    if (lawdCd) {
      try {
        marketStats = await fetchMarketData(propertyType, lawdCd);
      } catch (e) {
        console.warn("MOLIT fetch 실패:", e.message);
      }
    }

    // 2. Groq 호출
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a Korean real estate pricing expert. Output ONLY valid JSON. No markdown. All rent/deposit in 만원 units. All text in Korean." },
          { role: "user", content: buildPricingPrompt(address, propertyType, marketStats, { myRent, areaPyeong }) },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    const rawText = await res.text();
    let data;
    try { data = JSON.parse(rawText); }
    catch { return Response.json({ error: `Groq 파싱 실패: ${rawText.substring(0, 300)}` }, { status: 500 }); }

    if (!res.ok) {
      const errMsg = data?.error?.message || data?.error || JSON.stringify(data);
      return Response.json({ error: "분석 오류: " + errMsg }, { status: res.status });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) return Response.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });

    let result;
    try { result = JSON.parse(content); }
    catch {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      try { result = JSON.parse(content.slice(start, end + 1)); }
      catch (e) { return Response.json({ error: `파싱 실패: ${e.message}` }, { status: 500 }); }
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

    return Response.json(result);
  } catch (err) {
    console.error("임대료 분석 오류:", err.message);
    return Response.json({ error: "분석 오류: " + err.message }, { status: 500 });
  }
}
