"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = { navy:"#1a2744", purple:"#5b4fcf", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", bg:"#f5f4f0", surface:"#ffffff", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4" };

function Slider({ label, value, setter, min, max, step=100, unit="만원", tip }) {
  return (
    <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{label}</span>
          {tip && <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>{tip}</span>}
        </div>
        <span style={{ fontSize: 18, fontWeight: 900, color: C.navy }}>{value.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}> {unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => setter(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.navy, height: 4 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: C.muted }}>{min.toLocaleString()}</span>
        <span style={{ fontSize: 10, color: C.muted }}>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, color, bold, separator }) {
  return (<>{{separator&&<div style={{height:1,background:C.border,margin:"8px 0"}}/>}}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0"}}><span style={{fontSize:13,color:C.muted}}>{label}</span><span style={{fontSize:bold?17:14,fontWeight:bold?900:700,color:color||C.navy}}>{value}</span></div></>);}

export default function ROIPage(){return <div className="page-in page-padding"><p>ROI Page stub</p></div>;}
