"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { C, NAV, daysLeft } from "../lib/constants";
import { useApp } from "../context/AppContext";

// ─── SVG 로고 컴포넌트 ───────────────────────────────────────────
function OwnlyLogo({ size = "md", onClick }) {
  const sizes = { sm: { box: 28, r: 7, svg: 72, h: 22, fs: 13 }, md: { box: 34, r: 9, svg: 88, h: 26, fs: 15 }, lg: { box: 44, r: 12, svg: 112, h: 34, fs: 20 } };
  const s = sizes[size];
  return (
    <div onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: size === "lg" ? 10 : 8, cursor: onClick ? "pointer" : "default" }}>
      {/* 아이콘 */}
      <div style={{ width: s.box, height: s.box, borderRadius: s.r, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${C.indigo}44`, flexShrink: 0 }}>
        <svg width={s.box * 0.6} height={s.box * 0.6} viewBox="0 0 20 20" fill="none">
          <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
          <rect x="7.5" y="12" width="5" height="6" rx="1" fill={C.indigo}/>
        </svg>
      </div>
      {/* 텍스트 */}
      <svg width={s.svg} height={s.h} viewBox={`0 0 ${s.svg} ${s.h}`} fill="none">
        <defs>
          <linearGradient id="logoTextGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8"/>
            <stop offset="100%" stopColor="#c084fc"/>
          </linearGradient>
        </defs>
        <text x="0" y={s.h - 4} fontFamily="'Outfit',sans-serif" fontWeight="800" fontSize={s.fs} fill="white" letterSpacing="-0.5">Ownly</text>
      </svg>
    </div>
  );
}

export function MobileHeader({ onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="mobile-header"
        style={{ display: "none", position: "sticky", top: 0, zIndex: 200, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "10px 16px", alignItems: "center", justifyContent: "space-between" }}
      >
        <OwnlyLogo size="sm" onClick={() => router.push("/dashboard")} />
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: C.text, fontSize: 22, cursor: "pointer", padding: 4 }}>
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, top: 52, zIndex: 199, background: C.bg, padding: 16, animation: "fade-in .2s ease" }}>
          {NAV.map((n) => (
            <div
              key={n.key}
              onClick={() => { router.push(n.key === "dashboard" ? "/dashboard" : "/dashboard/" + n.key); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 12px", borderRadius: 10, marginBottom: 4, cursor: "pointer", background: pathname.includes(n.key) ? `${C.indigo}18` : "transparent" }}
            >
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
  const router = useRouter();
  const pathname = usePathname();
  const { tenants, user, userPlan } = useApp();

  const unpaidCount   = tenants.filter((t) => t.status === "미납").length;
  const expiringCount = tenants.filter((t) => daysLeft(t.end) <= 90).length;
  const alerts = { payments: unpaidCount, tenants: expiringCount };

  const planLabel = { free: "무료", starter: "스타터", pro: "프로" };
  const planColor = { free: C.muted, starter: C.indigo, pro: C.gold || "#f5c542" };
  const currentPlan = userPlan || "free";

  // 유저 이니셜
  const email = user?.email || "";
  const initial = email ? email[0].toUpperCase() : "U";

  return (
    <aside
      className="desktop-sidebar"
      style={{ width: 206, minHeight: "100vh", background: "#09090f", borderRight: `1px solid ${C.border}`, position: "fixed", top: 0, left: 0, display: "flex", flexDirection: "column", zIndex: 100 }}
    >
      {/* 로고 — 클릭 시 대시보드로 */}
      <div style={{ padding: "20px 18px 16px" }}>
        <OwnlyLogo size="md" onClick={() => router.push("/dashboard")} />
        <p style={{ fontSize: 9, color: C.muted, marginTop: 6, paddingLeft: 2 }}>by McLean</p>
      </div>

      {/* 플랜 뱃지 */}
      <div
        onClick={() => router.push("/dashboard/pricing")}
        style={{ margin: "0 10px 8px", padding: "8px 12px", borderRadius: 10, background: `${planColor[currentPlan]}15`, border: `1px solid ${planColor[currentPlan]}33`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: planColor[currentPlan] }}>
          {planLabel[currentPlan]} 플랜
        </span>
        {currentPlan === "free" && (
          <span style={{ fontSize: 10, color: C.indigo, fontWeight: 600 }}>업그레이드 →</span>
        )}
      </div>

      {/* 메인 메뉴 */}
      <nav style={{ padding: "2px 10px", flex: 1 }}>
        <p style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "8px 10px 6px" }}>메뉴</p>
        {NAV.slice(0, 10).map((item) => {
          const isActive = pathname === "/dashboard/" + item.key || (item.key === "dashboard" && pathname === "/dashboard");
          const badge = alerts[item.key];
          return (
            <div
              key={item.key}
              onClick={() => router.push(item.key === "dashboard" ? "/dashboard" : "/dashboard/" + item.key)}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 11px", borderRadius: 10, marginBottom: 2, cursor: "pointer", borderLeft: "2px solid " + (isActive ? C.indigo : "transparent") }}
            >
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
            <div
              key={item.key}
              onClick={() => router.push("/dashboard/" + item.key)}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 10, marginBottom: 2, cursor: "pointer", borderLeft: "2px solid " + (isActive ? C.indigo : "transparent") }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : C.muted }}>{item.label}</span>
            </div>
          );
        })}

        {/* 구독 플랜 메뉴 */}
        <div
          onClick={() => router.push("/dashboard/pricing")}
          className={"nav-item" + (pathname.includes("pricing") ? " active" : "")}
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 10, marginBottom: 2, cursor: "pointer", borderLeft: "2px solid " + (pathname.includes("pricing") ? C.indigo : "transparent") }}
        >
          <span style={{ fontSize: 14 }}>💎</span>
          <span style={{ fontSize: 13, fontWeight: pathname.includes("pricing") ? 700 : 500, color: pathname.includes("pricing") ? "#fff" : C.muted }}>구독 플랜</span>
        </div>
      </nav>

      {/* 프로필 + 로그아웃 */}
      <div style={{ padding: "12px 10px 20px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ padding: "11px 12px", borderRadius: 11, background: C.faint, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.indigo},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email || "사용자"}</p>
            <p style={{ fontSize: 10, color: planColor[currentPlan], fontWeight: 600 }}>{planLabel[currentPlan]} 플랜</p>
          </div>
          <button
            onClick={onLogout}
            title="로그아웃"
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 2, transition: "color .2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.rose)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
          >↩</button>
        </div>
      </div>
    </aside>
  );
}
