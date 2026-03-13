"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { C, NAV, daysLeft } from "../lib/constants";
import { useApp } from "../context/AppContext";

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
          color: "#1a2744", letterSpacing: "-0.5px", lineHeight: 1
        }}>온리</span>
        {size === "md" && (
          <div style={{ fontSize: 9, color: "#a0a0b0", letterSpacing: "1.5px", fontWeight: 500, marginTop: 2 }}>Ownly by McLean</div>
        )}
      </div>
    </div>
  );
}

const NAV_ICONS = {
  dashboard:  "⊞", properties: "🏠", tenants: "👤", payments: "💰",
  contracts:  "📝", calendar: "📅", vacancy: "🚪", certified: "📨",
  reports:    "📊", tax: "🧾", settings: "⚙️", pricing: "💎", community: "💬",
};

const PLAN_ORDER = { free: 0, starter: 1, starter_plus: 2, pro: 3 };

const PREMIUM_NAV = [
  { key: "premium/roi",         icon: "💰", label: "수익률 계산기",    plan: "starter_plus" },
  { key: "premium/vacancy",     icon: "📉", label: "공실 손실 계산기", plan: "starter_plus" },
  { key: "premium/lease-check", icon: "⚖️",  label: "임대차 3법",       plan: "starter_plus" },
  { key: "premium/map-search",  icon: "🗺️",  label: "주변 매물 조회",   plan: "pro" },
  { key: "premium/ai-report",   icon: "🤖", label: "AI 입지 분석",     plan: "pro" },
  { key: "premium/kakao-alert",    icon: "💬", label: "카카오 수금 알림",  plan: "pro" },
  { key: "premium/global-reports",  icon: "🌐", label: "글로벌 리포트",      plan: "starter_plus" },
];

