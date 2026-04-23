// 세입자 신뢰도 크레딧 스코어
// 납부 이력 + 소통 빈도 + 수리 요청 + 재임 기간 종합 점수 (0~100)

import { calcPaymentRisk } from "./paymentRisk";

// 점수 계산
export function calcTenantCredit(tenant, payments, notes = [], repairs = [], startDate) {
  const risk = calcPaymentRisk(tenant, payments);
  const tenantNotes = notes.filter(n => n.tenant_id === tenant.id);
  const tenantRepairs = repairs.filter(r => r.tenant_id === tenant.id);

  // 1. 납부 신뢰도 (40점): risk.score 역산
  // paymentRisk: 0(안정) ~ 100(위험) → 40(만점) ~ 0(최하)
  let paymentScore;
  if (risk.level === "unknown") paymentScore = 20; // 이력 없음 = 중간값
  else paymentScore = Math.round(40 * (1 - risk.score / 100));

  // 2. 소통 참여도 (20점): 메모 개수에 따라
  // 0개: 10점 (데이터 없음)
  // 1~5개: 20점 (활발한 소통)
  // 6~15개: 15점 (보통)
  // 16개+: 5점 (과다 소통 = 문제 신호)
  let engagementScore;
  const noteCount = tenantNotes.length;
  if (noteCount === 0) engagementScore = 10;
  else if (noteCount <= 5) engagementScore = 20;
  else if (noteCount <= 15) engagementScore = 15;
  else engagementScore = 5;

  // 민원성 노트(complaint) 많으면 감점
  const complaintCount = tenantNotes.filter(n => n.type === "complaint").length;
  engagementScore = Math.max(0, engagementScore - complaintCount * 2);

  // 3. 낮은 유지보수 부담 (20점): 수리 요청 빈도
  // 0건: 20점 (문제 없음)
  // 1~2건: 15점
  // 3~5건: 10점
  // 6건+: 5점
  // 긴급 요청 있으면 추가 감점
  let maintenanceScore;
  const repairCount = tenantRepairs.length;
  const urgentCount = tenantRepairs.filter(r => r.priority === "urgent").length;
  if (repairCount === 0) maintenanceScore = 20;
  else if (repairCount <= 2) maintenanceScore = 15;
  else if (repairCount <= 5) maintenanceScore = 10;
  else maintenanceScore = 5;
  maintenanceScore = Math.max(0, maintenanceScore - urgentCount * 2);

  // 4. 재임 기간 (20점): start_date 기준
  // 6개월 미만: 5점 (아직 검증 안됨)
  // 6개월~1년: 10점
  // 1~2년: 15점
  // 2년+: 20점 (장기 안정 임차)
  let tenureScore = 5;
  const sd = startDate || tenant.start_date;
  if (sd) {
    const months = Math.floor((Date.now() - new Date(sd).getTime()) / (30 * 86400000));
    if (months >= 24) tenureScore = 20;
    else if (months >= 12) tenureScore = 15;
    else if (months >= 6) tenureScore = 10;
  }

  const total = paymentScore + engagementScore + maintenanceScore + tenureScore;

  let grade, label, color, bg;
  if (total >= 90)      { grade = "A+"; label = "매우 신뢰"; color = "#0fa573"; bg = "rgba(15,165,115,0.1)"; }
  else if (total >= 75) { grade = "A";  label = "신뢰";     color = "#5b4fcf"; bg = "rgba(91,79,207,0.1)"; }
  else if (total >= 55) { grade = "B";  label = "보통";     color = "#e8960a"; bg = "rgba(232,150,10,0.1)"; }
  else if (total >= 35) { grade = "C";  label = "주의";     color = "#f97316"; bg = "rgba(249,115,22,0.1)"; }
  else                  { grade = "D";  label = "고위험";   color = "#e8445a"; bg = "rgba(232,68,90,0.1)"; }

  return {
    total,
    grade,
    label,
    color,
    bg,
    breakdown: {
      payment: { score: paymentScore, max: 40, reason: risk.reason || "평가 대기" },
      engagement: { score: engagementScore, max: 20, reason: `메모 ${noteCount}건${complaintCount > 0 ? ` · 민원 ${complaintCount}건` : ""}` },
      maintenance: { score: maintenanceScore, max: 20, reason: `수리 ${repairCount}건${urgentCount > 0 ? ` · 긴급 ${urgentCount}건` : ""}` },
      tenure: { score: tenureScore, max: 20, reason: sd ? `${Math.floor((Date.now() - new Date(sd).getTime()) / (30 * 86400000))}개월 재임` : "기간 정보 없음" },
    },
  };
}
