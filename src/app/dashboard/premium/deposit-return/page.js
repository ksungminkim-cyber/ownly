"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = {
  navy: "#1a2744", purple: "#5b4fcf", emerald: "#0fa573",
  rose: "#e8445a", amber: "#e8960a", border: "#e8e6e0",
  surface: "#ffffff", faint: "#f8f7f4", muted: "#8a8a9a",
};

function Row({ label, value, color, bold, minus, separator }) {
  return (
    <>
      {separator && <div style={{ height: 1, background: C.border, margin: "8px 0" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
        <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
        <span style={{ fontSize: bold ? 18 : 14, fontWeight: bold ? 900 : 700, color: color || C.navy }}>
          {minus ? "-" : ""}{typeof value === "number" ? value.toLocaleString() + "만원" : value}
        </span>
      </div>
    </>
  );
}

// 슬라이더 + 숫자 직접입력 복합 컴포넌트
function SliderInput({ label, value, onChange, min = 0, max, step, color = C.navy, unit = "만원", hint }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.navy }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="number"
            value={value}
            min={min}
            onChange={e => {
              const v = Number(e.target.value);
              if (!isNaN(v) && v >= 0) onChange(v);
            }}
            style={{
              width: 90, padding: "4px 8px", borderRadius: 7,
              border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700,
              color, textAlign: "right", outline: "none", background: C.faint,
            }}
          />
          <span style={{ fontSize: 12, color: C.muted }}>{unit}</span>
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={Math.min(value, max)}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, height: 4 }}
      />
      {hint && <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

export default function DepositReturnPage() {
  const router = useRouter();
  const { tenants } = useApp();

  const [selectedTid, setSelectedTid] = useState("");
  const [deposit, setDeposit]           = useState(1000);
  const [unpaidMonths, setUnpaidMonths] = useState(0);
  const [monthlyRent, setMonthlyRent]   = useState(50);
  const [repairCost, setRepairCost]     = useState(0);
  const [cleaningFee, setCleaningFee]   = useState(0);
  const [otherDeduction, setOtherDeduction] = useState(0);

  const onSelectTenant = (tid) => {
    setSelectedTid(tid);
    const t = tenants.find(x => x.id === tid);
    if (t) {
      setDeposit(t.dep ? t.dep / 10000 : 1000);
      setMonthlyRent(t.rent || 50);
    }
  };

  const unpaidRent      = unpaidMonths * monthlyRent;
  const totalDeduction  = unpaidRent + repairCost + cleaningFee + otherDeduction;
  const returnAmount    = Math.max(0, deposit - totalDeduction);
  const isShortage      = totalDeduction > deposit;
  const shortage        = Math.max(0, totalDeduction - deposit);

  return (
    <div className="page-in page-padding" style={{ maxWidth: 720, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        ← 뒤로가기
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${C.rose},#c0392b)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🔑</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: "-.4px", marginBottom: 3 }}>보증금 반환 계산기</h1>
          <p style={{ fontSize: 13, color: C.muted }}>퇴거 시 공제 항목을 계산해 실제 반환액을 산출합니다</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* 입력 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 임차인 불러오기 */}
          {tenants.length > 0 && (
            <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>임차인 불러오기</p>
              <select onChange={e => onSelectTenant(e.target.value)} value={selectedTid}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, color: C.navy, cursor: "pointer", appearance: "none" }}>
                <option value="">직접 입력</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — 보증금 {t.dep ? (t.dep/10000).toLocaleString() : 0}만원</option>
                ))}
              </select>
            </div>
          )}

          {/* 보증금 */}
          <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
            <SliderInput
              label="보증금"
              value={deposit}
              onChange={setDeposit}
              min={0} max={100000} step={500}
              color={C.navy}
              hint="슬라이더 또는 숫자 직접 입력"
            />
          </div>

          {/* 공제 항목 */}
          <div style={{ background: "rgba(232,68,90,0.05)", border: `1px solid ${C.rose}20`, borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.rose, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>공제 항목</p>

            {/* 미납 월세 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>미납 월세</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.rose }}>{unpaidRent.toLocaleString()}만원</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SliderInput label="미납 개월수" value={unpaidMonths} onChange={setUnpaidMonths} min={0} max={24} step={1} color={C.rose} unit="개월" />
                <SliderInput label="월세" value={monthlyRent} onChange={setMonthlyRent} min={0} max={2000} step={10} color={C.rose} />
              </div>
            </div>

            <div style={{ height: 1, background: `${C.rose}20`, margin: "8px 0 14px" }} />

            <SliderInput label="원상복구 비용" value={repairCost}     onChange={setRepairCost}     min={0} max={5000}  step={10} color={C.rose} />
            <SliderInput label="청소비"         value={cleaningFee}   onChange={setCleaningFee}    min={0} max={500}   step={5}  color={C.rose} />
            <SliderInput label="기타 공제"      value={otherDeduction} onChange={setOtherDeduction} min={0} max={10000} step={10} color={C.rose} />

            <p style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>💡 슬라이더 한도 초과 시 숫자 필드에 직접 입력하세요</p>
          </div>
        </div>

        {/* 결과 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: isShortage ? "rgba(232,68,90,0.06)" : "rgba(15,165,115,0.06)", border: `2px solid ${isShortage ? C.rose : C.emerald}30`, borderRadius: 20, padding: 24, textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", marginBottom: 8 }}>
              {isShortage ? "보증금 초과 — 추가 청구" : "실제 반환액"}
            </p>
            <p style={{ fontSize: 48, fontWeight: 900, color: isShortage ? C.rose : C.emerald, letterSpacing: "-2px", lineHeight: 1 }}>
              {isShortage ? shortage.toLocaleString() : returnAmount.toLocaleString()}<span style={{ fontSize: 18 }}>만원</span>
            </p>
            {isShortage
              ? <p style={{ fontSize: 13, color: C.rose, fontWeight: 700, marginTop: 14 }}>보증금을 초과하는 {shortage.toLocaleString()}만원은 임차인에게 별도 청구 필요</p>
              : <p style={{ fontSize: 13, color: C.emerald, fontWeight: 700, marginTop: 14 }}>임차인에게 반환해야 하는 금액</p>
            }
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", marginBottom: 12 }}>반환 계산 내역</p>
            <Row label="보증금" value={deposit} color={C.navy} />
            {unpaidRent > 0      && <Row label={`미납 월세 (${unpaidMonths}개월 × ${monthlyRent.toLocaleString()}만원)`} value={unpaidRent}      color={C.rose} minus />}
            {repairCost > 0      && <Row label="원상복구 비용"   value={repairCost}      color={C.rose} minus />}
            {cleaningFee > 0     && <Row label="청소비"           value={cleaningFee}     color={C.rose} minus />}
            {otherDeduction > 0  && <Row label="기타 공제"        value={otherDeduction}  color={C.rose} minus />}
            <Row label="총 공제액" value={totalDeduction} color={C.rose} bold minus separator />
            <Row label={isShortage ? "보증금 초과 청구액" : "실제 반환액"} value={isShortage ? shortage : returnAmount} color={isShortage ? C.rose : C.emerald} bold separator />
          </div>

          <div style={{ background: "rgba(26,39,68,0.04)", border: `1px solid ${C.navy}15`, borderRadius: 14, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>📋 보증금 반환 관련 주요 사항</p>
            <ul style={{ fontSize: 12, color: C.muted, lineHeight: 1.8, paddingLeft: 16 }}>
              <li>퇴거일로부터 <b>30일 이내</b> 반환 원칙</li>
              <li>원상복구 범위는 <b>임차인의 고의·과실</b>에 한정</li>
              <li>자연마모는 임대인 부담 (벽지 변색 등)</li>
              <li>분쟁 시 주택임대차분쟁조정위원회 활용</li>
            </ul>
          </div>

          <button onClick={() => window.print()} className="no-print"
            style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg,${C.navy},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 16px ${C.navy}30` }}>
            🖨️ 계산 결과 PDF 출력
          </button>
        </div>
      </div>
    </div>
  );
}
