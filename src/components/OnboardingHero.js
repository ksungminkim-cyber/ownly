"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { toast } from "./shared";
import { seedSampleData, removeSampleData, isSampleTenant } from "../lib/sampleData";
import { track } from "../lib/track";

const COLORS = ["#6366f1", "#0fa573", "#e8960a", "#0d9488", "#5b4fcf"];

/**
 * 신규 가입자 첫 화면 — 빈 대시보드 대신 두 가지 시작 경로 제공:
 * ① 30초 퀵 등록 (이 자리에서 바로 첫 물건 저장)
 * ② 샘플 데이터 체험 (클릭 한 번으로 채워진 대시보드 구경)
 */
export default function OnboardingHero() {
  const router = useRouter();
  const { addTenant, upsertPayment } = useApp();
  const [quick, setQuick] = useState({ addr: "", rent: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const saveQuick = async () => {
    if (!quick.addr.trim()) { toast("주소를 입력해주세요", "error"); return; }
    if (!quick.rent || Number(quick.rent) <= 0) { toast("월세를 입력해주세요", "error"); return; }
    setSaving(true);
    try {
      const today = new Date();
      const nextYear = new Date(); nextYear.setFullYear(today.getFullYear() + 1);
      await addTenant({
        name: quick.name.trim() || "미등록",
        phone: "",
        pType: "주거", sub: "아파트",
        addr: quick.addr.trim(),
        dep: 0,
        rent: Number(quick.rent),
        start_date: today.toISOString().slice(0, 10),
        end_date: nextYear.toISOString().slice(0, 10),
        status: "정상",
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        intent: "미확인",
        maintenance: 0, pay_day: 5,
        biz: null, contacts: [], area_pyeong: null, building_id: null,
      });
      toast(`🎉 첫 물건 등록 완료! 연간 예상 수입 ${(Number(quick.rent) * 12).toLocaleString()}만원`);
      setQuick({ addr: "", rent: "", name: "" });
    } catch (e) {
      toast("저장 실패: " + (e?.message || "알 수 없는 오류"), "error");
      console.error("[onboardingQuickAdd]", e);
    } finally {
      setSaving(false);
    }
  };

  const trySample = async () => {
    setSeeding(true);
    try {
      await seedSampleData({ addTenant, upsertPayment });
      track("sample_seeded");
      toast("✨ 샘플 물건 2개와 6개월 납부 이력을 채웠어요 — 자유롭게 둘러보세요!");
    } catch (e) {
      toast("샘플 데이터 생성 실패: " + (e?.message || "알 수 없는 오류"), "error");
      console.error("[seedSample]", e);
    } finally {
      setSeeding(false);
    }
  };

  const inputStyle = { width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13, color: "var(--text)", background: "#fff", outline: "none", boxSizing: "border-box" };

  return (
    <div className="card-in" style={{ background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(91,79,207,0.05))", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px 22px", marginBottom: 20 }}>
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>환영합니다 👋 1분 안에 시작해보세요</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>물건을 등록하는 순간 수금 추적·계약 만료 알림·세금 추정이 자동으로 시작됩니다.</p>
      </div>

      <style>{`.onb-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; } @media(max-width:720px){ .onb-grid { grid-template-columns:1fr; } }`}</style>
      <div className="onb-grid">
        {/* ① 30초 퀵 등록 */}
        <div className="surface-card" style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>30초 만에 첫 물건 등록</p>
          </div>
          <input value={quick.addr} onChange={(e) => setQuick(q => ({ ...q, addr: e.target.value }))} placeholder="물건 주소 (예: 행복아파트 304호) *" style={inputStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            <input value={quick.rent} onChange={(e) => setQuick(q => ({ ...q, rent: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="월세 (만원) *" inputMode="numeric" style={inputStyle} />
            <input value={quick.name} onChange={(e) => setQuick(q => ({ ...q, name: e.target.value }))} placeholder="세입자 이름 (선택)" style={inputStyle} />
          </div>
          <button onClick={saveQuick} disabled={saving} className="btn btn-fill" style={{ width: "100%", opacity: saving ? 0.7 : 1 }}>
            {saving ? "저장 중..." : "등록하고 시작하기 →"}
          </button>
          <button onClick={() => router.push("/dashboard/properties")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 11.5, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            보증금·계약기간까지 상세 입력하기
          </button>
        </div>

        {/* ② 샘플 데이터 체험 */}
        <div className="surface-card" style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>👀</span>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>먼저 둘러보고 싶다면</p>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.7, flex: 1 }}>
            예시 물건 2개와 6개월 납부 이력이 채워진 대시보드를 바로 구경해보세요.
            수입 차트·미납 알림·만료 임박 배너가 실제로 어떻게 동작하는지 볼 수 있어요.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="chip chip-success">🏠 정상 납부 아파트</span>
            <span className="chip chip-danger">🏪 미납 상가</span>
          </div>
          <button onClick={trySample} disabled={seeding} className="btn btn-soft" style={{ width: "100%", opacity: seeding ? 0.7 : 1 }}>
            {seeding ? "샘플 채우는 중..." : "샘플 데이터로 둘러보기"}
          </button>
          <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", margin: 0 }}>클릭 한 번으로 언제든 전체 삭제됩니다</p>
        </div>
      </div>
    </div>
  );
}

/** 샘플 데이터 사용 중일 때 표시되는 정리 배너 */
export function SampleBanner() {
  const router = useRouter();
  const { tenants, refreshData } = useApp();
  const [removing, setRemoving] = useState(false);
  const sampleCount = tenants.filter(isSampleTenant).length;
  if (sampleCount === 0) return null;

  const clear = async () => {
    setRemoving(true);
    try {
      await removeSampleData({ tenants, refreshData });
      track("sample_removed");
      toast("🧹 샘플 데이터를 모두 삭제했어요 — 이제 내 물건을 등록해보세요!");
    } catch (e) {
      toast("삭제 실패: " + (e?.message || "알 수 없는 오류"), "error");
      console.error("[removeSample]", e);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "rgba(91,79,207,0.06)", border: "1px dashed rgba(91,79,207,0.35)", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
      <span style={{ fontSize: 16 }}>🧪</span>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", flex: 1, minWidth: 180, margin: 0 }}>
        샘플 데이터 체험 중입니다 <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>— 실제 데이터가 아니에요</span>
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => router.push("/dashboard/properties")} className="btn btn-ghost btn-sm">내 물건 등록</button>
        <button onClick={clear} disabled={removing} className="btn btn-soft btn-sm" style={{ opacity: removing ? 0.7 : 1 }}>
          {removing ? "삭제 중..." : "샘플 전체 삭제"}
        </button>
      </div>
    </div>
  );
}
