import { supabase } from "./supabase";

/**
 * 샘플 데이터 체험 — 신규 가입자가 빈 대시보드 대신
 * 채워진 화면(차트·위젯·알림 배너)을 즉시 경험하도록 예시 물건을 시딩합니다.
 * 주소에 [샘플] 접두어를 붙여 실제 데이터와 구분하고, 한 번에 삭제할 수 있습니다.
 */
export const SAMPLE_PREFIX = "[샘플]";

export function isSampleTenant(t) {
  return (t?.addr || "").includes(SAMPLE_PREFIX) || (t?.name || "").includes(SAMPLE_PREFIX);
}

const iso = (d) => d.toISOString().slice(0, 10);
const daysFromNow = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d; };

export async function seedSampleData({ addTenant, upsertPayment }) {
  const today = new Date();

  // 물건 2개: 정상 납부 아파트 + 미납·만료임박 상가 → 미납/만료 배너·리스크 위젯까지 모두 활성화
  const samples = [
    { name: "김민준", pType: "주거", sub: "아파트", addr: `${SAMPLE_PREFIX} 행복래미안 304호`, rent: 120, dep: 5000, end: iso(daysFromNow(300)), status: "정상", color: "#6366f1" },
    { name: "이서연(카페)", pType: "상가", sub: "1층 상가", addr: `${SAMPLE_PREFIX} 중앙로 1층 카페`, rent: 180, dep: 3000, end: iso(daysFromNow(45)), status: "미납", color: "#0fa573" },
  ];

  const created = [];
  for (const s of samples) {
    const t = await addTenant({
      name: s.name, phone: "", pType: s.pType, sub: s.sub, addr: s.addr,
      dep: s.dep, rent: s.rent,
      start_date: iso(daysFromNow(-330)), end_date: s.end,
      status: s.status, color: s.color, intent: "미확인",
      maintenance: 0, pay_day: 5,
      biz: null, contacts: [], area_pyeong: null, building_id: null,
    });
    created.push({ ...t, _sampleStatus: s.status });
  }

  // 최근 6개월 납부 이력 (미납 물건은 이번 달을 비워 미납 상태 유지)
  for (const t of created) {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 5);
      if (i === 0 && t._sampleStatus === "미납") continue;
      await upsertPayment({
        tid: t.id,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        status: "paid",
        paid: iso(d),
        amt: t.rent,
      });
    }
  }
  return created.length;
}

export async function removeSampleData({ tenants, refreshData }) {
  const ids = (tenants || []).filter(isSampleTenant).map((t) => t.id);
  if (!ids.length) return 0;
  // 자동 생성된 장부·납부·계약 기록부터 정리 후 물건 삭제
  await supabase.from("ledger").delete().in("tenant_id", ids);
  await supabase.from("payments").delete().in("tenant_id", ids);
  await supabase.from("contracts").delete().in("tenant_id", ids);
  const { error } = await supabase.from("tenants").delete().in("id", ids);
  if (error) throw error;
  if (refreshData) await refreshData();
  return ids.length;
}
