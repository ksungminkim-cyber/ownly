"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const C = {
  navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a",
  amber:"#e8960a", border:"#e8e6e0", muted:"#8a8a9a",
  faint:"#f8f7f4", surface:"#ffffff", accent:"#4f46e5",
};

// ── 전월세전환율 계산 ─────────────────────────────────
function calcConversion(deposit, monthly, rate) {
  // 전세 → 월세: 월세 = 전세금 × 전환율 / 12
  if (deposit && rate) return Math.round((deposit * (rate / 100)) / 12);
  return 0;
}
function calcMaxRent(currentRent, pct = 5) {
  return Math.round(currentRent * (1 + pct / 100));
}

// ── 섹션 데이터 ───────────────────────────────────────
const SECTIONS = [
  {
    id: "renewal",
    icon: "🔄",
    title: "계약갱신청구권",
    law: "주택임대차보호법 제6조의3",
    badge: "핵심 권리",
    badgeColor: C.accent,
    summary: "임차인이 1회에 한해 계약 갱신을 청구할 수 있는 권리. 임대인은 정당한 사유 없이 거절 불가.",
    questions: [
      { id: "r1", q: "임차인이 계약갱신을 요청했나요?", risk: "high" },
      { id: "r2", q: "임차인이 이미 갱신청구권을 1회 사용했나요?", risk: "low" },
      { id: "r3", q: "임대인 본인 또는 직계존비속 실거주 예정인가요?", risk: "medium" },
      { id: "r4", q: "임차인이 2기 이상 차임을 연체한 적 있나요?", risk: "low" },
    ],
    guides: [
      { icon: "⏰", title: "갱신 요청 기한", content: "계약 종료 6개월 전 ~ 2개월 전 사이에 요청 가능. 이 기간 외 요청은 효력 없음." },
      { icon: "🏠", title: "실거주 거절 요건", content: "임대인·직계존비속 실거주 목적으로만 거절 가능. 거절 후 2년 내 제3자 임대 시 손해배상 의무 발생." },
      { icon: "❌", title: "거절 가능 사유", content: "3기 차임 연체 / 임차인 동의 없는 전대 / 고의 파손 / 재건축 필요 / 임대인 실거주 등 법정 사유 해당 시." },
      { icon: "⚠️", title: "임대인 주의사항", content: "정당한 사유 없는 갱신 거절 시 임차인은 손해배상 청구 가능. 거절 의사는 서면(내용증명)으로 통보 권장." },
    ],
  },
  {
    id: "cap",
    icon: "📊",
    title: "전월세 상한제",
    law: "주택임대차보호법 제7조",
    badge: "5% 상한",
    badgeColor: C.emerald,
    summary: "계약 갱신 시 임대료(보증금·월세) 인상폭을 직전 임대료의 5% 이내로 제한.",
    questions: [
      { id: "c1", q: "기존 계약을 갱신하는 경우인가요? (신규 계약 아님)", risk: "high" },
      { id: "c2", q: "임대료 인상을 5% 초과해서 요구했나요?", risk: "high" },
      { id: "c3", q: "지자체 조례로 더 낮은 상한이 적용되는 지역인가요?", risk: "medium" },
    ],
    guides: [
      { icon: "🔢", title: "5% 계산 기준", content: "월세는 월세 기준, 전세는 전세금 기준으로 각각 5% 적용. 보증금과 월세를 함께 변경 시 전환율 환산 후 합산." },
      { icon: "📍", title: "적용 대상", content: "주거용 주택 임대차만 해당 (상가 제외). 신규 계약은 상한 없음 — 갱신 계약에만 적용." },
      { icon: "🏛️", title: "지자체 조례", content: "서울시 등 일부 지자체는 5%보다 낮은 상한 적용 가능. 물건 소재지 지자체 조례 확인 필요." },
      { icon: "⚖️", title: "초과 인상 시 효력", content: "5% 초과 합의도 초과분은 무효. 임차인은 초과분 반환 청구 가능. 임대인은 법적 책임 발생." },
    ],
    calculator: "cap",
  },
  {
    id: "convert",
    icon: "💱",
    title: "전월세 전환율",
    law: "주택임대차보호법 제7조의2",
    badge: "법정 전환율",
    badgeColor: C.amber,
    summary: "전세를 월세로 전환 시 법정 전환율(현재 연 6%) 이내로만 산정 가능.",
    questions: [
      { id: "v1", q: "전세를 월세로 전환하거나 보증금을 조정하려 하나요?", risk: "high" },
      { id: "v2", q: "법정 전환율(연 6%)을 초과한 월세를 요구했나요?", risk: "high" },
    ],
    guides: [
      { icon: "📐", title: "전환율 계산식", content: "월세 = (전환 전세금) × 전환율(6%) ÷ 12. 예: 전세 1억 → 월세 = 1억 × 6% ÷ 12 = 50만원" },
      { icon: "📅", title: "현재 법정 전환율", content: "연 6% (2024년 기준). 한국은행 기준금리 + 대통령령 이율로 산정. 기준금리 변동 시 달라질 수 있음." },
      { icon: "🔄", title: "월세 → 전세 전환", content: "보증금 전환도 동일 비율 적용. 임차인 동의 없이 임대인이 일방 전환 불가." },
      { icon: "⚠️", title: "초과 전환 시 제재", content: "법정 전환율 초과 월세 약정도 초과분 무효. 임차인은 초과 납부액 반환 청구 가능." },
    ],
    calculator: "convert",
  },
  {
    id: "dispute",
    icon: "⚔️",
    title: "분쟁 대응 가이드",
    law: "주택임대차분쟁조정위원회",
    badge: "대응 매뉴얼",
    badgeColor: C.rose,
    summary: "임대료 미납, 원상복구, 계약 해지 등 주요 분쟁 유형별 임대인 대응 절차.",
    questions: [
      { id: "d1", q: "임차인이 2개월 이상 차임을 미납했나요?", risk: "high" },
      { id: "d2", q: "임차인이 무단으로 제3자에게 전대했나요?", risk: "high" },
      { id: "d3", q: "계약 종료 후에도 퇴거를 거부하고 있나요?", risk: "high" },
      { id: "d4", q: "원상복구 의무 이행을 거부하고 있나요?", risk: "medium" },
    ],
    guides: [
      { icon: "📨", title: "차임 연체 대응", content: "① 내용증명 발송 (2기 연체 사실 통지) → ② 3기 연체 시 계약 해지 통보 → ③ 명도소송 또는 지급명령 신청." },
      { icon: "🚪", title: "명도(퇴거) 절차", content: "계약 해지 통보 → 임차인 미이행 시 임대차분쟁조정위원회 조정 신청 또는 법원 명도소송. 임의 퇴거 강제는 불법." },
      { icon: "🔧", title: "원상복구 분쟁", content: "입주 전 사진·영상 증거 확보가 핵심. 통상 마모는 임대인 부담, 임차인 과실 파손만 청구 가능. 분쟁조정위 활용." },
      { icon: "🏛️", title: "빠른 분쟁 해결", content: "주택임대차분쟁조정위원회 무료 조정 신청 가능 (소송 전 단계). 60일 이내 조정 완료. 법원 소송보다 빠르고 저렴." },
    ],
  },
];

