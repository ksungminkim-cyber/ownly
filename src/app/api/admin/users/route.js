// 관리자 전용 — 유저 시트용 데이터.
// GET            : 전체 유저 + 유저별 활동 요약(단계·방문일·유입 경로) + 등록 물건 요약, 전체 물건 목록
// GET ?userId=…  : 한 유저의 등록 물건 상세 + 이벤트 타임라인 + 발송된 알림
// 세입자 개인정보(이름·전화)는 관리자 화면에도 그대로 내보내지 않는다 — 이름은 첫 글자만, 전화는 등록 여부만.
// 로그인 토큰의 이메일이 ADMIN_EMAILS 에 있을 때만 service role 로 처리한다 (api/admin/subscriptions 와 같은 방식).

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS, LEGACY_SIGNUP_BEFORE } from "../../../../lib/constants";

async function adminFrom(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "로그인 필요" }, { status: 401 }) };
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { error: NextResponse.json({ error: "인증 실패" }, { status: 401 }) };
  if (!ADMIN_EMAILS.includes(data.user.email)) return { error: NextResponse.json({ error: "권한 없음" }, { status: 403 }) };
  return { admin };
}

const isSample = (t) => String(t.address || "").includes("[샘플]");
const maskName = (n) => {
  const s = String(n || "").trim();
  if (!s || s === "미등록") return "";
  return s[0] + "○".repeat(Math.min(Math.max(s.length - 1, 1), 3));
};
const host = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};

