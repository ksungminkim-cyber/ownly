"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 갱신 관리 페이지는 /dashboard/tenants/renewals 에 있으므로 그쪽으로 리다이렉트합니다.
// 외부에서 /dashboard/renewal 링크로 들어오는 경우도 모두 정확한 페이지로 안내합니다.
export default function Redirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/tenants/renewals"); }, [router]);
  return null;
}
