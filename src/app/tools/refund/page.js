"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import SiteFooter from "../../../components/SiteFooter";

// 무료 공개 도구: 월세 세액공제(월세 환급) 계산기 — 세입자 대상
// 세입자 유입 → "임대인이 온리를 쓰면 납부확인서 즉시 발급" → 임대인 추천 루프
// 기준: 2026년 현행 조특법 (2026-08 언론 보도 기준) — 개정 시 갱신 필요

const NAVY = "#1a2744";
const BASIS = "2026년 8월";

function Field({ label, hint, ...props }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 6 }}>{label}{hint && <span style={{ fontWeight: 500, marginLeft: 6, color: "#b0b0c0" }}>{hint}</span>}</p>
      <input {...props} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: NAVY, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
    </div>
  );
}

export default function RentRefundPage() {
  const [monthlyRent, setMonthlyRent] = useState("");
  const [salary, setSalary] = useState("");

  const result = useMemo(() => {
    const rent = Number(monthlyRent || 0);
    const sal = Number(salary || 0);
    if (!rent || !sal) return null;
    if (sal > 8000) return { eligible: false, reason: "총급여 8,000만원 초과 시 월세 세액공제 대상이 아닙니다." };
    const rate = sal <= 5500 ? 0.17 : 0.15;
    const annualRent = rent * 12;
    const capped = Math.min(annualRent, 1000); // 대상 월세 한도 연 1,000만원
    const refund = Math.round(capped * rate);
    return { eligible: true, rate, annualRent, capped, refund, overCap: annualRent > 1000 };
  }, [monthlyRent, salary]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 60px", width: "100%", boxSizing: "border-box" }}>
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(145deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: NAVY }}>온리</span>
          </Link>
          <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: NAVY, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            월세 환급 <span className="gradient-text-2">얼마나 받을 수 있을까?</span>
          </h1>
          <p style={{ fontSize: 14, color: "#6a6a7a", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 14px" }}>
            월세 세액공제로 <b style={{ color: NAVY }}>연 최대 170만원</b>을 돌려받을 수 있습니다.<br />
            조건 확인부터 예상 환급액 계산, 신청 방법까지 무료로 정리했습니다.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <span className="chip">🧮 {BASIS} 세법 기준</span>
            <span className="chip">🆓 로그인 불필요</span>
          </div>
        </div>

        {/* 계산기 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "22px 20px", marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, marginBottom: 12 }}>💰 예상 환급액 계산</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <Field label="월세 (만원)" inputMode="numeric" placeholder="60" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value.replace(/[^0-9]/g, ""))} />
            <Field label="연간 총급여 (만원)" inputMode="numeric" placeholder="4500" value={salary} onChange={(e) => setSalary(e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
          {result && (
            result.eligible ? (
              <div style={{ background: "rgba(15,165,115,0.06)", border: "1.5px solid rgba(15,165,115,0.3)", borderRadius: 14, padding: "16px 18px" }}>
                <p style={{ fontSize: 12, color: "#065f46", fontWeight: 700, marginBottom: 4 }}>예상 연간 환급액 (공제율 {Math.round(result.rate * 100)}%)</p>
                <p className="num" style={{ fontSize: 28, fontWeight: 900, color: "#0fa573", margin: 0 }}>약 {result.refund.toLocaleString()}만원</p>
                <p style={{ fontSize: 11.5, color: "#4a6a5a", margin: "6px 0 0", lineHeight: 1.7 }}>
                  연 월세 {result.annualRent.toLocaleString()}만원 중 한도 {result.capped.toLocaleString()}만원 × {Math.round(result.rate * 100)}%
                  {result.overCap && " · 연 1,000만원 초과분은 공제 대상에서 제외됩니다"}
                </p>
              </div>
            ) : (
              <div style={{ background: "rgba(232,68,90,0.05)", border: "1.5px solid rgba(232,68,90,0.25)", borderRadius: 14, padding: "14px 18px" }}>
                <p style={{ fontSize: 12.5, color: "#8a2a3a", margin: 0, lineHeight: 1.7 }}>{result.reason} 다만 현금영수증(주택임차료) 소득공제는 소득 무관하게 신청할 수 있습니다.</p>
              </div>
            )
          )}
        </div>

        {/* 조건 체크리스트 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "22px 20px", marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, marginBottom: 12 }}>✅ 공제 조건 (모두 충족해야 합니다)</p>
          {[
            ["무주택 세대주 (또는 세대주가 공제받지 않는 세대원)", "12월 31일 기준 세대 전원 무주택"],
            ["총급여 8,000만원 이하 (종합소득 7,000만원 이하)", "5,500만원 이하는 공제율 17%, 초과~8,000만원은 15%"],
            ["국민주택규모(85㎡ 이하) 또는 기준시가 4억원 이하 주택", "오피스텔·고시원 포함"],
            ["임대차계약서 주소지에 전입신고 완료", "전입신고가 안 되어 있으면 공제 불가"],
          ].map(([t, s]) => (
            <div key={t} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ color: "#0fa573", fontWeight: 900, flexShrink: 0 }}>✓</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0 }}>{t}</p>
                <p style={{ fontSize: 11.5, color: "#8a8a9a", margin: "2px 0 0" }}>{s}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 8·3 개편 예고 */}
        <Link href="/policy" style={{ textDecoration: "none" }}>
          <div style={{ background: "rgba(201,146,10,0.06)", border: "1.5px solid rgba(201,146,10,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ fontSize: 22 }}>🏛️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: NAVY, margin: 0 }}>2027년부터 더 커집니다 (8·3 세제개편안)</p>
              <p style={{ fontSize: 11.5, color: "#8a7a4a", margin: "3px 0 0", lineHeight: 1.6 }}>공제 대상 한도 연 1,000만 → 1,200만원 · 15~34세 청년은 총급여 무관 17% (2027~2029, 국회 통과 전 정부안)</p>
            </div>
            <span style={{ fontSize: 13, color: "#c9920a", fontWeight: 800 }}>→</span>
          </div>
        </Link>

        {/* 신청 방법 */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "22px 20px", marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, marginBottom: 12 }}>📝 신청 방법 · 필요 서류</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 14 }}>
            {[
              { n: "1", t: "재직 중 — 연말정산", d: "1~2월 연말정산 때 회사에 서류를 제출하면 2~3월 급여에 반영됩니다." },
              { n: "2", t: "놓쳤다면 — 경정청구", d: "홈택스에서 최근 5년치까지 소급 신청할 수 있습니다. 홈택스 → 신고/납부 → 종합소득세 → 경정청구." },
              { n: "3", t: "필요 서류 3가지", d: "① 임대차계약서 사본 ② 주민등록등본 ③ 월세 납부 증빙(계좌이체 내역·납부확인서)" },
            ].map((s) => (
              <div key={s.n} style={{ background: "#faf9f6", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 14px" }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: NAVY, color: "#fff", fontSize: 13, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>{s.n}</div>
                <p style={{ fontSize: 13, fontWeight: 800, color: NAVY, margin: "0 0 4px" }}>{s.t}</p>
                <p style={{ fontSize: 11.5, color: "#6a6a7a", lineHeight: 1.7, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#6a6a7a", lineHeight: 1.7, margin: 0 }}>
            💡 집주인 동의는 필요 없습니다. 계약서와 납부 증빙만 있으면 신청할 수 있고, 임대인에게 통보되는 불이익도 없습니다.
          </p>
        </div>

        {/* 온리 연결 CTA — 양방향 */}
        <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 16, padding: "24px 22px", color: "#fff", marginBottom: 40 }}>
          <p style={{ fontSize: 15, fontWeight: 900, margin: "0 0 6px" }}>납부 증빙, 매년 만들기 번거로우셨죠?</p>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, margin: "0 0 14px" }}>
            임대인이 온리(무료)로 관리하면 세입자는 <b style={{ color: "#fff" }}>납부내역 확인서를 포털에서 즉시 발급</b>받을 수 있습니다.<br />
            집주인에게 링크 하나만 공유해보세요 — 임대인도 수금·계약 관리가 전부 무료입니다.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/login?mode=signup" className="btn" style={{ background: "#fff", color: NAVY, fontWeight: 800, textDecoration: "none" }}>임대인이신가요? 무료 시작 →</Link>
            <Link href="/" className="btn btn-ghost" style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)", textDecoration: "none" }}>온리 소개 보기</Link>
          </div>
        </div>

        {/* FAQ */}
        <h2 style={{ fontSize: 20, fontWeight: 900, color: NAVY, marginBottom: 16 }}>자주 묻는 질문</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[
            { q: "집주인이 싫어하지 않을까요?", a: "월세 세액공제는 임차인의 법적 권리이며 임대인 동의가 필요 없습니다. 신청해도 임대인에게 별도 통보가 가지 않고, 등록임대주택이 아니어도 신청 가능합니다." },
            { q: "이사한 집도 신청되나요?", a: "네. 해당 기간에 실제 거주(전입신고)하며 낸 월세라면 이전 주소지 월세도 경정청구로 최근 5년까지 소급 신청할 수 있습니다." },
            { q: "관리비도 공제되나요?", a: "아니요, 공제 대상은 월세(임차료)에 한정됩니다. 계약서에 월세와 관리비가 구분되어 있어야 유리합니다." },
            { q: "현금영수증 소득공제와 뭐가 다른가요?", a: "월세 세액공제는 세금을 직접 깎아주는 것(15~17%)이고, 현금영수증은 소득공제입니다. 둘 중 하나만 선택 가능하며 일반적으로 조건이 되면 세액공제가 훨씬 유리합니다." },
          ].map((f) => (
            <details key={f.q} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 18px" }}>
              <summary style={{ fontSize: 13.5, fontWeight: 800, color: NAVY, cursor: "pointer" }}>{f.q}</summary>
              <p style={{ fontSize: 12.5, color: "#6a6a7a", lineHeight: 1.8, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>

        <p style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.7, textAlign: "center" }}>
          ※ {BASIS} 기준 정리이며 세법 개정에 따라 달라질 수 있습니다. 최종 공제 여부는 국세청·홈택스 기준을 따릅니다.
        </p>
      </div>

      <SiteFooter />
    </div>
  );
}
