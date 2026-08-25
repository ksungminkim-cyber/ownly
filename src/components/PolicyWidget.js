"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { matchPolicies, POLICY_REVIEW_DATE } from "../lib/policies";

// 대시보드 위젯: 최근 부동산 대책 중 등록 매물과 겹치는 항목 표시
// 매칭 로직·데이터는 src/lib/policies.js — 단정 대신 "가능성/확인 필요"로만 표시

const TAG_COLORS = {
  "규제지역": { c: "#e8445a", bg: "rgba(232,68,90,0.08)" },
  "세제":     { c: "#c9920a", bg: "rgba(201,146,10,0.1)" },
  "대출·금융": { c: "#1e7fcb", bg: "rgba(30,127,203,0.08)" },
  "공급":     { c: "#0fa573", bg: "rgba(15,165,115,0.08)" },
};

export default function PolicyWidget({ tenants }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const matches = useMemo(() => matchPolicies(tenants || []), [tenants]);

  if (matches.length === 0) return null;
  const shown = expanded ? matches : matches.slice(0, 3);

  return (
    <div className="surface-card" style={{ padding: "16px 18px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 18 }}>🏛️</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: 0 }}>최근 대책 중 내 매물 관련 {matches.length}건</p>
            <p style={{ fontSize: 10.5, color: "var(--text-faint)", margin: "2px 0 0" }}>8·3 세제 · 8·13 대책 · 규제지역 기준 {POLICY_REVIEW_DATE} 검토</p>
          </div>
        </div>
        <button onClick={() => router.push("/policy")} className="btn btn-soft btn-sm" style={{ flexShrink: 0 }}>전체 보기</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {shown.map((m) => {
          const tc = TAG_COLORS[m.policyTag] || TAG_COLORS["세제"];
          const addrs = m.properties.slice(0, 2).map(p => (p.addr || "").split(" ").slice(0, 2).join(" ")).filter(Boolean);
          return (
            <div key={`${m.policyId}-${m.item.id}`} onClick={() => router.push("/policy")}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--surface2)", cursor: "pointer", transition: `background var(--t-fast) var(--ease)` }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--surface2)"; }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: tc.c, background: tc.bg, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0, marginTop: 1 }}>{m.policyTag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{m.item.headline}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {addrs.length > 0 ? `매물 ${m.properties.length}건 — ${addrs.join(", ")}${m.properties.length > 2 ? " 외" : ""}` : `매물 ${m.properties.length}건 해당`}
                  {m.item.certainty === "check" && <span style={{ color: "#8a6d1a" }}> · 본인 조건 확인 필요</span>}
                </p>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-faint)", flexShrink: 0, alignSelf: "center" }}>→</span>
            </div>
          );
        })}
      </div>

      {matches.length > 3 && (
        <button onClick={() => setExpanded(e => !e)}
          style={{ width: "100%", marginTop: 8, padding: "7px 0", borderRadius: 8, border: "none", background: "none", color: "var(--text-muted)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
          {expanded ? "접기 ↑" : `${matches.length - 3}건 더 보기 ↓`}
        </button>
      )}
      <p style={{ fontSize: 10, color: "var(--text-faint)", margin: "10px 0 0", lineHeight: 1.6 }}>
        ※ 주소·유형 기준 자동 매칭 참고 자료입니다. 실제 적용은 세대 주택 수·거주 이력 등에 따라 다릅니다.
      </p>
    </div>
  );
}
