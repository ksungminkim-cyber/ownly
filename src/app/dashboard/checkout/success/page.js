"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PLANS } from "../../../../lib/constants";
import { supabase } from "../../../../lib/supabase";

// 카카오페이 정기결제 success 콜백 페이지
// 카카오 인증 완료 후 redirect: ?plan=plus&cycle=monthly&order=ownly_..._...&pg_token=xxxxx
// pg_token이 있으면 /api/billing/kakao/approve 호출 → sid 발급 + 구독 활성화

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const planId = params.get("plan");
  const cycle = params.get("cycle") || "monthly";
  const orderId = params.get("order");
  const pgToken = params.get("pg_token");

  const hasKakaoCallback = Boolean(pgToken && planId && orderId);

  const [status, setStatus] = useState(hasKakaoCallback ? "processing" : "info");
  const [errMsg, setErrMsg] = useState("");
  const [result, setResult] = useState(null);

  const plan = PLANS[planId];

  useEffect(() => {
    if (!hasKakaoCallback) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");

        const res = await fetch("/api/billing/kakao/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ pg_token: pgToken, planId, cycle, orderId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || data.error) throw new Error(data.error || "결제 승인 실패");
        setResult(data);
        setStatus("done");
      } catch (e) {
        if (!cancelled) { setStatus("error"); setErrMsg(e.message); }
      }
    })();
    return () => { cancelled = true; };
  }, [hasKakaoCallback, pgToken, planId, cycle, orderId]);

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: "40px 32px", textAlign: "center", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {status === "info" && (
        <>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💛</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>결제 페이지에 직접 진입하셨습니다</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 20 }}>
            카카오페이 결제를 시작하시려면 요금제 페이지에서 플랜을 선택해 주세요.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard/pricing" className="btn btn-fill">요금제로</Link>
            <Link href="/dashboard" className="btn btn-ghost">대시보드로</Link>
          </div>
        </>
      )}

      {status === "processing" && (
        <>
          <div style={{ width: 64, height: 64, margin: "0 auto 20px", border: "4px solid rgba(91,79,207,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>카카오페이 결제 승인 중...</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>잠시만 기다려주세요. 빌링키를 발급받고 구독을 활성화하고 있어요.</p>
        </>
      )}

      {status === "done" && (
        <>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.3px" }}>{plan?.name} 플랜 구독이 활성화되었어요</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.7 }}>
            카카오페이로 ₩{(result?.amount || 0).toLocaleString()} 결제가 정상 처리되었습니다.<br />
            매월 같은 날짜에 자동으로 청구됩니다.
          </p>
          {result?.next_payment_at && (
            <div className="surface-card" style={{ padding: "14px 18px", marginBottom: 20, textAlign: "left" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>다음 자동결제일</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                {new Date(result.next_payment_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" className="btn btn-fill">대시보드로</Link>
            <Link href="/dashboard/billing" className="btn btn-ghost">결제 내역</Link>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>결제 승인 실패</h1>
          <p style={{ fontSize: 13, color: "#e8445a", marginBottom: 6, lineHeight: 1.7 }}>{errMsg}</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>결제는 진행되지 않았습니다. 다시 시도해주세요.<br />문제가 지속되면 inquiry@mclean21.com 으로 문의해 주세요.</p>
          <button onClick={() => router.push(`/dashboard/checkout/${planId}`)} className="btn btn-fill">
            다시 시도하기
          </button>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
