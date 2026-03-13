"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, SectionLabel, CustomTooltip, EmptyState } from "../../components/shared";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { C, STATUS_MAP, REVENUE, daysLeft } from "../../lib/constants";
import { useApp } from "../../context/AppContext";

const ST = {
  "정상":    { c: "#0fa573", bg: "rgba(15,165,115,0.08)" },
  "미납":    { c: "#e8445a", bg: "rgba(232,68,90,0.08)" },
  "만료임박":{ c: "#e8960a", bg: "rgba(232,150,10,0.08)" },
};

const FILTERS = ["전체", "주거", "상가", "만료임박", "미납"];

export default function DashboardPage() {
  const router = useRouter();
  const { tenants, loading } = useApp();
  const [filter, setFilter] = useState("전체");
  const [selected, setSelected] = useState(null);

  const totalRent  = tenants.reduce((s, t) => s + (t.rent || 0), 0);
  const totalDep   = tenants.reduce((s, t) => s + (t.dep  || 0), 0);
  const unpaid     = tenants.filter((t) => t.status === "미납").length;
  const expiring   = tenants.filter((t) => daysLeft(t.end) <= 60).length;
  const netData    = REVENUE.map((m) => ({ ...m, net: m.income - m.expense }));

  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const filtered = tenants.filter((t) => {
    if (filter === "전체")   return true;
    if (filter === "주거")   return t.pType === "주거";
    if (filter === "상가")   return t.pType === "상가";
    if (filter === "미납")   return t.status === "미납";
    if (filter === "만료임박") return daysLeft(t.end) <= 90;
    return true;
  });

  const sel = selected ? tenants.find((t) => t.id === selected) : null;

  const alerts = [
    ...tenants.filter((t) => t.status === "미납").map((t) => ({
      type: "danger", icon: "⚠️",
      text: t.name + "님 미납", sub: t.rent + "만원", page: "payments"
    })),
    ...tenants.filter((t) => daysLeft(t.end) <= 90 && t.status !== "미납").map((t) => ({
      type: "warn", icon: "📅",
      text: t.name + "님 만료 D-" + daysLeft(t.end), sub: t.addr, page: "tenants"
    })),
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <p style={{ color: "#8a8a9a", fontSize: 14 }}>불러오는 중...</p>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 0, minHeight: "100%", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>

      {/* ══ LEFT MAIN ══ */}
      <div style={{ padding: "24px 20px 24px 28px", borderRight: "1px solid #ebe9e3", minHeight: "100vh" }}>

        {/* 상단 헤더바 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>OVERVIEW</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2744", letterSpacing: "-.5px" }}>대시보드</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>{year}년 {month}월</span>
            <button
              onClick={() => router.push("/dashboard/properties")}
              style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "#1a2744", color: "#fff", border: "none", cursor: "pointer" }}
            >+ 물건 추가</button>
          </div>
        </div>

        {/* KPI 4칸 — 토스증권 상단 지표바 스타일 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { l: "이번 달 수입", v: totalRent.toLocaleString() + "만", sub: "전 물건 합산", a: "#0fa573", p: "payments" },
            { l: "총 보증금",   v: (totalDep/10000).toFixed(1) + "억", sub: `물건 ${tenants.length}개`, a: "#1a2744", p: "properties" },
            { l: "미납",       v: unpaid + "건",   sub: unpaid > 0 ? "즉시 확인" : "모두 정상", a: unpaid > 0 ? "#e8445a" : "#0fa573", p: "payments" },
            { l: "만료 임박",  v: expiring + "건", sub: "60일 이내", a: "#e8960a", p: "tenants" },
          ].map((k) => (
            <div key={k.l}
              onClick={() => router.push("/dashboard/" + k.p)}
              style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "box-shadow .15s" }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,39,68,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
            >
              <p style={{ fontSize: 10, color: "#a0a0b0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{k.l}</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", letterSpacing: "-.5px", lineHeight: 1 }}>{k.v}</p>
              <p style={{ fontSize: 11, color: k.a, fontWeight: 700, marginTop: 6 }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* 수입 차트 */}
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

        {/* 물건 목록 — 토스증권 테이블 스타일 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, overflow: "hidden" }}>
          {/* 테이블 헤더 + 필터 탭 */}
          <div style={{ padding: "14px 18px 0", borderBottom: "1px solid #f0efe9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>물건 목록</h3>
              <span onClick={() => router.push("/dashboard/properties")}
                style={{ fontSize: 11, color: "#8a8a9a", cursor: "pointer", fontWeight: 600 }}>전체 보기 →</span>
            </div>
            {/* 필터 탭 */}
            <div style={{ display: "flex", gap: 4, marginBottom: 0 }}>
              {FILTERS.map((f) => (
                <button key={f} onClick={() => { setFilter(f); setSelected(null); }}
                  style={{
                    padding: "5px 12px", borderRadius: "8px 8px 0 0",
                    fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
                    background: filter === f ? "#1a2744" : "transparent",
                    color: filter === f ? "#fff" : "#8a8a9a",
                    transition: "all .15s"
                  }}
                >{f} {f !== "전체" ? "" : `(${tenants.length})`}</button>
              ))}
            </div>
          </div>

          {/* 컬럼 헤더 */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 70px 60px 70px 60px", padding: "8px 18px", background: "#faf9f6", borderBottom: "1px solid #f0efe9" }}>
            {["유형","주소 · 세입자","월세","보증금","잔여일","상태"].map((h) => (
              <span key={h} style={{ fontSize: 10, color: "#a0a0b0", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</span>
            ))}
          </div>

          {/* 데이터 로우 */}
          {filtered.length === 0 ? (
            <EmptyState icon="🏠" title="해당 물건이 없습니다" desc="다른 필터를 선택해보세요" />
          ) : (
            filtered.map((t) => {
              const dl  = daysLeft(t.end);
              const isSel = selected === t.id;
              return (
                <div key={t.id}
                  onClick={() => setSelected(isSel ? null : t.id)}
                  style={{
                    display: "grid", gridTemplateColumns: "80px 1fr 70px 60px 70px 60px",
                    padding: "11px 18px", borderBottom: "1px solid #f4f3f0",
                    cursor: "pointer", transition: "background .1s",
                    background: isSel ? "rgba(26,39,68,0.03)" : "transparent",
                    borderLeft: isSel ? "2.5px solid #1a2744" : "2.5px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#faf9f6"; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      color: t.pType === "상가" ? "#e8960a" : "#1a2744",
                      background: t.pType === "상가" ? "rgba(232,150,10,0.1)" : "rgba(26,39,68,0.07)",
                      padding: "3px 7px", borderRadius: 5
                    }}>{t.sub || t.pType}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", lineHeight: 1.3 }}>{t.addr}</p>
                    <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 2 }}>{t.name}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", alignSelf: "center" }}>{t.rent}만</p>
                  <p style={{ fontSize: 12, color: "#8a8a9a", alignSelf: "center" }}>{t.dep ? (t.dep/100).toFixed(0) + "백" : "-"}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: dl <= 60 ? "#e8445a" : dl <= 90 ? "#e8960a" : "#8a8a9a", alignSelf: "center" }}>D-{dl}</p>
                  <div style={{ alignSelf: "center" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      color: ST[t.status]?.c || "#8a8a9a",
                      background: ST[t.status]?.bg || "#f0efe9",
                      padding: "3px 8px", borderRadius: 5, whiteSpace: "nowrap"
                    }}>{t.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ══ RIGHT PANEL — 토스증권 우측 상세 패널 스타일 ══ */}
      <div style={{ padding: "24px 20px", background: "#fff", display: "flex", flexDirection: "column", gap: 16, minHeight: "100vh", borderLeft: "1px solid #ebe9e3" }}>

        {sel ? (
          /* 물건 선택 시 — 상세 정보 */
          <>
            <div>
              <button onClick={() => setSelected(null)}
                style={{ fontSize: 11, color: "#8a8a9a", background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0, fontWeight: 600 }}>
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
              <span style={{ fontSize: 10, fontWeight: 800, color: ST[sel.status]?.c || "#8a8a9a", background: ST[sel.status]?.bg || "#f0efe9", padding: "4px 10px", borderRadius: 20 }}>{sel.status}</span>
            </div>

            <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "14px 16px" }}>
              {[
                ["월세", sel.rent + "만원", "#0fa573"],
                ["보증금", (sel.dep || 0).toLocaleString() + "만원", undefined],
                ["만료일", sel.end || "-", daysLeft(sel.end) <= 90 ? "#e8960a" : undefined],
                ["잔여일", "D-" + daysLeft(sel.end), daysLeft(sel.end) <= 60 ? "#e8445a" : "#0fa573"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #ebe9e3" }}>
                  <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: color || "#1a2744" }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => router.push("/dashboard/payments")}
                style={{ padding: "10px", borderRadius: 10, background: "rgba(26,39,68,0.06)", border: "none", color: "#1a2744", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                💰 수금 현황 보기
              </button>
              <button onClick={() => router.push("/dashboard/certified")}
                style={{ padding: "10px", borderRadius: 10, background: "rgba(232,68,90,0.07)", border: "none", color: "#e8445a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                📨 내용증명 발행
              </button>
              <button onClick={() => router.push("/dashboard/contracts")}
                style={{ padding: "10px", borderRadius: 10, background: "rgba(15,165,115,0.07)", border: "none", color: "#0fa573", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                📄 계약서 보기
              </button>
            </div>
          </>
        ) : (
          /* 기본 상태 — 요약 + 알림 */
          <>
            {/* 한 줄 요약 */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#a0a0b0", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>한 줄 요약</p>
              <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", lineHeight: 1.7 }}>
                  {tenants.length === 0
                    ? "등록된 물건이 없습니다."
                    : `총 ${tenants.length}개 물건에서 월 ${totalRent.toLocaleString()}만원 수입 중.${unpaid > 0 ? ` ⚠️ ${unpaid}건 미납 확인 필요.` : " 모든 수금 정상."}${expiring > 0 ? ` 📅 ${expiring}건 만료 임박.` : ""}`
                  }
                </p>
              </div>
            </div>

            {/* 수입 구성 바 */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#a0a0b0", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>유형별 수입</p>
              {[
                { label: "주거", value: tenants.filter(t=>t.pType==="주거").reduce((s,t)=>s+(t.rent||0),0), color: "#1a2744" },
                { label: "상가", value: tenants.filter(t=>t.pType==="상가").reduce((s,t)=>s+(t.rent||0),0), color: "#e8960a" },
              ].map((item) => {
                const pct = totalRent > 0 ? Math.round(item.value / totalRent * 100) : 0;
                return (
                  <div key={item.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: 2, background: item.color }} />
                        <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{item.value}만원</span>
                    </div>
                    <div style={{ height: 5, background: "#f0efe9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: item.color, borderRadius: 3, transition: "width .4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 알림 */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#a0a0b0", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>알림</p>
              {alerts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>✅</div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", marginBottom: 3 }}>이상 없음</p>
                  <p style={{ fontSize: 11, color: "#a0a0b0" }}>모든 물건이 정상입니다</p>
                </div>
              ) : alerts.map((a, i) => (
                <div key={i}
                  onClick={() => router.push("/dashboard/" + a.page)}
                  style={{
                    display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 7,
                    background: a.type === "danger" ? "rgba(232,68,90,0.05)" : "rgba(232,150,10,0.05)",
                    border: `1px solid ${a.type === "danger" ? "rgba(232,68,90,0.15)" : "rgba(232,150,10,0.15)"}`,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{a.icon}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>{a.text}</p>
                    <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 1 }}>{a.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 빠른 이동 */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#a0a0b0", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>바로가기</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  ["💰","수금",    "payments"],
                  ["📄","계약서",  "contracts"],
                  ["📊","리포트",  "reports"],
                  ["🧾","세금",    "tax"],
                  ["📨","내용증명","certified"],
                  ["📅","캘린더",  "calendar"],
                ].map(([icon, label, page]) => (
                  <button key={page}
                    onClick={() => router.push("/dashboard/" + page)}
                    style={{
                      padding: "10px 8px", borderRadius: 10, border: "1px solid #ebe9e3",
                      background: "#faf9f6", color: "#1a2744", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      transition: "background .1s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f0efe9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#faf9f6"}
                  >
                    <span style={{ fontSize: 14 }}>{icon}</span>{label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
