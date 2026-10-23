"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { FileText, BarChart3, Calculator, ArrowRight, Building2 } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { SectionLabel, EmptyState } from "../../../components/shared";
import { CountUp } from "../../../components/Trendy";
import { buildingKey } from "../../../lib/constants";
import { calcPaymentRisk } from "../../../lib/paymentRisk";
import PropertyMap from "../../../components/PropertyMap";

const TYPE_COLORS = { 주거: "#1a2744", 상가: "#b45309", 토지: "#0f766e", 오피스텔: "#5b4fcf", 기타: "#8a8a9a" };
const RISK_ROWS = [
  { key: "low", label: "안정", color: "#0fa573" },
  { key: "medium", label: "보통", color: "#5b4fcf" },
  { key: "high", label: "주의", color: "#e8960a" },
  { key: "critical", label: "고위험", color: "#e8445a" },
  { key: "unknown", label: "이력 없음", color: "#b0b0bc" },
];
const ACTIONS = [
  { Icon: FileText, label: "세무사용 연간 리포트", desc: "손익계산서와 필요경비 분석", path: "/dashboard/reports/tax-annual" },
  { Icon: BarChart3, label: "월별 수익 차트", desc: "올해 수금 추이 상세", path: "/dashboard/reports" },
  { Icon: Calculator, label: "세금 시뮬레이터", desc: "예상 세액과 간주임대료", path: "/dashboard/tax" },
];

