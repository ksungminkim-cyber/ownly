"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { C } from "../lib/constants";

let _addToast = null;

export const Badge = ({ label, map }) => {
  const s = (map || {})[label] || { c: C.muted, bg: "#f0efe9" };
  return <span style={{ fontSize: 11, fontWeight: 700, color: s.c, background: s.bg, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>{label}</span>;
};

export const SectionLabel = ({ children }) => (
  <p style={{ fontSize: 10, color: "#1a2744", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6, opacity: 0.5 }}>{children}</p>
);

export const Spinner = ({ size = 18, color = "#1a2744" }) => (
  <span className="spin" style={{ display: "inline-block", width: size, height: size, border: `2px solid rgba(26,39,68,0.12)`, borderTopColor: color, borderRadius: "50%", flexShrink: 0 }} />
);

// ✅ PageLoader — 더 세련된 디자인
export const PageLoader = ({ message = "데이터를 불러오는 중..." }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(245,244,240,0.92)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
    <div style={{ position: "relative", width: 60, height: 60 }}>
      <span className="spin" style={{ display: "block", width: 60, height: 60, border: "2.5px solid rgba(26,39,68,0.08)", borderTopColor: "#1a2744", borderRadius: "50%" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(145deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
            <rect x="7.5" y="12" width="5" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
          </svg>
        </div>
      </div>
    </div>
    <p style={{ fontSize: 13, color: "#8a8a9a", fontWeight: 600, letterSpacing: "0.3px" }}>{message}</p>
  </div>
);

// ✅ InlineLoader — 스켈레톤 기반
export const InlineLoader = ({ rows = 3, type = "row" }) => {
  if (type === "card") return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" style={{ height: 80 }} />
      ))}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-row" />
      ))}
    </div>
  );
};

// ✅ SkeletonDashboard — 대시보드 로딩 스켈레톤
export const SkeletonDashboard = () => (
  <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
    {/* 헤더 */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div className="skeleton skeleton-text" style={{ width: 60, marginBottom: 8 }} />
        <div className="skeleton skeleton-title" style={{ width: 120 }} />
      </div>
      <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 10 }} />
    </div>
    {/* KPI 카드 */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" />)}
    </div>
    {/* 차트 */}
    <div className="skeleton" style={{ height: 180, borderRadius: 14 }} />
    {/* 테이블 행 */}
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
    </div>
  </div>
);

// ✅ SkeletonTable — 테이블 로딩 스켈레톤
export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, padding: "12px 16px", background: "#f0efe9", gap: 12 }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ width: "60%" }} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, padding: "14px 16px", borderTop: "1px solid var(--border)", gap: 12 }}>
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="skeleton skeleton-text" style={{ width: j === 0 ? "80%" : "50%" }} />
        ))}
      </div>
    ))}
  </div>
);

export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 30px rgba(26,39,68,0.12)" }}>
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.name}: {p.value}만원</p>
      ))}
    </div>
  );
};

export const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="search-box" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--surface)", boxShadow: "0 1px 4px rgba(26,39,68,0.04)" }}>
    <span style={{ fontSize: 14, opacity: 0.35 }}>🔍</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "검색..."} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13 }} />
    {value && <button onClick={() => onChange("")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>}
  </div>
);

