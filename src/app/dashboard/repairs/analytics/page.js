"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { useApp } from "../../../../context/AppContext";
import { SectionLabel, EmptyState } from "../../../../components/shared";

const C = { navy: "#1a2744", purple: "#5b4fcf", emerald: "#0fa573", rose: "#e8445a", amber: "#e8960a", muted: "#8a8a9a" };

export default function RepairAnalyticsPage() {
  const router = useRouter();
  const { repairs, tenants, loading } = useApp();

  const stats = useMemo(() => {
    if (!repairs || repairs.length === 0) return null;

    const now = new Date();
    const thisYear = now.getFullYear();
    const ytd = repairs.filter(r => r.date && new Date(r.date).getFullYear() === thisYear);
    const ytdCost = ytd.reduce((s, r) => s + (Number(r.cost) || 0), 0);
    const monthsActive = new Set(ytd.map(r => new Date(r.date).getMonth())).size || 1;
    const avgMonthlyCost = Math.round(ytdCost / Math.max(1, monthsActive));
    const receiptCount = repairs.filter(r => r.receipt_yn).length;
    const receiptRate = Math.round((receiptCount / repairs.length) * 100);

    // 카테고리별 집계
    const byCategory = {};
    repairs.forEach(r => {
      const cat = r.category || "기타";
      if (!byCategory[cat]) byCategory[cat] = { category: cat, count: 0, cost: 0, items: [] };
      byCategory[cat].count++;
      byCategory[cat].cost += Number(r.cost) || 0;
      byCategory[cat].items.push(r);
    });
    const categoryList = Object.values(byCategory).sort((a, b) => b.cost - a.cost);

    // 월별 추이 (12개월)
    const monthly = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const rows = repairs.filter(r => {
        if (!r.date) return false;
        const rd = new Date(r.date);
        return rd.getFullYear() === y && rd.getMonth() + 1 === m;
      });
      monthly.push({
        label: `${String(y).slice(2)}/${String(m).padStart(2, "0")}`,
        cost: rows.reduce((s, r) => s + (Number(r.cost) || 0), 0),
        count: rows.length,
      });
    }

    // 업체 TOP 5
    const byVendor = {};
    repairs.filter(r => r.vendor).forEach(r => {
      const v = r.vendor;
      if (!byVendor[v]) byVendor[v] = { vendor: v, count: 0, cost: 0 };
      byVendor[v].count++;
      byVendor[v].cost += Number(r.cost) || 0;
    });
    const vendorList = Object.values(byVendor).sort((a, b) => b.cost - a.cost).slice(0, 5);

    // 세입자별 TOP 3
    const byTenant = {};
    repairs.filter(r => r.tenant_id).forEach(r => {
      const tid = r.tenant_id;
      if (!byTenant[tid]) {
        const t = tenants.find(x => x.id === tid);
        byTenant[tid] = { tenantId: tid, name: t?.name || "—", addr: t?.addr || "", count: 0, cost: 0 };
      }
      byTenant[tid].count++;
      byTenant[tid].cost += Number(r.cost) || 0;
    });
    const tenantList = Object.values(byTenant).sort((a, b) => b.cost - a.cost).slice(0, 3);

    // 최고/최저 카테고리 비용 비교
    const mostExpensive = categoryList[0];
    const avgPerRepair = repairs.length > 0 ? Math.round(repairs.reduce((s, r) => s + (Number(r.cost) || 0), 0) / repairs.length) : 0;

    return {
      total: repairs.length, totalCost: repairs.reduce((s, r) => s + (Number(r.cost) || 0), 0),
      ytd, ytdCost, avgMonthlyCost, receiptCount, receiptRate,
      categoryList, monthly, vendorList, tenantList, mostExpensive, avgPerRepair,
    };
  }, [repairs, tenants]);

  if (loading) return <div className="page-in page-padding" style={{ textAlign: "center", padding: 40, color: "#8a8a9a" }}>불러오는 중...</div>;

  if (!stats) {
    return (
      <div className="page-in page-padding" style={{ maxWidth: 960 }}>
        <div style={{ marginBottom: 22 }}>
          <button onClick={() => router.push("/dashboard/repairs")} style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← 수리 이력</button>
          <SectionLabel>REPAIR ANALYTICS</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>수리 이력 분석</h1>
        </div>
        <EmptyState icon="🔨" title="분석할 데이터가 없습니다" desc="수리 이력을 등록하면 카테고리·월별·업체별 분석이 시작됩니다" action="수리 이력 등록" onAction={() => router.push("/dashboard/repairs")} />
      </div>
    );
  }

  const maxMonthCost = Math.max(...stats.monthly.map(m => m.cost), 1);
  const maxCatCost = Math.max(...stats.categoryList.map(c => c.cost), 1);

  return (
    <div className="page-in page-padding" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 22 }}>
        <button onClick={() => router.push("/dashboard/repairs")} style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← 수리 이력</button>
        <SectionLabel>REPAIR ANALYTICS</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>수리 이력 분석</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>카테고리·월별·업체별 수리비 패턴 분석 · 세금 신고 시 경비 처리 참고용</p>
      </div>

      {/* 히어로 KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "YTD 총 수리비", v: `${stats.ytdCost.toLocaleString()}만`, sub: `${stats.ytd.length}건 · 평균 ${stats.avgPerRepair.toLocaleString()}만/건`, c: C.rose },
          { l: "평균 월 수리비", v: `${stats.avgMonthlyCost.toLocaleString()}만`, sub: "YTD 활동 개월 기준", c: C.navy },
          { l: "최다 비용 카테고리", v: stats.mostExpensive?.category || "—", sub: `${stats.mostExpensive?.cost?.toLocaleString() || 0}만원`, c: C.amber },
          { l: "영수증 보관률", v: `${stats.receiptRate}%`, sub: `${stats.receiptCount} / ${stats.total}건 · 세금공제 대비`, c: stats.receiptRate >= 80 ? C.emerald : C.amber },
        ].map(k => (
          <div key={k.l} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{k.l}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: k.c, lineHeight: 1 }}>{k.v}</p>
            <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* 월별 추이 */}
      <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>📅 최근 12개월 수리비 추이</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="repairCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.rose} stopOpacity={0.25} />
                <stop offset="95%" stopColor={C.rose} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f3f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#a0a0b0", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#a0a0b0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #ebe9e3" }} formatter={(v, n) => [n === "cost" ? `${Number(v).toLocaleString()}만원` : `${v}건`, n === "cost" ? "비용" : "건수"]} />
            <Area type="monotone" dataKey="cost" name="cost" stroke={C.rose} fill="url(#repairCost)" strokeWidth={2} dot={{ fill: C.rose, r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="ra-grid">
        {/* 카테고리별 Top */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>🏷️ 카테고리별 비용 순위</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.categoryList.map((c, i) => (
              <div key={c.category}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: "#1a2744" }}>{c.category}</span>
                  <span style={{ color: "#8a8a9a" }}>{c.cost.toLocaleString()}만 <span style={{ color: "#c0c0cc", marginLeft: 4 }}>({c.count}건)</span></span>
                </div>
                <div style={{ height: 8, background: "#f0efe9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(c.cost / maxCatCost) * 100}%`, background: i === 0 ? C.rose : i === 1 ? C.amber : i === 2 ? C.purple : C.muted, borderRadius: 4, transition: "width .4s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 업체 TOP 5 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>🏢 자주 쓰는 업체 TOP 5</p>
          {stats.vendorList.length === 0 ? (
            <p style={{ fontSize: 12, color: "#a0a0b0", textAlign: "center", padding: 16 }}>업체 정보가 없습니다</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.vendorList.map((v, i) => (
                <div key={v.vendor} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: i === 0 ? "rgba(15,165,115,0.12)" : "rgba(26,39,68,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i === 0 ? C.emerald : C.navy, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.vendor}</p>
                    <p style={{ fontSize: 10, color: "#8a8a9a" }}>{v.count}건 · 평균 {Math.round(v.cost / v.count).toLocaleString()}만</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.rose, whiteSpace: "nowrap" }}>{v.cost.toLocaleString()}만</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 세입자별 TOP 3 */}
      {stats.tenantList.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>👤 수리 빈도 높은 세입자 (관리 우선순위)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
            {stats.tenantList.map((t, i) => (
              <div key={t.tenantId} onClick={() => router.push(`/dashboard/tenants?select=${t.tenantId}`)}
                style={{ padding: "12px 14px", background: i === 0 ? "rgba(232,68,90,0.05)" : "#f8f7f4", border: `1px solid ${i === 0 ? "rgba(232,68,90,0.2)" : "#ebe9e3"}`, borderRadius: 11, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{t.name}</p>
                  <span style={{ fontSize: 10, fontWeight: 800, color: C.rose, background: "rgba(232,68,90,0.1)", padding: "2px 7px", borderRadius: 10 }}>{t.count}건</span>
                </div>
                <p style={{ fontSize: 11, color: "#8a8a9a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>{t.addr}</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#1a2744" }}>{t.cost.toLocaleString()}만원</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 인사이트 박스 */}
      <div style={{ background: "linear-gradient(135deg,rgba(91,79,207,0.04),rgba(26,39,68,0.04))", border: "1px solid rgba(91,79,207,0.2)", borderRadius: 12, padding: "14px 18px" }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#5b4fcf", marginBottom: 8 }}>💡 AI 인사이트</p>
        <ul style={{ fontSize: 12, color: "#6a6a7a", lineHeight: 1.9, margin: 0, paddingLeft: 18 }}>
          {stats.mostExpensive && (
            <li><b style={{ color: "#1a2744" }}>{stats.mostExpensive.category}</b>가 전체 수리비의 {Math.round((stats.mostExpensive.cost / stats.totalCost) * 100)}%를 차지합니다 — 집중 관리 대상</li>
          )}
          {stats.receiptRate < 80 && (
            <li>영수증 보관률이 <b style={{ color: "#e8445a" }}>{stats.receiptRate}%</b>로 낮습니다 — 세금 신고 시 경비 처리가 어려울 수 있어요</li>
          )}
          {stats.tenantList[0] && stats.tenantList[0].count >= 3 && (
            <li><b style={{ color: "#1a2744" }}>{stats.tenantList[0].name}</b>님 물건에서 {stats.tenantList[0].count}건 수리 발생 — 구조적 이슈 가능성 검토</li>
          )}
          {stats.avgMonthlyCost > 50 && (
            <li>월 평균 수리비 {stats.avgMonthlyCost.toLocaleString()}만원 — 연 환산 {(stats.avgMonthlyCost * 12).toLocaleString()}만원은 필요경비로 등록하세요</li>
          )}
        </ul>
      </div>

      <style jsx>{`@media (max-width: 720px) { .ra-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
