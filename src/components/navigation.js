"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { C, NAV, daysLeft } from "../lib/constants";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";

function OwnlyLogo({ size = "md", onClick }) {
  const sizes = {
    sm: { box: 28, r: 8, fontSize: 15, gap: 8 },
    md: { box: 36, r: 10, fontSize: 18, gap: 10 },
    lg: { box: 48, r: 13, fontSize: 24, gap: 12 }
  };
  const s = sizes[size];
  return (
    <div onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: s.gap, cursor: onClick ? "pointer" : "default" }}>
      <div style={{
        width: s.box, height: s.box, borderRadius: s.r,
        background: "linear-gradient(145deg, #1a2744, #2d4270)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 14px rgba(26,39,68,0.35)", flexShrink: 0
      }}>
        <svg width={s.box * 0.55} height={s.box * 0.55} viewBox="0 0 20 20" fill="none">
          <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
          <rect x="7.5" y="12" width="5" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
        </svg>
      </div>
      <div>
        <span style={{
          fontFamily: "'DM Sans','Pretendard',sans-serif",
          fontWeight: 800, fontSize: s.fontSize,
          color: "var(--text)", letterSpacing: "-0.5px", lineHeight: 1
        }}>온리</span>
        {size === "md" && (
          <div style={{ fontSize: 9, color: "#a0a0b0", letterSpacing: "1.5px", fontWeight: 500, marginTop: 2 }}>Ownly by McLean</div>
        )}
      </div>
    </div>
  );
}

const NAV_ICONS = {
  dashboard: "⊞", properties: "🏠", tenants: "👤", payments: "💰",
  contracts: "📝", calendar: "📅", vacancy: "🚪", certified: "📨",
  reports: "📊", tax: "🧾", settings: "⚙️", pricing: "💎", community: "💬",
};

const PLAN_ORDER = { free: 0, starter: 1, starter_plus: 2, pro: 3 };

const PREMIUM_NAV = [
  { key: "premium/roi", icon: "💰", label: "수익률 계산기", plan: "starter_plus" },
  { key: "premium/vacancy", icon: "📉", label: "공실 손실 계산기", plan: "starter_plus" },
  { key: "premium/lease-check", icon: "⚖️", label: "임대차 3법", plan: "starter_plus" },
  { key: "premium/map-search", icon: "🗺️", label: "주변 매물 조회", plan: "pro" },
  { key: "premium/ai-report", icon: "🤖", label: "AI 입지 분석", plan: "pro" },
  { key: "premium/kakao-alert", icon: "💬", label: "카카오 수금 알림", plan: "pro" },
  { key: "premium/global-reports", icon: "🌐", label: "글로벌 리포트", plan: "starter_plus" },
];

const BOTTOM_TABS = [
  { key: "dashboard", icon: "⊞", label: "홈" },
  { key: "tenants", icon: "👤", label: "세입자" },
  { key: "payments", icon: "💰", label: "수금" },
  { key: "contracts", icon: "📝", label: "계약" },
  { key: "more", icon: "☰", label: "더보기" },
];

