"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomTooltip, EmptyState } from "../../components/shared";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { REVENUE, daysLeft } from "../../lib/constants";
import { useApp } from "../../context/AppContext";

const ST = {
  "정상":    { c: "#0fa573", bg: "rgba(15,165,115,0.08)" },
  "미납":    { c: "#e8445a", bg: "rgba(232,68,90,0.08)" },
  "만료임박":{ c: "#e8960a", bg: "rgba(232,150,10,0.08)" },
};

const FILTERS = ["전체", "주거", "상가", "토지", "만료임박", "미납"];

// 프리미엄 기능 정의
const PREMIUM_FEATURES = [
  {
    id: "roi",
    icon: "💰",
    title: "수익률 계산기",
    desc: "취득세·종소세·건보료 감안한\n실질 수익률 시뮬레이션",
    badge: "STARTER+",
    badgeColor: "#0fa573",
    plan: "starter_plus",
    tag: "인기",
    tagColor: "#0fa573",
  },
  {
    id: "vacancy_loss",
    icon: "📊",
    title: "공실 손실 계산기",
    desc: "공실 기간별 기회비용·\n손실액 자동 계산",
    badge: "STARTER+",
    badgeColor: "#0fa573",
    plan: "starter_plus",
    tag: null,
  },
  {
    id: "lease_check",
    icon: "📋",
    title: "임대차 3법 체크리스트",
    desc: "계약갱신청구권·전월세상한제\n자동 적용 여부 확인",
    badge: "STARTER+",
    badgeColor: "#0fa573",
    plan: "starter_plus",
    tag: null,
  },
  {
    id: "map",
    icon: "🗺️",
    title: "주변 매물 조회",
    desc: "네이버 부동산 연동\n주변 시세·매물 비교",
    badge: "PRO",
    badgeColor: "#c9920a",
    plan: "pro",
    tag: "NEW",
    tagColor: "#5b4fcf",
  },
  {
    id: "ai_report",
    icon: "🤖",
    title: "AI 입지 분석 리포트",
    desc: "위치 기반 상권·학군·\n인구밀도 AI 분석",
    badge: "PRO",
    badgeColor: "#c9920a",
    plan: "pro",
    tag: "AI",
    tagColor: "#5b4fcf",
  },
  {
    id: "kakao_alert",
    icon: "📱",
    title: "카카오톡 수금 알림",
    desc: "미납 세입자에게\n자동 알림 발송",
    badge: "PRO",
    badgeColor: "#c9920a",
    plan: "pro",
    tag: null,
  },
];

const PLAN_ORDER = { free: 0, starter: 1, starter_plus: 2, pro: 3 };

