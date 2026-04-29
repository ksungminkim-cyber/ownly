"use client";
import { useState, useEffect, useMemo } from "react";
import { calcTotalHoldingTax } from "../lib/holdingTax";
import { supabase } from "../lib/supabase";
import { toast } from "./shared";

// 부동산 보유세 시뮬레이션 탭
// 등록된 물건의 공시가격을 자동 연동 + 인라인 편집 지원
// 재산세(지방세) + 종합부동산세(국세) 통합 계산

export default function HoldingTaxTab({ tenants = [] }) {
  // 물건 분류
  const housing = tenants.filter(t => ["주거", "오피스텔"].includes(t.p_type || t.pType));
  const commercial = tenants.filter(t => (t.p_type || t.pType) === "상가");
  const land = tenants.filter(t => (t.p_type || t.pType) === "토지");

  // 각 물건의 공시가 로컬 상태 (DB 동기화)
  const [prices, setPrices] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const initial = {};
    tenants.forEach(t => { initial[t.id] = String(t.public_price || ""); });
    setPrices(initial);
  }, [tenants]);

  const updatePrice = async (tenantId, value) => {
    setPrices(p => ({ ...p, [tenantId]: value }));
  };

  const savePrice = async (tenantId) => {
    const value = Number(prices[tenantId] || 0);
    setSavingId(tenantId);
    try {
      const { error } = await supabase.from("tenants")
        .update({ public_price: value })
        .eq("id", tenantId);
      if (error) throw error;
      toast("공시가 저장됨", "success");
    } catch (e) {
      toast("저장 실패: " + (e.message || ""), "error");
    } finally {
      setSavingId(null);
    }
  };

  // 합계 계산
  const sumByType = (list) => list.reduce((s, t) => s + Number(prices[t.id] || 0), 0);
  const housingPriceSum = sumByType(housing);
  const commercialPriceSum = sumByType(commercial);
  const landPriceSum = sumByType(land);

  // 옵션
  const [is1Home, setIs1Home] = useState(housing.length === 1);
  const [is3Plus, setIs3Plus] = useState(housing.length >= 3);
  const [isJoint, setIsJoint] = useState(false);

  const result = useMemo(() => calcTotalHoldingTax({
    housingPriceSum, commercialPriceSum, landPriceSum,
    is1Home, is3Plus, isJointOwnership: isJoint,
  }), [housingPriceSum, commercialPriceSum, landPriceSum, is1Home, is3Plus, isJoint]);

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* ─── 좌측: 입력 ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 안내 */}
          <div style={{ background: "rgba(91,79,207,0.05)", border: "1px solid rgba(91,79,207,0.2)", borderRadius: 12, padding: "16px 18px" }}>
            <p style={SectionLabel("#5b4fcf")}>등록된 보유 자산 자동 연동</p>
            <p style={{ fontSize: 13, color: "#1a2744", fontWeight: 600, marginBottom: 6, lineHeight: 1.6 }}>
              🏠 주택·오피스텔 <b>{housing.length}건</b> &nbsp;·&nbsp; 🏪 상가 <b>{commercial.length}건</b> &nbsp;·&nbsp; 🌱 토지 <b>{land.length}건</b>
            </p>
            <p style={{ fontSize: 12, color: "#6a6a7a", lineHeight: 1.6 }}>
              아래 각 물건에 <b style={{ color: "#1a2744" }}>공시가격(시가표준액)</b>을 입력하시면 자동 합산되어 보유세가 계산됩니다.<br/>
              공시가는 <a href="https://www.realtyprice.kr" target="_blank" rel="noopener noreferrer" style={{ color: "#5b4fcf", fontWeight: 700, textDecoration: "underline" }}>부동산공시가격알리미</a>에서 조회 가능합니다.
            </p>
          </div>

          {/* 주택·오피스텔 */}
          {housing.length > 0 && (
            <PropertyGroup title="🏠 주택·오피스텔" totalLabel="주택 공시가 합계" total={housingPriceSum} color="#5b4fcf"
              tenants={housing} prices={prices} updatePrice={updatePrice} savePrice={savePrice} savingId={savingId} />
          )}

          {/* 상가 */}
          {commercial.length > 0 && (
            <PropertyGroup title="🏪 상가·건축물" totalLabel="상가 공시가 합계" total={commercialPriceSum} color="#e8960a"
              tenants={commercial} prices={prices} updatePrice={updatePrice} savePrice={savePrice} savingId={savingId} />
          )}

          {/* 토지 */}
          {land.length > 0 && (
            <PropertyGroup title="🌱 토지" totalLabel="토지 공시가 합계" total={landPriceSum} color="#0d9488"
              tenants={land} prices={prices} updatePrice={updatePrice} savePrice={savePrice} savingId={savingId} />
          )}

          {tenants.length === 0 && (
            <div style={{ background: "#fff", border: "1px dashed #ebe9e3", borderRadius: 12, padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 36, marginBottom: 10 }}>🏠</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1a2744", marginBottom: 6 }}>등록된 물건이 없습니다</p>
              <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.6 }}>물건 관리에서 보유 물건을 등록하시면<br/>자동으로 보유세 계산이 가능해집니다.</p>
            </div>
          )}

          {/* 보유 형태 */}
          <div style={cardStyle}>
            <p style={SectionLabel()}>보유 형태 (종부세 계산 옵션)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <CheckRow checked={is1Home} onChange={setIs1Home}
                title="1세대 1주택자"
                desc="공제액 12억 적용 (다주택자 9억)" />
              <CheckRow checked={is3Plus} onChange={setIs3Plus}
                title="3주택 이상 (조정대상지역 포함)"
                desc="중과세율 적용 (12억 초과분 2~5%)" />
              <CheckRow checked={isJoint} onChange={setIsJoint}
                title="부부공동명의"
                desc="종부세 50% 감면 가정 (실제는 명의별 분리 합산)" />
            </div>
          </div>
        </div>

        {/* ─── 우측: 결과 ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 총 보유세 — 메인 헤드라인 */}
          <div style={{ background: "linear-gradient(135deg,rgba(232,68,90,0.08),rgba(232,150,10,0.05))", border: "1.5px solid rgba(232,68,90,0.25)", borderRadius: 16, padding: "24px 26px" }}>
            <p style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>총 보유세 추정 (연간)</p>
            <p style={{ fontSize: 38, fontWeight: 900, color: "#e8445a", letterSpacing: "-0.8px", lineHeight: 1.1 }}>
              {result.grandTotal.toLocaleString()}<span style={{ fontSize: 22, fontWeight: 700, color: "#e8445a", marginLeft: 4 }}>만원</span>
            </p>
            <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 8 }}>재산세(지방세) + 종합부동산세(국세) 합계</p>
          </div>

          {/* 재산세 */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#0d9488" }}>재산세 (지방세)</p>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#0d9488" }}>{result.propertyTax.total.toLocaleString()}만원</span>
            </div>
            <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 12, lineHeight: 1.5 }}>매년 7월·9월 분납 (지자체 부과)</p>
            {[
              { label: "주택분", value: result.propertyTax.housing, note: "공시가 × 60% × 0.1~0.4% (4구간)" },
              { label: "건축물분 (상가)", value: result.propertyTax.commercial, note: "공시가 × 70% × 0.25%" },
              { label: "토지분 (별도합산)", value: result.propertyTax.land, note: "공시가 × 70% × 0.2~0.4% (3구간)" },
            ].map(({ label, value, note }) => (
              <div key={label} style={{ padding: "10px 0", borderBottom: "1px solid #f0efe9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: "#1a2744", fontWeight: 700, marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.4 }}>{note}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: value > 0 ? "#0d9488" : "#c0c0cc" }}>
                  {value.toLocaleString()}만원
                </span>
              </div>
            ))}
          </div>

          {/* 종합부동산세 */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#5b4fcf" }}>종합부동산세 (국세)</p>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#5b4fcf" }}>{result.comprehensiveTax.total.toLocaleString()}만원</span>
            </div>
            <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 12, lineHeight: 1.5 }}>매년 12월 1~15일 납부 (국세청)</p>

            <div style={{ padding: "12px 14px", background: "rgba(91,79,207,0.04)", borderRadius: 9, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>주택 종부세</p>
                <span style={{ fontSize: 14, fontWeight: 800, color: result.comprehensiveTax.housing > 0 ? "#5b4fcf" : "#c0c0cc" }}>
                  {result.comprehensiveTax.housing.toLocaleString()}만원
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#6a6a7a", lineHeight: 1.6 }}>
                공정시장가액(공시가×60%) - 공제 {(result.comprehensiveTax.housingDetail.exemption / 10000).toFixed(0)}억<br/>
                = 과세표준 <b>{result.comprehensiveTax.housingDetail.base.toLocaleString()}만원</b>
                {is3Plus && <span style={{ color: "#e8445a", fontWeight: 700 }}> · 3주택+ 중과 적용</span>}
              </p>
            </div>

            <div style={{ padding: "12px 14px", background: "rgba(13,148,136,0.04)", borderRadius: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>토지 종부세 (별도합산)</p>
                <span style={{ fontSize: 14, fontWeight: 800, color: result.comprehensiveTax.land > 0 ? "#0d9488" : "#c0c0cc" }}>
                  {result.comprehensiveTax.land.toLocaleString()}만원
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#6a6a7a", lineHeight: 1.6 }}>
                토지 공정시장가액(공시가×80%) - 공제 80억<br/>
                = 과세표준 <b>{result.comprehensiveTax.landDetail.base.toLocaleString()}만원</b>
              </p>
            </div>
          </div>

          {/* 안내 */}
          <div style={{ background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, color: "#6a6a7a", lineHeight: 1.7 }}>
              ⚠️ 본 계산은 2024년 세법 기준 <b style={{ color: "#1a2744" }}>참고용 추정치</b>입니다. 실제 세액은 보유 형태(개인/부부/법인), 보유 기간, 고령자 공제, 농어촌특별세 등에 따라 달라질 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── 컴포넌트 ───── */

const cardStyle = { background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, padding: "16px 18px" };
const SectionLabel = (color = "#8a8a9a") => ({ fontSize: 11, color, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 });

function PropertyGroup({ title, totalLabel, total, color, tenants, prices, updatePrice, savePrice, savingId }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color }}>{title}</p>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{totalLabel}: <b>{total.toLocaleString()}만원</b></span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tenants.map(t => (
          <div key={t.id} style={{ padding: "10px 12px", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <p style={{ fontSize: 13, color: "#1a2744", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.sub || ""} · {t.addr || "(주소 미입력)"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="number"
                value={prices[t.id] || ""}
                onChange={e => updatePrice(t.id, e.target.value)}
                onBlur={() => savePrice(t.id)}
                placeholder="공시가 입력 (만원)"
                style={{ flex: 1, padding: "9px 12px", fontSize: 14, color: "#1a2744", background: "#fff", border: `1px solid ${prices[t.id] ? color : "#ebe9e3"}`, borderRadius: 8, outline: "none", fontWeight: 600, boxSizing: "border-box" }}
              />
              <span style={{ fontSize: 11, color: savingId === t.id ? "#5b4fcf" : prices[t.id] ? "#0fa573" : "#a0a0b0", fontWeight: 700, minWidth: 50, textAlign: "right" }}>
                {savingId === t.id ? "저장 중" : prices[t.id] ? "✓ 저장됨" : "미입력"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckRow({ checked, onChange, title, desc }) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 14px",
      background: checked ? "rgba(91,79,207,0.05)" : "#fafaf7",
      border: `1px solid ${checked ? "#5b4fcf" : "#ebe9e3"}`,
      borderRadius: 9, cursor: "pointer",
    }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: "#5b4fcf", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: "#6a6a7a", margin: "3px 0 0", lineHeight: 1.5 }}>{desc}</p>
      </div>
    </label>
  );
}
