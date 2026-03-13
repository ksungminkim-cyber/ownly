"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const C = { navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", surface:"#ffffff", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4" };

const HOT_AREAS = [
  { city:"서울", areas:["강남구 역삼동","마포구 합정동","송파구 잠실동","서초구 반포동","용산구 이태원동"] },
  { city:"경기", areas:["성남시 분당구","수원시 영통구","화성시 동탄2신도시","고양시 일산동구"] },
  { city:"부산", areas:["해운대구 우동","수영구 광안동","남구 대연동"] },
];

export default function MapSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const openNaver = (q) => window.open(`https://m.land.naver.com/search/result/${encodeURIComponent(q)}`, "_blank");

  return (
    <div className="page-in page-padding" style={{ maxWidth:720, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()}
        style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:14, padding:0 }}>
        ← 대시보드로
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#03C75A,#02a34c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🗺️</div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, letterSpacing:"-.4px" }}>주변 매물 조회</h1>
            <span style={{ fontSize:10, fontWeight:800, color:"#03C75A", background:"rgba(3,199,90,0.1)", padding:"3px 8px", borderRadius:6 }}>PRO</span>
          </div>
          <p style={{ fontSize:13, color:C.muted }}>네이버 부동산 연동으로 주변 시세와 매물을 확인하세요</p>
        </div>
      </div>

      {/* 검색 */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:24, marginBottom:20, boxShadow:"0 2px 12px rgba(26,39,68,0.06)" }}>
        <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:14 }}>매물 검색</p>
        <div style={{ display:"flex", gap:10 }}>
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key==="Enter" && openNaver(query)}
            placeholder="예: 서울 강남구, 합정동 아파트"
            style={{ flex:1, padding:"12px 16px", borderRadius:12, border:`1.5px solid ${C.border}`,
              fontSize:14, outline:"none", color:C.navy, background:C.faint, fontFamily:"inherit" }} />
          <button onClick={() => openNaver(query)} disabled={!query}
            style={{ padding:"12px 24px", borderRadius:12, background:"#03C75A", color:"#fff",
              border:"none", cursor:"pointer", fontSize:14, fontWeight:800, whiteSpace:"nowrap" }}>
            네이버 부동산 →
          </button>
        </div>
      </div>

      {/* 인기 지역 */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:24 }}>
        <p style={{ fontSize:14, fontWeight:800, color:C.navy, marginBottom:18 }}>🔥 인기 지역 바로가기</p>
        {HOT_AREAS.map(g => (
          <div key={g.city} style={{ marginBottom:18 }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:10 }}>{g.city}</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {g.areas.map(a => (
                <button key={a} onClick={() => openNaver(a)}
                  style={{ padding:"9px 16px", borderRadius:10, background:C.faint, border:`1px solid ${C.border}`,
                    color:C.navy, fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background="#03C75A"; e.currentTarget.style.color="#fff"; e.currentTarget.style.border="1px solid #03C75A"; }}
                  onMouseLeave={e => { e.currentTarget.style.background=C.faint; e.currentTarget.style.color=C.navy; e.currentTarget.style.border=`1px solid ${C.border}`; }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>※ 네이버 부동산 외부 사이트로 이동합니다.</p>
      </div>
    </div>
  );
}
