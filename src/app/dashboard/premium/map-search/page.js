"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import PlanGate from "../../../../components/PlanGate";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const C = {
  navy: "#1a2744", navyLight: "#2d4270", purple: "#5b4fcf",
  emerald: "#0fa573", rose: "#e8445a", amber: "#e8960a", indigo: "#3b5bdb",
  muted: "var(--text-muted)", border: "var(--border)", surface: "var(--surface)", faint: "var(--surface2)",
};

const LAWD_MAP = {
  "서울 강남구": "11680", "서울 서초구": "11650", "서울 송파구": "11710",
  "서울 강동구": "11740", "서울 마포구": "11440", "서울 용산구": "11170",
  "서울 성동구": "11200", "서울 광진구": "11215", "서울 동작구": "11590",
  "서울 영등포구": "11560", "서울 양천구": "11470", "서울 강서구": "11500",
  "서울 구로구": "11530", "서울 금천구": "11545", "서울 관악구": "11620",
  "서울 서대문구": "11410", "서울 은평구": "11380", "서울 종로구": "11110",
  "서울 중구": "11140", "서울 노원구": "11350", "서울 도봉구": "11320",
  "서울 강북구": "11305", "서울 성북구": "11290", "서울 동대문구": "11230",
  "서울 중랑구": "11260", "경기 성남시": "41130", "경기 수원시": "41110",
  "경기 용인시": "41460", "경기 고양시": "41280", "경기 화성시": "41590",
  "경기 안양시": "41170", "경기 부천시": "41190", "부산 해운대구": "26350",
  "부산 수영구": "26500", "인천 연수구": "28185", "인천 송도": "28185",
};

const TYPE_OPTIONS = [
  { key: "apt_rent",   label: "🏢 아파트 월세·전세", molit: "apt_rent" },
  { key: "villa_rent", label: "🏠 연립·다세대",      molit: "villa_rent" },
  { key: "offi_rent",  label: "🏬 오피스텔",         molit: "offi_rent" },
  { key: "house_rent", label: "🏡 단독·다가구",       molit: "house_rent" },
];

// 거래 유형 판정 (전세 vs 월세)
function isJeonse(row) {
  return !row.monthlyRent || parseInt(row.monthlyRent || "0", 10) === 0;
}

function formatMan(n) {
  if (!n) return "-";
  return Number(n).toLocaleString() + "만";
}