// ✅ EmptyState — 미니 SVG 일러스트 + CTA 개선
export const EmptyState = ({ icon, title, desc, action, onAction, hint }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 24px", textAlign: "center" }}>
    {/* SVG 일러스트 배경 */}
    <div style={{ position: "relative", marginBottom: 20 }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg,rgba(26,39,68,0.05),rgba(79,70,229,0.05))", border: "1.5px dashed rgba(26,39,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }} className="empty-bounce">
        {icon || "📭"}
      </div>
      {/* 장식 점들 */}
      <div style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: "rgba(79,70,229,0.2)" }} />
      <div style={{ position: "absolute", bottom: 0, left: -6, width: 5, height: 5, borderRadius: "50%", background: "rgba(15,165,115,0.25)" }} />
    </div>
    <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.3px" }}>{title || "데이터가 없습니다"}</p>
    <p style={{ fontSize: 13, color: C.muted, marginBottom: hint || action ? 8 : 0, maxWidth: 280, lineHeight: 1.65 }}>{desc || ""}</p>
    {hint && (
      <p style={{ fontSize: 12, color: "rgba(79,70,229,0.7)", fontWeight: 600, marginBottom: action ? 18 : 0, maxWidth: 260, lineHeight: 1.6, background: "rgba(79,70,229,0.06)", padding: "6px 12px", borderRadius: 8 }}>
        💡 {hint}
      </p>
    )}
    {action && (
      <button onClick={onAction} className="btn-primary" style={{ marginTop: hint ? 0 : 10, padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg, #1a2744, #2d4270)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
        {action}
      </button>
    )}
  </div>
);

export const ConfirmDialog = ({ open, title, desc, onConfirm, onCancel, danger }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(26,39,68,0.4)", backdropFilter: "blur(8px)", animation: "modal-bg .25s ease" }} onClick={onCancel}>
      <div style={{ width: 380, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px", animation: "modal-card .3s cubic-bezier(.22,1,.36,1)", boxShadow: "0 30px 80px rgba(26,39,68,0.2)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 22, lineHeight: 1.5 }}>{desc}</p>
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border)", color: "#7a7a8a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
          <button onClick={onConfirm} className="btn-primary" style={{ flex: 1, padding: "11px", borderRadius: 12, background: danger ? "linear-gradient(135deg, #e8445a, #c4243f)" : "linear-gradient(135deg, #1a2744, #2d4270)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{danger ? "삭제" : "확인"}</button>
        </div>
      </div>
    </div>
  );
};

export const Toast = () => {
  const [toasts, setToasts] = useState([]);
  _addToast = useCallback((msg, type) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type: type || "success" }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const colors = {
    success: { bg: `rgba(15,165,115,0.08)`,  border: `rgba(15,165,115,0.25)`,  icon: "✓", c: "#0fa573" },
    error:   { bg: `rgba(232,68,90,0.08)`,   border: `rgba(232,68,90,0.25)`,   icon: "✗", c: "#e8445a" },
    warning: { bg: `rgba(232,150,10,0.08)`,  border: `rgba(232,150,10,0.25)`,  icon: "!", c: "#e8960a" },
    info:    { bg: `rgba(79,70,229,0.08)`,   border: `rgba(79,70,229,0.25)`,   icon: "i", c: "#4f46e5" },
  };
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => {
        const col = colors[t.type] || colors.success;
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14, background: "var(--surface)", border: `1px solid ${col.border}`, boxShadow: "0 8px 30px rgba(26,39,68,0.12)", animation: "toast-in .3s ease", minWidth: 260 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: col.bg, display: "flex", alignItems: "center", justifyContent: "center", color: col.c, fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{col.icon}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
};

export const Modal = ({ open, onClose, children, width, padding }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!open || !mounted) return null;
  const modal = (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(26,39,68,0.4)", backdropFilter: "blur(8px)", animation: "modal-bg .25s ease", overflowY: "hidden", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", boxSizing: "border-box" }} onClick={onClose}>
      <div style={{ width: width || 480, maxWidth: "min(calc(100vw - 40px), 100%)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, padding: padding || "32px", boxShadow: "0 40px 100px rgba(26,39,68,0.2)", animation: "modal-card .3s cubic-bezier(.22,1,.36,1)", flexShrink: 1, maxHeight: "calc(100vh - 40px)", overflowY: "auto", boxSizing: "border-box" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
  return createPortal(modal, document.body);
};

export const AuthInput = ({ label, type, placeholder, value, onChange, error, icon }) => {
  const [show, setShow] = useState(false);
  const t = type || "text";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7a8a", letterSpacing: ".5px", textTransform: "uppercase" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4, pointerEvents: "none" }}>{icon}</span>}
        <input type={t === "password" ? (show ? "text" : "password") : t} value={value} onChange={onChange} placeholder={placeholder} className="auth-input"
          style={{ width: "100%", padding: `12px ${t === "password" ? "44px" : "14px"} 12px ${icon ? "40px" : "14px"}`, fontSize: 14, color: "var(--text)", background: "var(--input-bg)", border: `1.5px solid ${error ? "#e8445a" : "var(--border)"}`, borderRadius: 12 }} />
        {t === "password" && (
          <button type="button" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: 4 }}>{show ? "Hide" : "Show"}</button>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: "#e8445a", fontWeight: 600 }}>{error}</p>}
    </div>
  );
};

export const SortButton = ({ label, active, dir, onClick }) => (
  <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${active ? "#1a2744" : "var(--border)"}`, background: active ? "rgba(26,39,68,0.07)" : "var(--surface)", color: active ? "var(--text)" : C.muted, transition: "all .15s", display: "flex", alignItems: "center", gap: 3 }}>
    {label}{active && <span style={{ fontSize: 9 }}>{dir === "asc" ? "▲" : "▼"}</span>}
  </button>
);

// ✅ PageHeader — 공통 페이지 헤더 컴포넌트 (일관성 확보)
export const PageHeader = ({ label, title, sub, actions }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }} className="page-header">
    <div>
      {label && <SectionLabel>{label}</SectionLabel>}
      <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: "-.5px", margin: 0, lineHeight: 1.2 }} className="h1-page">{title}</h1>
      {sub && <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 4 }}>{sub}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>{actions}</div>}
  </div>
);

// ✅ StatCard — KPI 카드 공통 컴포넌트 (elevation 포함)
export const StatCard = ({ label, value, sub, subColor, onClick, accent = "#1a2744" }) => (
  <div onClick={onClick} className="card" style={{ padding: "16px 18px", cursor: onClick ? "pointer" : "default", userSelect: "none" }}>
    <p style={{ fontSize: 10, color: "#a0a0b0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>{label}</p>
    <p className="num" style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: subColor || accent, fontWeight: 700, marginTop: 6 }}>{sub}</p>}
  </div>
);

export const toast = (msg, type) => { if (_addToast) _addToast(msg, type); };
