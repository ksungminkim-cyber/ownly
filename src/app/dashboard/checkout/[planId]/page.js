"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PLANS } from "../../../../lib/constants";
import { useApp } from "../../../../context/AppContext";
import { toast } from "../../../../components/shared";

// 카카오페이/네이버페이 통합용 체크아웃 페이지
// PG사 심사 요건 충족: 진행 단계, 결제 약관, 자동갱신·해지 안내, 사업자 정보, 안전결제 배지

const PG_OPTIONS = [
  { id: "kakao", label: "카카오페이", icon: "💛", desc: "카카오톡 간편결제 (정기결제 자동 갱신)", color: "#fee500", textColor: "#3c1e1e", available: false },
  { id: "naver", label: "네이버페이", icon: "💚", desc: "네이버 간편결제 (정기결제 자동 갱신)", color: "#03c75a", textColor: "#fff", available: false },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { planId } = useParams();
  const { user, userPlan } = useApp();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPg, setSelectedPg] = useState("kakao");
  const [agreed, setAgreed] = useState(false);
  const [agreedRefund, setAgreedRefund] = useState(false);
  const [agreedThirdParty, setAgreedThirdParty] = useState(false); // ★ PG사 결제정보 제3자 제공
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // ★ 쿠폰
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");

  const plan = PLANS[planId];
  const isUpgrade = userPlan && userPlan !== planId && userPlan !== "free";

  useEffect(() => {
    if (user?.user_metadata?.name) setCustomerName(user.user_metadata.name);
    if (user?.user_metadata?.phone) setCustomerPhone(user.user_metadata.phone);
    else if (user?.email) setCustomerName(user.email.split("@")[0]);
  }, [user]);

  if (!plan || plan.id === "free") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#6a6a7a" }}>유효하지 않은 플랜입니다.</p>
        <button onClick={() => router.push("/dashboard/pricing")}
          style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
          요금제로 돌아가기
        </button>
      </div>
    );
  }

  const monthlyPrice = plan.price;
  const annualPrice = Math.round(monthlyPrice * 12 * 0.8);
  const subtotal = billingCycle === "annual" ? annualPrice : monthlyPrice;
  const totalAmount = Math.max(0, subtotal - couponDiscount);
  const periodLabel = billingCycle === "annual" ? "연간 (20% 할인)" : "월간";
  const billingPeriodEnd = (() => {
    const d = new Date();
    if (billingCycle === "annual") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("ko-KR");
  })();

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) { setCouponMsg(""); setCouponDiscount(0); return; }
    // 데모 쿠폰 — 실제 구현 시 서버 검증으로 교체
    const COUPONS = {
      "WELCOME10":  { discount: Math.round(subtotal * 0.10), label: "신규 가입 10% 할인" },
      "FRIEND5000": { discount: 5000, label: "친구 추천 5,000원 할인" },
      "EARLY20":    { discount: Math.round(subtotal * 0.20), label: "얼리버드 20% 할인" },
    };
    if (COUPONS[code]) {
      setCouponDiscount(COUPONS[code].discount);
      setCouponMsg(`✓ ${COUPONS[code].label} 적용됨 (-₩${COUPONS[code].discount.toLocaleString()})`);
    } else {
      setCouponDiscount(0);
      setCouponMsg("✗ 유효하지 않은 쿠폰 코드입니다");
    }
  };

  const allAgreed = agreed && agreedRefund && agreedThirdParty;

  const handlePay = async () => {
    if (!allAgreed) {
      toast("필수 약관 3가지에 모두 동의해주세요", "error");
      return;
    }
    if (!customerName.trim()) { toast("결제자 이름을 입력해주세요", "error"); return; }
    if (!customerPhone.trim()) { toast("연락처를 입력해주세요", "error"); return; }

    setSubmitting(true);
    try {
      if (selectedPg === "kakao") {
        toast("💛 카카오페이 비즈 심사 진행 중입니다. 승인 즉시 활성화됩니다.", "info");
        return;
      }
      if (selectedPg === "naver") {
        toast("💚 네이버페이 비즈 심사 진행 중입니다. 승인 즉시 활성화됩니다.", "info");
        return;
      }
    } catch (e) {
      toast("결제 중 오류: " + (e?.message || "알 수 없는 오류"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 60px", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>

      {/* 브레드크럼 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8a8a9a", marginBottom: 14 }}>
        <Link href="/dashboard/pricing" style={{ color: "#5b4fcf", textDecoration: "none", fontWeight: 600 }}>요금제</Link>
        <span>›</span>
        <span style={{ fontWeight: 700, color: "#1a2744" }}>결제하기</span>
      </div>

      {/* ★ 진행 단계 인디케이터 */}
      <ProgressBar currentStep={2} />

      <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1a2744", marginBottom: 6 }}>
        {plan.emoji} {plan.name} 플랜 {isUpgrade ? "변경" : "구독"}
      </h1>
      <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 24 }}>{plan.tagline}</p>

      {/* ① 결제 주기 */}
      <Section title="① 결제 주기" subtitle="원하는 결제 주기를 선택하세요">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <RadioCard active={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", margin: 0 }}>월간 결제</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", margin: "6px 0 4px" }}>₩{monthlyPrice.toLocaleString()}<span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 600 }}>/월</span></p>
            <p style={{ fontSize: 11, color: "#8a8a9a", margin: 0 }}>매월 자동 결제</p>
          </RadioCard>
          <RadioCard active={billingCycle === "annual"} onClick={() => setBillingCycle("annual")}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", margin: 0 }}>연간 결제</p>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#0fa573", padding: "2px 8px", borderRadius: 20 }}>20% 할인</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", margin: "6px 0 4px" }}>₩{annualPrice.toLocaleString()}<span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 600 }}>/년</span></p>
            <p style={{ fontSize: 11, color: "#0fa573", fontWeight: 600, margin: 0 }}>월 ₩{Math.round(annualPrice / 12).toLocaleString()} (2.4개월 무료)</p>
          </RadioCard>
        </div>
      </Section>

      {/* ② 결제자 정보 */}
      <Section title="② 결제자 정보" subtitle="세금계산서·영수증 발행 시 사용됩니다">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6a6a7a", marginBottom: 6 }}>이름 <span style={{ color: "#e8445a" }}>*</span></label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="홍길동"
              style={{ width: "100%", padding: "11px 13px", fontSize: 14, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6a6a7a", marginBottom: 6 }}>연락처 <span style={{ color: "#e8445a" }}>*</span></label>
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="010-0000-0000"
              style={{ width: "100%", padding: "11px 13px", fontSize: 14, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6a6a7a", marginBottom: 6 }}>이메일</label>
            <input value={user?.email || ""} disabled
              style={{ width: "100%", padding: "11px 13px", fontSize: 14, color: "#8a8a9a", background: "#f0efe9", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
      </Section>

      {/* ③ 결제 수단 */}
      <Section title="③ 결제 수단 선택" subtitle="원하는 결제 수단을 선택하세요">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PG_OPTIONS.map(pg => (
            <PgRadio key={pg.id} pg={pg} active={selectedPg === pg.id} onClick={() => setSelectedPg(pg.id)} />
          ))}
        </div>
      </Section>

      {/* ★ 쿠폰 코드 */}
      <Section title="④ 쿠폰 코드" subtitle="할인 쿠폰을 보유하신 경우 입력하세요 (선택)">
        <div style={{ display: "flex", gap: 8 }}>
          <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="예: WELCOME10"
            style={{ flex: 1, padding: "11px 13px", fontSize: 14, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 9, outline: "none", boxSizing: "border-box", textTransform: "uppercase" }} />
          <button onClick={applyCoupon}
            style={{ padding: "11px 22px", borderRadius: 9, border: "1px solid #5b4fcf", background: "transparent", color: "#5b4fcf", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            적용
          </button>
        </div>
        {couponMsg && (
          <p style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: couponMsg.startsWith("✓") ? "#0fa573" : "#e8445a" }}>{couponMsg}</p>
        )}
      </Section>

      {/* ⑤ 주문 요약 */}
      <Section title="⑤ 주문 요약">
        <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "18px 20px", border: "1px solid #ebe9e3" }}>
          <Row label="플랜" value={`${plan.emoji} ${plan.name}`} />
          <Row label="결제 주기" value={periodLabel} />
          <Row label="다음 결제 예정일" value={billingPeriodEnd} />
          <Row label="결제 수단" value={PG_OPTIONS.find(p => p.id === selectedPg)?.label || ""} />
          <hr style={{ border: "none", borderTop: "1px dashed #d0cfc8", margin: "12px 0" }} />
          <Row label="상품 금액" value={`₩${subtotal.toLocaleString()}`} />
          {couponDiscount > 0 && <Row label="쿠폰 할인" value={`-₩${couponDiscount.toLocaleString()}`} discount />}
          <hr style={{ border: "none", borderTop: "1px dashed #d0cfc8", margin: "12px 0" }} />
          <Row label="결제 금액" value={`₩${totalAmount.toLocaleString()}`} bold />
          <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 6, textAlign: "right" }}>VAT(부가가치세) 포함</p>
        </div>
        {/* ★ 세금계산서 안내 */}
        <div style={{ marginTop: 10, padding: "12px 14px", background: "rgba(91,79,207,0.05)", border: "1px solid rgba(91,79,207,0.15)", borderRadius: 10, fontSize: 11, color: "#5b4fcf", lineHeight: 1.7, fontWeight: 600 }}>
          📄 <b>세금계산서 발행 가능</b> — 결제 완료 후 [설정 → 결제 관리]에서 사업자등록번호 입력 시 즉시 발행. 법인·개인사업자 모두 지원.
        </div>
      </Section>

      {/* ⑥ 약관 동의 */}
      <Section title="⑥ 약관 동의" subtitle="아래 3가지 모두 동의하셔야 결제가 진행됩니다">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <CheckboxLabel checked={agreed} onChange={setAgreed}>
            [필수] <Link href="/legal/terms" target="_blank" style={{ color: "#5b4fcf", textDecoration: "underline" }}>서비스 이용약관</Link> 및 <Link href="/legal/privacy" target="_blank" style={{ color: "#5b4fcf", textDecoration: "underline" }}>개인정보처리방침</Link>에 동의합니다
          </CheckboxLabel>
          <CheckboxLabel checked={agreedRefund} onChange={setAgreedRefund}>
            [필수] 정기결제 자동 갱신 및 환불 정책에 동의합니다
          </CheckboxLabel>
          {/* ★ 신규 — 개인정보 제3자 제공 동의 */}
          <CheckboxLabel checked={agreedThirdParty} onChange={setAgreedThirdParty}>
            [필수] 결제를 위해 결제정보(이름·연락처·결제수단)를 PG사(카카오페이/네이버페이)에 제공하는 것에 동의합니다
          </CheckboxLabel>
        </div>

        {/* ★ 자동결제 해지 방법 안내 박스 */}
        <div style={{ marginTop: 14, padding: "16px 18px", background: "linear-gradient(135deg,rgba(232,150,10,0.06),rgba(15,165,115,0.04))", border: "1px solid rgba(232,150,10,0.25)", borderRadius: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#c9920a", marginBottom: 8 }}>📌 정기결제 해지 방법 (언제든지 가능)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: "#6a6a7a", lineHeight: 1.7 }}>
            <p style={{ margin: 0 }}><b style={{ color: "#1a2744" }}>방법 1.</b> 로그인 → 설정(⚙️) → 결제 관리 → "구독 해지" 버튼</p>
            <p style={{ margin: 0 }}><b style={{ color: "#1a2744" }}>방법 2.</b> 이메일 inquiry@mclean21.com 으로 해지 요청</p>
            <p style={{ margin: 0 }}><b style={{ color: "#1a2744" }}>방법 3.</b> 고객센터 02-334-2211 (평일 10:00~18:00)</p>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#8a8a9a" }}>⏱ 해지 시 다음 결제일 이후 자동 갱신이 중단되며, 현재 결제 기간 종료일까지는 서비스가 유지됩니다.</p>
          </div>
        </div>

        <div style={{ marginTop: 10, padding: "12px 14px", background: "#f8f7f4", borderRadius: 8, fontSize: 11, color: "#8a8a9a", lineHeight: 1.7 }}>
          • 정기결제는 결제 주기마다 자동 갱신됩니다.<br />
          • 결제일로부터 7일 이내, 서비스 미사용 시 전액 환불 가능합니다.<br />
          • 환불 문의: inquiry@mclean21.com (평일 10:00~18:00)
        </div>
      </Section>

      {/* 결제하기 버튼 */}
      <div style={{ marginTop: 24 }}>
        <button onClick={handlePay} disabled={submitting || !allAgreed}
          style={{
            width: "100%", padding: "18px", borderRadius: 14,
            background: submitting || !allAgreed ? "#c0c0cc" : "linear-gradient(135deg, #1a2744, #5b4fcf)",
            color: "#fff", fontSize: 16, fontWeight: 900, border: "none",
            cursor: submitting || !allAgreed ? "not-allowed" : "pointer",
            boxShadow: allAgreed ? "0 8px 32px rgba(91,79,207,0.3)" : "none",
            transition: "all .15s",
          }}>
          {submitting ? "처리 중..." : `₩${totalAmount.toLocaleString()} 결제하기`}
        </button>

        {/* ★ 안전결제 트러스트 배지 */}
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <TrustBadge icon="🔒" label="SSL 256bit 암호화" />
          <TrustBadge icon="🛡️" label="공식 PG 가맹점" />
          <TrustBadge icon="✓" label="개인정보보호법 준수" />
          <TrustBadge icon="💯" label="7일 환불 보장" />
        </div>

        <p style={{ fontSize: 11, color: "#8a8a9a", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
          🔒 모든 결제는 PG사(카카오페이/네이버페이)에서 직접 처리되며,<br />
          (주)맥클린은 카드번호·계좌번호 등 결제 정보를 저장하지 않습니다
        </p>
      </div>

      {/* ★ 사업자 정보 푸터 (체크아웃 페이지 전용) */}
      <div style={{ marginTop: 32, padding: "16px 18px", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 12, fontSize: 11, color: "#6a6a7a", lineHeight: 1.8 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>판매자 정보</p>
        <p style={{ margin: 0 }}><b style={{ color: "#1a2744" }}>(주)맥클린</b> | 대표 김성민 | 사업자등록번호 137-81-52231 ・ <a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1378152231" target="_blank" rel="noopener noreferrer" style={{ color: "#5b4fcf", textDecoration: "underline" }}>사업자정보확인</a></p>
        <p style={{ margin: "3px 0" }}>통신판매업신고 제2026-경기김포-2785호 | 경기도 김포시 양촌읍 유현삭시로241번길 86</p>
        <p style={{ margin: 0 }}>고객센터 02-334-2211 ・ inquiry@mclean21.com (평일 10:00~18:00)</p>
        <hr style={{ border: "none", borderTop: "1px solid #ebe9e3", margin: "10px 0" }} />
        <p style={{ margin: 0, fontSize: 10, color: "#8a8a9a" }}>본 결제는 「전자상거래 등에서의 소비자보호에 관한 법률」 및 PG사 이용약관에 따라 처리됩니다. 결제 분쟁 발생 시 (주)맥클린 고객센터 또는 PG사 고객센터로 연락 주시기 바랍니다.</p>
      </div>
    </div>
  );
}

function ProgressBar({ currentStep }) {
  const steps = [
    { label: "플랜 선택", n: 1 },
    { label: "결제 정보 입력", n: 2 },
    { label: "결제 완료", n: 3 },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24, padding: "0 4px" }}>
      {steps.map((s, i) => {
        const isDone = currentStep > s.n;
        const isCurrent = currentStep === s.n;
        const color = isDone ? "#0fa573" : isCurrent ? "#5b4fcf" : "#d0cfc8";
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 80 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: isCurrent || isDone ? color : "#fff",
                border: `2px solid ${color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isCurrent || isDone ? "#fff" : color,
                fontSize: 12, fontWeight: 900,
              }}>
                {isDone ? "✓" : s.n}
              </div>
              <span style={{ fontSize: 11, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#1a2744" : "#8a8a9a" }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: isDone ? "#0fa573" : "#ebe9e3", margin: "0 4px", marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CheckboxLabel({ checked, onChange, children }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fff", border: `1px solid ${checked ? "#5b4fcf" : "#ebe9e3"}`, borderRadius: 10, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: "#5b4fcf", cursor: "pointer", flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", lineHeight: 1.5 }}>
        {children}
      </span>
    </label>
  );
}

function TrustBadge({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(15,165,115,0.06)", border: "1px solid rgba(15,165,115,0.2)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#0fa573" }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 12 }}>{subtitle}</p>}
      {children}
    </section>
  );
}

function RadioCard({ active, onClick, children }) {
  return (
    <div onClick={onClick}
      style={{
        padding: "16px 18px", borderRadius: 12,
        border: `2px solid ${active ? "#5b4fcf" : "#ebe9e3"}`,
        background: active ? "rgba(91,79,207,0.04)" : "#fff",
        cursor: "pointer", transition: "all .15s",
      }}>
      {children}
    </div>
  );
}

function PgRadio({ pg, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", borderRadius: 11,
        border: `2px solid ${active ? "#5b4fcf" : "#ebe9e3"}`,
        background: active ? "rgba(91,79,207,0.04)" : "#fff",
        cursor: "pointer", transition: "all .15s",
      }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${active ? "#5b4fcf" : "#d0cfc8"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {active && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#5b4fcf" }} />}
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: pg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: pg.textColor, fontWeight: 800, flexShrink: 0 }}>
        {pg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", margin: 0 }}>{pg.label}</p>
        <p style={{ fontSize: 11, color: "#8a8a9a", margin: "2px 0 0", lineHeight: 1.5 }}>{pg.desc}</p>
      </div>
      {!pg.available && (
        <span style={{ fontSize: 10, fontWeight: 800, color: "#e8960a", background: "rgba(232,150,10,0.1)", padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>심사중</span>
      )}
    </div>
  );
}

function Row({ label, value, bold, discount }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ fontSize: bold ? 14 : 13, color: bold ? "#1a2744" : "#6a6a7a", fontWeight: bold ? 800 : 600 }}>{label}</span>
      <span style={{ fontSize: bold ? 18 : 13, color: discount ? "#0fa573" : "#1a2744", fontWeight: bold ? 900 : 700 }}>{value}</span>
    </div>
  );
}
