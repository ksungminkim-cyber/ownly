"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { supabase } from "../../../../lib/supabase";

// 세무사 제출용 연간 임대 수익 보고서 — 인쇄 최적화 A4 포맷

const TAX_BRACKETS = [
  { cap: 1400, rate: 0.06, deduct: 0 },
  { cap: 5000, rate: 0.15, deduct: 126 },
  { cap: 8800, rate: 0.24, deduct: 576 },
  { cap: 15000, rate: 0.35, deduct: 1544 },
  { cap: 30000, rate: 0.38, deduct: 1994 },
  { cap: 50000, rate: 0.40, deduct: 2594 },
  { cap: Infinity, rate: 0.42, deduct: 3594 },
];

function calcTax(income) {
  if (income <= 0) return 0;
  for (const b of TAX_BRACKETS) {
    if (income <= b.cap) return Math.max(0, Math.round(income * b.rate - b.deduct));
  }
  return 0;
}

export default function AnnualTaxReportPage() {
  const router = useRouter();
  const { tenants, payments, user } = useApp();
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [repairs, setRepairs] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [r, l] = await Promise.all([
        supabase.from("repairs").select("*").eq("user_id", user.id),
        supabase.from("ledger").select("*").eq("user_id", user.id),
      ]);
      setRepairs(r.data || []);
      setLedger(l.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const landlord = {
    name: user?.user_metadata?.landlord_name || user?.user_metadata?.nickname || "",
    addr: user?.user_metadata?.landlord_addr || "",
    businessNo: user?.user_metadata?.business_no || "",
    phone: user?.user_metadata?.phone || "",
  };

  // 연도별 집계
  const yearPayments = payments.filter(p => (p.year || new Date().getFullYear()) === year);
  const yearRepairs = repairs.filter(r => new Date(r.date).getFullYear() === year);
  const yearLedger = ledger.filter(l => new Date(l.date).getFullYear() === year);

  const rentIncomeByTenant = tenants.map(t => {
    const paid = yearPayments.filter(p => p.tid === t.id && p.status === "paid");
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return paid.filter(p => p.month === m).reduce((s, p) => s + (p.amt || p.amount || 0), 0);
    });
    const total = monthly.reduce((s, v) => s + v, 0);
    return { t, monthly, total, paidMonths: paid.length };
  });

  const totalRentIncome = rentIncomeByTenant.reduce((s, x) => s + x.total, 0);
  const otherIncome = yearLedger.filter(l => l.type === "income").reduce((s, l) => s + (l.amount || 0), 0);
  const grossIncome = totalRentIncome + otherIncome;

  // 경비 카테고리 집계 (세금 신고용 분류)
  const expenseCategories = {
    수선비: { total: 0, items: [] },
    이자비용: { total: 0, items: [] },
    보험료: { total: 0, items: [] },
    재산세: { total: 0, items: [] },
    감가상각비: { total: 0, items: [] },
    기타: { total: 0, items: [] },
  };
  yearRepairs.forEach(r => {
    expenseCategories.수선비.total += r.cost || 0;
    expenseCategories.수선비.items.push({ date: r.date, desc: `${r.category} ${r.vendor ? "· " + r.vendor : ""}`, amount: r.cost || 0 });
  });
  yearLedger.filter(l => l.type === "expense").forEach(l => {
    const cat = ["이자비용", "보험료", "재산세", "감가상각비"].includes(l.category) ? l.category : "기타";
    expenseCategories[cat].total += l.amount || 0;
    expenseCategories[cat].items.push({ date: l.date, desc: l.memo || l.category, amount: l.amount || 0 });
  });

  const totalExpense = Object.values(expenseCategories).reduce((s, c) => s + c.total, 0);
  const netIncome = Math.max(0, grossIncome - totalExpense);
  const estimatedTax = calcTax(netIncome);
  const localTax = Math.round(estimatedTax * 0.1);

  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
        <p style={{ color: "#8a8a9a" }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Malgun Gothic','Apple SD Gothic Neo','Pretendard',sans-serif", color: "#1a1a2e", background: "#fff" }}>
      {/* 툴바 (인쇄 시 숨김) */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #ebe9e3", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <button onClick={() => router.push("/dashboard/reports")}
          style={{ padding: "8px 14px", borderRadius: 8, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          ← 리포트 목록
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 700 }}>귀속 연도</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ebe9e3", fontSize: 13, fontWeight: 700, color: "#1a2744", background: "#fff", cursor: "pointer" }}>
            {[0, 1, 2, 3, 4].map(i => { const y = new Date().getFullYear() - i; return <option key={y} value={y}>{y}년</option>; })}
          </select>
          <button onClick={() => window.print()}
            style={{ padding: "9px 22px", borderRadius: 9, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            🖨️ 인쇄 / PDF 저장
          </button>
        </div>
      </div>

      {/* 인쇄 영역 */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 44px 80px", lineHeight: 1.7 }}>
        {/* 문서 헤더 */}
        <div style={{ textAlign: "center", borderBottom: "3px double #1a2744", paddingBottom: 22, marginBottom: 26 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2.5px", color: "#8a8a9a", marginBottom: 6 }}>ANNUAL TAX REPORT · 세무사 제출용</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: 4, color: "#1a2744" }}>{year}년 임대 수익 연간 결산</h1>
          <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 6 }}>
            기준 기간: {year}.01.01 ~ {year}.12.31 · 출력일: {today}
          </p>
        </div>

        {/* 임대인 정보 */}
        <section style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 8, borderLeft: "4px solid #1a2744", paddingLeft: 10 }}>1. 임대인 정보</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <tbody>
              <tr style={{ borderTop: "1px solid #b0b0c0", borderBottom: "1px solid #d0d0d8" }}>
                <td style={{ padding: "9px 12px", background: "#f8f7f4", fontWeight: 700, width: 100, borderRight: "1px solid #d0d0d8" }}>성명</td>
                <td style={{ padding: "9px 14px" }}>{landlord.name || "\u3000\u3000\u3000\u3000\u3000"}</td>
                <td style={{ padding: "9px 12px", background: "#f8f7f4", fontWeight: 700, width: 80, borderLeft: "1px solid #d0d0d8", borderRight: "1px solid #d0d0d8" }}>연락처</td>
                <td style={{ padding: "9px 14px" }}>{landlord.phone || "\u3000\u3000\u3000\u3000\u3000"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #d0d0d8" }}>
                <td style={{ padding: "9px 12px", background: "#f8f7f4", fontWeight: 700, borderRight: "1px solid #d0d0d8" }}>주소</td>
                <td colSpan="3" style={{ padding: "9px 14px" }}>{landlord.addr || "\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000"}</td>
              </tr>
              {landlord.businessNo && (
                <tr style={{ borderBottom: "1px solid #b0b0c0" }}>
                  <td style={{ padding: "9px 12px", background: "#f8f7f4", fontWeight: 700, borderRight: "1px solid #d0d0d8" }}>사업자번호</td>
                  <td colSpan="3" style={{ padding: "9px 14px" }}>{landlord.businessNo}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* 요약 */}
        <section style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 8, borderLeft: "4px solid #1a2744", paddingLeft: 10 }}>2. 손익 요약</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              <tr style={{ borderTop: "2px solid #1a2744", borderBottom: "1px solid #d0d0d8" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, background: "#f8f7f4", width: "60%" }}>총 임대 수입 (주택·상가·토지)</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700 }}>{totalRentIncome.toLocaleString()}만원</td>
              </tr>
              {otherIncome > 0 && (
                <tr style={{ borderBottom: "1px solid #d0d0d8" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, background: "#f8f7f4" }}>기타 수입</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700 }}>{otherIncome.toLocaleString()}만원</td>
                </tr>
              )}
              <tr style={{ borderBottom: "1.5px solid #1a2744" }}>
                <td style={{ padding: "10px 14px", fontWeight: 800, background: "#eef1f7" }}>총수입 합계</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#0fa573" }}>{grossIncome.toLocaleString()}만원</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #d0d0d8" }}>
                <td style={{ padding: "10px 14px", background: "#f8f7f4" }}>(-) 필요경비</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#e8445a" }}>- {totalExpense.toLocaleString()}만원</td>
              </tr>
              <tr style={{ borderBottom: "2px solid #1a2744" }}>
                <td style={{ padding: "12px 14px", fontWeight: 800, background: "#eef1f7" }}>순 임대소득 (과세표준)</td>
                <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 900, fontSize: 16 }}>{netIncome.toLocaleString()}만원</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #d0d0d8" }}>
                <td style={{ padding: "10px 14px", background: "#f8f7f4" }}>예상 종합소득세 (참고치)</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700 }}>{estimatedTax.toLocaleString()}만원</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #b0b0c0" }}>
                <td style={{ padding: "10px 14px", background: "#f8f7f4" }}>예상 지방소득세 (참고치)</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700 }}>{localTax.toLocaleString()}만원</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: 10, color: "#8a8a9a", marginTop: 6 }}>※ 세액은 단순 과세표준 × 한계세율 기반 추정치입니다. 실제 신고 시 분리과세·세액공제·건보료·인적공제 등 반영 필요.</p>
        </section>

        {/* 임차인별 월세 매트릭스 */}
        <section style={{ marginBottom: 22, pageBreakInside: "avoid" }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 8, borderLeft: "4px solid #1a2744", paddingLeft: 10 }}>3. 물건·임차인별 월별 수입 (만원)</h2>
          {rentIncomeByTenant.length === 0 ? (
            <p style={{ fontSize: 12, color: "#8a8a9a" }}>등록된 임차인이 없습니다.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#1a2744", color: "#fff" }}>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 700 }}>임차인 / 소재지</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} style={{ padding: "7px 4px", width: 38, textAlign: "right", fontWeight: 700 }}>{i + 1}월</th>
                  ))}
                  <th style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, background: "#2d4270" }}>합계</th>
                </tr>
              </thead>
              <tbody>
                {rentIncomeByTenant.map(({ t, monthly, total }, idx) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #e0e0e8", background: idx % 2 === 0 ? "#fff" : "#fafaf8" }}>
                    <td style={{ padding: "7px 8px", fontWeight: 700 }}>
                      {t.name}
                      <br/>
                      <span style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 400 }}>{t.addr}</span>
                    </td>
                    {monthly.map((v, i) => (
                      <td key={i} style={{ padding: "7px 4px", textAlign: "right", color: v > 0 ? "#1a2744" : "#c0c0cc" }}>{v > 0 ? v : "—"}</td>
                    ))}
                    <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 800, background: "#f0f2f8" }}>{total.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ background: "#eef1f7", borderTop: "2px solid #1a2744" }}>
                  <td style={{ padding: "9px 8px", fontWeight: 800 }}>월별 합계</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthSum = rentIncomeByTenant.reduce((s, x) => s + x.monthly[i], 0);
                    return <td key={i} style={{ padding: "9px 4px", textAlign: "right", fontWeight: 800 }}>{monthSum > 0 ? monthSum : "—"}</td>;
                  })}
                  <td style={{ padding: "9px 8px", textAlign: "right", fontWeight: 900, background: "#1a2744", color: "#fff" }}>{totalRentIncome.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        {/* 필요경비 상세 */}
        <section style={{ marginBottom: 22, pageBreakInside: "avoid" }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1a2744", marginBottom: 8, borderLeft: "4px solid #1a2744", paddingLeft: 10 }}>4. 필요경비 상세 (세금 신고용 분류)</h2>
          {totalExpense === 0 ? (
            <p style={{ fontSize: 12, color: "#8a8a9a" }}>등록된 경비 내역이 없습니다.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8f7f4", borderTop: "2px solid #1a2744", borderBottom: "1px solid #b0b0c0" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 800 }}>항목</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, width: 120 }}>금액 (만원)</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, width: 70 }}>비중</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(expenseCategories).filter(([, c]) => c.total > 0).map(([cat, c]) => (
                  <tr key={cat} style={{ borderBottom: "1px solid #d0d0d8" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <b>{cat}</b>
                      {c.items.length > 0 && (
                        <div style={{ fontSize: 10, color: "#8a8a9a", marginTop: 3, lineHeight: 1.5 }}>
                          {c.items.slice(0, 5).map((it, i) => (
                            <div key={i}>· {it.date?.slice(0, 10)} {it.desc} — {(it.amount || 0).toLocaleString()}만원</div>
                          ))}
                          {c.items.length > 5 && <div>… 외 {c.items.length - 5}건</div>}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, verticalAlign: "top" }}>{c.total.toLocaleString()}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#8a8a9a", verticalAlign: "top" }}>{totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0}%</td>
                  </tr>
                ))}
                <tr style={{ background: "#eef1f7", borderTop: "2px solid #1a2744" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 900 }}>필요경비 합계</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 900, color: "#e8445a" }}>{totalExpense.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 900 }}>100%</td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        {/* 법적 고지 */}
        <section style={{ padding: "12px 14px", background: "#f8f7f4", borderRadius: 6, fontSize: 10.5, color: "#6a6a7a", lineHeight: 1.8, marginBottom: 24 }}>
          ※ 본 보고서는 온리(Ownly) 임대 관리 플랫폼에 기록된 데이터를 자동 집계한 것입니다.
          실제 종합소득세 신고 시 분리과세 여부·건강보험료·세액공제·인적공제 등 추가 요소를 반영해야 합니다.
          정확한 세액 산정은 세무사와 상담하시기 바랍니다. 본 보고서의 수치는 참고용이며 법적 효력을 보증하지 않습니다.
        </section>

        {/* 서명란 */}
        <section style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, pageBreakInside: "avoid" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 24 }}>작성자 (임대인)</p>
            <div style={{ borderBottom: "1px solid #6a6a7a", paddingBottom: 4, minHeight: 30 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{landlord.name || ""} <span style={{ marginLeft: 20, color: "#8a8a9a", fontWeight: 400 }}>(인)</span></span>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 24 }}>세무 대리인 (확인)</p>
            <div style={{ borderBottom: "1px solid #6a6a7a", paddingBottom: 4, minHeight: 30 }}>
              <span style={{ fontSize: 14, color: "#8a8a9a" }}>\u3000\u3000\u3000\u3000 (인)</span>
            </div>
          </div>
        </section>

        <div style={{ textAlign: "center", fontSize: 10, color: "#a0a0b0", marginTop: 30 }}>
          온리(Ownly) 임대 자산 관리 플랫폼 · ownly.kr · 자동 생성 보고서
        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 14mm 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      `}</style>
    </div>
  );
}