export default function DashboardPage() {
  const router = useRouter();
  const { tenants, loading, userPlan } = useApp();
  const [filter, setFilter] = useState("전체");
  const [selected, setSelected] = useState(null);
  const [activeFeature, setActiveFeature] = useState(null);

  const planLevel = PLAN_ORDER[userPlan] ?? 0;

  const totalRent = tenants.reduce((s, t) => s + (t.rent || 0), 0);
  const totalDep  = tenants.reduce((s, t) => s + (t.dep  || 0), 0);
  const unpaid    = tenants.filter((t) => t.status === "미납").length;
  const expiring  = tenants.filter((t) => daysLeft(t.end) <= 60).length;
  const netData   = REVENUE.map((m) => ({ ...m, net: m.income - m.expense }));

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const filtered = tenants.filter((t) => {
    if (filter === "전체")    return true;
    if (filter === "주거")    return t.pType === "주거";
    if (filter === "상가")    return t.pType === "상가";
    if (filter === "토지")    return t.pType === "토지";
    if (filter === "미납")    return t.status === "미납";
    if (filter === "만료임박") return daysLeft(t.end) <= 90;
    return true;
  });

  const sel = selected ? tenants.find((t) => t.id === selected) : null;

  const alerts = [
    ...tenants.filter((t) => t.status === "미납").map((t) => ({
      type: "danger", icon: "⚠️",
      text: t.name + "님 미납", sub: t.rent + "만원", page: "payments",
    })),
    ...tenants.filter((t) => daysLeft(t.end) <= 90 && t.status !== "미납").map((t) => ({
      type: "warn", icon: "📅",
      text: t.name + "님 만료 D-" + daysLeft(t.end), sub: t.addr, page: "tenants",
    })),
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <p style={{ color: "#8a8a9a", fontSize: 14 }}>불러오는 중...</p>
    </div>
  );

  // ── 프리미엄 기능 상세 패널 ──────────────────────────────
  const renderFeaturePanel = (f) => {
    const locked = PLAN_ORDER[f.plan] > planLevel;

    if (locked) return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <button onClick={() => setActiveFeature(null)}
          style={{ fontSize: 11, color: "#8a8a9a", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0, fontWeight: 600, textAlign: "left" }}>
          ← 돌아가기
        </button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 8px" }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>{f.icon}</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: f.badgeColor, letterSpacing: "1.5px", background: f.badgeColor + "12", padding: "3px 10px", borderRadius: 20, marginBottom: 12 }}>{f.badge} 전용</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>{f.title}</h3>
          <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7, marginBottom: 24, whiteSpace: "pre-line" }}>{f.desc}</p>
          <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "14px 16px", width: "100%", marginBottom: 20, textAlign: "left" }}>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 8 }}>이 기능을 사용하려면</p>
            <p style={{ fontSize: 12, color: "#1a2744", fontWeight: 700 }}>
              {f.plan === "starter" ? "스타터 이상" : "프로"} 플랜이 필요합니다
            </p>
          </div>
          <button onClick={() => router.push("/dashboard/pricing")}
            style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13,
              background: f.plan === "pro" ? "linear-gradient(135deg,#c9920a,#e8960a)" : "linear-gradient(135deg,#1a2744,#2d4270)",
              color: "#fff", boxShadow: f.plan === "pro" ? "0 4px 16px rgba(201,146,10,0.3)" : "0 4px 16px rgba(26,39,68,0.25)" }}>
            플랜 업그레이드 →
          </button>
        </div>
      </div>
    );

    // 기능별 실제 컨텐츠
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <button onClick={() => setActiveFeature(null)}
          style={{ fontSize: 11, color: "#8a8a9a", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0, fontWeight: 600, textAlign: "left" }}>
          ← 돌아가기
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>{f.icon}</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a2744" }}>{f.title}</h3>
            <span style={{ fontSize: 10, fontWeight: 800, color: f.badgeColor, letterSpacing: "1px" }}>{f.badge}</span>
          </div>
        </div>
        {f.id === "roi" && <ROICalculator tenants={tenants} />}
        {f.id === "vacancy_loss" && <VacancyLoss tenants={tenants} />}
        {f.id === "lease_check" && <LeaseCheck tenants={tenants} />}
        {f.id === "map" && <MapSearch />}
        {f.id === "ai_report" && <AIReport tenants={tenants} />}
        {f.id === "kakao_alert" && <KakaoAlert tenants={tenants} />}
      </div>
    );
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{ fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
    <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: "1fr 320px", minHeight: "100%" }}>

      {/* ══ LEFT MAIN ══ */}
      <div style={{ padding: "24px 20px 24px 28px", borderRight: "1px solid #ebe9e3", minHeight: "100vh" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>OVERVIEW</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-.5px" }}>대시보드</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>{year}년 {month}월</span>
            <button onClick={() => router.push("/dashboard/properties")}
              style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "#1a2744", color: "#fff", border: "none", cursor: "pointer" }}>
              + 물건 추가
            </button>
          </div>
        </div>

        {/* 이용 흐름 스텝 배너 — 물건 0개일 때만 표시 */}
        {tenants.length === 0 && (
          <div style={{ background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(15,165,115,0.04))", border: "1px solid #e0ede8", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", marginBottom: 14, letterSpacing: "0.5px" }}>🚀 시작하기 — 4단계로 임대 관리를 완성하세요</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {[
                { step: 1, icon: "🏠", label: "부동산 등록", desc: "주거·상가·토지 유형별 물건 등록", page: "properties", done: false },
                { step: 2, icon: "👤", label: "임차인 연결", desc: "세입자 정보·계약기간 입력", page: "tenants", done: false },
                { step: 3, icon: "💰", label: "수금 관리",   desc: "월세 납부 현황 추적·미납 알림", page: "payments", done: false },
                { step: 4, icon: "📊", label: "세금 시뮬",   desc: "예상 세금·순수익 사전 파악",   page: "tax",        done: false },
              ].map(({ step, icon, label, desc, page }) => (
                <div key={step} onClick={() => router.push("/dashboard/" + page)}
                  style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", border: "1px solid #ebe9e3", transition: "all .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1a2744"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,39,68,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ebe9e3"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: "#1a2744", color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{step}</span>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#1a2744", marginBottom: 3 }}>{label}</p>
                  <p style={{ fontSize: 10, color: "#8a8a9a", lineHeight: 1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI 4칸 */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { l: "이번 달 수입", v: totalRent.toLocaleString() + "만", sub: "전 물건 합산", a: "#0fa573", p: "payments" },
            { l: "총 보증금",   v: (totalDep/10000).toFixed(1) + "억", sub: `물건 ${tenants.length}개`, a: "#1a2744", p: "properties" },
            { l: "미납",       v: unpaid + "건",   sub: unpaid > 0 ? "즉시 확인" : "모두 정상", a: unpaid > 0 ? "#e8445a" : "#0fa573", p: "payments" },
            { l: "만료 임박",  v: expiring + "건", sub: "60일 이내", a: "#e8960a", p: "tenants" },
          ].map((k) => (
            <div key={k.l} onClick={() => router.push("/dashboard/" + k.p)}
              style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "16px 18px", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,39,68,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
              <p style={{ fontSize: 11, color: "#a0a0b0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{k.l}</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-.5px", lineHeight: 1 }}>{k.v}</p>
              <p style={{ fontSize: 12, color: k.a, fontWeight: 700, marginTop: 6 }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* 차트 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 10, color: "#a0a0b0", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>TREND</p>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>월별 수입 추이</h3>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[["#1a2744","수입"],["#0fa573","순수익"]].map(([c,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />
                  <span style={{ fontSize: 11, color: "#a0a0b0", fontWeight: 600 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={netData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {[["ig","#1a2744"],["ng","#0fa573"]].map(([id,c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f3f0" vertical={false} />
              <XAxis dataKey="m" tick={{ fill: "#a0a0b0", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#a0a0b0", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="수입"   stroke="#1a2744" strokeWidth={2} fill="url(#ig)" dot={false} />
              <Area type="monotone" dataKey="net"    name="순수익" stroke="#0fa573" strokeWidth={2} fill="url(#ng)" dot={{ fill: "#0fa573", r: 2.5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 물건 테이블 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 0", borderBottom: "1px solid #f0efe9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>물건 목록</h3>
              <span onClick={() => router.push("/dashboard/properties")}
                style={{ fontSize: 11, color: "#8a8a9a", cursor: "pointer", fontWeight: 600 }}>전체 보기 →</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {FILTERS.map((f) => (
                <button key={f} onClick={() => { setFilter(f); setSelected(null); }}
                  style={{ padding: "5px 12px", borderRadius: "8px 8px 0 0", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
                    background: filter === f ? "#1a2744" : "transparent",
                    color: filter === f ? "#fff" : "#8a8a9a", transition: "all .15s" }}>
                  {f}{f === "전체" ? ` (${tenants.length})` : ""}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 70px 60px 70px 60px", padding: "8px 18px", background: "#faf9f6", borderBottom: "1px solid #f0efe9" }}>
            {["유형","주소 · 세입자","월세","보증금","잔여일","상태"].map((h) => (
              <span key={h} style={{ fontSize: 10, color: "#a0a0b0", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0
            ? <EmptyState icon="🏠" title="해당 물건이 없습니다" desc="다른 필터를 선택해보세요" />
            : filtered.map((t) => {
                const dl = daysLeft(t.end);
                const isSel = selected === t.id;
                return (
                  <div key={t.id} onClick={() => setSelected(isSel ? null : t.id)}
                    style={{ display: "grid", gridTemplateColumns: "80px 1fr 70px 60px 70px 60px",
                      padding: "11px 18px", borderBottom: "1px solid #f4f3f0", cursor: "pointer",
                      background: isSel ? "rgba(26,39,68,0.03)" : "transparent",
                      borderLeft: isSel ? "2.5px solid #1a2744" : "2.5px solid transparent", transition: "all .1s" }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#faf9f6"; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800,
                        color: t.pType === "상가" ? "#e8960a" : t.pType === "토지" ? "#0d9488" : "#1a2744",
                        background: t.pType === "상가" ? "rgba(232,150,10,0.1)" : t.pType === "토지" ? "rgba(13,148,136,0.1)" : "rgba(26,39,68,0.07)",
                        padding: "3px 7px", borderRadius: 5 }}>{t.sub || t.pType}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", lineHeight: 1.3 }}>{t.addr}</p>
                      <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 2 }}>{t.name}</p>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", alignSelf: "center" }}>{t.rent}만</p>
                    <p style={{ fontSize: 12, color: "#8a8a9a", alignSelf: "center" }}>{t.dep ? Math.round(t.dep/100) + "백" : "-"}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: dl <= 60 ? "#e8445a" : dl <= 90 ? "#e8960a" : "#8a8a9a", alignSelf: "center" }}>D-{dl}</p>
                    <div style={{ alignSelf: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 800,
                        color: ST[t.status]?.c || "#8a8a9a",
                        background: ST[t.status]?.bg || "#f0efe9",
                        padding: "3px 8px", borderRadius: 5, whiteSpace: "nowrap" }}>{t.status}</span>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div style={{ padding: "24px 20px", background: "#fff", display: "flex", flexDirection: "column", minHeight: isMobile ? "unset" : "100vh", overflowY: "auto", borderTop: isMobile ? "1px solid #ebe9e3" : "none" }}>

        {activeFeature ? renderFeaturePanel(activeFeature) : sel ? (
          /* 물건 선택 시 상세 */
          <>
            <button onClick={() => setSelected(null)}
              style={{ fontSize: 11, color: "#8a8a9a", background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0, fontWeight: 600, textAlign: "left" }}>
              ← 목록으로
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(26,39,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#1a2744" }}>
                {sel.name?.[0]}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#1a2744" }}>{sel.name}</p>
                <p style={{ fontSize: 11, color: "#8a8a9a" }}>{sel.addr}</p>
              </div>
            </div>
            <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
              {[
                ["월세", sel.rent + "만원", "#0fa573"],
                ["보증금", (sel.dep || 0).toLocaleString() + "만원", undefined],
                ["만료일", sel.end || "-", daysLeft(sel.end) <= 90 ? "#e8960a" : undefined],
                ["잔여일", "D-" + daysLeft(sel.end), daysLeft(sel.end) <= 60 ? "#e8445a" : "#0fa573"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #ebe9e3" }}>
                  <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: color || "#1a2744" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["💰","수금 현황","payments","rgba(26,39,68,0.06)","#1a2744"],
                ["📨","내용증명 발행","certified","rgba(232,68,90,0.07)","#e8445a"],
                ["📄","계약서 보기","contracts","rgba(15,165,115,0.07)","#0fa573"]
              ].map(([icon, label, page, bg, color]) => (
                <button key={page} onClick={() => router.push("/dashboard/" + page)}
                  style={{ padding: "10px", borderRadius: 10, background: bg, border: "none", color, fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left", paddingLeft: 14 }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* 기본 상태 */
          <>
            {/* 이달의 요약 — 임팩트 카드 */}
            <div style={{ marginBottom: 22, background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 16, padding: "20px" }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>이달의 요약</p>
              {tenants.length === 0 ? (
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.7 }}>아직 등록된 물건이 없어요.{"\n"}물건을 추가해 시작하세요 👇</p>
              ) : (
                <>
                  <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: "-.5px" }}>월 {totalRent.toLocaleString()}만원</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
                    물건 {tenants.length}개 운영 중
                    {unpaid > 0 && <span style={{ color: "#ff8a95" }}> · ⚠️ {unpaid}건 미납</span>}
                    {expiring > 0 && <span style={{ color: "#ffd166" }}> · 📅 {expiring}건 만료 임박</span>}
                    {unpaid === 0 && expiring === 0 && <span style={{ color: "#7eeec9" }}> · 수금 정상 ✓</span>}
                  </p>
                </>
              )}
            </div>

            {/* 알림 */}
            {alerts.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#a0a0b0", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>알림</p>
                {alerts.map((a, i) => (
                  <div key={i} onClick={() => router.push("/dashboard/" + a.page)}
                    style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 10, marginBottom: 7, cursor: "pointer",
                      background: a.type === "danger" ? "rgba(232,68,90,0.05)" : "rgba(232,150,10,0.05)",
                      border: `1px solid ${a.type === "danger" ? "rgba(232,68,90,0.15)" : "rgba(232,150,10,0.15)"}` }}>
                    <span style={{ fontSize: 16 }}>{a.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{a.text}</p>
                      <p style={{ fontSize: 12, color: "#8a8a9a", marginTop: 2 }}>{a.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 프리미엄 기능 섹션 — 2열 카드 */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#a0a0b0", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 3 }}>프리미엄 기능</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744" }}>더 스마트하게 관리하세요</p>
                </div>
                <span onClick={() => router.push("/dashboard/pricing")}
                  style={{ fontSize: 11, color: "#5b4fcf", cursor: "pointer", fontWeight: 800, background: "rgba(91,79,207,0.08)", padding: "5px 12px", borderRadius: 8 }}>
                  플랜 보기 →
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {PREMIUM_FEATURES.map((f) => {
                  const locked = PLAN_ORDER[f.plan] > planLevel;
                  const isPro = f.plan === "pro";
                  return (
                    <div key={f.id} onClick={() => setActiveFeature(f)}
                      style={{
                        borderRadius: 14, cursor: "pointer", overflow: "hidden",
                        border: locked ? "1px solid #ebe9e3" : `1.5px solid ${f.badgeColor}30`,
                        background: locked ? "#faf9f6" : isPro
                          ? "linear-gradient(135deg,rgba(201,146,10,0.07),rgba(232,150,10,0.02))"
                          : "linear-gradient(135deg,rgba(26,39,68,0.05),rgba(15,165,115,0.03))",
                        transition: "all .2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 20px ${f.badgeColor}20`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>

                      {/* 상단: 아이콘 + 배지 */}
                      <div style={{ padding: "12px 12px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 26 }}>{locked ? "🔒" : f.icon}</div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                          {f.tag && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: f.tagColor, background: f.tagColor + "18", padding: "2px 7px", borderRadius: 4 }}>{f.tag}</span>
                          )}
                          <span style={{ fontSize: 9, fontWeight: 800,
                            color: locked ? "#b0b0c0" : f.badgeColor,
                            background: locked ? "#eeeef0" : f.badgeColor + "18",
                            padding: "2px 7px", borderRadius: 5, letterSpacing: "0.3px" }}>
                            {f.badge}
                          </span>
                        </div>
                      </div>

                      {/* 타이틀 + 설명 */}
                      <div style={{ padding: "8px 12px 10px" }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: locked ? "#b0b0c0" : "#1a2744", marginBottom: 4, lineHeight: 1.3 }}>{f.title}</p>
                        <p style={{ fontSize: 11, color: locked ? "#c8c8d0" : "#8a8a9a", lineHeight: 1.5 }}>
                          {f.desc.replace(/\n/g, " ")}
                        </p>
                      </div>

                      {/* 하단 CTA */}
                      <div style={{ padding: "8px 12px 11px", borderTop: `1px solid ${locked ? "#f0efe9" : f.badgeColor + "15"}` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: locked ? "#c0c0cc" : f.badgeColor }}>
                          {locked ? "업그레이드 필요 →" : "바로 사용하기 →"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 업그레이드 유도 배너 */}
              {planLevel < 3 && (
                <div onClick={() => router.push("/dashboard/pricing")}
                  style={{ marginTop: 14, borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                    background: "linear-gradient(135deg,#1a2744,#2d4270)",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 3 }}>기능 잠금 해제하기</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>스타터+부터 월 19,900원</p>
                  </div>
                  <span style={{ fontSize: 22, color: "rgba(255,255,255,0.8)" }}>→</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 기능별 컴포넌트
// ──────────────────────────────────────────────

function ROICalculator({ tenants }) {
  const [price, setPrice] = useState(50000);
  const [rent, setRent] = useState(300);
  const [dep, setDep]   = useState(5000);
  const [loan, setLoan] = useState(30000);
  const [rate, setRate] = useState(4.5);

  const annualRent   = rent * 12;
  const loanInterest = (loan * rate) / 100;
  const acquisitionTax = price * 0.046;    // 취득세 4.6%
  const healthInsurance = annualRent * 0.034; // 건보료 추정
  const incomeTax    = Math.max(0, (annualRent - 2000) * 0.15); // 종소세 단순 추정
  const netIncome    = annualRent - loanInterest - healthInsurance - incomeTax;
  const roi          = ((netIncome / (price + acquisitionTax - dep - loan)) * 100).toFixed(2);
  const grossRoi     = ((annualRent / price) * 100).toFixed(2);

  const Row = ({ label, value, color, bold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0efe9" }}>
      <span style={{ fontSize: 11, color: "#8a8a9a" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: bold ? 800 : 600, color: color || "#1a2744" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 12 }}>
      {[
        ["매매가 (만원)", price, setPrice, 10000, 200000],
        ["월세 (만원)",   rent,  setRent,  50,    1000],
        ["보증금 (만원)", dep,   setDep,   0,     50000],
        ["대출 (만원)",   loan,  setLoan,  0,     150000],
      ].map(([label, val, setter, min, max]) => (
        <div key={label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>{val.toLocaleString()}</span>
          </div>
          <input type="range" min={min} max={max} step={100} value={val}
            onChange={(e) => setter(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#1a2744" }} />
        </div>
      ))}
      <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
        <Row label="연 임대수익"    value={annualRent.toLocaleString() + "만원"} />
        <Row label="대출이자"       value={"-" + Math.round(loanInterest).toLocaleString() + "만원"} color="#e8445a" />
        <Row label="종합소득세(추정)" value={"-" + Math.round(incomeTax).toLocaleString() + "만원"} color="#e8445a" />
        <Row label="건강보험료(추정)" value={"-" + Math.round(healthInsurance).toLocaleString() + "만원"} color="#e8445a" />
        <Row label="표면 수익률"    value={grossRoi + "%"} color="#8a8a9a" />
        <Row label="실질 수익률"    value={roi + "%"} color={Number(roi) >= 4 ? "#0fa573" : "#e8960a"} bold />
      </div>
      <p style={{ fontSize: 10, color: "#a0a0b0", lineHeight: 1.6 }}>※ 세금은 단순 추정치입니다. 정확한 금액은 세무사 확인 필요.</p>
    </div>
  );
}

function VacancyLoss({ tenants }) {
  const [months, setMonths] = useState(3);
  const avgRent = tenants.length > 0 ? Math.round(tenants.reduce((s, t) => s + (t.rent || 0), 0) / tenants.length) : 200;
  const loss = avgRent * months;
  const opportunityCost = Math.round(loss * 0.05);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
        <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 4 }}>평균 월세 (등록 물건 기준)</p>
        <p style={{ fontSize: 20, fontWeight: 900, color: "#1a2744" }}>{avgRent}만원/월</p>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 600 }}>공실 기간</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>{months}개월</span>
        </div>
        <input type="range" min={1} max={24} value={months} onChange={(e) => setMonths(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#e8445a" }} />
      </div>
      <div style={{ background: "rgba(232,68,90,0.05)", border: "1px solid rgba(232,68,90,0.15)", borderRadius: 10, padding: "14px 16px" }}>
        <p style={{ fontSize: 11, color: "#e8445a", fontWeight: 700, marginBottom: 8 }}>예상 손실</p>
        <p style={{ fontSize: 24, fontWeight: 900, color: "#e8445a", marginBottom: 4 }}>{loss.toLocaleString()}만원</p>
        <p style={{ fontSize: 11, color: "#8a8a9a" }}>기회비용 포함 시 약 {(loss + opportunityCost).toLocaleString()}만원</p>
      </div>
      <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
        <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 6 }}>공실 단축 전략</p>
        {["직방·다방 동시 등록으로 노출 극대화","보증금 협상으로 임차인 유치 속도 향상","인근 시세 대비 5% 낮춰 빠른 계약 우선"].map((tip, i) => (
          <p key={i} style={{ fontSize: 11, color: "#1a2744", lineHeight: 1.7 }}>• {tip}</p>
        ))}
      </div>
    </div>
  );
}

function LeaseCheck({ tenants }) {
  const checks = [
    { q: "계약갱신청구권 사용 여부", yes: "세입자가 청구권 사용 → 2년 연장 의무", no: "미사용 → 재계약 자유롭게 협의 가능" },
    { q: "전월세 상한제 적용 여부", yes: "5% 이내 인상만 가능", no: "상한 없이 시세 반영 가능" },
    { q: "전세 → 월세 전환 시 전환율", yes: "법정 전환율 2.5% 이하 적용", no: "임의 전환율 적용 불가" },
  ];
  const [answers, setAnswers] = useState({});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.6 }}>임대차 3법 적용 여부를 확인하고 법적 리스크를 사전에 파악하세요.</p>
      {checks.map((c, i) => (
        <div key={i} style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", marginBottom: 10 }}>{c.q}</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {["해당","미해당"].map((label) => (
              <button key={label} onClick={() => setAnswers(a => ({ ...a, [i]: label }))}
                style={{ flex: 1, padding: "7px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
                  background: answers[i] === label ? "#1a2744" : "#ebe9e3",
                  color: answers[i] === label ? "#fff" : "#8a8a9a" }}>{label}</button>
            ))}
          </div>
          {answers[i] && (
            <p style={{ fontSize: 11, color: answers[i] === "해당" ? "#e8445a" : "#0fa573", fontWeight: 600, lineHeight: 1.5 }}>
              → {answers[i] === "해당" ? c.yes : c.no}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function MapSearch() {
  const [query, setQuery] = useState("");
  const searches = ["서울 강남구 아파트", "부산 해운대구 상가", "인천 연수구 오피스텔"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.6 }}>네이버 부동산에서 주변 매물을 조회합니다.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="지역 또는 단지명 검색"
          style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid #ebe9e3", fontSize: 12, outline: "none", color: "#1a2744" }} />
        <button
          onClick={() => window.open(`https://m.land.naver.com/search/result/${encodeURIComponent(query || "서울 강남구")}`, "_blank")}
          style={{ padding: "9px 14px", borderRadius: 10, background: "#03C75A", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          검색
        </button>
      </div>
      <p style={{ fontSize: 10, color: "#a0a0b0", fontWeight: 700 }}>빠른 검색</p>
      {searches.map((s) => (
        <div key={s} onClick={() => window.open(`https://m.land.naver.com/search/result/${encodeURIComponent(s)}`, "_blank")}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "#f8f7f4", cursor: "pointer", border: "1px solid #ebe9e3" }}>
          <span style={{ fontSize: 12, color: "#1a2744", fontWeight: 600 }}>{s}</span>
          <span style={{ fontSize: 12, color: "#8a8a9a" }}>→</span>
        </div>
      ))}
      <p style={{ fontSize: 10, color: "#a0a0b0", lineHeight: 1.6 }}>※ 네이버 부동산으로 연결됩니다.</p>
    </div>
  );
}

function AIReport({ tenants }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport]   = useState(null);
  const [addr, setAddr]       = useState(tenants[0]?.addr || "");

  const generate = async () => {
    if (!addr) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `한국 부동산 전문가로서 다음 주소의 입지를 분석해주세요: "${addr}"

다음 항목을 간결하게 분석해주세요 (각 항목 2-3문장):
1. 상권 분석 (유동인구, 주변 상권)
2. 교통 접근성
3. 학군 (초중고 수준)
4. 임대 수요 전망
5. 투자 매력도 (★ 1-5점)

JSON 형식으로만 응답하세요:
{"상권":"...","교통":"...","학군":"...","수요":"...","매력도":"★★★★","한줄요약":"..."}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      setReport(JSON.parse(clean));
    } catch {
      setReport({ 상권: "분석 중 오류가 발생했습니다.", 교통: "", 학군: "", 수요: "", 매력도: "N/A", 한줄요약: "다시 시도해주세요." });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.6 }}>AI가 입력한 주소의 상권·학군·교통을 분석합니다.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={addr} onChange={(e) => setAddr(e.target.value)}
          placeholder="분석할 주소 입력"
          style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid #ebe9e3", fontSize: 12, outline: "none", color: "#1a2744" }} />
        <button onClick={generate} disabled={loading || !addr}
          style={{ padding: "9px 14px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: loading ? 0.6 : 1 }}>
          {loading ? "분석중..." : "분석"}
        </button>
      </div>
      {report && (
        <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#1a2744" }}>{addr} 입지 분석</p>
            <span style={{ fontSize: 16 }}>{report.매력도}</span>
          </div>
          {[["🏪 상권", report.상권], ["🚇 교통", report.교통], ["🏫 학군", report.학군], ["📈 수요", report.수요]].map(([label, val]) => val ? (
            <div key={label} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#1a2744", marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 11, color: "#6a6a7a", lineHeight: 1.6 }}>{val}</p>
            </div>
          ) : null)}
          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(26,39,68,0.05)", borderRadius: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744" }}>💡 {report.한줄요약}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function KakaoAlert({ tenants }) {
  const unpaid = tenants.filter((t) => t.status === "미납");
  const [sent, setSent] = useState({});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.6 }}>미납 세입자에게 카카오톡 알림을 발송합니다.</p>
      {unpaid.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>미납 세입자가 없습니다</p>
        </div>
      ) : unpaid.map((t) => (
        <div key={t.id} style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{t.name}</p>
              <p style={{ fontSize: 11, color: "#8a8a9a" }}>{t.rent}만원 미납</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#e8445a", background: "rgba(232,68,90,0.1)", padding: "3px 8px", borderRadius: 6 }}>미납</span>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "8px 10px", marginBottom: 8, border: "1px solid #ebe9e3" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", lineHeight: 1.6 }}>
              [{t.name}]님, {new Date().getMonth()+1}월 월세 {t.rent}만원이 미납되어 있습니다. 빠른 납부 부탁드립니다.
            </p>
          </div>
          <button onClick={() => setSent(s => ({ ...s, [t.id]: true }))}
            style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: sent[t.id] ? "#f0efe9" : "#FEE500",
              color: sent[t.id] ? "#8a8a9a" : "#000" }}>
            {sent[t.id] ? "✓ 발송 완료 (시뮬레이션)" : "📱 카카오톡 발송"}
          </button>
        </div>
      ))}
      <p style={{ fontSize: 10, color: "#a0a0b0", lineHeight: 1.6 }}>※ 실제 발송은 카카오 알림톡 API 연동 후 가능합니다. 현재는 시뮬레이션 모드입니다.</p>
    </div>
  );
}
