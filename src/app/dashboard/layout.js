"use client"; import { useState, useEffect } from "react"; import { useRouter, usePathname } from "next/navigation"; import { Sidebar, MobileHeader, BottomNav, MobileDrawer } from "../../components/navigation"; import { Toast, PageLoader } from "../../components/shared"; import OnboardingModal from "../../components/OnboardingModal"; import { SearchOverlay } from "../../components/GlobalSearch"; import { AppProvider, useApp } from "../../context/AppContext"; import { supabase } from "../../lib/supabase"; import RealEstateTicker from "../../components/RealEstateTicker"; import SiteFooter from "../../components/SiteFooter";

function DashboardShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  // 🔒 비로그인 유저는 로그인 페이지로 리디렉트
  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [loading, user, pathname, router]);

  // 인증 확인 전이거나 리디렉트 중에는 로더만 노출 (대시보드 셸 숨김)
  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Pretendard','DM Sans',system-ui,sans-serif" }}>
      <MobileHeader onMoreClick={() => setDrawerOpen(true)} onSearchClick={() => setSearchOpen(true)} />
      <div style={{ display: "flex" }}>
        <Sidebar onLogout={handleLogout} onSearchClick={() => setSearchOpen(true)} />
        <main className="main-content" style={{ flex: 1, minHeight: "100vh", background: "var(--bg)", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>{children}</div>
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
