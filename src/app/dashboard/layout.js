"use client";
import { useRouter } from "next/navigation";
import { Sidebar, MobileHeader } from "../../components/navigation";
import { Toast } from "../../components/shared";
import { AppProvider } from "../../context/AppContext";
import { C } from "../../lib/constants";

function DashboardShell({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Outfit','Noto Sans KR',sans-serif", background: C.bg, color: C.text }}>
      <Sidebar onLogout={handleLogout} />
      <MobileHeader onLogout={handleLogout} />
      <main className="main-content" style={{ flex: 1, minHeight: "100vh", background: C.bg }}>
        {children}
      </main>
      <Toast />
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
