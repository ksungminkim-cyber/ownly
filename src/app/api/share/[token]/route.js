// src/app/api/share/[token]/route.js
// 읽기 전용 공유 보고서 공개 조회 — 로그인 없이 토큰만으로. 만료·해지 확인 후 해당 연도 수입·지출 요약만 돌려준다.
// 개인정보 최소화: 세입자 이름은 성+"○○", 전화번호·연락처·메모 원문은 보내지 않는다. 주소는 앞부분(시·구·동)만.
// 샘플 데이터(이름·주소에 "[샘플]")는 제외.
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

const isSample = (t) => /\[샘플\]/.test(`${t.name || ""} ${t.address || ""}`);
const maskName = (n) => { const s = String(n || "").trim(); return s ? `${[...s][0]}○○` : "세입자"; };
const shortAddr = (a) => String(a || "").replace(/\[샘플\]/g, "").trim().split(/\s+/).slice(0, 3).join(" ");
const num = (v) => Number(v) || 0;

export async function GET(_req, { params }) {
  const token = String((await params)?.token || "");
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return json({ error: "not_found" }, 404);

  const db = admin();
  const { data: link } = await db.from("share_links").select("user_id, scope, year, label, expires_at, revoked_at").eq("token", token).maybeSingle();
  if (!link) return json({ error: "not_found" }, 404);
  if (link.revoked_at) return json({ error: "revoked" }, 410);
  if (new Date(link.expires_at) <= new Date()) return json({ error: "expired" }, 410);
  if (link.scope !== "annual_report") return json({ error: "not_found" }, 404);

  const year = link.year;
  const from = `${year}-01-01`, to = `${year}-12-31`;
  const { data: tenantRows, error: tErr } = await db.from("tenants").select("id, name, address, deposit, rent, status, p_type").eq("user_id", link.user_id);
  if (tErr) return json({ error: "temporary" }, 503);
  const all = tenantRows || [];
  const sampleIds = new Set(all.filter(isSample).map((t) => t.id));
  const tenants = all.filter((t) => !sampleIds.has(t.id));
  const ids = tenants.map((t) => t.id);

  const [payRes, ledgerRes, repairRes] = await Promise.all([
    ids.length ? db.from("payments").select("tenant_id, month, status, amount").in("tenant_id", ids).eq("year", year).in("status", ["paid", "partial"]) : { data: [] },
    db.from("ledger").select("date, type, category, amount, tenant_id").eq("user_id", link.user_id).gte("date", from).lte("date", to),
    ids.length ? db.from("repairs").select("tenant_id, cost, date").in("tenant_id", ids).gte("date", from).lte("date", to) : { data: [] },
  ]);
  if (payRes.error || ledgerRes.error || repairRes.error) return json({ error: "temporary" }, 503);

  // 1) 물건별 월세 수입 (납부 기록 paid·partial 금액, 월별)
  const byTenant = new Map();
  for (const p of payRes.data || []) {
    const m = num(p.month);
    if (m < 1 || m > 12) continue;
    if (!byTenant.has(p.tenant_id)) byTenant.set(p.tenant_id, Array(12).fill(0));
    byTenant.get(p.tenant_id)[m - 1] += num(p.amount);
  }
  const rentIncome = tenants.filter((t) => byTenant.has(t.id)).map((t) => {
    const months = byTenant.get(t.id);
    return { property: shortAddr(t.address) || "주소 미입력", tenant: maskName(t.name), type: t.p_type || "주거", months, total: months.reduce((s, v) => s + v, 0) };
  }).sort((a, b) => b.total - a.total);

  // 2) 장부 카테고리별 합계 (샘플 물건에 연결된 행 제외)
  const cats = new Map();
  for (const l of ledgerRes.data || []) {
    if (l.tenant_id && sampleIds.has(l.tenant_id)) continue;
    const type = l.type === "income" ? "income" : "expense";
    const key = `${type}|${l.category || "기타"}`;
    cats.set(key, (cats.get(key) || 0) + num(l.amount));
  }
  const ledger = { income: [], expense: [] };
  for (const [key, amount] of cats) { const [type, category] = key.split("|"); ledger[type].push({ category, amount }); }
  ledger.income.sort((a, b) => b.amount - a.amount);
  ledger.expense.sort((a, b) => b.amount - a.amount);

  // 3) 수리비 합계
  const repairs = (repairRes.data || []);
  const repairTotal = repairs.reduce((s, r) => s + num(r.cost), 0);

  // 4) 보증금 목록 (조회 시점 기준, 공실·퇴거 제외)
  const deposits = tenants.filter((t) => num(t.deposit) > 0 && t.status !== "공실" && t.status !== "퇴거")
    .map((t) => ({ property: shortAddr(t.address) || "주소 미입력", tenant: maskName(t.name), deposit: num(t.deposit) }))
    .sort((a, b) => b.deposit - a.deposit);

  return json({
    year, label: link.label || null, expires_at: link.expires_at, generated_at: new Date().toISOString(), unit: "만원",
    rentIncome, rentTotal: rentIncome.reduce((s, r) => s + r.total, 0),
    ledger, ledgerIncomeTotal: ledger.income.reduce((s, c) => s + c.amount, 0), ledgerExpenseTotal: ledger.expense.reduce((s, c) => s + c.amount, 0),
    repairTotal, repairCount: repairs.length,
    deposits, depositTotal: deposits.reduce((s, d) => s + d.deposit, 0),
  });
}
