"use client";
import { useRouter } from "next/navigation";
import { Badge, SectionLabel, CustomTooltip, EmptyState } from "../../components/shared";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { C, STATUS_MAP, REVENUE, daysLeft } from "../../lib/constants";
import { useApp } from "../../context/AppContext";

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
  const pieData    = [
    { name: "주거", value: resiIncome, color: C.indigo },
    { name: "상가", value: commIncome, color: C.amber  },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: C.muted, fontSize: 14 }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="page-in page-padding" style={{ maxWidth: 1120 }}>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <SectionLabel>OVERVIEW</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-.4px" }}>대시보드</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>2025년 3월 · 전체 물건 {tenants.length}개</p>
      </div>

      {/* KPI 카드 4개 */}
      <div className="dash-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 22 }}>
        {[
          { l: "이번 달 수입",  v: totalRent + "만원",               s: "전 물건 합산",              a: C.emerald, icon: "💰", p: "payments"   },
          { l: "총 보증금",     v: (totalDep / 10000).toFixed(1) + "억원", s: "물건 " + tenants.length + "개", a: C.muted, icon: "🏦", p: "properties" },
          { l: "미납 건수",     v: unpaid + "건",                    s: unpaid > 0 ? "즉시 확인" : "모두 정상", a: unpaid > 0 ? C.rose : C.emerald, icon: "⚠️", p: "payments" },
          { l: "만료 임박",     v: expiring + "건",                  s: "60일 이내",                 a: C.amber,   icon: "📅", p: "tenants"    },
        ].map((k) => (
          <div
            key={k.l}
            onClick={() => router.push("/dashboard/" + k.p)}
            className="hover-lift"
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 15, padding: "19px 20px", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 7 }}>{k.l}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-.5px" }}>{k.v}</p>
                <p style={{ fontSize: 11, color: k.a, marginTop: 3, fontWeight: 600 }}>{k.s}</p>
              </div>
              <span style={{ fontSize: 20 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="dash-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 250px", gap: 14, marginBottom: 18 }}>
        {/* 월별 수입 추이 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 17, padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <SectionLabel>TREND</SectionLabel>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text }}>월별 수입 추이</h3>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {[{ c: C.indigo, l: "수입" }, { c: C.emerald, l: "순수익" }].map((x) => (
                <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: x.c }} />
                  <span style={{ fontSize: 11, color: C.muted }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={168}>
            <AreaChart data={netData}>
              <defs>
                {[["ig", C.indigo], ["ng", C.emerald]].map(([id, c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="m" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="수입"    stroke={C.indigo}  strokeWidth={2} fill="url(#ig)" dot={false} />
              <Area type="monotone" dataKey="net"    name="순수익"  stroke={C.emerald} strokeWidth={2} fill="url(#ng)" dot={{ fill: C.emerald, r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 유형별 수입 파이 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 17, padding: "22px" }}>
          <SectionLabel>SPLIT</SectionLabel>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>유형별 수입</h3>
          <PieChart width={200} height={120}>
            <Pie data={pieData} cx={100} cy={60} innerRadius={36} outerRadius={52} paddingAngle={4} dataKey="value">
              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip formatter={(v) => v + "만원"} contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }} />
          </PieChart>
          {pieData.map((d) => (
            <div key={d.name} style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color }} />
                <span style={{ fontSize: 12, color: C.muted }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{d.value}만원</span>
            </div>
          ))}
        </div>
      </div>

      {/* 물건 목록 + 알림 */}
      <div className="dash-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 14 }}>
        {/* 물건 목록 테이블 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 17, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 13px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text }}>물건 목록</h3>
            <span onClick={() => router.push("/dashboard/properties")} style={{ fontSize: 12, color: C.indigo, fontWeight: 600, cursor: "pointer" }}>전체 보기 →</span>
          </div>
          {tenants.length === 0 ? (
            <EmptyState icon="🏠" title="등록된 물건이 없습니다" desc="물건 관리에서 첫 물건을 추가해보세요" />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0a0a10" }}>
                  {["유형", "주소 · 세입자", "월세", "만료", "상태"].map((h) => (
                    <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, color: "#4b5563", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.slice(0, 5).map((t) => {
                  const dl = daysLeft(t.end);
                  return (
                    <tr key={t.id} className="trow" style={{ borderTop: `1px solid ${C.border}`, cursor: "pointer" }} onClick={() => router.push("/dashboard/properties")}>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: t.pType === "상가" ? C.amber : C.indigo, background: t.pType === "상가" ? C.amber + "18" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.addr}</p>
                        <p style={{ fontSize: 11, color: C.muted }}>{t.name}</p>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#fff" }}>{t.rent}만</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: dl <= 60 ? C.amber : C.muted }}>D-{dl}</td>
                      <td style={{ padding: "10px 16px" }}><Badge label={t.status} map={STATUS_MAP} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 알림 패널 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 17, padding: "18px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 13 }}>알림</h3>
          {(() => {
            const alerts = [];
            tenants.filter((t) => t.status === "미납").forEach((t) =>
              alerts.push({ type: "danger", icon: "⚠", text: t.name + "님 미납", sub: t.rent + "만원 · " + t.addr, p: "payments" })
            );
            tenants.filter((t) => daysLeft(t.end) <= 90 && t.status !== "미납").forEach((t) =>
              alerts.push({ type: "warning", icon: "📅", text: t.name + "님 만료 D-" + daysLeft(t.end), sub: t.addr, p: "tenants" })
            );
            if (alerts.length === 0) return <EmptyState icon="✅" title="알림이 없습니다" desc="모든 물건이 정상 상태입니다" />;
            return alerts.map((a, i) => {
              const bc = a.type === "danger" ? C.rose + "30" : C.amber + "30";
              const bg = a.type === "danger" ? C.rose + "08" : C.amber + "08";
              return (
                <div
                  key={i}
                  onClick={() => router.push("/dashboard/" + a.p)}
                  style={{ display: "flex", gap: 9, padding: "10px 11px", borderRadius: 10, border: `1px solid ${bc}`, background: bg, marginBottom: 7, cursor: "pointer", transition: "opacity .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = ".8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <span style={{ fontSize: 15 }}>{a.icon}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{a.text}</p>
                    <p style={{ fontSize: 10, color: C.muted }}>{a.sub}</p>
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
