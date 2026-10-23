"use client";
import { todayKST } from "../../lib/kstDate";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, Wrench, Lock, ArrowRight, BookOpen, MessagesSquare } from "lucide-react";
import { EmptyState, SkeletonDashboard } from "../../components/shared";
import { daysLeft, PLANS } from "../../lib/constants";
import { getInitial } from "../../lib/initial";
import IncomeStoryWidget from "../../components/IncomeStoryWidget";
import IncomeChart from "../../components/IncomeChart";
import { FAB, CountUp } from "../../components/Trendy";
import BenchmarkWidget from "../../components/BenchmarkWidget";
import PaymentRiskWidget from "../../components/PaymentRiskWidget";
import PolicyWidget from "../../components/PolicyWidget";
import TrialBanner from "../../components/TrialBanner";
import OnboardingHero, { SampleBanner } from "../../components/OnboardingHero";
import SetupChecklist from "../../components/SetupChecklist";
import { toast } from "../../components/shared";
import { useApp } from "../../context/AppContext";
import { trackDaily, trackSignupSourceOnce } from "../../lib/track";
import { getUnpaidTenantIds, displayStatus } from "../../lib/unpaid";

const ST = {
  정상: { c: "#0fa573", bg: "rgba(15,165,115,0.08)" },
  미납: { c: "#e8445a", bg: "rgba(232,68,90,0.08)" },
  만료임박: { c: "#e8960a", bg: "rgba(232,150,10,0.08)" },
};
const FILTERS = ["전체", "주거", "상가", "토지", "만료임박", "미납"];
const PREMIUM_FEATURES = [
  { id: "roi", href: "/dashboard/premium/calculator?tab=roi", title: "수익률 계산기", desc: "취득세·종소세·건보료 감안한 실질 수익률", plan: "plus" },
  { id: "vacancy_loss", href: "/dashboard/premium/calculator?tab=vacancy", title: "공실 손실 계산기", desc: "공실 기간별 기회비용·손실액", plan: "plus" },
  { id: "lease_check", href: "/dashboard/premium/lease-check", title: "임대차 3법 체크", desc: "갱신청구권·상한제 적용 여부", plan: "plus" },
  { id: "map", href: "/dashboard/premium/map-search", title: "주변 매물 조회", desc: "국토부 실거래 기반 주변 시세", plan: "plus" },
  { id: "ai_report", href: "/dashboard/premium/ai-report", title: "AI 임대료 분석", desc: "실거래 기반 적정 임대료", plan: "plus" },
  { id: "kakao_alert", href: "/dashboard/premium/kakao-alert", title: "카카오 수금 알림", desc: "미납 세입자에게 알림톡 발송", plan: "plus" },
];
const PLAN_ORDER = { free: 0, plus: 1 };
function getEndDate(t) {
  return t.end_date || t.end || "";
}

