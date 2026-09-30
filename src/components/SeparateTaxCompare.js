"use client";
import { useState, useMemo } from "react";
import { isSampleTenant } from "../lib/sampleData";
import { exportSimpleLedger, yearExpenseItems } from "../lib/csvExport";
import { toast } from "./shared";
import { RENTAL_TAX_BASIS, SEPARATE_THRESHOLD, OTHER_INCOME_LIMIT, DEEMED, PERSONAL_DEDUCTION, calcDeemedRent, compareRentalIncomeTax } from "../lib/rentalIncomeTax";

const YEAR = RENTAL_TAX_BASIS.year;
const DISCLAIMER = `${YEAR}년 귀속(${RENTAL_TAX_BASIS.filingLabel}) 기준 일반 계산 · 실제 신고는 홈택스·세무사 확인`;
const fmt = (v) => `${(Number(v) || 0).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원`;
const isHousing = (t) => (t.p_type || t.pType) === "주거" && !isSampleTenant(t);

const inputStyle = { width: "100%", padding: "10px 13px", fontSize: 13, color: "var(--text)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 9, outline: "none", boxSizing: "border-box" };
const labelStyle = { fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginBottom: 6 };
const hintStyle = { fontSize: 11, color: "var(--text-faint)", marginTop: 5, lineHeight: 1.6 };

function Field({ label, hint, children }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      {children}
      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  );
}

function Row({ k, v, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-muted)" }}>{k}</span>
      <span className="num" style={{ fontWeight: strong ? 800 : 600, color: "var(--text)" }}>{v}</span>
    </div>
  );
}

