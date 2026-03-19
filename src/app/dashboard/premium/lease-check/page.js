"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const C = { navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", purple:"#5b4fcf", surface:"#ffffff", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4" };

const CHECKS = [
  {
    id: "renewal",
    q: "계약갱신청구권이 사용됐나요?",
    desc: "임차인이 계약 종료 2개월 전까지 갱신을 요청할 수 있는 권리",
    yes: { label:"사용됨", color:C.rose, result:"세입자에게 2년 연장 의무가 발생합니다. 정당한 사유 없이 거절 시 손해배상 청구 위험이 있습니다.", action:"법무사 또는 변호사에게 갱신 거절 요건 확인 권장" },
    no:  { label:"미사용", color:C.emerald, result:"재계약 여부를 자유롭게 협의할 수 있습니다. 보증금·월세 조건도 시세에 맞게 조정 가능합니다.", action:"계약 종료 6개월~2개월 전 사이에 계약 갱신 거절 통보 필요" },
  },
  {
    id: "cap",
    q: "전월세 상한제 적용 대상인가요?",
    desc: "주거용 건물 임대차 계약 갱신 시 임대료 5% 이내 인상만 허용",
    yes: { label:"적용됨", color:C.amber, result:"갱신 계약 시 기존 임대료 대비 5% 이내 인상만 가능합니다. 초과 인상 시 계약이 무효가 될 수 있습니다.", action:"인상률 = (신규 임대료 - 기존 임대료) ÷ 기존 임대료 × 100" },
    no:  { label:"미적용", color:C.emerald, result:"신규 계약이거나 비주거 용도 물건인 경우 상한제 적용을 받지 않습니다. 시세 반영 가능합니다.", action:"비주거 용도 변경 시에도 실사용 목적 확인 필요" },
  },
  {
    id: "conversion",
    q: "전세를 월세로 전환하나요?",
    desc: "전세금의 일부를 월세로 전환할 때 법정 전환율 적용",
    yes: { label:"전환 예정", color:C.amber, result:"법정 전환율은 기준금리 + 2% (현재 약 5.5% 수준)입니다. 이를 초과하는 전환율은 법적으로 무효입니다.", action:"월 전환 임대료 = 전환 보증금 × 전환율 ÷ 12" },
    no:  { label:"유지", color:C.emerald, result:"전세 유지 시 별도 규제 없이 계약 조건을 그대로 유지하면 됩니다.", action:"보증금 반환 시기와 방법을 계약서에 명확히 기재하세요" },
  },
  {
    id: "dispute",
    q: "임차인과 분쟁이 있나요?",
    desc: "임대료 미납, 원상복구, 계약 해지 등 분쟁 상황",
    yes: { label:"분쟁 있음", color:C.rose, result:"내용증명을 통해 법적 의사표시를 먼저 남기는 것이 중요합니다. 이후 주택임대차분쟁조정위원회를 활용할 수 있습니다.", action:"내용증명 발송 → 조정 신청 → 소액 심판 순서 권장" },
    no:  { label:"없음", color:C.emerald, result:"분쟁 예방을 위해 계약서 특약 사항을 명확히 하고, 수리 요청·수금 이력을 앱에 기록해두세요.", action:"온리 앱의 '내용증명' 기능으로 서면 발송 가능" },
  },
];

export default function LeaseCheckPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState({});
  const [expanded, setExpanded] = useState(null);

  const answered = Object.keys(answers).length;
  const risks = Object.values(answers).filter(a => a === "yes").length;

  return (
    <div className="page-in page-padding" style={{ maxWidth:720, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()}
        style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:14, padding:0 }}>
        ← 대시보드로
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#5b4fcf,#1a2744)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>⚖️</div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, letterSpacing:"-.4px" }}>임대차 3법 체크리스트</h1>
            <span style={{ fontSize:10, fontWeight:800, color:C.purple, background:"rgba(91,79,207,0.1)", padding:"3px 8px", borderRadius:6 }}>STARTER+</span>
          </div>
          <p style={{ fontSize:13, color:C.muted }}>법적 리스크를 사전에 파악하고 대응 방법을 확인하세요</p>
        </div>
      </div>

      {/* 진행 상황 */}
      {answered > 0 && (
        <div style={{ background: risks > 1 ? "rgba(232,68,90,0.06)" : "rgba(15,165,115,0.06)",
          border:`1px solid ${risks > 1 ? C.rose : C.emerald}22`, borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ fontSize:28 }}>{risks > 1 ? "⚠️" : "✅"}</span>
          <div>
            <p style={{ fontSize:14, fontWeight:800, color:C.navy }}>{answered}/{CHECKS.length}개 항목 확인 · 리스크 {risks}건</p>
            <p style={{ fontSize:12, color:C.muted }}>{risks > 1 ? "법무사 상담을 권장합니다" : "현재 법적 리스크가 낮습니다"}</p>
          </div>
        </div>
      )}

      {/* 체크 항목 */}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {CHECKS.map((c, i) => {
          const ans = answers[c.id];
          const result = ans ? c[ans] : null;
          return (
            <div key={c.id} style={{ background:C.surface, border:`1.5px solid ${result ? result.color+"30" : C.border}`, borderRadius:18, overflow:"hidden", transition:"all .2s" }}>
              {/* 헤더 */}
              <div style={{ padding:"18px 20px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${C.navy}15,${C.purple}15)`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:C.navy, flexShrink:0 }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:4 }}>{c.q}</p>
                    <p style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{c.desc}</p>
                  </div>
                </div>
                {/* 버튼 */}
                <div style={{ display:"flex", gap:10 }}>
                  {["yes","no"].map(v => (
                    <button key={v} onClick={() => setAnswers(a => ({ ...a, [c.id]: v }))}
                      style={{ flex:1, padding:"11px 0", borderRadius:12, cursor:"pointer", fontSize:14, fontWeight:800, transition:"all .15s",
                        background: ans===v ? (v==="yes" ? c.yes.color : c.no.color) : C.faint,
                        color: ans===v ? "#fff" : C.muted,
                        border: ans===v ? "none" : `1px solid ${C.border}` }}>
                      {v==="yes" ? "예" : "아니오"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 결과 */}
              {result && (
                <div style={{ padding:"16px 20px", borderTop:`1px solid ${result.color}20`, background:`${result.color}06` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:result.color, display:"inline-block", flexShrink:0 }} />
                    <span style={{ fontSize:12, fontWeight:800, color:result.color }}>{result.label}</span>
                  </div>
                  <p style={{ fontSize:13, color:C.navy, lineHeight:1.7, marginBottom:10 }}>{result.result}</p>
                  <div style={{ background:result.color+"12", borderRadius:10, padding:"10px 14px", display:"flex", gap:8, alignItems:"flex-start" }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
                    <p style={{ fontSize:12, color:C.navy, fontWeight:600, lineHeight:1.6 }}>{result.action}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:20, lineHeight:1.7 }}>
        ※ 이 체크리스트는 참고용이며, 법적 판단은 변호사·법무사에게 문의하세요.
      </p>
    </div>
  );
}