// PostgREST 기본 1000행 제한을 넘겨도 빠짐없이 읽는다
async function fetchAll(build, max = 20000) {
  const out = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await build().range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function listAuthUsers(admin) {
  const users = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

function propertyRow(t, paidCount) {
  return {
    id: t.id,
    user_id: t.user_id,
    address: t.address || "",
    type: t.sub_type || t.p_type || "",
    p_type: t.p_type || "",
    rent: Number(t.rent) || 0,
    deposit: Number(t.deposit) || 0,
    maintenance: Number(t.maintenance) || 0,
    pay_day: t.pay_day ?? null,
    status: t.status || "",
    contract_end: t.contract_end || null,
    start_date: t.start_date || null,
    created_at: t.created_at || null,
    tenant: maskName(t.name),
    has_phone: !!String(t.phone || "").replace(/[^0-9]/g, ""),
    purchase_price: Number(t.purchase_price) || 0,
    sample: isSample(t),
    paid_count: paidCount || 0,
  };
}

// 이벤트로 본 활성화 단계 — 뒤로 갈수록 깊은 단계
function stageOf({ tenants, samples, ev, paying }) {
  if (paying) return "subscribed";
  if (ev.pay_click || ev.checkout_view) return "checkout";
  if (tenants > 0) return "property";
  if (ev.property_added) return "property_removed"; // 등록했다가 지움
  if (samples > 0 || ev.sample_seeded) return "sample";
  if (ev.onboard_addr_check) return "addr_check";
  if (ev.dashboard_view || ev.onboard_view) return "visited";
  return "signup_only";
}

export async function GET(req) {
  const { admin, error } = await adminFrom(req);
  if (error) return error;
  const userId = new URL(req.url).searchParams.get("userId");

  try {
    // ── 한 유저 상세 ──
    if (userId) {
      if (!/^[0-9a-f-]{36}$/i.test(userId)) return NextResponse.json({ error: "userId 형식 오류" }, { status: 400 });
      const [tenantsRes, eventsRes, logsRes, repairsRes, ledgerRes] = await Promise.all([
        admin.from("tenants").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        admin.from("events").select("event, props, path, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(300),
        admin.from("notification_logs").select("type, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(40),
        admin.from("repairs").select("id", { count: "exact", head: true }).eq("user_id", userId),
        admin.from("ledger").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      const tenants = tenantsRes.data || [];
      const ids = tenants.map((t) => t.id);
      const paidBy = {};
      let contracts = 0;
      if (ids.length) {
        const [pays, cons] = await Promise.all([
          admin.from("payments").select("tenant_id, status").in("tenant_id", ids),
          admin.from("contracts").select("id", { count: "exact", head: true }).in("tenant_id", ids),
        ]);
        for (const p of pays.data || []) if (p.status === "paid" || p.status === "partial") paidBy[p.tenant_id] = (paidBy[p.tenant_id] || 0) + 1;
        contracts = cons.count || 0;
      }
      return NextResponse.json({
        properties: tenants.map((t) => propertyRow(t, paidBy[t.id])),
        events: (eventsRes.data || []).map((e) => ({ event: e.event, path: e.path, at: e.created_at, props: e.props || {} })),
        notifications: logsRes.data || [],
        counts: { contracts, repairs: repairsRes.count || 0, ledger: ledgerRes.count || 0 },
      });
    }

    // ── 전체 목록 ──
    const [authUsers, tenants, subsRes, events] = await Promise.all([
      listAuthUsers(admin),
      fetchAll(() => admin.from("tenants").select("*").order("created_at", { ascending: false })),
      admin.from("subscriptions").select("*"),
      fetchAll(() => admin.from("events").select("user_id, event, props, created_at").not("user_id", "is", null).order("created_at", { ascending: true })),
    ]);
    if (subsRes.error) throw new Error(subsRes.error.message);

    const subBy = {};
    for (const s of subsRes.data || []) subBy[s.user_id] = s;
    const tBy = {};
    for (const t of tenants) (tBy[t.user_id] ||= []).push(t);
    const evBy = {};
    for (const e of events) {
      const a = (evBy[e.user_id] ||= { counts: {}, days: new Set(), last: null, lastEvent: "", source: null });
      a.counts[e.event] = (a.counts[e.event] || 0) + 1;
      if (e.event === "dashboard_view") a.days.add(String(e.created_at).slice(0, 10));
      if (e.event === "signup_source" && !a.source) a.source = e.props || {};
      if (e.event !== "signup_source") { a.last = e.created_at; a.lastEvent = e.event; }
    }

    const legacyBefore = new Date(LEGACY_SIGNUP_BEFORE).getTime();
    const users = authUsers.map((u) => {
      const s = subBy[u.id] || null;
      const mine = tBy[u.id] || [];
      const real = mine.filter((t) => !isSample(t));
      const a = evBy[u.id] || { counts: {}, days: new Set(), last: null, lastEvent: "", source: null };
      const paying = !!(s && (s.kakao_sid || s.billing_key) && s.plan && s.plan !== "free" && s.status === "active");
      const src = a.source || {};
      const m = u.user_metadata || {};
      return {
        id: u.id,
        email: u.email || "",
        name: m.full_name || m.name || m.nickname || "",
        phone: m.phone || "",
        provider: u.app_metadata?.provider || "email",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        legacy: new Date(u.created_at).getTime() < legacyBefore,
        plan: s?.plan || "free",
        status: s?.status || "inactive",
        has_subscription: !!s,
        has_billing: !!(s && (s.kakao_sid || s.billing_key)),
        current_period_end: s?.current_period_end || null,
        tenants: real.length,
        samples: mine.length - real.length,
        monthly_rent: real.filter((t) => t.status !== "공실").reduce((x, t) => x + (Number(t.rent) || 0), 0),
        visits: a.days.size,
        last_event_at: a.last,
        last_event: a.lastEvent,
        events: Object.values(a.counts).reduce((x, n) => x + n, 0),
        stage: stageOf({ tenants: real.length, samples: mine.length - real.length, ev: a.counts, paying }),
        auto_alimtalk: !!(m.auto_alimtalk && (m.auto_alimtalk.upcoming || m.auto_alimtalk.unpaid)),
        source: {
          utm_source: src.utm_source || "",
          utm_campaign: src.utm_campaign || "",
          ad: src.ad || "",
          ad_kw: src.ad_kw || "",
          landing: src.landing || "",
          referrer: host(src.referrer || ""),
        },
      };
    }).sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));

    const emailBy = {};
    for (const u of users) emailBy[u.id] = u.email;
    const properties = tenants.map((t) => ({ ...propertyRow(t, 0), owner: emailBy[t.user_id] || "" }));

    return NextResponse.json({ users, properties });
  } catch (e) {
    return NextResponse.json({ error: e.message || "조회 실패" }, { status: 500 });
  }
}