// 동·로 이름 → 구 매핑 (주소에 구가 안 적혀도 감지)
const DONG_TO_GU = {
  // 마포구
  "서교동":"마포구","합정동":"마포구","망원동":"마포구","연남동":"마포구","상암동":"마포구","공덕동":"마포구","아현동":"마포구","대흥동":"마포구","성산동":"마포구","신공덕동":"마포구","염리동":"마포구","용강동":"마포구","현석동":"마포구","창전동":"마포구","양화로":"마포구","월드컵로":"마포구","와우산로":"마포구",
  // 강남구
  "역삼동":"강남구","삼성동":"강남구","청담동":"강남구","논현동":"강남구","신사동":"강남구","압구정동":"강남구","대치동":"강남구","도곡동":"강남구","개포동":"강남구","세곡동":"강남구","수서동":"강남구","일원동":"강남구","테헤란로":"강남구","강남대로":"강남구","언주로":"강남구","도산대로":"강남구",
  // 서초구
  "서초동":"서초구","반포동":"서초구","잠원동":"서초구","방배동":"서초구","양재동":"서초구","내곡동":"서초구","우면동":"서초구","염곡동":"서초구",
  // 송파구
  "잠실동":"송파구","석촌동":"송파구","송파동":"송파구","방이동":"송파구","가락동":"송파구","문정동":"송파구","장지동":"송파구","마천동":"송파구","거여동":"송파구",
  // 용산구
  "한남동":"용산구","이태원동":"용산구","용산동":"용산구","후암동":"용산구","청파동":"용산구","원효로":"용산구","남영동":"용산구","보광동":"용산구","이촌동":"용산구",
  // 성동구
  "성수동":"성동구","왕십리":"성동구","금호동":"성동구","옥수동":"성동구","행당동":"성동구","마장동":"성동구",
  // 광진구
  "광장동":"광진구","자양동":"광진구","구의동":"광진구","중곡동":"광진구","능동":"광진구","군자동":"광진구",
  // 영등포구
  "여의도동":"영등포구","영등포동":"영등포구","당산동":"영등포구","문래동":"영등포구","양평동":"영등포구","신길동":"영등포구","대림동":"영등포구","도림동":"영등포구",
  // 동작구
  "노량진동":"동작구","상도동":"동작구","흑석동":"동작구","사당동":"동작구","대방동":"동작구","신대방동":"동작구","동작동":"동작구",
  // 양천구
  "목동":"양천구","신정동":"양천구","신월동":"양천구",
  // 강서구
  "화곡동":"강서구","등촌동":"강서구","염창동":"강서구","방화동":"강서구","마곡동":"강서구","가양동":"강서구","공항동":"강서구","외발산동":"강서구","발산동":"강서구",
  // 구로구
  "구로동":"구로구","개봉동":"구로구","고척동":"구로구","오류동":"구로구","수궁동":"구로구","항동":"구로구","가리봉동":"구로구",
  // 관악구
  "봉천동":"관악구","신림동":"관악구","남현동":"관악구",
  // 서대문구
  "신촌동":"서대문구","대신동":"서대문구","홍제동":"서대문구","홍은동":"서대문구","남가좌동":"서대문구","북가좌동":"서대문구","연희동":"서대문구","북아현동":"서대문구",
  // 은평구
  "녹번동":"은평구","불광동":"은평구","갈현동":"은평구","구산동":"은평구","대조동":"은평구","역촌동":"은평구","응암동":"은평구","신사동":"은평구","증산동":"은평구","수색동":"은평구","진관동":"은평구",
  // 종로구
  "삼청동":"종로구","부암동":"종로구","평창동":"종로구","가회동":"종로구","계동":"종로구","연건동":"종로구","원서동":"종로구","재동":"종로구","인사동":"종로구","종로":"종로구","세종로":"종로구",
  // 중구
  "명동":"중구","을지로":"중구","충무로":"중구","필동":"중구","장충동":"중구","신당동":"중구","황학동":"중구","다산동":"중구","광희동":"중구","회현동":"중구",
  // 노원구
  "상계동":"노원구","중계동":"노원구","하계동":"노원구","공릉동":"노원구","월계동":"노원구",
  // 도봉구
  "쌍문동":"도봉구","방학동":"도봉구","창동":"도봉구","도봉동":"도봉구",
  // 강북구
  "미아동":"강북구","수유동":"강북구","번동":"강북구","우이동":"강북구",
  // 성북구
  "성북동":"성북구","돈암동":"성북구","안암동":"성북구","보문동":"성북구","정릉동":"성북구","길음동":"성북구","종암동":"성북구","장위동":"성북구","석관동":"성북구",
  // 동대문구
  "용두동":"동대문구","제기동":"동대문구","청량리동":"동대문구","회기동":"동대문구","휘경동":"동대문구","이문동":"동대문구","답십리동":"동대문구","전농동":"동대문구","장안동":"동대문구",
  // 중랑구
  "면목동":"중랑구","상봉동":"중랑구","중화동":"중랑구","묵동":"중랑구","신내동":"중랑구","망우동":"중랑구",
};

// 내 물건 주소에서 구(區) 추론 — 실패 시 서울 강남구 기본
function guessRegionFromProperty(t) {
  if (!t?.addr) return "서울 강남구";
  const addr = t.addr;
  // 1) 직접 구명이 들어있는지
  for (const region of Object.keys(LAWD_MAP)) {
    const [sido, gu] = region.split(" ");
    if (addr.includes(gu)) return region;
    if (addr.includes(sido) && addr.includes(gu.slice(0, 2))) return region;
  }
  // 2) 동·로명으로 구 역추론
  for (const [dong, gu] of Object.entries(DONG_TO_GU)) {
    if (addr.includes(dong)) {
      const region = Object.keys(LAWD_MAP).find(r => r.endsWith(" " + gu));
      if (region) return region;
    }
  }
  return "서울 강남구";
}

