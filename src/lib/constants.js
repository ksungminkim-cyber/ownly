export const C = { bg: "#f5f4f0", surface: "#ffffff", surfaceHover: "#f8f7f4", border: "#e8e6e0", borderFocus: "#1a2744", text: "#1a1a2e", muted: "#8a8a9a", faint: "#f0efe9", indigo: "#1a2744", indigoLight: "#2d4270", purple: "#5b4fcf", rose: "#e8445a", emerald: "#0fa573", amber: "#e8960a", sky: "#1e7fcb", gold: "#c9920a", coral: "#ff5a3c", teal: "#0d9488", navy: "#1a2744", cream: "#f5f4f0", white: "#ffffff", };
export const STATUS_MAP = { "정상": { c: "#0fa573", bg: "rgba(15,165,115,0.1)" }, "미납": { c: "#e8445a", bg: "rgba(232,68,90,0.1)" }, "만료임박":{ c: "#e8960a", bg: "rgba(232,150,10,0.1)" }, };
export const INTENT_MAP = { "갱신의향 있음": { c: "#0fa573", bg: "rgba(15,165,115,0.1)" }, "갱신의향 없음": { c: "#e8445a", bg: "rgba(232,68,90,0.1)" }, "협의중": { c: "#e8960a", bg: "rgba(232,150,10,0.1)" }, "미확인": { c: "#8a8a9a", bg: "#f0efe9" }, };
export const PAY_MAP = { paid: { label: "납부완료", c: "#0fa573", bg: "rgba(15,165,115,0.1)" }, unpaid: { label: "미납", c: "#e8445a", bg: "rgba(232,68,90,0.1)" }, late: { label: "연체", c: "#e8960a", bg: "rgba(232,150,10,0.1)" }, };
export const COLORS = ["#1a2744", "#e8960a", "#e8445a", "#1e7fcb", "#5b4fcf", "#0fa573", "#2d4270"];

// ─── 요금제 (2026-09-10 단순화: 무료 / 플러스 월 9,900원) ─────────────
// 유료 플랜은 플러스 하나뿐입니다. 한도·가격·기능 문구는 여기서만 정의하고, 요금제 화면(대시보드·공개)·서버 한도 판정
// (api/kakao/send · api/ai-pricing · AppContext)·안내 문구가 전부 PLANS 를 읽습니다. 숫자를 바꿀 땐 이 파일만 고치면 됩니다.
export const PAID_PLAN_ID = "plus";
export const PLANS = {
  free: {
    id: "free",
    name: "무료",
    price: 0,
    priceLabel: "무료",
    color: C.muted,
    emoji: "🌱",
    tagline: "혼자 관리하는 임대인의 기본 도구",
    limits: {
      properties: 3, tenants: 5,
      reports: true, tax: false, certified: 1, vacancy: false, export: false,
      roi: false, vacancyLoss: false, leaseCheck: false, mapSearch: false,
      aiPricing: 3, kakaoAlert: false, kakaoMonthly: 0, globalReports: false, profitAnalysis: false,
    },
    features: [
      { t: "물건 최대 3개 · 세입자 최대 5명", ok: true },
      { t: "수금 현황 · 계약 · 캘린더 관리", ok: true },
      { t: "수익 리포트 기본", ok: true },
      { t: "내용증명 정식 발급 월 1건 (미리보기 무제한)", ok: true },
      { t: "AI 임대료 분석 월 3회", ok: true },
      { t: "카카오 알림톡 발송", ok: false },
      { t: "세금 시뮬레이터 · 수익 분석 · 공실 관리", ok: false },
      { t: "주변 매물 조회 · 시장 리포트 · PDF 내보내기", ok: false },
    ],
  },
  plus: {
    id: "plus",
    name: "플러스",
    price: 9900,
    priceLabel: "9,900원/월",
    color: "#4f46e5",
    emoji: "📊",
    tagline: "임대 관리에 필요한 전부, 월 9,900원",
    badge: "전체 기능",
    limits: {
      properties: Infinity, tenants: Infinity,
      reports: true, tax: true, certified: Infinity, vacancy: true, export: true,
      roi: true, vacancyLoss: true, leaseCheck: true, mapSearch: true,
      aiPricing: 60, kakaoAlert: true, kakaoMonthly: 100, globalReports: true, profitAnalysis: true,
    },
    features: [
      { t: "물건 · 세입자 무제한", ok: true },
      { t: "내용증명 정식 발급 무제한", ok: true },
      { t: "카카오 알림톡 월 100건 (세입자 독촉·안내)", ok: true },
      { t: "AI 임대료 분석 월 60회", ok: true },
      { t: "세금 시뮬레이터 · 수익 분석 · 세금계산서", ok: true },
      { t: "공실 관리 · 수익률 · 공실 손실 계산기 · 임대차 3법", ok: true },
      { t: "주변 매물 조회 · 시세 추이 · 물건 가치 평가", ok: true },
      { t: "PDF 내보내기 · 이메일 지원", ok: true },
    ],
  },
};
// 요금제 비교표 행 — 두 요금제 화면이 같은 표를 그린다. key 는 PLANS[*].limits 의 키.
export const PLAN_COMPARE = [
  { label: "물건 수", key: "properties", unit: "개" },
  { label: "세입자 수", key: "tenants", unit: "명" },
  { label: "내용증명 정식 발급 (워터마크 없음)", key: "certified", unit: "건/월" },
  { label: "카카오 알림톡 (세입자 독촉·안내)", key: "kakaoMonthly", unit: "건/월" },
  { label: "AI 임대료 분석 (국토부 실거래 기반)", key: "aiPricing", unit: "회/월" },
  { label: "수익 리포트", key: "reports" },
  { label: "세금 시뮬레이터 · 세금계산서", key: "tax" },
  { label: "수익 분석 (양도세·의사결정)", key: "profitAnalysis" },
  { label: "공실 관리", key: "vacancy" },
  { label: "수익률 · 공실 손실 계산기", key: "roi" },
  { label: "임대차 3법 체크", key: "leaseCheck" },
  { label: "시장 리포트 (시세 추이·수익률 벤치마크·가치 평가)", key: "globalReports" },
  { label: "주변 매물 조회", key: "mapSearch" },
  { label: "PDF 내보내기", key: "export" },
];
export function fmtLimit(v, unit = "") {
  if (v === Infinity) return "무제한";
  if (v === true) return true;
  if (!v) return false;
  return `${v}${unit}`;
}