function ActionBanner({ tone, Icon, title, sub, onClick }) {
  const color = tone === "danger" ? "#e8445a" : tone === "warn" ? "#e8960a" : "#5b4fcf";
  return (
    <div className={`action-banner action-banner-${tone === "danger" ? "danger" : tone === "warn" ? "warn" : "info"}`} onClick={onClick} role="button" tabIndex={0}>
      <span style={{ width: 32, height: 32, borderRadius: 10, background: `${color}14`, color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{title}</p>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</p>
      </div>
      <ArrowRight size={15} color={color} />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { tenants, payments, repairs, ledger, loading, userPlan, user } = useApp();
  const [filter, setFilter] = useState("전체");
  const [selected, setSelected] = useState(null);
  const planLevel = PLAN_ORDER[userPlan] ?? 0;
  const totalRent = tenants.filter((t) => t.status !== "공실" && t.status !== "퇴거").reduce((s, t) => s + (t.rent || 0), 0);
  const totalDep = tenants.reduce((s, t) => s + (t.dep || 0), 0);
  const vacancies = tenants.filter((t) => t.status === "공실").length;
  const unpaidIds = getUnpaidTenantIds(tenants, payments);
  const unpaid = unpaidIds.size;
  const openRepairs = (repairs || []).filter((r) => r.status === "open" || r.status === "in_progress").length;
  const urgentRepairs = (repairs || []).filter((r) => (r.status === "open" || r.status === "in_progress") && r.priority === "urgent").length;
  const expiring = tenants.filter((t) => {
    const dl = daysLeft(getEndDate(t));
    return dl > 0 && dl <= 60;
  }).length;
  const netData = Array.from({ length: 6 }, (_, _i) => {
    const _d = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - _i), 1);
    const _y = _d.getFullYear();
    const _mo = _d.getMonth() + 1;
    const _inc = (payments || []).filter((p) => p.status === "paid" && (p.year || _y) === _y && (p.month || 0) === _mo).reduce((s, p) => s + (p.amt || p.amount || 0), 0);
    const _rc = (repairs || [])
      .filter((r) => {
        const rd = new Date(r.date || "");
        return rd.getFullYear() === _y && rd.getMonth() + 1 === _mo;
      })
      .reduce((s, r) => s + (r.cost || 0), 0);
    const _lc = (ledger || [])
      .filter((l) => {
        if (l.type !== "expense" || (l.auto_generated && l.category === "수리비")) return false;
        /* 수리 등록 때 자동 기록된 수리비는 _rc 와 중복 */
        const ld = new Date(l.date || "");
        return ld.getFullYear() === _y && ld.getMonth() + 1 === _mo;
      })
      .reduce((s, l) => s + (l.amount || 0), 0);
    return { m: _mo + "월", income: _inc, expense: _rc + _lc, net: _inc - _rc - _lc };
  });
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const filtered = tenants.filter((t) => {
    if (filter === "전체") return true;
    if (filter === "주거") return t.pType === "주거";
    if (filter === "상가") return t.pType === "상가";
    if (filter === "토지") return t.pType === "토지";
    if (filter === "미납") return unpaidIds.has(t.id);
    if (filter === "만료임박") {
      const dl = daysLeft(getEndDate(t));
      return dl > 0 && dl <= 90;
    }
    return true;
  });
  const sel = selected ? tenants.find((t) => t.id === selected) : null;
  const alerts = [
    ...tenants.filter((t) => unpaidIds.has(t.id)).map((t) => ({ type: "danger", text: t.name + "님 미납", sub: t.rent + "만원", page: "payments" })),
    ...tenants
      .filter((t) => {
        const sd = t.start_date || t.start;
        if (!sd || t.report_filed_at) return false;
        const days = Math.floor((now - new Date(sd)) / 86400000);
        return days >= 0 && days < 30 && ((t.dep || 0) > 6000 || (t.rent || 0) > 30);
      })
      .map((t) => {
        const days = Math.floor((now - new Date(t.start_date || t.start)) / 86400000);
        return { type: "warn", text: t.name + "님 전월세신고 기한 D-" + (30 - days), sub: "계약일부터 30일 이내 신고 대상 · 미신고 시 과태료", page: "tenants" };
      }),
    ...tenants
      .filter((t) => {
        const dl = daysLeft(getEndDate(t));
        return dl > 0 && dl <= 90 && t.status !== "미납";
      })
      .map((t) => ({ type: "warn", text: t.name + "님 만료 D-" + daysLeft(getEndDate(t)), sub: t.addr, page: "tenants" })),
  ];
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => {
    if (loading || tenants.length === 0) return;
    const todayStr = todayKST();
    try {
      if (localStorage.getItem("ownly_briefing_date") === todayStr) return;
    } catch {}
    const parts = [];
    if (unpaid > 0) parts.push(`미납 ${unpaid}건`);
    if (expiring > 0) parts.push(`만료임박 ${expiring}건`);
    if (openRepairs > 0) parts.push(`수리 ${openRepairs}건`);
    if (vacancies > 0) parts.push(`공실 ${vacancies}실`);
    if (parts.length === 0) {
      setTimeout(() => toast("오늘은 처리할 일이 없어요. 평온한 하루 보내세요"), 800);
    } else {
      setTimeout(() => toast(`오늘의 브리핑: ${parts.join(" · ")}`), 800);
    }
    try {
      localStorage.setItem("ownly_briefing_date", todayStr);
    } catch {}
  }, [loading, tenants.length, unpaid, expiring, openRepairs, vacancies]);
  useEffect(() => {
    if (!loading) {
      trackDaily("dashboard_view", { tenants: tenants.length });
      trackSignupSourceOnce(user?.id);
    }
  }, [loading, tenants.length, user?.id]);
  if (loading) return <SkeletonDashboard />;

  const greeting = (() => {
    const h = new Date().getHours();
    const g = h < 6 ? "늦은 밤까지 고생 많으세요" : h < 12 ? "좋은 아침이에요" : h < 18 ? "좋은 오후예요" : "편안한 저녁이에요";
    const nick = user?.user_metadata?.nickname || user?.user_metadata?.full_name || "";
    return `${g}${nick ? `, ${nick}님` : ""}`;
  })();
  const kpis = [
    { l: "이번 달 수입", v: totalRent, suffix: "만", sub: "전 물건 합산", a: "#0fa573", p: "payments" },
    { l: "총 보증금", v: Number((totalDep / 10000).toFixed(1)), decimals: 1, suffix: "억", sub: "물건 " + tenants.length + "개", a: "var(--text)", p: "properties" },
    { l: "미납", v: unpaid, suffix: "건", sub: unpaid > 0 ? "즉시 확인" : "모두 정상", a: unpaid > 0 ? "#e8445a" : "#0fa573", p: "payments" },
    { l: "만료 임박", v: expiring, suffix: "건", sub: "60일 이내", a: "#e8960a", p: "tenants" },
    ...(vacancies > 0 ? [{ l: "공실", v: vacancies, suffix: "건", sub: "해소 전략 보기", a: "#e8445a", p: "vacancy" }] : []),
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile || tenants.length === 0 ? "1fr" : "1fr 320px",
        minHeight: "100%",
        fontFamily: "'Pretendard','DM Sans',sans-serif",
        overflowX: "hidden",
        maxWidth: "100%",
      }}
    >
      <div className="page-in" style={{ padding: isMobile ? "20px 16px" : "24px 20px 24px 28px", borderRight: isMobile ? "none" : "1px solid #ebe9e3", minHeight: "100vh", overflowX: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: "#8a8a9a", marginBottom: 4 }}>{greeting}</p>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-.5px", margin: 0 }}>대시보드</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600, whiteSpace: "nowrap" }}>
              {year}년 {month}월
            </span>
            <button onClick={() => router.push("/dashboard/properties")} className={`btn btn-fill ${isMobile ? "btn-sm" : ""}`}>
              + 물건 추가
            </button>
          </div>
        </div>
        {tenants.length === 0 && <OnboardingHero />}
        <SampleBanner />
        <TrialBanner />
        <SetupChecklist />
        {tenants.length > 0 && <IncomeStoryWidget tenants={tenants} payments={payments} onNavigate={(p) => router.push(p)} />}
        {tenants.length > 0 && (unpaid > 0 || expiring > 0 || openRepairs > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {unpaid > 0 && (
              <ActionBanner tone="danger" Icon={AlertTriangle} title={`미납 ${unpaid}건 — 즉시 확인이 필요합니다`} sub="수금 현황에서 납부 처리하거나 내용증명을 발송하세요" onClick={() => router.push("/dashboard/payments")} />
            )}
            {expiring > 0 && (
              <ActionBanner tone="warn" Icon={CalendarClock} title={`계약 만료 임박 ${expiring}건 — 갱신 협상을 시작하세요`} sub="D-60 이내 만료 예정 · 지금 갱신 의향을 확인하세요" onClick={() => router.push("/dashboard/tenants")} />
            )}
            {openRepairs > 0 && (
              <ActionBanner
                tone={urgentRepairs > 0 ? "danger" : "info"}
                Icon={Wrench}
                title={`수리 요청 ${openRepairs}건 처리 대기${urgentRepairs > 0 ? ` (긴급 ${urgentRepairs}건)` : ""}`}
                sub={urgentRepairs > 0 ? "긴급 요청부터 우선 확인해주세요" : "세입자 민원을 빠르게 응답하면 만족도가 올라갑니다"}
                onClick={() => router.push("/dashboard/repairs")}
              />
            )}
          </div>
        )}
        {tenants.length > 0 && (
          <>
            <div className="stagger" style={{ display: "grid", gridTemplateColumns: vacancies > 0 ? "repeat(auto-fit,minmax(150px,1fr))" : "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
              {kpis.map((k) => (
                <div key={k.l} onClick={() => router.push("/dashboard/" + k.p)} className="stat interactive" role="button" tabIndex={0}>
                  <p className="stat-label">{k.l}</p>
                  <p className="num stat-value">
                    <CountUp value={k.v} suffix={k.suffix} decimals={k.decimals || 0} duration={900} />
                  </p>
                  <p className="stat-sub" style={{ color: k.a, fontWeight: 700 }}>
                    {k.sub}
                  </p>
                </div>
              ))}
            </div>
            <IncomeChart data={netData} onEmpty={() => router.push("/dashboard/payments")} />
            <div className="surface-card" style={{ overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "14px 16px 0", borderBottom: "1px solid #f0efe9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", margin: 0 }}>물건 목록</h3>
                  <span onClick={() => router.push("/dashboard/properties")} style={{ fontSize: 11, color: "#8a8a9a", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                    전체 보기 →
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setFilter(f);
                        setSelected(null);
                      }}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "8px 8px 0 0",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: "none",
                        background: filter === f ? "#1a2744" : "transparent",
                        color: filter === f ? "#fff" : "#8a8a9a",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {f}
                      {f === "전체" ? " (" + tenants.length + ")" : ""}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "64px 1fr 60px 48px" : "80px 1fr 70px 60px 70px 60px", padding: "8px 16px", background: "#faf9f6", borderBottom: "1px solid #f0efe9" }}>
                {(isMobile ? ["유형", "주소 · 세입자", "월세", "상태"] : ["유형", "주소 · 세입자", "월세", "보증금", "잔여일", "상태"]).map((h) => (
                  <span key={h} style={{ fontSize: 11, color: "#6a6a7a", fontWeight: 700 }}>
                    {h}
                  </span>
                ))}
              </div>
              {filtered.length === 0 ? (
                <EmptyState icon="🏠" title="해당 물건이 없습니다" desc="다른 필터를 선택해보세요" />
              ) : (
                filtered.map((t) => {
                  const dl = daysLeft(getEndDate(t));
                  const isSel = selected === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelected(isSel ? null : t.id)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "64px 1fr 60px 48px" : "80px 1fr 70px 60px 70px 60px",
                        padding: "11px 16px",
                        borderBottom: "1px solid #f4f3f0",
                        cursor: "pointer",
                        background: isSel ? "rgba(26,39,68,0.04)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSel) e.currentTarget.style.background = "#faf9f6";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSel) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: t.pType === "상가" ? "#e8960a" : t.pType === "토지" ? "#0d9488" : "#1a2744",
                            background: t.pType === "상가" ? "rgba(232,150,10,0.1)" : t.pType === "토지" ? "rgba(13,148,136,0.1)" : "rgba(26,39,68,0.07)",
                            padding: "3px 6px",
                            borderRadius: 5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.sub || t.pType}
                        </span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#1a2744", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.addr}</p>
                        <p style={{ fontSize: 11, color: "#6a6a7a", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.name}
                          {isMobile && dl > 0 && dl <= 90 && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 12,
                                fontWeight: 800,
                                color: dl <= 30 ? "#e8445a" : dl <= 60 ? "#e8960a" : "#5b4fcf",
                                background: dl <= 30 ? "rgba(232,68,90,0.1)" : dl <= 60 ? "rgba(232,150,10,0.1)" : "rgba(91,79,207,0.08)",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}
                            >
                              D-{dl}
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="num" style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", alignSelf: "center", whiteSpace: "nowrap" }}>
                        {Number(t.rent).toLocaleString()}만
                      </p>
                      {!isMobile && <p style={{ fontSize: 12, color: "#8a8a9a", alignSelf: "center" }}>{t.dep ? Math.round(t.dep / 100) + "백" : "-"}</p>}
                      {!isMobile && (
                        <p className="num" style={{ fontSize: 12, fontWeight: 700, color: dl <= 60 ? "#e8445a" : dl <= 90 ? "#e8960a" : "#8a8a9a", alignSelf: "center" }}>
                          D-{dl}
                        </p>
                      )}
                      <div style={{ alignSelf: "center" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: ST[displayStatus(t, unpaidIds)]?.c || "#8a8a9a",
                            background: ST[displayStatus(t, unpaidIds)]?.bg || "#f0efe9",
                            padding: "3px 6px",
                            borderRadius: 5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {displayStatus(t, unpaidIds)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <BenchmarkWidget tenants={tenants} />
            <PaymentRiskWidget tenants={tenants} payments={payments} onNavigate={(p) => router.push(p)} />
            <PolicyWidget tenants={tenants} />
          </>
        )}
      </div>

      {tenants.length > 0 && (
        <div style={{ padding: isMobile ? "20px 16px" : "24px 20px", background: "#fff", display: "flex", flexDirection: "column", minHeight: isMobile ? "unset" : "100vh", overflowY: "auto", overflowX: "hidden", borderTop: isMobile ? "1px solid #ebe9e3" : "none" }}>
          {sel ? (
            <>
              <button onClick={() => setSelected(null)} style={{ fontSize: 11, color: "#8a8a9a", background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0, fontWeight: 600, textAlign: "left" }}>
                ← 목록으로
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(26,39,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#1a2744" }}>{getInitial(sel.name)}</div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#1a2744" }}>{sel.name}</p>
                  <p style={{ fontSize: 11, color: "#8a8a9a" }}>{sel.addr}</p>
                </div>
              </div>
              <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                {[
                  ["월세", Number(sel.rent).toLocaleString() + "만원", "#0fa573"],
                  ["보증금", (sel.dep || 0).toLocaleString() + "만원", undefined],
                  ["만료일", getEndDate(sel) || "-", daysLeft(getEndDate(sel)) <= 90 ? "#e8960a" : undefined],
                  ["잔여일", "D-" + daysLeft(getEndDate(sel)), daysLeft(getEndDate(sel)) <= 60 ? "#e8445a" : "#0fa573"],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #ebe9e3" }}>
                    <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: color || "#1a2744" }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["수금 현황", "payments"],
                  ["내용증명 발행", "certified"],
                  ["계약서 보기", "contracts"],
                ].map(([label, page]) => (
                  <button key={page} onClick={() => router.push("/dashboard/" + page)} className="btn btn-soft" style={{ justifyContent: "space-between" }}>
                    {label}
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* 오늘 — 날짜와 처리할 일 */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                  <span className="display-num" style={{ fontSize: 40, color: "var(--text)" }}>
                    {now.getDate()}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                      {month}월 {["일", "월", "화", "수", "목", "금", "토"][now.getDay()]}요일
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                      물건 {tenants.length}개 · 월 {totalRent.toLocaleString()}만원
                    </p>
                  </div>
                </div>
                {alerts.length === 0 ? (
                  <p className="hairline" style={{ fontSize: 12.5, color: "var(--text-muted)", paddingTop: 12, margin: 0 }}>
                    오늘 처리할 일이 없습니다.
                  </p>
                ) : (
                  <div className="hairline" style={{ paddingTop: 6 }}>
                    {alerts.map((a, i) => (
                      <div
                        key={i}
                        onClick={() => router.push("/dashboard/" + a.page)}
                        role="button"
                        tabIndex={0}
                        style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid var(--surface3)", cursor: "pointer" }}
                      >
                        <i style={{ width: 7, height: 7, borderRadius: "50%", background: a.type === "danger" ? "#e8445a" : "#e8960a", marginTop: 6, flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{a.text}</p>
                          <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.sub}</p>
                        </div>
                        <ArrowRight size={14} color="#a3a1a0" style={{ marginTop: 3, flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 도구 */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>분석·계산·알림 도구</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {PREMIUM_FEATURES.map((f) => {
                    const locked = PLAN_ORDER[f.plan] > planLevel;
                    return (
                      <div
                        key={f.id}
                        onClick={() => router.push(locked ? "/dashboard/pricing" : f.href)}
                        className="surface-card interactive compact"
                        role="button"
                        tabIndex={0}
                        style={{ padding: "12px 12px 10px", background: locked ? "var(--surface2)" : "var(--surface)", boxShadow: "none" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 800, color: locked ? "var(--text-muted)" : "var(--text)", marginBottom: 3, lineHeight: 1.3 }}>{f.title}</p>
                          {locked && <Lock size={12} color="#a3a1a0" style={{ flexShrink: 0, marginTop: 2 }} />}
                        </div>
                        <p style={{ fontSize: 11.5, color: locked ? "var(--text-faint)" : "var(--text-muted)", lineHeight: 1.45 }}>{f.desc}</p>
                      </div>
                    );
                  })}
                </div>
                {planLevel < 1 && (
                  <div
                    onClick={() => router.push("/dashboard/pricing")}
                    role="button"
                    tabIndex={0}
                    style={{ marginTop: 12, borderRadius: 14, padding: "14px 16px", cursor: "pointer", background: "#1a2744", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
                  >
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 2 }}>잠긴 도구 전부 열기</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>플러스 월 {PLANS.plus.price.toLocaleString()}원 · 언제든 해지</p>
                    </div>
                    <ArrowRight size={18} color="rgba(255,255,255,0.85)" />
                  </div>
                )}
              </div>

              <div className="hairline" style={{ marginTop: 18, paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  [BookOpen, "임대인 가이드", "세금·법률·수익률 실전 정보", "/blog"],
                  [MessagesSquare, "임대인 커뮤니티", "팁·정보·질문 공유", "/dashboard/community"],
                ].map(([Icon, title, desc, href]) => (
                  <div key={href} onClick={() => router.push(href)} role="button" tabIndex={0} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", cursor: "pointer", borderRadius: 8 }}>
                    <Icon size={16} color="#6e6e7d" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", margin: 0 }}>{title}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{desc}</p>
                    </div>
                    <ArrowRight size={14} color="#a3a1a0" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {isMobile && <FAB onClick={() => router.push("/dashboard/properties")} label="물건 등록" ariaLabel="새 물건 등록" />}
    </div>
  );
}
