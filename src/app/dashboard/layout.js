"use client";
import { useRouter } from "next/navigation";
import { Sidebar, MobileHeader } from "../../components/navigation";
import { Toast, PageLoader } from "../../components/shared";
import { AppProvider, useApp } from "../../context/AppContext";
import { C } from "../../lib/constants";

function DashboardShell({ children }) {
  const router = useRouter();
  const { loading } = useApp();
  const handleLogout = () => router.push("/");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Outfit','Noto Sans KR',sans-serif" }}>
      {/* 모바일 헤더 — 최상단, flex row 밖 */}
      <MobileHeader onLogout={handleLogout} />

      {/* 데스크탑: sidebar + main 가로 배치 */}
      <div style={{ display: "flex" }}>
        <Sidebar onLogout={handleLogout} />
        <main className="main-content" style={{ flex: 1, minHeight: "100vh", background: C.bg, minWidth: 0 }}>
          {children}
        </main>
      </div>

      <Toast />
      {loading && <PageLoader />}
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <AppProvider>
      <DashboardShell>{children}</DashboardShell>
    </AppProvider>
  );
}
