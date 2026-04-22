"use client";
// 미납 에스컬레이션 액션 플랜 — 연체 일수에 따라 법적 단계별 대응 가이드

const STAGES = {
  grace: {
    label: "유예 기간 (D+0~3)",
    color: "#0fa573",
    icon: "⏳",
    summary: "착오 입금일 가능성 높음. 친절한 1차 리마인더로 충분",
    steps: [
      { icon: "💬", text: "카카오 알림톡 자동 발송 (납부 안내 템플릿)", action: "kakao" },
      { icon: "📞", text: "전화로 직접 상황 확인 (2회 이상 미출 시 SMS 병행)" },
      { icon: "🧐", text: "은행 SMS 파싱으로 착오 입금 여부 확인" },
    ],
    legal: null,
  },
  remind: {
    label: "1차 연락 (D+4~7)",
    color: "#5b4fcf",
    icon: "📢",
    summary: "상황 파악 + 연체료 고지. 압박 없이 명확하게",
    steps: [
      { icon: "💬", text: "카카오 알림톡 재발송 (읽음 확인)", action: "kakao" },
      { icon: "📱", text: "직접 전화 → 안 받으면 SMS로 '연락 부탁' 메시지" },
      { icon: "💸", text: "계약서상 연체료 조항 안내 (통상 연 12% 내외)" },
    ],
    legal: "민법 397조에 따라 연체이자(법정이율) 청구 가능",
  },
  warn: {
    label: "공식 경고 (D+8~14)",
    color: "#e8960a",
    icon: "⚠️",
    summary: "서면 경고로 기록 남기기. 내용증명까지는 아직",
    steps: [
      { icon: "📧", text: "이메일 또는 서면으로 공식 경고 (발송 기록 보관)" },
      { icon: "📝", text: "계약서 해지 조항(2~3기 연체 시 해지) 재확인" },
      { icon: "🗂️", text: "납부 기록·알림 발송 이력 증빙 자료로 수집" },
    ],
    legal: "주택임대차보호법·상가임대차보호법상 '2기 이상 차임 연체' 해지 요건 준비 단계",
  },
  certify: {
    label: "내용증명 발송 (D+15~30)",
    color: "#e8445a",
    icon: "📨",
    summary: "법적 효력 있는 공식 통보. 소송 전 필수 단계",
    steps: [
      { icon: "📨", text: "내용증명 1차 발송 — 민법 544조 이행 최고", action: "certified" },
      { icon: "📅", text: "답변 유예기간 명시 (통상 7~14일)" },
      { icon: "🤝", text: "이해 당사자(연대보증인 등)에게도 동일 통지" },
    ],
    legal: "해지 의사표시 전 최고(催告)가 법적으로 필요 (민법 544조)",
  },
  legal: {
    label: "법적 절차 (D+31+)",
    color: "#7c1d1d",
    icon: "⚖️",
    summary: "계약 해지 통보 + 명도소송 준비. 법무사 연결 강력 권장",
    steps: [
      { icon: "📨", text: "2차 내용증명: 임대차 계약 해지 통보" },
      { icon: "🏛️", text: "명도소송 제기 — 보통 3~6개월 소요" },
      { icon: "💰", text: "보증금으로 미납분·연체이자 정산, 부족 시 강제집행" },
      { icon: "👨‍⚖️", text: "법무사·변호사 연결 (50~100만원대 수임료)" },
    ],
    legal: "계약 해지 → 명도소송 → 강제집행 순서. 임대인 승소율 통상 90% 이상",
  },
};

export function getUnpaidStage(daysOverdue) {
  if (daysOverdue >= 31) return STAGES.legal;
  if (daysOverdue >= 15) return STAGES.certify;
  if (daysOverdue >= 8)  return STAGES.warn;
  if (daysOverdue >= 4)  return STAGES.remind;
  return STAGES.grace;
}

export function getAllStages() {
  return STAGES;
}

// 모달 내부에서 사용할 UI 렌더러
export default function UnpaidEscalationView({ tenant, daysOverdue, onAction, onClose }) {
  const stage = getUnpaidStage(daysOverdue);
  const allStages = Object.entries(STAGES);
  const currentKey = Object.keys(STAGES).find(k => STAGES[k] === stage);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>
            {stage.icon} {tenant.name}님 미납 대응 플랜
          </h3>
          <p style={{ fontSize: 12, color: "#8a8a9a" }}>
            {daysOverdue}일 연체 · {tenant.addr}
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: stage.color, background: stage.color + "15", padding: "5px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>
          {stage.label}
        </span>
      </div>

      {/* 타임라인 프로그레스 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {allStages.map(([key, st]) => {
          const active = key === currentKey;
          const past = Object.keys(STAGES).indexOf(key) < Object.keys(STAGES).indexOf(currentKey);
          return (
            <div key={key} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, background: active ? st.color : past ? "#c0c0cc" : "#ebe9e3", transition: "all .3s" }} />
              <p style={{ fontSize: 9, fontWeight: 700, color: active ? st.color : "#a0a0b0", marginTop: 4, textAlign: "center", lineHeight: 1.3 }}>
                {st.label.split(" ")[0]}
              </p>
            </div>
          );
        })}
      </div>

      {/* 현재 단계 요약 */}
      <div style={{ background: stage.color + "10", border: `1px solid ${stage.color}30`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: stage.color, marginBottom: 4 }}>💡 {stage.summary}</p>
        {stage.legal && (
          <p style={{ fontSize: 11, color: "#6a6a7a", lineHeight: 1.6 }}>⚖️ {stage.legal}</p>
        )}
      </div>

      {/* 액션 체크리스트 */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>
          이 단계 액션 플랜
        </p>
        {stage.steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#f8f7f4", borderRadius: 10, marginBottom: 7 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{step.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: "#1a2744", lineHeight: 1.6, fontWeight: 600 }}>{step.text}</p>
            </div>
            {step.action && (
              <button onClick={() => onAction?.(step.action, tenant)}
                style={{ padding: "5px 11px", borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer", border: `1px solid ${stage.color}40`, background: stage.color + "15", color: stage.color, whiteSpace: "nowrap" }}>
                {step.action === "kakao" ? "알림톡 →" : step.action === "certified" ? "내용증명 →" : "실행 →"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 다음 단계 미리보기 */}
      {Object.keys(STAGES).indexOf(currentKey) < Object.keys(STAGES).length - 1 && (
        <div style={{ padding: "11px 14px", background: "rgba(26,39,68,0.04)", borderRadius: 10, fontSize: 11, color: "#6a6a7a", lineHeight: 1.6 }}>
          <b style={{ color: "#1a2744" }}>📅 다음 단계:</b> {(() => {
            const keys = Object.keys(STAGES);
            const next = keys[keys.indexOf(currentKey) + 1];
            return `${STAGES[next].icon} ${STAGES[next].label} — ${STAGES[next].summary}`;
          })()}
        </div>
      )}

      {onClose && (
        <button onClick={onClose}
          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1px solid #ebe9e3", background: "transparent", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 14 }}>
          닫기
        </button>
      )}
    </div>
  );
}
