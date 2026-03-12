"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { C, NAV, daysLeft } from "../lib/constants";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export function MobileHeader({ onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mobile-header"
        style={{ display: "none", position: "sticky", top: 0, zIndex: 200, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "10px 16px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏠</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>Ownly</span>
          <span style={{ fontSize: 9, color: C.muted, marginLeft: 5 }}>by McLean</span>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: C.text, fontSize: 22, cursor: "pointer", padding: 4 }}>
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, top: 52, zIndex: 199, background: C.bg, padding: 16, animation: "fade-in .2s ease" }}>
          {NAV.map((n) => (
            <div key={n.key}
              onClick={() => { router.push(n.key === "dashboard" ? "/dashboard" : "/dashboard/" + n.key); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 12px", borderRadius: 10, marginBottom: 4, cursor: "pointer", background: pathname.includes(n.key) ? `${C.indigo}18` : "transparent" }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              <span style={{ fontSize: 15, fontWeight: pathname.includes(n.key) ? 700 : 500, color: pathname.includes(n.key) ? "#fff" : C.muted }}>{n.label}</span>
            </div>
          ))}
          <button onClick={onLogout} style={{ marginTop: 16, padding: "12px", width: "100%", borderRadius: 10, background: `${C.rose}15`, border: `1px solid ${C.rose}33`, color: C.rose, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            로그아웃
          </button>
        </div>
      )}
    </>
  );
}

export function Sidebar({ onLogout }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { tenants } = useApp();
  const [userName,  setUserName]  = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name = user.user_metadata?.name || user.email?.split("@")[0] || "사용자";
      setUserName(name);
      setUserEmail(user.email || "");
      setUserInitial(name?.[0]?.toUpperCase() || "U");
    });
  }, []);

  const unpaidCount   = tenants.filter((t) => t.status === "미납").length;
  const expiringCount = tenants.filter((t) => daysLeft(t.end_date) <= 90).length;
  const alerts = { payments: unpaidCount, tenants: expiringCount };

  return (
    <aside className="desktop-sidebar"
      style={{ width: 206, minHeight: "100vh", background: "#09090f", borderRight: `1px solid ${C.border}`, position: "fixed", top: 0, left: 0, display: "flex", flexDirection: "column", zIndex: 100 }}>
      {/* 로고 */}
      <div style={{ padding: "22px 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 4px 16px ${C.indigo}44` }}>🏠</div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, color: "#fff", letterSpacing: "-.3px" }}>Ownly</p>
            <p style={{ fontSize: 9, color: C.indigo, fontWeight: 700, letterSpacing: ".5px" }}>PRO · {tenants.length} units</p>
            <p style={{ fontSize: 8, color: C.muted, fontWeight: 500, marginTop: 1 }}>by McLean</p>
          </div>
        </div>
      </div>

      {/* 메인 메뉴 */}
      <nav style={{ padding: "2px 10px", flex: 1 }}>
        <p style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "8px 10px 6px" }}>메뉴</p>
        {NAV.slice(0, 10).map((item) => {
          const isActive = pathname === "/dashboard/" + item.key || (item.key === "dashboard" && pathname === "/dashboard");
          const badge = alerts[item.key];
          return (
            <div key={item.key}
              onClick={() => router.push(item.key === "dashboard" ? "/dashboard" : "/dashboard/" + item.key)}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 11px", borderRadius: 10, marginBottom: 2, cursor: "pointer", borderLeft: "2px solid " + (isActive ? C.indigo : "transparent") }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : C.muted }}>{item.label}</span>
              </div>
              {badge > 0 && (
                <span style={{ fontSize: 9, fontWeight: 800, background: C.rose, color: "#fff", padding: "1px 6px", borderRadius: 8 }}>{badge}</span>
              )}
            </div>
          );
        })}

        <div style={{ height: 1, background: C.border, margin: "10px 6px" }} />

        <p style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "4px 10px 6px" }}>계정</p>
        {[NAV[10]].map((item) => {
          const isActive = pathname.includes(item.key);
          return (
            <div key={item.key}
              onClick={() => router.push("/dashboard/" + item.key)}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 10, marginBottom: 2, cursor: "pointer", borderLeft: "2px solid " + (isActive ? C.indigo : "transparent") }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : C.muted }}>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* 프로필 + 로그아웃 */}
      <div style={{ padding: "12px 10px 20px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ padding: "11px 12px", borderRadius: 11, background: C.faint, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName || "로딩 중..."}</p>
            <p style={{ fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
          </div>
          <button onClick={onLogout} title="로그아웃"
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 2, transition: "color .2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.rose)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}>
            ↩
          </button>
        </div>
      </div>
    </aside>
  );
}