export function BottomNav({ onMore }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenants } = useApp();
  const unpaidCount = tenants.filter((t) => t.status === "미납").length;
  return (
    <nav className="bottom-nav" style={{
      display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300,
      background: "var(--surface)", borderTop: "1px solid var(--border)",
      padding: "6px 0 max(8px, env(safe-area-inset-bottom))",
      boxShadow: "0 -2px 16px rgba(26,39,68,0.08)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        {BOTTOM_TABS.map((tab) => {
          const isActive = tab.key === "more" ? false
            : tab.key === "dashboard" ? pathname === "/dashboard"
            : pathname.includes(tab.key);
          const showBadge = tab.key === "payments" && unpaidCount > 0;
          return (
            <button key={tab.key}
              onClick={() => {
                if (tab.key === "more") { onMore(); return; }
                router.push(tab.key === "dashboard" ? "/dashboard" : "/dashboard/" + tab.key);
              }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                minWidth: 56, minHeight: 44, padding: "4px 8px",
                background: "none", border: "none", cursor: "pointer", position: "relative",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1, transition: "transform .15s",
                transform: isActive ? "scale(1.15)" : "scale(1)" }}>{tab.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--text)" : "var(--text-muted)",
              }}>{tab.label}</span>
              {isActive && (
                <span style={{
                  position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
                  width: 24, height: 2.5, borderRadius: 2, background: "#1a2744",
                }} />
              )}
              {showBadge && (
                <span style={{
                  position: "absolute", top: 2, right: 6,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#e8445a", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{unpaidCount > 9 ? "9+" : unpaidCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileDrawer({ open, onClose, onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userPlan } = useApp();
  const { theme, toggleTheme } = useTheme();
  if (!open) return null;
  const go = (path) => { router.push(path); onClose(); };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.4)", animation: "fade-in .15s ease" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: "min(300px, 88vw)", background: "var(--surface)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <OwnlyLogo size="sm" onClick={() => go("/dashboard")} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={toggleTheme} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "var(--surface3)", cursor: "pointer", fontSize: 15 }}>{theme === "light" ? "🌙" : "☀️"}</button>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "var(--surface3)", color: "var(--text)", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, padding: "10px 10px 0", overflowY: "auto" }}>
          <p style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 800, letterSpaacing: "2px", textTransform: "uppercase", padding: "4px 10px 8px" }}>메뉴</p>
          {NAV.map((n) => {
            const isActive = n.key === "dashboard" ? pathname === "/dashboard" : pathname.includes(n.key);
            return (
              <div key={n.key} onClick={() => go(n.key === "dashboard" ? "/dashboard" : "/dashboard/" + n.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
                  borderRadius: 10, marginBottom: 2, cursor: "pointer", minHeight: 44,
                  background: isActive ? "rgba(26,39,68,0.08)" : "transparent",
                  borderLeft: "2.5px solid " + (isActive ? "#1a2744" : "transparent"),
                }}>
                <span style={{ fontSize: 16 }}>{NAV_ICONS[n.key] || n.icon}</span>
                <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--text)" : "var(--text-muted)" }}>{n.label}</span>
              </div>
            );
          })}
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
          <div onClick={() => go("/dashboard/community")}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer", minHeight: 44,
              background: pathname.includes("community") ? "rgba(15,165,115,0.08)" : "transparent" }}>
            <span style={{ fontSize: 16 }}>💬</span>
            <span style={{ fontSize: 14, color: pathname.includes("community") ? "#0fa573" : "var(--text-muted)" }}>커뮤니티</span>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
          <p style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", padding: "4px 10px 8px" }}>프리미엄</p>
          {PREMIUM_NAV.map((item) => {
            const unlocked = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER[item.plan];
            return (
              <div key={item.key} onClick={() => go(unlocked ? "/dashboard/" + item.key : "/dashboard/pricing")}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer", minHeight: 44, opacity: unlocked ? 1 : 0.55 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.label}</span>
                </div>
                {!unlocked && <span style={{ fontSize: 10 }}>🔒</span>}
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 16px 24px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <button onClick={onLogout} style={{
            width: "100%", padding: "13px", borderRadius: 12, minHeight: 44,
            background: "rgba(232,68,90,0.08)", border: "1px solid rgba(232,68,90,0.25)",
            color: "#e8445a", fontWeight: 700, fontSize: 14, cursor: "pointer"
          }}>로그아웃</button>
        </div>
      </div>
    </div>
  );
}

export function MobileHeader({ onMoreClick }) {
  const router = useRouter();
  const { tenants } = useApp();
  const { theme, toggleTheme } = useTheme();
  const unpaidCount = tenants.filter((t) => t.status === "미납").length;
  return (
    <div className="mobile-header" style={{
      display: "none", position: "sticky", top: 0, zIndex: 200,
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      padding: "10px 16px", alignItems: "center", justifyContent: "space-between",
      boxShadow: "0 1px 8px rgba(26,39,68,0.06)",
    }}>
      <OwnlyLogo size="sm" onClick={() => router.push("/dashboard")} />
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {unpaidCount > 0 && (
          <button onClick={() => router.push("/dashboard/payments")} style={{ position: "relative", width: 36, height: 36, borderRadius: 10, border: "none", background: "rgba(232,68,90,0.1)", cursor: "pointer", fontSize: 16 }}>
            💰
            <span style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: "#e8445a", color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{unpaidCount}</span>
          </button>
        )}
        <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "var(--surface3)", cursor: "pointer", fontSize: 16 }}>{theme === "light" ? "🌙" : "☀️"}</button>
        <button onClick={onMoreClick} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "var(--surface3)", color: "var(--text)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
      </div>
    </div>
  );
}