function Figure({ label, value, unit, sub, color, decimals = 0, raw }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {raw ? (
        <p style={{ fontSize: 17, fontWeight: 800, color: color || "var(--text)", margin: 0, lineHeight: 1.2 }}>{raw}</p>
      ) : (
        <p style={{ margin: 0, display: "flex", alignItems: "baseline", gap: 4, color: color || "var(--text)" }}>
          <span className="display-num" style={{ fontSize: 34 }}>
            <CountUp value={value} decimals={decimals} duration={900} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{unit}</span>
        </p>
      )}
      {sub && <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 5, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

export default function PortfolioPage() {
  const router = useRouter();
  const { tenants, payments, buildings, loading } = useApp();

  const stats = useMemo(() => {
    const active = tenants.filter((t) => t.status !== "공실");
    const vacant = tenants.filter((t) => t.status === "공실");
    const totalMonthly = active.reduce((s, t) => s + (Number(t.rent) || 0), 0);
    const totalAnnual = totalMonthly * 12;
    const totalDeposit = tenants.reduce((s, t) => s + (Number(t.dep) || 0), 0);
    const vacancyLoss = vacant.reduce((s, t) => s + (Number(t.rent) || 0), 0);
    // 연 임대수익률 (실투자금 기준) = (월세×12) ÷ (매입가 − 보증금) — 매입가를 입력한 물건만 (공실은 월세 0 으로 포함)
    const priced = tenants.filter((t) => Number(t.purchase_price) > 0);
    const pricedAnnualRent = priced.filter((t) => t.status !== "공실").reduce((s, t) => s + (Number(t.rent) || 0), 0) * 12;
    const pricedEquity = priced.reduce((s, t) => s + Number(t.purchase_price) - (Number(t.dep) || 0), 0);
    const annualYield = priced.length > 0 && pricedEquity > 0 ? (pricedAnnualRent / pricedEquity) * 100 : null;

    const byType = {};
    tenants.forEach((t) => {
      const type = t.pType || t.p_type || "기타";
      if (!byType[type]) byType[type] = { type, count: 0, vacant: 0, monthlyRent: 0, totalDeposit: 0 };
      byType[type].count++;
      if (t.status === "공실") byType[type].vacant++;
      else byType[type].monthlyRent += Number(t.rent) || 0;
      byType[type].totalDeposit += Number(t.dep) || 0;
    });

    const byBuilding = new Map();
    buildings.forEach((b) => byBuilding.set(b.id, { id: b.id, name: b.name || b.address, units: [], isVirtual: false }));
    tenants.forEach((t) => {
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
      .filter((b) => b.units.length > 0)
      .map((b) => {
        const act = b.units.filter((u) => u.status !== "공실");
        const rent = act.reduce((s, u) => s + (Number(u.rent) || 0), 0);
        return { ...b, unitCount: b.units.length, vacancy: b.units.filter((u) => u.status === "공실").length, monthlyRent: rent };
      })
      .sort((a, b) => b.monthlyRent - a.monthlyRent);

    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0, unknown: 0 };
    active.forEach((t) => {
      const r = calcPaymentRisk(t, payments);
      riskDistribution[r.level] = (riskDistribution[r.level] || 0) + 1;
    });

    return {
      totalTenants: tenants.length,
      activeCount: active.length,
      vacantCount: vacant.length,
      totalMonthly,
      totalAnnual,
      totalDeposit,
      vacancyLoss,
      annualYield,
      pricedCount: priced.length,
      byType: Object.values(byType),
      buildingList,
      riskDistribution,
    };
  }, [tenants, payments, buildings]);

  if (loading)
    return (
      <div className="page-in page-padding" style={{ textAlign: "center", padding: 40, color: "#8a8a9a" }}>
        불러오는 중...
      </div>
    );

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

  const pieData = stats.byType.map((t) => ({ name: t.type, value: t.monthlyRent, color: TYPE_COLORS[t.type] || "#8a8a9a" }));
  const top = stats.buildingList.slice(0, 5);
  const topMax = Math.max(1, ...top.map((b) => b.monthlyRent));

  return (
    <div className="page-in page-padding" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 22 }}>
        <SectionLabel>PORTFOLIO</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>자산 요약</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>전체 임대 자산의 현황·수익성·위험 분포</p>
      </div>

      {/* 핵심 숫자 — 흰 바탕, 큰 세리프 숫자, 가는 선 */}
      <section className="surface-card" style={{ padding: "22px 24px 20px", marginBottom: 14 }}>
        <div className="figure-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 22 }}>
          <Figure label="월 임대 수입" value={stats.totalMonthly} unit="만" sub={`연환산 ${(stats.totalAnnual / 10000).toFixed(1)}억`} />
          <Figure label="보유 총 보증금" value={Number((stats.totalDeposit / 10000).toFixed(1))} decimals={1} unit="억" sub={`${stats.totalTenants}개 물건`} />
          {stats.annualYield !== null ? (
            <Figure
              label="연 임대수익률 (실투자금)"
              value={Number(stats.annualYield.toFixed(1))}
              decimals={1}
              unit="%"
              sub={`월세×12 ÷ (매입가 − 보증금) · 매입가 입력 ${stats.pricedCount}/${stats.totalTenants}개 · 세금·비용 제외`}
            />
          ) : (
            <Figure
              label="연 임대수익률 (실투자금)"
              raw={stats.pricedCount > 0 ? "계산 불가" : "매입가 입력 시 표시"}
              color="var(--text-muted)"
              sub={
                stats.pricedCount > 0 ? (
                  "보증금이 매입가 이상이라 실투자금이 0 이하입니다"
                ) : (
                  <span onClick={() => router.push("/dashboard/properties")} role="button" tabIndex={0} style={{ cursor: "pointer", textDecoration: "underline" }}>
                    물건 상세에서 매입가 입력 →
                  </span>
                )
              }
            />
          )}
          <Figure
            label="공실 손실 (월)"
            value={stats.vacancyLoss}
            unit="만"
            color={stats.vacancyLoss > 0 ? "#e8445a" : "var(--text)"}
            sub={stats.vacantCount > 0 ? `공실 ${stats.vacantCount}실` : "전 물건 임대 중"}
          />
        </div>
      </section>

      <div className="portfolio-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* 유형별 분포 */}
        <section className="surface-card" style={{ padding: "18px 20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>물건 유형별 수입</h3>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={2} stroke="none">
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v.toLocaleString()}만원/월`} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #ebe9e3" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
            {stats.byType.map((t) => (
              <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <i style={{ width: 8, height: 8, borderRadius: "50%", background: TYPE_COLORS[t.type] || "#8a8a9a", flexShrink: 0 }} />
                <span style={{ color: "var(--text)", fontWeight: 700, flex: 1 }}>{t.type}</span>
                <span className="num" style={{ color: "var(--text-muted)" }}>
                  {t.count}개 · {t.monthlyRent.toLocaleString()}만
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 수금 위험 분포 */}
        <section className="surface-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: "0 0 12px" }}>
            수금 위험 분포 <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>임대 중 {stats.activeCount}명</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
            {RISK_ROWS.map(({ key, label, color }) => {
              const count = stats.riskDistribution[key] || 0;
              const pct = stats.activeCount > 0 ? (count / stats.activeCount) * 100 : 0;
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7 }}>
                      <i style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                      {label}
                    </span>
                    <span className="num" style={{ color: "var(--text-muted)" }}>
                      {count}명 · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="rank-bar" style={{ marginTop: 0 }}>
                    <i style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => router.push("/dashboard/payments")} className="btn btn-ghost btn-sm" style={{ marginTop: 14, alignSelf: "flex-start" }}>
            수금 관리에서 상세 보기
          </button>
        </section>
      </div>

      <PropertyMap tenants={tenants} />

      {/* 건물별 월 수입 — 막대 차트 대신 순위 목록 */}
      {top.length > 0 && (
        <section className="surface-card" style={{ padding: "18px 20px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0, display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Building2 size={15} strokeWidth={2.2} />
              건물별 월 수입
            </h3>
            <button onClick={() => router.push("/dashboard/buildings/compare")} className="btn btn-ghost btn-sm">
              전체 비교
            </button>
          </div>
          <div>
            {top.map((b, i) => (
              <div key={b.id} className="rank-row">
                <span className="num" style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? "var(--text)" : "var(--text-faint)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</p>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {b.unitCount}호{b.vacancy > 0 ? ` · 공실 ${b.vacancy}` : ""}
                    </span>
                  </div>
                  <div className="rank-bar">
                    <i style={{ width: `${(b.monthlyRent / topMax) * 100}%`, animationDelay: `${i * 60}ms`, background: i === 0 ? "var(--text)" : "rgba(26,39,68,0.45)" }} />
                  </div>
                </div>
                <span className="num" style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap" }}>
                  {b.monthlyRent.toLocaleString()}만
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 다음 할 일 — 색 띠 없이, 아이콘과 화살표만 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        {ACTIONS.map(({ Icon, label, desc, path }) => (
          <div key={label} onClick={() => router.push(path)} className="surface-card interactive" role="button" tabIndex={0} style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--surface2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text)", flexShrink: 0 }}>
              <Icon size={18} strokeWidth={2} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</p>
            </div>
            <ArrowRight size={16} color="#a3a1a0" />
          </div>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 760px) {
          .figure-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .portfolio-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
