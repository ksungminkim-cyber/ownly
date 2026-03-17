export const C = {
  bg: "#f5f4f0", surface: "#ffffff", surfaceHover: "#f8f7f4",
  border: "#e8e6e0", borderFocus: "#1a2744",
  text: "#1a1a2e", muted: "#8a8a9a", faint: "#f0efe9",
  indigo: "#1a2744", indigoLight: "#2d4270", purple: "#5b4fcf",
  rose: "#e8445a", emerald: "#0fa573", amber: "#e8960a", sky: "#1e7fcb",
  gold: "#c9920a",
  // New accent colors for the redesign
  coral: "#ff5a3c", teal: "#0d9488", navy: "#1a2744",
  cream: "#f5f4f0", white: "#ffffff",
};

export const STATUS_MAP = {
  "정상":    { c: "#0fa573", bg: "rgba(15,165,115,0.1)" },
  "미납":    { c: "#e8445a", bg: "rgba(232,68,90,0.1)" },
  "만료임박":{ c: "#e8960a", bg: "rgba(232,150,10,0.1)" },
};

export const INTENT_MAP = {
  "갱신의향 있음": { c: "#0fa573", bg: "rgba(15,165,115,0.1)" },
  "갱신의향 없음": { c: "#e8445a", bg: "rgba(232,68,90,0.1)" },
  "협의중":        { c: "#e8960a", bg: "rgba(232,150,10,0.1)" },
  "미확인":        { c: "#8a8a9a", bg: "#f0efe9" },
};

export const PAY_MAP = {
  paid:   { label: "납부완료", c: "#0fa573", bg: "rgba(15,165,115,0.1)" },
  unpaid: { label: "미납",     c: "#e8445a", bg: "rgba(232,68,90,0.1)" },
  late:   { label: "연체",     c: "#e8960a", bg: "rgba(232,150,10,0.1)" },
};

export const COLORS = ["#1a2744", "#e8960a", "#e8445a", "#1e7fcb", "#5b4fcf", "#0fa573", "#2d4270"];

