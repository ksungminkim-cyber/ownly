// 최근 부동산 대책 큐레이션 데이터 + 내 매물 매칭 로직
//
// ⚠️ 정부 "정책 API"는 존재하지 않으므로 보도자료·언론 보도를 수동 구조화한 데이터입니다.
//    새 대책 발표 시 이 파일을 갱신하고 POLICY_REVIEW_DATE 를 반드시 올려주세요.
// ⚠️ 세대 전체 주택 수·실거주 이력·임대사업자 등록 여부 등 온리가 알 수 없는 조건은
//    단정하지 않고 certainty: "check"(확인 필요)로 표시합니다. — 진실성 원칙(CLAUDE.md 7절)

export const POLICY_REVIEW_DATE = "2026-08-25"; // 최종 검토일 (표시용)

// ── 규제지역 (조정대상지역·투기과열지구·토지거래허가구역 동일 범위) ──
// 10·15 대책(2025-10-15): 서울 25개 자치구 전역 + 경기 12곳
// 6·30 추가 지정(2026-06-30): 화성 동탄, 용인 기흥, 구리 → 경기 15곳
const REGULATED_GYEONGGI = [
  "과천", "광명", "분당구", "수정구", "중원구", "영통구", "장안구", "팔달구",
  "동안구", "수지구", "기흥구", "의왕", "하남", "동탄", "구리",
];

export function isRegulatedAddr(addr = "") {
  if (!addr) return false;
  if (addr.includes("서울")) return true;
  return REGULATED_GYEONGGI.some(k => addr.includes(k));
}

// 수도권(서울·경기·인천) 추정 — 주소 표기가 다양해 보수적으로 판정
export function isMetroAddr(addr = "") {
  if (!addr) return false;
  if (/서울|경기|인천/.test(addr)) return true;
  return isRegulatedAddr(addr);
}

const isApt = (t) => (t.sub || "").includes("아파트") || (t.addr || "").includes("아파트");
const isHousing = (t) => t.pType === "주거" || !t.pType;
const isJeonse = (t) => (t.rent || 0) === 0 && (t.dep || 0) > 0;