export default function LeaseCheckPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState({});
  const [openSections, setOpenSections] = useState({ renewal: true, cap: false, convert: false, dispute: false });

  // 계산기 상태
  const [capCurrent, setCapCurrent] = useState("");
  const [convertDeposit, setConvertDeposit] = useState("");
  const [convertRate, setConvertRate] = useState("6");

  const toggle = (id) => setOpenSections(s => ({ ...s, [id]: !s[id] }));
  const setAnswer = (qid, val) => setAnswers(a => ({ ...a, [qid]: val }));

  const riskColor = { high: C.rose, medium: C.amber, low: C.emerald };
  const riskLabel = { high: "고위험", medium: "주의", low: "안전" };

  // 섹션별 위험도 계산
  const sectionRisk = (section) => {
    const qs = section.questions;
    const highRisk = qs.filter(q => q.risk === "high" && answers[q.id] === "yes");
    if (highRisk.length > 0) return "high";
    const medRisk = qs.filter(q => q.risk === "medium" && answers[q.id] === "yes");
    if (medRisk.length > 0) return "medium";
    return null;
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 800, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>

      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{ fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0, fontWeight: 600 }}>
          ← 대시보드로
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>LEGAL GUIDE</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: C.navy, letterSpacing: "-.5px", marginBottom: 6 }}>임대차 3법 가이드</h1>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              계약갱신청구권 · 전월세상한제 · 전환율 · 분쟁 대응<br/>
              <span style={{ color: C.emerald, fontWeight: 700 }}>✓ 무료 제공</span> — 임대인이 꼭 알아야 할 법적 권리와 의무
            </p>
          </div>
          <div style={{ background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: 12, padding: "10px 16px", fontSize: 12, color: C.accent, fontWeight: 700, flexShrink: 0 }}>
            📋 진단 후 대응 가이드 확인
          </div>
        </div>
      </div>

      {/* 알림 배너 */}
      <div style={{ background: "rgba(232,150,10,0.07)", border: "1px solid rgba(232,150,10,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 12, color: "#9a6500" }}>
        ⚠️ 이 가이드는 참고용이며, 구체적 법적 판단은 반드시 변호사·법무사에게 문의하세요.
      </div>

      {/* 종합 진단 결과 (체크리스트 답변 시 표시) */}
      {(() => {
        const allQs = SECTIONS.flatMap(s => s.questions.map(q => ({ ...q, sectionId: s.id, sectionTitle: s.title, sectionIcon: s.icon })));
        const totalQs = allQs.length;
        const answeredQs = allQs.filter(q => answers[q.id]);
        const yesQs = answeredQs.filter(q => answers[q.id] === "yes");
        const highRisks = yesQs.filter(q => q.risk === "high");
        const medRisks = yesQs.filter(q => q.risk === "medium");
        if (answeredQs.length === 0) return null;

        const overallRisk = highRisks.length > 0 ? "high" : medRisks.length > 0 ? "medium" : "low";
        const overallLabel = overallRisk === "high" ? "고위험 — 즉시 대응 필요" : overallRisk === "medium" ? "주의 — 신중한 검토 권장" : "안전 — 일반 운영 가능";
        const overallColor = riskColor[overallRisk];

        // 답변 패턴별 맞춤 권장사항
        const recommendations = [];
        if (answers.r1 === "yes" && answers.r3 !== "yes" && answers.r4 !== "yes") {
          recommendations.push({ icon: "📝", title: "갱신 거절 사유 검토 필요", desc: "임차인이 갱신 청구했고 정당한 거절 사유가 명확하지 않습니다. 거절 시 손해배상 청구 가능. 변호사 상담 권장." });
        }
        if (answers.r3 === "yes") {
          recommendations.push({ icon: "🏠", title: "실거주 거절 통보 시 주의", desc: "내용증명으로 서면 통보. 거절 후 2년 내 제3자에게 임대 시 손해배상 의무 발생합니다." });
        }
        if (answers.c1 === "yes" && answers.c2 === "yes") {
          recommendations.push({ icon: "📊", title: "5% 초과 인상 — 무효 위험", desc: "갱신 계약에서 5% 초과 인상은 초과분 무효. 임차인이 반환 청구 가능. 5% 이내로 조정하세요." });
        }
        if (answers.v1 === "yes" && answers.v2 === "yes") {
          recommendations.push({ icon: "💱", title: "전환율 초과 — 법정 한도 위반", desc: "법정 전환율(연 6%) 초과는 무효. 임차인이 초과분 반환 청구 가능합니다." });
        }
        if (answers.d1 === "yes") {
          recommendations.push({ icon: "📨", title: "차임 연체 — 내용증명 권장", desc: "2기 연체 시 통지, 3기 연체 시 계약 해지 가능. 내용증명으로 명확히 통보하세요." });
        }
        if (answers.d2 === "yes") {
          recommendations.push({ icon: "🚪", title: "무단 전대 — 즉시 대응", desc: "동의 없는 전대는 계약 해지 사유. 내용증명 후 명도 절차 진행 가능." });
        }
        if (answers.d3 === "yes") {
          recommendations.push({ icon: "⚖️", title: "퇴거 거부 — 명도소송", desc: "임의 강제 퇴거는 불법. 분쟁조정위 또는 법원 명도소송으로 진행." });
        }
        if (answers.d4 === "yes") {
          recommendations.push({ icon: "🔧", title: "원상복구 분쟁", desc: "입주 전후 사진·영상 증거 확보. 통상 마모는 임대인 부담, 임차인 과실만 청구 가능." });
        }
        if (recommendations.length === 0 && highRisks.length === 0 && medRisks.length === 0) {
          recommendations.push({ icon: "✅", title: "현재 특별한 법적 위험 없음", desc: "답변 기준으로 즉각 대응이 필요한 사안은 없습니다. 정기적으로 다시 점검하세요." });
        }

        return (
          <div style={{
            background: `linear-gradient(135deg, ${overallColor}10, ${overallColor}05)`,
            border: `1.5px solid ${overallColor}40`,
            borderRadius: 16,
            padding: "22px 24px",
            marginBottom: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: C.muted, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>📋 종합 진단 결과</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: overallColor, lineHeight: 1.3 }}>{overallLabel}</p>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{answeredQs.length}/{totalQs} 문항 답변 완료</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {highRisks.length > 0 && (
                  <div style={{ background: `${C.rose}15`, color: C.rose, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                    🔴 고위험 {highRisks.length}건
                  </div>
                )}
                {medRisks.length > 0 && (
                  <div style={{ background: `${C.amber}15`, color: C.amber, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                    🟡 주의 {medRisks.length}건
                  </div>
                )}
              </div>
            </div>

            {/* 권장 조치 */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, marginBottom: 10 }}>📌 권장 조치 ({recommendations.length}건)</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recommendations.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: i < recommendations.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 3 }}>{r.title}</p>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 다음 단계 */}
            {(highRisks.length > 0 || medRisks.length > 0) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => router.push("/dashboard/certified")}
                  style={{ padding: "11px 18px", background: C.navy, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  📨 내용증명 작성
                </button>
                <a href="https://www.hldcc.or.kr" target="_blank" rel="noopener noreferrer"
                  style={{ padding: "11px 18px", background: "rgba(15,165,115,0.1)", color: C.emerald, border: `1px solid ${C.emerald}40`, borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  🏛️ 분쟁조정위 신청
                </a>
                <a href="https://www.klac.or.kr" target="_blank" rel="noopener noreferrer"
                  style={{ padding: "11px 18px", background: "rgba(79,70,229,0.08)", color: C.accent, border: `1px solid ${C.accent}40`, borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  📞 무료 법률 상담 (132)
                </a>
              </div>
            )}
          </div>
        );
      })()}

      {/* 섹션들 */}
      {SECTIONS.map((section) => {
        const open = openSections[section.id];
        const risk = sectionRisk(section);
        const answeredCount = section.questions.filter(q => answers[q.id]).length;

        return (
          <div key={section.id} className="card" style={{ marginBottom: 14, overflow: "hidden" }}>

            {/* 섹션 헤더 */}
            <div onClick={() => toggle(section.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", cursor: "pointer", background: open ? "rgba(26,39,68,0.02)" : C.surface }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${section.badgeColor}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {section.icon}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>{section.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: section.badgeColor, background: `${section.badgeColor}15`, padding: "2px 8px", borderRadius: 20 }}>{section.badge}</span>
                    {risk && <span style={{ fontSize: 10, fontWeight: 700, color: riskColor[risk], background: `${riskColor[risk]}15`, padding: "2px 8px", borderRadius: 20 }}>⚠ {riskLabel[risk]}</span>}
                  </div>
                  <p style={{ fontSize: 11, color: C.muted }}>{section.law} · {answeredCount}/{section.questions.length} 문항 확인</p>
                </div>
              </div>
              <span style={{ fontSize: 18, color: C.muted, transition: "transform .2s", transform: open ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>›</span>
            </div>

            {open && (
              <div style={{ borderTop: `1px solid ${C.border}` }}>

                {/* 요약 */}
                <div style={{ padding: "14px 20px", background: `${section.badgeColor}08`, borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 13, color: C.navy, lineHeight: 1.7 }}>{section.summary}</p>
                </div>

                {/* 진단 질문 */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>진단 체크리스트</p>
                  {section.questions.map((q, i) => {
                    const ans = answers[q.id];
                    const isYes = ans === "yes";
                    const showRisk = isYes && q.risk !== "low";
                    return (
                      <div key={q.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: i < section.questions.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: riskColor[q.risk], background: `${riskColor[q.risk]}15`, padding: "1px 6px", borderRadius: 10 }}>{riskLabel[q.risk]}</span>
                          </div>
                          <p style={{ fontSize: 13, color: C.navy, fontWeight: 500, lineHeight: 1.5 }}>{i + 1}. {q.q}</p>
                          {showRisk && <p style={{ fontSize: 11, color: riskColor[q.risk], marginTop: 4, fontWeight: 600 }}>⚠ 아래 가이드를 꼭 확인하세요</p>}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          {[{ v: "yes", l: "예" }, { v: "no", l: "아니오" }].map(({ v, l }) => (
                            <button key={v} onClick={() => setAnswer(q.id, v)}
                              style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${ans === v ? (v === "yes" ? C.rose : C.emerald) : C.border}`, background: ans === v ? (v === "yes" ? "rgba(232,68,90,0.08)" : "rgba(15,165,115,0.08)") : "transparent", color: ans === v ? (v === "yes" ? C.rose : C.emerald) : C.muted }}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 계산기 (해당 섹션만) */}
                {section.calculator === "cap" && (
                  <div style={{ padding: "16px 20px", background: "rgba(15,165,115,0.04)", borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>📐 5% 상한 계산기</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>현재 월세 (만원)</p>
                        <input type="number" value={capCurrent} onChange={e => setCapCurrent(e.target.value)} placeholder="예: 100" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.navy, background: C.faint }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                        {capCurrent > 0 ? (
                          <div style={{ background: "rgba(15,165,115,0.1)", borderRadius: 10, padding: "10px 14px" }}>
                            <p style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>최대 인상 가능액</p>
                            <p style={{ fontSize: 20, fontWeight: 900, color: C.emerald }}>{calcMaxRent(Number(capCurrent))}만원</p>
                            <p style={{ fontSize: 11, color: C.muted }}>+{calcMaxRent(Number(capCurrent)) - Number(capCurrent)}만원 인상 (5%)</p>
                          </div>
                        ) : (
                          <div style={{ background: C.faint, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                            <p style={{ fontSize: 12, color: C.muted }}>월세 입력 시 계산</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {section.calculator === "convert" && (
                  <div style={{ padding: "16px 20px", background: "rgba(232,150,10,0.04)", borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>📐 전월세 전환 계산기</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div>
                        <p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>전환 전세금 (만원)</p>
                        <input type="number" value={convertDeposit} onChange={e => setConvertDeposit(e.target.value)} placeholder="예: 10000" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.navy, background: C.faint }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>전환율 (%)</p>
                        <input type="number" value={convertRate} onChange={e => setConvertRate(e.target.value)} placeholder="6" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.navy, background: C.faint }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                        {convertDeposit > 0 ? (
                          <div style={{ background: "rgba(232,150,10,0.1)", borderRadius: 10, padding: "10px 14px" }}>
                            <p style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>월세 상당액</p>
                            <p style={{ fontSize: 20, fontWeight: 900, color: C.amber }}>{calcConversion(Number(convertDeposit), 0, Number(convertRate))}만원/월</p>
                            <p style={{ fontSize: 11, color: C.muted }}>법정 한도 기준</p>
                          </div>
                        ) : (
                          <div style={{ background: C.faint, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                            <p style={{ fontSize: 12, color: C.muted }}>금액 입력 시 계산</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 대응 가이드 */}
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>실전 대응 가이드</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                    {section.guides.map((g, i) => (
                      <div key={i} style={{ background: C.faint, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                          <span style={{ fontSize: 16 }}>{g.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{g.title}</span>
                        </div>
                        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>{g.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        );
      })}

      {/* 관련 기관 */}
      <div className="card" style={{ padding: "20px", marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>관련 기관 및 상담</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {[
            { icon: "🏛️", name: "주택임대차분쟁조정위원회", desc: "무료 분쟁 조정 · 60일 처리", url: "https://www.hldcc.or.kr" },
            { icon: "📞", name: "법률홈닥터 (대한법률구조공단)", desc: "무료 법률 상담 · 132", url: "https://www.klac.or.kr" },
            { icon: "🏢", name: "국토교통부 임대차 신고", desc: "전월세 신고 의무 (보증금 6000만↑)", url: "https://rtms.molit.go.kr" },
            { icon: "📋", name: "전월세 신고제", desc: "계약일로부터 30일 이내 신고", url: "https://rtms.molit.go.kr" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "12px 14px", background: C.faint, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 2 }}>{item.name}</p>
                <p style={{ fontSize: 11, color: C.muted }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 내용증명 바로가기 */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},#2d4270)`, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => router.push("/dashboard/certified")}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 4 }}>📨 내용증명 바로 작성하기</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>분쟁 발생 시 법적 효력 있는 내용증명을 즉시 발송하세요</p>
        </div>
        <span style={{ fontSize: 22, color: "rgba(255,255,255,0.7)" }}>→</span>
      </div>
    </div>
  );
}
