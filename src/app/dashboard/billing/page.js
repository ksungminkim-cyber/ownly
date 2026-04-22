"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SectionLabel, Modal, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";

const PLAN_LABEL = { free: "무료", starter: "스타터", plus: "플러스", pro: "프로" };
const STATUS_LABEL = {
  paid:      { label: "결제 완료",   color: "#0fa573", bg: "rgba(15,165,115,0.1)" },
  failed:    { label: "결제 실패",   color: "#e8445a", bg: "rgba(232,68,90,0.1)" },
  refunded:  { label: "환불",        color: "#8a8a9a", bg: "rgba(138,138,154,0.12)" },
  cancelled: { label: "취소",        color: "#8a8a9a", bg: "rgba(138,138,154,0.12)" },
};

export default function BillingPage() {
  const router = useRouter();
  const { user, userPlan, subscription } = useApp();
  const [history, setHistory] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    setLoadingHist(true);
    try {
      const { data } = await supabase
        .from("billing_history")
        .select("*")
        .eq("user_id", user.id)
        .order("paid_at", { ascending: false })
        .limit(50);
      setHistory(data || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHist(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "취소 처리 중 오류", "error"); return; }
      toast(data.message || "구독이 취소되었습니다");
      setCancelOpen(false);
      setCancelReason("");
      window.location.reload();
    } catch (e) {
      toast("오류: " + e.message, "error");
    } finally {
      setCancelling(false);
    }
  };

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString("ko-KR") : "—";
  const fmtDateTime = (s) => s ? new Date(s).toLocaleString("ko-KR") : "—";
  const fmtAmount = (n) => (n || 0).toLocaleString() + "원";

  const isCancelled = subscription?.status === "cancelled";
  const periodEnd = subscription?.current_period_end;
  const daysLeft = periodEnd ? Math.max(0, Math.ceil((new Date(periodEnd) - new Date()) / 86400000)) : null;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 820 }}>
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>BILLING</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>결제 관리</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>구독 상태·결제 이력·취소</p>
      </div>

      {/* 현재 구독 카드 */}
      <div style={{ background: "#fff", border: `1.5px solid ${isCancelled ? "rgba(232,68,90,0.3)" : C.indigo + "30"}`, borderRadius: 16, padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>현재 플랜</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#1a2744" }}>{PLAN_LABEL[userPlan] || userPlan}</p>
              {isCancelled && <span style={{ fontSize: 10, fontWeight: 800, color: "#e8445a", background: "rgba(232,68,90,0.1)", padding: "3px 10px", borderRadius: 20 }}>취소 예정</span>}
              {!isCancelled && userPlan !== "free" && <span style={{ fontSize: 10, fontWeight: 800, color: "#0fa573", background: "rgba(15,165,115,0.1)", padding: "3px 10px", borderRadius: 20 }}>● 활성</span>}
            </div>
            {periodEnd && (
              <p style={{ fontSize: 12, color: "#8a8a9a", marginTop: 6 }}>
                {isCancelled ? "서비스 종료" : "다음 결제"}: <b style={{ color: "#1a2744" }}>{fmtDate(periodEnd)}</b>
                {daysLeft !== null && <> · D-{daysLeft}</>}
              </p>
            )}
            {subscription?.cancelled_at && (
              <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 3 }}>취소 요청일: {fmtDateTime(subscription.cancelled_at)}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {userPlan === "free" ? (
              <button onClick={() => router.push("/dashboard/pricing")}
                style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                플랜 업그레이드 →
              </button>
            ) : (
              <>
                <button onClick={() => router.push("/dashboard/pricing")}
                  style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid #ebe9e3", background: "#fff", color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  플랜 변경
                </button>
                {!isCancelled && (
                  <button onClick={() => setCancelOpen(true)}
                    style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(232,68,90,0.3)", background: "transparent", color: "#e8445a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    구독 취소
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {isCancelled && periodEnd && (
          <div style={{ marginTop: 14, padding: "10px 13px", background: "rgba(232,68,90,0.06)", border: "1px solid rgba(232,68,90,0.15)", borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: "#e8445a", fontWeight: 700, marginBottom: 3 }}>⚠️ 구독이 취소되었습니다</p>
            <p style={{ fontSize: 11, color: "#8a8a9a", lineHeight: 1.6 }}>
              {fmtDate(periodEnd)}까지 서비스를 이용할 수 있으며, 이후 자동으로 무료 플랜으로 전환됩니다.
              다시 구독하려면 플랜 업그레이드를 진행해주세요.
            </p>
          </div>
        )}
      </div>

      {/* 결제 이력 */}
      <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0efe9" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#1a2744" }}>💳 결제 이력</p>
        </div>
        {loadingHist ? (
          <p style={{ padding: 28, textAlign: "center", color: "#8a8a9a", fontSize: 13 }}>불러오는 중...</p>
        ) : history.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🧾</div>
            <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.6 }}>
              아직 결제 이력이 없습니다.<br />
              유료 플랜 구독 시 결제 내역이 이 곳에 표시됩니다.
            </p>
          </div>
        ) : (
          <div>
            {history.map((h, i) => {
              const st = STATUS_LABEL[h.status] || STATUS_LABEL.paid;
              return (
                <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", borderBottom: i < history.length - 1 ? "1px solid #f0efe9" : "none", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{PLAN_LABEL[h.plan] || h.plan} 플랜 구독</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: "2px 8px", borderRadius: 20 }}>{st.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#8a8a9a" }}>
                      {fmtDateTime(h.paid_at || h.created_at)}
                      {h.toss_order_id && <> · 주문 {h.toss_order_id}</>}
                    </p>
                    {h.error_message && <p style={{ fontSize: 11, color: "#e8445a", marginTop: 3 }}>⚠️ {h.error_message}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#1a2744" }}>{fmtAmount(h.amount)}</span>
                    {h.receipt_url && (
                      <a href={h.receipt_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, fontWeight: 700, color: C.indigo, textDecoration: "none", padding: "4px 10px", borderRadius: 7, border: `1px solid ${C.indigo}30`, background: "rgba(26,39,68,0.04)" }}>
                        영수증 →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 18, padding: "14px 18px", background: "rgba(26,39,68,0.04)", borderRadius: 12 }}>
        <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7 }}>
          💡 세금계산서 발행 또는 환불 관련 문의는 <a href="mailto:inquiry@mclean21.com" style={{ color: "#5b4fcf", fontWeight: 700 }}>inquiry@mclean21.com</a>으로 연락주세요.
        </p>
      </div>

      {/* 취소 확인 모달 */}
      <Modal open={cancelOpen} onClose={() => { setCancelOpen(false); setCancelReason(""); }} width={440}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>구독을 취소하시겠어요?</h3>
        <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.7, marginBottom: 14 }}>
          지금 취소하시면 <b style={{ color: "#1a2744" }}>{fmtDate(periodEnd)}</b>까지 서비스가 유지되며, 이후 자동으로 무료 플랜으로 전환됩니다.
          환불은 진행되지 않으니 기간 종료일까지 자유롭게 이용하세요.
        </p>
        <div>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 6 }}>취소 사유 (선택) — 서비스 개선에 큰 도움이 됩니다</p>
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="예: 가격 부담 / 기능 부족 / 잠시 쉬기 / 다른 서비스 이용"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ebe9e3", background: "#f8f7f4", fontSize: 12, color: "#1a2744", resize: "vertical", outline: "none", fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
          <button onClick={() => { setCancelOpen(false); setCancelReason(""); }}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #ebe9e3", background: "transparent", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            유지하기
          </button>
          <button onClick={handleCancel} disabled={cancelling}
            style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "#e8445a", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: cancelling ? 0.7 : 1 }}>
            {cancelling ? "처리 중..." : "구독 취소"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