// ─── 구독 플랜 정의 ─────────────────────────────────────────────
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
      properties: 2,
      tenants: 3,
      reports: false,
      tax: false,
      certified: false,
      vacancy: false,
      export: false,
      roi: false,
      vacancyLoss: false,
      leaseCheck: false,
      mapSearch: false,
      aiReport: false,
      kakaoAlert: false,
      globalReports: false,
    },
    features: [
      { t: "물건 최대 2개", ok: true },
      { t: "세입자 최대 3명", ok: true },
      { t: "수금 현황 관리", ok: true },
      { t: "계약서 기본 관리", ok: true },
      { t: "캘린더", ok: true },
      { t: "리포트 / 세금 관리", ok: false },
      { t: "내용증명", ok: false },
      { t: "PDF 내보내기", ok: false },
      { t: "프리미엄 기능 전체", ok: false },
    ],
  },

  starter: {
    id: "starter",
    name: "스타터",
    price: 10900,
    priceLabel: "10,900원/월",
    tossProductId: "ownly_starter_monthly",
    color: "#3b6bca",
    emoji: "🏠",
    tagline: "소규모 임대인의 필수 관리 도구",
    limits: {
      properties: 5,
      tenants: 10,
      reports: true,
      tax: true,
      certified: 3,       // 월 3건
      vacancy: true,
      export: true,
      roi: false,
      vacancyLoss: false,
      leaseCheck: false,
      mapSearch: false,
      aiReport: false,
      kakaoAlert: false,
      globalReports: true,
    },
    features: [
      { t: "물건 최대 5개", ok: true },
      { t: "세입자 최대 10명", ok: true },
      { t: "수금·계약·캘린더 전체", ok: true },
      { t: "리포트 / 세금 관리", ok: true },
      { t: "내용증명 월 3건", ok: true },
      { t: "PDF 내보내기", ok: true },
      { t: "이메일 고객지원", ok: true },
      { t: "수익률 계산기", ok: false },
      { t: "공실 손실·임대차 3법", ok: false },
      { t: "AI 분석 / 매물 조회", ok: false },
    ],
  },

  starter_plus: {
    id: "starter_plus",
    name: "스타터+",
    price: 19900,
    priceLabel: "19,900원/월",
    tossProductId: "ownly_starter_plus_monthly",
    color: "#0fa573",
    emoji: "📊",
    tagline: "분석과 자동화로 한 단계 위",
    badge: "추천",
    limits: {
      properties: 15,
      tenants: 30,
      reports: true,
      tax: true,
      certified: 10,      // 월 10건
      vacancy: true,
      export: true,
      roi: true,
      vacancyLoss: true,
      leaseCheck: true,
      mapSearch: false,
      aiReport: false,
      kakaoAlert: false,
      globalReports: true,
    },
    features: [
      { t: "물건 최대 15개", ok: true },
      { t: "세입자 최대 30명", ok: true },
      { t: "스타터 전체 기능", ok: true },
      { t: "내용증명 월 10건", ok: true },
      { t: "💰 수익률 계산기", ok: true },
      { t: "📊 공실 손실 계산기", ok: true },
      { t: "📋 임대차 3법 체크리스트", ok: true },
      { t: "우선 이메일 지원", ok: true },
      { t: "🗺️ 매물 조회 / AI 분석", ok: false },
      { t: "📱 카카오톡 알림", ok: false },
    ],
  },

  pro: {
    id: "pro",
    name: "프로",
    price: 32900,
    priceLabel: "32,900원/월",
    tossProductId: "ownly_pro_monthly",
    color: C.gold,
    emoji: "🚀",
    tagline: "전문 임대인을 위한 올인원 솔루션",
    badge: "최강",
    limits: {
      properties: Infinity,
      tenants: Infinity,
      reports: true,
      tax: true,
      certified: Infinity,
      vacancy: true,
      export: true,
      roi: true,
      vacancyLoss: true,
      leaseCheck: true,
      mapSearch: true,
      aiReport: true,
      kakaoAlert: true,
      globalReports: true,
    },
    features: [
      { t: "물건·세입자 무제한", ok: true },
      { t: "스타터+ 전체 기능", ok: true },
      { t: "내용증명 무제한", ok: true },
      { t: "🗺️ 주변 매물 조회", ok: true },
      { t: "🤖 AI 입지 분석 리포트", ok: true },
      { t: "📱 카카오톡 수금 알림", ok: true },
      { t: "멀티 빌딩 관리 (예정)", ok: true },
      { t: "전담 1:1 이메일 지원", ok: true },
      { t: "신기능 최우선 출시", ok: true },
    ],
  },
};

export const REVENUE = [
  { m: "10월", income: 625, expense: 42 },
  { m: "11월", income: 705, expense: 18 },
  { m: "12월", income: 705, expense: 65 },
  { m: "1월",  income: 680, expense: 120 },
  { m: "2월",  income: 620, expense: 45 },
  { m: "3월",  income: 755, expense: 33 },
];

