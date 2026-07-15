"use client";
import { useRouter, useParams } from "next/navigation";

const POSTS = {
  "landlord-income-tax-2025": {
    title: "2025년 임대소득 종합소득세 신고 완벽 가이드",
    tag: "세금", tagColor: "#0fa573", date: "2025.03", readTime: "8분",
    content: [
      { type: "intro", text: "주택 임대소득이 있으면 매년 5월 종합소득세 신고 대상이 될 수 있습니다. 하지만 '얼마부터', '어떻게' 과세되는지는 보유 주택 수·임대 유형·소득 규모에 따라 크게 달라집니다. 핵심 판단 기준부터 필요경비·건강보험료 영향까지, 임대인이 5월 신고 전에 알아야 할 내용을 정리했습니다. (기준: 2024~2025년 세법. 실제 신고는 홈택스·세무사로 확인하세요.)" },

      { type: "h2", text: "1. 내 임대소득은 과세 대상인가 — 먼저 이것부터" },
      { type: "p", text: "주택 임대소득의 과세 여부는 '월세가 있는가'와 '보유 주택 수'로 갈립니다. 전세보증금만 있는 경우와 월세가 있는 경우가 다릅니다." },
      { type: "ul", items: [
        "1주택자: 원칙적으로 월세 비과세. 단, 기준시가 12억원 초과 고가주택의 월세는 과세.",
        "2주택자: 월세 수입은 과세. 전세보증금은 원칙적으로 비과세.",
        "3주택 이상: 월세 + 전세보증금(간주임대료)도 과세 대상이 될 수 있음(소형주택 제외 등 요건 있음).",
      ] },

      { type: "h2", text: "2. 2000만원 이하 — 분리과세 vs 종합과세, 무엇이 유리한가" },
      { type: "p", text: "연간 주택 임대소득이 2000만원 이하라면 분리과세(단일세율 14%)와 종합과세(다른 소득과 합산, 누진세율 6~45%) 중 선택할 수 있습니다. 선택 기준은 '다른 소득이 얼마나 되는가'입니다." },
      { type: "ul", items: [
        "근로·사업 등 다른 소득이 많아 높은 누진세율 구간이면 → 분리과세(14%)가 유리한 경우가 많습니다.",
        "다른 소득이 적어 낮은 세율 구간이면 → 종합과세가 오히려 유리할 수 있습니다.",
        "임대사업자 등록 여부에 따라 분리과세 시 필요경비율·기본공제가 달라집니다(등록 60%·400만원 / 미등록 50%·200만원 수준).",
      ] },

      { type: "h2", text: "3. 필요경비 — 무엇을 얼마나 뺄 수 있나" },
      { type: "p", text: "종합과세(장부신고)를 택하면 실제 지출한 필요경비를 공제받습니다. 대표적으로 다음 항목이 인정됩니다." },
      { type: "ul", items: [
        "재산세·종합부동산세(임대분), 화재보험료",
        "건물 감가상각비, 수선비·시설 유지비",
        "임대 목적물 취득·유지를 위한 대출이자",
        "중개수수료, 관리 관련 비용",
      ] },
      { type: "p", text: "장부를 쓰지 않는 간편장부·추계 대상자는 업종별 경비율(단순경비율/기준경비율)을 일괄 적용합니다. 실제 경비가 경비율보다 크면 장부신고가, 작으면 추계가 유리합니다." },

      { type: "h2", text: "4. 놓치기 쉬운 것 — 건강보험료" },
      { type: "p", text: "임대소득 신고에서 세금만큼 중요한 것이 건강보험료입니다. 특히 피부양자로 등재돼 있던 분이 임대소득이 잡히면 지역가입자로 전환되며 보험료가 새로 부과될 수 있습니다. 세금이 적어 보여도 건보료까지 합치면 실부담이 커질 수 있으니, 신고 방식을 정하기 전에 반드시 함께 계산해야 합니다." },

      { type: "h2", text: "5. 임대사업자 등록 — 혜택과 의무" },
      { type: "p", text: "민간임대주택으로 등록하면 분리과세 시 필요경비·공제 확대, 일부 지방세 감면 등의 혜택이 있습니다. 다만 의무임대기간(단기·장기 유형별) 준수, 임대료 인상률 5% 상한 등 의무가 따르고, 중도 말소 시 감면세액이 추징될 수 있어 신중히 판단해야 합니다." },

      { type: "h2", text: "6. 신고 전에 예상 세액을 미리 계산하세요" },
      { type: "p", text: "5월 신고 시즌에 몰아서 계산하면 분리·종합 비교나 건보료 영향을 따져볼 시간이 부족합니다. 미리 예상 세액을 뽑아두면 신고 방식 선택과 세무사 상담이 훨씬 수월해집니다." },
      { type: "tool", href: "/tools/yield", label: "임대 수익률 계산기 (무료)", desc: "세전·세후 수익률과 현금흐름을 미리 확인하세요. 로그인 없이 무료로 계산합니다." },
      { type: "p", text: "온리에 물건을 등록해 두면 연간 임대수입이 자동 집계되고, 세금 시뮬레이터로 예상 종합소득세·건강보험료를 미리 확인할 수 있습니다. 신고 전 세무사 상담의 기초 자료로 활용하세요." },
      { type: "cta", text: "온리 무료로 시작하기" },
    ],
  },
  "lease-renewal-right-guide": {
    title: "계약갱신청구권 완벽 이해 — 임대인이 거절할 수 있는 경우",
    tag: "임대차 3법", tagColor: "#5b4fcf", date: "2025.03", readTime: "6분",
    content: [
      { type: "intro", text: "2020년 7월 시행된 계약갱신청구권은 세입자에게 1회 계약갱신을 요구할 권리를 부여합니다. 하지만 임대인도 정당한 사유가 있으면 거절할 수 있습니다." },
      { type: "h2", text: "1. 임대인이 갱신을 거절할 수 있는 6가지 경우" },
      { type: "p", text: "① 임대인 또는 직계존비속이 실제 거주할 경우 ② 세입자가 3회 이상 월세 연체한 경우 ③ 세입자가 임대인 동의 없이 전대한 경우 ④ 세입자가 주택을 파손·멸실한 경우 ⑤ 재건축·철거 계획이 있는 경우 ⑥ 기타 의무 위반 사항이 있는 경우." },
      { type: "h2", text: "2. 실거주 요건의 함정" },
      { type: "p", text: "실거주를 이유로 갱신을 거절했다가 실제로 거주하지 않으면, 세입자는 손해배상을 청구할 수 있습니다. 2년 내 제3자에게 임대하면 자동으로 손해배상 의무가 발생합니다." },
      { type: "h2", text: "3. 갱신 시 임대료 인상 한도" },
      { type: "p", text: "계약갱신 시 임대료 인상은 기존 임대료의 5%를 초과할 수 없습니다. 월세와 보증금 간 전환도 법정 전환율(연 2.5%) 이내여야 합니다." },
      { type: "h2", text: "4. 갱신 의향 관리는 온리로" },
      { type: "p", text: "온리의 갱신 의향 관리 기능을 활용하면 세입자별 갱신 의향을 추적하고, 만료 D-90일부터 알림을 받아 선제적으로 대응할 수 있습니다." },
      { type: "cta", text: "온리로 갱신 의향 관리하기" },
    ],
  },
  "delinquent-tenant-guide": {
    title: "월세 미납 세입자 대응 단계별 가이드 — 내용증명부터 명도까지",
    tag: "법률", tagColor: "#e8445a", date: "2025.03", readTime: "10분",
    content: [
      { type: "intro", text: "월세 미납은 임대인이 가장 자주, 가장 곤란하게 겪는 문제입니다. 핵심은 감정이 아니라 '기록'과 '절차'입니다. 각 단계에서 증거를 남기며 대응하면, 최악의 경우 명도소송까지 가더라도 임대인이 절대적으로 유리한 위치를 지킬 수 있습니다. 미납 1개월 차부터 강제집행까지 전 과정을 실제 법 조항과 함께 정리했습니다." },

      { type: "h2", text: "먼저: 월세 연체는 며칠부터 '법적 연체'인가" },
      { type: "p", text: "약정한 지급일(예: 매월 5일)을 하루라도 넘기면 채무불이행 상태가 됩니다. 다만 계약 해지의 근거가 되는 '연체'는 회차로 셉니다. 주택은 2기(2개월분), 상가는 3기(3개월분)의 차임에 해당하는 금액이 밀렸을 때 비로소 해지권이 발생합니다(민법 제640조·상가건물임대차보호법 제10조의8). 즉 '한 달 밀렸다'와 '두 달분이 밀렸다'는 법적으로 전혀 다른 상황입니다." },

      { type: "h2", text: "1단계 · 연락과 독촉 (미납 직후 ~ 1개월)" },
      { type: "p", text: "가장 많은 미납은 이 단계에서 해결됩니다. 단순 실수·자금 사정 지연인 경우가 많기 때문입니다. 중요한 건 '연락했다는 사실을 남기는 것'입니다. 전화만으로는 증거가 남지 않으니, 통화 후에는 반드시 문자·카톡으로 요약을 남기세요." },
      { type: "ul", items: [
        "문자 예시: \"○○호 △월 월세 120만원이 아직 입금되지 않았습니다. □일까지 입금 부탁드립니다.\"",
        "감정적 표현·협박성 문구는 금지 — 나중에 임대인이 불리해질 수 있습니다.",
        "세입자의 답장(\"곧 넣겠습니다\" 등)은 미납 사실을 인정하는 증거가 되므로 캡처해 보관하세요.",
      ] },

      { type: "h2", text: "2단계 · 내용증명 발송 (2기/2개월분 도달 시)" },
      { type: "p", text: "연체가 2기(주택)에 도달하면 내용증명을 보냅니다. 내용증명은 그 자체로 강제력은 없지만, '언제·무엇을·누구에게 통보했는지'를 우체국이 공적으로 증명합니다. 이후 계약 해지와 명도소송에서 '임대인이 정당한 절차를 밟았다'는 핵심 증거가 됩니다. 반드시 들어가야 할 항목은 다음과 같습니다." },
      { type: "ul", items: [
        "임대 목적물(주소)과 계약 내용(기간·월세·보증금)",
        "연체 회차와 미납 총액(예: △월~△월 3개월분 360만원)",
        "납부 기한(통상 수령일로부터 7~14일)",
        "기한 내 미납 시 계약을 해지하겠다는 의사표시",
      ] },
      { type: "tool", href: "/tools/certified", label: "내용증명 무료로 작성하기", desc: "월세 미납 사유를 선택하면 법적 근거가 포함된 내용증명을 자동 완성합니다. 회원가입 없이 미리보기까지 무료." },

      { type: "h2", text: "3단계 · 계약 해지 통보" },
      { type: "p", text: "2기 이상 연체가 확인되면 임대인은 계약을 해지할 수 있습니다. 해지의 의사표시는 세입자에게 '도달'해야 효력이 생기므로, 이 통보 역시 내용증명으로 보내는 것이 원칙입니다. 2단계의 미납 독촉 내용증명에 '기한 내 미납 시 별도 통고 없이 해지한다'는 문구를 넣어두면, 기한 경과만으로 해지 효력을 주장할 수 있어 절차가 간결해집니다." },
      { type: "h3", text: "보증금과의 상계는 자동이 아닙니다" },
      { type: "p", text: "많은 임대인이 '보증금에서 까면 된다'고 생각하지만, 연체 차임은 계약 종료·명도 시점에 정산되는 것이 원칙입니다. 미납이 보증금 범위 안이라도 세입자가 계속 점유하면 임대인의 손해(차임 상당액)는 계속 쌓입니다. 보증금이 소진되기 전에 절차를 시작해야 하는 이유입니다." },

      { type: "h2", text: "4단계 · 명도소송과 강제집행" },
      { type: "p", text: "해지 후에도 세입자가 퇴거를 거부하면 법원에 건물명도(인도)청구 소송을 제기합니다. 통상 소요 기간은 변론 진행에 따라 4~8개월입니다. 미납이 명백하면 다투는 쟁점이 적어 비교적 빠르게 진행됩니다." },
      { type: "ul", items: [
        "관할: 목적물 소재지 지방법원",
        "판결 확정 후에도 자진 퇴거하지 않으면 집행관을 통한 강제집행(강제 인도)이 가능합니다.",
        "소송과 별개로, 밀린 차임은 지급명령 신청으로 더 빠르게 집행권원을 확보할 수 있습니다.",
        "세입자의 재산 도피가 우려되면 점유이전금지가처분을 먼저 걸어두는 것이 안전합니다.",
      ] },
      { type: "h3", text: "임차권등기명령 — 세입자가 나간 뒤 보증금을 못 받은 경우" },
      { type: "p", text: "반대로 임대인이 아니라 임차인이 보증금을 못 받고 이사해야 하는 상황이라면, 임차권등기명령으로 대항력·우선변제권을 유지한 채 이사할 수 있습니다. 미납 대응과는 반대 방향이지만, 분쟁이 양방향으로 번질 때 알아두면 유용합니다." },

      { type: "h2", text: "전 과정에서 임대인이 지켜야 할 3원칙" },
      { type: "ul", items: [
        "① 모든 통보는 기록으로 — 문자·카톡·내용증명. 구두 통보는 없는 것과 같습니다.",
        "② 자력구제 금지 — 세입자 동의 없이 짐을 빼거나 잠금장치를 바꾸면 형사처벌 대상이 될 수 있습니다.",
        "③ 절차는 빠를수록 유리 — 미납은 시간이 갈수록 임대인의 미회수 손해만 커집니다.",
      ] },
      { type: "p", text: "온리에서는 물건별 미납 현황을 자동 추적하고, 미납이 확인되면 위 단계에 맞는 내용증명을 바로 발행할 수 있습니다. 발송 이력과 등기번호까지 한 곳에서 관리해, 나중에 소송이 필요할 때 증거를 즉시 정리할 수 있습니다." },
      { type: "cta", text: "온리로 미납 관리 시작하기" },
    ],
  },
  "commercial-lease-management": {
    title: "상가 임대 관리 핵심 체크리스트 — 주거와 다른 점 총정리",
    tag: "상가 임대", tagColor: "#e8960a", date: "2025.03", readTime: "7분",
    content: [
      { type: "intro", text: "상가 임대는 주거 임대와 법적 구조, 세금, 관리 방식이 다릅니다. 임대인이 반드시 알아야 할 핵심 차이점을 정리했습니다." },
      { type: "h2", text: "1. 상가 임대차보호법 적용 요건" },
      { type: "p", text: "상가건물 임대차보호법은 환산보증금 기준 이하인 경우에만 적용됩니다. 서울 기준 환산보증금 9억원 이하(보증금 + 월세×100)인 소규모 상가에 적용됩니다. 초과 시 민법이 적용됩니다." },
      { type: "h2", text: "2. 관리비 구성과 세금 처리" },
      { type: "p", text: "상가 임대수익은 부가가치세 과세 대상입니다(주거용 제외). 관리비도 부가세 포함 여부를 계약서에 명시해야 합니다. 연 매출 8000만원 이상이면 일반과세자로 분기별 부가세 신고 의무가 있습니다." },
      { type: "h2", text: "3. 권리금 분쟁 예방" },
      { type: "p", text: "임대인은 세입자가 새로운 임차인으로부터 권리금을 받는 것을 방해해서는 안 됩니다. 계약 종료 3개월 전부터 6개월 사이에 새 임차인을 주선할 기회를 줘야 합니다." },
      { type: "h2", text: "4. 온리로 상가 임대 관리하기" },
      { type: "p", text: "온리는 상가 임대 특화 기능을 제공합니다. 관리비 포함 수금 추적, 상가 임대차 3법 체크리스트, 부가세 포함 수익 계산 등 주거와 상가를 통합 관리할 수 있습니다." },
      { type: "cta", text: "상가 임대 관리 시작하기" },
    ],
  },
  "rental-yield-calculation": {
    title: "임대 수익률 제대로 계산하는 법 — 표면 수익률 vs 실질 수익률",
    tag: "투자", tagColor: "#1a2744", date: "2025.03", readTime: "9분",
    content: [
      { type: "intro", text: "부동산 투자 전 수익률 계산은 필수입니다. 하지만 많은 임대인이 세금·보험료를 빠뜨린 표면 수익률만 보고 투자 결정을 내립니다." },
      { type: "h2", text: "1. 표면(총) 수익률 계산" },
      { type: "p", text: "표면 수익률 = (연간 임대수익 ÷ 매입가) × 100. 예) 매입가 5억, 월세 150만원 → 연 1800만원 ÷ 5억 = 3.6%. 하지만 이건 세전·비용 전 수치입니다." },
      { type: "h2", text: "2. 실질 수익률 계산 (세후)" },
      { type: "p", text: "실질 수익률을 구하려면 ① 재산세 ② 종합소득세 ③ 건강보험료 추가분 ④ 관리 비용 ⑤ 공실 손실 ⑥ 대출 이자(있는 경우)를 모두 차감해야 합니다. 실제로는 표면 수익률의 60~70% 수준인 경우가 많습니다." },
      { type: "h2", text: "3. 투자 결정 전 체크리스트" },
      { type: "p", text: "① 실질 수익률이 은행 예금 금리보다 2% 이상 높은가? ② 5년 후 매도 시 예상 시세차익은? ③ 공실 3개월 발생해도 대출 이자를 감당할 수 있는가? ④ 세금 신고를 직접 처리할 수 있는가?" },
      { type: "h2", text: "4. 온리 수익률 계산기 활용" },
      { type: "p", text: "온리 플러스 플랜의 수익률 계산기는 취득세·종소세·건강보험료를 자동 반영한 실질 수익률을 계산해 드립니다. 투자 전 필수 도구로 활용하세요." },
      { type: "cta", text: "수익률 계산기 사용해보기" },
    ],
  },
  "vacancy-management-tips": {
    title: "공실 기간을 줄이는 임대인 실전 전략 5가지",
    tag: "공실 관리", tagColor: "#0d9488", date: "2025.03", readTime: "5분",
    content: [
      { type: "intro", text: "공실 1개월은 그냥 손실이 아닙니다. 월세를 못 받는 것은 물론, 관리비·대출 이자는 그대로 나갑니다. 공실을 빠르게 해소하는 실전 전략 5가지를 소개합니다." },
      { type: "h2", text: "1. 플랫폼 다중 등록" },
      { type: "p", text: "직방·다방·네이버 부동산·당근마켓에 동시 등록하세요. 각 플랫폼마다 주 사용자층이 다릅니다. 네이버는 40대 이상, 직방·다방은 20~30대 비중이 높습니다." },
      { type: "h2", text: "2. 적정 임대료 설정" },
      { type: "p", text: "공실이 2개월 이상 지속되면 인근 시세를 재조사하세요. 시세 대비 5% 낮추는 것만으로 계약 속도가 2~3배 빨라지는 경우가 많습니다. 온리의 AI 적정 임대료 분석(국토부 실거래 기반)으로 시세를 확인할 수 있습니다." },
      { type: "h2", text: "3. 사진 품질 개선" },
      { type: "p", text: "임대 매물 조회에서 사진이 차지하는 비중은 절대적입니다. 자연광이 드는 낮 시간에 광각으로 촬영하고, 최소 10장 이상 올리세요. 스마트폰으로도 충분하지만 정리·청소 후 촬영은 필수입니다." },
      { type: "h2", text: "4. 조건 유연화" },
      { type: "p", text: "반려동물 허용, 보증금 분할 납부, 단기 임대 허용 등 조건을 유연하게 하면 잠재 임차인 풀이 크게 늘어납니다. 가구·가전 포함 조건도 효과적입니다." },
      { type: "h2", text: "5. 공실 손실을 정확히 파악하기" },
      { type: "p", text: "공실 기간이 길어질수록 심리적으로 조급해집니다. 온리의 공실 손실 계산기로 일별 기회비용을 명확히 파악하면 협상 시 최저선을 설정하는 데 도움이 됩니다." },
      { type: "cta", text: "공실 관리 시작하기" },
    ],
  },
  "long-term-commercial-vacancy": {
    title: "상가 장기 공실 탈출 플레이북 — 6개월 이상 비어있다면",
    tag: "공실 관리", tagColor: "#7c1d1d", date: "2026.04", readTime: "8분",
    content: [
      { type: "intro", text: "상가가 6개월 이상 비어있다면 기본 전략(시세 조정·중개사 접촉)은 이미 효과가 없다는 뜻입니다. 장기 공실에는 구조적 접근이 필요합니다. 기회비용과 세금, 자산 가치까지 종합적으로 판단해야 할 시점입니다." },
      { type: "h2", text: "1. 누적 손실 먼저 정량화하세요" },
      { type: "p", text: "기대 월세 500만원의 상가가 1년 비었다면 임대수입 손실만 6,000만원입니다. 여기에 대출 이자·관리비·재산세를 더하면 체감 손실은 더 큽니다. 감정적으로 결정하지 말고 수치로 판단하세요. 온리의 공실 손실 계산기는 세금 절감까지 반영한 순손실을 자동으로 계산합니다." },
      { type: "h2", text: "2. 용도 변경·리모델링 전환 검토" },
      { type: "p", text: "1층 근린상가가 비어있다면 인근 수요에 따라 카페→사무실, 음식점→쉐어오피스, 일반 상가→무인매장 같은 용도 변경을 검토하세요. 근린생활시설 간 용도 변경은 구청 신고만으로 가능한 경우가 많습니다. 리모델링 비용은 보통 평당 50~100만원이지만 공실 3개월치 임대료로 회수 가능합니다." },
      { type: "h2", text: "3. 렌트프리 + 단계별 임대료 구조" },
      { type: "p", text: "신규 임차인에게 1~3개월 렌트프리를 제안하면 초기 진입 장벽이 크게 낮아집니다. 예를 들어 '1개월 무료 + 1년차 월세 10% 할인, 2년차부터 정상 임대료' 같은 단계별 구조는 임차인의 초기 리스크를 덜어주면서도 임대인 입장에선 평균 수익률을 크게 훼손하지 않습니다." },
      { type: "h2", text: "4. 중개수수료 인센티브 2배" },
      { type: "p", text: "일반적인 중개수수료는 법정 상한(월세의 0.9%)입니다. 장기 공실 상가에는 2배 인센티브를 제안해 복수 중개사가 경쟁적으로 움직이게 하세요. 3개월치 월세 손실보다 수수료 2배가 훨씬 저렴한 비용입니다. 구두가 아니라 서면으로 확약해야 실효성이 있습니다." },
      { type: "h2", text: "5. 팝업스토어·단기 임대 플랫폼 활용" },
      { type: "p", text: "스위트스팟, 스페이스클라우드, 위워크 등 단기 임대 플랫폼을 통해 주 단위·월 단위 임대가 가능합니다. 정식 장기 임차인을 기다리는 동안에도 수익이 발생하고, 공간이 사용된다는 자체가 다음 임차인에게 긍정 신호를 줍니다." },
      { type: "h2", text: "6. 매각 vs 유지 시뮬레이션" },
      { type: "p", text: "공실이 1년 이상 지속되면 '유지 시 총 손실'과 '매각 후 재투자 수익'을 비교해야 합니다. 기회비용(1년 손실 = 매각가의 몇 %)을 기준가에 반영한 객관적 판단이 필요합니다. 세무사·공인중개사와 상담해 의사결정 근거를 확보하세요." },
      { type: "h2", text: "7. 장기 공실 세금 최적화" },
      { type: "p", text: "공실 기간 동안 발생한 관리비·대출 이자·감가상각비는 필요경비로 인정됩니다. 단, 증빙 관리가 철저해야 합니다. 온리의 장부 기능으로 지출을 자동 기록하면 종합소득세 신고 시 절세 효과를 극대화할 수 있습니다." },
      { type: "cta", text: "장기 공실 액션플랜 확인하기" },
    ],
  },
};

