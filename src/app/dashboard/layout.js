"use client"; import { useState, useEffect } from "react"; import { useRouter, usePathname } from "next/navigation"; import { Sidebar, MobileHeader, BottomNav, MobileDrawer } from "../../components/navigation"; import { Toast } from "../../components/shared"; import OnboardingModal from "../../components/OnboardingModal"; import { SearchOverlay } from "../../components/GlobalSearch"; import { AppProvider, useApp } from "../../context/AppContext"; import { supabase } from "../../lib/supabase"; import RealEstateTicker from "../../components/RealEstateTicker"; import SiteFooter from "../../components/SiteFooter";

function DashboardShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // 한 번 인증되면 영구 true — user 가 일시적으로 null 로 바뀌어도 튕기지 않음
  const [authPassed, setAuthPassed] = useState(false);

  // 인증 성공 기록 — user 가 truthy 가 된 순간 한 번만
  useEffect(() => {
    if (user && !authPassed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 명시 의도: monotonic latch
      setAuthPassed(true);
    }
  }, [user, authPassed]);

  const authChecked = !loading && (!!user || authPassed);
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  // 🔒 비로그인 유저는 로그인 페이지로 리디렉트
  // - loading 중이면 대기
  // - user 있거나 이미 한 번 통과한 적 있으면 통과
  // - user 없는데 grace 끝나도 여전히 null 이면 redirect (1.2s)
  //   → 소셜 로그인 직후 onAuthStateChange("SIGNED_IN") 이 user 설정하기까지의 race 방지
  //   → magiclink refresh 일시 실패로 인한 user→null 도 튕김 방지
  useEffect(() => {
    if (loading) return;
    if (user || authPassed) return;
    const timer = setTimeout(() => {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }, 1200);
    return () => clearTimeout(timer);
  }, [loading, user, authPassed, pathname, router]);

  // 비로그인 상태에서 리디렉트 트리거되기 전에 셸을 렌더하지 않으면 깜빡임 UX 발생
  // → 셸은 항상 렌더하고, main 영역만 로더 처리해서 즉시 레이아웃 노출
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Pretendard','DM Sans',system-ui,sans-serif" }}>
      <MobileHeader onMoreClick={() => setDrawerOpen(true)} onSearchClick={() => setSearchOpen(true)} />
      <div style={{ display: "flex" }}>
        <Sidebar onLogout={handleLogout} onSearchClick={() => setSearchOpen(true)} />
        <main className="main-content" style={{ flex: 1, minHeight: "100vh", background: "var(--bg)", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            {authChecked ? children : (
              <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 28, height: 28, border: "2.5px solid rgba(91,79,207,0.2)", borderTopColor: "#5b4fcf", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>
          <RealEstateTicker />
          <SiteFooter />
        </main>
      </div>
      <BottomNav onMore={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toast />
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <AppProvider>
      <OnboardingModal />
      <DashboardShell>{children}</DashboardShell>
    </AppProvider>
  );
}
