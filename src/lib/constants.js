export const C = { bg: "#f5f4f0", surface: "#ffffff", surfaceHover: "#f8f7f4", border: "#e8e6e0", borderFocus: "#1a2744", text: "#1a1a2e", muted: "#8a8a9a", faint: "#f0efe9", indigo: "#1a2744", indigoLight: "#2d4270", purple: "#5b4fcf", rose: "#e8445a", emerald: "#0fa573", amber: "#e8960a", sky: "#1e7fcb", gold: "#c9920a", coral: "#ff5a3c", teal: "#0d9488", navy: "#1a2744", cream: "#f5f4f0", white: "#ffffff", };
export const STATUS_MAP = { "정상": { c: "#0fa573", bg: "rgba(15,165,115,0.1)" }, "미납": { c: "#e8445a", bg: "rgba(232,68,90,0.1)" }, "만료임박":{ c: "#e8960a", bg: "rgba(232,150,10,0.1)" }, };
export const INTENT_MAP = { "갱신의향 있음": { c: "#0fa573", bg: "rgba(15,165,115,0.1)" }, "갱신의향 없음": { c: "#e8445a", bg: "rgba(232,68,90,0.1)" }, "협의중": { c: "#e8960a", bg: "rgba(232,150,10,0.1)" }, "미확인": { c: "#8a8a9a", bg: "#f0efe9" }, };
export const PAY_MAP = { paid: { label: "납부완료", c: "#0fa573", bg: "rgba(15,165,115,0.1)" }, unpaid: { label: "미납", c: "#e8445a", bg: "rgba(232,68,90,0.1)" }, late: { label: "연체", c: "#e8960a", bg: "rgba(232,150,10,0.1)" }, };
export const COLORS = ["#1a2744", "#e8960a", "#e8445a", "#1e7fcb", "#5b4fcf", "#0fa573", "#2d4270"];

// ─── 얼리 액세스 전면 무료 스위치 ─────────────────────────────────
// true인 동안 모든 유저를 pro로 취급 (클라이언트 게이트 + 카카오 서버 게이트 공통).
// 정식 유료 전환 시 false로 바꾸면 기존 플랜 게이트가 그대로 복원됩니다.
// 얼리 액세스 전면 무료 스위치. 무료 유저 실비 가드레일은 아래 EARLY_ACCESS_*_FREE, 서포터·정식 플랜 한도는 PLANS[plan].limits 가 유일한 기준
export const EARLY_ACCESS_FREE = true;
// 얼리 액세스 종료 예정일·얼리 가입자 혜택 (가격 페이지·대시보드 배너 공통 문구)
// ⚠️ 운영 결정값 — 날짜/혜택 확정 시 이 두 값만 바꾸면 모든 화면에 반영됩니다.
export const EARLY_ACCESS_END = "2026-12-31";
// 얼리 액세스 중 "무료 유저"의 실비 항목 월 한도. 얼리 서포터(=플러스 플랜 구독자)는 PLANS.plus.limits 를 그대로 적용.
export const EARLY_ACCESS_CERTIFIED_FREE = 3;   // 내용증명 정식 발급 (건). 친구 초대 보너스 발급권(certified_credits)으로 추가 가능
export const EARLY_ACCESS_KAKAO_FREE = 30;      // 카카오 알림톡 (건) — Solapi 실비 보호
export const EARLY_ACCESS_AI_FREE = 30;         // AI 임대료 분석 (회) — LLM·MOLIT 실비 보호
// 무료 도구 → 가입 딥링크용 localStorage 키 (도구 페이지가 저장, 대시보드가 소비)
export const CERTIFIED_DRAFT_KEY = "ownly_certified_draft";   // /tools/certified 초안
export const PREFILL_ADDR_KEY = "ownly_prefill_addr";         // /diagnose 에서 입력한 주소
export const EARLY_ACCESS_END_LABEL = (() => {
  const d = new Date(EARLY_ACCESS_END + "T00:00:00");
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
})();
// 랜딩·정책·커뮤니티·요금제 등 공개 화면의 "무료" 한 줄 문구 — 한 곳에서만 관리해 화면마다 다르게 말하지 않는다.
// 사실 관계: 얼리 액세스 종료일까지 프로 기능 무료(실비 항목만 한도) · 종료 후에도 기본 관리 기능(물건 3개·세입자 5명)은 계속 무료 · 카드 등록 불필요
export const FREE_TAGLINE = EARLY_ACCESS_FREE
  ? `${EARLY_ACCESS_END_LABEL}까지 프로 기능 무료 · 이후에도 기본 관리 기능은 계속 무료 · 카드 등록 불필요`
  : "기본 관리 기능 무료 · 카드 등록 불필요";

