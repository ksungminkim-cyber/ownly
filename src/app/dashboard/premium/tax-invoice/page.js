"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { toast } from "../../../../components/shared";

const C = {
  navy:"#1a2744", purple:"#5b4fcf", emerald:"#0fa573",
  rose:"#e8445a", amber:"#e8960a",
  surface:"var(--surface)", border:"var(--border)",
  muted:"var(--text-muted)", faint:"var(--surface2)",
};

const PARTNERS = [
  {
    id: 1,
    name: "세무법인 온택스",
    spec: "임대사업자 전문",
    rating: 4.9,
    reviews: 124,
    fee: 3000,
    desc: "임대소득 신고 전문. 부동산 임대 세금계산서 당일 발행 가능.",
    tags: ["당일 발행", "임대 전문", "법인·개인 모두"],
    avatar: "🏛️",
    available: true,
  },
  {
    id: 2,
    name: "세무사 김재호",
    spec: "소규모 임대인 전문",
    rating: 4.8,
    reviews: 87,
    fee: 2500,
    desc: "1~5채 소규모 임대인 전담. 친절한 상담과 빠른 처리.",
    tags: ["소규모 전문", "친절 상담", "저렴한 수수료"],
    avatar: "👨‍💼",
    available: true,
  },
  {
    id: 3,
    name: "세무법인 택스플러스",
    spec: "상가·법인 임대 전문",
    rating: 4.7,
    reviews: 203,
    fee: 4000,
    desc: "상가·오피스 임대 특화. 부가세 신고 통합 처리 가능.",
    tags: ["상가 전문", "부가세 통합", "법인 처리"],
    avatar: "🏢",
    available: true,
  },
];

const ISSUE_TYPES = [
  { key: "rent", label: "월세 세금계산서", desc: "월세에 대한 정기 세금계산서", icon: "🏠" },
  { key: "mgt", label: "관리비 세금계산서", desc: "관리비에 대한 세금계산서", icon: "🔧" },
  { key: "deposit", label: "보증금 반환 영수증", desc: "보증금 반환 관련 서류", icon: "💰" },
  { key: "contract", label: "임대차 계약 관련", desc: "기타 임대 관련 세무 서류", icon: "📝" },
];

