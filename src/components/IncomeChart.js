"use client";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";
import { CustomTooltip } from "./shared";

// 월별 수입·지출 — 최근 6개월. 막대 위에 금액을 바로 적어 축 눈금 없이 읽히게 한다.
// data: [{ m: "5월", income, expense, net }]
export default function IncomeChart({ data = [], onEmpty }) {
  const empty = data.every((d) => d.income === 0);
  const hasExpense = data.some((d) => d.expense > 0);
  const last = data.length - 1;

  return (
    <section className="surface-card" style={{ padding: "18px 20px 10px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          월별 수입 <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>최근 6개월 · 만원</span>
        </h3>
        <div style={{ display: "flex", gap: 12 }}>
          {[["#1a2744", "수입"], ...(hasExpense ? [["#d9d6cc", "지출"]] : [])].map(([c, l]) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
              <i style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      {empty ? (
        <div
          style={{
            height: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 6,
            background: "var(--surface2)",
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>아직 수금 기록이 없습니다</p>
          <p style={{ fontSize: 11, color: "var(--text-faint)" }}>수금 현황에서 납부 처리하면 여기에 쌓입니다</p>
          <button onClick={onEmpty} className="btn btn-fill btn-sm" style={{ marginTop: 6 }}>
            수금 현황 가기
          </button>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={data} margin={{ top: 22, right: 4, left: 4, bottom: 0 }} barCategoryGap={hasExpense ? "26%" : "38%"} barGap={3}>
            <XAxis dataKey="m" tick={{ fill: "#8a8a9a", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(26,39,68,0.04)" }} />
            <Bar dataKey="income" name="수입" radius={[6, 6, 2, 2]} maxBarSize={44} isAnimationActive animationDuration={700}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === last ? "#1a2744" : "rgba(26,39,68,0.62)"} />
              ))}
              <LabelList
                dataKey="income"
                position="top"
                formatter={(v) => (v ? Number(v).toLocaleString() : "")}
                style={{ fill: "#1a2744", fontSize: 11, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}
              />
            </Bar>
            {hasExpense && <Bar dataKey="expense" name="지출" fill="#d9d6cc" radius={[6, 6, 2, 2]} maxBarSize={44} isAnimationActive animationDuration={700} />}
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
