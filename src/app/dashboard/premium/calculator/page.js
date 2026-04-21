"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = {
  navy:"#1a2744", purple:"#5b4fcf", emerald:"#0fa573",
  rose:"#e8445a", amber:"#e8960a",
  surface:"var(--surface)", border:"var(--border)",
  muted:"var(--text-muted)", faint:"var(--surface2)",
};

const TABS = [
  { key:"roi",      label:"💰 수익률 계산기",       plan:"plus" },
  { key:"rent",     label:"📈 임대료 인상 계산기",   plan:"plus" },
  { key:"deposit",  label:"🔑 보증금 반환 계산기",   plan:"plus" },
  { key:"vacancy",  label:"📉 공실 손실 계산기",     plan:"plus" },
];

// ── 시나리오 저장/불러오기 (localStorage, 계산기별 최대 10개) ───────────
function loadScenariosFromStorage(calcType) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`ownly_calc_${calcType}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function useScenarios(calcType) {
  const [scenarios, setScenarios] = useState(() => loadScenariosFromStorage(calcType));
  const persist = (next) => {
    setScenarios(next);
    try { localStorage.setItem(`ownly_calc_${calcType}`, JSON.stringify(next)); } catch {}
  };
  const save = (name, data) => {
    const s = { id: Date.now(), name: name || `시나리오 ${scenarios.length + 1}`, data, createdAt: new Date().toISOString() };
    persist([s, ...scenarios].slice(0, 10));
    return s;
  };
  const remove = (id) => persist(scenarios.filter(s => s.id !== id));
  return { scenarios, save, remove };
}

// 내 물건 선택 + 시나리오 저장/불러오기 공통 바
function ScenarioBar({ calcType, state, onLoadProperty, onLoadScenario }) {
  const { tenants } = useApp();
  const { scenarios, save, remove } = useScenarios(calcType);
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState("");
  return (
    <div style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "0.5px", textTransform: "uppercase" }}>🔗 연동</span>
      {tenants.length > 0 && (
        <select defaultValue="" onChange={e => { const t = tenants.find(x => String(x.id) === e.target.value); if (t) { onLoadProperty(t); e.target.value = ""; } }}
          style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", fontSize: 12, fontWeight: 600, color: C.navy, cursor: "pointer" }}>
          <option value="">내 물건에서 불러오기 ▾</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{(t.addr || "").slice(0, 20)} · {t.name || "공실"}</option>)}
        </select>
      )}
      {scenarios.length > 0 && (
        <select defaultValue="" onChange={e => { const s = scenarios.find(x => String(x.id) === e.target.value); if (s) { onLoadScenario(s.data); e.target.value = ""; } }}
          style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", fontSize: 12, fontWeight: 600, color: C.navy, cursor: "pointer" }}>
          <option value="">📂 저장된 시나리오 ({scenarios.length}) ▾</option>
          {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}
      <button onClick={() => setShowSave(true)}
        style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: C.navy, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>💾 현재 저장</button>
      {scenarios.length > 0 && (
        <details style={{ fontSize: 11 }}>
          <summary style={{ cursor: "pointer", color: C.muted, fontWeight: 600 }}>관리</summary>
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflow: "auto" }}>
            {scenarios.map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 8px", background: "#fff", borderRadius: 6 }}>
                <span style={{ fontSize: 11, color: C.navy }}>{s.name}</span>
                <button onClick={() => remove(s.id)} style={{ padding: "2px 6px", fontSize: 10, color: C.rose, background: "transparent", border: "none", cursor: "pointer" }}>삭제</button>
              </div>
            ))}
          </div>
        </details>
      )}
      {showSave && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowSave(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 20, width: 320, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>시나리오 이름</p>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="예: 강남 오피스 공실 3개월"
              style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none" }}
              onKeyDown={e => { if (e.key === "Enter") { save(name, state); setName(""); setShowSave(false); } }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowSave(false)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={() => { save(name, state); setName(""); setShowSave(false); }}
                style={{ flex: 2, padding: "9px", borderRadius: 8, border: "none", background: C.navy, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 공통 슬라이더 ────────────────────────────────────────────────
function Slider({ label, value, setter, min, max, step=100, unit="만원", tip }) {
  return (
    <div style={{ background:C.faint, borderRadius:14, padding:"16px 18px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div>
          <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{label}</span>
          {tip && <span style={{ fontSize:11, color:C.muted, marginLeft:6 }}>{tip}</span>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <input type="number" value={value} min={min} onChange={e => { const v=Number(e.target.value); if(!isNaN(v)&&v>=0) setter(v); }}
            style={{ width:100, padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
          <span style={{ fontSize:12, fontWeight:600, color:C.muted }}>{unit}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={Math.min(value,max)} onChange={e => setter(Number(e.target.value))}
        style={{ width:"100%", accentColor:C.navy, height:4 }} />
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        <span style={{ fontSize:10, color:C.muted }}>{min.toLocaleString()}</span>
        <span style={{ fontSize:10, color:C.muted }}>{max.toLocaleString()}+</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, color, bold, separator }) {
  return (
    <>
      {separator && <div style={{ height:1, background:C.border, margin:"8px 0" }} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0" }}>
        <span style={{ fontSize:13, color:C.muted }}>{label}</span>
        <span style={{ fontSize: bold?17:14, fontWeight: bold?900:700, color: color||C.navy }}>{value}</span>
      </div>
    </>
  );
}

// ── 수익률 계산기 ─────────────────────────────────────────────────
function ROICalc() {
  const [price, setPrice] = useState(50000);
  const [rent,  setRent]  = useState(300);
  const [dep,   setDep]   = useState(5000);
  const [loan,  setLoan]  = useState(30000);
  const [rate,  setRate]  = useState(4.5);

  const loadProperty = (t) => {
    if (t.dep) setDep(Number(t.dep));
    if (t.rent) setRent(Number(t.rent));
  };
  const loadScenario = (d) => {
    if (d.price !== undefined) setPrice(d.price);
    if (d.rent !== undefined) setRent(d.rent);
    if (d.dep !== undefined) setDep(d.dep);
    if (d.loan !== undefined) setLoan(d.loan);
    if (d.rate !== undefined) setRate(d.rate);
  };

  const annualRent    = rent * 12;
  const loanInterest  = (loan * rate) / 100;
  const acquisitionTax = Math.round(price * 0.046);
  const healthIns     = Math.round(annualRent * 0.034);
  const incomeTax     = Math.max(0, Math.round((annualRent - 2000) * 0.15));
  const totalExpense  = Math.round(loanInterest + healthIns + incomeTax);
  const netIncome     = annualRent - totalExpense;
  const invested      = price + acquisitionTax - dep - loan;
  const roi           = invested > 0 ? ((netIncome / invested) * 100).toFixed(2) : "0";
  const grossRoi      = ((annualRent / price) * 100).toFixed(2);
  const roiNum        = Number(roi);
  const roiColor      = roiNum >= 5 ? C.emerald : roiNum >= 3 ? C.amber : C.rose;

  return (
    <>
    <ScenarioBar calcType="roi" state={{ price, rent, dep, loan, rate }} onLoadProperty={loadProperty} onLoadScenario={loadScenario} />
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", textTransform:"uppercase" }}>물건 정보 입력</p>
        <Slider label="매매가" value={price} setter={setPrice} min={5000}  max={300000} step={1000} />
        <Slider label="월세"   value={rent}  setter={setRent}  min={20}    max={2000}   step={10}   />
        <Slider label="보증금" value={dep}   setter={setDep}   min={0}     max={100000} step={500}  />
        <Slider label="대출금" value={loan}  setter={setLoan}  min={0}     max={200000} step={1000} />
        <div style={{ background:C.faint, borderRadius:14, padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>대출 금리</span>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <input type="number" value={rate} min={0} step={0.1} onChange={e => { const v=Number(e.target.value); if(!isNaN(v)&&v>=0) setRate(v); }}
                style={{ width:70, padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
              <span style={{ fontSize:12, color:C.muted }}>%</span>
            </div>
          </div>
          <input type="range" min={0} max={20} step={0.1} value={Math.min(rate,20)} onChange={e => setRate(Number(e.target.value))}
            style={{ width:"100%", accentColor:C.navy }} />
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ background:`linear-gradient(135deg,${roiColor}15,${roiColor}05)`, border:`2px solid ${roiColor}30`, borderRadius:20, padding:24, textAlign:"center" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:8 }}>실질 수익률</p>
          <p style={{ fontSize:52, fontWeight:900, color:roiColor, letterSpacing:"-2px", lineHeight:1 }}>{roi}<span style={{ fontSize:22 }}>%</span></p>
          <p style={{ fontSize:12, color:C.muted, marginTop:8 }}>표면 수익률 {grossRoi}%</p>
          <div style={{ marginTop:14, padding:"8px 14px", background:roiColor+"15", borderRadius:10 }}>
            <p style={{ fontSize:12, fontWeight:700, color:roiColor }}>
              {roiNum >= 5 ? "✅ 우수한 수익률" : roiNum >= 3 ? "📊 평균 수익률" : "⚠️ 낮은 수익률"}
            </p>
          </div>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 20px" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:12 }}>수익 상세</p>
          <ResultRow label="연 임대수익"       value={annualRent.toLocaleString()+"만원"}            color={C.emerald} />
          <ResultRow label="대출 이자"          value={"-"+Math.round(loanInterest).toLocaleString()+"만원"} color={C.rose} />
          <ResultRow label="종합소득세 (추정)"  value={"-"+incomeTax.toLocaleString()+"만원"}         color={C.rose} />
          <ResultRow label="건강보험료 (추정)"  value={"-"+healthIns.toLocaleString()+"만원"}         color={C.rose} />
          <ResultRow label="총 비용"            value={"-"+totalExpense.toLocaleString()+"만원"}      color={C.rose} bold separator />
          <ResultRow label="순 수익"            value={netIncome.toLocaleString()+"만원"}             color={netIncome>=0?C.emerald:C.rose} bold separator />
        </div>
        <div style={{ background:C.faint, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 18px" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>실투자금 분석</p>
          <ResultRow label="매매가"      value={price.toLocaleString()+"만원"} />
          <ResultRow label="취득세 (4.6%)" value={"+"+acquisitionTax.toLocaleString()+"만원"} color={C.rose} />
          <ResultRow label="보증금 차감" value={"-"+dep.toLocaleString()+"만원"}  color={C.emerald} />
          <ResultRow label="대출 차감"   value={"-"+loan.toLocaleString()+"만원"} color={C.emerald} />
          <ResultRow label="실투자금"    value={invested.toLocaleString()+"만원"} bold separator />
        </div>
      </div>
    </div>
    </>
  );
}

// ── 임대료 인상 계산기 ────────────────────────────────────────────
function RentIncreaseCalc() {
  const [currentRent, setCurrentRent] = useState(100);
  const [dep, setDep]       = useState(5000);
  const [method, setMethod] = useState("monthly"); // monthly | deposit | mixed
  const [targetIncrease, setTargetIncrease] = useState(5);

  const maxIncrease   = Math.round(currentRent * 0.05);
  const legalMax      = currentRent + maxIncrease;
  const depConversion = Math.round(dep * 0.025 / 12);
  const totalCurrent  = currentRent + depConversion;

  const depositToRent = Math.round(dep * 0.025 / 12);
  const newRent5      = Math.round(currentRent * 1.05);
  const newDep5       = Math.round(dep * 1.05);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", textTransform:"uppercase" }}>현재 계약 정보</p>
        <Slider label="현재 월세" value={currentRent} setter={setCurrentRent} min={10} max={2000} step={5} />
        <Slider label="현재 보증금" value={dep} setter={setDep} min={0} max={100000} step={500} />
        <div style={{ background:C.faint, borderRadius:14, padding:"16px 18px" }}>
          <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>전환 방식</p>
          {[
            { key:"monthly",  label:"월세 인상", desc:"월세를 5% 인상" },
            { key:"deposit",  label:"보증금 인상", desc:"보증금을 5% 인상" },
            { key:"mixed",    label:"보증금 → 월세 전환", desc:"보증금 줄이고 월세로" },
          ].map(m => (
            <div key={m.key} onClick={() => setMethod(m.key)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:`1.5px solid ${method===m.key ? C.navy : C.border}`, background: method===m.key ? "rgba(26,39,68,0.04)" : "transparent", cursor:"pointer", marginBottom:8 }}>
              <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${method===m.key ? C.navy : C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {method===m.key && <div style={{ width:8, height:8, borderRadius:"50%", background:C.navy }} />}
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{m.label}</p>
                <p style={{ fontSize:11, color:C.muted }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ background:"linear-gradient(135deg,rgba(26,39,68,0.06),rgba(26,39,68,0.02))", border:`2px solid rgba(26,39,68,0.15)`, borderRadius:20, padding:24 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:16 }}>🏛️ 임대차 3법 기준 (5% 상한)</p>
          <ResultRow label="현재 월세"   value={currentRent.toLocaleString()+"만원"} />
          <ResultRow label="5% 상한 인상액" value={"+"+maxIncrease.toLocaleString()+"만원"} color={C.amber} />
          <ResultRow label="법정 최대 월세" value={legalMax.toLocaleString()+"만원"}   color={C.navy} bold separator />
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 20px" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:12 }}>
            {method === "monthly" ? "월세 인상 결과" : method === "deposit" ? "보증금 인상 결과" : "전환 시나리오"}
          </p>
          {method === "monthly" && <>
            <ResultRow label="현재 월세"  value={currentRent.toLocaleString()+"만원"} />
            <ResultRow label="인상 후"    value={newRent5.toLocaleString()+"만원"} color={C.emerald} bold separator />
            <ResultRow label="연간 추가 수익" value={(maxIncrease*12).toLocaleString()+"만원"} color={C.emerald} />
          </>}
          {method === "deposit" && <>
            <ResultRow label="현재 보증금" value={dep.toLocaleString()+"만원"} />
            <ResultRow label="인상 후"     value={newDep5.toLocaleString()+"만원"} color={C.emerald} bold separator />
            <ResultRow label="추가 보증금" value={(newDep5-dep).toLocaleString()+"만원"} color={C.emerald} />
            <ResultRow label="월세 전환 시" value={"+"+depositToRent.toLocaleString()+"만원/월"} color={C.amber} />
          </>}
          {method === "mixed" && <>
            <ResultRow label="현재 보증금"    value={dep.toLocaleString()+"만원"} />
            <ResultRow label="보증금 1000만 감소 시" value={"월세 +"+(Math.round(1000*0.025/12)).toLocaleString()+"만원"} color={C.amber} />
            <ResultRow label="법정 전환이율"  value="연 2.5%" color={C.muted} />
            <div style={{ marginTop:12, padding:"12px", background:"rgba(232,150,10,0.06)", borderRadius:10 }}>
              <p style={{ fontSize:12, color:C.amber, fontWeight:700 }}>보증금 1000만원 = 월세 약 2.1만원</p>
            </div>
          </>}
        </div>
        <div style={{ background:"rgba(15,165,115,0.06)", border:"1px solid rgba(15,165,115,0.2)", borderRadius:14, padding:"14px 16px" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.emerald, marginBottom:6 }}>💡 환산 월세 (참고)</p>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>
            현재 보증금 {dep.toLocaleString()}만원을 월세로 환산하면<br/>
            <strong style={{ color:C.emerald }}>+{depositToRent.toLocaleString()}만원/월</strong> (연 2.5% 기준)
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 보증금 반환 계산기 ────────────────────────────────────────────
function DepositReturnCalc() {
  const [dep,    setDep]    = useState(10000);
  const [unpaid, setUnpaid] = useState(0);
  const [repair, setRepair] = useState(0);
  const [months, setMonths] = useState(0);

  const lateRate    = 0.12;
  const lateAmount  = Math.round(dep * (lateRate / 12) * months);
  const deductions  = unpaid + repair;
  const returnAmt   = Math.max(0, dep - deductions);
  const netReturn   = Math.max(0, returnAmt + lateAmount);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", textTransform:"uppercase" }}>보증금 정보</p>
        <Slider label="보증금"       value={dep}    setter={setDep}    min={0} max={100000} step={500} />
        <Slider label="미납 월세"    value={unpaid} setter={setUnpaid} min={0} max={10000}  step={10}  />
        <Slider label="수리비 공제"  value={repair} setter={setRepair} min={0} max={5000}   step={10}  />
        <div style={{ background:C.faint, borderRadius:14, padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>연체 개월 수</span>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <input type="number" value={months} min={0} max={36} onChange={e => setMonths(Number(e.target.value))}
                style={{ width:70, padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
              <span style={{ fontSize:12, color:C.muted }}>개월</span>
            </div>
          </div>
          <p style={{ fontSize:11, color:C.muted }}>연체이율 연 12% (상사법정이율) 적용</p>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ background:`linear-gradient(135deg,rgba(15,165,115,0.08),rgba(15,165,115,0.02))`, border:`2px solid rgba(15,165,115,0.2)`, borderRadius:20, padding:24 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:8 }}>반환해야 할 보증금</p>
          <p style={{ fontSize:48, fontWeight:900, color:C.emerald, letterSpacing:"-2px", lineHeight:1 }}>
            {returnAmt.toLocaleString()}<span style={{ fontSize:20 }}>만원</span>
          </p>
          {lateAmount > 0 && (
            <p style={{ fontSize:13, color:C.amber, marginTop:8 }}>
              연체이자 +{lateAmount.toLocaleString()}만원 포함 시 {netReturn.toLocaleString()}만원
            </p>
          )}
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 20px" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:12 }}>계산 내역</p>
          <ResultRow label="보증금"         value={dep.toLocaleString()+"만원"} color={C.emerald} />
          <ResultRow label="미납 월세 공제" value={"-"+unpaid.toLocaleString()+"만원"} color={C.rose} />
          <ResultRow label="수리비 공제"    value={"-"+repair.toLocaleString()+"만원"} color={C.rose} />
          <ResultRow label="반환 보증금"    value={returnAmt.toLocaleString()+"만원"} bold separator />
          {months > 0 && (
            <ResultRow label={`연체이자 (${months}개월 × 연12%)`} value={"+"+lateAmount.toLocaleString()+"만원"} color={C.amber} />
          )}
          {months > 0 && (
            <ResultRow label="최종 반환액" value={netReturn.toLocaleString()+"만원"} color={C.emerald} bold separator />
          )}
        </div>
        <div style={{ background:"rgba(232,150,10,0.06)", border:"1px solid rgba(232,150,10,0.2)", borderRadius:14, padding:"14px 16px" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.amber, marginBottom:6 }}>⚖️ 법적 기준</p>
          <p style={{ fontSize:12, color:C.muted, lineHeight:1.8 }}>
            • 보증금 반환 기한: 퇴거일로부터 즉시<br/>
            • 연체이율: 연 12% (상사법정이율)<br/>
            • 미반환 시 임차인은 내용증명 → 소송 가능
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 공실 손실 계산기 ─────────────────────────────────────────────
function VacancyCalc() {
  const [rent,     setRent]     = useState(200);
  const [mgt,      setMgt]      = useState(20);
  const [loan,     setLoan]     = useState(20000);
  const [rate,     setRate]     = useState(4.5);
  const [vacancy,  setVacancy]  = useState(3);
  const [taxRate,  setTaxRate]  = useState(15);

  const loadProperty = (t) => {
    if (t.rent) setRent(Number(t.rent));
    if (t.maintenance) setMgt(Number(t.maintenance));
  };
  const loadScenario = (d) => {
    if (d.rent !== undefined) setRent(d.rent);
    if (d.mgt !== undefined) setMgt(d.mgt);
    if (d.loan !== undefined) setLoan(d.loan);
    if (d.rate !== undefined) setRate(d.rate);
    if (d.vacancy !== undefined) setVacancy(d.vacancy);
    if (d.taxRate !== undefined) setTaxRate(d.taxRate);
  };

  const monthlyLost   = rent + mgt;
  const totalLost     = monthlyLost * vacancy;
  const loanCost      = Math.round((loan * rate / 100) / 12) * vacancy;
  const taxSaving     = Math.round(totalLost * taxRate / 100);
  const netLoss       = totalLost + loanCost - taxSaving;
  const annualRent    = (rent + mgt) * 12;
  const vacancyRate   = ((vacancy / 12) * 100).toFixed(1);
  const effectiveYield = (((annualRent - totalLost - loanCost) / ((rent+mgt)*12 || 1)) * 100).toFixed(1);

  return (
    <>
    <ScenarioBar calcType="vacancy" state={{ rent, mgt, loan, rate, vacancy, taxRate }} onLoadProperty={loadProperty} onLoadScenario={loadScenario} />
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", textTransform:"uppercase" }}>물건 정보</p>
        <Slider label="월세"      value={rent}    setter={setRent}    min={10}  max={2000}  step={10}  />
        <Slider label="관리비"    value={mgt}     setter={setMgt}     min={0}   max={500}   step={5}   />
        <Slider label="대출금"    value={loan}    setter={setLoan}    min={0}   max={200000} step={1000} />
        <div style={{ background:C.faint, borderRadius:14, padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>대출 금리</span>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <input type="number" value={rate} step={0.1} min={0} onChange={e => setRate(Number(e.target.value))}
                style={{ width:70, padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
              <span style={{ fontSize:12, color:C.muted }}>%</span>
            </div>
          </div>
        </div>
        <Slider label="공실 예상 기간" value={vacancy} setter={setVacancy} min={1} max={24} step={1} unit="개월" />
        <div style={{ background:C.faint, borderRadius:14, padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>소득세율 (절세 계산용)</span>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <input type="number" value={taxRate} min={0} max={50} onChange={e => setTaxRate(Number(e.target.value))}
                style={{ width:70, padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
              <span style={{ fontSize:12, color:C.muted }}>%</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ background:`linear-gradient(135deg,rgba(232,68,90,0.08),rgba(232,68,90,0.02))`, border:`2px solid rgba(232,68,90,0.2)`, borderRadius:20, padding:24, textAlign:"center" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:8 }}>예상 순 손실</p>
          <p style={{ fontSize:48, fontWeight:900, color:C.rose, letterSpacing:"-2px", lineHeight:1 }}>
            {netLoss.toLocaleString()}<span style={{ fontSize:20 }}>만원</span>
          </p>
          <p style={{ fontSize:12, color:C.muted, marginTop:8 }}>공실율 {vacancyRate}% / 실효 수익률 {effectiveYield}%</p>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 20px" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:12 }}>손실 상세</p>
          <ResultRow label="월 임대수입 손실"  value={"-"+monthlyLost.toLocaleString()+"만원/월"} color={C.rose} />
          <ResultRow label={`총 임대 손실 (${vacancy}개월)`} value={"-"+totalLost.toLocaleString()+"만원"} color={C.rose} bold separator />
          <ResultRow label="이자 비용"         value={"-"+loanCost.toLocaleString()+"만원"} color={C.rose} />
          <ResultRow label="세금 절감 (추정)"  value={"+"+taxSaving.toLocaleString()+"만원"} color={C.emerald} />
          <ResultRow label="순 손실"           value={netLoss.toLocaleString()+"만원"} color={C.rose} bold separator />
        </div>
        <div style={{ background:"rgba(15,165,115,0.06)", border:"1px solid rgba(15,165,115,0.2)", borderRadius:14, padding:"14px 16px" }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.emerald, marginBottom:6 }}>💡 공실 최소화 전략</p>
          <p style={{ fontSize:12, color:C.muted, lineHeight:1.8 }}>
            • 만료 90일 전 세입자에게 갱신 의향 확인<br/>
            • 직방·다방·네이버 동시 등록으로 노출 극대화<br/>
            • 공실 2개월 이상 시 월세 5% 인하 검토
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

// ── 메인 내부 컴포넌트 (useSearchParams 사용) ─────────────────────
function CalculatorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { userPlan } = useApp();
  const [tab, setTab] = useState(params?.get("tab") || "roi");
  const isPro = userPlan === "plus" || userPlan === "pro";

  if (!isPro) {
    return (
      <div className="page-in page-padding" style={{ maxWidth:680, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
        <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:14, padding:0 }}>
          ← 대시보드로
        </button>
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:56, marginBottom:20 }}>🔒</div>
          <h1 style={{ fontSize:22, fontWeight:900, color:"var(--text)", marginBottom:10 }}>플러스 플랜 전용 기능</h1>
          <p style={{ fontSize:14, color:C.muted, lineHeight:1.8, marginBottom:28 }}>수익률·임대료·보증금·공실 계산기는<br/>플러스 플랜 이상에서 이용 가능합니다.</p>
          <button onClick={() => router.push("/dashboard/pricing")}
            style={{ padding:"14px 32px", borderRadius:12, background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", border:"none", fontWeight:800, fontSize:15, cursor:"pointer" }}>
            플러스 업그레이드 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-in page-padding" style={{ maxWidth:960, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:14, padding:0 }}>
        ← 대시보드로
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#e8960a,#c9920a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>📐</div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.4px" }}>임대 계산기</h1>
            <span style={{ fontSize:10, fontWeight:800, color:"#4f46e5", background:"rgba(79,70,229,0.12)", padding:"3px 8px", borderRadius:6 }}>PLUS</span>
          </div>
          <p style={{ fontSize:13, color:C.muted }}>수익률 · 임대료 인상 · 보증금 반환 · 공실 손실 계산</p>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", gap:8, marginBottom:28, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:"10px 18px", borderRadius:11, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, border:`2px solid ${tab===t.key ? C.navy : C.border}`, background: tab===t.key ? "rgba(26,39,68,0.07)" : "transparent", color: tab===t.key ? C.navy : C.muted }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "roi"     && <ROICalc />}
      {tab === "rent"    && <RentIncreaseCalc />}
      {tab === "deposit" && <DepositReturnCalc />}
      {tab === "vacancy" && <VacancyCalc />}

      <p style={{ fontSize:11, color:C.muted, marginTop:24, textAlign:"center", lineHeight:1.7 }}>
        ※ 모든 계산 결과는 참고용 추정치입니다. 정확한 세무·법률 판단은 전문가에게 문의하세요.
      </p>
    </div>
  );
}

// ✅ Suspense로 감싸서 useSearchParams 빌드 에러 해결
export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="page-in page-padding" style={{ color:"#8a8a9a", fontSize:13 }}>불러오는 중...</div>}>
      <CalculatorContent />
    </Suspense>
  );
}
