"use client";
import { useRouter } from "next/navigation";
import { Badge, SectionLabel, CustomTooltip, EmptyState } from "../../components/shared";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { C, STATUS_MAP, REVENUE, daysLeft } from "../../lib/constants";
import { useApp } from "../../context/AppContext";

const STATUS_MAP_LIGHT = {
  "정상":    { c: "#0fa573", bg: "rgba(15,165,115,0.1)" },
  "미납":    { c: "#e8445a", bg: "rgba(232,68,90,0.1)" },
  "만료임박":{ c: "#e8960a", bg: "rgba(232,150,10,0.1)" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { tenants, loading } = useApp();

  const totalRent  = tenants.reduce((s, t) => s + (t.rent || 0), 0);
  const totalDep   = tenants.reduce((s, t) => s + (t.dep  || 0), 0);
  const unpaid     = tenants.filter((t) => t.status === "미납").length;
  const expiring   = tenants.filter((t) => daysLeft(t.end) <= 60).length;
  const netData    = REVENUE.map((m) => ({ ...m, net: m.income - m.expense }));
  const resiIncome = tenants.filter((t) => t.pType === "주거").reduce((s, t) => s + (t.rent || 0), 0);
  const commIncome = tenants.filter((t) => t.pType === "상가").reduce((s, t) => s + (t.rent || 0), 0);
  const pieData = [
    { name: "주거", value: resiIncome, color: "#1a2744" },
    { name: "상가", value: commIncome, color: "#e8960a" },
  ];

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: "#8a8a9a", fontSize: 14 }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  const kpiCards = [
    {
      l: "이번 달 수입", v: totalRent.toLocaleString() + "만원",
      s: "전 물건 합산", a: "#0fa573", icon: "💰", p: "payments",
      accent: "#0fa573"
    },
    {
      l: "총 보증금", v: (totalDep / 10000).toFixed(1) + "억원",
      s: "물건 " + tenants.length + "개", a: "#8a8a9a", icon: "🏦", p: "properties",
      accent: "#1a2744"
    },
    {
      l: "미납 건수", v: unpaid + "건",
      s: unpaid > 0 ? "즉시 확인 필요" : "모두 정상",
      a: unpaid > 0 ? "#e8445a" : "#0fa573", icon: "⚠️", p: "payments",
      accent: unpaid > 0 ? "#e8445a" : "#0fa573"
    },
    {
      l: "만료 임박", v: expiring + "건",
      s: "60일 이내", a: "#e8960a", icon: "📅", p: "tenants",
      accent: "#e8960a"
    },
  ];

  return (
    <div className="page-in page-padding" style={{ maxWidth: 1120 }}>
      {/* 페이지 헤더 */}
      <div className="page-header" style={{ marginBottom: 30, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>OVERVIEW</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a2744", letterSpacing: "-.5px", lineHeight: 1.1 }}>대시보드</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 5 }}>{year}년 {month}월 · 전체 {tenants.length}개 물건</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/properties")}
          style={{
            padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: "#1a2744", color: "#fff", border: "none", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(26,39,68,0.25)"
          }}
        >+ 물건 추가</button>
      </div>

      {/* KPI 카드 4개 */}
      <div className="dash-grid-4 stagger" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {kpiCards.map((k) => (
          <div
            key={k.l}
            onClick={() => router.push("/dashboard/" + k.p)}
            className="hover-lift"
            style={{
              background: "#ffffff", border: "1px solid #ebe9e3",
              borderRadius: 18, padding: "20px 22px", cursor: "pointer",
              boxShadow: "0 2px 12px rgba(26,39,68,0.05)",
              position: "relative", overflow: "hidden"
            }}
          >
            {/* 상단 컬러 스트라이프 */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: k.accent, borderRadius: "18px 18px 0 0", opacity: 0.7 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10, marginTop: 6 }}>{k.l}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.5px", lineHeight: 1 }}>{k.v}</p>
                <p style={{ fontSize: 11, color: k.a, marginTop: 6, fontWeight: 700 }}>{k.s}</p>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: k.accent + "12",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, marginTop: 4
              }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="dash-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14, marginBottom: 16 }}>
        {/* 월별 수입 추이 */}
        <div style={{
          background: "#ffffff", border: "1px solid #ebe9e3",
          borderRadius: 18, padding: "22px 24px",
          boxShadow: "0 2px 12px rgba(26,39,68,0.05)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>TREND</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a2744" }}>월별 수입 추이</h3>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {[{ c: "#1a2744", l: "수입" }, { c: "#0fa573", l: "순수익" }].map((x) => (
                <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                  <span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 600 }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={netData}>
              <defs>
                {[["ig", "#1a2744"], ["ng", "#0fa573"]].map(([id, c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0efe9" vertical={false} />
              <XAxis dataKey="m" tick={{ fill: "#8a8a9a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8a8a9a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="수입"   stroke="#1a2744" strokeWidth={2} fill="url(#ig)" dot={false} />
              <Area type="monotone" dataKey="net"    name="순수익" stroke="#0fa573" strokeWidth={2} fill="url(#ng)" dot={{ fill: "#0fa573", r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 유형별 수입 파이 */}
        <div style={{
          background: "#ffffff", border: "1px solid #ebe9e3",
          borderRadius: 18, padding: "22px",
          boxShadow: "0 2px 12px rgba(26,39,68,0.05)"
        }}>
          <div style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>SPLIT</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a2744", marginBottom: 14 }}>유형별 수입</h3>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <PieChart width={200} height={120}>
              <Pie data={pieData} cx={100} cy={60} innerRadius={36} outerRadius={54} paddingAngle={4} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => v + "만원"} contentStyle={{ background: "#fff", border: "1px solid #e8e6e0", borderRadius: 10, fontSize: 11, boxShadow: "0 4px 16px rgba(26,39,68,0.1)" }} />
            </PieChart>
          </div>
          {pieData.map((d) => (
            <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                <span style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 600 }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{d.value}만원</span>
            </div>
          ))}
        </div>
      </div>

      {/* 물건 목록 + 알림 */}
      <div className="dash-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>
        {/* 물건 목록 테이블 */}
        <div style={{
          background: "#ffffff", border: "1px solid #ebe9e3",
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0 2px 12px rgba(26,39,68,0.05)"
        }}>
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f0efe9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a2744" }}>물건 목록</h3>
            <span
              onClick={() => router.push("/dashboard/properties")}
              style={{ fontSize: 12, color: "#1a2744", fontWeight: 700, cursor: "pointer", opacity: 0.6 }}
            >전체 보기 →</span>
          </div>
          {tenants.length === 0 ? (
            <EmptyState icon="🏠" title="등록된 물건이 없습니다" desc="물건 관리에서 첫 물건을 추가해보세요" />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#faf9f6" }}>
                  {["유형", "주소 · 세입자", "월세", "D-day", "상태"].map((h) => (
                    <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: 10, color: "#a0a0b0", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.slice(0, 5).map((t) => {
                  const dl = daysLeft(t.end);
                  return (
                    <tr key={t.id} className="trow" style={{ borderTop: "1px solid #f4f3f0", cursor: "pointer" }} onClick={() => router.push("/dashboard/properties")}>
                      <td style={{ padding: "11px 18px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800,
                          color: t.pType === "상가" ? "#e8960a" : "#1a2744",
                          background: t.pType === "상가" ? "rgba(232,150,10,0.1)" : "rgba(26,39,68,0.07)",
                          padding: "3px 8px", borderRadius: 6
                        }}>{t.sub}</span>
                      </td>
                      <td style={{ padding: "11px 18px" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>{t.addr}</p>
                        <p style={{ fontSize: 11, color: "#8a8a9a" }}>{t.name}</p>
                      </td>
                      <td style={{ padding: "11px 18px", fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{t.rent}만</td>
                      <td style={{ padding: "11px 18px", fontSize: 12, color: dl <= 60 ? "#e8960a" : "#8a8a9a", fontWeight: 600 }}>D-{dl}</td>
                      <td style={{ padding: "11px 18px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: STATUS_MAP_LIGHT[t.status]?.c || "#8a8a9a",
                          background: STATUS_MAP_LIGHT[t.status]?.bg || "#f0efe9",
                          padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap"
                        }}>{t.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 알림 패널 */}
        <div style={{
          background: "#ffffff", border: "1px solid #ebe9e3",
          borderRadius: 18, padding: "18px 20px",
          boxShadow: "0 2px 12px rgba(26,39,68,0.05)"
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a2744", marginBottom: 14 }}>알림</h3>
          {(() => {
            const alerts = [];
            tenants.filter((t) => t.status === "미납").forEach((t) =>
              alerts.push({ type: "danger", icon: "⚠️", text: t.name + "님 미납", sub: t.rent + "만원 · " + t.addr, p: "payments" })
            );
            tenants.filter((t) => daysLeft(t.end) <= 90 && t.status !== "미납").forEach((t) =>
              alerts.push({ type: "warning", icon: "📅", text: t.name + "님 만료 D-" + daysLeft(t.end), sub: t.addr, p: "tenants" })
            );
            if (alerts.length === 0) return (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.3 }}>✅</div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", marginBottom: 4 }}>알림이 없습니다</p>
                <p style={{ fontSize: 12, color: "#8a8a9a" }}>모든 물건이 정상 상태입니다</p>
              </div>
            );
            return alerts.map((a, i) => {
              const isD = a.type === "danger";
              return (
                <div
                  key={i}
                  onClick={() => router.push("/dashboard/" + a.p)}
                  style={{
                    display: "flex", gap: 10, padding: "11px 13px", borderRadius: 12,
                    border: `1px solid ${isD ? "rgba(232,68,90,0.2)" : "rgba(232,150,10,0.2)"}`,
                    background: isD ? "rgba(232,68,90,0.05)" : "rgba(232,150,10,0.05)",
                    marginBottom: 8, cursor: "pointer", transition: "opacity .15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = ".8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <span style={{ fontSize: 16, marginTop: 1 }}>{a.icon}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>{a.text}</p>
                    <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>{a.sub}</p>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
