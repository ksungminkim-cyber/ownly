"use client"; import { todayKST } from "../lib/kstDate";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { toast } from "./shared";

// 전월세(임대차) 신고 — 대시보드 경고와 같은 조건(보증금 6천만원 초과 또는 월세 30만원 초과, 계약일 30일 이내)
export default function LeaseReportCard({ tenant }) {
  const { updateTenant } = useApp();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => todayKST());
  const sd = tenant.start_date || tenant.start || "";
  const isTarget = (Number(tenant.dep) || 0) > 6000 || (Number(tenant.rent) || 0) > 30;
  const filed = tenant.report_filed_at || null;
  const days = sd ? Math.floor((Date.now() - new Date(sd).getTime()) / 86400000) : null;
  const deadline = sd ? new Date(new Date(sd).getTime() + 30 * 86400000).toISOString().slice(0, 10) : "";

  const save = async (value) => {
    setSaving(true);
    try {
      await updateTenant(tenant.id, { report_filed_at: value });
      toast(value ? "신고 완료로 표시했습니다" : "신고 완료 표시를 해제했습니다");
    } catch (e) {
      toast(`저장 실패: ${e?.message || "알 수 없는 오류"}`, "error");
      console.error("[tenants.report]", e);
    } finally {
      setSaving(false);
    }
  };

  let status;
  if (filed) status = <span className="chip chip-success">신고 완료 · {filed}</span>;
  else if (!isTarget) status = <span className="chip">신고 대상 아님 (금액 기준)</span>;
  else if (days !== null && days >= 0 && days < 30) status = <span className="chip chip-warn">신고 기한 D-{30 - days}</span>;
  else if (days !== null && days >= 30) status = <span className="chip chip-danger">기한({deadline}) 경과 · 신고 여부 확인 필요</span>;
  else status = <span className="chip chip-info">계약 시작일 미입력</span>;

  return (
    <div className="surface-card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <p className="section-eyebrow" style={{ margin: 0 }}>전월세(임대차) 신고</p>
        {status}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
        신고 대상: 보증금 6천만원 초과 또는 월세 30만원 초과 계약 · 계약일부터 30일 이내 신고
        {sd ? ` (계약 시작일 ${sd} 기준 기한 ${deadline})` : ""}. 갱신·변경 계약도 금액이 바뀌면 신고 대상일 수 있습니다.
      </p>
      <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6, lineHeight: 1.5 }}>
        ※ 대상 지역(수도권·광역시·세종·도의 시 지역 등)과 세부 요건은 법령 기준으로 달라질 수 있어 이 표시는 금액·날짜만으로 판단한 참고용입니다. 정확한 대상 여부는 국토교통부 안내를 확인하세요.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
        <a href="https://rtms.molit.go.kr" target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm" style={{ textDecoration: "none" }}>국토부 임대차신고 바로가기 ↗</a>
        {filed ? (
          <button onClick={() => save(null)} disabled={saving} className="btn btn-ghost btn-sm">{saving ? "저장 중..." : "신고 완료 해제"}</button>
        ) : (
          <>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="신고 완료일" style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text)", background: "var(--surface2)" }} />
            <button onClick={() => save(date || todayKST())} disabled={saving} className="btn btn-accent btn-sm">{saving ? "저장 중..." : "신고 완료로 표시"}</button>
          </>
        )}
      </div>
    </div>
  );
}
