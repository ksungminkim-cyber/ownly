"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { toast } from "./shared";
import { seedSampleData, removeSampleData, isSampleTenant } from "../lib/sampleData";
import { track } from "../lib/track";
import { isRegulatedAddr } from "../lib/policies";

const COLORS = ["#6366f1", "#0fa573", "#e8960a", "#0d9488", "#5b4fcf"];

/**
 * 신규 가입자 첫 화면 — "주소 → 즉시 가치" 흐름:
 * ① 주소 한 칸 입력 → 주변 시세(국토부 실거래)·규제지역 여부를 그 자리에서 표시
 * ② 마음에 들면 월세만 추가로 입력해 물건으로 저장
 * 입력 1개당 보상 1개 — 등록 전에 등록의 이유를 먼저 보여준다.
 */
export default function OnboardingHero() {
  const router = useRouter();
  const { addTenant, upsertPayment } = useApp();

  const [addr, setAddr] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const timerRef = useRef(null);

  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(null); // { market, sigunguName, regulated, failed }
  const [rent, setRent] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // ── 주소 자동완성 (도로명주소 공개 API) ──
  const searchJuso = async (q) => {
    if (q.length < 3) { setSuggestions([]); setShowDrop(false); return; }
    try {
      const jusoKey = process.env.NEXT_PUBLIC_JUSO_API_KEY || "devU01TX0FVVEgyMDI1MDMxNzE0MjI1NjExNTI5MDc=";
      const url = `https://business.juso.go.kr/addrlink/addrLinkApi.do?currentPage=1&countPerPage=6&keyword=${encodeURIComponent(q)}&confmKey=${jusoKey}&resultType=json`;
      const res = await fetch(url);
      const data = await res.json();
      const results = data?.results?.juso || [];
      setSuggestions(results);
      setShowDrop(results.length > 0);
    } catch { setSuggestions([]); setShowDrop(false); }
  };

  const onAddrChange = (e) => {
    const v = e.target.value;
    setAddr(v);
    setChecked(null);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => searchJuso(v), 350);
  };

  // ── ① 주소 → 시세·정책 즉시 확인 ──
  const checkAddress = async (addrOverride) => {
    const target = (addrOverride ?? addr).trim();
    if (target.length < 2) { toast("주소를 입력해주세요", "error"); return; }
    setShowDrop(false);
    setChecking(true);
    track("onboard_addr_check");
    let market = null, sigunguName = null, failed = false;
    try {
      const geoRes = await fetch("/api/geocode", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: target }),
      });
      const geo = await geoRes.json();
      if (geo?.sigunguCode) {
        sigunguName = geo.sigunguName || null;
        const mRes = await fetch("/api/market/sigungu", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lawdCd: geo.sigunguCode }),
        });
        const m = await mRes.json();
        if (!m.error && !m.empty) market = m;
      } else {
        failed = true;
      }
    } catch { failed = true; }
    setChecked({ market, sigunguName, regulated: isRegulatedAddr(target), failed });
    setChecking(false);
  };

  // ── ② 물건 저장 ──
  const saveProperty = async () => {
    if (!rent || Number(rent) <= 0) { toast("월세를 입력해주세요 (전세는 상세 입력에서)", "error"); return; }
    setSaving(true);
    try {
      const today = new Date();
      const nextYear = new Date(); nextYear.setFullYear(today.getFullYear() + 1);
      await addTenant({
        name: name.trim() || "미등록",
        phone: "",
        pType: "주거", sub: "아파트",
        addr: addr.trim(),
        dep: 0,
        rent: Number(rent),
        start_date: today.toISOString().slice(0, 10),
        end_date: nextYear.toISOString().slice(0, 10),
        status: "정상",
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        intent: "미확인",
        maintenance: 0, pay_day: 5,
        biz: null, contacts: [], area_pyeong: null, building_id: null,
      });
      toast("🎉 등록 완료! 이제 미납·계약 만료·정책 변화를 온리가 대신 지켜봅니다");
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

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13.5, color: "var(--text)", background: "#fff", outline: "none", boxSizing: "border-box" };
  const m = checked?.market;

  return (
    <div className="card-in" style={{ position: "relative", overflow: "visible", background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(91,79,207,0.05))", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "26px 22px", marginBottom: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", marginBottom: 5 }}>주소만 입력하세요 — 나머지는 온리가 지켜봅니다</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
          주변 실거래 시세와 규제지역 여부를 바로 보여드리고, 등록하면 미납·계약 만료·부동산 대책 영향을 대신 챙겨드립니다.
        </p>
      </div>

      {/* ① 주소 입력 */}
      <div style={{ position: "relative", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", position: "relative" }}>
          <input value={addr} onChange={onAddrChange}
            onKeyDown={(e) => { if (e.key === "Enter") checkAddress(); if (e.key === "Escape") setShowDrop(false); }}
            onFocus={() => suggestions.length > 0 && setShowDrop(true)}
            placeholder="물건 주소 (예: 서울 마포구 합정동 123)" autoComplete="off"
            style={{ ...inputStyle, padding: "13px 14px", fontSize: 14 }} />
          {showDrop && suggestions.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200, background: "#fff", border: "1.5px solid rgba(26,39,68,0.15)", borderRadius: 12, boxShadow: "0 8px 32px rgba(26,39,68,0.15)", overflow: "hidden" }}>
              {suggestions.map((juso, i) => (
                <div key={i} onMouseDown={() => { setAddr(juso.roadAddr); setSuggestions([]); setShowDrop(false); checkAddress(juso.roadAddr); }}
                  style={{ padding: "11px 14px", cursor: "pointer", borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(26,39,68,0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", margin: 0 }}>📌 {juso.roadAddr}</p>
                  <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: "2px 0 0" }}>{juso.jibunAddr}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => checkAddress()} disabled={checking} className="btn btn-fill" style={{ flexShrink: 0, opacity: checking ? 0.7 : 1 }}>
          {checking ? "확인 중..." : "시세·정책 바로 보기 →"}
        </button>
      </div>

      {/* ② 즉시 가치: 시세 + 정책 */}
      {checked && (
        <div className="card-in" style={{ marginTop: 14 }}>
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
            {m ? (
              <>
                <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
                  📊 {checked.sigunguName || "이 지역"} 최근 3개월 실거래 (국토부)
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 12 }}>
                  {[
                    ["월세 중위", `${m.rent.medianMonthly}만원`],
                    ["보증금 중위", `${Number(m.rent.medianDeposit || 0).toLocaleString()}만원`],
                    ["거래 건수", `${m.total.rentTx}건`],
                    ["평당 월세", `${m.rent.avgRentPerPy}만원`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px" }}>
                      <p style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 700, marginBottom: 3 }}>{l}</p>
                      <p className="num" style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
                {checked.failed
                  ? "주소에서 지역을 인식하지 못했습니다 — 시·군·구가 들어간 주소로 다시 시도해보세요. 그래도 등록은 바로 가능합니다."
                  : "이 지역의 최근 3개월 실거래 데이터가 부족합니다. 등록해두시면 시세·정책 변화가 잡히는 대로 알려드립니다."}
              </p>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {checked.regulated
                ? <span className="chip chip-danger">🏛️ 규제지역 해당 — 토지거래허가·조정대상지역</span>
                : <span className="chip chip-success">🏛️ 규제지역 아님 (주소 기준 추정)</span>}
              <span className="chip chip-info">등록하면 8·3 세제 등 관련 정책을 매물별로 매칭해드려요</span>
            </div>

            {/* ③ 저장 */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
              <input value={rent} onChange={(e) => setRent(e.target.value.replace(/[^0-9]/g, ""))} placeholder="월세 (만원) *" inputMode="numeric" style={{ ...inputStyle, flex: "1 1 110px", width: "auto" }} />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="세입자 이름 (선택)" style={{ ...inputStyle, flex: "1 1 130px", width: "auto" }} />
              <button onClick={saveProperty} disabled={saving} className="btn btn-fill" style={{ flexShrink: 0, opacity: saving ? 0.7 : 1 }}>
                {saving ? "저장 중..." : "이 주소로 물건 등록 →"}
              </button>
            </div>
            <button onClick={() => router.push("/dashboard/properties")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 11.5, cursor: "pointer", textDecoration: "underline", padding: 0, marginTop: 10 }}>
              보증금·계약기간·전세까지 상세 입력하기
            </button>
          </div>
        </div>
      )}

      {/* 샘플 체험 — 보조 경로 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>아직 입력 없이 둘러보고 싶다면</p>
        <button onClick={trySample} disabled={seeding} className="btn btn-ghost btn-sm" style={{ opacity: seeding ? 0.7 : 1 }}>
          {seeding ? "샘플 채우는 중..." : "👀 샘플 데이터로 구경하기"}
        </button>
        <span style={{ fontSize: 10.5, color: "var(--text-faint)" }}>클릭 한 번으로 언제든 전체 삭제됩니다</span>
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