export const DEFAULT_TENANTS = [
  { id: 1, name: "김민준", phone: "010-3821-4492", pType: "주거", sub: "아파트",   addr: "마포구 합정동 123",    dep: 50000, rent: 120, end: "2025-08-31", status: "정상",    c: C.indigo, intent: "미확인",       biz: null,        contacts: [{ date: "2025-03-05", type: "납부확인", note: "3월 월세 이체 확인" }] },
  { id: 2, name: "이수진", phone: "010-7723-9910", pType: "상가", sub: "1층 상가", addr: "강남구 역삼동 456-7",  dep: 30000, rent: 250, end: "2025-04-30", status: "만료임박", c: C.amber,  intent: "갱신의향 있음",  biz: "카페 브루잉", contacts: [{ date: "2025-03-01", type: "갱신협의", note: "임대료 5% 인상 협의" }] },
  { id: 3, name: "박지호", phone: "010-5519-2234", pType: "주거", sub: "오피스텔", addr: "용산구 이태원동 88",   dep: 10000, rent: 85,  end: "2026-03-31", status: "미납",    c: C.rose,   intent: "미확인",       biz: null,        contacts: [{ date: "2025-03-08", type: "미납독촉", note: "3월 미납 문자 발송" }] },
  { id: 4, name: "최예린", phone: "010-6644-8821", pType: "상가", sub: "1층 상가", addr: "송파구 잠실동 200",   dep: 20000, rent: 180, end: "2026-01-31", status: "정상",    c: C.sky,    intent: "미확인",       biz: "네일샵 Y",  contacts: [] },
  { id: 5, name: "정우성", phone: "010-2291-7743", pType: "주거", sub: "빌라",     addr: "성동구 성수동 55",    dep: 15000, rent: 70,  end: "2025-03-31", status: "만료임박", c: C.purple, intent: "갱신의향 없음",  biz: null,        contacts: [{ date: "2025-03-02", type: "갱신협의", note: "퇴거 의사 확인" }] },
];

export const DEFAULT_PAYMENTS = [
  { tid: 1, month: 1, status: "paid",   paid: "2025-01-05", amt: 120 },
  { tid: 2, month: 1, status: "paid",   paid: "2025-01-10", amt: 280 },
  { tid: 3, month: 1, status: "paid",   paid: "2025-01-07", amt: 85  },
  { tid: 4, month: 1, status: "paid",   paid: "2025-01-15", amt: 200 },
  { tid: 5, month: 1, status: "paid",   paid: "2025-01-20", amt: 70  },
  { tid: 1, month: 2, status: "paid",   paid: "2025-02-05", amt: 120 },
  { tid: 2, month: 2, status: "paid",   paid: "2025-02-10", amt: 280 },
  { tid: 3, month: 2, status: "paid",   paid: "2025-02-06", amt: 85  },
  { tid: 4, month: 2, status: "paid",   paid: "2025-02-14", amt: 200 },
  { tid: 5, month: 2, status: "paid",   paid: "2025-02-20", amt: 70  },
  { tid: 1, month: 3, status: "paid",   paid: "2025-03-05", amt: 120 },
  { tid: 2, month: 3, status: "paid",   paid: "2025-03-10", amt: 280 },
  { tid: 3, month: 3, status: "unpaid", paid: null,         amt: 0   },
  { tid: 4, month: 3, status: "paid",   paid: "2025-03-15", amt: 200 },
  { tid: 5, month: 3, status: "paid",   paid: "2025-03-20", amt: 70  },
];

export const NAV = [
  { key: "dashboard",  icon: "⊞",  label: "대시보드" },
  { key: "properties", icon: "🏠", label: "물건 관리" },
  { key: "tenants",    icon: "👤", label: "세입자" },
  { key: "payments",   icon: "💰", label: "수금 현황" },
  { key: "contracts",  icon: "📝", label: "계약서" },
  { key: "calendar",   icon: "📅", label: "캘린더" },
  { key: "vacancy",    icon: "🚪", label: "공실 관리" },
  { key: "certified",  icon: "📨", label: "내용증명" },
  { key: "repairs",    icon: "🔨", label: "수리 이력" },
  { key: "ledger",     icon: "📒", label: "간편 장부" },
  { key: "reports",    icon: "📊", label: "리포트" },
  { key: "tax",        icon: "🧾", label: "세금 관리" },
  { key: "settings",   icon: "⚙️", label: "설정" },
  { key: "pricing",    icon: "💎", label: "구독 플랜" },
];

export function daysLeft(endDate) {
  if (!endDate) return 0;
  const d = Math.ceil((new Date(endDate) - new Date()) / 86400000);
  return d < 0 ? 0 : d;
}
