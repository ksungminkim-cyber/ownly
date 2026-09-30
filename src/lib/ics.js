// 캘린더 구독(ICS) — 순수 함수만 (DB·네트워크 없음, node 로 바로 테스트 가능)
// /api/calendar/[token] 이 tenants 행을 넘겨 buildLandlordEvents → buildCalendar 로 text/calendar 를 만든다.
// 규칙: RFC 5545 — 줄 끝 CRLF, 한 줄 75옥텟 초과 시 CRLF+공백으로 접기(UTF-8 글자 중간에서 자르지 않음),
// TEXT 값의 \ ; , 줄바꿈 이스케이프. 모든 일정은 종일(VALUE=DATE) — 시간대 변환 문제가 없다.
// 개인정보 최소화: 세입자 전화번호·연락처는 넣지 않는다(이름·금액·주소 앞부분만).

// 날짜는 "YYYY-MM-DD" 문자열로 다룬다 (Date.UTC 로만 계산 → 서버 시간대와 무관)
const pad = (n) => String(n).padStart(2, "0");
export const ymd = (y, m1, d) => `${y}-${pad(m1)}-${pad(d)}`;
const toUTC = (s) => { const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return Date.UTC(y, m - 1, d); };
const fromUTC = (t) => { const d = new Date(t); return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); };
export const addDays = (s, n) => fromUTC(toUTC(s) + n * 86400000);
export function addMonths(s, n) {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  const idx = y * 12 + (m - 1) + n, ny = Math.floor(idx / 12), nm = (idx % 12) + 1;
  return ymd(ny, nm, Math.min(d, lastDay(ny, nm)));
}
const lastDay = (y, m1) => new Date(Date.UTC(y, m1, 0)).getUTCDate();
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s);

// 오늘(KST) "YYYY-MM-DD"
export function todayKST(now = new Date()) { return fromUTC(now.getTime() + 9 * 3600000); }

// 납부일(1~31, 99=말일) → 해당 월 실제 날짜 (src/lib/unpaid.js effectivePayDay 와 같은 규칙, 시간대 무관 버전)
export function payDayIn(payDay, year, month1) {
  const last = lastDay(year, month1);
  const d = Number(payDay) || 5;
  return Math.min(d >= 99 ? last : d, last);
}

export function escapeText(v) {
  return String(v ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
}

// 75옥텟 접기 — 첫 줄 75, 이어지는 줄은 선두 공백 1 + 74
export function foldLine(line) {
  const enc = new TextEncoder();
  const out = [];
  let cur = "", bytes = 0, limit = 75;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > limit) { out.push(cur); cur = " "; bytes = 1; limit = 75; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n");
}

const icsDate = (s) => String(s).slice(0, 10).replace(/-/g, "");
const stamp = (now) => new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * events: [{ uid, date:"YYYY-MM-DD", summary, description?, alarmDays? }]
 * 반환: 완성된 ICS 문자열 (CRLF)
 */
export function buildCalendar({ name = "온리 임대 일정", events = [], now = new Date() } = {}) {
  const dtstamp = stamp(now);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ownly//Landlord Calendar//KO", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`, "X-WR-TIMEZONE:Asia/Seoul",
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H", "X-PUBLISHED-TTL:PT12H",
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.date, 1))}`,
      `SUMMARY:${escapeText(e.summary)}`, "TRANSP:TRANSPARENT");
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.alarmDays) {
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(e.summary)}`, `TRIGGER:-P${e.alarmDays}D`, "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

const uidOf = (kind, id, date) => `${kind}-${id}-${icsDate(date)}@ownly.kr`;
const won = (man) => `${Number(man || 0).toLocaleString("ko-KR")}만원`;
const shortAddr = (a) => String(a || "").trim().split(/\s+/).slice(0, 3).join(" ");
const TAX_NOTE = "일반 일정 안내입니다. 실제 기한(주말·공휴일 연장 등)과 대상 여부는 국세청·지자체 공지를 확인하세요.";

// 세금 일정 (월, 일, 이름, 상가 전용 여부)
const TAX = [
  { key: "income", m: 5, d: 31, title: "종합소득세 신고·납부 기한" },
  { key: "property1", m: 7, d: 31, title: "재산세 납부 기한 (1기분)" },
  { key: "property2", m: 9, d: 30, title: "재산세 납부 기한 (2기분)" },
  { key: "vat2", m: 1, d: 25, title: "부가가치세 확정신고 기한 (2기)", commercial: true },
  { key: "vat1", m: 7, d: 25, title: "부가가치세 확정신고 기한 (1기)", commercial: true },
  { key: "comprehensive", m: 12, d: 15, title: "종합부동산세 납부 기한" },
];

const isSample = (t) => /\[샘플\]/.test(`${t.name || ""} ${t.address || t.addr || ""}`);
const inactive = (t) => t.status === "공실" || t.status === "퇴거";