// ── 정책 데이터 ──────────────────────────────────────────────────
// certainty: "possible" = 지역·유형만으로 해당 가능성 높음 / "check" = 본인 조건 확인 필요
export const POLICIES = [
  {
    id: "p1015-regulation",
    title: "10·15 규제지역 지정 (+6·30 확대)",
    announcedAt: "2025-10-15",
    tag: "규제지역",
    source: { name: "규제지역 지정 현황 보도", url: "https://www.taxtimes.co.kr/news/article.html?no=271870" },
    summary: "서울 25개 자치구 전역과 경기 15곳(과천·광명·성남 분당/수정/중원·수원 영통/장안/팔달·안양 동안·용인 수지/기흥·의왕·하남·화성 동탄·구리)이 조정대상지역·투기과열지구·토지거래허가구역으로 함께 지정되어 있습니다.",
    items: [
      {
        id: "tohuh",
        headline: "토지거래허가구역 — 전세 낀 매매(갭투자) 제한",
        plain: "규제지역 내 아파트(및 같은 단지에 아파트 1개동 이상이 포함된 연립·다세대)는 매매 시 구청 허가와 실거주가 원칙이라, 세입자를 승계하는 매각이 어려워질 수 있습니다.",
        impact: "해당 지역 매물을 파실 계획이라면 매수자 실거주 요건 때문에 임차인 퇴거 시점과 매각 시점을 함께 설계해야 합니다.",
        effectiveFrom: "시행 중",
        certainty: "possible",
        match: (ts) => ts.filter(t => isHousing(t) && isRegulatedAddr(t.addr)),
      },
      {
        id: "adjusted-area",
        headline: "조정대상지역 편입 — 세금·대출 전반에 연쇄 적용",
        plain: "조정대상지역 여부는 종부세 공정시장가액비율, 다주택 양도세 중과, 대출 한도 등 다른 규제의 기준점이 됩니다. 내 매물이 여기 속하는지가 아래 세제 항목들의 출발점입니다.",
        impact: "이 지역 매물은 8·3 세제개편의 중과·공제 축소 항목 대부분의 적용 대상이 될 수 있습니다.",
        effectiveFrom: "시행 중",
        certainty: "possible",
        match: (ts) => ts.filter(t => isHousing(t) && isRegulatedAddr(t.addr)),
      },
    ],
  },
  {
    id: "p0803-tax",
    title: "8·3 부동산 세제개편안",
    announcedAt: "2026-08-03",
    tag: "세제",
    source: { name: "세제개편안 총괄표 (조세일보)", url: "https://www.taxtimes.co.kr/news/article.html?no=276444" },
    summary: "종부세 공제를 '거주 중심'으로 재편(거주 1주택 14억↑, 비거주 1주택 9억↓, 다주택은 거주 비율 연동)하고, 양도세 장기보유특별공제도 거주 기준으로 바꾸는 개편입니다. 임대 목적 보유 주택의 세 부담이 단계적으로 늘어나는 방향입니다. 2026-08-03 이전 계약·계약금 지급분은 종전 규정이 적용되는 경과조치가 있습니다.",
    items: [
      {
        id: "jongbuse",
        headline: "종부세 기본공제 개편 — 비거주·다주택 공제 축소",
        plain: "2027년부터 거주 1주택 공제는 12억→14억으로 늘지만, 비거주 1주택은 12억→9억으로 줄고, 그 외(다주택 등)는 '4억 + 5억×거주주택 가액비율'로 바뀝니다. 임대 목적 보유분의 공제가 줄어드는 구조입니다.",
        impact: "등록하신 주거 매물이 2건 이상이거나, 1건이라도 본인이 거주하지 않는 주택이라면 2027년 종부세가 늘어날 수 있습니다.",
        effectiveFrom: "2027년",
        certainty: "check",
        checkNote: "세대 전체 주택 수·거주 여부 기준 — 온리에 등록된 매물 수만으로는 단정할 수 없습니다.",
        match: (ts) => ts.filter(isHousing),
      },
      {
        id: "fair-value",
        headline: "공정시장가액비율 인상 — 3주택 이상·조정대상지역 80%",
        plain: "종부세 과세표준에 곱하는 비율이 2027년 70%, 2028년부터는 3주택 이상·조정대상지역 보유자에게 80%로 올라갑니다.",
        impact: "규제지역 매물 보유자와 다주택자의 종부세 실효 부담이 추가로 늘어납니다.",
        effectiveFrom: "2027~2028년",
        certainty: "check",
        checkNote: "세대 기준 주택 수 확인 필요",
        match: (ts) => {
          const housing = ts.filter(isHousing);
          const inReg = housing.filter(t => isRegulatedAddr(t.addr));
          return housing.length >= 3 ? housing : inReg;
        },
      },
      {
        id: "capital-gains",
        headline: "다주택 양도세 — 장특공제 축소 + 조정대상지역 중과 인상",
        plain: "다주택자의 장기보유특별공제가 2028년부터 축소되고(최대 30%, 거주 중심), 조정대상지역 2주택·3주택 이상 양도세 중과는 2027~2029년에 걸쳐 단계적으로 오릅니다.",
        impact: "규제지역 매물을 여러 건 보유 중이라면 매각 시점에 따라 세 부담 차이가 커집니다. 매각 계획이 있다면 연도별 시뮬레이션이 필요합니다.",
        effectiveFrom: "2027~2029년 단계 적용",
        certainty: "check",
        checkNote: "세대 기준 주택 수·취득 시점 확인 필요",
        match: (ts) => {
          const housing = ts.filter(isHousing);
          return housing.length >= 2 ? housing.filter(t => isRegulatedAddr(t.addr)) : [];
        },
      },
      {
        id: "rental-biz",
        headline: "등록임대사업자 — 혜택 종료 시한·처분기한 신설",
        plain: "조정대상지역 매입임대 아파트의 종전 세제 혜택은 2027-12-31까지 양도하는 경우에만 인정됩니다. 처분기한도 신설되어 수도권 아파트는 2029-12-31, 수도권 비아파트·비수도권은 2031-12-31까지입니다.",
        impact: "등록임대사업자라면 혜택을 유지한 채 매각할 수 있는 기한이 사실상 정해졌습니다. 의무임대 종료 후 1년 이내 양도 시 중과배제 등 경과 혜택도 기간별로 다릅니다.",
        effectiveFrom: "양도 기한 2027-12-31 (종전 혜택 기준)",
        certainty: "check",
        checkNote: "임대사업자 등록 여부는 온리가 알 수 없습니다 — 등록하셨다면 반드시 확인하세요.",
        match: (ts) => ts.filter(t => isHousing(t) && isRegulatedAddr(t.addr) && isApt(t)),
      },
      {
        id: "sangsaeng",
        headline: "상생임대주택 특례 — 2029년 말 종료 예정",
        plain: "임대료를 5% 이내로 올린 상생임대차계약의 양도세 특례는 계약 종료 후 1년 이내 양도분만 적용되며, 제도 자체가 2029-12-31로 적용기한이 정해졌습니다.",
        impact: "상생임대 특례를 계획에 넣고 계셨다면 계약·양도 시점을 기한 안에 맞춰야 합니다.",
        effectiveFrom: "적용기한 2029-12-31",
        certainty: "check",
        checkNote: "상생임대차계약 체결 여부 확인 필요",
        match: (ts) => ts.filter(isHousing),
      },
      {
        id: "land",
        headline: "비사업용토지 — 장특공제 배제 + 중과 20%p",
        plain: "2028-01-01 이후 양도하는 개인 비사업용토지는 장기보유특별공제가 배제되고 기본세율에 20%p가 중과됩니다. 법인 추가과세도 10%→20%로 오릅니다.",
        impact: "토지 매물을 매각할 계획이라면 2027년 말 이전 양도와 이후 양도의 세 부담 차이가 큽니다.",
        effectiveFrom: "2028-01-01 이후 양도분",
        certainty: "possible",
        match: (ts) => ts.filter(t => t.pType === "토지"),
      },
    ],
  },
  {
    id: "p0813-finance",
    title: "8·13 부동산 금융 종합대책",
    announcedAt: "2026-08-13",
    tag: "대출·금융",
    source: { name: "금융 종합대책 보도 (뉴시스)", url: "https://www.newsis.com/view/NISX20260813_0003747878" },
    summary: "전세대출 보증 제한을 '비거주 1주택자'까지 확대하고 보증비율을 축소하는 한편, 청년·신혼 실수요와 비아파트 공급에는 금융 지원을 늘리는 투트랙 대책입니다.",
    items: [
      {
        id: "jeonse-guarantee",
        headline: "비거주 1주택자 전세대출 보증 제한 (2027년 1월~)",
        plain: "부부합산 기준으로 수도권·규제지역 아파트를 보유하면서 그 집을 임대 중이고 부부 모두 실거주 이력이 없는 경우, 2027-01-01부터 본인의 전세대출 보증 신규·만기연장이 원칙적으로 제한됩니다.",
        impact: "보유 아파트를 세 주고 본인은 전세로 거주 중이라면 직접 영향이 있을 수 있습니다. 실거주 이력이 있으면 제외되고 예외 범위도 넓게 설계될 예정이니 본인 이력을 확인하세요.",
        effectiveFrom: "2027-01-01",
        certainty: "check",
        checkNote: "본인·배우자의 거주 형태와 실거주 이력 기준 — 온리가 알 수 없는 조건입니다.",
        match: (ts) => ts.filter(t => isHousing(t) && isApt(t) && isMetroAddr(t.addr)),
      },
      {
        id: "guarantee-ratio",
        headline: "전세대출 보증비율 축소 — 세입자 자금 조달 위축",
        plain: "전세대출 보증비율이 수도권·규제지역 70%, 그 외 80%로 줄어 세입자의 전세자금 마련이 어려워집니다.",
        impact: "전세로 놓은 매물은 다음 세입자를 구할 때 전세금 조달이 빡빡해질 수 있습니다. 보증부 월세 전환이나 보증금 조정 요구가 늘어날 수 있는 환경입니다.",
        effectiveFrom: "2027-01-01",
        certainty: "possible",
        match: (ts) => ts.filter(t => isHousing(t) && isJeonse(t)),
      },
      {
        id: "non-apt",
        headline: "비아파트 금융 지원 확대 — 비아파트 임대인에게 우호적",
        plain: "만 39세 이하 생애최초 대상 '청년미래보금자리론'(4억 이하·85㎡ 이하 비아파트, LTV 최대 80%, 연 3조 규모)이 신설되고, 신축 비아파트 매입 시 주담대 활용도 허용됩니다.",
        impact: "빌라·오피스텔 등 비아파트 매물은 매수 수요층(청년 실수요)이 두터워질 수 있어, 매각·공실 해소에 우호적인 변화입니다.",
        effectiveFrom: "2026년 하반기~ (상품별 상이)",
        certainty: "possible",
        match: (ts) => ts.filter(t => isHousing(t) && !isApt(t)),
      },
    ],
  },
  {
    id: "p0813-supply",
    title: "8·13 주택공급 대책",
    announcedAt: "2026-08-13",
    tag: "공급",
    source: { name: "공급대책 요약 보도", url: "http://www.areyou.co.kr/news/articleView.html?idxno=94860" },
    summary: "그린벨트 해제 물량을 포함해 수도권에 23만 가구+α를 추가 공급하고, 공공택지 조기 착공·재건축/재개발 활성화·기부채납 완화로 2030년까지 수도권 135만 호 착공 목표의 실행력을 높이는 대책입니다.",
    items: [
      {
        id: "supply-metro",
        headline: "수도권 공급 확대 — 중장기 임대료·매매가 하방 요인",
        plain: "공급 확대는 수년에 걸쳐 효과가 나타나는 중장기 변수입니다. 단기 시세보다는 3~5년 뒤 인근 입주 물량이 내 매물의 임대료 협상력에 영향을 줄 수 있습니다.",
        impact: "수도권 매물 보유자는 인근 공공택지·정비사업 진행 상황을 계약 갱신 전략에 참고할 만합니다.",
        effectiveFrom: "중장기 (2030년 목표)",
        certainty: "possible",
        match: (ts) => ts.filter(t => isMetroAddr(t.addr)),
      },
    ],
  },
];

// ── 매칭 엔진 ────────────────────────────────────────────────────
// tenants(등록 매물 배열) → 해당 가능성이 있는 정책 항목 목록
// 반환: [{ policyId, policyTitle, policyTag, item, properties: [...매칭 매물] }]
export function matchPolicies(tenants = []) {
  if (!tenants.length) return [];
  const results = [];
  for (const policy of POLICIES) {
    for (const item of policy.items) {
      let matched = [];
      try { matched = item.match(tenants) || []; } catch { matched = []; }
      if (matched.length > 0) {
        results.push({
          policyId: policy.id,
          policyTitle: policy.title,
          policyTag: policy.tag,
          item,
          properties: matched,
        });
      }
    }
  }
  // 확실한 것(possible) 우선, 그다음 확인 필요(check)
  return results.sort((a, b) => (a.item.certainty === "possible" ? 0 : 1) - (b.item.certainty === "possible" ? 0 : 1));
}
