"use client";
import { useState } from "react";
import Link from "next/link";
import SiteFooter from "../../../components/SiteFooter";
import { REASON_TEMPLATES } from "../../../lib/certifiedTemplates";

// 무료 공개 도구: 내용증명 생성기
// 로그인 불필요. 사유별 법적 근거 포함 양식 작성 + 워터마크 미리보기/인쇄.
// 워터마크 없는 정식 PDF·세입자 연동·발송 추적은 가입/유료 플랜으로 유도.

const REASONS = Object.keys(REASON_TEMPLATES);
const NAVY = "#1a2744";

const initForm = {
  reason: "임대료 미납",
  senderName: "", senderAddr: "", senderPhone: "",
  receiverName: "", receiverAddr: "", receiverPhone: "",
  propertyAddr: "", contractStart: "", contractEnd: "",
  rentAmt: "", depositAmt: "",
  unpaidPeriod: "", unpaidAmt: "", deductAmt: "", refundAmt: "",
  violationDetail: "", terminationReason: "",
  deadlineDays: "7", customContent: "",
};

function Field({ label, hint, ...props }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 6 }}>{label}{hint && <span style={{ fontWeight: 500, marginLeft: 6, color: "#b0b0c0" }}>{hint}</span>}</p>
      <input {...props} style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: NAVY, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
    </div>
  );
}