export default function SeparateTaxCompare({ tenants, payments, ledger, repairs }) {
  // null = 앱 데이터에서 자동 계산한 값 사용, 문자열 = 사용자가 직접 수정한 값
  const [rentIn, setRentIn] = useState(null);
  const [regIn, setRegIn] = useState(null);
  const [otherIncome, setOtherIncome] = useState("");
  const [housesIn, setHousesIn] = useState(null);
  const [depositIn, setDepositIn] = useState(null);
  const [ratePct, setRatePct] = useState(String(DEEMED.defaultInterestRate * 100));
  const [expenseMode, setExpenseMode] = useState("actual");
  const [expenseIn, setExpenseIn] = useState(null);
  const [simpleRatePct, setSimpleRatePct] = useState("");
  const [deduction, setDeduction] = useState(String(PERSONAL_DEDUCTION));
  const [exportYear, setExportYear] = useState(YEAR);

  const auto = useMemo(() => {
    const housing = (tenants || []).filter(isHousing);
    const ids = new Set(housing.map((t) => t.id));
    const paidRows = (payments || []).filter((p) => Number(p.year) === YEAR && (p.status === "paid" || p.status === "partial") && ids.has(p.tid ?? p.tenant_id));
    const rent = paidRows.reduce((s, p) => s + (Number(p.amt ?? p.amount) || 0), 0);
    const months = new Set(paidRows.map((p) => p.month)).size;
    const annualized = housing.reduce((s, t) => s + (Number(t.rent) || 0), 0) * 12;
    const expense = yearExpenseItems(YEAR, { ledger, repairs, tenants })
      .filter((e) => !e.tenant_id || ids.has(e.tenant_id))
      .reduce((s, e) => s + e.amount, 0);
    return {
      housingCount: housing.length, rent, months, annualized, expense,
      deposit: housing.reduce((s, t) => s + (Number(t.dep ?? t.deposit) || 0), 0),
      registered: housing.length > 0 && housing.every((t) => t.registered_rental === true),
      mixedRegistered: housing.some((t) => t.registered_rental === true) && !housing.every((t) => t.registered_rental === true),
    };
  }, [tenants, payments, ledger, repairs]);

  const rentIncome = rentIn ?? String(auto.rent);
  const registered = regIn ?? auto.registered;
  const houses = housesIn ?? String(auto.housingCount);
  const deposit = depositIn ?? String(auto.deposit);
  const actualExpense = expenseIn ?? String(Math.round(auto.expense * 10) / 10);

  const deemed = calcDeemedRent({ houseCount: Number(houses) || 0, depositSum: Number(deposit) || 0, interestRate: (Number(ratePct) || 0) / 100 });
  const res = compareRentalIncomeTax({
    rentIncome: Number(rentIncome) || 0, deemedRent: deemed.amount, registered,
    otherIncome: Number(otherIncome) || 0, expenseMode,
    actualExpense: Number(actualExpense) || 0, simpleExpenseRate: (Number(simpleRatePct) || 0) / 100,
    incomeDeduction: Number(deduction) || 0,
  });
  const { separate: sep, comprehensive: comp } = res;

  const handleExport = () => {
    const n = exportSimpleLedger(exportYear, { payments, ledger, repairs, tenants });
    toast(n > 0 ? `${exportYear}년 간편장부 ${n}건을 내려받았습니다` : `${exportYear}년 기록이 없어 합계 행만 담긴 파일을 내려받았습니다`, n > 0 ? "success" : "info");
  };

  const resultCard = (title, total, isBetter, children) => (
    <div className="stat" style={isBetter ? { borderColor: "rgba(15,165,115,0.45)" } : undefined}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p className="stat-label" style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{title}</p>
        {isBetter && <span className="chip chip-success" style={{ fontSize: 11 }}>유리</span>}
      </div>
      <p className="num" style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>{total}</p>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="surface-card" style={{ padding: "18px 20px" }}>
        <p className="section-eyebrow">5월 종합소득세 준비</p>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "4px 0 6px" }}>주택임대소득 분리과세 vs 종합과세</h2>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
          주거용 세입자의 {YEAR}년 수금 기록·장부 경비로 기본값을 채웠습니다. 값은 자유롭게 고칠 수 있습니다.<br />
          <span className="chip chip-warn" style={{ fontSize: 11, marginTop: 6 }}>{DISCLAIMER}</span>
        </p>
      </div>

      {auto.housingCount === 1 && (
        <div className="surface-card" style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
          ℹ️ 주택이 1채(부부 합산)이고 기준시가 12억원 이하라면 월세 소득은 <strong style={{ color: "var(--text)" }}>비과세</strong>입니다 (소득세법 제12조). 이 계산기는 비과세 여부를 판정하지 않으니 해당되는지 먼저 확인해 주세요.
        </div>
      )}

      <div className="tax-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="surface-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="연간 월세 수입금액 (만원)" hint={<>
            {YEAR}년 수금 기록 합계 {fmt(auto.rent)} ({auto.months}개월분, 받은 금액 기준) · 현재 월세로 1년 환산 시 {fmt(auto.annualized)}
            {auto.annualized > 0 && <button type="button" className="btn btn-soft btn-sm" style={{ marginLeft: 6, minHeight: 0, padding: "2px 8px" }} onClick={() => setRentIn(String(auto.annualized))}>환산값 적용</button>}
            {rentIn !== null && <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 4, minHeight: 0, padding: "2px 8px" }} onClick={() => setRentIn(null)}>기록값으로</button>}
            <br />세법상 수입시기는 계약상 지급일이라 미수 월세도 포함될 수 있습니다.
          </>}>
            <input type="number" value={rentIncome} onChange={(e) => setRentIn(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="임대주택 등록 여부" hint={<>
            등록 = 지자체 임대사업자 + 세무서 사업자등록 + 임대료 증액 5% 이내 요건 충족
            {auto.mixedRegistered && <><br />일부 주택만 등록된 경우 주택별 안분 계산이 필요합니다 — 확인 필요</>}
          </>}>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className={`chip ${!registered ? "is-active" : ""}`} onClick={() => setRegIn(false)}>미등록</button>
              <button type="button" className={`chip ${registered ? "is-active" : ""}`} onClick={() => setRegIn(true)}>등록임대</button>
            </div>
          </Field>

          <Field label="주택임대 외 종합소득금액 (만원)" hint={`근로·사업소득 등은 공제 후 '소득금액' 기준. ${fmt(OTHER_INCOME_LIMIT)} 초과 시 분리과세 기본공제가 적용되지 않습니다.`}>
            <input type="number" value={otherIncome} onChange={(e) => setOtherIncome(e.target.value)} placeholder="0" style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <Field label="주택 수"><input type="number" value={houses} onChange={(e) => setHousesIn(e.target.value)} style={inputStyle} /></Field>
            <Field label="보증금 합계 (만원)"><input type="number" value={deposit} onChange={(e) => setDepositIn(e.target.value)} style={inputStyle} /></Field>
            <Field label="정기예금이자율 (%)"><input type="number" step="0.1" value={ratePct} onChange={(e) => setRatePct(e.target.value)} style={inputStyle} /></Field>
          </div>
          <p style={{ ...hintStyle, marginTop: -6 }}>
            간주임대료: {deemed.applies ? <strong style={{ color: "var(--text)" }}>{fmt(deemed.amount)} 수입금액에 포함</strong> : `미적용 (${deemed.reason})`}
            <br />(보증금 합계 − 3억) × 60% × 이자율. 기본 이자율 {DEEMED.defaultInterestRate * 100}%는 {YEAR}년 귀속 고시율 <strong>확인 필요</strong>. 소형주택(전용 40㎡·기준시가 2억 이하) 주택 수 제외, 보증금 운용 금융수익 차감은 반영하지 않았습니다.
          </p>

          <Field label="종합과세 필요경비" hint={expenseMode === "actual"
            ? `${YEAR}년 장부 지출 + 장부에 없는 수리비 합계 (상가 세입자에 연결된 항목 제외). 주택분만 남겨 주세요.`
            : "업종별 단순경비율은 국세청 고시값을 직접 입력해 주세요 (확인 필요). 비워 두면 0%로 계산합니다."}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button type="button" className={`chip ${expenseMode === "actual" ? "is-active" : ""}`} onClick={() => setExpenseMode("actual")}>실제 장부 경비</button>
              <button type="button" className={`chip ${expenseMode === "rate" ? "is-active" : ""}`} onClick={() => setExpenseMode("rate")}>단순경비율</button>
            </div>
            {expenseMode === "actual"
              ? <input type="number" value={actualExpense} onChange={(e) => setExpenseIn(e.target.value)} style={inputStyle} />
              : <input type="number" step="0.1" value={simpleRatePct} onChange={(e) => setSimpleRatePct(e.target.value)} placeholder="예: 국세청 고시 경비율(%)" style={inputStyle} />}
          </Field>

          <Field label="종합소득공제 합계 (만원)" hint="기본값은 본인 기본공제 150만원. 부양가족·연금보험료 공제 등이 있으면 더해 주세요.">
            <input type="number" value={deduction} onChange={(e) => setDeduction(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="surface-card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>주택임대 수입금액{deemed.applies ? " (간주임대료 포함)" : ""}</span>
            <span className="num" style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{fmt(res.revenue)}</span>
          </div>

          {resultCard("분리과세 (14%)", sep.eligible ? fmt(sep.total) : "선택 불가", res.better === "separate", sep.eligible ? (
            <>
              <Row k={`필요경비 (${sep.expenseRate * 100}%)`} v={`− ${fmt(sep.expense)}`} />
              <Row k={`기본공제${sep.deductionApplies ? "" : " (다른 소득 2천만원 초과로 제외)"}`} v={`− ${fmt(sep.deduction)}`} />
              <Row k="과세표준" v={fmt(sep.taxable)} />
              <Row k="소득세 (14%)" v={fmt(sep.incomeTax)} />
              <Row k="지방소득세 (10%)" v={fmt(sep.localTax)} />
            </>
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>수입금액이 {fmt(SEPARATE_THRESHOLD)}을 넘으면 종합과세만 가능합니다.</p>
          ))}

          {resultCard("종합과세 (누진세율)", fmt(comp.total), res.better === "comprehensive" && sep.eligible, (
            <>
              <Row k="필요경비" v={`− ${fmt(comp.expense)}`} />
              <Row k="주택임대 소득금액" v={fmt(comp.rentalIncome)} />
              <Row k="합산 과세표준 (다른 소득 포함)" v={fmt(comp.taxBase)} />
              <Row k="임대소득으로 늘어나는 소득세" v={fmt(comp.incomeTax)} />
              <Row k="지방소득세 (10%)" v={fmt(comp.localTax)} />
            </>
          ))}

          <div className="surface-card" style={{ padding: "14px 16px", fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>
            {!sep.eligible
              ? <>수입금액 2천만원 초과 — <strong>종합과세 대상</strong>입니다.</>
              : res.better === "same"
                ? <>두 방식의 예상 세액이 같습니다.</>
                : <><strong>{res.better === "separate" ? "분리과세" : "종합과세"}</strong>가 약 <strong className="num">{fmt(res.diff)}</strong> 적게 나오는 것으로 계산됩니다.</>}
            <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>
              종합과세 세액은 다른 소득만 있을 때보다 늘어나는 금액(증분)입니다. 세액공제·기납부세액·결손금 통산은 반영하지 않았습니다.
            </p>
          </div>

          {registered && (
            <div className="surface-card" style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
              <p style={{ fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>등록임대 세액감면 가능성 (위 금액은 감면 전)</p>
              조세특례제한법 제96조의 소형주택 임대사업자 세액감면은 임대 기간(단기 4년·장기 8년 이상)과 호수(1호 / 2호 이상)에 따라 30%·75%(2호 이상은 20%·50%) 등으로 달라지며, 국민주택규모·기준시가·임대료 증액 제한 요건이 붙습니다. 적용 여부는 이 화면에서 판정하지 않습니다 — 세무사 확인이 필요합니다.
            </div>
          )}
        </div>
      </div>

      <div className="surface-card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>간편장부 내보내기 (CSV)</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.6 }}>
              국세청 간편장부 양식 열(일자·거래내용·거래처·수입·비용·고정자산 증감·비고), 금액은 원 단위.<br />
              수입 = 수금 기록(부분납부는 받은 금액), 비용 = 장부 지출 + 장부에 없는 수리비. 샘플 데이터는 제외됩니다.
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[YEAR - 1, YEAR].map((y) => (
              <button key={y} type="button" className={`chip ${exportYear === y ? "is-active" : ""}`} onClick={() => setExportYear(y)}>{y}년</button>
            ))}
            <button type="button" className="btn btn-accent btn-sm" onClick={handleExport}>내려받기</button>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
          ⚠️ {DISCLAIMER}.<br />
          적용 수치: 분리과세 선택 기준 수입금액 2천만원 이하, 필요경비율 50%(등록 60%), 기본공제 200만원(등록 400만원), 세율 14% (소득세법 제64조의2) · 종합소득세 기본세율 6~45% (제55조) · 지방소득세 10%.<br />
          정기예금이자율·단순경비율·세액감면 요건은 매년 바뀌거나 개별 판정이 필요한 항목이라 &ldquo;확인 필요&rdquo;로 표시했습니다.
        </p>
      </div>
    </div>
  );
}
