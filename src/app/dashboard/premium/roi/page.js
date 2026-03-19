"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = { navy:"#1a2744", purple:"#5b4fcf", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", bg:"#f5f4f0", surface:"#ffffff", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4" };

function Slider({ label, value, setter, min, max, step=100, unit="留뚯썝", tip }) {
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
        ????쒕낫?쒕줈
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#e8960a,#c9920a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>?뮥</div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, letterSpacing:"-.4px" }}>?섏씡瑜?怨꾩궛湲?/h1>
            <span style={{ fontSize:10, fontWeight:800, color:C.amber, background:"rgba(232,150,10,0.12)", padding:"3px 8px", borderRadius:6 }}>PLUS</span>
          </div>
          <p style={{ fontSize:13, color:C.muted }}>痍⑤뱷?맞룰굔蹂대즺쨌?뚮뱷?멸퉴吏 諛섏쁺???ㅼ쭏 ?섏씡瑜?怨꾩궛</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* ?낅젰 */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", textTransform:"uppercase" }}>臾쇨굔 ?뺣낫 ?낅젰</p>
          <Slider label="留ㅻℓ媛" value={price} setter={setPrice} min={5000} max={300000} step={1000} />
          <Slider label="?붿꽭" value={rent} setter={setRent} min={20} max={2000} step={10} />
          <Slider label="蹂댁쬆湲? value={dep} setter={setDep} min={0} max={100000} step={500} />
          <Slider label="?異쒓툑" value={loan} setter={setLoan} min={0} max={200000} step={1000} />

          <div style={{ background:C.faint, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>?異?湲덈━</span>
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

        {/* 寃곌낵 */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* ?ㅼ쭏 ?섏씡瑜??섏씠?쇱씠??*/}
          <div style={{ background:`linear-gradient(135deg,${roiColor}15,${roiColor}05)`, border:`2px solid ${roiColor}30`, borderRadius:20, padding:24, textAlign:"center" }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:8 }}>?ㅼ쭏 ?섏씡瑜?/p>
            <p style={{ fontSize:52, fontWeight:900, color:roiColor, letterSpacing:"-2px", lineHeight:1 }}>{roi}<span style={{ fontSize:22 }}>%</span></p>
            <p style={{ fontSize:12, color:C.muted, marginTop:8 }}>?쒕㈃ ?섏씡瑜?{grossRoi}%</p>
            <div style={{ marginTop:14, padding:"8px 14px", background:roiColor+"15", borderRadius:10 }}>
              <p style={{ fontSize:12, fontWeight:700, color:roiColor }}>
                {roiNum >= 5 ? "???곗닔???섏씡瑜? : roiNum >= 3 ? "?뱤 ?됯퇏 ?섏씡瑜? : "?좑툘 ??? ?섏씡瑜?}
              </p>
            </div>
          </div>

          {/* ?섏씡 ?곸꽭 */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 20px" }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:12 }}>?섏씡 ?곸꽭</p>
            <ResultRow label="???꾨??섏씡" value={annualRent.toLocaleString()+"留뚯썝"} color={C.emerald} />
            <ResultRow label="?異??댁옄" value={"-"+Math.round(loanInterest).toLocaleString()+"留뚯썝"} color={C.rose} />
            <ResultRow label="醫낇빀?뚮뱷??(異붿젙)" value={"-"+incomeTax.toLocaleString()+"留뚯썝"} color={C.rose} />
            <ResultRow label="嫄닿컯蹂댄뿕猷?(異붿젙)" value={"-"+healthIns.toLocaleString()+"留뚯썝"} color={C.rose} />
            <ResultRow label="珥?鍮꾩슜" value={"-"+totalExpense.toLocaleString()+"留뚯썝"} color={C.rose} bold separator />
            <ResultRow label="???섏씡" value={netIncome.toLocaleString()+"留뚯썝"} color={netIncome>=0?C.emerald:C.rose} bold separator />
          </div>

          {/* ?ъ옄湲?*/}
          <div style={{ background:C.faint, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 18px" }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>?ㅽ닾?먭툑 遺꾩꽍</p>
            <ResultRow label="留ㅻℓ媛" value={price.toLocaleString()+"留뚯썝"} />
            <ResultRow label="痍⑤뱷??(4.6%)" value={"+"+acquisitionTax.toLocaleString()+"留뚯썝"} color={C.rose} />
            <ResultRow label="蹂댁쬆湲?李④컧" value={"-"+dep.toLocaleString()+"留뚯썝"} color={C.emerald} />
            <ResultRow label="?異?李④컧" value={"-"+loan.toLocaleString()+"留뚯썝"} color={C.emerald} />
            <ResultRow label="?ㅽ닾?먭툑" value={invested.toLocaleString()+"留뚯썝"} bold separator />
          </div>
        </div>
      </div>

      <p style={{ fontSize:11, color:C.muted, marginTop:16, lineHeight:1.7, textAlign:"center" }}>
        ???멸툑? ?⑥닚 異붿젙移섏엯?덈떎. ?뺥솗???몃Т ?먮떒? ?몃Т?ъ뿉寃?臾몄쓽?섏꽭??
      </p>

      {/* PDF ?대낫?닿린 踰꾪듉 */}
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
          ?뱞 ?섏씡瑜?由ы룷??PDF ???        </button>
      </div>
    </div>
  );
}

