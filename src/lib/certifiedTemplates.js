// 내용증명 발송 사유별 법적 근거 & 본문 템플릿
// 사용처: 대시보드 내용증명(/dashboard/certified) + 무료 공개 생성기(/tools/certified)
export const REASON_TEMPLATES = {
  "임대료 미납": {
    icon: "💴",
    legalBasis: "주택임대차보호법 제6조의3, 민법 제640조",
    deadline: 7,
    template: (d) => `본 임대인은 귀하와 아래 임대차 계약을 체결하고 현재까지 임대 관계를 유지하고 있습니다.

1. 임대 목적물: ${d.propertyAddr || "상기 부동산"}
2. 임대차 기간: ${d.contractStart || "　　　　"} ~ ${d.contractEnd || "　　　　"}
3. 월 임대료: 금 ${d.rentAmt ? Number(d.rentAmt).toLocaleString() + "만 원" : "　　　　　원"}
4. 미납 기간: ${d.unpaidPeriod || "　　　　"}
5. 미납 금액: 금 ${d.unpaidAmt ? Number(d.unpaidAmt).toLocaleString() + "만 원" : "　　　　　원"}

귀하는 위 임대차 계약에 따른 임대료를 상기 기간 동안 납부하지 않고 있습니다. 이에 본 임대인은 귀하에게 이 내용증명 우편 수령일로부터 ${d.deadlineDays || 7}일 이내에 미납 임대료 전액을 납부하여 줄 것을 정식으로 청구합니다.

만일 위 기간 내에 납부가 이루어지지 않을 경우, 본 임대인은 주택임대차보호법 제6조의3에 따라 임대차 계약을 해지하고, 법적 절차를 통해 건물 명도를 청구할 것임을 알려드립니다.`,
  },
  "계약 해지 통보": {
    icon: "📋",
    legalBasis: "주택임대차보호법 제6조, 민법 제635조",
    deadline: 30,
    template: (d) => `본 임대인은 귀하와 아래 임대차 계약을 체결하고 현재까지 임대 관계를 유지하고 있습니다.

1. 임대 목적물: ${d.propertyAddr || "상기 부동산"}
2. 임대차 기간: ${d.contractStart || "　　　　"} ~ ${d.contractEnd || "　　　　"}
3. 월 임대료: 금 ${d.rentAmt ? Number(d.rentAmt).toLocaleString() + "만 원" : "　　　　　원"}

본 임대인은 민법 제635조 및 주택임대차보호법 제6조에 의거하여, 위 임대차 계약을 이 내용증명 우편 수령일로부터 ${d.deadlineDays || 30}일 후에 해지할 것임을 통보합니다.

귀하는 위 기간 내에 임대 목적물을 원상복구하여 반환하여 주시기 바랍니다. 계약 종료 시 보증금은 임대 목적물 인도와 동시에 반환하겠습니다.`,
  },
  "계약 위반 시정 요구": {
    icon: "⚠️",
    legalBasis: "민법 제543조, 제544조",
    deadline: 14,
    template: (d) => `본 임대인은 귀하와 아래 임대차 계약을 체결하고 현재까지 임대 관계를 유지하고 있습니다.

1. 임대 목적물: ${d.propertyAddr || "상기 부동산"}
2. 임대차 기간: ${d.contractStart || "　　　　"} ~ ${d.contractEnd || "　　　　"}
3. 위반 사항: ${d.violationDetail || "　　　　　　　　　　　　"}

귀하의 위 행위는 임대차 계약서 제　　조에 위반되는 사항으로, 민법 제543조 및 제544조에 따라 계약 해지의 원인이 될 수 있습니다.

이에 본 임대인은 귀하에게 이 내용증명 우편 수령일로부터 ${d.deadlineDays || 14}일 이내에 위 위반 사항을 시정하여 줄 것을 정식으로 요구합니다.

만일 위 기간 내에 시정이 이루어지지 않을 경우, 본 임대인은 계약 해지 및 법적 조치를 취할 것임을 알려드립니다.`,
  },
  "명도 요청": {
    icon: "🏠",
    legalBasis: "민법 제213조, 주택임대차보호법 제6조",
    deadline: 14,
    template: (d) => `본 임대인은 귀하와 아래 임대차 계약을 체결하였으며, 위 계약은 아래와 같이 종료되었습니다.

1. 임대 목적물: ${d.propertyAddr || "상기 부동산"}
2. 임대차 기간: ${d.contractStart || "　　　　"} ~ ${d.contractEnd || "　　　　"} (만료)
3. 계약 종료 사유: ${d.terminationReason || "계약 기간 만료"}

위 임대차 계약은 상기 기간 만료로 종료되었음에도 불구하고 귀하는 현재까지 임대 목적물을 점유하고 있습니다.

이에 본 임대인은 귀하에게 이 내용증명 우편 수령일로부터 ${d.deadlineDays || 14}일 이내에 임대 목적물을 원상복구하여 반환하여 줄 것을 정식으로 요구합니다.

위 기간 내에 명도가 이루어지지 않을 경우, 본 임대인은 법원에 명도소송을 제기하고 강제집행을 신청할 것임을 알려드립니다.`,
  },
  "보증금 반환 청구": {
    icon: "💰",
    legalBasis: "주택임대차보호법 제3조의2, 민법 제618조",
    deadline: 7,
    template: (d) => `본 임차인(귀하)과의 임대차 계약이 아래와 같이 종료되었으나, 보증금이 반환되지 않고 있습니다.

1. 임대 목적물: ${d.propertyAddr || "상기 부동산"}
2. 임대차 기간: ${d.contractStart || "　　　　"} ~ ${d.contractEnd || "　　　　"}
3. 계약 보증금: 금 ${d.depositAmt ? Number(d.depositAmt).toLocaleString() + "만 원" : "　　　　　원"}
4. 공제 금액: 금 ${d.deductAmt ? Number(d.deductAmt).toLocaleString() + "만 원" : "0원"}
5. 반환 청구액: 금 ${d.refundAmt ? Number(d.refundAmt).toLocaleString() + "만 원" : "　　　　　원"}

본 임대인은 주택임대차보호법 제3조의2에 따라 임대차 종료 시 보증금을 반환할 의무가 있습니다. 이에 귀하에게 이 내용증명 우편 수령일로부터 ${d.deadlineDays || 7}일 이내에 위 반환 청구액을 지정 계좌로 송금하여 줄 것을 청구합니다.

만일 이행하지 않을 경우 민사소송 및 임차권등기명령 신청 등 법적 절차를 진행할 것임을 알려드립니다.`,
  },
  "기타": {
    icon: "📄",
    legalBasis: "민법 관련 규정",
    deadline: 7,
    template: (d) => `본 임대인은 귀하에게 아래 사항을 정식으로 통보합니다.\n\n임대 목적물: ${d.propertyAddr || "상기 부동산"}\n\n${d.customContent || ""}`,
  },
};