export default function TaxInvoicePage() {
  const router = useRouter();
  const { tenants, userPlan } = useApp();
  const [tab, setTab] = useState("issue"); // issue | history | guide
  const [step, setStep] = useState(1); // 1: 발행정보 2: 세무사선택 3: 확인
  const [issueType, setIssueType] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [memo, setMemo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // 폼 필드
  const [supplyAmt, setSupplyAmt] = useState("");
  const [taxAmt, setTaxAmt] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 7));
  const [bizNo, setBizNo] = useState("");

  const now = new Date();
  const isPro = userPlan === "pro";

  // 상가 세입자만 필터 (세금계산서 대상)
  const commercialTenants = tenants.filter(t => t.pType === "상가");

  const handleSupplyChange = (v) => {
    const num = v.replace(/\D/g, "");
    setSupplyAmt(num);
    setTaxAmt(Math.round(Number(num) * 0.1).toString());
  };

  const handleSubmit = () => {
    if (!issueType) { toast("발행 유형을 선택해주세요.", "error"); return; }
    if (!selectedPartner) { toast("세무사를 선택해주세요.", "error"); return; }
    if (!supplyAmt) { toast("공급가액을 입력해주세요.", "error"); return; }
    setSubmitted(true);
    toast("세금계산서 발행 신청이 완료됐습니다! 담당 세무사가 1시간 내 연락드립니다.", "success");
  };

  // 플랜 게이팅
  if (!isPro) {
    return (
      <div className="page-in page-padding" style={{ maxWidth: 680, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
          ← 대시보드로
        </button>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🔒</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>PRO 플랜 전용 기능</h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
            세금계산서 발행 대행은 PRO 플랜에서 이용 가능합니다.<br />
            제휴 세무사를 통해 건당 2,500~4,000원에 발행 대행을 신청할 수 있어요.
          </p>
          <button onClick={() => router.push("/dashboard/pricing")}
            style={{ padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg,#c9920a,#e8960a)", color: "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            PRO 플랜 업그레이드 →
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const partner = PARTNERS.find(p => p.id === selectedPartner);
    const tenant = tenants.find(t => t.id === selectedTenant);
    return (
      <div className="page-in page-padding" style={{ maxWidth: 680, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(15,165,115,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 20px" }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>신청 완료!</h2>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 28 }}>
            <strong style={{ color: "var(--text)" }}>{partner?.name}</strong>에 세금계산서 발행을 신청했습니다.<br />
            담당 세무사가 <strong style={{ color: C.emerald }}>1시간 내</strong> 연락드립니다.
          </p>

          {/* 신청 요약 */}
          <div style={{ background: C.faint, borderRadius: 16, padding: "20px", textAlign: "left", marginBottom: 24, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "1px", marginBottom: 12 }}>신청 내역</p>
            {[
              ["발행 유형", ISSUE_TYPES.find(t => t.key === issueType)?.label],
              ["세입자", tenant?.name || "직접 입력"],
              ["공급가액", `${Number(supplyAmt).toLocaleString()}원`],
              ["부가세(10%)", `${Number(taxAmt).toLocaleString()}원`],
              ["합계", `${(Number(supplyAmt) + Number(taxAmt)).toLocaleString()}원`],
              ["발행 연월", issueDate],
              ["담당 세무사", partner?.name],
              ["수수료", `${partner?.fee.toLocaleString()}원`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: C.muted }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => { setSubmitted(false); setStep(1); setIssueType(null); setSelectedTenant(null); setSelectedPartner(null); setSupplyAmt(""); setTaxAmt(""); setMemo(""); }}
              style={{ padding: "12px 24px", borderRadius: 11, background: C.faint, border: `1px solid ${C.border}`, color: "var(--text)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              새 신청하기
            </button>
            <button onClick={() => setTab("history")}
              style={{ padding: "12px 24px", borderRadius: 11, background: C.navy, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              발행 이력 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-in page-padding" style={{ maxWidth: 720, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        ← 대시보드로
      </button>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🧾</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.4px" }}>세금계산서 발행 대행</h1>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.amber, background: "rgba(201,146,10,0.12)", padding: "3px 8px", borderRadius: 6 }}>PRO</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>제휴 세무사가 대신 발행 — 건당 2,500~4,000원</p>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { key: "issue", label: "📋 발행 신청", },
          { key: "history", label: "📂 발행 이력" },
          { key: "guide", label: "❓ 이용 안내" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1px solid ${tab === t.key ? C.navy : C.border}`, background: tab === t.key ? C.navy : "transparent", color: tab === t.key ? "#fff" : C.muted }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── 발행 신청 탭 ─── */}
      {tab === "issue" && (
        <div>
          {/* 스텝 인디케이터 */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
            {["발행 정보", "세무사 선택", "최종 확인"].map((label, i) => {
              const num = i + 1;
              const done = step > num;
              const active = step === num;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, background: done ? C.emerald : active ? C.navy : C.border, color: done || active ? "#fff" : C.muted, flexShrink: 0 }}>
                      {done ? "✓" : num}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "var(--text)" : C.muted, whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: done ? C.emerald : C.border, margin: "0 12px" }} />}
                </div>
              );
            })}
          </div>

          {/* STEP 1: 발행 정보 */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 발행 유형 */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>발행 유형 선택</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                  {ISSUE_TYPES.map(t => (
                    <div key={t.key} onClick={() => setIssueType(t.key)}
                      style={{ padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${issueType === t.key ? C.navy : C.border}`, background: issueType === t.key ? "rgba(26,39,68,0.04)" : C.surface, cursor: "pointer" }}>
                      <span style={{ fontSize: 22, marginBottom: 6, display: "block" }}>{t.icon}</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{t.label}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 세입자 선택 */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>세입자 선택 (선택)</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {commercialTenants.length > 0 ? commercialTenants.map(t => (
                    <div key={t.id} onClick={() => {
                      setSelectedTenant(t.id);
                      setSupplyAmt(String((t.rent || 0) * 10000));
                      setTaxAmt(String(Math.round((t.rent || 0) * 10000 * 0.1)));
                      setBizNo(t.bizNo || "");
                    }}
                      style={{ padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${selectedTenant === t.id ? C.navy : C.border}`, background: selectedTenant === t.id ? "rgba(26,39,68,0.04)" : C.faint, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{t.name}</p>
                        <p style={{ fontSize: 12, color: C.muted }}>{t.sub} · {t.addr}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{(t.rent || 0).toLocaleString()}만원/월</p>
                        {t.biz && <p style={{ fontSize: 11, color: C.muted }}>{t.biz}</p>}
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: "20px", textAlign: "center", background: C.faint, borderRadius: 12, color: C.muted, fontSize: 13 }}>
                      등록된 상가 세입자가 없습니다. 직접 정보를 입력해주세요.
                    </div>
                  )}
                </div>
              </div>

              {/* 발행 정보 입력 */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>발행 정보</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "발행 연월", type: "month", value: issueDate, setter: setIssueDate },
                  ].map(({ label, type, value, setter }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, width: 100, flexShrink: 0 }}>{label}</label>
                      <input type={type} value={value} onChange={e => setter(e.target.value)}
                        style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: "var(--text)", outline: "none", background: C.faint }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, width: 100, flexShrink: 0 }}>공급가액 (원)</label>
                    <input type="text" value={Number(supplyAmt).toLocaleString() || ""} onChange={e => handleSupplyChange(e.target.value.replace(/,/g, ""))} placeholder="예: 1,100,000"
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: "var(--text)", outline: "none", background: C.faint }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, width: 100, flexShrink: 0 }}>부가세 (10%)</label>
                    <input type="text" value={Number(taxAmt).toLocaleString() || ""} readOnly
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: C.muted, background: "rgba(0,0,0,0.03)" }} />
                  </div>
                  {supplyAmt && (
                    <div style={{ background: "rgba(15,165,115,0.06)", border: "1px solid rgba(15,165,115,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>합계 (공급가 + 부가세)</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: C.emerald }}>{(Number(supplyAmt) + Number(taxAmt)).toLocaleString()}원</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, width: 100, flexShrink: 0 }}>사업자번호</label>
                    <input type="text" value={bizNo} onChange={e => setBizNo(e.target.value)} placeholder="000-00-00000 (세입자)"
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: "var(--text)", outline: "none", background: C.faint }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, width: 100, flexShrink: 0, paddingTop: 10 }}>메모</label>
                    <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="세무사에게 전달할 내용 (선택)"
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: "var(--text)", outline: "none", background: C.faint, resize: "none", minHeight: 72 }} />
                  </div>
                </div>
              </div>

              <button onClick={() => {
                if (!issueType) { toast("발행 유형을 선택해주세요.", "error"); return; }
                if (!supplyAmt) { toast("공급가액을 입력해주세요.", "error"); return; }
                setStep(2);
              }} style={{ width: "100%", padding: "14px", borderRadius: 12, background: `linear-gradient(135deg,${C.navy},#2d4270)`, color: "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                다음 — 세무사 선택 →
              </button>
            </div>
          )}

          {/* STEP 2: 세무사 선택 */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>제휴 세무사 중 원하는 세무사를 선택하세요. 선택 후 1시간 내 연락드립니다.</p>

              {PARTNERS.map(p => (
                <div key={p.id} onClick={() => setSelectedPartner(p.id)}
                  style={{ padding: "18px 20px", borderRadius: 16, border: `1.5px solid ${selectedPartner === p.id ? C.navy : C.border}`, background: selectedPartner === p.id ? "rgba(26,39,68,0.04)" : C.surface, cursor: "pointer", position: "relative" }}>
                  {selectedPartner === p.id && (
                    <div style={{ position: "absolute", top: 14, right: 14, width: 22, height: 22, borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(26,39,68,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{p.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{p.name}</p>
                        <span style={{ fontSize: 11, color: C.amber, fontWeight: 700, background: "rgba(232,150,10,0.1)", padding: "2px 7px", borderRadius: 6 }}>{p.spec}</span>
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.6 }}>{p.desc}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                        {p.tags.map(tag => (
                          <span key={tag} style={{ fontSize: 11, color: C.purple, background: "rgba(91,79,207,0.08)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{tag}</span>
                        ))}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 13 }}>⭐</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.rating}</span>
                          <span style={{ fontSize: 12, color: C.muted }}>({p.reviews}건)</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: 16, fontWeight: 900, color: C.navy }}>₩{p.fee.toLocaleString()}</p>
                          <p style={{ fontSize: 11, color: C.muted }}>건당 수수료</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "13px", borderRadius: 12, background: C.faint, border: `1px solid ${C.border}`, color: "var(--text)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  ← 이전
                </button>
                <button onClick={() => {
                  if (!selectedPartner) { toast("세무사를 선택해주세요.", "error"); return; }
                  setStep(3);
                }} style={{ flex: 2, padding: "13px", borderRadius: 12, background: `linear-gradient(135deg,${C.navy},#2d4270)`, color: "#fff", border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                  다음 — 최종 확인 →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 최종 확인 */}
          {step === 3 && (() => {
            const partner = PARTNERS.find(p => p.id === selectedPartner);
            const tenant = tenants.find(t => t.id === selectedTenant);
            const issueLabel = ISSUE_TYPES.find(t => t.key === issueType)?.label;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* 신청 요약 */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: C.muted, letterSpacing: "1px", marginBottom: 14 }}>신청 내역 확인</p>
                  {[
                    ["발행 유형", issueLabel],
                    ["세입자", tenant?.name || "직접 입력"],
                    ["발행 연월", issueDate],
                    ["공급가액", `${Number(supplyAmt).toLocaleString()}원`],
                    ["부가세(10%)", `${Number(taxAmt).toLocaleString()}원`],
                    ["합계", `${(Number(supplyAmt) + Number(taxAmt)).toLocaleString()}원`],
                    ...(bizNo ? [["사업자번호", bizNo]] : []),
                    ...(memo ? [["메모", memo]] : []),
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 13, color: C.muted }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* 세무사 요약 */}
                <div style={{ background: "rgba(26,39,68,0.04)", border: `1px solid rgba(26,39,68,0.12)`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 32 }}>{partner?.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{partner?.name}</p>
                    <p style={{ fontSize: 12, color: C.muted }}>{partner?.spec} · ⭐ {partner?.rating}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 17, fontWeight: 900, color: C.navy }}>₩{partner?.fee.toLocaleString()}</p>
                    <p style={{ fontSize: 11, color: C.muted }}>수수료</p>
                  </div>
                </div>

                {/* 안내 */}
                <div style={{ background: "rgba(254,229,0,0.08)", border: "1px solid rgba(254,229,0,0.4)", borderRadius: 12, padding: "12px 16px" }}>
                  <p style={{ fontSize: 12, color: "#b8a000", fontWeight: 700, marginBottom: 4 }}>💡 신청 후 처리 과정</p>
                  <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
                    ① 신청 완료 → ② 세무사 배정 (즉시) → ③ 1시간 내 연락<br />
                    ④ 추가 서류 확인 → ⑤ 세금계산서 발행 → ⑥ 발행 완료 알림
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep(2)} style={{ flex: 1, padding: "13px", borderRadius: 12, background: C.faint, border: `1px solid ${C.border}`, color: "var(--text)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    ← 이전
                  </button>
                  <button onClick={handleSubmit}
                    style={{ flex: 2, padding: "13px", borderRadius: 12, background: "linear-gradient(135deg,#0fa573,#0d8a61)", color: "#fff", border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 16px rgba(15,165,115,0.3)" }}>
                    ✅ 발행 신청 완료
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── 발행 이력 탭 ─── */}
      {tab === "history" && (
        <div>
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>📂</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>발행 이력이 없습니다</p>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>첫 세금계산서 발행을 신청해보세요</p>
            <button onClick={() => setTab("issue")}
              style={{ padding: "11px 24px", borderRadius: 11, background: C.navy, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              발행 신청하기
            </button>
          </div>
        </div>
      )}

      {/* ─── 이용 안내 탭 ─── */}
      {tab === "guide" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { icon: "🧾", title: "세금계산서 발행 대행이란?", body: "임대인이 직접 홈택스에 접속하지 않아도 제휴 세무사가 대신 세금계산서를 발행해드리는 서비스입니다. 상가 임대인의 경우 월세에 부가세(10%)가 포함되며, 세금계산서를 발행해야 세입자가 매입세액 공제를 받을 수 있습니다." },
            { icon: "💰", title: "수수료는 얼마인가요?", body: "세무사에 따라 건당 2,500원~4,000원입니다. 신청 시 확인하신 금액이 발행 완료 후 청구됩니다. 월 정기 발행 계약 시 세무사와 별도 협의로 단가를 낮출 수 있습니다." },
            { icon: "⚡", title: "얼마나 빨리 처리되나요?", body: "신청 후 1시간 내 담당 세무사가 연락드립니다. 추가 서류가 필요 없는 경우 당일 발행이 가능합니다. 복잡한 건은 1~2 영업일 내 처리됩니다." },
            { icon: "📋", title: "어떤 서류가 필요한가요?", body: "① 세입자 사업자등록번호 ② 임대인 사업자등록번호 또는 주민등록번호 ③ 공급가액(월세) ④ 발행 연월. 온리에 이미 등록된 세입자 정보가 있으면 자동으로 채워집니다." },
            { icon: "⚠️", title: "주의사항", body: "세금계산서는 법적 문서입니다. 공급가액, 사업자번호 등 정보가 정확해야 합니다. 오류 발생 시 수정 세금계산서 발행이 필요하며 추가 수수료가 발생할 수 있습니다." },
          ].map((item, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{item.title}</p>
              </div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>{item.body}</p>
            </div>
          ))}

          <div style={{ background: "rgba(26,39,68,0.04)", borderRadius: 14, padding: "16px 20px", marginTop: 4 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>문의하기</p>
            <p style={{ fontSize: 12, color: C.muted }}>세금계산서 관련 궁금한 점은 <strong>inquiry@mclean21.com</strong> 으로 문의해주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
}
