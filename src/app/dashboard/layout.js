"use client";
import { useRouter } from "next/navigation";
import { Sidebar, MobileHeader } from "../../components/navigation";
import { Toast, PageLoader } from "../../components/shared";
import { AppProvider, useApp } from "../../context/AppContext";
import { C } from "../../lib/constants";

function DashboardShell({ children }) {
  const router   = useRouter();
  const { loading } = useApp();

  const handleLogout = () => router.push("/");

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Outfit','Noto Sans KR',sans-serif", background: C.bg, color: C.text }}>
      <Sidebar onLogout={handleLogout} />
      <MobileHeader onLogout={handleLogout} />
      <main className="main-content" style={{ marginLeft: 206, flex: 1, minHeight: "100vh", background: C.bg }}>
        {children}
      </main>
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