export default function CertifiedToolPage() {
  const [form, setForm] = useState(initForm);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setReason = (r) => setForm((f) => ({ ...f, reason: r, deadlineDays: String(REASON_TEMPLATES[r].deadline) }));

  const tmpl = REASON_TEMPLATES[form.reason];
  const body = tmpl.template(form);
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const showUnpaid = form.reason === "임대료 미납";
  const showViolation = form.reason === "계약 위반 시정 요구";
  const showTermination = form.reason === "명도 요청";
  const showDeposit = form.reason === "보증금 반환 청구";
  const showCustom = form.reason === "기타";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        .cert-grid { display: grid; grid-template-columns: minmax(0,420px) minmax(0,1fr); gap: 24px; align-items: start; }
        @media (max-width: 900px) { .cert-grid { grid-template-columns: 1fr; } }
        .cert-doc { position: relative; overflow: hidden; }
        .cert-wm { position: absolute; inset: -20%; pointer-events: none; display: flex; flex-direction: column; justify-content: space-around; transform: rotate(-24deg); z-index: 5; }
        .cert-wm span { font-size: 34px; font-weight: 900; color: rgba(26,39,68,0.07); white-space: nowrap; letter-spacing: 6px; text-align: center; }
        @media print {
          body * { visibility: hidden; }
          .cert-print-area, .cert-print-area * { visibility: visible; }
          .cert-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          .cert-wm span { color: rgba(26,39,68,0.09) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 18mm; size: A4 portrait; }
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
            내용증명 <span className="gradient-text-2">무료 작성</span>
          </h1>
          <p style={{ fontSize: 14, color: "#6a6a7a", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 14px" }}>
            월세 미납 독촉부터 계약 해지 통보·보증금 반환 청구까지.<br />
            법적 근거가 포함된 임대인용 내용증명을 회원가입 없이 바로 작성해 보세요.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <span className="chip">⚖️ 사유별 법적 근거 자동 표기</span>
            <span className="chip">📮 우체국 발송 가이드</span>
            <span className="chip">🆓 로그인 불필요</span>
          </div>
        </div>

        <div className="cert-grid">
          {/* ── 왼쪽: 작성 폼 ── */}
          <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 18, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 8 }}>발송 사유</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {REASONS.map((r) => (
                  <button key={r} onClick={() => setReason(r)} className={`chip ${form.reason === r ? "is-active" : ""}`} style={{ cursor: "pointer" }}>
                    {REASON_TEMPLATES[r].icon} {r}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#5b4fcf", fontWeight: 600, marginTop: 8 }}>⚖️ 적용 법령: {tmpl.legalBasis}</p>
            </div>

            <div style={{ height: 1, background: "#f0efe9" }} />

            <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, margin: 0 }}>👤 발신인 (임대인)</p>
            <Field label="이름" placeholder="홍길동" value={form.senderName} onChange={set("senderName")} />
            <Field label="주소" placeholder="서울시 ○○구 ○○로 123" value={form.senderAddr} onChange={set("senderAddr")} />

            <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, margin: "4px 0 0" }}>📩 수신인 (임차인)</p>
            <Field label="이름" placeholder="김철수" value={form.receiverName} onChange={set("receiverName")} />
            <Field label="주소" placeholder="서울시 ○○구 ○○로 45, 302호" value={form.receiverAddr} onChange={set("receiverAddr")} />

            <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, margin: "4px 0 0" }}>🏠 임대 목적물·계약</p>
            <Field label="물건 주소" placeholder="서울시 ○○구 ○○로 45, 302호" value={form.propertyAddr} onChange={set("propertyAddr")} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="계약 시작일" type="date" value={form.contractStart} onChange={set("contractStart")} />
              <Field label="계약 종료일" type="date" value={form.contractEnd} onChange={set("contractEnd")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="월세 (만원)" inputMode="numeric" placeholder="120" value={form.rentAmt} onChange={set("rentAmt")} />
              <Field label="보증금 (만원)" inputMode="numeric" placeholder="5000" value={form.depositAmt} onChange={set("depositAmt")} />
            </div>

            {showUnpaid && (<>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="미납 기간" placeholder="2026년 5월 ~ 7월" value={form.unpaidPeriod} onChange={set("unpaidPeriod")} />
                <Field label="미납 금액 (만원)" inputMode="numeric" placeholder="360" value={form.unpaidAmt} onChange={set("unpaidAmt")} />
              </div>
            </>)}
            {showViolation && <Field label="위반 사항" placeholder="무단 전대, 무단 구조 변경 등" value={form.violationDetail} onChange={set("violationDetail")} />}
            {showTermination && <Field label="계약 종료 사유" placeholder="계약 기간 만료" value={form.terminationReason} onChange={set("terminationReason")} />}
            {showDeposit && (<>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="공제 금액 (만원)" inputMode="numeric" placeholder="0" value={form.deductAmt} onChange={set("deductAmt")} />
                <Field label="반환 청구액 (만원)" inputMode="numeric" placeholder="5000" value={form.refundAmt} onChange={set("refundAmt")} />
              </div>
            </>)}
            {showCustom && (
              <div>
                <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 6 }}>통보 내용</p>
                <textarea rows={5} placeholder="통보할 내용을 입력하세요" value={form.customContent} onChange={set("customContent")}
                  style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: NAVY, background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            )}

            <Field label="이행 기한 (일)" hint="수령일로부터" inputMode="numeric" value={form.deadlineDays} onChange={set("deadlineDays")} />

            <button onClick={() => window.print()} className="btn btn-fill" style={{ width: "100%" }}>
              🖨️ 미리보기 인쇄 (워터마크 포함)
            </button>
            <p style={{ fontSize: 11, color: "#a0a0b0", textAlign: "center", margin: 0 }}>입력 내용은 서버에 저장되지 않습니다 — 브라우저에서만 처리됩니다</p>
          </div>

          {/* ── 오른쪽: 실시간 미리보기 ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div className="cert-doc cert-print-area" style={{ background: "#fff", border: "1px solid #e0ded6", borderRadius: 6, padding: "44px 36px", boxShadow: "0 10px 40px rgba(26,39,68,0.1)", fontFamily: "'Malgun Gothic','Apple SD Gothic Neo','Pretendard',sans-serif" }}>
              {/* 워터마크 */}
              <div className="cert-wm" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => <span key={i}>OWNLY.KR 무료 미리보기 · OWNLY.KR</span>)}
              </div>

              <div style={{ textAlign: "center", borderBottom: "3px double #1a2744", paddingBottom: 22, marginBottom: 24 }}>
                <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: 10, color: NAVY, margin: "0 0 6px" }}>내 용 증 명</h2>
                <p style={{ fontSize: 11, color: "#8a8a9a", margin: 0 }}>작성일: {today}</p>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 22, fontSize: 12.5 }}>
                <tbody>
                  {[
                    { label: "수 신", name: form.receiverName, addr: form.receiverAddr },
                    { label: "발 신", name: form.senderName, addr: form.senderAddr },
                  ].map((row) => (
                    <tr key={row.label} style={{ borderTop: "1px solid #d0d0d8", borderBottom: "1px solid #d0d0d8" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 800, color: NAVY, background: "#f8f7f4", width: 52, textAlign: "center", letterSpacing: 2, fontSize: 11, borderRight: "1px solid #d0d0d8" }}>{row.label}</td>
                      <td style={{ padding: "10px 14px", lineHeight: 1.8 }}>
                        <b>성 명:</b> {row.name || "　　　　　"}&emsp;<b>주 소:</b> {row.addr || "　　　　　　　　　　"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: "center", margin: "22px 0 16px", fontSize: 14, fontWeight: 900, letterSpacing: 4, color: NAVY }}>— 내 용 —</div>

              <div style={{ border: "1px solid #d0d0d8", borderRadius: 4, padding: "22px 24px", minHeight: 220, lineHeight: 2.1, fontSize: 12.5, color: "#1a1a2e", whiteSpace: "pre-wrap", marginBottom: 22 }}>
                {body}
              </div>

              <div style={{ background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 4, padding: "9px 14px", marginBottom: 24, fontSize: 11, color: "#8a8a9a" }}>
                적용 법령: {tmpl.legalBasis}
              </div>

              <div style={{ textAlign: "right", marginBottom: 12 }}>
                <p style={{ fontSize: 12.5, margin: "0 0 3px" }}>위와 같이 내용을 증명합니다.</p>
                <p style={{ fontSize: 12.5, margin: 0 }}>{today}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 10.5, color: "#8a8a9a", margin: "0 0 5px" }}>발신인 (임대인)</p>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>{form.senderName || "　　　　　"}</p>
                  <div style={{ width: 64, height: 64, border: "1px solid #d0d0d8", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#d0d0d8", fontSize: 10.5 }}>(인)</div>
                </div>
              </div>
            </div>

            {/* 가입 전환 CTA */}
            <div style={{ background: "linear-gradient(135deg,#1a2744,#2d4270)", borderRadius: 16, padding: "22px 22px", color: "#fff" }}>
              <p style={{ fontSize: 15, fontWeight: 900, margin: "0 0 6px" }}>워터마크 없는 정식 문서가 필요하신가요?</p>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 14px" }}>
                무료 가입하면 <b style={{ color: "#fff" }}>워터마크 없는 정식 PDF를 월 1건</b> 발급할 수 있습니다.<br />
                세입자 정보 자동 입력·발송 이력·등기번호 추적까지 한 곳에서.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/login?mode=signup" className="btn" style={{ background: "#fff", color: NAVY, fontWeight: 800, textDecoration: "none" }}>무료 가입하고 정식 발급 →</Link>
                <Link href="/pricing" className="btn btn-ghost" style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)", textDecoration: "none" }}>플랜 비교</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── SEO 콘텐츠: 발송 방법 & 안내 ── */}
        <div style={{ maxWidth: 760, margin: "56px auto 0" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: NAVY, marginBottom: 16 }}>내용증명 보내는 법 (우체국 3단계)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 40 }}>
            {[
              { n: "1", t: "같은 문서 3부 출력", d: "위 양식을 인쇄해 동일한 문서를 3부 준비합니다. 발신·수신인 정보와 날인을 확인하세요." },
              { n: "2", t: "우체국 창구 접수", d: "가까운 우체국에서 '내용증명 우편'으로 접수합니다. 1부 발송·1부 우체국 보관·1부 본인 보관. 인터넷우체국(epost.go.kr)도 가능합니다." },
              { n: "3", t: "등기번호 보관", d: "접수 후 받은 등기번호로 배달 여부를 추적하세요. 수령 사실이 법적 절차의 핵심 증거가 됩니다." },
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
              { q: "내용증명은 법적 효력이 있나요?", a: "내용증명 자체가 강제력을 갖지는 않지만, '언제·어떤 내용을·누구에게' 통보했는지를 우체국이 공적으로 증명합니다. 이후 소송·지급명령에서 핵심 증거가 되고, 계약 해지 등 의사표시의 도달을 입증하는 표준 수단입니다." },
              { q: "월세를 몇 개월 밀리면 계약을 해지할 수 있나요?", a: "주택은 2기(2개월분), 상가는 3기 임대료 연체 시 해지 사유가 됩니다. 해지 전에 미납 사실과 납부 기한을 명시한 내용증명을 보내 두면 이후 절차에서 유리합니다." },
              { q: "변호사 없이 보내도 되나요?", a: "네. 내용증명은 형식 요건만 갖추면 누구나 직접 작성·발송할 수 있습니다. 다만 소송으로 이어질 수 있는 복잡한 사안은 전문가 상담을 권장합니다." },
              { q: "이 생성기는 정말 무료인가요?", a: "네, 작성과 미리보기·워터마크 인쇄는 회원가입 없이 무료입니다. 워터마크 없는 정식 PDF는 무료 가입 후 월 1건, 그 이상은 플러스 플랜(월 10건)에서 발급됩니다." },
            ].map((f) => (
              <details key={f.q} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "14px 18px" }}>
                <summary style={{ fontSize: 13.5, fontWeight: 800, color: NAVY, cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 12.5, color: "#6a6a7a", lineHeight: 1.8, margin: "10px 0 0" }}>{f.a}</p>
              </details>
            ))}
          </div>

          <p style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.7, textAlign: "center", marginBottom: 8 }}>
            ※ 본 양식은 일반적인 서식 참고용이며 법률 자문이 아닙니다. 개별 사안의 법적 판단은 변호사 등 전문가와 상담하시기 바랍니다.
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
