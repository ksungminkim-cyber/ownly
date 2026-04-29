"use client";
import { useState, useMemo } from "react";
import { calcTotalHoldingTax } from "../lib/holdingTax";

// 부동산 보유세 시뮬레이션 탭
// 재산세(지방세) + 종합부동산세(국세) 통합 계산
// 입력: 보유 자산별 공시가격 + 1세대1주택/다주택 여부

export default function HoldingTaxTab({ tenants = [] }) {
  // 등록된 tenants에서 보유 자산 자동 카운트
  const housing = tenants.filter(t => (t.p_type || t.pType) === "주거" || (t.p_type || t.pType) === "오피스텔");
  const commercial = tenants.filter(t => (t.p_type || t.pType) === "상가");
  const land = tenants.filter(t => (t.p_type || t.pType) === "토지");

  const [housingPrice, setHousingPrice] = useState("");
  const [commercialPrice, setCommercialPrice] = useState("");
  const [landPrice, setLandPrice] = useState("");
  const [is1Home, setIs1Home] = useState(false);
  const [is3Plus, setIs3Plus] = useState(false);
  const [isJoint, setIsJoint] = useState(false);

  const result = useMemo(() => calcTotalHoldingTax({
    housingPriceSum: Number(housingPrice) || 0,
    commercialPriceSum: Number(commercialPrice) || 0,
    landPriceSum: Number(landPrice) || 0,
    is1Home,
    is3Plus,
    isJointOwnership: isJoint,
  }), [housingPrice, commercialPrice, landPrice, is1Home, is3Plus, isJoint]);

  const card = { background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "16px 18px" };
  const label = { fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 };

  return (
    <div style={{ maxWidth: 920 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* 좌측: 입력 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 자산 구성 안내 */}
          {tenants.length > 0 && (
            <div style={{ ...card, background: "rgba(91,79,207,0.04)", borderColor: "rgba(91,79,207,0.2)" }}>
              <p style={{ ...label, color: "#5b4fcf" }}>등록된 보유 자산</p>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#1a2744" }}>
                <span>🏠 주택·오피스텔 <b>{housing.length}건</b></span>
                <span>🏪 상가 <b>{commercial.length}건</b></span>
                <span>🌱 토지 <b>{land.length}건</b></span>
              </div>
              <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 8, lineHeight: 1.6 }}>
                각 자산의 <b>공시가격(시가표준액)</b>을 직접 입력하세요. 공시가격은 부동산공시가격알리미(www.realtyprice.kr)에서 조회 가능합니다.
              </p>
            </div>
          )}

          {/* 자산별 공시가 입력 */}
          <div style={card}>
            <p style={label}>보유 자산 공시가격 (만원)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "🏠 주택·오피스텔 공시가 합계", val: housingPrice, set: setHousingPrice, ph: "예: 80000 (8억)" },
                { label: "🏪 상가·건축물 공시가 합계", val: commercialPrice, set: setCommercialPrice, ph: "예: 30000 (3억)" },
                { label: "🌱 토지 공시가 합계", val: landPrice, set: setLandPrice, ph: "예: 50000 (5억)" },
              ].map(({ label: lbl, val, set, ph }) => (
                <div key={lbl}>
                  <p style={{ fontSize: 12, color: "#1a2744", fontWeight: 600, marginBottom: 4 }}>{lbl}</p>
                  <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    style={{ width: "100%", padding: "10px 12px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          {/* 보유 형태 */}
          <div style={card}>
            <p style={label}>보유 형태 (종부세 계산용)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <CheckRow checked={is1Home} onChange={setIs1Home}
                title="1세대 1주택자"
                desc="공제액 12억 적용 (다주택자 9억)" />
              <CheckRow checked={is3Plus} onChange={setIs3Plus}
                title="3주택 이상 (조정대상지역 포함)"
                desc="중과세율 적용 (12억 초과분 2~5%)" />
              <CheckRow checked={isJoint} onChange={setIsJoint}
                title="부부공동명의"
                desc="종부세 50% 감면 가정 (실제는 명의별 합산 분리과세)" />
            </div>
          </div>
        </div>

        {/* 우측: 결과 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* 총 보유세 */}
          <div style={{ background: "linear-gradient(135deg,rgba(232,68,90,0.08),rgba(232,150,10,0.06))", border: "1.5px solid rgba(232,68,90,0.25)", borderRadius: 14, padding: "20px 22px" }}>
            <p style={{ ...label, color: "#e8445a" }}>총 보유세 추정 (연간)</p>
            <p style={{ fontSize: 32, fontWeight: 900, color: "#e8445a", letterSpacing: "-0.5px" }}>{result.grandTotal.toLocaleString()}만원</p>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 4 }}>재산세 + 종합부동산세 합계</p>
          </div>

          {/* 재산세 (지방세) */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ ...label, color: "#0d9488", margin: 0 }}>재산세 (지방세)</p>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0d9488" }}>{result.propertyTax.total.toLocaleString()}만원</span>
            </div>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 10, lineHeight: 1.5 }}>매년 7월·9월 분납 (지자체 부과)</p>
            {[
              { label: "주택분", value: result.propertyTax.housing, note: "공시가 × 60% × 0.1~0.4% (4구간)" },
              { label: "건축물분 (상가)", value: result.propertyTax.commercial, note: "공시가 × 70% × 0.25%" },
              { label: "토지분 (별도합산)", value: result.propertyTax.land, note: "공시가 × 70% × 0.2~0.4% (3구간)" },
            ].map(({ label: lbl, value, note }) => (
              <div key={lbl} style={{ padding: "8px 0", borderBottom: "1px solid #f0efe9", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 12, color: "#1a2744", fontWeight: 600 }}>{lbl}</p>
                  <p style={{ fontSize: 10, color: "#a0a0b0", marginTop: 1 }}>{note}</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: value > 0 ? "#0d9488" : "#c0c0cc" }}>
                  {value.toLocaleString()}만원
                </span>
              </div>
            ))}
          </div>

          {/* 종합부동산세 (국세) */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ ...label, color: "#5b4fcf", margin: 0 }}>종합부동산세 (국세)</p>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#5b4fcf" }}>{result.comprehensiveTax.total.toLocaleString()}만원</span>
            </div>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 10, lineHeight: 1.5 }}>매년 12월 1~15일 납부 (국세청)</p>

            {/* 주택 종부세 */}
            <div style={{ padding: "10px 12px", background: "rgba(91,79,207,0.04)", borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>주택 종부세</p>
                <span style={{ fontSize: 13, fontWeight: 800, color: result.comprehensiveTax.housing > 0 ? "#5b4fcf" : "#c0c0cc" }}>
                  {result.comprehensiveTax.housing.toLocaleString()}만원
                </span>
              </div>
              <p style={{ fontSize: 10, color: "#8a8a9a", lineHeight: 1.6 }}>
                공정시장가액(공시가×60%) - 공제 {(result.comprehensiveTax.housingDetail.exemption / 10000).toFixed(0)}억 = 과세표준{" "}
                {result.comprehensiveTax.housingDetail.base.toLocaleString()}만원
                {is3Plus && <span style={{ color: "#e8445a", fontWeight: 700 }}> (3주택+ 중과 적용)</span>}
              </p>
            </div>

            {/* 토지 종부세 */}
            <div style={{ padding: "10px 12px", background: "rgba(13,148,136,0.04)", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>토지 종부세 (별도합산)</p>
                <span style={{ fontSize: 13, fontWeight: 800, color: result.comprehensiveTax.land > 0 ? "#0d9488" : "#c0c0cc" }}>
                  {result.comprehensiveTax.land.toLocaleString()}만원
                </span>
              </div>
              <p style={{ fontSize: 10, color: "#8a8a9a", lineHeight: 1.6 }}>
                토지 공정시장가액(공시가×80%) - 공제 80억 = 과세표준{" "}
                {result.comprehensiveTax.landDetail.base.toLocaleString()}만원
              </p>
            </div>
          </div>

          {/* 안내 */}
          <div style={{ background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.7 }}>
              ⚠️ 본 계산은 2024년 세법 기준 <b>참고용 추정치</b>입니다. 실제 세액은 보유 형태(개인/부부/법인), 보유 기간, 고령자 공제, 농어촌특별세 등에 따라 달라질 수 있습니다.
              {result.comprehensiveTax.total > 0 && " 종부세는 고지서 발송 후 신고 필요."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ checked, onChange, title, desc }) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 12px",
      background: checked ? "rgba(91,79,207,0.05)" : "#fafaf7",
      border: `1px solid ${checked ? "#5b4fcf" : "#ebe9e3"}`,
      borderRadius: 9, cursor: "pointer",
    }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 17, height: 17, accentColor: "#5b4fcf", cursor: "pointer", flexShrink: 0, marginTop: 1 }} />
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744", margin: 0 }}>{title}</p>
        <p style={{ fontSize: 11, color: "#8a8a9a", margin: "2px 0 0", lineHeight: 1.5 }}>{desc}</p>
      </div>
    </label>
  );
}