// ─── 기존 가입자 보호 ─────────────────────────────
// 2026-09-10 이전에는 "2026년 12월 31일까지 프로 기능 무료"를 공개적으로 약속했습니다. 그 전에 가입한 계정은 그 날짜까지
// 플러스 기능을 그대로 무료로 쓰고, 실비 항목(내용증명·알림톡·AI)만 당시와 같은 월 한도를 유지합니다. 이후엔 무료 플랜 한도가 적용됩니다.
// 판정은 src/lib/plan.js 의 isLegacyFreeUser / entitlementsOf 한 곳에서 합니다.
export const LEGACY_SIGNUP_BEFORE = "2026-09-11T00:00:00+09:00";
export const LEGACY_FREE_UNTIL = "2026-12-31T23:59:59+09:00";
export const LEGACY_FREE_UNTIL_LABEL = "2026년 12월 31일";
export const LEGACY_LIMITS = { certified: 3, kakaoMonthly: 30, aiPricing: 30 };

// 랜딩·정책·커뮤니티·요금제 등 공개 화면의 "무료" 한 줄 문구 — 한 곳에서만 관리해 화면마다 다르게 말하지 않는다.
export const FREE_TAGLINE = `무료로 시작 · 카드 등록 불필요 · 전체 기능은 월 ${PLANS.plus.price.toLocaleString()}원`;
// 무료 도구 → 가입 딥링크용 localStorage 키 (도구 페이지가 저장, 대시보드가 소비)
export const CERTIFIED_DRAFT_KEY = "ownly_certified_draft";   // /tools/certified 초안
export const PREFILL_ADDR_KEY = "ownly_prefill_addr";         // /diagnose 에서 입력한 주소

export const REVENUE = [
  { m: "10월", income: 625, expense: 42 },
  { m: "11월", income: 705, expense: 18 },
  { m: "12월", income: 705, expense: 65 },
  { m: "1월",  income: 680, expense: 120 },
  { m: "2월",  income: 620, expense: 45 },
  { m: "3월",  income: 755, expense: 33 },
];

export const DEFAULT_TENANTS = [
  { id: 1, name: "김민준", phone: "010-3821-4492", pType: "주거", sub: "아파트", addr: "마포구 합정동 123", dep: 50000, rent: 120, end: "2025-08-31", status: "정상", c: C.indigo, intent: "미확인", biz: null, contacts: [{ date: "2025-03-05", type: "납부확인", note: "3월 월세 이체 확인" }] },
  { id: 2, name: "이수진", phone: "010-7723-9910", pType: "상가", sub: "1층 상가", addr: "강남구 역삼동 456-7", dep: 30000, rent: 250, end: "2025-04-30", status: "만료임박", c: C.amber, intent: "갱신의향 있음", biz: "카페 브루잉", contacts: [{ date: "2025-03-01", type: "갱신협의", note: "임대료 5% 인상 협의" }] },
  { id: 3, name: "박지호", phone: "010-5519-2234", pType: "주거", sub: "오피스텔", addr: "용산구 이태원동 88", dep: 10000, rent: 85, end: "2026-03-31", status: "미납", c: C.rose, intent: "미확인", biz: null, contacts: [{ date: "2025-03-08", type: "미납독촉", note: "3월 미납 문자 발송" }] },
  { id: 4, name: "최예린", phone: "010-6644-8821", pType: "상가", sub: "1층 상가", addr: "송파구 잠실동 200", dep: 20000, rent: 180, end: "2026-01-31", status: "정상", c: C.sky, intent: "미확인", biz: "네일샵 Y", contacts: [] },
  { id: 5, name: "정우성", phone: "010-2291-7743", pType: "주거", sub: "빌라", addr: "성동구 성수동 55", dep: 15000, rent: 70, end: "2025-03-31", status: "만료임박", c: C.purple, intent: "갱신의향 없음", biz: null, contacts: [{ date: "2025-03-02", type: "갱신협의", note: "퇴거 의사 확인" }] },
];

