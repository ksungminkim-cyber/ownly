"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { toast } from "./shared";
import { seedSampleData, removeSampleData, isSampleTenant } from "../lib/sampleData";
import { track } from "../lib/track";
import { isRegulatedAddr } from "../lib/policies";
import { PREFILL_ADDR_KEY, PREFILL_PROPERTY_KEY } from "../lib/constants";

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
  const [lease, setLease] = useState("월세"); // 월세 | 전세 — 전세 임대인도 첫 화면에서 바로 등록
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const resultRef = useRef(null);
  const amountRef = useRef(null);

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
    let market = null, sigunguName = null, failed = false, place = "", source = "";
    try {
      const geoRes = await fetch("/api/geocode", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: target }),
      });
      const geo = await geoRes.json();
      if (geo?.sigunguCode) {
        sigunguName = geo.sigunguName || null;
        source = geo.source || "";
        // 단지·건물 이름으로 찾았거나 주소를 줄여서 찾은 경우, 어디로 인식했는지 보여줘 사용자가 확인할 수 있게 한다
        place = [geo.placeName, [geo.sidoName, geo.sigunguName, geo.dongName].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
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
    setChecked({ market, sigunguName, regulated: isRegulatedAddr(target), failed, place });
    // 인식 실패·시세 없음이 등록 포기로 이어지는지 보기 위한 계측 (2026-11-13)
    track("onboard_check_result", { ok: !failed, market: !!market, source });
    // 결과 아래 금액 칸이 화면 밖(특히 모바일)에 있으면 "눌렀는데 아무 일도 없다"로 보여 같은 버튼을 반복해 누른다
    setTimeout(() => {
      try {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        amountRef.current?.focus({ preventScroll: true });
      } catch {}
    }, 80);
    setChecking(false);
  };

  // ── ② 물건 저장 ──
  const saveProperty = async () => {
    if (lease === "월세" && (!rent || Number(rent) <= 0)) { toast("월세를 입력해주세요", "error"); return; }
    if (lease === "전세" && (!deposit || Number(deposit) <= 0)) { toast("전세 보증금을 입력해주세요", "error"); return; }
    setSaving(true);
    try {
      const today = new Date();
      const nextYear = new Date(); nextYear.setFullYear(today.getFullYear() + 1);
      await addTenant({
        name: name.trim() || "미등록",
        phone: "",
        pType: "주거", sub: "아파트",
        addr: addr.trim(),
        dep: lease === "전세" ? Number(deposit) : 0,
        rent: lease === "전세" ? 0 : Number(rent),
        start_date: null, /* 계약일 미입력 — 오늘 날짜를 넣으면 전월세신고 기한 경고가 잘못 뜬다 */
        end_date: nextYear.toISOString().slice(0, 10),
        status: "정상",
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        intent: "미확인",
        maintenance: 0, pay_day: 5,
        biz: null, contacts: [], area_pyeong: null, building_id: null,
      });
      // property_added 는 AppContext.addTenant 가 이미 기록함 — 여기서 다시 쏘면 활성화율이 2배로 집계됨
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

  // /diagnose 무료 진단에서 입력한 주소가 있으면 이어받아 바로 시세 조회 (1회 소비)
  useEffect(() => {
    let prefill = null;
    try { prefill = localStorage.getItem(PREFILL_ADDR_KEY); if (prefill) localStorage.removeItem(PREFILL_ADDR_KEY); } catch {}
    // 계약서 생성기에서 작성한 계약(주소·월세·보증금·세입자 이름)이 있으면 그대로 채워 버튼 한 번으로 등록되게 한다 (1회 소비)
    let prop = null;
    try {
      prop = JSON.parse(localStorage.getItem(PREFILL_PROPERTY_KEY) || "null");
      if (prop) localStorage.removeItem(PREFILL_PROPERTY_KEY);
    } catch {}
    if (prop?.addr) prefill = String(prop.addr);
    if (!prefill) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setAddr(prefill);
      if (prop) {
        const r = String(prop.rent || "").replace(/[^0-9]/g, ""), d = String(prop.deposit || "").replace(/[^0-9]/g, "");
        if (Number(r) > 0) { setLease("월세"); setRent(r); }
        else if (Number(d) > 0) { setLease("전세"); setDeposit(d); }
        if (prop.name) setName(String(prop.name).slice(0, 30));
        track("onboard_prefill", { from: "contract" });
      }
      checkAddress(prefill);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 첫 화면 이탈 분석 계측 (2026-09-30): 노출 → 머문 시간(30초·2분) → 주소 입력 시작 → 선택지 클릭(onboard_option)
  const focusedRef = useRef(false);
  useEffect(() => {
    track("onboard_view");
    const t1 = setTimeout(() => track("onboard_dwell", { seconds: 30 }), 30_000);
    const t2 = setTimeout(() => track("onboard_dwell", { seconds: 120 }), 120_000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const onAddrFocus = () => {
    if (!focusedRef.current) { focusedRef.current = true; track("onboard_addr_focus"); }
    if (suggestions.length > 0) setShowDrop(true);
  };

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13.5, color: "var(--text)", background: "#fff", outline: "none", boxSizing: "border-box" };
  const m = checked?.market;

  return (
    <div className="card-in" style={{ position: "relative", overflow: "visible", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "26px 22px", marginBottom: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", marginBottom: 5 }}>주소와 월세, 두 칸이면 등록이 끝납니다</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
          주소를 넣으면 주변 실거래 시세를 먼저 보여드립니다. 아파트·건물 이름이나 동 이름만 적어도 됩니다. 등록하면 미납·계약 만료를 온리가 대신 챙깁니다.
        </p>
      </div>

      {/* ① 주소 입력 */}
      <div style={{ position: "relative", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", position: "relative" }}>
          <input value={addr} onChange={onAddrChange}
            onKeyDown={(e) => { if (e.key === "Enter") checkAddress(); if (e.key === "Escape") setShowDrop(false); }}
            onFocus={onAddrFocus}
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
          {checking ? "확인 중..." : checked ? "다시 확인" : "다음 →"}
        </button>
      </div>

      {/* ② 즉시 가치: 시세 + 정책 */}
      {checked && (
        <div ref={resultRef} className="card-in" style={{ marginTop: 14, scrollMarginTop: 80 }}>
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
            {checked.place && !checked.failed && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>
                인식한 위치 <b style={{ color: "var(--text)" }}>{checked.place}</b>
              </p>
            )}
            {m ? (
              <>
                <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
                  {checked.sigunguName || "이 지역"} 최근 3개월 실거래 (국토부)
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
                  ? "입력하신 주소 그대로 등록됩니다. 주변 시세는 지역을 찾지 못해 이번에는 건너뜁니다 (구·동 이름을 넣으면 시세도 함께 보입니다)."
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
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {["월세", "전세"].map((v) => (
                  <button key={v} type="button" onClick={() => setLease(v)} className={`chip${lease === v ? " is-active" : ""}`}>{v}</button>
                ))}
              </div>
              {lease === "월세"
                ? <input value={rent} onChange={(e) => setRent(e.target.value.replace(/[^0-9]/g, ""))} placeholder="월세 (만원) *" inputMode="numeric" ref={amountRef} onKeyDown={(e) => { if (e.key === "Enter") saveProperty(); }} style={{ ...inputStyle, flex: "1 1 110px", width: "auto" }} />
                : <input value={deposit} onChange={(e) => setDeposit(e.target.value.replace(/[^0-9]/g, ""))} placeholder="전세 보증금 (만원) *" inputMode="numeric" ref={amountRef} onKeyDown={(e) => { if (e.key === "Enter") saveProperty(); }} style={{ ...inputStyle, flex: "1 1 130px", width: "auto" }} />}
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="세입자 이름 (선택)" style={{ ...inputStyle, flex: "1 1 130px", width: "auto" }} />
              <button onClick={saveProperty} disabled={saving} className="btn btn-fill" style={{ flexShrink: 0, opacity: saving ? 0.7 : 1 }}>
                {saving ? "저장 중..." : "이 주소로 물건 등록 →"}
              </button>
            </div>
            <button onClick={() => router.push("/dashboard/properties")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 11.5, cursor: "pointer", textDecoration: "underline", padding: 0, marginTop: 10 }}>
              보증금·계약기간·상가까지 상세 입력하기
            </button>
          </div>
        </div>
      )}
      {/* 다른 시작 방법 — 주소 입력 외 선택지를 같은 무게로 노출 (예전엔 작은 텍스트 링크라 눈에 띄지 않았다) */}
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "16px 0 8px" }}>또는 다른 방법으로 시작하기</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
        {[
          { key: "scan", icon: "📷", label: "계약서 사진으로", sub: "찍으면 AI 가 채워요", onClick: () => router.push("/dashboard/properties?scan=1") },
          { key: "bulk", icon: "📥", label: "엑셀로 여러 개", sub: "물건이 많다면", onClick: () => router.push("/dashboard/properties?bulk=1") },
          { key: "sample", icon: "👀", label: seeding ? "샘플 채우는 중..." : "샘플로 구경하기", sub: "언제든 한 번에 삭제", onClick: trySample, disabled: seeding },
        ].map((o) => (
          <button key={o.key} disabled={o.disabled} onClick={() => { track("onboard_option", { option: o.key }); o.onClick(); }}
            className="surface-card interactive" style={{ textAlign: "left", padding: "12px 14px", cursor: o.disabled ? "wait" : "pointer", border: "1px solid var(--border)", background: "#fff", opacity: o.disabled ? 0.7 : 1 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{o.icon} {o.label}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{o.sub}</span>
          </button>
        ))}
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
