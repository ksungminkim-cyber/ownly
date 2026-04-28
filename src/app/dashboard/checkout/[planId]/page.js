"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PLANS } from "../../../../lib/constants";
import { useApp } from "../../../../context/AppContext";
import { toast } from "../../../../components/shared";

// 카카오페이/네이버페이/토스 통합용 통합 체크아웃 페이지
// PG사 심사 요건: 상품 선택 → 정보 입력 → '결제하기' 버튼까지 전 과정 구현 필수

const PG_OPTIONS = [
  { id: "kakao",  label: "카카오페이",   icon: "💛", desc: "카카오톡 간편결제", color: "#fee500", textColor: "#3c1e1e", available: false },
  { id: "naver",  label: "네이버페이",   icon: "💚", desc: "네이버 간편결제", color: "#03c75a", textColor: "#fff", available: false },
  { id: "toss",   label: "신용·체크카드", icon: "💳", desc: "토스페이먼츠 (Visa/Master/JCB)", color: "#3182f6", textColor: "#fff", available: true },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { planId } = useParams();
  const { user, userPlan } = useApp();
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly | annual
  const [selectedPg, setSelectedPg] = useState("kakao");
  const [agreed, setAgreed] = useState(false);
  const [agreedRefund, setAgreedRefund] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

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
  const totalAmount = billingCycle === "annual" ? annualPrice : monthlyPrice;
  const periodLabel = billingCycle === "annual" ? "연간 (20% 할인)" : "월간";
  const billingPeriodEnd = (() => {
    const d = new Date();
    if (billingCycle === "annual") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("ko-KR");
  })();

  const handlePay = async () => {
    if (!agreed || !agreedRefund) {
      toast("이용약관과 환불 정책에 동의해주세요", "error");
      return;
    }
    if (!customerName.trim()) {
      toast("결제자 이름을 입력해주세요", "error");
      return;
    }
    if (!customerPhone.trim()) {
      toast("연락처를 입력해주세요", "error");
      return;
    }

    setSubmitting(true);

    try {
      // PG별 분기 처리
      if (selectedPg === "kakao") {
        // 카카오페이 정기결제 — 비즈센터 심사 통과 후 활성화
        toast("💛 카카오페이 비즈 심사 진행 중입니다. 다른 결제 수단을 이용하시거나 잠시 후 다시 시도해주세요.", "info");
        return;
      }
      if (selectedPg === "naver") {
        toast("💚 네이버페이 비즈 심사 진행 중입니다. 다른 결제 수단을 이용해주세요.", "info");
        return;
      }
      if (selectedPg === "toss") {
        // 토스페이먼츠 빌링 (실제 결제 모듈)
        if (!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY) {
          toast("토스페이먼츠 빌링 심사 진행 중입니다. 결제 모듈 활성화 시 즉시 처리됩니다.", "info");
          return;
        }
        const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
        await tossPayments.requestBillingAuth("카드", {
          customerKey: user.id,
          customerName,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/dashboard/checkout/success?plan=${planId}&cycle=${billingCycle}`,
          failUrl: `${window.location.origin}/dashboard/checkout/fail?plan=${planId}`,
        });
      }
    } catch (e) {
      if (e?.code !== "USER_CANCEL") {
        toast("결제 중 오류: " + (e?.message || "알 수 없는 오류"), "error");
      }
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

      <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1a2744", marginBottom: 6 }}>
        {plan.emoji} {plan.name} 플랜 {isUpgrade ? "변경" : "구독"}
      </h1>
      <p style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 24 }}>{plan.tagline}</p>

      {/* 1. 결제 주기 선택 */}
      <Section title="① 결제 주기" subtitle="원하는 결제 주기를 선택하세요">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <RadioCard active={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", margin: 0 }}>월간 결제</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", margin: "6px 0 4px" }}>₩{monthlyPrice.toLocaleString()}<span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 600 }}>/월</span></p>
            <p style={{ fontSize: 11, color: "#8a8a9a", margin: 0 }}>매월 자동 결제</p>
          </RadioCard>
          <RadioCard active={billingCycle === "annual"} onClick={() => setBillingCycle("annual")}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", margin: 0 }}>연간 결제</p>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#0fa573", padding: "2px 8px", borderRadius: 20 }}>20% 할인</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", margin: "6px 0 4px" }}>₩{annualPrice.toLocaleString()}<span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 600 }}>/년</span></p>
            <p style={{ fontSize: 11, color: "#0fa573", fontWeight: 600, margin: 0 }}>월 ₩{Math.round(annualPrice/12).toLocaleString()} (2.4개월 무료)</p>
          </RadioCard>
        </div>
      </Section>

      {/* 2. 결제자 정보 */}
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

      {/* 3. 결제 수단 선택 */}
      <Section title="③ 결제 수단 선택" subtitle="원하는 결제 수단을 선택하세요">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PG_OPTIONS.map(pg => (
            <PgRadio key={pg.id} pg={pg} active={selectedPg === pg.id} onClick={() => setSelectedPg(pg.id)} />
          ))}
        </div>
      </Section>

      {/* 4. 주문 요약 */}
      <Section title="④ 주문 요약">
        <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "18px 20px", border: "1px solid #ebe9e3" }}>
          <Row label="플랜" value={`${plan.emoji} ${plan.name}`} />
          <Row label="결제 주기" value={periodLabel} />
          <Row label="다음 결제 예정일" value={billingPeriodEnd} />
          <Row label="결제 수단" value={PG_OPTIONS.find(p => p.id === selectedPg)?.label || ""} />
          <hr style={{ border: "none", borderTop: "1px dashed #d0cfc8", margin: "12px 0" }} />
          <Row label="결제 금액" value={`₩${totalAmount.toLocaleString()}`} bold />
          <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 6, textAlign: "right" }}>VAT 포함</p>
        </div>
      </Section>

      {/* 5. 약관 동의 */}
      <Section title="⑤ 약관 동의">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#5b4fcf", cursor: "pointer" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>
              [필수] <Link href="/legal/terms" target="_blank" style={{ color: "#5b4fcf", textDecoration: "underline" }}>서비스 이용약관</Link> 및 <Link href="/legal/privacy" target="_blank" style={{ color: "#5b4fcf", textDecoration: "underline" }}>개인정보처리방침</Link>에 동의합니다
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={agreedRefund} onChange={e => setAgreedRefund(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#5b4fcf", cursor: "pointer" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744" }}>
              [필수] 정기결제 자동 갱신 및 환불 정책에 동의합니다
            </span>
          </label>
          <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.7, padding: "10px 14px", background: "#f8f7f4", borderRadius: 8 }}>
            • 정기결제는 결제 주기마다 자동 갱신되며, 마이페이지에서 언제든 해지 가능합니다.<br/>
            • 결제일로부터 7일 이내, 서비스 미사용 시 전액 환불 가능합니다.<br/>
            • 환불 문의: inquiry@mclean21.com (평일 10:00~18:00)
          </p>
        </div>
      </Section>

      {/* 6. 결제하기 버튼 */}
      <div style={{ marginTop: 24 }}>
        <button onClick={handlePay} disabled={submitting || !agreed || !agreedRefund}
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: 14,
            background: submitting || !agreed || !agreedRefund
              ? "#c0c0cc"
              : "linear-gradient(135deg, #1a2744, #5b4fcf)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 900,
            border: "none",
            cursor: submitting || !agreed || !agreedRefund ? "not-allowed" : "pointer",
            boxShadow: agreed && agreedRefund ? "0 8px 32px rgba(91,79,207,0.3)" : "none",
            transition: "all .15s",
          }}>
          {submitting ? "처리 중..." : `₩${totalAmount.toLocaleString()} 결제하기`}
        </button>
        <p style={{ fontSize: 11, color: "#8a8a9a", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
          🔒 모든 결제는 PG사(카카오페이/네이버페이/토스페이먼츠)에서 안전하게 처리됩니다<br/>
          (주)맥클린은 결제 정보를 저장하지 않습니다
        </p>
      </div>
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
        padding: "16px 18px",
        borderRadius: 12,
        border: `2px solid ${active ? "#5b4fcf" : "#ebe9e3"}`,
        background: active ? "rgba(91,79,207,0.04)" : "#fff",
        cursor: "pointer",
        transition: "all .15s",
      }}>
      {children}
    </div>
  );
}

function PgRadio({ pg, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 11,
        border: `2px solid ${active ? "#5b4fcf" : "#ebe9e3"}`,
        background: active ? "rgba(91,79,207,0.04)" : "#fff",
        cursor: "pointer",
        transition: "all .15s",
      }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        border: `2px solid ${active ? "#5b4fcf" : "#d0cfc8"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {active && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#5b4fcf" }} />}
      </div>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: pg.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, color: pg.textColor, fontWeight: 800, flexShrink: 0,
      }}>
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

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ fontSize: bold ? 14 : 13, color: bold ? "#1a2744" : "#6a6a7a", fontWeight: bold ? 800 : 600 }}>{label}</span>
      <span style={{ fontSize: bold ? 18 : 13, color: "#1a2744", fontWeight: bold ? 900 : 700 }}>{value}</span>
    </div>
  );
}

async function loadTossPayments(clientKey) {
  if (window.TossPayments) return window.TossPayments(clientKey);
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://js.tosspayments.com/v1/payment";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.TossPayments(clientKey);
}
