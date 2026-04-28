"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PLANS } from "../../../../lib/constants";
import { useApp } from "../../../../context/AppContext";
import { toast } from "../../../../components/shared";

// 카카오페이/네이버페이 정기결제 통합용 체크아웃 페이지
// 트렌디 미니멀 디자인 — 카드 기반 섹션, 진행 단계, 약관 3종, 사업자 정보

const PG_OPTIONS = [
  { id: "kakao", label: "카카오페이", icon: "💛", desc: "카카오톡 간편결제 · 정기결제 자동 갱신", color: "#fee500", textColor: "#3c1e1e", available: false },
  { id: "naver", label: "네이버페이", icon: "💚", desc: "네이버 간편결제 · 정기결제 자동 갱신", color: "#03c75a", textColor: "#fff", available: false },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { planId } = useParams();
  const { user, userPlan } = useApp();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPg, setSelectedPg] = useState("kakao");
  const [agreed, setAgreed] = useState(false);
  const [agreedRefund, setAgreedRefund] = useState(false);
  const [agreedThirdParty, setAgreedThirdParty] = useState(false);
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
      <div style={{ padding: 40, textAlign: "center", fontFamily: "'Pretendard',sans-serif" }}>
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

  const allAgreed = agreed && agreedRefund && agreedThirdParty;

  const handlePay = async () => {
    if (!allAgreed) { toast("필수 약관 3가지에 모두 동의해주세요", "error"); return; }
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
    <div style={{ minHeight: "100vh", background: "#fafaf7", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* 브레드크럼 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>
          <Link href="/dashboard/pricing" style={{ color: "#5b4fcf", textDecoration: "none", fontWeight: 600 }}>요금제</Link>
          <span>/</span>
          <span style={{ fontWeight: 700, color: "#1a2744" }}>결제하기</span>
        </div>

        {/* 진행 단계 */}
        <ProgressBar currentStep={2} />

        {/* 헤더 */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#5b4fcf", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
            {isUpgrade ? "플랜 변경" : "구독 시작"}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            {plan.name} 플랜
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>{plan.tagline}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* 결제 주기 */}
          <Card num="1" title="결제 주기">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <CycleCard active={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}
                title="월간" price={monthlyPrice} unit="/월" desc="매월 자동 갱신" />
              <CycleCard active={billingCycle === "annual"} onClick={() => setBillingCycle("annual")}
                title="연간" badge="20% 할인" price={annualPrice} unit="/년"
                desc={`월 ₩${Math.round(annualPrice / 12).toLocaleString()} · 2.4개월 무료`} />
            </div>
          </Card>

          {/* 결제자 정보 */}
          <Card num="2" title="결제자 정보" subtitle="세금계산서·영수증 발행 시 사용됩니다">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="이름" required>
                <Input value={customerName} onChange={setCustomerName} placeholder="홍길동" />
              </Field>
              <Field label="연락처" required>
                <Input value={customerPhone} onChange={setCustomerPhone} placeholder="010-0000-0000" />
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="이메일">
                  <Input value={user?.email || ""} disabled />
                </Field>
              </div>
            </div>
          </Card>

          {/* 결제 수단 */}
          <Card num="3" title="결제 수단">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PG_OPTIONS.map(pg => (
                <PgRadio key={pg.id} pg={pg} active={selectedPg === pg.id} onClick={() => setSelectedPg(pg.id)} />
              ))}
            </div>
          </Card>

          {/* 주문 요약 */}
          <Card num="4" title="주문 요약">
            <div style={{ background: "#f8f7f4", borderRadius: 12, padding: "18px 20px" }}>
              <Row label="플랜" value={plan.name} />
              <Row label="결제 주기" value={periodLabel} />
              <Row label="다음 결제일" value={billingPeriodEnd} />
              <Row label="결제 수단" value={PG_OPTIONS.find(p => p.id === selectedPg)?.label || ""} />
              <div style={{ height: 1, background: "#e5e3dd", margin: "14px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 800 }}>결제 금액</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>₩{totalAmount.toLocaleString()}</span>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>VAT 포함</p>
                </div>
              </div>
            </div>
            <p style={{ marginTop: 12, fontSize: 12, color: "#6b7280", lineHeight: 1.7, padding: "0 4px" }}>
              📄 결제 후 [설정 → 결제 관리]에서 세금계산서 발행 가능 (법인·개인사업자 모두)
            </p>
          </Card>

          {/* 약관 동의 */}
          <Card num="5" title="약관 동의" subtitle="아래 3가지 모두 동의 시 결제 진행">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <CheckboxLabel checked={agreed} onChange={setAgreed}>
                [필수] <Link href="/legal/terms" target="_blank" style={{ color: "#5b4fcf", textDecoration: "underline" }}>서비스 이용약관</Link> 및 <Link href="/legal/privacy" target="_blank" style={{ color: "#5b4fcf", textDecoration: "underline" }}>개인정보처리방침</Link>에 동의합니다
              </CheckboxLabel>
              <CheckboxLabel checked={agreedRefund} onChange={setAgreedRefund}>
                [필수] 정기결제 자동 갱신 및 환불 정책에 동의합니다
              </CheckboxLabel>
              <CheckboxLabel checked={agreedThirdParty} onChange={setAgreedThirdParty}>
                [필수] 결제정보(이름·연락처·결제수단)를 PG사(카카오페이/네이버페이)에 제공함에 동의합니다
              </CheckboxLabel>
            </div>

            {/* 자동결제 해지 안내 — 카카오페이 심사 핵심 */}
            <div style={{ marginTop: 16, padding: "16px 18px", background: "rgba(232,150,10,0.05)", border: "1px solid rgba(232,150,10,0.2)", borderRadius: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#c9920a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span>📌</span><span>정기결제 해지 방법</span>
                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>· 언제든 가능</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#4b5563", lineHeight: 1.7 }}>
                <p style={{ margin: 0 }}><b style={{ color: "#0f172a" }}>1.</b> 로그인 → 설정 → 결제 관리 → "구독 해지"</p>
                <p style={{ margin: 0 }}><b style={{ color: "#0f172a" }}>2.</b> inquiry@mclean21.com 이메일 요청</p>
                <p style={{ margin: 0 }}><b style={{ color: "#0f172a" }}>3.</b> 고객센터 02-334-2211 (평일 10:00~18:00)</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af" }}>해지 시 다음 결제일부터 자동 갱신 중단 · 현재 기간 종료일까지 서비스 유지</p>
              </div>
            </div>
          </Card>

          {/* 결제하기 */}
          <div style={{ marginTop: 8 }}>
            <button onClick={handlePay} disabled={submitting || !allAgreed}
              style={{
                width: "100%", padding: "20px", borderRadius: 16,
                background: submitting || !allAgreed
                  ? "#d1d5db"
                  : "linear-gradient(135deg, #1a2744 0%, #5b4fcf 100%)",
                color: "#fff", fontSize: 16, fontWeight: 800, border: "none",
                cursor: submitting || !allAgreed ? "not-allowed" : "pointer",
                boxShadow: allAgreed ? "0 12px 40px rgba(91,79,207,0.35), 0 4px 12px rgba(26,39,68,0.15)" : "none",
                transition: "all .2s ease",
                letterSpacing: "-0.3px",
              }}
              onMouseEnter={e => { if (allAgreed) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
              {submitting ? "처리 중..." : `₩${totalAmount.toLocaleString()} 결제하기`}
            </button>

            {/* 트러스트 배지 (3개로 정제) */}
            <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <TrustBadge icon="🔒" label="SSL 256bit 암호화" />
              <TrustBadge icon="🛡️" label="공식 PG 가맹점" />
              <TrustBadge icon="✓" label="개인정보보호법 준수" />
            </div>

            <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
              모든 결제는 PG사(카카오페이·네이버페이)에서 직접 처리되며,<br />
              (주)맥클린은 카드번호·계좌번호 등 결제 정보를 저장하지 않습니다
            </p>
          </div>

          {/* 사업자 정보 (전자상거래법) */}
          <div style={{ marginTop: 24, padding: "18px 20px", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 12, fontSize: 11, color: "#6b7280", lineHeight: 1.8 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>판매자 정보</p>
            <p style={{ margin: 0 }}>
              <b style={{ color: "#0f172a" }}>(주)맥클린</b> · 대표 김성민 · 사업자등록번호 137-81-52231 ·{" "}
              <a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1378152231" target="_blank" rel="noopener noreferrer"
                style={{ color: "#5b4fcf", textDecoration: "underline" }}>사업자정보확인</a>
            </p>
            <p style={{ margin: "3px 0" }}>통신판매업신고 제2026-경기김포-2785호 · 경기도 김포시 양촌읍 유현삭시로241번길 86</p>
            <p style={{ margin: 0 }}>고객센터 02-334-2211 · inquiry@mclean21.com (평일 10:00~18:00)</p>
            <div style={{ height: 1, background: "#ebe9e3", margin: "10px 0" }} />
            <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>
              본 결제는 「전자상거래 등에서의 소비자보호에 관한 법률」 및 PG사 이용약관에 따라 처리됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────  Trendy Components  ───────────── */

function ProgressBar({ currentStep }) {
  const steps = ["플랜 선택", "결제 정보", "완료"];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28, padding: "0 4px" }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const isDone = currentStep > n;
        const isCurrent = currentStep === n;
        const color = isDone ? "#10b981" : isCurrent ? "#5b4fcf" : "#d1d5db";
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 70 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: isCurrent || isDone ? color : "#fff",
                border: `2px solid ${color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isCurrent || isDone ? "#fff" : color,
                fontSize: 13, fontWeight: 800,
                transition: "all .3s",
                boxShadow: isCurrent ? "0 4px 12px rgba(91,79,207,0.25)" : "none",
              }}>
                {isDone ? "✓" : n}
              </div>
              <span style={{ fontSize: 11, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#0f172a" : "#9ca3af" }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: isDone ? "#10b981" : "#e5e7eb", margin: "0 4px", marginBottom: 18, borderRadius: 1, transition: "all .3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Card({ num, title, subtitle, children }) {
  return (
    <section style={{
      background: "#ffffff",
      border: "1px solid #ebe9e3",
      borderRadius: 16,
      padding: "22px 24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      transition: "all .15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: subtitle ? 4 : 16 }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "#0f172a", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 900,
        }}>
          {num}
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.2px" }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 16px 36px" }}>{subtitle}</p>}
      {children}
    </section>
  );
}

function CycleCard({ active, onClick, title, badge, price, unit, desc }) {
  return (
    <div onClick={onClick}
      style={{
        padding: "16px 18px", borderRadius: 12,
        border: `2px solid ${active ? "#5b4fcf" : "#e5e7eb"}`,
        background: active ? "rgba(91,79,207,0.04)" : "#fff",
        cursor: "pointer", transition: "all .15s",
        position: "relative",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>{title}</p>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#10b981", padding: "2px 8px", borderRadius: 20 }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.5px" }}>
        ₩{price.toLocaleString()}<span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{unit}</span>
      </p>
      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{desc}</p>
    </div>
  );
}

function PgRadio({ pg, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", borderRadius: 12,
        border: `2px solid ${active ? "#5b4fcf" : "#e5e7eb"}`,
        background: active ? "rgba(91,79,207,0.04)" : "#fff",
        cursor: "pointer", transition: "all .15s",
      }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        border: `2px solid ${active ? "#5b4fcf" : "#d1d5db"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {active && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#5b4fcf" }} />}
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: pg.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, color: pg.textColor, fontWeight: 800, flexShrink: 0,
      }}>
        {pg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>{pg.label}</p>
        <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0", lineHeight: 1.5 }}>{pg.desc}</p>
      </div>
      {!pg.available && (
        <span style={{
          fontSize: 10, fontWeight: 800, color: "#c9920a",
          background: "rgba(232,150,10,0.1)", padding: "4px 10px",
          borderRadius: 20, flexShrink: 0,
        }}>
          심사중
        </span>
      )}
    </div>
  );
}

function CheckboxLabel({ checked, onChange, children }) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 14px", background: checked ? "rgba(91,79,207,0.04)" : "#fafaf7",
      border: `1px solid ${checked ? "#5b4fcf" : "#e5e7eb"}`,
      borderRadius: 10, cursor: "pointer", transition: "all .15s",
    }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: "#5b4fcf", cursor: "pointer", flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.5 }}>
        {children}
      </span>
    </label>
  );
}

function TrustBadge({ icon, label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "6px 11px", background: "#fff", border: "1px solid #e5e7eb",
      borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#4b5563",
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, disabled }) {
  return (
    <input value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{
        width: "100%", padding: "11px 14px", fontSize: 14,
        color: disabled ? "#9ca3af" : "#0f172a",
        background: disabled ? "#f3f4f6" : "#fafaf7",
        border: "1px solid #e5e7eb", borderRadius: 10,
        outline: "none", boxSizing: "border-box",
        transition: "border-color .15s",
      }}
      onFocus={e => e.target.style.borderColor = "#5b4fcf"}
      onBlur={e => e.target.style.borderColor = "#e5e7eb"}
    />
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
      <span style={{ color: "#6b7280", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "#0f172a", fontWeight: 700 }}>{value}</span>
    </div>
  );
}
