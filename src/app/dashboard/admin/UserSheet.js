"use client";
// 관리자 패널 — 유저·물건 시트.
// 한 화면 높이 안에서 스크롤되는 표(머리글·첫 열 고정)로 전체 유저를 훑고, 행을 누르면 오른쪽 패널에
// 그 유저가 등록한 물건·활동 타임라인·발송된 알림이 열린다. 데이터는 /api/admin/users (service role, 관리자만).
import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, RefreshCw, X, ArrowUp, ArrowDown, Copy, Pencil } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { toast } from "../../../components/shared";
import { daysLeft } from "../../../lib/constants";

async function api(qs = "") {
  const { data: s } = await supabase.auth.getSession();
  const res = await fetch("/api/admin/users" + qs, { headers: { Authorization: `Bearer ${s?.session?.access_token || ""}` } });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || `HTTP ${res.status}`);
  return out;
}

/**
 * 퍼널 탭 상단 — 최근 30일 광고 클릭(가입 전 방문 포함)과 그 광고로 가입한 수.
 * 광고 플랫폼이 붙여 주는 값(네이버 자동 추적 URL·구글 gclid 등)이 들어와야 채워지므로,
 * 여기가 비어 있으면 광고가 꺼져 있거나 자동 추적 설정이 적용되지 않은 것이다.
 */
