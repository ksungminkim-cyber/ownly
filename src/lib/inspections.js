// 입주·퇴실 점검 — 공간 템플릿과 입주↔퇴실 비교(순수 함수)

export const AREA_TEMPLATES = {
  residential: ["현관", "거실", "주방", "욕실", "방1", "방2", "베란다", "창호", "보일러/설비", "계량기 검침"],
  commercial: ["출입구", "바닥", "벽", "천장", "전기", "수도", "간판", "시설물"],
};

export const CONDITIONS = [
  { key: "good", label: "양호", chip: "chip-success" },
  { key: "worn", label: "사용감", chip: "chip-warn" },
  { key: "damaged", label: "파손", chip: "chip-danger" },
];
const RANK = { good: 0, worn: 1, damaged: 2 };
export const conditionLabel = (c) => CONDITIONS.find(x => x.key === c)?.label || "미기록";

export function templateFor(tenant) {
  const areas = tenant?.pType === "상가" ? AREA_TEMPLATES.commercial : AREA_TEMPLATES.residential;
  return areas.map(area => ({ area, condition: "good", note: "", photos: [] }));
}

/** 가장 최근 퇴실 기록과, 그 날짜 이전(같은 날 포함)의 가장 최근 입주 기록 한 쌍 (없으면 null) */
export function latestPair(records) {
  const latest = (kind, until) => (records || [])
    .filter(r => r.kind === kind && (!until || String(r.inspected_on || "") <= until))
    .sort((a, b) => String(b.inspected_on || "").localeCompare(String(a.inspected_on || "")) || String(b.created_at || "").localeCompare(String(a.created_at || "")))[0] || null;
  const moveOut = latest("move_out");
  return { moveIn: latest("move_in", moveOut?.inspected_on), moveOut };
}

const norm = (s) => String(s || "").trim();

/**
 * 공간 이름으로 입주·퇴실 항목을 맞춰 나란히 놓는다 (입주 순서 → 퇴실에만 있는 공간).
 * worsened: 양쪽 모두 기록이 있고 퇴실 상태가 입주보다 나쁠 때만 true.
 * 한쪽에만 있는 공간은 비교 근거가 없으므로 worsened=false, missing 으로 표시.
 */
export function compareInspections(moveIn, moveOut) {
  const a = Array.isArray(moveIn?.items) ? moveIn.items : [];
  const b = Array.isArray(moveOut?.items) ? moveOut.items : [];
  const order = [];
  for (const it of [...a, ...b]) { const k = norm(it.area); if (k && !order.includes(k)) order.push(k); }
  return order.map(area => {
    const before = a.find(x => norm(x.area) === area) || null;
    const after = b.find(x => norm(x.area) === area) || null;
    const rb = before ? RANK[before.condition] : undefined;
    const ra = after ? RANK[after.condition] : undefined;
    const worsened = rb !== undefined && ra !== undefined && ra > rb;
    return { area, before, after, worsened, missing: !before ? "move_in" : !after ? "move_out" : null };
  });
}

export const worsenedItems = (moveIn, moveOut) => compareInspections(moveIn, moveOut).filter(r => r.worsened);