export const DEFAULT_PAYMENTS = [
  { tid: 1, month: 1, status: "paid", paid: "2025-01-05", amt: 120 },
  { tid: 2, month: 1, status: "paid", paid: "2025-01-10", amt: 280 },
  { tid: 3, month: 1, status: "paid", paid: "2025-01-07", amt: 85 },
  { tid: 4, month: 1, status: "paid", paid: "2025-01-15", amt: 200 },
  { tid: 5, month: 1, status: "paid", paid: "2025-01-20", amt: 70 },
  { tid: 1, month: 2, status: "paid", paid: "2025-02-05", amt: 120 },
  { tid: 2, month: 2, status: "paid", paid: "2025-02-10", amt: 280 },
  { tid: 3, month: 2, status: "paid", paid: "2025-02-06", amt: 85 },
  { tid: 4, month: 2, status: "paid", paid: "2025-02-14", amt: 200 },
  { tid: 5, month: 2, status: "paid", paid: "2025-02-20", amt: 70 },
  { tid: 1, month: 3, status: "paid", paid: "2025-03-05", amt: 120 },
  { tid: 2, month: 3, status: "paid", paid: "2025-03-10", amt: 280 },
  { tid: 3, month: 3, status: "unpaid", paid: null, amt: 0 },
  { tid: 4, month: 3, status: "paid", paid: "2025-03-15", amt: 200 },
  { tid: 5, month: 3, status: "paid", paid: "2025-03-20", amt: 70 },
];

export const NAV = [
  { key: "dashboard",  icon: "⊞",  label: "대시보드" },
  { key: "properties", icon: "🏠",  label: "물건 관리" },
  { key: "tenants",    icon: "👤",  label: "세입자" },
  { key: "payments",   icon: "💰",  label: "수금 현황" },
  { key: "calendar",   icon: "📅",  label: "캘린더" },
  { key: "vacancy",    icon: "🚪",  label: "공실 관리" },
  { key: "certified",  icon: "📨",  label: "내용증명" },
  { key: "repairs",    icon: "🔨",  label: "수리 이력" },
  { key: "ledger",     icon: "📒",  label: "간편 장부" },
  { key: "renewal",    icon: "🔄",  label: "갱신 의향" },
  { key: "report-pdf", icon: "📄",  label: "수익 리포트" },
  { key: "reports",    icon: "📊",  label: "리포트" },
  { key: "tax",        icon: "🧾",  label: "세금 관리" },
  { key: "settings",   icon: "⚙️",  label: "설정" },
  { key: "pricing",    icon: "💎",  label: "구독 플랜" },
];

export function daysLeft(endDate) {
  if (!endDate) return 0;
  const d = Math.ceil((new Date(endDate) - new Date()) / 86400000);
  return d < 0 ? 0 : d;
}

// 주소에서 "N층·N호·N동" 등 호실 식별자를 제거해 같은 건물을 묶는 키 생성
export function buildingKey(addr) {
  if (!addr) return "";
  return String(addr)
    .replace(/[,()]/g, " ")
    .replace(/\s*[0-9BbⅠⅡⅢ지하]+\s*(층|호|동|호실|유닛|unit|floor)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 물건 리스트를 건물별로 그룹핑 (building_id 우선, 없으면 주소 기반)
export function groupByBuilding(tenants, buildings = []) {
  const groups = new Map();
  const buildingsById = new Map(buildings.map(b => [b.id, b]));
  for (const t of tenants) {
    if (t.building_id && buildingsById.has(t.building_id)) {
      const b = buildingsById.get(t.building_id);
      const k = "building:" + b.id;
      if (!groups.has(k)) groups.set(k, { key: k, addr: b.address, name: b.name, buildingId: b.id, units: [] });
      groups.get(k).units.push(t);
      continue;
    }
    const key = "addr:" + buildingKey(t.addr);
    if (!groups.has(key)) groups.set(key, { key, addr: buildingKey(t.addr), name: null, buildingId: null, units: [] });
    groups.get(key).units.push(t);
  }
  return Array.from(groups.values()).sort((a, b) => b.units.length - a.units.length);
}
