"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PLANS } from "../../../../lib/constants";
import { supabase } from "../../../../lib/supabase";

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const planId = params.get("plan");
  const cycle = params.get("cycle") || "monthly";
  const authKey = params.get("authKey");
  const customerKey = params.get("customerKey");
  const [status, setStatus] = useState("processing"); // processing | done | error
  const [errMsg, setErrMsg] = useState("");

  const plan = PLANS[planId];

  useEffect(() => {
    const confirm = async () => {
      if (!authKey || !customerKey || !planId) {
        setStatus("error");
        setErrMsg("결제 정보가 누락되었습니다");
        return;
      }
      try {
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, authKey, customerKey, cycle }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "확인 실패");
        setStatus("done");
      } catch (e) {
        setStatus("error");
        setErrMsg(e.message);
      }
    };
    confirm();
  }, [authKey, customerKey, planId, cycle]);

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: "40px 32px", textAlign: "center", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {status === "processing" && (
        <>
          <div style={{ width: 64, height: 64, margin: "0 auto 20px", border: "4px solid rgba(91,79,207,0.2)", borderTopColor: "#5b4fcf", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>결제 확인 중...</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a" }}>잠시만 기다려주세요</p>
        </>
      )}
      {status === "done" && (
        <>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>{plan?.name} 플랜 구독 완료!</h1>
          <p style={{ fontSize: 14, color: "#6a6a7a", marginBottom: 24, lineHeight: 1.7 }}>
            결제가 정상 처리되었습니다.<br />
            지금부터 {plan?.name} 플랜의 모든 기능을 이용하실 수 있어요.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/dashboard" style={{ padding: "12px 24px", borderRadius: 11, background: "#1a2744", color: "#fff", fontSize: 14, fontWeight: 800, textDecoration: "none" }}>대시보드로</Link>
            <Link href="/dashboard/billing" style={{ padding: "12px 24px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#6a6a7a", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>결제 내역</Link>
          </div>
        </>
      )}
      {status === "error" && (
        <>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>결제 확인 실패</h1>
          <p style={{ fontSize: 13, color: "#e8445a", marginBottom: 6 }}>{errMsg}</p>
          <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 24 }}>결제는 진행되지 않았습니다. 다시 시도해주세요.</p>
          <button onClick={() => router.push(`/dashboard/checkout/${planId}`)}
            style={{ padding: "12px 24px", borderRadius: 11, background: "#5b4fcf", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
            다시 시도하기
          </button>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
