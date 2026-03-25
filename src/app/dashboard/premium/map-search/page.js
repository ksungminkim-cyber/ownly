"use client";
import { useRouter } from "next/navigation";

const C = { navy:"#1a2744", muted:"#8a8a9a", border:"#e8e6e0", faint:"#f8f7f4", surface:"#ffffff" };

export default function MapSearchPage() {
  const router = useRouter();
  return (
    <div className="page-in page-padding" style={{ maxWidth:680, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:14, padding:0 }}>
        ← 대시보드로
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#1a2744,#2d4270)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🗺️</div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.4px" }}>주변 매물 조회</h1>
            <span style={{ fontSize:10, fontWeight:800, color:"#c9920a", background:"rgba(201,146,10,0.12)", padding:"3px 8px", borderRadius:6 }}>PRO</span>
          </div>
          <p style={{ fontSize:13, color:C.muted }}>내 물건 주변 실거래가 · 매물 시세 비교</p>
        </div>
      </div>

      {/* 준비 중 */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"48px 32px", textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:20 }}>🔨</div>
        <h2 style={{ fontSize:20, fontWeight:900, color:"var(--text)", marginBottom:10 }}>개발 중입니다</h2>
        <p style={{ fontSize:14, color:C.muted, lineHeight:1.8, marginBottom:28, maxWidth:400, margin:"0 auto 28px" }}>
          국토부 실거래가 API 연동으로 내 물건 주변<br/>
          매물 시세를 직접 비교할 수 있는 기능을<br/>
          준비하고 있습니다.
        </p>

        {/* 출시 예정 기능 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, maxWidth:400, margin:"0 auto 32px", textAlign:"left" }}>
          {[
            { icon:"📍", title:"반경 내 매물 지도", desc:"내 물건 중심 500m~2km 반경 매물 표시" },
            { icon:"📊", title:"실거래가 비교", desc:"국토부 최근 1년 실거래 데이터 기반" },
            { icon:"💰", title:"적정 임대료 산출", desc:"유사 물건 비교해 적정 임대료 제안" },
            { icon:"📈", title:"시세 변동 추이", desc:"분기별 시세 변동 차트" },
          ].map(f => (
            <div key={f.title} style={{ background:C.faint, borderRadius:12, padding:"14px 16px" }}>
              <span style={{ fontSize:20, marginBottom:6, display:"block" }}>{f.icon}</span>
              <p style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:3 }}>{f.title}</p>
              <p style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:20, background:"rgba(26,39,68,0.06)", border:`1px solid rgba(26,39,68,0.12)` }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"#e8960a", display:"inline-block", animation:"pulse 2s infinite" }} />
          <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>2026년 2분기 출시 예정</span>
        </div>

        <p style={{ fontSize:12, color:C.muted, marginTop:20 }}>
          출시 알림을 받으려면 <strong>inquiry@mclean21.com</strong>으로 문의해주세요
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; }
          50% { opacity:0.3; }
        }
      `}</style>
    </div>
  );
}