export function AdClicks() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api("?ads=1");
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const AD = { google: "구글 광고", naver: "네이버 광고", meta: "메타 광고", kakao: "카카오 광고" };
  const cell = { padding: "8px 12px", fontSize: 12.5, borderBottom: "1px solid var(--surface3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const head = { ...cell, fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface2)", borderBottom: "1px solid var(--border)", textAlign: "left" };
  return (
    <section className="surface-card" style={{ padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          광고 클릭 <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>최근 30일 · 브라우저당 하루 1회</span>
        </h3>
        {data && <span className="num" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>총 {data.total}건{data.last ? ` · 마지막 ${new Date(data.last).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}</span>}
      </div>
      {err ? (
        <p style={{ fontSize: 12.5, color: "#e8445a", margin: 0 }}>불러오기 실패: {err}</p>
      ) : !data ? (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>불러오는 중...</p>
      ) : data.rows.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.7 }}>
          아직 기록된 광고 클릭이 없습니다. 광고를 눌러 들어온 방문이 생기면 검색어별로 여기에 쌓입니다 (2026-11-13부터 수집).
        </p>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 560 }}>
            <thead>
              <tr>
                {["광고", "검색어", "입찰 키워드", "착지 페이지", "클릭", "가입"].map((h, i) => <th key={h} style={{ ...head, textAlign: i >= 4 ? "right" : "left" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...cell, fontWeight: 700 }}>{AD[r.ad] || r.ad}</td>
                  <td style={cell}>{r.kw || <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                  <td style={{ ...cell, color: "var(--text-muted)" }}>{r.bid_kw || "—"}</td>
                  <td style={{ ...cell, color: "var(--text-muted)" }}>{r.landing || "—"}</td>
                  <td style={{ ...cell, textAlign: "right", fontWeight: 800 }} className="num">{r.clicks}</td>
                  <td style={{ ...cell, textAlign: "right", color: r.signups ? "#0b8a5f" : "var(--text-faint)", fontWeight: r.signups ? 800 : 400 }} className="num">{r.signups || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const STAGES = [
  { k: "signup_only", label: "가입만", c: "#8a8a9a", bg: "#f0efe9" },
  { k: "visited", label: "방문만", c: "#5a6478", bg: "#e9edf3" },
  { k: "addr_check", label: "주소 확인", c: "#b45309", bg: "#fdf0d9" },
  { k: "sample", label: "샘플 체험", c: "#5b4fcf", bg: "#eeeaff" },
  { k: "property_removed", label: "등록 후 삭제", c: "#c2334a", bg: "#fde8ec" },
  { k: "property", label: "물건 등록", c: "#0b8a5f", bg: "#d9f3ea" },
  { k: "checkout", label: "결제 시도", c: "#4f46e5", bg: "#e5e4fd" },
  { k: "subscribed", label: "구독 중", c: "#fff", bg: "#1a2744" },
];
const STAGE = Object.fromEntries(STAGES.map((s, i) => [s.k, { ...s, order: i }]));
const PROVIDER = { email: "이메일", google: "Google", kakao: "카카오", naver: "네이버" };
const REF_LABEL = { "google.com": "구글 검색", "search.naver.com": "네이버 검색", "m.search.naver.com": "네이버 검색", "search.daum.net": "다음 검색", "m.search.daum.net": "다음 검색", "ad.search.naver.com": "네이버 광고" };
const AD_LABEL = { google: "구글 광고", naver: "네이버 광고", meta: "메타 광고", kakao: "카카오 광고" };
const EVENT_LABEL = {
  login: "로그인", dashboard_view: "대시보드 방문", onboard_view: "첫 화면 노출", onboard_dwell: "첫 화면 체류", onboard_addr_focus: "주소 칸 클릭",
  onboard_addr_check: "주소 확인", onboard_check_result: "주소 확인 결과", onboard_option: "다른 시작 방법 선택", onboard_prefill: "계약서 내용 이어받음",
  property_added: "물건 등록", sample_seeded: "샘플 체험 시작", sample_removed: "샘플 삭제", checkout_view: "결제 페이지 진입", pay_click: "결제 버튼 클릭",
  upsell_click: "플러스 안내 클릭", signup_source: "유입 경로 기록", tool_view: "무료 도구 조회", tool_action: "무료 도구 사용", tool_cta_click: "도구에서 가입 클릭",
  certified_issued: "내용증명 발급", portal_link_copied: "세입자 포털 링크 복사", sms_parse_used: "입금 문자 파싱", checklist_done: "시작 체크리스트 완료",
  pwa_guide_open: "홈 화면 추가 안내", pwa_install_prompt: "설치 프롬프트", pwa_installed: "앱 설치", auto_alimtalk_on: "자동 알림톡 켬", email_return: "메일에서 복귀", client_error: "화면 오류",
};
const NOTI_LABEL = { onboarding_1: "가입 안내 1일차", onboarding_2: "가입 안내 3일차", onboarding_3: "가입 안내 7일차", unpaid: "미납 알림", expiring: "만료 알림", monthly: "월간 리포트" };

function sourceLabel(s) {
  if (!s) return "";
  let base = "";
  if (s.utm_source) base = s.utm_source + (s.utm_campaign ? ` / ${s.utm_campaign}` : "");
  else if (s.ad) base = (AD_LABEL[s.ad] || s.ad) + (s.ad_kw ? ` · ${s.ad_kw}` : "");
  else if (s.referrer) base = REF_LABEL[s.referrer] || s.referrer;
  else if (s.landing) base = "직접 방문";
  if (base && s.landing && s.landing !== "/") base += ` → ${s.landing}`;
  return base;
}
function rel(iso, now) {
  if (!iso) return "—";
  const diff = (now - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  if (diff < 86400 * 60) return Math.floor(diff / 86400) + "일 전";
  return Math.floor(diff / (86400 * 30)) + "개월 전";
}
const ymd = (iso) => (iso ? new Date(iso).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "") : "—");
const hm = (iso) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
const won = (n) => (n ? Number(n).toLocaleString() + "만" : "—");
const lastSeen = (u) => [u.last_event_at, u.last_sign_in_at].filter(Boolean).sort().pop() || null;

function StageChip({ k }) {
  const s = STAGE[k] || STAGE.signup_only;
  return <span style={{ fontSize: 11, fontWeight: 800, color: s.c, background: s.bg, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{s.label}</span>;
}

const USER_COLS = [
  { k: "user", label: "유저", w: 250, sort: (u) => (u.name || u.email || "").toLowerCase() },
  { k: "stage", label: "단계", w: 104, sort: (u) => STAGE[u.stage]?.order ?? 0 },
  { k: "created", label: "가입", w: 96, sort: (u) => u.created_at || "" },
  { k: "seen", label: "마지막 활동", w: 100, sort: (u) => lastSeen(u) || "" },
  { k: "visits", label: "방문일", w: 66, num: true, sort: (u) => u.visits },
  { k: "tenants", label: "물건", w: 66, num: true, sort: (u) => u.tenants },
  { k: "rent", label: "월세 합계", w: 92, num: true, sort: (u) => u.monthly_rent },
  { k: "source", label: "유입", w: 190, sort: (u) => sourceLabel(u.source) },
  { k: "provider", label: "가입 수단", w: 84, sort: (u) => u.provider },
  { k: "plan", label: "플랜", w: 118, sort: (u) => (u.has_billing ? 2 : u.plan === "plus" ? 1 : 0) },
  { k: "edit", label: "", w: 44 },
];
const PROP_COLS = [
  { k: "address", label: "주소", w: 300, sort: (p) => p.address },
  { k: "owner", label: "소유자", w: 200, sort: (p) => p.owner },
  { k: "type", label: "유형", w: 84, sort: (p) => p.type },
  { k: "rent", label: "월세", w: 80, num: true, sort: (p) => p.rent },
  { k: "deposit", label: "보증금", w: 96, num: true, sort: (p) => p.deposit },
  { k: "pay_day", label: "납부일", w: 66, num: true, sort: (p) => p.pay_day || 0 },
  { k: "end", label: "만료", w: 128, sort: (p) => p.contract_end || "" },
  { k: "status", label: "상태", w: 72, sort: (p) => p.status },
  { k: "tenant", label: "세입자", w: 110, sort: (p) => p.tenant },
  { k: "tenant_phone", label: "세입자 전화", w: 124, sort: (p) => p.tenant_phone },
  { k: "created", label: "등록일", w: 88, sort: (p) => p.created_at || "" },
];

const th = { position: "sticky", top: 0, zIndex: 3, background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "0 12px", height: 36, fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textAlign: "left", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" };
const td = { padding: "0 12px", height: 40, fontSize: 12.5, color: "var(--text)", borderBottom: "1px solid var(--surface3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

export default function UserSheet({ currentUserId, onEdit, reloadKey = 0 }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [view, setView] = useState("users"); // users | properties
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState({ k: "created", dir: -1 });
  const [psort, setPsort] = useState({ k: "created", dir: -1 });
  const [showSample, setShowSample] = useState(false);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api();
        if (!cancelled) { setData(d); setErr(""); }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [nonce, reloadKey]);

  useEffect(() => {
    if (!sel) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await api(`?userId=${sel}`);
        if (!cancelled) setDetail({ id: sel, ...d });
      } catch (e) {
        if (!cancelled) setDetail({ id: sel, error: e.message, properties: [], events: [], notifications: [], counts: {} });
      }
    })();
    return () => { cancelled = true; };
  }, [sel]);

  const users = useMemo(() => data?.users || [], [data]);
  const properties = useMemo(() => data?.properties || [], [data]);

  const inPeriod = useCallback((u) => {
    if (period === "all") return true;
    const days = period === "7d" ? 7 : 30;
    return u.created_at && now - new Date(u.created_at).getTime() < days * 86400000;
  }, [period, now]);

  const scoped = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter((u) => inPeriod(u) && (!s || [u.email, u.name, u.phone, u.id, PROVIDER[u.provider] || u.provider, sourceLabel(u.source), u.plan].some((v) => String(v || "").toLowerCase().includes(s))));
  }, [users, q, inPeriod]);
  const counts = useMemo(() => {
    const c = { all: scoped.length };
    for (const u of scoped) c[u.stage] = (c[u.stage] || 0) + 1;
    return c;
  }, [scoped]);
  const rows = useMemo(() => {
    const col = USER_COLS.find((c) => c.k === sort.k) || USER_COLS[2];
    const list = scoped.filter((u) => stage === "all" || u.stage === stage);
    return [...list].sort((a, b) => {
      const x = col.sort(a), y = col.sort(b);
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
    });
  }, [scoped, stage, sort]);
  const prows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const col = PROP_COLS.find((c) => c.k === psort.k) || PROP_COLS[PROP_COLS.length - 1];
    const list = properties.filter((p) => (showSample || !p.sample) && (!s || [p.address, p.owner, p.type, p.status, p.tenant, p.tenant_phone].some((v) => String(v || "").toLowerCase().includes(s))));
    return [...list].sort((a, b) => {
      const x = col.sort(a), y = col.sort(b);
      return (x > y ? 1 : x < y ? -1 : 0) * psort.dir;
    });
  }, [properties, q, psort, showSample]);

  const open = (id) => { if (id !== sel) setDetail(null); setSel(id); };
  const close = () => { setSel(null); setDetail(null); };
  const refresh = () => { setBusy(true); setNonce((n) => n + 1); };

  // Esc 닫기 · ↑↓ 로 다음/이전 유저
  useEffect(() => {
    if (!sel) return;
    const onKey = (e) => {
      if (e.key === "Escape") { setSel(null); setDetail(null); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      const i = rows.findIndex((u) => u.id === sel);
      const next = rows[i + (e.key === "ArrowDown" ? 1 : -1)];
      if (next) { e.preventDefault(); setDetail(null); setSel(next.id); document.getElementById("urow-" + next.id)?.scrollIntoView({ block: "nearest" }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, rows]);

  const selUser = sel ? users.find((u) => u.id === sel) : null;
  const sortBy = (state, set) => (k) => set(state.k === k ? { k, dir: -state.dir } : { k, dir: k === "user" || k === "address" || k === "owner" ? 1 : -1 });
  const SortIcon = ({ state, k }) => (state.k === k ? (state.dir > 0 ? <ArrowUp size={11} style={{ marginLeft: 3, verticalAlign: -1 }} /> : <ArrowDown size={11} style={{ marginLeft: 3, verticalAlign: -1 }} />) : null);

  return (
    <div>
      {/* 도구 줄 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--surface)" }}>
          {[["users", `유저 ${users.length}`], ["properties", `물건 ${properties.filter((p) => !p.sample).length}`]].map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} style={{ padding: "8px 14px", fontSize: 12.5, fontWeight: 800, border: "none", cursor: "pointer", background: view === k ? "#1a2744" : "transparent", color: view === k ? "#fff" : "var(--text-muted)" }}>{l}</button>
          ))}
        </div>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={14} color="#a3a1a0" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={view === "users" ? "이메일·이름·전화·유입 경로·UID 검색" : "주소·소유자·세입자·전화 검색"}
            style={{ width: "100%", padding: "9px 12px 9px 32px", fontSize: 13, color: "var(--text)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
        </div>
        {view === "users" ? (
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: "8px 10px", fontSize: 12.5, fontWeight: 700, color: "var(--text)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <option value="all">전체 기간</option>
            <option value="7d">최근 7일 가입</option>
            <option value="30d">최근 30일 가입</option>
          </select>
        ) : (
          <label style={{ fontSize: 12.5, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={showSample} onChange={(e) => setShowSample(e.target.checked)} /> 샘플 포함
          </label>
        )}
        <button onClick={refresh} disabled={busy} className="btn btn-ghost btn-sm" title="새로고침" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} className={busy ? "spin" : ""} /> 새로고침
        </button>
      </div>

      {/* 단계 필터 — 그 자체가 가입 이후 퍼널 */}
      {view === "users" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {[{ k: "all", label: "전체" }, ...STAGES].map((s) => (
            <button key={s.k} onClick={() => setStage(s.k)} className={`chip${stage === s.k ? " is-active" : ""}`} style={{ opacity: counts[s.k] ? 1 : 0.45 }}>
              {s.label} <b className="num" style={{ marginLeft: 4 }}>{counts[s.k] || 0}</b>
            </button>
          ))}
        </div>
      )}

      {err && <p style={{ fontSize: 13, color: "#e8445a", margin: "0 0 10px" }}>불러오기 실패: {err}</p>}

      {/* 시트 */}
      <div style={{ height: "calc(100vh - 300px)", minHeight: 380, overflow: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
        {!data && busy ? (
          <p style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>불러오는 중...</p>
        ) : view === "users" ? (
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: USER_COLS.reduce((s, c) => s + c.w, 0), tableLayout: "fixed" }}>
            <colgroup>{USER_COLS.map((c) => <col key={c.k} style={{ width: c.w }} />)}</colgroup>
            <thead>
              <tr>
                {USER_COLS.map((c, i) => (
                  <th key={c.k} onClick={c.sort ? () => sortBy(sort, setSort)(c.k) : undefined}
                    style={{ ...th, textAlign: c.num ? "right" : "left", cursor: c.sort ? "pointer" : "default", ...(i === 0 ? { left: 0, zIndex: 4, borderRight: "1px solid var(--border)" } : {}) }}>
                    {c.label}<SortIcon state={sort} k={c.k} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={USER_COLS.length} style={{ ...td, height: 120, textAlign: "center", color: "var(--text-muted)" }}>조건에 맞는 유저가 없습니다</td></tr>
              )}
              {rows.map((u) => {
                const active = u.id === sel;
                const bg = active ? "#eef0fb" : "var(--surface)";
                const seen = lastSeen(u);
                return (
                  <tr key={u.id} id={"urow-" + u.id} onClick={() => open(u.id)} style={{ cursor: "pointer", background: bg }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface2)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "var(--surface)"; }}>
                    <td style={{ ...td, position: "sticky", left: 0, zIndex: 2, background: "inherit", borderRight: "1px solid var(--border)" }}>
                      <span style={{ fontWeight: 700 }}>{u.name || u.email.split("@")[0] || "—"}</span>
                      {u.id === currentUserId && <span style={{ fontSize: 10, fontWeight: 800, color: "#0b8a5f", marginLeft: 5 }}>나</span>}
                      <span style={{ color: "var(--text-faint)", marginLeft: 7, fontSize: 11.5 }}>{u.email}</span>
                    </td>
                    <td style={td}><StageChip k={u.stage} /></td>
                    <td style={{ ...td, color: "var(--text-muted)" }} className="num" title={u.created_at ? new Date(u.created_at).toLocaleString("ko-KR") : ""}>{ymd(u.created_at)}</td>
                    <td style={{ ...td, color: seen && now - new Date(seen).getTime() < 7 * 86400000 ? "var(--text)" : "var(--text-faint)" }} title={seen ? new Date(seen).toLocaleString("ko-KR") : ""}>{rel(seen, now)}</td>
                    <td style={{ ...td, textAlign: "right", color: u.visits ? "var(--text)" : "var(--text-faint)" }} className="num">{u.visits || "—"}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: u.tenants ? 800 : 400, color: u.tenants ? "var(--text)" : "var(--text-faint)" }} className="num">
                      {u.tenants || "—"}{u.samples > 0 && <span style={{ fontSize: 10.5, color: "#5b4fcf", fontWeight: 600, marginLeft: 4 }}>샘플{u.samples}</span>}
                    </td>
                    <td style={{ ...td, textAlign: "right", color: u.monthly_rent ? "var(--text)" : "var(--text-faint)" }} className="num">{won(u.monthly_rent)}</td>
                    <td style={{ ...td, color: "var(--text-muted)" }} title={sourceLabel(u.source)}>{sourceLabel(u.source) || <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                    <td style={{ ...td, color: "var(--text-muted)" }}>{PROVIDER[u.provider] || u.provider}</td>
                    <td style={td}>
                      <span style={{ fontWeight: 800, color: u.plan === "free" ? "var(--text-muted)" : "#4f46e5" }}>{u.plan === "free" ? "무료" : "플러스"}</span>
                      {u.has_billing ? <span style={{ fontSize: 10.5, color: "#0b8a5f", fontWeight: 700, marginLeft: 5 }}>결제수단</span>
                        : u.plan !== "free" ? <span style={{ fontSize: 10.5, color: "var(--text-faint)", marginLeft: 5 }}>수동</span>
                        : u.legacy ? <span style={{ fontSize: 10.5, color: "var(--text-faint)", marginLeft: 5 }}>기존</span> : null}
                    </td>
                    <td style={{ ...td, padding: "0 6px", textAlign: "center" }}>
                      <button onClick={(e) => { e.stopPropagation(); onEdit?.(u); }} title="플랜 변경" aria-label="플랜 변경"
                        style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: PROP_COLS.reduce((s, c) => s + c.w, 0), tableLayout: "fixed" }}>
            <colgroup>{PROP_COLS.map((c) => <col key={c.k} style={{ width: c.w }} />)}</colgroup>
            <thead>
              <tr>
                {PROP_COLS.map((c, i) => (
                  <th key={c.k} onClick={() => sortBy(psort, setPsort)(c.k)} style={{ ...th, textAlign: c.num ? "right" : "left", ...(i === 0 ? { left: 0, zIndex: 4, borderRight: "1px solid var(--border)" } : {}) }}>
                    {c.label}<SortIcon state={psort} k={c.k} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prows.length === 0 && (
                <tr><td colSpan={PROP_COLS.length} style={{ ...td, height: 120, textAlign: "center", color: "var(--text-muted)" }}>등록된 물건이 없습니다</td></tr>
              )}
              {prows.map((p) => <PropertyRow key={p.id} p={p} onOpen={() => open(p.user_id)} active={p.user_id === sel} />)}
            </tbody>
          </table>
        )}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "8px 2px 0" }}>
        {view === "users" ? `${rows.length}명 표시 · 행을 누르면 등록 물건과 활동 기록이 열립니다 (↑↓ 이동, Esc 닫기)` : `${prows.length}건 표시 · 행을 누르면 소유자 상세가 열립니다`}
      </p>

      {selUser && <UserDrawer u={selUser} detail={detail?.id === sel ? detail : null} now={now} onClose={close} onEdit={() => onEdit?.(selUser)} />}
    </div>
  );
}

function EndCell({ iso }) {
  if (!iso) return <span style={{ color: "var(--text-faint)" }}>—</span>;
  const d = daysLeft(iso);
  return (
    <>
      <span className="num">{ymd(iso)}</span>
      <span className="num" style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: d <= 0 ? "#c2334a" : d <= 60 ? "#b45309" : "var(--text-faint)" }}>{d <= 0 ? "만료" : `D-${d}`}</span>
    </>
  );
}

function PropertyRow({ p, onOpen, active }) {
  return (
    <tr onClick={onOpen} style={{ cursor: "pointer", background: active ? "#eef0fb" : "var(--surface)" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface2)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "var(--surface)"; }}>
      <td style={{ ...td, position: "sticky", left: 0, zIndex: 2, background: "inherit", borderRight: "1px solid var(--border)", fontWeight: 700 }} title={p.address}>{p.address || "—"}</td>
      <td style={{ ...td, color: "var(--text-muted)" }} title={p.owner}>{p.owner || "—"}</td>
      <td style={td}>{p.type || "—"}</td>
      <td style={{ ...td, textAlign: "right" }} className="num">{won(p.rent)}</td>
      <td style={{ ...td, textAlign: "right" }} className="num">{won(p.deposit)}</td>
      <td style={{ ...td, textAlign: "right", color: "var(--text-muted)" }} className="num">{p.pay_day ? (Number(p.pay_day) === 99 ? "말일" : p.pay_day + "일") : "—"}</td>
      <td style={td}><EndCell iso={p.contract_end} /></td>
      <td style={{ ...td, color: p.status === "공실" ? "#c2334a" : "var(--text)" }}>{p.status || "—"}</td>
      <td style={td} title={p.tenant}>{p.tenant || <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
      <td style={{ ...td, color: "var(--text-muted)" }} className="num">{p.tenant_phone || "—"}</td>
      <td style={{ ...td, color: "var(--text-muted)" }} className="num">{ymd(p.created_at)}</td>
    </tr>
  );
}

function Fact({ label, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</p>
    </div>
  );
}

function eventDetail(e) {
  const p = e.props || {};
  if (e.event === "dashboard_view") return `물건 ${p.tenants ?? 0}개`;
  if (e.event === "onboard_dwell") return `${p.seconds}초`;
  if (e.event === "onboard_check_result") return p.ok ? (p.market ? "지역 인식 · 시세 표시" : "지역 인식 · 시세 없음") : "지역 인식 실패";
  if (e.event === "onboard_option") return ({ scan: "계약서 사진", bulk: "엑셀 일괄", sample: "샘플" })[p.option] || p.option || "";
  if (e.event === "property_added") return p.pType || "";
  if (e.event === "tool_view" || e.event === "tool_action" || e.event === "tool_cta_click") return [p.tool, p.action].filter(Boolean).join(" · ");
  if (e.event === "signup_source") return sourceLabel({ ...p, referrer: (p.referrer || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "") });
  if (e.event === "checkout_view" || e.event === "pay_click") return p.plan || "";
  if (e.event === "login") return ({ callback: "소셜", password: "비밀번호", signup: "가입 직후" })[p.method] || "";
  if (e.event === "client_error") return String(p.message || "").slice(0, 80);
  if (p.from) return String(p.from);
  return "";
}

function UserDrawer({ u, detail, now, onClose, onEdit }) {
  const days = useMemo(() => {
    const g = [];
    for (const e of detail?.events || []) {
      const d = new Date(e.at).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
      if (!g.length || g[g.length - 1].d !== d) g.push({ d, items: [] });
      g[g.length - 1].items.push(e);
    }
    return g;
  }, [detail]);
  const real = (detail?.properties || []).filter((p) => !p.sample);
  const samples = (detail?.properties || []).length - real.length;
  const copy = (t) => { try { navigator.clipboard.writeText(t); toast("복사했어요"); } catch {} };
  const h3 = { fontSize: 13, fontWeight: 800, color: "var(--text)", margin: "22px 0 10px" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,39,68,0.18)", zIndex: 400 }} />
      <aside role="dialog" aria-label="유저 상세" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(560px, 100vw)", background: "var(--surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--elev-4)", zIndex: 401, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <p style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", margin: 0 }}>{u.name || u.email.split("@")[0]}</p>
              <StageChip k={u.stage} />
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {u.email}
              <button onClick={() => copy(u.email)} title="이메일 복사" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-faint)", padding: 0, display: "inline-flex" }}><Copy size={12} /></button>
              <span style={{ color: "var(--text-faint)", fontFamily: "monospace", fontSize: 11 }}>{u.id.slice(0, 8)}</span>
              <button onClick={() => copy(u.id)} title="UID 복사" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-faint)", padding: 0, display: "inline-flex" }}><Copy size={12} /></button>
            </p>
          </div>
          <button onClick={onEdit} className="btn btn-ghost btn-sm">플랜 변경</button>
          <button onClick={onClose} aria-label="닫기" style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}><X size={15} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px 16px" }}>
            <Fact label="가입">{ymd(u.created_at)} · {PROVIDER[u.provider] || u.provider}</Fact>
            <Fact label="마지막 활동">{rel(lastSeen(u), now)}</Fact>
            <Fact label="대시보드 방문">{u.visits ? `${u.visits}일` : "기록 없음"}</Fact>
            <Fact label="플랜">{u.plan === "free" ? "무료" : "플러스"}{u.has_billing ? " · 결제수단 등록" : u.plan !== "free" ? " · 수동 부여" : u.legacy ? " · 기존 가입자" : ""}</Fact>
            <Fact label="전화">{u.phone || "미입력"}</Fact>
            <Fact label="자동 알림톡">{u.auto_alimtalk ? "켜짐" : "꺼짐"}</Fact>
          </div>
          <div style={{ marginTop: 14 }}>
            <Fact label="유입 경로">{sourceLabel(u.source) || "기록 없음"}</Fact>
          </div>

          <h3 style={h3}>등록 물건 {detail ? `${real.length}건` : ""}{samples > 0 && <span style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: 12 }}> · 샘플 {samples}건 별도</span>}</h3>
          {!detail ? (
            <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>불러오는 중...</p>
          ) : detail.error ? (
            <p style={{ fontSize: 12.5, color: "#e8445a" }}>{detail.error}</p>
          ) : real.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", background: "var(--surface2)", borderRadius: 10, padding: "12px 14px", margin: 0 }}>
              {u.stage === "property_removed" ? "물건을 등록했다가 지웠습니다." : "아직 등록한 물건이 없습니다."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {real.map((p) => (
                <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: 0, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.address}>{p.address || "주소 없음"}</p>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: p.status === "공실" ? "#c2334a" : "var(--text-muted)", whiteSpace: "nowrap" }}>{p.type}{p.status ? ` · ${p.status}` : ""}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 10 }}>
                    <Fact label="월세">{won(p.rent)}{p.maintenance ? ` +${p.maintenance}` : ""}</Fact>
                    <Fact label="보증금">{won(p.deposit)}</Fact>
                    <Fact label="납부일">{p.pay_day ? (Number(p.pay_day) === 99 ? "말일" : `${p.pay_day}일`) : "—"}</Fact>
                    <Fact label="만료"><EndCell iso={p.contract_end} /></Fact>
                    <Fact label="세입자">{p.tenant || "미입력"}</Fact>
                    <Fact label="세입자 전화">{p.tenant_phone || "없음"}</Fact>
                    <Fact label="수금 기록">{p.paid_count ? `${p.paid_count}건` : "없음"}</Fact>
                    <Fact label="등록일">{ymd(p.created_at)}</Fact>
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "2px 0 0" }}>
                계약서 {detail.counts?.contracts || 0}건 · 수리 {detail.counts?.repairs || 0}건 · 장부 {detail.counts?.ledger || 0}건
              </p>
            </div>
          )}

          <h3 style={h3}>활동 기록 {detail ? `${detail.events.length}건` : ""}</h3>
          {!detail ? null : days.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", background: "var(--surface2)", borderRadius: 10, padding: "12px 14px", margin: 0, lineHeight: 1.6 }}>
              가입 이후 기록된 행동이 없습니다. 가입 직후 화면을 닫았거나, 광고 차단 확장 프로그램이 기록 요청을 막았을 수 있습니다.
            </p>
          ) : (
            days.map((g) => (
              <div key={g.d} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 4px" }}>{g.d}</p>
                {g.items.map((e, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)", gap: 10, padding: "5px 0", borderBottom: "1px solid var(--surface3)", fontSize: 12.5 }}>
                    <span className="num" style={{ color: "var(--text-faint)" }}>{hm(e.at)}</span>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <b style={{ fontWeight: ["property_added", "checkout_view", "pay_click", "certified_issued"].includes(e.event) ? 800 : 600, color: e.event === "client_error" ? "#c2334a" : "var(--text)" }}>{EVENT_LABEL[e.event] || e.event}</b>
                      {eventDetail(e) && <span style={{ color: "var(--text-muted)", marginLeft: 7 }}>{eventDetail(e)}</span>}
                      {e.path && e.path !== "/dashboard" && <span style={{ color: "var(--text-faint)", marginLeft: 7, fontSize: 11.5 }}>{e.path}</span>}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}

          {detail?.notifications?.length > 0 && (
            <>
              <h3 style={h3}>보낸 알림 {detail.notifications.length}건</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {detail.notifications.map((n, i) => (
                  <span key={i} className="chip" style={{ cursor: "default" }}>{NOTI_LABEL[n.type] || n.type} <span className="num" style={{ color: "var(--text-faint)", marginLeft: 5 }}>{ymd(n.created_at)}</span></span>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
