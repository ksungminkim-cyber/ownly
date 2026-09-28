// 가입 후 물건을 아직 등록하지 않은 유저에게 보내는 사용 안내 메일 (크론 /api/notify 가 발송)
// - 가입 D+1 · D+3 · D+7 에 한 통씩, 최대 3통. 물건을 등록하면 즉시 중단 (크론이 물건 0개일 때만 호출)
// - 서비스 이용 안내이므로 요금제 권유 문구는 넣지 않는다 (광고성 정보 아님)
// - 설정의 이메일 알림을 끈 유저에게는 보내지 않는다 (newsletter_subscribers.weekly_digest=false)

export const ONBOARDING_STEPS = [
  { step: 1, afterDays: 1 },
  { step: 2, afterDays: 3 },
  { step: 3, afterDays: 7 },
];
export const ONBOARDING_WINDOW_DAYS = 14; // 이보다 오래된 가입자에게는 시퀀스를 시작하지 않는다
export const ONBOARDING_MIN_GAP_DAYS = 2; // 연속 발송 간격

// 2026-09-11 ~ 09-28 가입자는 대시보드 오류로 첫 화면을 보지 못했다 — 첫 메일에서 사실대로 알린다
const CRASH_FROM = Date.parse("2026-09-10T15:00:00Z"); // 09-11 00:00 KST
const CRASH_TO = Date.parse("2026-09-28T09:00:00Z");   // 수정 배포 시점

/** 다음에 보낼 단계 번호 (없으면 null). sentSteps: 이미 보낸 단계 번호 배열, lastSentAt: 마지막 안내 메일 발송 시각(ms) */
export function nextOnboardingStep({ createdAt, sentSteps = [], lastSentAt = null, now = Date.now() }) {
  const days = (now - Date.parse(createdAt)) / 86400000;
  if (!(days >= 0) || days > ONBOARDING_WINDOW_DAYS) return null;
  if (lastSentAt && now - lastSentAt < ONBOARDING_MIN_GAP_DAYS * 86400000) return null;
  const next = ONBOARDING_STEPS.find((s) => !sentSteps.includes(s.step));
  if (!next || days < next.afterDays) return null;
  return next.step;
}

const p = (t) => `<p style="font-size:14px;color:#3a3a4a;line-height:1.75;margin:0 0 12px;">${t}</p>`;
const li = (items) => `<ul style="margin:0 0 14px;padding-left:18px;font-size:13.5px;color:#3a3a4a;line-height:1.9;">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

/** { subject, title, body, cta } — HTML 틀은 크론의 baseHtml 이 감싼다 */
export function onboardingEmail(step, { createdAt }) {
  const created = Date.parse(createdAt);
  const hitCrash = created >= CRASH_FROM && created < CRASH_TO;
  const cta = { href: "https://www.ownly.kr/dashboard", label: "첫 물건 등록하기 →" };

  if (step === 1) {
    return {
      subject: "온리 시작하기 — 주소 한 칸이면 첫 물건 등록이 끝나요",
      title: "주소만 입력하면 시작됩니다",
      cta,
      body:
        (hitCrash
          ? p("먼저 사과드립니다. 가입하신 시점에 일부 계정에서 대시보드가 열리지 않는 오류가 있었고, 9월 28일 수정했습니다. 지금은 정상적으로 이용하실 수 있습니다.")
          : "") +
        p("온리에 가입해 주셔서 감사합니다. 아직 등록된 물건이 없어 안내드려요.") +
        p("대시보드에서 <b>물건 주소</b>를 입력하면 그 지역의 최근 국토부 실거래 시세를 바로 보여드리고, 월세(또는 전세 보증금)만 넣으면 등록이 끝납니다. 세입자 정보는 나중에 채워도 됩니다.") +
        p("등록해 두시면 온리가 대신 챙겨드리는 것:") +
        li(["매달 납부일이 지나도 입금 기록이 없으면 미납 알림", "계약 만료 90일 이내 물건은 매주 월요일 만료 알림", "매월 1일 수입·시세 요약 리포트"]),
    };
  }
  if (step === 2) {
    return {
      subject: "전세·상가도 등록할 수 있어요 — 온리 이용 안내",
      title: "어떤 물건이든 1분이면 등록됩니다",
      cta,
      body:
        p("아직 물건을 등록하지 않으셨다면, 이런 점이 궁금하셨을 수 있어요.") +
        li([
          "<b>전세</b>: 등록 화면에서 '전세'를 고르고 보증금만 입력하면 됩니다",
          "<b>상가·오피스텔·토지</b>: 물건 관리 → 상세 입력에서 유형을 선택하세요",
          "<b>여러 호실 건물</b>: 건물 관리에서 건물을 만든 뒤 엑셀로 호실을 한 번에 올릴 수 있어요",
          "<b>먼저 구경만</b>: 대시보드의 '샘플 데이터로 구경하기'로 실제 화면을 보고, 클릭 한 번으로 지울 수 있어요",
        ]),
    };
  }
  return {
    subject: "마지막 안내 — 온리 무료 플랜으로 할 수 있는 것",
    title: "무료 플랜으로 충분히 시작할 수 있어요",
    cta,
    body:
      p("가입 후 사용 안내는 이번이 마지막입니다. 이후로는 물건을 등록하셔야 미납·만료 같은 알림 메일이 발송됩니다.") +
      p("무료 플랜에서 바로 쓸 수 있는 것:") +
      li(["물건 3개 · 세입자 5명까지 수금·계약·캘린더 관리", "내용증명 정식 발급 월 1건 (미리보기는 무제한)", "AI 적정 임대료 분석 월 3회"]) +
      p("사용하시다 불편한 점이 있으면 이 메일에 답장하지 마시고 inquiry@mclean21.com 으로 알려주세요. 직접 읽고 개선에 반영합니다."),
  };
}