/**
 * tenants: DB 행(snake_case) 배열. today: "YYYY-MM-DD"(KST).
 * 반환: buildCalendar 용 events (날짜순)
 */
export function buildLandlordEvents(tenants = [], today) {
  const horizon = addMonths(today, 12);
  const within = (d) => d >= today && d < horizon; // 오늘부터 12개월(끝 미포함) — 월 1회 일정이 정확히 12건
  const events = [];
  const real = tenants.filter((t) => t && !isSample(t));

  for (const t of real) {
    const name = t.name || "세입자";
    const addr = shortAddr(t.address || t.addr);
    const rent = Number(t.rent) || 0;
    const end = isDate(t.contract_end) ? t.contract_end.slice(0, 10) : null;
    const active = !inactive(t);

    // 1) 월세 납부일 — 앞으로 12개월. 계약 만료일이 미래면 거기까지만 (이미 지났으면 묵시적 갱신으로 보고 계속)
    if (active && rent > 0) {
      const [ty, tm] = today.split("-").map(Number);
      for (let i = 0; i <= 12; i++) {
        const idx = ty * 12 + (tm - 1) + i, y = Math.floor(idx / 12), m = (idx % 12) + 1;
        const date = ymd(y, m, payDayIn(t.pay_day ?? t.payment_day, y, m));
        if (!within(date)) continue;
        if (end && end >= today && date > end) continue;
        events.push({ uid: uidOf("rent", t.id, date), date, summary: `월세 납부일 · ${name} ${won(rent)}`,
          description: `${addr ? addr + " · " : ""}온리에 등록된 납부일 기준 일정입니다. 입금 여부는 온리 수금 화면에서 확인하세요.` });
      }
    }

    // 2) 계약 만료일 — 90일 전 알림
    if (active && end && within(end)) {
      events.push({ uid: uidOf("contract-end", t.id, end), date: end, summary: `계약 만료 · ${name}${addr ? " (" + addr + ")" : ""}`,
        description: "갱신 여부(계약갱신청구권 포함)를 만료 6~2개월 전에 세입자와 확인하세요.", alarmDays: 90 });
    }

    // 3) 전월세 신고 기한 — 주택, 보증금 6천만원 초과 또는 월세 30만원 초과, 신고 완료 기록 없을 때 (계약 시작일 + 30일)
    const pType = t.p_type || t.pType || "주거";
    const reportTarget = pType !== "상가" && pType !== "토지" && ((Number(t.deposit) || 0) > 6000 || rent > 30);
    if (active && reportTarget && !t.report_filed_at && isDate(t.start_date)) {
      const due = addDays(t.start_date.slice(0, 10), 30);
      if (within(due)) {
        events.push({ uid: uidOf("lease-report", t.id, due), date: due, summary: `전월세 신고 기한 · ${name}`,
          description: "계약 체결일로부터 30일 이내 신고 대상입니다(온리에 입력된 계약 시작일 기준 추정). 신고했다면 온리 물건 화면에서 신고 완료로 표시하면 이 일정이 사라집니다.", alarmDays: 7 });
      }
    }

    // 4) 등록임대 — 의무임대기간 종료, 렌트홈 임대차계약 신고 기한(계약 시작일 + 3개월, 신고일 기록 없을 때)
    if (isDate(t.mandatory_until)) {
      const d = t.mandatory_until.slice(0, 10);
      if (within(d)) events.push({ uid: uidOf("mandatory-end", t.id, d), date: d, summary: `등록임대 의무임대기간 종료 · ${addr || name}`,
        description: "임대사업자 등록 시 정한 의무임대기간 종료일입니다. 종료 전 양도·임대 조건 변경은 과태료 대상일 수 있으니 확인하세요.", alarmDays: 60 });
    }
    if (active && t.registered_rental && !t.rent_report_filed_at && isDate(t.start_date)) {
      const d = addMonths(t.start_date.slice(0, 10), 3);
      if (within(d)) events.push({ uid: uidOf("renthome-report", t.id, d), date: d, summary: `렌트홈 임대차계약 신고 기한 · ${addr || name}`,
        description: "등록임대주택은 계약일로부터 3개월 이내 렌트홈 신고 대상입니다(온리에 입력된 계약 시작일 기준 추정).", alarmDays: 14 });
    }
  }

  // 5) 세금 일정 — 다가오는 1회씩. 부가세는 상가 물건이 있을 때만
  const hasCommercial = real.some((t) => (t.p_type || t.pType) === "상가" && !inactive(t));
  const [ty] = today.split("-").map(Number);
  for (const tax of TAX) {
    if (tax.commercial && !hasCommercial) continue;
    let date = ymd(ty, tax.m, tax.d);
    if (date < today) date = ymd(ty + 1, tax.m, tax.d);
    events.push({ uid: uidOf("tax", tax.key, date), date, summary: tax.title, description: TAX_NOTE, alarmDays: 7 });
  }

  return events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
