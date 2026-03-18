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
          color: "var(--text)", letterSpacing: "-0.5px", lineHeight: 1
        }}>?⑤━</span>
        {size === "md" && (
          <div style={{ fontSize: 9, color: "#a0a0b0", letterSpacing: "1.5px", fontWeight: 500, marginTop: 2 }}>?꾨? ?먯궛 愿由??뚮옯??/div>
        )}
      </div>
    </div>
  );
}

const NAV_ICONS = {
  dashboard: "??, properties: "?룧", tenants: "?뫀", payments: "?뮥",
  contracts: "?뱷", calendar: "?뱟", vacancy: "?슞", certified: "?벂",
  repairs: "?뵪", ledger: "?뱬", renewal: "?봽", "report-pdf": "?뱞",
  reports: "?뱤", tax: "?㎨", settings: "?숋툘", pricing: "?뭿", community: "?뮠",
};

const PLAN_ORDER = { free: 0, plus: 1, pro: 2 };

const PREMIUM_NAV = [
  { key: "market/price-tracker",   icon: "📈", label: "시세 트래커",     plan: "plus" },
  { key: "market/yield-benchmark", icon: "📊", label: "수익률 벤치마크",  plan: "plus" },
  { key: "market/vacancy-risk",    icon: "📉", label: "공실 위험 지수",   plan: "pro"  },
  { key: "market/valuation",       icon: "🏠", label: "매물 가치 추정",   plan: "pro"  },
  { key: "premium/roi", icon: "?뮥", label: "?섏씡瑜?怨꾩궛湲?, plan: "plus" },
  { key: "premium/rent-increase", icon: "?뱢", label: "?꾨?猷??몄긽 怨꾩궛湲?, plan: "plus" },
  { key: "premium/deposit-return", icon: "?뵎", label: "蹂댁쬆湲?諛섑솚 怨꾩궛湲?, plan: "plus" },
  { key: "premium/vacancy", icon: "?뱣", label: "怨듭떎 ?먯떎 怨꾩궛湲?, plan: "plus" },
  { key: "premium/lease-check", icon: "?뽳툘", label: "?꾨?李?3踰?, plan: "plus" },
  { key: "premium/map-search", icon: "?뿺截?, label: "二쇰? 留ㅻЪ 議고쉶", plan: "pro" },
  { key: "premium/ai-report", icon: "?쨼", label: "AI ?낆? 遺꾩꽍", plan: "pro" },
  { key: "premium/kakao-alert", icon: "?뮠", label: "移댁뭅???섍툑 ?뚮┝", plan: "pro" },
  { key: "premium/global-reports", icon: "?뙋", label: "湲濡쒕쾶 由ы룷??, plan: "plus" },
];

const BOTTOM_TABS = [
  { key: "dashboard", icon: "??, label: "?? },
  { key: "tenants", icon: "?뫀", label: "?몄엯?? },
  { key: "payments", icon: "?뮥", label: "?섍툑" },
  { key: "contracts", icon: "?뱷", label: "怨꾩빟" },
  { key: "more", icon: "??, label: "?붾낫湲? },
];

export function BottomNav({ onMore }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenants } = useApp();
  const unpaidCount = tenants.filter((t) => t.status === "誘몃궔").length;

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
  const [docsOpen,    setDocsOpen]    = useState(pathname.includes("/certified") || pathname.includes("/repairs") || pathname.includes("/ledger") || pathname.includes("/report") || pathname.includes("/tax"));
  const [premiumOpen, setPremiumOpen] = useState(pathname.includes("/premium"));

  if (!open) return null;
  const go = (path) => { router.push(path); onClose(); };

  const Item = ({ icon, label, path, activeColor = "#1a2744" }) => {
    const isActive = path === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(path);
    return (
      <div onClick={() => go(path)} style={{
        display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
        borderRadius: 10, marginBottom: 2, cursor: "pointer", minHeight: 46,
        background: isActive ? `${activeColor}12` : "transparent",
        borderLeft: `2.5px solid ${isActive ? activeColor : "transparent"}`,
      }}>
        <span style={{ fontSize: 17 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: isActive ? 700 : 500, color: isActive ? activeColor : "#4a5568" }}>{label}</span>
      </div>
    );
  };

  const AccHeader = ({ label, open, onToggle, color = "#94a3b8" }) => (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 6px", cursor: "pointer" }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color }}>{label}</span>
      <span style={{ fontSize: 12, color, transition: "transform .2s", transform: open ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>??/span>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.4)", animation: "fade-in .15s ease" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: "min(300px, 88vw)", background: "var(--surface)",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <OwnlyLogo size="sm" onClick={() => go("/dashboard")} />
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "var(--surface3)", color: "var(--text)", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>??/button>
        </div>
        <div style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
          <Item icon="?? label="??쒕낫?? path="/dashboard" />
          <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />

          <p style={{ fontSize: 10.5, color: "var(--text-faint)", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 12px 6px" }}>?꾨? 愿由?/p>
          <Item icon="?룧" label="臾쇨굔 愿由? path="/dashboard/properties" />
          <Item icon="?뫀" label="?몄엯??     path="/dashboard/tenants" />
          <Item icon="?뮥" label="?섍툑 ?꾪솴"  path="/dashboard/payments" />
          <Item icon="?뱟" label="罹섎┛??     path="/dashboard/calendar" />
          <Item icon="?봽" label="媛깆떊 ?섑뼢"  path="/dashboard/renewal" />
          <Item icon="?슞" label="怨듭떎 愿由?  path="/dashboard/vacancy" />

          <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
          <AccHeader label="臾몄꽌쨌湲곕줉" open={docsOpen} onToggle={() => setDocsOpen(o => !o)} />
          {docsOpen && (
            <>
              <Item icon="?벂" label="?댁슜利앸챸"   path="/dashboard/certified" />
              <Item icon="?뵪" label="?섎━ ?대젰"   path="/dashboard/repairs" />
              <Item icon="?뱬" label="媛꾪렪 ?λ?"   path="/dashboard/ledger" />
              <Item icon="?뱞" label="?섏씡 由ы룷?? path="/dashboard/report-pdf" />
              <Item icon="?뱤" label="由ы룷??      path="/dashboard/reports" />
              <Item icon="?㎨" label="?멸툑 愿由?   path="/dashboard/tax" />
            </>
          )}

          <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
          <AccHeader label="?꾨━誘몄뾼 ?꾧뎄" open={premiumOpen} onToggle={() => setPremiumOpen(o => !o)} color="#c9920a" />
          {premiumOpen && PREMIUM_NAV.map((item) => {
            const unlocked = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER[item.plan];
            return (
              <div key={item.key} onClick={() => go(unlocked ? "/dashboard/" + item.key : "/dashboard/pricing")}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer", minHeight: 40, opacity: unlocked ? 1 : 0.55 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, color: "#4a5568" }}>{item.label}</span>
                </div>
                {!unlocked && <span style={{ fontSize: 10 }}>?뵏</span>}
              </div>
            );
          })}

          <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
          <Item icon="?뮠" label="而ㅻ??덊떚" path="/dashboard/community" activeColor="#0fa573" />
          <Item icon="?숋툘" label="?ㅼ젙"      path="/dashboard/settings" />
          <Item icon="?뭿" label="援щ룆 ?뚮옖"  path="/dashboard/pricing" />
        </div>
        <div style={{ padding: "12px 16px 24px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <button onClick={onLogout} style={{ width: "100%", padding: "13px", borderRadius: 12, minHeight: 44, background: "rgba(232,68,90,0.08)", border: "1px solid rgba(232,68,90,0.25)", color: "#e8445a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>濡쒓렇?꾩썐</button>
        </div>
      </div>
    </div>
  );
}

export function MobileHeader({ onMoreClick }) {
  const router = useRouter();
  const { tenants } = useApp();
  const unpaidCount = tenants.filter((t) => t.status === "誘몃궔").length;
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
            ?뮥
            <span style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: "#e8445a", color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{unpaidCount}</span>
          </button>
        )}
        <button onClick={onMoreClick} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "var(--surface3)", color: "var(--text)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>??/button>
      </div>
    </div>
  );
}

export function Sidebar({ onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenants, user, userPlan } = useApp();
  const unpaidCount    = tenants.filter((t) => t.status === "誘몃궔").length;
  const expiringCount  = tenants.filter((t) => daysLeft(t.end) <= 90).length;

  const inDocs    = ["/certified","/repairs","/ledger","/report-pdf","/renewal","/reports","/tax"].some(p => pathname.includes(p));
  const inPremium = pathname.includes("/premium");
  const [docsOpen,    setDocsOpen]    = useState(inDocs);
  const [premiumOpen, setPremiumOpen] = useState(inPremium);

  const planMeta = {
    free:         { label: "臾대즺 ?뚮옖",    color: "#8a8a9a", bg: "rgba(138,138,154,0.08)", dot: "#b0aead" },
    
    plus: { label: "?뚮윭???뚮옖", color: "#4f46e5", bg: "rgba(79,70,229,0.08)", dot: "#4f46e5" },
    pro:          { label: "?꾨줈 ?뚮옖",    color: "#c9920a", bg: "rgba(201,146,10,0.08)",   dot: "#c9920a" },
  };
  const pm           = planMeta[userPlan || "free"] || planMeta.free;
  const email        = user?.email || "";
  const initial      = email ? email[0].toUpperCase() : "U";
  const displayName  = email.split("@")[0] || "?ъ슜??;

  const NavItem = ({ icon, label, path, badge, activeColor = "#1a2744" }) => {
    const isActive = path === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(path);
    return (
      <div onClick={() => router.push(path)}
        className={"nav-item" + (isActive ? " active" : "")}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 10px", borderRadius: 10, marginBottom: 1, cursor: "pointer",
          borderLeft: `2.5px solid ${isActive ? activeColor : "transparent"}`,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
          <span style={{ fontSize: 14.5, fontWeight: isActive ? 700 : 500, color: isActive ? activeColor : "#4a5568" }}>{label}</span>
        </div>
        {badge > 0 && (
          <span style={{ fontSize: 10, fontWeight: 800, background: "#e8445a", color: "#fff", padding: "2px 6px", borderRadius: 20, minWidth: 18, textAlign: "center" }}>{badge}</span>
        )}
      </div>
    );
  };

  const SectionHeader = ({ label, open, onToggle, color = "#94a3b8" }) => (
    <div onClick={onToggle}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px 6px", cursor: "pointer", userSelect: "none", marginTop: 2 }}>
      <span style={{ fontSize: 10.5, color, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 11, color, transition: "transform .2s", transform: open ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", lineHeight: 1 }}>??/span>
    </div>
  );

  return (
    <aside className="desktop-sidebar" style={{
      width: 230, height: "100vh", background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)", position: "fixed", top: 0, left: 0,
      display: "flex", flexDirection: "column", zIndex: 100, overflow: "hidden",
      boxShadow: "2px 0 20px var(--shadow)"
    }}>
      {/* 濡쒓퀬 */}
      <div style={{ padding: "16px 20px 10px", flexShrink: 0 }}>
        <OwnlyLogo size="md" onClick={() => router.push("/dashboard")} />
      </div>

      {/* ?뚮옖 諛곗? */}
      <div onClick={() => router.push("/dashboard/pricing")} style={{
        margin: "0 14px 6px", padding: "9px 13px", borderRadius: 12,
        background: pm.bg, border: `1px solid ${pm.dot}22`,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: pm.dot }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: pm.color }}>{pm.label}</span>
        </div>
        {(userPlan || "free") === "free" && (
          <span style={{ fontSize: 9, color: "#fff", fontWeight: 800, background: "#1a2744", padding: "2px 8px", borderRadius: 20 }}>UP</span>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "2px 14px 6px", flexShrink: 0 }} />

      {/* ?ㅽ겕濡??곸뿭 */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0 10px 8px" }}>

        {/* ??쒕낫??*/}
        <NavItem icon="?? label="??쒕낫?? path="/dashboard" />

        <div style={{ height: 1, background: "var(--border)", margin: "5px 4px 6px" }} />

        {/* ?? ?꾨? 愿由?(??긽 ?쒖떆) ?? */}
        <p style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", padding: "2px 10px 6px" }}>?꾨? 愿由?/p>
        <NavItem icon="?룧" label="臾쇨굔 愿由?  path="/dashboard/properties" />
        <NavItem icon="?뫀" label="?몄엯??      path="/dashboard/tenants"    badge={expiringCount} />
        <NavItem icon="?뮥" label="?섍툑 ?꾪솴"   path="/dashboard/payments"   badge={unpaidCount} />
        <NavItem icon="?뱟" label="罹섎┛??      path="/dashboard/calendar" />
        <NavItem icon="?봽" label="媛깆떊 ?섑뼢"   path="/dashboard/renewal" />
        <NavItem icon="?슞" label="怨듭떎 愿由?   path="/dashboard/vacancy" />

        <div style={{ height: 1, background: "var(--border)", margin: "5px 4px" }} />

        {/* ?? 臾몄꽌쨌湲곕줉 (?꾩퐫?붿뼵) ?? */}
        <SectionHeader label="臾몄꽌쨌湲곕줉" open={docsOpen} onToggle={() => setDocsOpen(o => !o)} />
        {docsOpen && (
          <div style={{ animation: "sb-fade .15s ease" }}>
            {/* ?댁슜利앸챸 ??plus+ */}
            {(() => {
              const ok = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER["plus"];
              return (
                <div onClick={() => router.push(ok ? "/dashboard/certified" : "/dashboard/pricing")}
                  className={"nav-item" + (pathname.includes("/certified") ? " active" : "")}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:10, marginBottom:1, cursor:"pointer",
                    borderLeft: `2.5px solid ${pathname.includes("/certified") ? "#5b4fcf" : "transparent"}`,
                    opacity: ok ? 1 : 0.45 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <span style={{ fontSize:15 }}>?벂</span>
                    <span style={{ fontSize:14, fontWeight: pathname.includes("/certified") ? 700 : 500, color: pathname.includes("/certified") ? "#5b4fcf" : ok ? "#4a5568" : "#9ca3af" }}>?댁슜利앸챸</span>
                  </div>
                  {!ok && <span style={{ fontSize:9 }}>?뵏</span>}
                </div>
              );
            })()}
            <NavItem icon="?뵪" label="?섎━ ?대젰"   path="/dashboard/repairs" />
            <NavItem icon="?뱬" label="媛꾪렪 ?λ?"   path="/dashboard/ledger" />
            {/* ?섏씡 由ы룷????plus+ */}
            {(() => {
              const ok = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER["plus"];
              return (
                <div onClick={() => router.push(ok ? "/dashboard/report-pdf" : "/dashboard/pricing")}
                  className={"nav-item" + (pathname.includes("/report-pdf") ? " active" : "")}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:10, marginBottom:1, cursor:"pointer",
                    borderLeft: `2.5px solid ${pathname.includes("/report-pdf") ? "#5b4fcf" : "transparent"}`,
                    opacity: ok ? 1 : 0.45 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <span style={{ fontSize:15 }}>?뱞</span>
                    <span style={{ fontSize:14, fontWeight: pathname.includes("/report-pdf") ? 700 : 500, color: pathname.includes("/report-pdf") ? "#5b4fcf" : ok ? "#4a5568" : "#9ca3af" }}>?섏씡 由ы룷??/span>
                  </div>
                  {!ok && <span style={{ fontSize:9 }}>?뵏</span>}
                </div>
              );
            })()}
            {/* 由ы룷????plus+ */}
            {(() => {
              const ok = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER["plus"];
              return (
                <div onClick={() => router.push(ok ? "/dashboard/reports" : "/dashboard/pricing")}
                  className={"nav-item" + (pathname.includes("/dashboard/reports") ? " active" : "")}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:10, marginBottom:1, cursor:"pointer",
                    borderLeft: `2.5px solid ${pathname.includes("/dashboard/reports") ? "#5b4fcf" : "transparent"}`,
                    opacity: ok ? 1 : 0.45 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <span style={{ fontSize:15 }}>?뱤</span>
                    <span style={{ fontSize:14, fontWeight: pathname.includes("/dashboard/reports") ? 700 : 500, color: pathname.includes("/dashboard/reports") ? "#5b4fcf" : ok ? "#4a5568" : "#9ca3af" }}>由ы룷??/span>
                  </div>
                  {!ok && <span style={{ fontSize:9 }}>?뵏</span>}
                </div>
              );
            })()}
            {/* ?멸툑 愿由???plus+ */}
            {(() => {
              const ok = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER["plus"];
              return (
                <div onClick={() => router.push(ok ? "/dashboard/tax" : "/dashboard/pricing")}
                  className={"nav-item" + (pathname.includes("/tax") ? " active" : "")}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:10, marginBottom:1, cursor:"pointer",
                    borderLeft: `2.5px solid ${pathname.includes("/tax") ? "#5b4fcf" : "transparent"}`,
                    opacity: ok ? 1 : 0.45 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <span style={{ fontSize:15 }}>?㎨</span>
                    <span style={{ fontSize:14, fontWeight: pathname.includes("/tax") ? 700 : 500, color: pathname.includes("/tax") ? "#5b4fcf" : ok ? "#4a5568" : "#9ca3af" }}>?멸툑 愿由?/span>
                  </div>
                  {!ok && <span style={{ fontSize:9 }}>?뵏</span>}
                </div>
              );
            })()}
          </div>
        )}

        <div style={{ height: 1, background: "var(--border)", margin: "5px 4px" }} />

        {/* ?? ?꾨━誘몄뾼 ?꾧뎄 (?꾩퐫?붿뼵) ?? */}
        <SectionHeader
          label="?꾨━誘몄뾼 ?꾧뎄" open={premiumOpen}
          onToggle={() => setPremiumOpen(o => !o)} color="#c9920a"
        />
        {premiumOpen && (
          <div style={{ animation: "sb-fade .15s ease" }}>
            {PREMIUM_NAV.map((item) => {
              const isActive  = pathname.includes(item.key);
              const unlocked  = PLAN_ORDER[userPlan || "free"] >= PLAN_ORDER[item.plan];
              return (
                <div key={item.key}
                  onClick={() => router.push(unlocked ? "/dashboard/" + item.key : "/dashboard/pricing")}
                  className={"nav-item" + (isActive ? " active" : "")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 10px", borderRadius: 10, marginBottom: 1, cursor: "pointer",
                    borderLeft: `2.5px solid ${isActive ? "#5b4fcf" : "transparent"}`,
                    opacity: unlocked ? 1 : 0.5,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "#5b4fcf" : "#4a5568" }}>{item.label}</span>
                  </div>
                  {!unlocked && <span style={{ fontSize: 9 }}>?뵏</span>}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 1, background: "var(--border)", margin: "5px 4px" }} />

        {/* 而ㅻ??덊떚 */}
        <NavItem icon="?뮠" label="而ㅻ??덊떚" path="/dashboard/community" activeColor="#0fa573" />

        <div style={{ height: 1, background: "var(--border)", margin: "5px 4px" }} />

        {/* 怨꾩젙 */}
        <NavItem icon="?숋툘" label="?ㅼ젙"      path="/dashboard/settings" />
        <NavItem icon="?뭿" label="援щ룆 ?뚮옖"  path="/dashboard/pricing" />

      </nav>

      {/* ?섎떒 ?좎? ?곸뿭 */}
      <div style={{ padding: "10px 14px 14px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12, background: "var(--surface2)", marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a2744,#5b4fcf)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{initial}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
          </div>
        </div>
        {["k.sungminkim@gmail.com"].includes(email) && (
          <button onClick={() => router.push("/dashboard/admin")}
            style={{ width: "100%", padding: "7px", borderRadius: 10, marginBottom: 6, background: "rgba(26,39,68,0.06)", border: "1px solid rgba(26,39,68,0.12)", color: "#1a2744", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
            ?썳截?愿由ъ옄 ?⑤꼸
          </button>
        )}
        <button onClick={onLogout}
          style={{ width: "100%", padding: "8px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,68,90,0.07)"; e.currentTarget.style.borderColor = "rgba(232,68,90,0.3)"; e.currentTarget.style.color = "#e8445a"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          濡쒓렇?꾩썐
        </button>
      </div>

      <style>{`
        @keyframes sb-fade { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </aside>
  );
}