export default function BlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const post = POSTS[params.slug];

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Pretendard',sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#1a2744", marginBottom: 8 }}>포스트를 찾을 수 없습니다</p>
          <button onClick={() => router.push("/blog")} style={{ padding: "10px 24px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>블로그로 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ebe9e3", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#1a2744" }}>온리</span>
        </div>
        <span style={{ color: "#ebe9e3" }}>|</span>
        <span onClick={() => router.push("/blog")} style={{ fontSize: 14, fontWeight: 700, color: "#8a8a9a", cursor: "pointer" }}>임대인 가이드</span>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* 포스트 헤더 */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: post.tagColor, background: post.tagColor + "15", padding: "4px 10px", borderRadius: 20 }}>{post.tag}</span>
            <span style={{ fontSize: 12, color: "#a0a0b0" }}>{post.date} · {post.readTime} 읽기</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a2744", lineHeight: 1.3, marginBottom: 0 }}>{post.title}</h1>
        </div>

        {/* 본문 */}
        <article style={{ background: "#fff", borderRadius: 20, padding: "36px", border: "1px solid #ebe9e3" }}>
          {post.content.map((block, i) => {
            if (block.type === "intro") return (
              <p key={i} style={{ fontSize: 16, color: "#3a3a4e", lineHeight: 1.8, marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid #ebe9e3", fontWeight: 500 }}>{block.text}</p>
            );
            if (block.type === "h2") return (
              <h2 key={i} style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginTop: 36, marginBottom: 12 }}>{block.text}</h2>
            );
            if (block.type === "p") return (
              <p key={i} style={{ fontSize: 14, color: "#4a4a5e", lineHeight: 1.9, marginBottom: 20 }}>{block.text}</p>
            );
            if (block.type === "h3") return (
              <h3 key={i} style={{ fontSize: 15, fontWeight: 800, color: "#1a2744", marginTop: 24, marginBottom: 10 }}>{block.text}</h3>
            );
            if (block.type === "ul") return (
              <ul key={i} style={{ margin: "0 0 20px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {block.items.map((it, j) => <li key={j} style={{ fontSize: 14, color: "#4a4a5e", lineHeight: 1.7 }}>{it}</li>)}
              </ul>
            );
            if (block.type === "tool") return (
              <a key={i} href={block.href} style={{ display: "block", margin: "8px 0 24px", padding: "16px 18px", background: "linear-gradient(135deg,rgba(91,79,207,0.06),rgba(26,39,68,0.04))", border: "1px solid rgba(91,79,207,0.2)", borderRadius: 12, textDecoration: "none" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#5b4fcf", marginBottom: 3 }}>🔗 온리 무료 도구</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 2 }}>{block.label}</p>
                {block.desc && <p style={{ fontSize: 12.5, color: "#6a6a7a", lineHeight: 1.6 }}>{block.desc}</p>}
              </a>
            );
            if (block.type === "cta") return (
              <div key={i} style={{ marginTop: 40, padding: "24px", background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(15,165,115,0.04))", borderRadius: 14, border: "1px solid rgba(26,39,68,0.1)", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#8a8a9a", marginBottom: 14 }}>온리에서 지금 바로 시작해보세요. 무료 플랜으로 3개 물건까지 무료입니다.</p>
                <button onClick={() => router.push("/login")} style={{ padding: "12px 28px", borderRadius: 11, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>
                  {block.text} →
                </button>
              </div>
            );
            return null;
          })}
        </article>

        {/* 다른 글 보기 */}
        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => router.push("/blog")} style={{ padding: "10px 20px", borderRadius: 10, background: "#fff", border: "1px solid #ebe9e3", color: "#1a2744", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← 모든 가이드 보기
          </button>
          <button onClick={() => router.push("/login")} style={{ padding: "10px 20px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            온리 무료 시작 →
          </button>
        </div>
      </div>
    </div>
  );
}
