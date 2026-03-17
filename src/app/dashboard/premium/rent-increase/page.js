"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = {
  navy: "#1a2744", purple: "#5b4fcf", emerald: "#0fa573",
  rose: "#e8445a", amber: "#e8960a", border: "#e8e6e0",
  surface: "#ffffff", faint: "#f8f7f4", muted: "#8a8a9a",
};

const MAX_RATE = 5; // 주택임대차보호법 상한 5%

function InfoRow({ label, value, color, bold, separator }) {
  return (
    <>
      {separator && <div style={{ height: 1, background: C.border, margin: "8px 0" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
        <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
        <span style={{ fontSize: bold ? 18 : 14, fontWeight: bold ? 900 : 700, color: color || C.navy }}>{value}</span>
      </div>
    </>
  );
}

export default function RentIncreasePage() {
  const router = useRouter();
  const { tenants } = useApp();

  const [mode, setMode] = useState("manual"); // manual | tenant
  const [selectedTid, setSelectedTid] = useState("");
  const [currentRent, setCurrentRent] = useState(50);
  const [currentDep, setCurrentDep] = useState(1000);
  const [rate, setRate] = useState(5);
  const [convertDep, setConvertDep] = useState(false); // 보증금 월세 전환 여부

  // 선택된 임차인 정보 자동 입력
  const onSelectTenant = (tid) => {
    setSelectedTid(tid);
    const t = tenants.find(x => x.id === tid);
    if (t) {
      setCurrentRent(t.rent || 50);
      setCurrentDep(t.dep ? t.dep / 10000 : 1000);
    }
  };

  const actualRate = Math.min(rate, MAX_RATE);
  const newRent = Math.round(currentRent * (1 + actualRate / 100));
  const rentIncrease = newRent - currentRent;
  const newDep = Math.round(currentDep * (1 + actualRate / 100));
  const depIncrease = newDep - currentDep;

  // 보증금→월세 전환 (전월세 전환율 5.5% 기준)
  const DEP_TO_RENT_RATE = 5.5;
  const depToRentMonthly = Math.round((depIncrease * 10000 * DEP_TO_RENT_RATE) / 100 / 12);

  const isOverLimit = rate > MAX_RATE;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 720, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        ← 뒤로가기
      </button>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${C.navy},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📈</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: "-.4px" }}>임대료 인상 계산기</h1>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.amber, background: "rgba(232,150,10,0.12)", padding: "3px 8px", borderRadius: 6 }}>STARTER+</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>5% 상한제 기준으로 인상액을 자동 계산합니다</p>
        </div>
      </div>

      {/* 법적 안내 배너 */}
      <div style={{ background: "rgba(26,39,68,0.05)", border: `1px solid ${C.navy}22`, borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18 }}>⚖️</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, marginBottom: 2 }}>주택임대차보호법 — 임대료 인상 상한 5%</p>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>계약갱신청구권 행사 시 임대료(월세·보증금) 인상은 직전 금액의 5%를 초과할 수 없습니다. 상가는 5%, 주택은 5% 상한이 적용됩니다.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* 입력 영역 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 임차인 불러오기 */}
          {tenants.length > 0 && (
            <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>임차인 불러오기</p>
              <select onChange={e => onSelectTenant(e.target.value)} value={selectedTid}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, color: C.navy, cursor: "pointer", appearance: "none" }}>
                <option value="">직접 입력</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.rent}만원/월</option>
                ))}
              </select>
            </div>
          )}

          {/* 현재 월세 슬라이더 */}
          <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>현재 월세</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.navy }}>{currentRent.toLocaleString()}<span style={{ fontSize: 12, color: C.muted }}> 만원</span></span>
            </div>
            <input type="range" min={10} max={500} step={5} value={currentRent} onChange={e => setCurrentRent(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.navy, height: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>10만원</span>
              <span style={{ fontSize: 10, color: C.muted }}>500만원</span>
            </div>
          </div>

          {/* 현재 보증금 슬라이더 */}
          <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>현재 보증금</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.navy }}>{currentDep.toLocaleString()}<span style={{ fontSize: 12, color: C.muted }}> 만원</span></span>
            </div>
            <input type="range" min={0} max={50000} step={500} value={currentDep} onChange={e => setCurrentDep(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.navy, height: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>0</span>
              <span style={{ fontSize: 10, color: C.muted }}>5억</span>
            </div>
          </div>

          {/* 인상률 슬라이더 */}
          <div style={{ background: isOverLimit ? "rgba(232,68,90,0.06)" : C.faint, border: `1px solid ${isOverLimit ? C.rose + "40" : "transparent"}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isOverLimit ? C.rose : C.navy }}>인상률</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: isOverLimit ? C.rose : C.navy }}>{rate}<span style={{ fontSize: 12 }}>%</span></span>
            </div>
            <input type="range" min={1} max={10} step={0.5} value={rate} onChange={e => setRate(Number(e.target.value))}
              style={{ width: "100%", accentColor: isOverLimit ? C.rose : C.navy, height: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>1%</span>
              <span style={{ fontSize: 10, color: isOverLimit ? C.rose : C.muted, fontWeight: isOverLimit ? 700 : 400 }}>5% 상한</span>
              <span style={{ fontSize: 10, color: C.muted }}>10%</span>
            </div>
            {isOverLimit && (
              <p style={{ fontSize: 11, color: C.rose, fontWeight: 700, marginTop: 8 }}>⚠️ 5% 초과 — 계약갱신청구권 행사 시 법적 상한을 넘습니다. 계산은 5%로 적용됩니다.</p>
            )}
          </div>

          {/* 보증금→월세 전환 옵션 */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 16px", background: C.faint, borderRadius: 12 }}>
            <input type="checkbox" checked={convertDep} onChange={e => setConvertDep(e.target.checked)} className="custom-check" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>보증금 인상분 → 월세 전환 계산</p>
              <p style={{ fontSize: 11, color: C.muted }}>전월세 전환율 5.5% 기준</p>
            </div>
          </label>
        </div>

        {/* 결과 영역 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 핵심 결과 카드 */}
          <div style={{ background: `linear-gradient(135deg,${C.navy}12,${C.purple}08)`, border: `2px solid ${C.navy}20`, borderRadius: 20, padding: 24, textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", marginBottom: 8 }}>인상 후 월세</p>
            <p style={{ fontSize: 52, fontWeight: 900, color: C.navy, letterSpacing: "-2px", lineHeight: 1 }}>{newRent.toLocaleString()}<span style={{ fontSize: 20 }}>만원</span></p>
            <div style={{ marginTop: 14, padding: "8px 14px", background: C.emerald + "15", borderRadius: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>월 +{rentIncrease.toLocaleString()}만원 증가</p>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>연 +{(rentIncrease * 12).toLocaleString()}만원</p>
            </div>
          </div>

          {/* 상세 내역 */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", marginBottom: 12 }}>상세 계산 내역</p>
            <InfoRow label="현재 월세" value={`${currentRent.toLocaleString()}만원`} />
            <InfoRow label={`적용 인상률 (${actualRate}%)`} value={`+${rentIncrease.toLocaleString()}만원`} color={C.emerald} />
            <InfoRow label="인상 후 월세" value={`${newRent.toLocaleString()}만원`} bold separator />
            <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
            <InfoRow label="현재 보증금" value={`${currentDep.toLocaleString()}만원`} />
            <InfoRow label={`적용 인상률 (${actualRate}%)`} value={`+${depIncrease.toLocaleString()}만원`} color={C.emerald} />
            <InfoRow label="인상 후 보증금" value={`${newDep.toLocaleString()}만원`} bold separator />
          </div>

          {/* 보증금→월세 전환 결과 */}
          {convertDep && (
            <div style={{ background: "rgba(91,79,207,0.06)", border: `1px solid ${C.purple}30`, borderRadius: 16, padding: "16px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.purple, letterSpacing: "1px", marginBottom: 12 }}>보증금 인상분 → 월세 전환</p>
              <InfoRow label="보증금 인상분" value={`${depIncrease.toLocaleString()}만원`} />
              <InfoRow label="전환율 (5.5%)" value="" />
              <InfoRow label="추가 월세 환산" value={`+${depToRentMonthly.toLocaleString()}만원/월`} color={C.purple} bold separator />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
                보증금 인상 대신 월세로 받을 경우 월 {depToRentMonthly.toLocaleString()}만원 추가 수령 가능
              </p>
            </div>
          )}

          {/* PDF 출력 */}
          <button onClick={() => window.print()} className="no-print"
            style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg,${C.navy},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 16px ${C.navy}30` }}>
            🖨️ 계산 결과 PDF 출력
          </button>
        </div>
      </div>
    </div>
  );
}
