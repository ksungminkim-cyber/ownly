"use client";
import { useState } from "react";
import { SectionLabel } from "../../../../components/shared";
import { C } from "../../../../lib/constants";
import PlanGate from "../../../../components/PlanGate";

export default function GlobalReportsPage() {
  return <PlanGate feature="globalReports"><GlobalReportsContent /></PlanGate>;
}

const REPORTS = [
  {
    firm: "JLL",
    firmColor: "#C8102E",
    firmBg: "#fff0f0",
    logo: "JLL",
    category: "글로벌 시장",
    title: "Global Real Estate Outlook 2025",
    desc: "전 세계 주요 도시 오피스·물류·리테일 시장 전망. 금리 하락기 투자 전략 분석.",
    tags: ["오피스", "물류", "글로벌"],
    url: "https://www.jll.com/en/trends-and-insights/research/global-real-estate-perspective",
    date: "2025 Q1",
  },
  {
    firm: "JLL",
    firmColor: "#C8102E",
    firmBg: "#fff0f0",
    logo: "JLL",
    category: "한국 시장",
    title: "Korea Real Estate Market Report",
    desc: "서울 오피스 공실률·임대료 동향, 물류센터 수요 분석, 주요 거래 사례 포함.",
    tags: ["서울", "오피스", "물류"],
    url: "https://www.jll.co.kr/ko/trends-and-insights/research",
    date: "2025 Q1",
  },
  {
    firm: "CBRE",
    firmColor: "#006A4D",
    firmBg: "#f0fff8",
    logo: "CBRE",
    category: "글로벌 시장",
    title: "2025 Global Real Estate Market Outlook",
    desc: "아시아·유럽·미주 상업용 부동산 투자 흐름 및 섹터별 성과 전망.",
    tags: ["투자", "아시아", "리테일"],
    url: "https://www.cbre.com/insights/books/2025-global-real-estate-market-outlook",
    date: "2025 Q1",
  },
  {
    firm: "CBRE",
    firmColor: "#006A4D",
    firmBg: "#f0fff8",
    logo: "CBRE",
    category: "아시아태평양",
    title: "Asia Pacific Real Estate Market Outlook 2025",
    desc: "한국·일본·싱가포르·호주 등 아태 시장 섹터별 투자 기회 및 리스크 분석.",
    tags: ["아태", "한국", "오피스"],
    url: "https://www.cbre.com/insights/books/asia-pacific-real-estate-market-outlook-2025",
    date: "2025 Q1",
  },
  {
    firm: "Cushman",
    firmColor: "#8B1A1A",
    firmBg: "#fff5f0",
    logo: "C&W",
    category: "글로벌 시장",
    title: "Global Outlook 2025 — Cushman & Wakefield",
    desc: "글로벌 경기 사이클 분석과 상업용 부동산 자산군별 투자 전략 제시.",
    tags: ["글로벌", "투자전략", "경기분석"],
    url: "https://www.cushmanwakefield.com/en/insights/global-outlook",
    date: "2025 Q1",
  },
  {
    firm: "Cushman",
    firmColor: "#8B1A1A",
    firmBg: "#fff5f0",
    logo: "C&W",
    category: "아시아태평양",
    title: "APAC Office MarketBeat 2025",
    desc: "아시아태평양 오피스 시장 분기별 공실률, 임대료, 흡수량 데이터 분석 리포트.",
    tags: ["오피스", "아태", "MarketBeat"],
    url: "https://www.cushmanwakefield.com/en/asia-pacific/insights",
    date: "2025 Q1",
  },
  {
    firm: "Savills",
    firmColor: "#0070C0",
    firmBg: "#f0f7ff",
    logo: "SAV",
    category: "글로벌 시장",
    title: "World Research — Savills 2025",
    desc: "주거·리테일·오피스·산업시설 전반에 걸친 글로벌 부동산 트렌드 종합 리포트.",
    tags: ["주거", "글로벌", "트렌드"],
    url: "https://www.savills.com/research_articles/255800/359297-0",
    date: "2025",
  },
  {
    firm: "Knight Frank",
    firmColor: "#2C3E7A",
    firmBg: "#f0f2ff",
    logo: "KF",
    category: "글로벌 시장",
    title: "The Wealth Report 2025",
    desc: "글로벌 초고자산가(UHNWI) 부동산 투자 패턴과 프라임 주거 시장 가격 전망.",
    tags: ["프라임", "럭셔리", "투자"],
    url: "https://www.knightfrank.com/wealthreport",
    date: "2025",
  },
];