function propertyTypeGuess(t) {
  if (!t) return "apt_rent";
  if (t.sub === "오피스텔") return "offi_rent";
  if (t.sub === "빌라" || t.sub === "다세대") return "villa_rent";
  if (t.sub === "단독주택" || t.pType === "주거" && t.sub?.includes("단독")) return "house_rent";
  return "apt_rent";
}

export default function MapSearchPage() {
  return <PlanGate feature="map_search" requiredPlan="pro"><MapSearchContent /></PlanGate>;
}

function MapSearchContent() {
  const router = useRouter();
  const { tenants } = useApp();
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [region, setRegion] = useState("서울 강남구");
  const [type, setType] = useState("apt_rent");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  // 내 물건 선택 시 지역/유형 자동 추정
  const pickTenant = (t) => {
    setSelectedTenantId(t.id);
    setRegion(guessRegionFromProperty(t));
    setType(propertyTypeGuess(t));
    setData(null);
  };

  const months = useMemo(() => {
    const now = new Date();
    const arr = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return arr;
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    setError("");
    setData(null);
    const lawdCd = LAWD_MAP[region];
    try {
      const results = await Promise.all(
        months.map(ym =>
          fetch(`/api/market/molit?type=${type}&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`)
            .then(r => r.json())
        )
      );
      const allItems = [];
      results.forEach((res, idx) => {
        const ym = months[idx];
        (res.items || []).forEach(it => {
          allItems.push({
            ...it,
            _ym: ym,
            _deposit: parseInt(String(it.deposit || "0").replace(/,/g, ""), 10) || 0,
            _monthly: parseInt(String(it.monthlyRent || "0").replace(/,/g, ""), 10) || 0,
            _area: parseFloat(it.excluUseAr || it.exclusiveUseArea || "0") || 0,
            _floor: parseInt(it.floor || "0", 10),
            _name: it.aptNm || it.offiNm || it.mhouseNm || it.houseType || "—",
            _dong: it.umdNm || "",
            _day: it.dealDay ? String(it.dealDay).padStart(2, "0") : "",
          });
        });
      });

      if (allItems.length === 0) {
        setError("해당 지역 실거래 데이터가 없습니다. 다른 유형을 선택해보세요.");
        setLoading(false);
        return;
      }

      const monthlyItems = allItems.filter(i => i._monthly > 0);
      const jeonseItems = allItems.filter(i => i._monthly === 0);
      const avgMonthly = monthlyItems.length > 0
        ? Math.round(monthlyItems.reduce((s, i) => s + i._monthly, 0) / monthlyItems.length)
        : 0;
      const avgMonthlyDeposit = monthlyItems.length > 0
        ? Math.round(monthlyItems.reduce((s, i) => s + i._deposit, 0) / monthlyItems.length)
        : 0;
      const avgJeonseDeposit = jeonseItems.length > 0
        ? Math.round(jeonseItems.reduce((s, i) => s + i._deposit, 0) / jeonseItems.length)
        : 0;
      const avgArea = allItems.length > 0
        ? Math.round(allItems.reduce((s, i) => s + i._area, 0) / allItems.length * 10) / 10
        : 0;
      const jeonseRatio = allItems.length > 0 ? Math.round((jeonseItems.length / allItems.length) * 100) : 0;

      // 월별 집계 — 거래량/평균 월세
      const byMonth = months.map(ym => {
        const items = allItems.filter(i => i._ym === ym);
        const m = items.filter(i => i._monthly > 0);
        const j = items.filter(i => i._monthly === 0);
        return {
          label: `${ym.slice(2, 4)}.${ym.slice(4, 6)}`,
          total: items.length,
          jeonse: j.length,
          wolse: m.length,
          avgMonthly: m.length > 0 ? Math.round(m.reduce((s, i) => s + i._monthly, 0) / m.length) : 0,
        };
      });

      // 최근 정렬 (일자 내림차순)
      allItems.sort((a, b) => (b._ym + b._day).localeCompare(a._ym + a._day));

      setData({
        items: allItems,
        monthly: monthlyItems,
        jeonse: jeonseItems,
        avgMonthly,
        avgMonthlyDeposit,
        avgJeonseDeposit,
        avgArea,
        jeonseRatio,
        byMonth,
        total: allItems.length,
      });
    } catch (e) {
      setError("분석 중 오류: " + (e.message || ""));
    } finally {
      setLoading(false);
    }
  }, [region, type, months]);

  // 내 물건과 비교 (월세 기준)
  const comparison = useMemo(() => {
    if (!selectedTenant || !data || !selectedTenant.rent) return null;
    const my = Number(selectedTenant.rent);
    const avg = data.avgMonthly;
    if (!avg) return null;
    const diff = my - avg;
    const pct = Math.round((diff / avg) * 100);
    return { my, avg, diff, pct };
  }, [selectedTenant, data]);

  return (
    <div className="page-in page-padding" style={{ maxWidth: 1000 }}>
      <button onClick={() => router.back()}
        style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>← 뒤로가기</button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${C.navy},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🗺️</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.4px" }}>주변 매물 조회</h1>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#c9920a", background: "rgba(201,146,10,0.12)", padding: "3px 8px", borderRadius: 6 }}>PRO</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>국토부 실거래 최근 3개월 · 내 물건 주변 시세 비교</p>
        </div>
      </div>

      {/* 내 물건 선택 */}
      {tenants.length > 0 && (
        <div style={{ background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>🔗 내 물건에서 자동 세팅</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tenants.slice(0, 8).map(t => (
              <button key={t.id} onClick={() => pickTenant(t)}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${selectedTenantId === t.id ? C.indigo : "var(--border)"}`, background: selectedTenantId === t.id ? C.indigo + "15" : "transparent", color: selectedTenantId === t.id ? C.indigo : "var(--text-muted)" }}>
                {t.pType === "상가" ? "🏪" : "🏠"} {(t.addr || "").slice(0, 14)}{t.status === "공실" ? " · 공실" : ` · ${t.name}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 지역/유형 선택 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <select value={region} onChange={e => { setRegion(e.target.value); setData(null); }}
          style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 600, minWidth: 160 }}>
          {Object.keys(LAWD_MAP).map(k => <option key={k}>{k}</option>)}
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setData(null); }}
          style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 600 }}>
          {TYPE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <button onClick={search} disabled={loading}
          style={{ padding: "9px 22px", borderRadius: 10, background: loading ? "#94a3b8" : C.navy, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "조회 중..." : "🔍 실거래 조회"}
        </button>
        <span style={{ fontSize: 11, color: C.muted }}>최근 3개월 · 국토부 실거래</span>
      </div>

      {error && (
        <div style={{ background: "rgba(232,68,90,0.06)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: C.rose }}>{error}</div>
      )}

      {data && (
        <>
          {/* 비교 카드 */}
          {comparison && (
            <div style={{ marginBottom: 16, padding: "16px 20px", borderRadius: 14, background: comparison.diff > 0 ? "rgba(15,165,115,0.08)" : comparison.diff < 0 ? "rgba(232,68,90,0.08)" : "rgba(138,138,154,0.08)", border: `1.5px solid ${comparison.diff > 0 ? C.emerald : comparison.diff < 0 ? C.rose : "#8a8a9a"}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>내 물건 월세 vs 지역 평균</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>
                    <span style={{ color: C.navy }}>{formatMan(comparison.my)}원</span>
                    <span style={{ fontSize: 14, color: C.muted, marginLeft: 8 }}>vs 평균 {formatMan(comparison.avg)}원</span>
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color: comparison.diff > 0 ? C.emerald : comparison.diff < 0 ? C.rose : C.muted }}>
                    {comparison.diff > 0 ? "+" : ""}{comparison.diff.toLocaleString()}만 ({comparison.pct > 0 ? "+" : ""}{comparison.pct}%)
                  </p>
                  <p style={{ fontSize: 11, color: C.muted }}>
                    {comparison.diff > 5 ? "평균보다 높음 — 공실 시 조정 고려" : comparison.diff < -5 ? "평균보다 낮음 — 인상 여력 있음" : "평균 수준"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KPI 그리드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { l: "실거래 총 건수", v: data.total.toLocaleString() + "건", c: C.navy, sub: "최근 3개월" },
              { l: "평균 월세", v: formatMan(data.avgMonthly) + "원", c: C.emerald, sub: `${data.monthly.length}건 기준` },
              { l: "평균 월세 보증금", v: formatMan(data.avgMonthlyDeposit) + "원", c: C.indigo, sub: "월세 평균" },
              { l: "평균 전세 보증금", v: formatMan(data.avgJeonseDeposit) + "원", c: C.purple, sub: `${data.jeonse.length}건` },
              { l: "평균 전용면적", v: data.avgArea ? data.avgArea + "㎡" : "-", c: C.navy, sub: "㎡ 기준" },
              { l: "전세 비중", v: data.jeonseRatio + "%", c: data.jeonseRatio > 50 ? C.purple : C.emerald, sub: "전세/월세 중" },
            ].map(k => (
              <div key={k.l} style={{ background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>{k.l}</p>
                <p style={{ fontSize: 17, fontWeight: 800, color: k.c }}>{k.v}</p>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* 월별 거래량 차트 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: 14, padding: "16px 16px 10px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>월별 거래량</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="jeonse" stackId="a" fill={C.purple} name="전세" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="wolse" stackId="a" fill={C.emerald} name="월세" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: 14, padding: "16px 16px 10px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>월별 평균 월세 (만원)</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.byMonth}>
                  <defs>
                    <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.emerald} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} unit="만" />
                  <Tooltip formatter={v => [v + "만원", "평균 월세"]} />
                  <Area type="monotone" dataKey="avgMonthly" stroke={C.emerald} strokeWidth={2} fill="url(#rentGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 실거래 리스트 */}
          <div style={{ background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>최근 실거래 내역 ({data.total}건)</p>
            </div>
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--surface2)" }}>
                  <tr>
                    {["거래일", "건물명", "동", "전용면적", "층", "보증금", "월세", "유형"].map(h => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.slice(0, 200).map((it, i) => {
                    const jeonse = isJeonse(it);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border-faint, #f0efe9)" }}>
                        <td style={{ padding: "8px 12px", color: C.muted, fontSize: 11 }}>{it._ym.slice(4, 6)}/{it._day}</td>
                        <td style={{ padding: "8px 12px", color: "var(--text)", fontWeight: 600 }}>{it._name}</td>
                        <td style={{ padding: "8px 12px", color: C.muted, fontSize: 11 }}>{it._dong}</td>
                        <td style={{ padding: "8px 12px", color: C.muted }}>{it._area ? it._area + "㎡" : "-"}</td>
                        <td style={{ padding: "8px 12px", color: C.muted }}>{it._floor || "-"}</td>
                        <td style={{ padding: "8px 12px", color: "var(--text)", fontWeight: 600 }}>{formatMan(it._deposit)}</td>
                        <td style={{ padding: "8px 12px", color: it._monthly > 0 ? C.emerald : C.muted, fontWeight: 600 }}>{it._monthly > 0 ? formatMan(it._monthly) : "—"}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: jeonse ? C.purple : C.emerald, background: (jeonse ? C.purple : C.emerald) + "15", padding: "2px 8px", borderRadius: 10 }}>{jeonse ? "전세" : "월세"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.items.length > 200 && (
              <div style={{ padding: "10px 16px", fontSize: 11, color: C.muted, textAlign: "center", borderTop: "1px solid var(--border)" }}>
                상위 200건만 표시됩니다. 자세한 분석은 <a href="/dashboard/market/vacancy-risk" style={{ color: C.indigo, fontWeight: 600 }}>공실 위험 지수</a>를 이용하세요.
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 12 }}>
            출처: 국토교통부 실거래가 공개시스템 · 지역: {region} · 최근 3개월
          </p>
        </>
      )}

      {!data && !loading && (
        <div style={{ background: "var(--surface)", border: `1px dashed var(--border)`, borderRadius: 14, padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>🗺️</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>지역과 유형을 선택하고 실거래를 조회하세요</p>
          <p style={{ fontSize: 12, color: C.muted }}>내 물건을 선택하면 지역·유형이 자동 세팅됩니다</p>
        </div>
      )}
    </div>
  );
}
