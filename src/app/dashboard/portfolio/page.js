"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useApp } from "../../../context/AppContext";
import { SectionLabel, EmptyState } from "../../../components/shared";
import { daysLeft, buildingKey } from "../../../lib/constants";
import { calcPaymentRisk } from "../../../lib/paymentRisk";
import PropertyMap from "../../../components/PropertyMap";

const TYPE_COLORS = { "주거": "#1a2744", "상가": "#e8960a", "토지": "#0d9488", "오피스텔": "#5b4fcf", "기타": "#8a8a9a" };

export default function PortfolioPage() {
  const router = useRouter();
  const { tenants, payments, buildings, loading } = useApp();

  const stats = useMemo(() => {
    const active = tenants.filter(t => t.status !== "공실");
    const vacant = tenants.filter(t => t.status === "공실");
    const totalMonthly = active.reduce((s, t) => s + (Number(t.rent) || 0), 0);
    const totalAnnual = totalMonthly * 12;
    const totalDeposit = tenants.reduce((s, t) => s + (Number(t.dep) || 0), 0);
    const totalMaintenance = active.reduce((s, t) => s + (Number(t.maintenance) || 0), 0) * 12;
    const vacancyLoss = vacant.reduce((s, t) => s + (Number(t.rent) || 0), 0);
    const annualYield = totalDeposit > 0 ? (totalAnnual / totalDeposit) * 100 : 0;

    // 유형별 분해
    const byType = {};
    tenants.forEach(t => {
      const type = t.pType || t.p_type || "기타";
      if (!byType[type]) byType[type] = { type, count: 0, vacant: 0, monthlyRent: 0, totalDeposit: 0 };
      byType[type].count++;
      if (t.status === "공실") byType[type].vacant++;
      else byType[type].monthlyRent += Number(t.rent) || 0;
      byType[type].totalDeposit += Number(t.dep) || 0;
    });

    // 건물별 (상위 5)
    const byBuilding = new Map();
    buildings.forEach(b => byBuilding.set(b.id, { id: b.id, name: b.name || b.address, units: [], isVirtual: false }));
    tenants.forEach(t => {
      let bucketId;
      if (t.building_id) bucketId = t.building_id;
      else {
        const key = buildingKey(t.addr);
        bucketId = `virtual:${key}`;
        if (!byBuilding.has(bucketId) && key) byBuilding.set(bucketId, { id: bucketId, name: key, units: [], isVirtual: true });
      }
      const bucket = byBuilding.get(bucketId);
      if (bucket) bucket.units.push(t);
    });
    const buildingList = Array.from(byBuilding.values())
      .filter(b => b.units.length > 0)
      .map(b => {
        const active = b.units.filter(u => u.status !== "공실");
        const rent = active.reduce((s, u) => s + (Number(u.rent) || 0), 0);
        return { ...b, unitCount: b.units.length, vacancy: b.units.filter(u => u.status === "공실").length, monthlyRent: rent };
      })
      .sort((a, b) => b.monthlyRent - a.monthlyRent);

    // 위험도 분포
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0, unknown: 0 };
    active.forEach(t => {
      const r = calcPaymentRisk(t, payments);
      riskDistribution[r.level] = (riskDistribution[r.level] || 0) + 1;
    });

    // YTD 수금률
    const thisYear = new Date().getFullYear();
    const ytdExpected = payments.filter(p => (p.year || thisYear) === thisYear).reduce((s, p) => s + (Number(p.amt || p.amount) || 0), 0) + 0;
    const ytdPaid = payments.filter(p => p.status === "paid" && (p.year || thisYear) === thisYear).reduce((s, p) => s + (Number(p.amt || p.amount) || 0), 0);

    return {
      totalTenants: tenants.length,
      activeCount: active.length,
      vacantCount: vacant.length,
      totalMonthly, totalAnnual, totalDeposit, totalMaintenance,
      vacancyLoss, annualYield,
      byType: Object.values(byType),
      buildingList,
      riskDistribution,
      ytdPaid, ytdExpected,
    };
  }, [tenants, payments, buildings]);

  if (loading) return <div className="page-in page-padding" style={{ textAlign: "center", padding: 40, color: "#8a8a9a" }}>불러오는 중...</div>;

  if (tenants.length === 0) {
    return (
      <div className="page-in page-padding" style={{ maxWidth: 960 }}>
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>PORTFOLIO</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>자산 요약</h1>
        </div>
        <EmptyState icon="💼" title="자산 데이터가 없습니다" desc="물건을 등록하면 포트폴리오 분석이 시작됩니다" action="+ 물건 등록" onAction={() => router.push("/dashboard/properties")} />
      </div>
    );
  }

  const pieData = stats.byType.map(t => ({ name: t.type, value: t.monthlyRent, color: TYPE_COLORS[t.type] || "#8a8a9a" }));
  const buildingBarData = stats.buildingList.slice(0, 5).map(b => ({ name: b.name.length > 12 ? b.name.slice(0, 12) + "…" : b.name, rent: b.monthlyRent }));

  return (
    <div className="page-in page-padding" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>PORTFOLIO</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>자산 요약</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>전체 임대 자산 현황·수익성·위험 분포를 한눈에 파악하세요</p>
      </div>

      {/* 히어로 카드 */}
      <div style={{ background: "linear-gradient(135deg,#1a2744 0%,#2d4270 55%,#5b4fcf 100%)", borderRadius: 18, padding: "24px 28px 20px", color: "#fff", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.08),transparent 70%)" }} />
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "2px", opacity: .7, textTransform: "uppercase", marginBottom: 8 }}>TOTAL PORTFOLIO</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 18 }}>
            <div>
              <p style={{ fontSize: 11, opacity: .7, marginBottom: 3 }}>월 임대 수입</p>
              <p style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-.5px" }}>{stats.totalMonthly.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4, opacity: .7 }}>만</span></p>
              <p style={{ fontSize: 11, opacity: .6, marginTop: 2 }}>연환산 {(stats.totalAnnual / 10000).toFixed(1)}억</p>
            </div>
            <div>
              <p style={{ fontSize: 11, opacity: .7, marginBottom: 3 }}>보유 총 보증금</p>
              <p style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-.5px" }}>{(stats.totalDeposit / 10000).toFixed(1)}<span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4, opacity: .7 }}>억</span></p>
              <p style={{ fontSize: 11, opacity: .6, marginTop: 2 }}>{stats.totalTenants}개 물건</p>
            </div>
            <div>
              <p style={{ fontSize: 11, opacity: .7, marginBottom: 3 }}>연 수익률</p>
              <p style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-.5px" }}>{stats.annualYield.toFixed(1)}<span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4, opacity: .7 }}>%</span></p>
              <p style={{ fontSize: 11, opacity: .6, marginTop: 2 }}>보증금 대비</p>
            </div>
            <div>
              <p style={{ fontSize: 11, opacity: .7, marginBottom: 3 }}>공실 손실 (월)</p>
              <p style={{ fontSize: 30, fontWeight: 900, color: stats.vacancyLoss > 0 ? "#fbbf24" : "#4ade80", letterSpacing: "-.5px" }}>{stats.vacancyLoss > 0 ? `-${stats.vacancyLoss.toLocaleString()}` : "0"}<span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4, opacity: .7 }}>만</span></p>
              <p style={{ fontSize: 11, opacity: .6, marginTop: 2 }}>{stats.vacantCount > 0 ? `공실 ${stats.vacantCount}실` : "전 물건 임대 중"}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="portfolio-grid">
        {/* 유형별 분포 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>🏷️ 물건 유형별 수입</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v.toLocaleString()}만원/월`} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #ebe9e3" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, justifyContent: "center" }}>
            {stats.byType.map(t => (
              <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: TYPE_COLORS[t.type] || "#8a8a9a" }} />
                <span style={{ color: "#1a2744", fontWeight: 700 }}>{t.type}</span>
                <span style={{ color: "#8a8a9a" }}>{t.count}개 · {t.monthlyRent.toLocaleString()}만</span>
              </div>
            ))}
          </div>
        </div>

        {/* 수금 위험 분포 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>🔮 수금 위험 분포</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { key: "low",      label: "✅ 안정",   color: "#0fa573" },
              { key: "medium",   label: "🔸 보통",   color: "#5b4fcf" },
              { key: "high",     label: "⚠️ 주의",   color: "#e8960a" },
              { key: "critical", label: "🚨 고위험", color: "#e8445a" },
              { key: "unknown",  label: "— 이력없음", color: "#8a8a9a" },
            ].map(({ key, label, color }) => {
              const count = stats.riskDistribution[key] || 0;
              const pct = stats.activeCount > 0 ? (count / stats.activeCount) * 100 : 0;
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: "#1a2744", fontWeight: 700 }}>{label}</span>
                    <span style={{ color: "#8a8a9a" }}>{count}명 ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 6, background: "#f0efe9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width .5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => router.push("/dashboard/payments")}
            style={{ marginTop: 12, width: "100%", padding: "8px", borderRadius: 8, background: "rgba(26,39,68,0.06)", border: "1px solid #ebe9e3", color: "#1a2744", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            수금 관리에서 상세 보기 →
          </button>
        </div>
      </div>

      {/* 🗺️ 물건 지역 분포 지도 */}
      <PropertyMap tenants={tenants} />

      {/* 건물별 월 수입 TOP5 */}
      {stats.buildingList.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px" }}>🏢 건물별 월 수입 TOP 5</p>
            <button onClick={() => router.push("/dashboard/buildings/compare")}
              style={{ padding: "4px 10px", borderRadius: 7, background: "transparent", border: "1px solid #ebe9e3", color: "#5b4fcf", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>전체 비교 →</button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={buildingBarData} layout="vertical" margin={{ top: 4, right: 10, left: 20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f3f0" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#a0a0b0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#1a2744", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip formatter={(v) => `${v.toLocaleString()}만원/월`} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #ebe9e3" }} />
              <Bar dataKey="rent" fill="#5b4fcf" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 액션 섹션 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
        {[
          { icon: "📋", label: "세무사용 연간 리포트", desc: "손익계산서 + 필요경비 분석", path: "/dashboard/reports/tax-annual", color: "#5b4fcf" },
          { icon: "📊", label: "월별 수익 차트", desc: "YTD 수금 추이 상세", path: "/dashboard/reports", color: "#0fa573" },
          { icon: "🧾", label: "세금 시뮬레이터", desc: "예상 세액 + 간주임대료", path: "/dashboard/tax", color: "#e8445a" },
        ].map(a => (
          <div key={a.label} onClick={() => router.push(a.path)}
            style={{ background: "#fff", border: `1px solid ${a.color}30`, borderLeft: `4px solid ${a.color}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer" }}>
            <p style={{ fontSize: 20, marginBottom: 6 }}>{a.icon}</p>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#1a2744", marginBottom: 2 }}>{a.label}</p>
            <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.5 }}>{a.desc}</p>
          </div>
        ))}
      </div>

      <style jsx>{`@media (max-width: 640px) { .portfolio-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
