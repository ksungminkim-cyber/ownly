"use client";
import { useEffect, useState } from "react";

export default function CertifiedPrintPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ownly_certified_print");
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (data) setTimeout(() => window.print(), 600);
  }, [data]);

  if (!data) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"white", fontFamily:"'Malgun Gothic','Apple SD Gothic Neo',sans-serif" }}>
      <p style={{ color:"#8a8a9a" }}>문서를 불러오는 중...</p>
    </div>
  );

  const { h, formData: f, today, legalBasis } = data;

  return (
    <div style={{ maxWidth:680, margin:"0 auto", padding:"60px 40px", fontFamily:"'Malgun Gothic','Apple SD Gothic Neo','Pretendard',sans-serif", color:"#1a1a2e", background:"white", minHeight:"100vh" }}>

      {/* 문서 제목 */}
      <div style={{ textAlign:"center", borderBottom:"3px double #1a2744", paddingBottom:28, marginBottom:32 }}>
        <h1 style={{ fontSize:30, fontWeight:900, letterSpacing:12, color:"#1a2744", marginBottom:6 }}>내 용 증 명</h1>
        <p style={{ fontSize:12, color:"#8a8a9a" }}>작성일: {today}</p>
      </div>

      {/* 수신인 / 발신인 정보 */}
      <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:28, fontSize:13 }}>
        <tbody>
          {[
            { label:"수 신", name: f.receiverName || h.tenant_name, addr: f.receiverAddr || "", phone: f.receiverPhone || "" },
            { label:"발 신", name: f.senderName || "", addr: f.senderAddr || "", phone: f.senderPhone || "" },
          ].map((row, i) => (
            <tr key={i} style={{ borderTop:"1px solid #d0d0d8", borderBottom:"1px solid #d0d0d8" }}>
              <td style={{ padding:"12px 16px", fontWeight:800, color:"#1a2744", background:"#f8f7f4", width:60, textAlign:"center", letterSpacing:2, fontSize:12, borderRight:"1px solid #d0d0d8" }}>{row.label}</td>
              <td style={{ padding:"12px 20px", lineHeight:1.8 }}>
                <span style={{ fontWeight:700 }}>성 명: </span>{row.name || "　　　　　"}&emsp;&emsp;
                <span style={{ fontWeight:700 }}>주 소: </span>{row.addr || "　　　　　　　　　　　　"}&emsp;&emsp;
                {row.phone && <><span style={{ fontWeight:700 }}>연락처: </span>{row.phone}</>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 임대 목적물 */}
      {(f.propertyAddr || f.contractStart || f.contractEnd) && (
        <div style={{ border:"1px solid #d0d0d8", borderRadius:4, marginBottom:24, overflow:"hidden" }}>
          <div style={{ background:"#1a2744", color:"#fff", padding:"8px 16px", fontSize:12, fontWeight:800, letterSpacing:1 }}>임대 목적물 및 계약 사항</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <tbody>
              {[
                ["임 대 목 적 물", f.propertyAddr || "—"],
                ["임 대 차 기 간", `${f.contractStart || "　　　　"} ~ ${f.contractEnd || "　　　　"}`],
                ["월 임 대 료", f.rentAmt ? `금 ${Number(f.rentAmt).toLocaleString()}만 원 (${(Number(f.rentAmt)*10000).toLocaleString()}원)` : "—"],
                ["보 증 금", f.depositAmt ? `금 ${Number(f.depositAmt).toLocaleString()}만 원 (${(Number(f.depositAmt)*10000).toLocaleString()}원)` : "—"],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderTop:"1px solid #ebe9e3" }}>
                  <td style={{ padding:"9px 16px", fontWeight:700, color:"#1a2744", background:"#f8f7f4", width:160, fontSize:12 }}>{label}</td>
                  <td style={{ padding:"9px 16px" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 본문 제목 */}
      <div style={{ textAlign:"center", margin:"28px 0 20px", fontSize:15, fontWeight:900, letterSpacing:4, color:"#1a2744" }}>
        — 내 용 —
      </div>

      {/* 본문 */}
      <div style={{ border:"1px solid #d0d0d8", borderRadius:4, padding:"28px 32px", minHeight:260, lineHeight:2.2, fontSize:13.5, color:"#1a1a2e", whiteSpace:"pre-wrap", marginBottom:28 }}>
        {h.content}
      </div>

      {/* 이행 기한 강조 */}
      {f.deadlineDays && (
        <div style={{ border:"2px solid #1a2744", borderRadius:4, padding:"12px 20px", marginBottom:28, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>📅</span>
          <p style={{ fontSize:13, fontWeight:700, color:"#1a2744" }}>
            이행 기한: 본 내용증명 수령일로부터 <span style={{ color:"#dc2626", fontSize:16 }}>{f.deadlineDays}일 이내</span> 이행하여 주시기 바랍니다.
          </p>
        </div>
      )}

      {/* 법적 근거 */}
      <div style={{ background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:4, padding:"10px 16px", marginBottom:32, fontSize:12, color:"#8a8a9a" }}>
        적용 법령: {legalBasis}
      </div>

      {/* 마무리 문구 */}
      <div style={{ textAlign:"right", marginBottom:16 }}>
        <p style={{ fontSize:13, color:"#1a1a2e", marginBottom:4 }}>위와 같이 내용을 증명합니다.</p>
        <p style={{ fontSize:13, color:"#1a1a2e" }}>{today}</p>
      </div>

      {/* 날인 — 발신인(임대인)만 */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:24, marginBottom:40 }}>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:11, color:"#8a8a9a", marginBottom:6 }}>발신인 (임대인)</p>
          <p style={{ fontSize:13, fontWeight:700, color:"#1a2744", marginBottom:8 }}>{f.senderName || "　　　　　"}</p>
          <div style={{ width:80, height:80, border:"1px solid #d0d0d8", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", color:"#d0d0d8", fontSize:11 }}>
            (인)
          </div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div style={{ borderTop:"1px solid #d0d0d8", paddingTop:14, textAlign:"center" }}>
        <p style={{ fontSize:10, color:"#a0a0b0" }}>본 내용증명은 Ownly(ownly.kr)에서 작성되었습니다 · {today}</p>
        <p style={{ fontSize:9, color:"#c0c0d0", marginTop:3 }}>※ 법적 효력을 위해 우체국 내용증명 우편으로 발송하시기 바랍니다</p>
      </div>

      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        nav, aside, header, footer,
        .sidebar, .mobile-header, .bottom-nav, .no-print,
        [class*="ticker"], [class*="Ticker"],
        [class*="layout"], [class*="navigation"] { display: none !important; }
        @media print {
          @page { margin: 20mm; size: A4 portrait; }
          body { margin: 0 !important; background: white !important; }
          nav, aside, header, footer,
          .sidebar, .bottom-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