// ─── 구독 플랜 정의 ───────────────────────────────────────────────
export const PLANS = {
  free: {
    id: "free",
    name: "무료",
    price: 0,
    priceLabel: "무료",
    color: C.muted,
    emoji: "🌱",
    tagline: "처음 시작하는 임대인을 위해",
    limits: {
      properties: 3,   // ✅ 2 → 3
      tenants: 5,       // ✅ 3 → 5
      reports: false, tax: false, certified: 1, vacancy: false,
      export: false, roi: false, vacancyLoss: false, leaseCheck: false,
      mapSearch: false, aiPricing: 0, kakaoAlert: false, kakaoMonthly: 0, globalReports: false, profitAnalysis: false,
    },
    features: [
      { t: "물건 최대 3개", ok: true },
      { t: "세입자 최대 5명", ok: true },
      { t: "수금 현황 관리", ok: true },
      { t: "계약서 기본 관리", ok: true },
      { t: "캘린더", ok: true },
      { t: "내용증명 월 1건", ok: true },
      { t: "리포트 / 세금 관리", ok: false },
      { t: "PDF 내보내기", ok: false },
      { t: "프리미엄 기능 전체", ok: false },
    ],
  },

  plus: {
    id: "plus",
    name: "플러스",
    price: 19900,
    priceLabel: "19,900원/월",
    color: "#4f46e5",
    emoji: "📊",
    tagline: "개인 임대인의 올인원 솔루션",
    badge: "추천",
    limits: {
      properties: 15, tenants: 30, reports: true, tax: true, certified: Infinity,
      vacancy: true, export: true, roi: true, vacancyLoss: true, leaseCheck: true,
      mapSearch: false, aiPricing: 60, kakaoAlert: true, kakaoMonthly: 100, globalReports: true, profitAnalysis: false,
    },
    features: [
      { t: "물건 최대 15개", ok: true },
      { t: "세입자 최대 30명", ok: true },
      { t: "수금·계약·캘린더·세금 전체", ok: true },
      { t: "내용증명 무제한", ok: true },
      { t: "📱 카카오 알림톡 월 100건", ok: true },
      { t: "🤖 AI 임대료 분석 월 60회", ok: true },
      { t: "💰 수익률 계산기", ok: true },
      { t: "📊 공실 손실 계산기", ok: true },
      { t: "📋 임대차 3법 체크리스트", ok: true },
      { t: "🗺️ 주변 매물 조회", ok: false },
    ],
  },

  pro: {
    id: "pro",
    name: "프로",
    price: 32900,
    priceLabel: "32,900원/월",
    color: C.gold,
    emoji: "🚀",
    tagline: "다주택자·법인을 위한 완전체",
    badge: "최강",
    limits: {
      properties: Infinity, tenants: Infinity, reports: true, tax: true, certified: Infinity,
      vacancy: true, export: true, roi: true, vacancyLoss: true, leaseCheck: true,
      mapSearch: true, aiPricing: 200, kakaoAlert: true, kakaoMonthly: 300, globalReports: true, profitAnalysis: true,
    },
    features: [
      { t: "물건·세입자 무제한", ok: true },
      { t: "플러스 전체 기능", ok: true },
      { t: "내용증명 무제한", ok: true },
      { t: "📱 카카오 알림톡 월 300건", ok: true },
      { t: "🤖 AI 임대료 분석 월 200회", ok: true },
      { t: "🗺️ 주변 매물 조회", ok: true },
      { t: "멀티 빌딩 관리 (예정)", ok: true },
      { t: "전담 1:1 이메일 지원", ok: true },
      { t: "신기능 최우선 출시", ok: true },
    ],
  },
};

// 얼리 서포터 — 얼리 액세스 기간에 결제 가능한 유일한 상품 (카카오페이 정기결제).
// "플러스 플랜 그 자체"를 50% 가격에 구독하는 것이며 혜택(한도)은 PLANS.plus.limits 에서 파생됩니다.
// → 정식 출시 후에도 요금제 화면·서버 한도 판정·서포터 안내 문구가 서로 어긋나지 않습니다.
export const EARLY_SUPPORTER = {
  planId: "plus",
  price: 9900,                                   // 월 (원)
  listPrice: PLANS.plus.price,                   // 정식가 19,900원
  lockMonths: 12,                                // 가격 고정 기간
  kakaoMonthly: PLANS.plus.limits.kakaoMonthly,  // 알림톡 월 100건 (무료 유저 EARLY_ACCESS_KAKAO_FREE)
  aiMonthly: PLANS.plus.limits.aiPricing,        // AI 분석 월 60회 (무료 유저 EARLY_ACCESS_AI_FREE)
  // 내용증명: PLANS.plus.limits.certified = 무제한 (무료 유저 EARLY_ACCESS_CERTIFIED_FREE 건)
};
export const EARLY_ACCESS_PERK = `얼리 서포터 구독 시 플러스 플랜 월 ${EARLY_SUPPORTER.price.toLocaleString()}원(정식가 대비 50%) · ${EARLY_SUPPORTER.lockMonths}개월 가격 고정`;

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
