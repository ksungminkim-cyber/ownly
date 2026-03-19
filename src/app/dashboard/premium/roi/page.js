"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = { navy:"#1a2744", purple:"#5b4fcf", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", bg:"#f5f4f0", surface:"#ffffff", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4" };

function Slider({ label, value, setter, min, max, step=100, unit="만원", tip }) {
  return (
    <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{label}</span>
          {tip && <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>{tip}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="number" value={value} min={min}
            onChange={e => { const v = Number(e.target.value); if (!isNaN(v) && v >= 0) setter(v); }}
            style={{ width: 100, padding: "4px 8px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.navy, textAlign: "right", outline: "none", background: "#fff" }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{unit}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={Math.min(value, max)}
        onChange={e => setter(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.navy, height: 4 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: C.muted }}>{min.toLocaleString()}</span>
        <span style={{ fontSize: 10, color: C.muted }}>{max.toLocaleString()}+</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, color, bold, separator }) {
  return (
    <>
      {separator && <div style={{ height: 1, background: C.border, margin: "8px 0" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" }}>
        <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
        <span style={{ fontSize: bold ? 17 : 14, fontWeight: bold ? 900 : 700, color: color || C.navy }}>{value}</span>
      </div>
    </>
  );
}

export default function ROIPage() {
  const router = useRouter();
  const { tenants } = useApp();
  const [price, setPrice] = useState(50000);
  const [rent,  setRent]  = useState(300);
  const [dep,   setDep]   = useState(5000);
  const [loan,  setLoan]  = useState(30000);
  const [rate,  setRate]  = useState(4.5);

  const annualRent     = rent * 12;
  const loanInterest   = (loan * rate) / 100;
  const acquisitionTax = Math.round(price * 0.046);
  const healthIns      = Math.round(annualRent * 0.034);
  const incomeTax      = Math.max(0, Math.round((annualRent - 2000) * 0.15));
  const totalExpense   = Math.round(loanInterest + healthIns + incomeTax);
  const netIncome      = annualRent - totalExpense;
  const invested       = price + acquisitionTax - dep - loan;
  const roi            = invested > 0 ? ((netIncome / invested) * 100).toFixed(2) : "0";
  const grossRoi       = ((annualRent / price) * 100).toFixed(2);
  const roiNum         = Number(roi);
  const roiColor       = roiNum >= 5 ? C.emerald : roiNum >= 3 ? C.amber : C.rose;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 760, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()}
        style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:14, padding:0 }}>
        ← 대시보드로
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#e8960a,#c9920a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>💰</div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, letterSpacing:"-.4px" }}>수익률 계산기</h1>
            <span style={{ fontSize:10, fontWeight:800, color:C.amber, background:"rgba(232,150,10,0.12)", padding:"3px 8px", borderRadius:6 }}>STARTER+</span>
          </div>
          <p style={{ fontSize:13, color:C.muted }}>취득세·건보료·소득세까지 반영한 실질 수익률 계산</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* 입력 */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", textTransform:"uppercase" }}>물건 정보 입력</p>
          <Slider label="매매가" value={price} setter={setPrice} min={5000} max={300000} step={1000} />
          <Slider label="월세" value={rent} setter={setRent} min={20} max={2000} step={10} />
          <Slider label="보증금" value={dep} setter={setDep} min={0} max={100000} step={500} />
          <Slider label="대출금" value={loan} setter={setLoan} min={0} max={200000} step={1000} />

          <div style={{ background:C.faint, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>대출 금리</span>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <input type="number" value={rate} min={0} step={0.1}
                  onChange={e => { const v=Number(e.target.value); if(!isNaN(v)&&v>=0) setRate(v); }}
                  style={{ width:70, padding:"4px 8px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
                <span style={{ fontSize:12, color:C.muted }}>%</span>
              </div>
            </div>
            <input type="range" min={0} max={20} step={0.1} value={Math.min(rate,20)}
              onChange={e => setRate(Number(e.target.value))}
              style={{ width:"100%", accentColor:C.navy }} />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
              <span style={{ fontSize:10, color:C.muted }}>0%</span>
              <span style={{ fontSize:10, color:C.muted }}>20%+</span>
            </div>
          </div>
        </div>

        {/* 결과 */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* 실질 수익률 하이라이트 */}
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

          {/* 수익 상세 */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 20px" }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:12 }}>수익 상세</p>
            <ResultRow label="연 임대수익" value={annualRent.toLocaleString()+"만원"} color={C.emerald} />
            <ResultRow label="대출 이자" value={"-"+Math.round(loanInterest).toLocaleString()+"만원"} color={C.rose} />
            <ResultRow label="종합소득세 (추정)" value={"-"+incomeTax.toLocaleString()+"만원"} color={C.rose} />
            <ResultRow label="건강보험료 (추정)" value={"-"+healthIns.toLocaleString()+"만원"} color={C.rose} />
            <ResultRow label="총 비용" value={"-"+totalExpense.toLocaleString()+"만원"} color={C.rose} bold separator />
            <ResultRow label="순 수익" value={netIncome.toLocaleString()+"만원"} color={netIncome>=0?C.emerald:C.rose} bold separator />
          </div>

          {/* 투자금 */}
          <div style={{ background:C.faint, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 18px" }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>실투자금 분석</p>
            <ResultRow label="매매가" value={price.toLocaleString()+"만원"} />
            <ResultRow label="취득세 (4.6%)" value={"+"+acquisitionTax.toLocaleString()+"만원"} color={C.rose} />
            <ResultRow label="보증금 차감" value={"-"+dep.toLocaleString()+"만원"} color={C.emerald} />
            <ResultRow label="대출 차감" value={"-"+loan.toLocaleString()+"만원"} color={C.emerald} />
            <ResultRow label="실투자금" value={invested.toLocaleString()+"만원"} bold separator />
          </div>
        </div>
      </div>

      <p style={{ fontSize:11, color:C.muted, marginTop:16, lineHeight:1.7, textAlign:"center" }}>
        ※ 세금은 단순 추정치입니다. 정확한 세무 판단은 세무사에게 문의하세요.
      </p>

      {/* PDF 내보내기 버튼 */}
      <div style={{ marginTop:20, display:"flex", justifyContent:"center" }}>
        <button
          onClick={() => {
            const style = document.createElement("style");
            style.innerHTML = `@media print { .no-print { display:none!important; } body { background:#fff; } }`;
            document.head.appendChild(style);
            window.print();
            setTimeout(() => document.head.removeChild(style), 1000);
          }}
          className="no-print"
          style={{
            padding:"12px 28px", borderRadius:12, minHeight:44,
            background:`linear-gradient(135deg,${C.navy},${C.purple})`,
            border:"none", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer",
            display:"flex", alignItems:"center", gap:8,
            boxShadow:"0 4px 16px rgba(26,39,68,0.25)",
          }}>
          📄 수익률 리포트 PDF 저장
        </button>
      </div>
    </div>
  );
}
