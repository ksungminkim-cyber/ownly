"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const C = {
  navy: "#1a2744", navyLight: "#2d4270", purple: "#5b4fcf",
  emerald: "#0fa573", rose: "#e8445a", amber: "#e8960a", indigo: "#3b5bdb",
  surface: "#ffffff", border: "#e8e6e0", muted: "#8a8a9a", faint: "#f8f7f4",
};
const GRADE_META = {
  A: { color: C.emerald, bg: "rgba(15,165,115,0.1)", label: "최우수 입지", desc: "적극 매입 추천" },
  B: { color: C.indigo,  bg: "rgba(59,91,219,0.1)",  label: "우수 입지",   desc: "매입 검토 권장" },
  C: { color: C.amber,   bg: "rgba(232,150,10,0.1)", label: "보통 입지",   desc: "신중한 검토 필요" },
  D: { color: C.rose,    bg: "rgba(232,68,90,0.1)",  label: "주의 입지",   desc: "투자 재검토 권장" },
};
const TYPE_ICONS = { 주거: "🏠", 상가: "🏪", 오피스텔: "🏢", 토지: "🌳" };

function PrintContent() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState(null);
  const [addr, setAddr] = useState("");

  useEffect(() => {
    // localStorage에서 리포트 데이터 읽기 (새 탭에서도 공유됨)
    try {
      const key = searchParams.get("key") || "ownly_ai_report_latest";
      const raw = localStorage.getItem(key);
      const address = localStorage.getItem(key + "_addr");
      if (raw) {
        setReport(JSON.parse(raw));
        setAddr(address || "");
      }
    } catch (e) {
      console.error("리포트 로딩 실패:", e);
    }
  }, [searchParams]);

  useEffect(() => {
    if (report) {
      // 렌더링 완료 후 인쇄 다이얼로그
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [report]);

  if (!report) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "white", fontFamily: "'Malgun Gothic','Apple SD Gothic Neo',sans-serif" }}>
      <p style={{ color: C.muted, fontSize: 15 }}>리포트 데이터를 불러오는 중...</p>
    </div>
  );

  const gm = GRADE_META[report.grade] || GRADE_META["C"];
  const scoreColor = report.score >= 80 ? C.emerald : report.score >= 65 ? C.indigo : report.score >= 50 ? C.amber : C.rose;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "30px 40px", fontFamily: "'Malgun Gothic','Apple SD Gothic Neo','Pretendard',sans-serif", color: C.navy, background: "white", minHeight: "100vh" }}>

      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 18, borderBottom: `3px solid ${C.navy}`, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: C.muted, marginBottom: 6 }}>OWNLY AI 입지 분석 리포트</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-.4px" }}>{addr}</h1>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 12, background: `${C.navy}15`, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{TYPE_ICONS[report.propertyType]} {report.propertyType}</span>
            <span style={{ fontSize: 12, color: C.muted }}>분석일: {report.analysisDate}</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: gm.bg, border: `2px solid ${gm.color}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: gm.color }}>{report.grade}</span>
          </div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{gm.label}</div>
        </div>
      </div>

      {/* 점수 + 요약 */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, borderRadius: 16, padding: "22px 28px", marginBottom: 20, color: "#fff", display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ textAlign: "center", flexShrink: 0, minWidth: 90 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{report.score}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>/ 100점</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: gm.color, marginTop: 6, background: gm.bg, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{gm.desc}</div>
        </div>
        <div style={{ flex: 1, borderLeft: "1px solid rgba(255,255,255,0.15)", paddingLeft: 24 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, marginBottom: 8, letterSpacing: "1px" }}>AI 종합 입지 요약</div>
          <p style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.7, margin: 0 }}>💡 {report.summary}</p>
        </div>
      </div>

      {/* 항목별 분석 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "1.5px", marginBottom: 12, textTransform: "uppercase" }}>항목별 심층 분석</div>
        {report.sections?.map((sec, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.faint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{sec.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, marginBottom: 5 }}>{sec.title}</div>
              <div style={{ fontSize: 12, color: "#4a4a6a", lineHeight: 1.8 }}>{sec.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 장점 / 리스크 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ border: `1.5px solid rgba(15,165,115,0.3)`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.emerald, marginBottom: 12 }}>✅ 투자 장점</div>
          {report.pros?.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ color: C.emerald, fontWeight: 900, flexShrink: 0, fontSize: 12 }}>0{i+1}</span>
              <span style={{ fontSize: 12, color: "#1a4a3a", lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ border: `1.5px solid rgba(232,68,90,0.3)`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.rose, marginBottom: 12 }}>⚠️ 리스크 요인</div>
          {report.cons?.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ color: C.rose, fontWeight: 900, flexShrink: 0, fontSize: 12 }}>0{i+1}</span>
              <span style={{ fontSize: 12, color: "#4a1a1a", lineHeight: 1.6 }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 종합 의견 */}
      <div style={{ background: gm.bg, border: `1.5px solid ${gm.color}30`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, marginBottom: 10 }}>📋 종합 투자 의견 — {gm.desc}</div>
        <p style={{ fontSize: 13, color: "#2a2a4a", lineHeight: 1.9, margin: 0 }}>{report.recommendation}</p>
      </div>

      {/* 푸터 */}
      <div style={{ textAlign: "center", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 10, color: C.muted, margin: "0 0 4px" }}>본 리포트는 Ownly AI 시스템이 생성했습니다 · ownly.kr · {report.analysisDate}</p>
        <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>※ 본 분석은 참고용이며, 실제 투자 결정은 전문 감정평가사 및 부동산 전문가와 상담하시기 바랍니다</p>
      </div>

      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @media print {
          @page { margin: 15mm; size: A4 portrait; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          nav, aside, header { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function PrintPage() {
  return <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "white" }}><p style={{ color: "#8a8a9a" }}>로딩 중...</p></div>}><PrintContent /></Suspense>;
}
