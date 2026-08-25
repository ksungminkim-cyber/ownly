"use client";
import { useState } from "react";
import Link from "next/link";
import SiteFooter from "../../../components/SiteFooter";

// 무료 공개 도구: 임대차계약서 생성기
// 로그인 불필요. 표준 조항 + 추천 특약 포함 계약서 작성 + 워터마크 미리보기/인쇄.
// 물건·세입자 연동 관리, 납부 추적은 가입으로 유도.

const NAVY = "#1a2744";
const PROPERTY_TYPES = ["아파트", "빌라·다세대", "오피스텔", "단독주택", "상가"];

// 추천 특약 — 클릭으로 계약서에 추가
const PRESET_TERMS = [
  { key: "confirm", label: "전입신고·확정일자", text: "임차인은 잔금 지급 즉시 전입신고를 하고 확정일자를 받기로 하며, 임대인은 잔금 지급일 다음 날까지 목적물에 새로운 담보권을 설정하지 아니한다." },
  { key: "report", label: "전월세신고", text: "임대인과 임차인은 계약 체결일로부터 30일 이내에 주택임대차계약 신고(전월세신고제)를 완료하기로 한다." },
  { key: "repair", label: "수선 책임", text: "보일러·배관 등 주요 설비의 노후로 인한 고장 수선은 임대인이 부담하고, 임차인의 고의·과실로 인한 파손은 임차인이 부담한다." },
  { key: "restore", label: "원상회복", text: "임차인은 계약 만료 시 목적물을 원상회복하여 인도한다. 다만 통상적인 사용에 따른 자연 마모는 예외로 한다." },
  { key: "pet", label: "반려동물", text: "임차인은 임대인의 사전 동의 없이 목적물에서 반려동물을 사육하지 아니한다." },
  { key: "sublet", label: "전대 금지", text: "임차인은 임대인의 동의 없이 목적물의 전부 또는 일부를 제3자에게 전대하거나 임차권을 양도하지 아니한다." },
];

const initForm = {
  propertyAddr: "", propertyType: "아파트", areaPyeong: "",
  deposit: "", downPayment: "", rent: "", maintenance: "", payDay: "5",
  startDate: "", endDate: "",
  landlordName: "", landlordAddr: "", landlordPhone: "",
  tenantName: "", tenantAddr: "", tenantPhone: "",
  customTerms: "",
};

function Field({ label, hint, ...props }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 6 }}>{label}{hint && <span style={{ fontWeight: 500, marginLeft: 6, color: "#b0b0c0" }}>{hint}</span>}</p>
      <input {...props} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: NAVY, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
    </div>
  );
}

const num = (v) => Number(v || 0);

