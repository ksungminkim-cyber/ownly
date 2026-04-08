"use client";
// src/app/dashboard/reports/ExcelTab.js
// 세금 신고 참고용 CSV(엑셀) 내보내기 탭
import { useState } from "react";
import { useApp } from "../../../context/AppContext";

const C = {
  navy: "#1a2744", emerald: "#0fa573", rose: "#e8445a",
  amber: "#e8960a", border: "#e8e6e0", muted: "#8a8a9a", faint: "#f8f7f4",
};

export default function ExcelTab() {
  const { tenants, payments, repairs, ledger } = useApp();
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const yearPayments = (payments || []).filter(p => (p.year || new Date().getFullYear()) === year);
  const yearRepairs  = (repairs  || []).filter(r => new Date(r.date || "").getFullYear() === year);
  const yearLedger   = (ledger   || []).filter(l => new Date(l.date || "").getFullYear() === year && l.type === "expense");

  const totalIncome  = tenants.reduce((s, t) => s + (t.rent || 0) * 12, 0);
  const totalPaid    = yearPayments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || p.amt || 0), 0);
  const totalRepair  = yearRepairs.reduce((s, r) => s + (r.cost || 0), 0);
  const totalLedgerE = yearLedger.reduce((s, l) => s + (l.amount || 0), 0);
  const totalExp     = totalRepair + totalLedgerE;
  const estimated    = Math.max(0, totalIncome - totalExp);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          tenants,
          payments: yearPayments,
          repairs: yearRepairs,
          ledger: yearLedger,
        }),
      });
      if (!res.ok) throw new Error("내보내기 실패");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `온리_세금신고참고자료_${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("내보내기 중 오류: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      {/* 안내 배너 */}
      <div style={{ background: "rgba(26,39,68,0.04)", border: "1px solid rgba(26,39,68,0.12)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 4 }}>📊 세금 신고 참고자료 엑셀 다운로드</p>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
          임대 수입·수금 내역·필요경비를 엑셀(CSV) 파일로 내보냅니다.<br/>
          세무사에게 전달하거나 종합소득세 신고 시 참고자료로 활용하세요.<br/>
          <strong style={{ color: C.amber }}>※ 실제 세금 신고는 반드시 세무사에게 확인하세요.</strong>
        </p>
      </div>

      {/* 연도 선택 */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>신고 연도 선택</p>
        <div style={{ display: "flex", gap: 8 }}>
          {[new Date().getFullYear() - 1, new Date().getFullYear()].map(y => (
            <button key={y} onClick={() => setYear(y)}
              style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", border: `2px solid ${year === y ? C.navy : C.border}`, background: year === y ? "rgba(26,39,68,0.07)" : "transparent", color: year === y ? C.navy : C.muted }}>
              {y}년 {y === new Date().getFullYear() - 1 ? "(전년도)" : "(올해)"}
            </button>
          ))}
        </div>
      </div>

      {/* 미리보기 요약 */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>{year}년 데이터 미리보기</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { label: "임대 세입자", value: `${tenants.length}명`, color: C.navy },
            { label: "수금 기록", value: `${yearPayments.length}건`, color: C.navy },
            { label: "수리·유지보수", value: `${yearRepairs.length}건`, color: C.navy },
            { label: "장부 지출", value: `${yearLedger.length}건`, color: C.navy },
          ].map(k => (
            <div key={k.label} style={{ background: C.faint, borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          {[
            { label: "연간 임대 수입 (추정)", value: `${totalIncome.toLocaleString()}만원`, color: C.emerald },
            { label: "실제 수금액", value: `${totalPaid.toLocaleString()}만원`, color: C.emerald },
            { label: "필요경비 합계", value: `${totalExp.toLocaleString()}만원`, color: C.rose },
            { label: "과세표준 (추정)", value: `${estimated.toLocaleString()}만원`, color: C.navy, bold: true },
          ].map(k => (
            <div key={k.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.muted }}>{k.label}</span>
              <span style={{ fontSize: 14, fontWeight: k.bold ? 900 : 700, color: k.color }}>{k.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 포함 내용 */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>파일 포함 내용</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { icon: "📋", title: "시트1 — 임대 수입 현황", desc: "세입자별 월세·연간 수입 목록" },
            { icon: "💰", title: "시트2 — 월별 수금 내역", desc: `${year}년 납부 완료/미납 전체 내역` },
            { icon: "🔧", title: "시트3 — 필요경비 내역", desc: "수리비·장부 지출 (세금 공제 참고용)" },
            { icon: "📊", title: "시트4 — 세금 신고 요약", desc: "과세표준 추정 + 신고 기한 안내" },
          ].map(item => (
            <div key={item.title} style={{ display: "flex", gap: 12, padding: "10px 12px", background: C.faint, borderRadius: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 11, color: C.muted }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 다운로드 버튼 */}
      <button onClick={handleExport} disabled={loading}
        style={{ width: "100%", padding: "16px", borderRadius: 14, background: loading ? "#b0b0c0" : `linear-gradient(135deg,${C.navy},#2d4270)`, color: "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 20px rgba(26,39,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        {loading ? (
          <><span style={{ animation: "spin .7s linear infinite", display: "inline-block" }}>⏳</span> 생성 중...</>
        ) : (
          <><span>📥</span> {year}년 세금 신고 자료 다운로드 (CSV/엑셀)</>
        )}
      </button>

      <p style={{ fontSize: 11, color: C.muted, marginTop: 12, textAlign: "center", lineHeight: 1.7 }}>
        CSV 파일은 엑셀·구글스프레드시트에서 바로 열 수 있습니다.<br/>
        한글 깨짐 방지를 위해 UTF-8 BOM 인코딩으로 저장됩니다.
      </p>
    </div>
  );
}
