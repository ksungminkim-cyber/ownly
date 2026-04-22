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
  // 임대 (전월세) — 거래 빈도 높음, 3개월 기본
  { key: "apt_rent",    label: "🏢 아파트 · 전월세",      mode: "rent",  defaultMonths: 3,  group: "임대" },
  { key: "villa_rent",  label: "🏠 연립·다세대 · 전월세",  mode: "rent",  defaultMonths: 3,  group: "임대" },
  { key: "offi_rent",   label: "🏬 오피스텔 · 전월세",    mode: "rent",  defaultMonths: 3,  group: "임대" },
  { key: "house_rent",  label: "🏡 단독·다가구 · 전월세",  mode: "rent",  defaultMonths: 6,  group: "임대" },
  // 매매 — 거래 빈도 유형별로 다름
  { key: "apt_trade",   label: "🏢 아파트 · 매매",         mode: "trade", defaultMonths: 3,  group: "매매" },
  { key: "villa_trade", label: "🏠 연립·다세대 · 매매",    mode: "trade", defaultMonths: 6,  group: "매매" },
  { key: "offi_trade",  label: "🏬 오피스텔 · 매매",       mode: "trade", defaultMonths: 6,  group: "매매" },
  { key: "house_trade", label: "🏡 단독·다가구 · 매매",    mode: "trade", defaultMonths: 6,  group: "매매" },
  { key: "nrg_trade",   label: "🏪 상업·업무용 · 매매",    mode: "trade", defaultMonths: 12, group: "매매" },
  { key: "land_trade",  label: "🌳 토지 · 매매",           mode: "trade", defaultMonths: 12, group: "매매" },
];

const TYPE_BY_KEY = Object.fromEntries(TYPE_OPTIONS.map(o => [o.key, o]));

