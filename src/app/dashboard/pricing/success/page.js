"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { C, PLANS } from "../../../../lib/constants";

function PricingSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState("processing"); // processing | done | error

  useEffect(() => {
    const run = async () => {
      const planId       = params.get("plan");
      const authKey      = params.get("authKey");
      const customerKey  = params.get("customerKey");
      if (!planId || !authKey || !customerKey) { setStatus("error"); return; }

      try {
        // 서버 API 라우트에서 빌링키 발급 + Supabase 저장
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, authKey, customerKey }),
        });
        if (!res.ok) throw new Error("billing failed");
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Outfit','Noto Sans KR',sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
        {status === "processing" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>결제 처리 중...</p>
          </>
        )}
        {status === "done" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{plan.name} 플랜 시작!</p>
            <p style={{ color: C.muted, fontSize: 14 }}>잠시 후 대시보드로 이동합니다...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>결제에 실패했습니다</p>
            <button onClick={() => router.push("/dashboard/pricing")} style={{ padding: "12px 28px", borderRadius: 12, background: C.indigo, border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <p style={{ color: C.muted }}>로딩 중...</p>
      </div>
    }>
      <PricingSuccessContent />
    </Suspense>
  );
}
