export const C = {
  bg: "#07070e", surface: "#0d0d1a", surfaceHover: "#11112a",
  border: "#1e1e38", borderFocus: "#6366f1",
  text: "#eeeef5", muted: "#636380", faint: "#13132a",
  indigo: "#6366f1", indigoLight: "#818cf8", purple: "#a855f7",
  rose: "#f43f5e", emerald: "#10b981", amber: "#f59e0b", sky: "#38bdf8",
};

export const STATUS_MAP = {
  "정상": { c: C.emerald, bg: C.emerald + "18" },
  "미납": { c: C.rose,    bg: C.rose    + "18" },
  "만료임박": { c: C.amber, bg: C.amber + "18" },
};

export const INTENT_MAP = {
  "갱신의향 있음": { c: C.emerald, bg: C.emerald + "18" },
  "갱신의향 없음": { c: C.rose,    bg: C.rose    + "18" },
  "협의중":        { c: C.amber,   bg: C.amber   + "18" },
  "미확인":        { c: C.muted,   bg: C.faint },
};

export const PAY_MAP = {
  paid:   { label: "납부완료", c: C.emerald, bg: C.emerald + "18" },
  unpaid: { label: "미납",     c: C.rose,    bg: C.rose    + "18" },
  late:   { label: "연체",     c: C.amber,   bg: C.amber   + "18" },
};

export const COLORS = [C.indigo, C.amber, C.rose, C.sky, C.purple, C.emerald, C.indigoLight];

export const REVENUE = [
  { m: "10월", income: 625, expense: 42 },
  { m: "11월", income: 705, expense: 18 },
  { m: "12월", income: 705, expense: 65 },
  { m: "1월",  income: 680, expense: 120 },
  { m: "2월",  income: 620, expense: 45 },
  { m: "3월",  income: 755, expense: 33 },
];

export const DEFAULT_TENANTS = [
  { id: 1, name: "김민준", phone: "010-3821-4492", pType: "주거", sub: "아파트",   addr: "마포구 합정동 123",    dep: 50000, rent: 120, end: "2025-08-31", status: "정상",   c: C.indigo, intent: "미확인",      biz: null,        contacts: [{ date: "2025-03-05", type: "납부확인", note: "3월 월세 이체 확인" }] },
  { id: 2, name: "이수진", phone: "010-7723-9910", pType: "상가", sub: "1층 상가", addr: "강남구 역삼동 456-7",  dep: 30000, rent: 250, end: "2025-04-30", status: "만료임박", c: C.amber,  intent: "갱신의향 있음", biz: "카페 브루잉", contacts: [{ date: "2025-03-01", type: "갱신협의", note: "임대료 5% 인상 협의" }] },
  { id: 3, name: "박지호", phone: "010-5519-2234", pType: "주거", sub: "오피스텔", addr: "용산구 이태원동 88",   dep: 10000, rent: 85,  end: "2026-03-31", status: "미납",   c: C.rose,   intent: "미확인",      biz: null,        contacts: [{ date: "2025-03-08", type: "미납독촉", note: "3월 미납 문자 발송" }] },
  { id: 4, name: "최예린", phone: "010-6644-8821", pType: "상가", sub: "1층 상가", addr: "송파구 잠실동 200",   dep: 20000, rent: 180, end: "2026-01-31", status: "정상",   c: C.sky,    intent: "미확인",      biz: "네일샵 Y",  contacts: [] },
  { id: 5, name: "정우성", phone: "010-2291-7743", pType: "주거", sub: "빌라",     addr: "성동구 성수동 55",    dep: 15000, rent: 70,  end: "2025-03-31", status: "만료임박", c: C.purple, intent: "갱신의향 없음", biz: null,        contacts: [{ date: "2025-03-02", type: "갱신협의", note: "퇴거 의사 확인" }] },
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
  { key: "reports",    icon: "📊", label: "리포트" },
  { key: "tax",        icon: "🧾", label: "세금 관리" },
  { key: "settings",   icon: "⚙️", label: "설정" },
];

export function daysLeft(endDate) {
  if (!endDate) return 0;
  const d = Math.ceil((new Date(endDate) - new Date()) / 86400000);
  return d < 0 ? 0 : d;
}