// 인접 구 매핑 — 0건일 때 대체 제안용
const ADJACENT_REGIONS = {
  "서울 강남구": ["서울 서초구", "서울 송파구", "서울 강동구"],
  "서울 서초구": ["서울 강남구", "서울 동작구", "서울 관악구"],
  "서울 송파구": ["서울 강남구", "서울 강동구", "서울 광진구"],
  "서울 강동구": ["서울 송파구", "서울 광진구"],
  "서울 마포구": ["서울 서대문구", "서울 용산구", "서울 영등포구"],
  "서울 용산구": ["서울 마포구", "서울 성동구", "서울 중구"],
  "서울 성동구": ["서울 용산구", "서울 광진구", "서울 동대문구"],
  "서울 광진구": ["서울 성동구", "서울 동대문구", "서울 송파구"],
  "서울 동작구": ["서울 서초구", "서울 관악구", "서울 영등포구"],
  "서울 영등포구": ["서울 마포구", "서울 동작구", "서울 구로구"],
  "서울 양천구": ["서울 강서구", "서울 영등포구"],
  "서울 강서구": ["서울 양천구", "서울 영등포구"],
  "서울 구로구": ["서울 영등포구", "서울 금천구", "서울 관악구"],
  "서울 금천구": ["서울 구로구", "서울 관악구"],
  "서울 관악구": ["서울 동작구", "서울 금천구", "서울 서초구"],
  "서울 서대문구": ["서울 마포구", "서울 은평구", "서울 종로구"],
  "서울 은평구": ["서울 서대문구", "서울 종로구"],
  "서울 종로구": ["서울 중구", "서울 서대문구", "서울 성북구"],
  "서울 중구": ["서울 종로구", "서울 용산구", "서울 동대문구"],
  "서울 노원구": ["서울 도봉구", "서울 강북구", "서울 중랑구"],
  "서울 도봉구": ["서울 노원구", "서울 강북구"],
  "서울 강북구": ["서울 성북구", "서울 도봉구", "서울 노원구"],
  "서울 성북구": ["서울 종로구", "서울 강북구", "서울 동대문구"],
  "서울 동대문구": ["서울 성북구", "서울 중랑구", "서울 성동구"],
  "서울 중랑구": ["서울 동대문구", "서울 광진구", "서울 노원구"],
  "경기 성남시": ["서울 강남구", "경기 용인시"],
  "경기 수원시": ["경기 용인시", "경기 화성시"],
  "경기 용인시": ["경기 성남시", "경기 수원시"],
  "경기 고양시": ["서울 은평구", "서울 강서구"],
  "경기 화성시": ["경기 수원시"],
  "경기 안양시": ["서울 관악구", "서울 금천구"],
  "경기 부천시": ["서울 강서구", "서울 구로구"],
  "부산 해운대구": ["부산 수영구"],
  "부산 수영구": ["부산 해운대구"],
  "인천 연수구": ["인천 송도"],
  "인천 송도": ["인천 연수구"],
};

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
  if (t.pType === "토지") return "land_trade";
  if (t.pType === "상가") return "nrg_trade"; // 상업용 매매 기본 (임대 데이터 미지원)
  if (t.sub === "오피스텔") return "offi_rent";
  if (t.sub === "빌라" || t.sub === "다세대") return "villa_rent";
  if (t.sub === "단독주택" || (t.pType === "주거" && t.sub?.includes("단독"))) return "house_rent";
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

  // 최근 N개월 YYYYMM 배열 생성 (현재 달 포함 시 신고 지연 경고)
  const makeMonths = (n) => {
    const now = new Date();
    const arr = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return arr;
  };

  // 주어진 기간(months)으로 실거래 조회 (에러 전파)
  const fetchItemsForMonths = async (typeKey, lawdCd, monthArr) => {
    const results = await Promise.all(
      monthArr.map(ym =>
        fetch(`/api/market/molit?type=${typeKey}&lawdCd=${lawdCd}&dealYm=${ym}&numOfRows=200`)
          .then(r => r.json())
          .catch(e => ({ error: e.message || "network error" }))
      )
    );
    const err = results.find(r => r.error);
    if (err) throw new Error(err.error);
    return { results, monthArr };
  };

  const search = useCallback(async () => {
    setLoading(true);
    setError("");
    setData(null);
    const lawdCd = LAWD_MAP[region];
    const typeInfo = TYPE_BY_KEY[type] || { mode: "rent", defaultMonths: 3 };
    const mode = typeInfo.mode;
    const baseMonths = typeInfo.defaultMonths || 3;

    try {
      // 1차: 기본 기간으로 조회
      let { results, monthArr } = await fetchItemsForMonths(type, lawdCd, makeMonths(baseMonths));
      let totalItems = results.reduce((s, r) => s + (r.items || []).length, 0);
      let expanded = false;

      // 2차 자동 확장: 0건이면 더 넓은 기간
      if (totalItems === 0) {
        const wider = Math.min(Math.max(baseMonths * 2, 6), 12);
        if (wider > baseMonths) {
          const retry = await fetchItemsForMonths(type, lawdCd, makeMonths(wider));
          if (retry.results.reduce((s, r) => s + (r.items || []).length, 0) > 0) {
            results = retry.results;
            monthArr = retry.monthArr;
            expanded = wider;
            totalItems = results.reduce((s, r) => s + (r.items || []).length, 0);
          }
        }
      }

      if (totalItems === 0) {
        // 정말 0건 — 추천 조합 생성
        const suggestions = [];
        // 1) 인접 구 (같은 유형)
        (ADJACENT_REGIONS[region] || []).slice(0, 3).forEach(r => {
          if (LAWD_MAP[r]) suggestions.push({ kind: "region", region: r, type, label: `${r} 같은 유형` });
        });
        // 2) 같은 지역의 다른 유형 추천 (활성 유형 우선)
        const activeTypes = ["apt_trade", "apt_rent", "offi_rent", "offi_trade"].filter(t => t !== type);
        activeTypes.slice(0, 2).forEach(t => {
          const info = TYPE_BY_KEY[t];
          suggestions.push({ kind: "type", region, type: t, label: `${region} · ${info.label}` });
        });
        setData({ mode, items: [], total: 0, suggestions, triedMonths: baseMonths });
        setLoading(false);
        return;
      }

      const allItems = [];
      results.forEach((res, idx) => {
        const ym = monthArr[idx];
        (res.items || []).forEach(it => {
          const common = {
            ...it,
            _ym: ym,
            _day: it.dealDay ? String(it.dealDay).padStart(2, "0") : "",
            _dong: it.umdNm || "",
            _floor: parseInt(it.floor || "0", 10) || null,
            _buildYear: parseInt(it.buildYear || "0", 10) || null,
            _name: it.aptNm || it.offiNm || it.mhouseNm || it.houseType || it.buildingNm || it.bldgNm || "—",
          };
          if (mode === "rent") {
            common._deposit = parseInt(String(it.deposit || "0").replace(/,/g, ""), 10) || 0;
            common._monthly = parseInt(String(it.monthlyRent || "0").replace(/,/g, ""), 10) || 0;
            common._area = parseFloat(it.excluUseAr || it.exclusiveUseArea || "0") || 0;
          } else {
            // 매매
            common._dealAmount = parseInt(String(it.dealAmount || "0").replace(/,/g, "").replace(/\s/g, ""), 10) || 0;
            // 토지는 landAr, 상업용은 bldgArea / plottageAr, 그 외 excluUseAr
            if (type === "land_trade") {
              common._area = parseFloat(it.landAr || "0") || 0;
              common._jimok = it.jimok || "";
              common._name = it.jimok || "토지";
            } else if (type === "nrg_trade") {
              common._area = parseFloat(it.bldgArea || it.buildingAr || it.plottageAr || "0") || 0;
              common._name = it.bldgNm || it.buildingNm || (it.buildingType ? `${it.buildingType}` : "상업·업무용");
            } else {
              common._area = parseFloat(it.excluUseAr || "0") || 0;
            }
          }
          allItems.push(common);
        });
      });

      allItems.sort((a, b) => (b._ym + b._day).localeCompare(a._ym + a._day));

      // 최근 달이 월 거래량 대비 비정상적으로 적으면 "신고 지연" 경고 플래그
      const byMonthCount = {};
      allItems.forEach(i => { byMonthCount[i._ym] = (byMonthCount[i._ym] || 0) + 1; });
      const sortedYms = Object.keys(byMonthCount).sort();
      const lastYm = sortedYms[sortedYms.length - 1];
      const avgOthers = sortedYms.length > 1
        ? sortedYms.slice(0, -1).reduce((s, y) => s + byMonthCount[y], 0) / (sortedYms.length - 1)
        : 0;
      const lagWarning = avgOthers > 0 && byMonthCount[lastYm] < avgOthers * 0.3;

      if (mode === "rent") {
        const monthlyItems = allItems.filter(i => i._monthly > 0);
        const jeonseItems = allItems.filter(i => i._monthly === 0);
        const avgMonthly = monthlyItems.length > 0 ? Math.round(monthlyItems.reduce((s, i) => s + i._monthly, 0) / monthlyItems.length) : 0;
        const avgMonthlyDeposit = monthlyItems.length > 0 ? Math.round(monthlyItems.reduce((s, i) => s + i._deposit, 0) / monthlyItems.length) : 0;
        const avgJeonseDeposit = jeonseItems.length > 0 ? Math.round(jeonseItems.reduce((s, i) => s + i._deposit, 0) / jeonseItems.length) : 0;
        const avgArea = allItems.length > 0 ? Math.round(allItems.reduce((s, i) => s + i._area, 0) / allItems.length * 10) / 10 : 0;
        const jeonseRatio = Math.round((jeonseItems.length / allItems.length) * 100);
        const byMonth = monthArr.map(ym => {
          const items = allItems.filter(i => i._ym === ym);
          const m = items.filter(i => i._monthly > 0);
          const j = items.filter(i => i._monthly === 0);
          return { label: `${ym.slice(2, 4)}.${ym.slice(4, 6)}`, total: items.length, jeonse: j.length, wolse: m.length, avgMonthly: m.length > 0 ? Math.round(m.reduce((s, i) => s + i._monthly, 0) / m.length) : 0 };
        });
        setData({ mode, items: allItems, monthly: monthlyItems, jeonse: jeonseItems, avgMonthly, avgMonthlyDeposit, avgJeonseDeposit, avgArea, jeonseRatio, byMonth, total: allItems.length, expandedToMonths: expanded, lagWarning });
      } else {
        const amounts = allItems.map(i => i._dealAmount).filter(a => a > 0);
        const avgDeal = amounts.length > 0 ? Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length) : 0;
        const minDeal = amounts.length > 0 ? Math.min(...amounts) : 0;
        const maxDeal = amounts.length > 0 ? Math.max(...amounts) : 0;
        const medianDeal = (() => {
          if (amounts.length === 0) return 0;
          const sorted = [...amounts].sort((a, b) => a - b);
          return sorted[Math.floor(sorted.length / 2)];
        })();
        const avgArea = allItems.length > 0 ? Math.round(allItems.reduce((s, i) => s + i._area, 0) / allItems.length * 10) / 10 : 0;
        const withArea = allItems.filter(i => i._area > 0 && i._dealAmount > 0);
        const avgPerPyeong = withArea.length > 0
          ? Math.round(withArea.reduce((s, i) => s + (i._dealAmount / (i._area / 3.3058)), 0) / withArea.length)
          : 0;
        const byMonth = monthArr.map(ym => {
          const items = allItems.filter(i => i._ym === ym);
          const amts = items.map(i => i._dealAmount).filter(a => a > 0);
          return {
            label: `${ym.slice(2, 4)}.${ym.slice(4, 6)}`,
            total: items.length,
            avgDeal: amts.length > 0 ? Math.round(amts.reduce((s, a) => s + a, 0) / amts.length) : 0,
          };
        });
        setData({ mode, items: allItems, avgDeal, minDeal, maxDeal, medianDeal, avgArea, avgPerPyeong, byMonth, total: allItems.length, expandedToMonths: expanded, lagWarning });
      }
    } catch (e) {
      setError("분석 중 오류: " + (e.message || ""));
    } finally {
      setLoading(false);
    }
  }, [region, type]);

  // 내 물건과 비교 (임대 모드: 월세 기준)
  const comparison = useMemo(() => {
    if (!selectedTenant || !data || data.mode !== "rent" || !selectedTenant.rent) return null;
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
          <p style={{ fontSize: 13, color: C.muted }}>국토부 실거래 · 유형별 자동 조회 기간 · 내 물건 주변 시세 비교</p>
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
          style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 600, minWidth: 220 }}>
          <optgroup label="임대 (전월세)">
            {TYPE_OPTIONS.filter(o => o.mode === "rent").map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </optgroup>
          <optgroup label="매매">
            {TYPE_OPTIONS.filter(o => o.mode === "trade").map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </optgroup>
        </select>
        <button onClick={search} disabled={loading}
          style={{ padding: "9px 22px", borderRadius: 10, background: loading ? "#94a3b8" : C.navy, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "조회 중..." : "🔍 실거래 조회"}
        </button>
        <span style={{ fontSize: 11, color: C.muted }}>
          최근 {TYPE_BY_KEY[type]?.defaultMonths || 3}개월 · 국토부 실거래 · 데이터 없으면 자동 확장
        </span>
      </div>

      {error && (
        <div style={{ background: "rgba(232,68,90,0.06)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: C.rose }}>{error}</div>
      )}

      {data && data.total === 0 && (
        <div style={{ background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: 14, padding: "28px 24px", marginBottom: 16 }}>
          <p style={{ fontSize: 32, marginBottom: 8, textAlign:"center" }}>🔍</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "center", marginBottom: 6 }}>
            {region} · {TYPE_BY_KEY[type]?.label} 최근 실거래 0건
          </p>
          <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 20, lineHeight:1.6 }}>
            최근 {data.triedMonths}개월간 신고된 거래가 없거나, 국토부 신고 지연(계약 후 30일)으로 아직 반영 안 됐을 수 있습니다.<br/>
            아래 추천 조합을 눌러 다시 조회해보세요.
          </p>
          {data.suggestions && data.suggestions.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
              {data.suggestions.map((s, i) => (
                <button key={i}
                  onClick={() => { setRegion(s.region); setType(s.type); setData(null); setTimeout(() => search(), 10); }}
                  style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${C.indigo}30`, background: C.indigo + "08", textAlign: "left", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.indigo + "12"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.indigo + "08"; }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.indigo, textTransform: "uppercase", letterSpacing:".5px", marginBottom: 4 }}>
                    {s.kind === "region" ? "🗺️ 인접 지역" : "🔄 다른 유형"}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{s.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {data && data.total > 0 && (
        <>
          {/* 자동 확장 알림 */}
          {data.expandedToMonths && (
            <div style={{ background: "rgba(232,150,10,0.07)", border: "1px solid rgba(232,150,10,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#b87708" }}>
              ℹ️ 기본 {TYPE_BY_KEY[type]?.defaultMonths}개월 조회 시 데이터가 부족해 <b>최근 {data.expandedToMonths}개월로 확장</b>해 표시합니다.
            </div>
          )}
          {data.lagWarning && (
            <div style={{ background: "rgba(59,91,219,0.05)", border: "1px solid rgba(59,91,219,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: C.indigo }}>
              📌 최근 달 거래량이 이례적으로 적습니다. 국토부 신고 지연(계약 후 30일 내)으로 아직 반영 안 된 거래가 많을 수 있어요.
            </div>
          )}

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
            {(data.mode === "rent" ? [
              { l: "실거래 총 건수", v: data.total.toLocaleString() + "건", c: C.navy, sub: "최근 3개월" },
              { l: "평균 월세", v: formatMan(data.avgMonthly) + "원", c: C.emerald, sub: `${data.monthly.length}건 기준` },
              { l: "평균 월세 보증금", v: formatMan(data.avgMonthlyDeposit) + "원", c: C.indigo, sub: "월세 평균" },
              { l: "평균 전세 보증금", v: formatMan(data.avgJeonseDeposit) + "원", c: C.purple, sub: `${data.jeonse.length}건` },
              { l: "평균 전용면적", v: data.avgArea ? data.avgArea + "㎡" : "-", c: C.navy, sub: "㎡ 기준" },
              { l: "전세 비중", v: data.jeonseRatio + "%", c: data.jeonseRatio > 50 ? C.purple : C.emerald, sub: "전세/월세 중" },
            ] : [
              { l: "실거래 총 건수", v: data.total.toLocaleString() + "건", c: C.navy, sub: "최근 3개월" },
              { l: "평균 거래가", v: formatMan(data.avgDeal) + "원", c: C.emerald, sub: "산술 평균" },
              { l: "중앙값 거래가", v: formatMan(data.medianDeal) + "원", c: C.indigo, sub: "극단값 배제" },
              { l: "최저 거래가", v: formatMan(data.minDeal) + "원", c: C.navy, sub: "3개월 최저" },
              { l: "최고 거래가", v: formatMan(data.maxDeal) + "원", c: C.rose, sub: "3개월 최고" },
              { l: type === "land_trade" ? "평균 토지면적" : "평균 전용면적", v: data.avgArea ? data.avgArea + "㎡" : "-", c: C.navy, sub: "㎡ 기준" },
              ...(data.avgPerPyeong > 0 ? [{ l: "평당 평균 거래가", v: formatMan(data.avgPerPyeong) + "원", c: C.purple, sub: "3.3058㎡ 기준" }] : []),
            ]).map(k => (
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
                  {data.mode === "rent" ? (
                    <>
                      <Bar dataKey="jeonse" stackId="a" fill={C.purple} name="전세" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="wolse" stackId="a" fill={C.emerald} name="월세" radius={[4, 4, 0, 0]} />
                    </>
                  ) : (
                    <Bar dataKey="total" fill={C.navy} name="매매" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: 14, padding: "16px 16px 10px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>{data.mode === "rent" ? "월별 평균 월세 (만원)" : "월별 평균 거래가 (만원)"}</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.byMonth}>
                  <defs>
                    <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={data.mode === "rent" ? C.emerald : C.indigo} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={data.mode === "rent" ? C.emerald : C.indigo} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} unit="만" />
                  <Tooltip formatter={v => [v.toLocaleString() + "만원", data.mode === "rent" ? "평균 월세" : "평균 거래가"]} />
                  <Area type="monotone" dataKey={data.mode === "rent" ? "avgMonthly" : "avgDeal"} stroke={data.mode === "rent" ? C.emerald : C.indigo} strokeWidth={2} fill="url(#rentGrad)" />
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
                    {(data.mode === "rent"
                      ? ["거래일", "건물명", "동", "전용면적", "층", "보증금", "월세", "유형"]
                      : type === "land_trade"
                        ? ["거래일", "지목", "동", "토지면적", "거래금액", "평당"]
                        : ["거래일", "건물명", "동", "면적", "층", "거래금액", "평당", "건축년도"]
                    ).map(h => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.slice(0, 200).map((it, i) => {
                    if (data.mode === "rent") {
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
                    }
                    const perPyeong = it._area > 0 && it._dealAmount > 0 ? Math.round(it._dealAmount / (it._area / 3.3058)) : 0;
                    if (type === "land_trade") {
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border-faint, #f0efe9)" }}>
                          <td style={{ padding: "8px 12px", color: C.muted, fontSize: 11 }}>{it._ym.slice(4, 6)}/{it._day}</td>
                          <td style={{ padding: "8px 12px", color: "var(--text)", fontWeight: 600 }}>{it._jimok || "—"}</td>
                          <td style={{ padding: "8px 12px", color: C.muted, fontSize: 11 }}>{it._dong}</td>
                          <td style={{ padding: "8px 12px", color: C.muted }}>{it._area ? it._area + "㎡" : "-"}</td>
                          <td style={{ padding: "8px 12px", color: C.indigo, fontWeight: 700 }}>{formatMan(it._dealAmount)}</td>
                          <td style={{ padding: "8px 12px", color: C.purple, fontSize: 11 }}>{perPyeong ? formatMan(perPyeong) : "—"}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border-faint, #f0efe9)" }}>
                        <td style={{ padding: "8px 12px", color: C.muted, fontSize: 11 }}>{it._ym.slice(4, 6)}/{it._day}</td>
                        <td style={{ padding: "8px 12px", color: "var(--text)", fontWeight: 600 }}>{it._name}</td>
                        <td style={{ padding: "8px 12px", color: C.muted, fontSize: 11 }}>{it._dong}</td>
                        <td style={{ padding: "8px 12px", color: C.muted }}>{it._area ? it._area + "㎡" : "-"}</td>
                        <td style={{ padding: "8px 12px", color: C.muted }}>{it._floor || "-"}</td>
                        <td style={{ padding: "8px 12px", color: C.indigo, fontWeight: 700 }}>{formatMan(it._dealAmount)}</td>
                        <td style={{ padding: "8px 12px", color: C.purple, fontSize: 11 }}>{perPyeong ? formatMan(perPyeong) : "—"}</td>
                        <td style={{ padding: "8px 12px", color: C.muted, fontSize: 11 }}>{it._buildYear || "—"}</td>
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
            출처: 국토교통부 실거래가 공개시스템 · 지역: {region} · 최근 {data.expandedToMonths || TYPE_BY_KEY[type]?.defaultMonths || 3}개월
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