export function Sidebar({ onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenants, user, userPlan } = useApp();
  const { theme, toggleTheme } = useTheme();
  const unpaidCount = tenants.filter((t) => t.status === "미납").length;
  const expiringCount = tenants.filter((t) => daysLeft(t.end) <= 90).length;
  const alerts = { payments: unpaidCount, tenants: expiringCount };
  const planMeta = {
    free: { label: "무료 플랜", color: "#8a8a9a", bg: "rgba(138,138,154,0.08)", dot: "#b0aead" },
    starter: { label: "스타터 플랜", color: "#1a2744", bg: "rgba(26,39,68,0.06)", dot: "#1a2744" },
    starter_plus: { label: "스타터+ 플랜", color: "#0fa573", bg: "rgba(15,165,115,0.08)", dot: "#0fa573" },
    pro: { label: "프로 플랜", color: "#c9920a", bg: "rgba(201,146,10,0.08)", dot: "#c9920a" },
  };
  const currentPlan = userPlan || "free";
  const pm = planMeta[currentPlan] || planMeta.free;
  const email = user?.email || "";
  const initial = email ? email[0].toUpperCase() : "U";
  const displayName = email.split("@")[0] || "사용자";
  return (
    <aside className="desktop-sidebar" style={{
      width: 220, height: "100vh", background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)", position: "fixed", top: 0, left: 0,
      display: "flex", flexDirection: "column", zIndex: 100, overflow: "hidden",
      boxShadow: "2px 0 20px var(--shadow)"
    }}>
      <div style={{ padding: "16px 20px 12px" }}>
        <OwnlyLogo size="md" onClick={() => router.push("/dashboard")} />
      </div>
      <div onClick={() => router.push("/dashboard/pricing")} style={{
        margin: "0 14px 6px", padding: "10px 14px", borderRadius: 12,
        background: pm.bg, border: `1px solid ${pm.dot}22`, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: pm.dot }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: pm.color }}>{pm.label}</span>
        </div>
        {currentPlan === "free" && (
          <span style={{ fontSize: 9, color: "#1a2744", fontWeight: 800, letterSpacing: ".5px", background: "rgba(26,39,68,0.1)", padding: "3px 8px", borderRadius: 20, textTransform: "uppercase" }}>업그레이드</span>
        )}
      </div>
      <div style={{ height: 1, background: "var(--border)", margin: "8px 14px 14px" }} />
      <nav style={{ padding: "0 10px", flex: 1, overflowY: "auto", paddingBottom: 4 }}>
        <p style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", padding: "0 10px 6px" }}>메뉴</p>
        {NAV.slice(0, 10).map((item) => {
          const isActive = pathname === "/dashboard/" + item.key || (item.key === "dashboard" && pathname === "/dashboard");
          const badge = alerts[item.key];
          return (
            <div key={item.key} onClick={() => router.push(item.key === "dashboard" ? "/dashboard" : "/dashboard/" + item.key)}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 10, marginBottom: 1, cursor: "pointer", borderLeft: "2.5px solid " + (isActive ? "#1a2744" : "transparent") }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>{NAV_ICONS[item.key] || item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--text)" : "var(--text-muted)" }}>{item.label}</span>
              </div>
              {badge > 0 && <span style={{ fontSize: 10, fontWeight: 800, background: "#e8445a", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>{badge}</span>}
            </div>
          );
        })}
        <div style={{ height: 1, background: "#f0efe9", margin: "6px 4px" }} />
        <p style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", padding: "0 10px 6px" }}>프리미엄</p>
        {PREMIUM_NAV.map((item) => {
          const isActive = pathname.includes(item.key);
          const unlocked = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER[item.plan];
          return (
            <div key={item.key} onClick={() => unlocked ? router.push("/dashboard/" + item.key) : router.push("/dashboard/pricing")}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 10, marginBottom: 1, cursor: "pointer", borderLeft: "2.5px solid " + (isActive ? "#5b4fcf" : "transparent"), opacity: unlocked ? 1 : 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#5b4fcf" : "var(--text-muted)" }}>{item.label}</span>
              </div>
              {!unlocked && <span style={{ fontSize: 9 }}>🔒</span>}
            </div>
          );
        })}
        <div style={{ height: 1, background: "#f0efe9", margin: "6px 4px" }} />
        {(() => {
          const isActive = pathname.includes("community");
          return (
            <div onClick={() => router.push("/dashboard/community")} className={"nav-item" + (isActive ? " active" : "")}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 10, marginBottom: 1, cursor: "pointer", borderLeft: "2.5px solid " + (isActive ? "#0fa573" : "transparent") }}>
              <span style={{ fontSize: 15 }}>💬</span>
              <span style={{ fontSize: 13.5, fontWeight: isActive ? 700 : 500, color: isActive ? "#0fa573" : "var(--text-muted)" }}>커뮤니티</span>
            </div>
          );
        })()}
        <div style={{ height: 1, background: "#f0efe9", margin: "6px 4px" }} />
        <p style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", padding: "0 10px 6px" }}>계정</p>
        {[NAV[10], NAV[11]].filter(Boolean).map((item) => {
          const isActive = pathname.includes(item.key);
          return (
            <div key={item.key} onClick={() => router.push("/dashboard/" + item.key)}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 10, marginBottom: 1, cursor: "pointer", borderLeft: "2.5px solid " + (isActive ? "#1a2744" : "transparent") }}>
              <span style={{ fontSize: 14 }}>{NAV_ICONS[item.key] || item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--text)" : "var(--text-muted)" }}>{item.label}</span>
            </div>
          );
        })}
      </nav>
      <div style={{ padding: "10px 14px 12px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12, background: "var(--surface2)", marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #1a2744, #5b4fcf)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{initial}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
          </div>
          <button onClick={toggleTheme} className="theme-toggle" title={theme === "light" ? "다크모드" : "라이트모드"}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
        {["kcsungminkim@gmail.com"].includes(email) && (
          <button onClick={() => router.push("/dashboard/admin")}
            style={{ width: "100%", padding: "8px", borderRadius: 10, marginBottom: 8, background: "linear-gradient(135deg,rgba(26,39,68,0.06),rgba(91,79,207,0.06))", border: "1px solid rgba(26,39,68,0.15)", color: "#1a2744", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#1a2744,#2d4270)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(26,39,68,0.06),rgba(91,79,207,0.06))"; e.currentTarget.style.color = "#1a2744"; }}>
            🛠️ 관리자 패널
          </button>
        )}
        <button onClick={onLogout} style={{ width: "100%", padding: "9px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,68,90,0.07)"; e.currentTarget.style.borderColor = "rgba(232,68,90,0.3)"; e.currentTarget.style.color = "#e8445a"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
