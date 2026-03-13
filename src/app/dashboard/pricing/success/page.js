"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { C, PLANS } from "../../../../lib/constants";
import { useApp } from "../../../../context/AppContext";

function PricingSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { refreshSubscription } = useApp();
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const run = async () => {
      const planId       = params.get("plan");
      const authKey      = params.get("authKey");
      const customerKey  = params.get("customerKey");
      if (!planId || !authKey || !customerKey) { setStatus("error"); return; }

      try {
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, authKey, customerKey }),
        });
        if (!res.ok) throw new Error("billing failed");

        // 결제 성공 → 구독 정보 즉시 갱신
        await refreshSubscription();

        setStatus("done");
        setTimeout(() => router.push("/dashboard"), 2500);
      } catch {
        setStatus("error");
      }
    };
    run();
  }, []);

  const plan = PLANS[params.get("plan")] || PLANS.starter;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
        {status === "processing" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <p style={{ color: "#1a2744", fontSize: 18, fontWeight: 700 }}>결제 처리 중...</p>
          </>
        )}
        {status === "done" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <p style={{ color: "#1a2744", fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{plan.name} 플랜 시작!</p>
            <p style={{ color: "#8a8a9a", fontSize: 14 }}>잠시 후 대시보드로 이동합니다...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <p style={{ color: "#1a2744", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>결제에 실패했습니다</p>
            <button onClick={() => router.push("/dashboard/pricing")} style={{ padding: "12px 28px", borderRadius: 12, background: C.indigo, border: "none", color: "#1a2744", fontWeight: 700, cursor: "pointer" }}>
              다시 시도
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4f0" }}>
        <p style={{ color: "#8a8a9a" }}>로딩 중...</p>
      </div>
    }>
      <PricingSuccessContent />
    </Suspense>
  );
}