export function MobileHeader({ onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { userPlan } = useApp();

  return (
    <>
      <div className="mobile-header" style={{
        display: "none", position: "sticky", top: 0, zIndex: 200,
        background: "#ffffff", borderBottom: "1px solid #e8e6e0",
        padding: "10px 16px", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 8px rgba(26,39,68,0.06)"
      }}>
        <OwnlyLogo size="sm" onClick={() => router.push("/dashboard")} />
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: "#1a2744", fontSize: 22, cursor: "pointer", padding: 4 }}>
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div style={{
          position: "fixed", inset: 0, top: 52, zIndex: 199,
          background: "#ffffff", padding: 16, animation: "fade-in .2s ease"
        }}>
          {NAV.map((n) => {
            const isActive = pathname.includes(n.key);
            return (
              <div key={n.key}
                onClick={() => { router.push(n.key === "dashboard" ? "/dashboard" : "/dashboard/" + n.key); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
                  borderRadius: 12, marginBottom: 3, cursor: "pointer",
                  background: isActive ? "rgba(26,39,68,0.07)" : "transparent"
                }}
              >
                <span style={{ fontSize: 17 }}>{NAV_ICONS[n.key] || n.icon}</span>
                <span style={{ fontSize: 15, fontWeight: isActive ? 700 : 500, color: isActive ? "#1a2744" : "#6a6a7a" }}>{n.label}</span>
              </div>
            );
          })}
          <div style={{ height: 1, background: "#f0efe9", margin: "8px 0" }} />
          <div onClick={() => { router.push("/dashboard/community"); setOpen(false); }}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:12, marginBottom:3, cursor:"pointer", background: pathname.includes("community") ? "rgba(15,165,115,0.07)" : "transparent" }}>
            <span style={{ fontSize:16 }}>💬</span>
            <span style={{ fontSize:14, fontWeight: pathname.includes("community") ? 700 : 500, color: pathname.includes("community") ? "#0fa573" : "#6a6a7a" }}>커뮤니티</span>
          </div>
          <div style={{ height: 1, background: "#f0efe9", margin: "8px 0" }} />
          <p style={{ fontSize: 10, color: "#b0aead", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", padding: "8px 14px 4px" }}>프리미엄</p>
          {PREMIUM_NAV.map((item) => {
            const isActive = pathname.includes(item.key);
            const unlocked = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER[item.plan];
            return (
              <div key={item.key}
                onClick={() => { unlocked ? router.push("/dashboard/" + item.key) : router.push("/dashboard/pricing"); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 12, marginBottom: 3, cursor: "pointer", background: isActive ? "rgba(91,79,207,0.07)" : "transparent", opacity: unlocked ? 1 : 0.55 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "#5b4fcf" : "#6a6a7a" }}>{item.label}</span>
                </div>
                {!unlocked && <span style={{ fontSize: 10 }}>🔒</span>}
              </div>
            );
          })}
          <button onClick={onLogout} style={{
            marginTop: 12, padding: "12px", width: "100%", borderRadius: 12,
            background: "rgba(232,68,90,0.08)", border: "1px solid rgba(232,68,90,0.25)",
            color: "#e8445a", fontWeight: 700, fontSize: 14, cursor: "pointer"
          }}>로그아웃</button>
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

  const planMeta = {
    free:    { label: "무료 플랜",  color: "#8a8a9a", bg: "rgba(138,138,154,0.08)", dot: "#b0aead" },
    starter: { label: "스타터 플랜", color: "#1a2744", bg: "rgba(26,39,68,0.06)",   dot: "#1a2744" },
    pro:     { label: "프로 플랜",   color: "#c9920a", bg: "rgba(201,146,10,0.08)", dot: "#c9920a" },
  };
  const currentPlan = userPlan || "free";
  const pm = planMeta[currentPlan];

  const email = user?.email || "";
  const initial = email ? email[0].toUpperCase() : "U";
  const displayName = email.split("@")[0] || "사용자";

  return (
    <aside className="desktop-sidebar" style={{
      width: 220, height: "100vh", background: "#ffffff",
      borderRight: "1px solid #ebe9e3", position: "fixed", top: 0, left: 0,
      display: "flex", flexDirection: "column", zIndex: 100, overflow: "hidden",
      boxShadow: "2px 0 20px rgba(26,39,68,0.05)"
    }}>
      {/* 로고 */}
      <div style={{ padding: "16px 20px 12px" }}>
        <OwnlyLogo size="md" onClick={() => router.push("/dashboard")} />
      </div>

      {/* 플랜 뱃지 */}
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
          <span style={{
            fontSize: 9, color: "#1a2744", fontWeight: 800, letterSpacing: ".5px",
            background: "rgba(26,39,68,0.1)", padding: "3px 8px", borderRadius: 20, textTransform: "uppercase"
          }}>업그레이드</span>
        )}
      </div>

      <div style={{ height: 1, background: "#f0efe9", margin: "8px 14px 14px" }} />

      {/* 메인 메뉴 */}
      <nav style={{ padding: "0 10px", flex: 1, overflowY: "auto", paddingBottom: 4 }}>
        <p style={{ fontSize: 9, color: "#c0bdb8", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", padding: "0 10px 6px" }}>메뉴</p>
        {NAV.slice(0, 10).map((item) => {
          const isActive = pathname === "/dashboard/" + item.key || (item.key === "dashboard" && pathname === "/dashboard");
          const badge = alerts[item.key];
          return (
            <div key={item.key}
              onClick={() => router.push(item.key === "dashboard" ? "/dashboard" : "/dashboard/" + item.key)}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 10px", borderRadius: 10, marginBottom: 1, cursor: "pointer",
                borderLeft: "2.5px solid " + (isActive ? "#1a2744" : "transparent")
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>{NAV_ICONS[item.key] || item.icon}</span>
                <span style={{
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#1a2744" : "#7a7a8a",
                  letterSpacing: isActive ? "-.2px" : "0"
                }}>{item.label}</span>
              </div>
              {badge > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, background: "#e8445a", color: "#fff",
                  padding: "2px 7px", borderRadius: 20
                }}>{badge}</span>
              )}
            </div>
          );
        })}

        <div style={{ height: 1, background: "#f0efe9", margin: "6px 4px 6px" }} />

        {/* 프리미엄 기능 섹션 */}
        <p style={{ fontSize: 9, color: "#c0bdb8", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", padding: "0 10px 6px" }}>프리미엄</p>
        {PREMIUM_NAV.map((item) => {
          const isActive = pathname.includes(item.key);
          const unlocked = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER[item.plan];
          return (
            <div key={item.key}
              onClick={() => unlocked ? router.push("/dashboard/" + item.key) : router.push("/dashboard/pricing")}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 10px", borderRadius: 10, marginBottom: 1, cursor: "pointer",
                borderLeft: "2.5px solid " + (isActive ? "#5b4fcf" : "transparent"),
                opacity: unlocked ? 1 : 0.5,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
                <span style={{
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#5b4fcf" : "#7a7a8a",
                }}>{item.label}</span>
              </div>
              {!unlocked && <span style={{ fontSize: 9 }}>🔒</span>}
            </div>
          );
        })}

        <div style={{ height: 1, background: "#f0efe9", margin: "6px 4px 6px" }} />

        {/* 커뮤니티 */}
        {(() => {
          const isActive = pathname.includes("community");
          return (
            <div onClick={() => router.push("/dashboard/community")}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 10px", borderRadius:10, marginBottom:1, cursor:"pointer", borderLeft:"2.5px solid "+(isActive?"#0fa573":"transparent") }}>
              <span style={{ fontSize:15 }}>💬</span>
              <span style={{ fontSize:13.5, fontWeight:isActive?700:500, color:isActive?"#0fa573":"#7a7a8a" }}>커뮤니티</span>
            </div>
          );
        })()}

        <div style={{ height: 1, background: "#f0efe9", margin: "6px 4px 6px" }} />

        <p style={{ fontSize: 9, color: "#c0bdb8", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", padding: "0 10px 6px" }}>계정</p>
        {[NAV[10], NAV[11]].filter(Boolean).map((item) => {
          const isActive = pathname.includes(item.key);
          return (
            <div key={item.key}
              onClick={() => router.push("/dashboard/" + item.key)}
              className={"nav-item" + (isActive ? " active" : "")}
              style={{
                display: "flex", alignItems: "center", gap: 9, padding: "7px 10px",
                borderRadius: 10, marginBottom: 1, cursor: "pointer",
                borderLeft: "2.5px solid " + (isActive ? "#1a2744" : "transparent")
              }}
            >
              <span style={{ fontSize: 14 }}>{NAV_ICONS[item.key] || item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#1a2744" : "#7a7a8a" }}>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* 하단 유저 프로필 */}
      <div style={{ padding: "10px 14px 12px", borderTop: "1px solid #f0efe9" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 10px", borderRadius: 12, background: "#f8f7f4", marginBottom: 8
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #1a2744, #5b4fcf)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 14, fontWeight: 800, flexShrink: 0
          }}>{initial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
            <div style={{ fontSize: 10, color: "#8a8a9a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
          </div>
        </div>

        {/* 관리자 메뉴 — 어드민 이메일만 표시 */}
        {["k.sungminkim@gmail.com"].includes(email) && (
          <button onClick={() => router.push("/dashboard/admin")}
            style={{
              width: "100%", padding: "8px", borderRadius: 10, marginBottom: 8,
              background: "linear-gradient(135deg,rgba(26,39,68,0.06),rgba(91,79,207,0.06))",
              border: "1px solid rgba(26,39,68,0.15)",
              color: "#1a2744", fontWeight: 700, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#1a2744,#2d4270)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(26,39,68,0.06),rgba(91,79,207,0.06))"; e.currentTarget.style.color = "#1a2744"; }}>
            🛡️ 관리자 패널
          </button>
        )}

        <button onClick={onLogout} style={{
          width: "100%", padding: "9px", borderRadius: 10,
          background: "transparent", border: "1px solid #e8e6e0",
          color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer",
          transition: "all .15s"
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,68,90,0.07)"; e.currentTarget.style.borderColor = "rgba(232,68,90,0.3)"; e.currentTarget.style.color = "#e8445a"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#e8e6e0"; e.currentTarget.style.color = "#8a8a9a"; }}
        >로그아웃</button>
      </div>
    </aside>
  );
}