const FIRMS = ["전체", "JLL", "CBRE", "Cushman", "Savills", "Knight Frank"];

function GlobalReportsContent() {
  const [firm, setFirm] = useState("전체");
  const [search, setSearch] = useState("");

  const filtered = REPORTS.filter(r =>
    (firm === "전체" || r.firm === firm) &&
    (search === "" || r.title.toLowerCase().includes(search.toLowerCase()) || r.tags.some(t => t.includes(search)))
  );

  return (
    <div className="page-in page-padding" style={{ maxWidth: 940 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>GLOBAL REPORTS</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>글로벌 부동산 리포트</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>JLL · CBRE · Cushman & Wakefield · Savills · Knight Frank 공식 리포트 바로가기</p>
      </div>

      {/* 안내 배너 */}
      <div style={{ background:"linear-gradient(135deg,#1a2744,#2d4270)", borderRadius:16, padding:"18px 24px", marginBottom:22, display:"flex", alignItems:"center", gap:16 }}>
        <span style={{ fontSize:32 }}>🌐</span>
        <div>
          <p style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:3 }}>글로벌 5대 부동산 리서치 기관 리포트를 한곳에서</p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>리포트 클릭 시 해당 기관의 공식 페이지로 이동합니다. 최신 자료는 각 기관 사이트에서 직접 확인하세요.</p>
        </div>
      </div>

      {/* 필터 + 검색 */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6, flex:1, flexWrap:"wrap" }}>
          {FIRMS.map(f => (
            <button key={f} onClick={() => setFirm(f)} style={{
              padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
              border:`1px solid ${firm===f ? C.indigo : "#ebe9e3"}`,
              background: firm===f ? C.indigo : "transparent",
              color: firm===f ? "#fff" : C.muted,
            }}>{f}</button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 검색..."
          style={{ padding:"6px 14px", borderRadius:10, border:"1px solid #ebe9e3", fontSize:13, color:"#1a2744", outline:"none", background:"#f8f7f4", minWidth:160 }} />
      </div>

      {/* 리포트 카드 그리드 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(400px,1fr))", gap:14 }}>
        {filtered.map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration:"none", display:"block" }}>
            <div className="hover-lift" style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:16, padding:"20px 22px", height:"100%", cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {/* 로고 뱃지 */}
                  <div style={{ background:r.firmBg, border:`1px solid ${r.firmColor}30`, borderRadius:10, padding:"6px 10px", minWidth:44, textAlign:"center" }}>
                    <span style={{ fontSize:11, fontWeight:900, color:r.firmColor, letterSpacing:"-.3px" }}>{r.logo}</span>
                  </div>
                  <div>
                    <span style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".5px" }}>{r.category}</span>
                    <span style={{ fontSize:10, color:C.muted, display:"block" }}>{r.date}</span>
                  </div>
                </div>
                <span style={{ fontSize:16 }}>↗</span>
              </div>
              <h3 style={{ fontSize:14, fontWeight:800, color:"#1a2744", marginBottom:8, lineHeight:1.4 }}>{r.title}</h3>
              <p style={{ fontSize:12, color:C.muted, lineHeight:1.6, marginBottom:12 }}>{r.desc}</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {r.tags.map(tag => (
                  <span key={tag} style={{ fontSize:10, fontWeight:700, color:r.firmColor, background:r.firmBg, padding:"2px 8px", borderRadius:5 }}>{tag}</span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:60, color:C.muted }}>
          <p style={{ fontSize:15, fontWeight:700 }}>검색 결과가 없습니다</p>
        </div>
      )}

      <p style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:28 }}>
        * 리포트 링크는 각 기관 공식 사이트로 연결됩니다. 열람 정책은 해당 기관에 따릅니다.
      </p>
    </div>
  );
}