export default function ContractToolPage() {
  const [form, setForm] = useState(initForm);
  const [selectedTerms, setSelectedTerms] = useState(["confirm", "report", "repair", "restore"]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleTerm = (key) => setSelectedTerms((prev) => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const isCommercial = form.propertyType === "상가";
  const overdueClause = isCommercial ? "3기" : "2기";
  const terms = [
    ...PRESET_TERMS.filter(t => selectedTerms.includes(t.key)).map(t => t.text),
    ...form.customTerms.split("\n").map(s => s.trim()).filter(Boolean),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        .ct-grid { display: grid; grid-template-columns: minmax(0,420px) minmax(0,1fr); gap: 24px; align-items: start; }
        @media (max-width: 900px) { .ct-grid { grid-template-columns: 1fr; } }
        .ct-doc { position: relative; overflow: hidden; }
        .ct-wm { position: absolute; inset: -20%; pointer-events: none; display: flex; flex-direction: column; justify-content: space-around; transform: rotate(-24deg); z-index: 5; }
        .ct-wm span { font-size: 34px; font-weight: 900; color: rgba(26,39,68,0.07); white-space: nowrap; letter-spacing: 6px; text-align: center; }
        @media print {
          body * { visibility: hidden; }
          .ct-print-area, .ct-print-area * { visibility: visible; }
          .ct-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          .ct-wm span { color: rgba(26,39,68,0.09) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 16mm; size: A4 portrait; }
        }
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 20px 60px", width: "100%", boxSizing: "border-box" }}>
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(145deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: NAVY }}>온리</span>
          </Link>
          <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: NAVY, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            임대차계약서 <span className="gradient-text-2">무료 작성</span>
          </h1>
          <p style={{ fontSize: 14, color: "#6a6a7a", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 14px" }}>
            월세·전세 계약서를 회원가입 없이 바로 작성하세요.<br />
            표준 조항과 임대인 필수 특약사항이 자동으로 포함됩니다.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <span className="chip">📋 표준 조항 자동 포함</span>
            <span className="chip">✍️ 추천 특약 원클릭</span>
            <span className="chip">🆓 로그인 불필요</span>
          </div>
        </div>

        <div className="ct-grid">
          {/* ── 왼쪽: 작성 폼 ── */}
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, margin: 0 }}>🏠 임대 목적물</p>
            <Field label="소재지" placeholder="서울시 ○○구 ○○로 45, 302호" value={form.propertyAddr} onChange={set("propertyAddr")} />
            <div>
              <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 8 }}>유형</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PROPERTY_TYPES.map((t) => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, propertyType: t }))} className={`chip ${form.propertyType === t ? "is-active" : ""}`} style={{ cursor: "pointer" }}>{t}</button>
                ))}
              </div>
            </div>
            <Field label="전용면적 (평)" hint="선택" inputMode="numeric" placeholder="24" value={form.areaPyeong} onChange={set("areaPyeong")} />

            <div style={{ height: 1, background: "#f0efe9" }} />
            <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, margin: 0 }}>💰 계약 조건</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="보증금 (만원)" inputMode="numeric" placeholder="5000" value={form.deposit} onChange={set("deposit")} />
              <Field label="계약금 (만원)" hint="선택" inputMode="numeric" placeholder="500" value={form.downPayment} onChange={set("downPayment")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field label="월세 (만원)" inputMode="numeric" placeholder="120" value={form.rent} onChange={set("rent")} />
              <Field label="관리비 (만원)" hint="선택" inputMode="numeric" placeholder="7" value={form.maintenance} onChange={set("maintenance")} />
              <Field label="납부일 (매월)" inputMode="numeric" value={form.payDay} onChange={set("payDay")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="계약 시작일" type="date" value={form.startDate} onChange={set("startDate")} />
              <Field label="계약 종료일" type="date" value={form.endDate} onChange={set("endDate")} />
            </div>

            <div style={{ height: 1, background: "#f0efe9" }} />
            <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, margin: 0 }}>👤 임대인</p>
            <Field label="성명" placeholder="홍길동" value={form.landlordName} onChange={set("landlordName")} />
            <Field label="주소" placeholder="서울시 ○○구 ○○로 123" value={form.landlordAddr} onChange={set("landlordAddr")} />
            <Field label="연락처" placeholder="010-0000-0000" value={form.landlordPhone} onChange={set("landlordPhone")} />

            <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, margin: "4px 0 0" }}>👥 임차인</p>
            <Field label="성명" placeholder="김철수" value={form.tenantName} onChange={set("tenantName")} />
            <Field label="주소" placeholder="현 거주지 주소" value={form.tenantAddr} onChange={set("tenantAddr")} />
            <Field label="연락처" placeholder="010-0000-0000" value={form.tenantPhone} onChange={set("tenantPhone")} />

            <div style={{ height: 1, background: "#f0efe9" }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, marginBottom: 8 }}>✍️ 특약사항 <span style={{ fontWeight: 500, fontSize: 11, color: "#b0b0c0" }}>클릭해서 추가/제거</span></p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {PRESET_TERMS.map((t) => (
                  <button key={t.key} onClick={() => toggleTerm(t.key)} className={`chip ${selectedTerms.includes(t.key) ? "is-active" : ""}`} style={{ cursor: "pointer" }}>
                    {selectedTerms.includes(t.key) ? "✓ " : "+ "}{t.label}
                  </button>
                ))}
              </div>
              <textarea rows={3} placeholder="직접 입력할 특약사항 (줄바꿈으로 구분)" value={form.customTerms} onChange={set("customTerms")}
                style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: NAVY, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
            </div>

            <button onClick={() => window.print()} className="btn btn-fill" style={{ width: "100%" }}>
              🖨️ 미리보기 인쇄 (워터마크 포함)
            </button>
            <p style={{ fontSize: 11, color: "#a0a0b0", textAlign: "center", margin: 0 }}>입력 내용은 서버에 저장되지 않습니다 — 브라우저에서만 처리됩니다</p>
          </div>

          {/* ── 오른쪽: 실시간 미리보기 ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div className="ct-doc ct-print-area" style={{ background: "#fff", border: "1px solid #e0ded6", borderRadius: 6, padding: "44px 36px", boxShadow: "0 10px 40px rgba(26,39,68,0.1)", fontFamily: "'Malgun Gothic','Apple SD Gothic Neo','Pretendard',sans-serif" }}>
              <div className="ct-wm" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => <span key={i}>OWNLY.KR 무료 미리보기 · OWNLY.KR</span>)}
              </div>

              <div style={{ textAlign: "center", borderBottom: "3px double #1a2744", paddingBottom: 20, marginBottom: 22 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: 8, color: NAVY, margin: "0 0 6px" }}>부동산 임대차 계약서</h2>
                <p style={{ fontSize: 11, color: "#8a8a9a", margin: 0 }}>({isCommercial ? "상가건물" : "주택"} · {num(form.rent) > 0 ? "보증금 있는 월세" : "전세"})</p>
              </div>

              <p style={{ fontSize: 12.5, lineHeight: 1.9, marginBottom: 16 }}>
                임대인과 임차인 쌍방은 아래 표시 부동산에 관하여 다음 내용과 같이 임대차계약을 체결한다.
              </p>

              <p style={{ fontSize: 12.5, fontWeight: 900, color: NAVY, margin: "0 0 8px" }}>1. 부동산의 표시</p>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 70, padding: "8px 10px", background: "#f8f7f4", border: "1px solid #d0d0d8", fontWeight: 800, textAlign: "center" }}>소재지</td>
                    <td colSpan={3} style={{ padding: "8px 12px", border: "1px solid #d0d0d8" }}>{form.propertyAddr || "　"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 10px", background: "#f8f7f4", border: "1px solid #d0d0d8", fontWeight: 800, textAlign: "center" }}>유형</td>
                    <td style={{ padding: "8px 12px", border: "1px solid #d0d0d8" }}>{form.propertyType}</td>
                    <td style={{ width: 70, padding: "8px 10px", background: "#f8f7f4", border: "1px solid #d0d0d8", fontWeight: 800, textAlign: "center" }}>면적</td>
                    <td style={{ padding: "8px 12px", border: "1px solid #d0d0d8" }}>{form.areaPyeong ? `${form.areaPyeong}평` : "　"}</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ fontSize: 12.5, fontWeight: 900, color: NAVY, margin: "0 0 8px" }}>2. 계약 내용</p>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 70, padding: "8px 10px", background: "#f8f7f4", border: "1px solid #d0d0d8", fontWeight: 800, textAlign: "center" }}>보증금</td>
                    <td style={{ padding: "8px 12px", border: "1px solid #d0d0d8" }}>금 {num(form.deposit).toLocaleString()}만원{form.downPayment && ` (계약금 ${num(form.downPayment).toLocaleString()}만원은 계약 시 지급하고, 잔금은 ${form.startDate || "계약 시작일"}에 지급한다)`}</td>
                  </tr>
                  {num(form.rent) > 0 && (
                    <tr>
                      <td style={{ padding: "8px 10px", background: "#f8f7f4", border: "1px solid #d0d0d8", fontWeight: 800, textAlign: "center" }}>월세</td>
                      <td style={{ padding: "8px 12px", border: "1px solid #d0d0d8" }}>금 {num(form.rent).toLocaleString()}만원 — 매월 {form.payDay || "　"}일 임대인 계좌로 지급{num(form.maintenance) > 0 && ` (관리비 월 ${num(form.maintenance).toLocaleString()}만원 별도)`}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "8px 10px", background: "#f8f7f4", border: "1px solid #d0d0d8", fontWeight: 800, textAlign: "center" }}>기간</td>
                    <td style={{ padding: "8px 12px", border: "1px solid #d0d0d8" }}>{form.startDate || "　　　　"} 부터 {form.endDate || "　　　　"} 까지</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ fontSize: 12.5, fontWeight: 900, color: NAVY, margin: "0 0 8px" }}>3. 계약 조항</p>
              <div style={{ fontSize: 11.5, lineHeight: 1.95, color: "#1a1a2e", marginBottom: 18 }}>
                <p style={{ margin: "0 0 4px" }}>제1조(인도) 임대인은 위 부동산을 임대차 목적대로 사용·수익할 수 있는 상태로 계약 시작일까지 임차인에게 인도한다.</p>
                <p style={{ margin: "0 0 4px" }}>제2조(용도 준수) 임차인은 위 부동산을 계약 목적 외의 용도로 사용하거나 임대인의 동의 없이 구조를 변경하지 아니한다.</p>
                <p style={{ margin: "0 0 4px" }}>제3조(계약 해지) 임차인이 {overdueClause}의 차임을 연체하거나 제2조를 위반한 때에는 임대인은 본 계약을 해지할 수 있다.</p>
                <p style={{ margin: "0 0 4px" }}>제4조(계약 종료) 계약이 종료되면 임차인은 위 부동산을 원상회복하여 임대인에게 반환하고, 임대인은 보증금을 임차인에게 반환한다.</p>
                <p style={{ margin: 0 }}>제5조(비용 정산) 연체 차임·미납 관리비·임차인 과실에 의한 손해가 있는 경우 임대인은 보증금에서 이를 공제하고 반환할 수 있다.</p>
              </div>

              {terms.length > 0 && (
                <>
                  <p style={{ fontSize: 12.5, fontWeight: 900, color: NAVY, margin: "0 0 8px" }}>4. 특약사항</p>
                  <div style={{ border: "1px solid #d0d0d8", borderRadius: 4, padding: "12px 16px", fontSize: 11.5, lineHeight: 1.95, marginBottom: 18 }}>
                    {terms.map((t, i) => <p key={i} style={{ margin: i < terms.length - 1 ? "0 0 4px" : 0 }}>{i + 1}. {t}</p>)}
                  </div>
                </>
              )}

              <p style={{ fontSize: 12, lineHeight: 1.8, marginBottom: 16 }}>
                본 계약을 증명하기 위하여 계약서 2통을 작성하여 임대인과 임차인이 각각 서명·날인 후 1통씩 보관한다.
              </p>
              <p style={{ fontSize: 12.5, textAlign: "center", marginBottom: 18, fontWeight: 700 }}>{today}</p>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <tbody>
                  {[
                    { role: "임대인", name: form.landlordName, addr: form.landlordAddr, phone: form.landlordPhone },
                    { role: "임차인", name: form.tenantName, addr: form.tenantAddr, phone: form.tenantPhone },
                  ].map((p) => (
                    <tr key={p.role}>
                      <td style={{ width: 60, padding: "10px 10px", background: "#f8f7f4", border: "1px solid #d0d0d8", fontWeight: 800, textAlign: "center" }}>{p.role}</td>
                      <td style={{ padding: "10px 12px", border: "1px solid #d0d0d8", lineHeight: 1.8 }}>
                        성명: <b>{p.name || "　　　　"}</b> (서명 또는 인)<br />
                        주소: {p.addr || "　"}　·　연락처: {p.phone || "　"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 가입 전환 CTA */}
            <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 16, padding: "22px 22px", color: "#fff" }}>
              <p style={{ fontSize: 15, fontWeight: 900, margin: "0 0 6px" }}>계약서 작성 후가 진짜 시작입니다</p>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 14px" }}>
                무료 가입하면 이 계약을 <b style={{ color: "#fff" }}>물건으로 등록해 월세 수금·만료 알림·수리 요청</b>까지 자동 관리됩니다.<br />
                세입자에게는 납부 이력 포털과 납부확인서가 제공됩니다.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/login?mode=signup" className="btn" style={{ background: "#fff", color: NAVY, fontWeight: 800, textDecoration: "none" }}>무료 가입하고 관리 시작 →</Link>
                <Link href="/tools/certified" className="btn btn-ghost" style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)", textDecoration: "none" }}>내용증명 생성기</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── SEO 콘텐츠 ── */}
        <div style={{ maxWidth: 760, margin: "56px auto 0" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: NAVY, marginBottom: 16 }}>임대차계약서 작성 체크리스트</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 40 }}>
            {[
              { n: "1", t: "등기부등본 확인", d: "계약 전 소유자와 임대인이 일치하는지, 근저당·가압류가 없는지 인터넷등기소에서 확인하세요." },
              { n: "2", t: "특약사항 명확히", d: "수선 책임·원상회복·전입신고 협조 등 분쟁이 잦은 항목은 반드시 특약으로 남기세요. 위 추천 특약을 활용하면 됩니다." },
              { n: "3", t: "30일 내 전월세신고", d: "보증금 6천만원 또는 월세 30만원 초과 계약은 체결 후 30일 이내 주민센터·부동산거래관리시스템에서 신고해야 합니다." },
            ].map((s) => (
              <div key={s.n} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 16px" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: NAVY, color: "#fff", fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{s.n}</div>
                <p style={{ fontSize: 13.5, fontWeight: 800, color: NAVY, margin: "0 0 6px" }}>{s.t}</p>
                <p style={{ fontSize: 12, color: "#6a6a7a", lineHeight: 1.7, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 900, color: NAVY, marginBottom: 16 }}>자주 묻는 질문</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {[
              { q: "이 계약서 양식은 법적으로 유효한가요?", a: "임대차계약은 당사자 간 합의로 성립하며 정해진 서식이 없습니다. 목적물·보증금·차임·기간과 쌍방 서명이 있으면 유효합니다. 본 양식은 표준 조항과 관행적 특약을 반영한 참고용 서식입니다." },
              { q: "계약서만 쓰면 보증금이 보호되나요?", a: "아닙니다. 임차인은 전입신고 + 확정일자를 받아야 대항력과 우선변제권이 생깁니다. 계약서에 전입신고 협조 특약을 넣어두는 것이 서로에게 안전합니다." },
              { q: "전월세신고는 누가 하나요?", a: "임대인·임차인 중 한 명이 하면 되고, 계약 체결일로부터 30일 이내입니다. 보증금 6천만원 초과 또는 월세 30만원 초과 주택 계약이 대상이며, 기한을 넘기면 과태료가 부과될 수 있습니다." },
              { q: "이 생성기는 정말 무료인가요?", a: "네, 작성과 미리보기·워터마크 인쇄는 회원가입 없이 무료입니다. 가입하면 계약을 물건으로 등록해 수금 현황·만료 알림·계약서 보관까지 무료 플랜(물건 3개)에서 관리할 수 있습니다." },
            ].map((f) => (
              <details key={f.q} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 18px" }}>
                <summary style={{ fontSize: 13.5, fontWeight: 800, color: NAVY, cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 12.5, color: "#6a6a7a", lineHeight: 1.8, margin: "10px 0 0" }}>{f.a}</p>
              </details>
            ))}
          </div>

          <p style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.7, textAlign: "center", marginBottom: 8 }}>
            ※ 본 양식은 일반적인 서식 참고용이며 법률 자문이 아닙니다. 고액·특수 계약은 공인중개사 또는 변호사 검토를 권장합니다.
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
