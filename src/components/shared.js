"use client";
import { useState, useCallback } from "react";
import { C } from "../lib/constants";

let _addToast = null;

export const Badge = ({ label, map }) => {
  const s = (map || {})[label] || { c: C.muted, bg: "#f0efe9" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: s.c, background: s.bg,
      padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap"
    }}>{label}</span>
  );
};

export const SectionLabel = ({ children }) => (
  <p style={{
    fontSize: 10, color: "#1a2744", fontWeight: 800,
    letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6,
    opacity: 0.5
  }}>{children}</p>
);

export const Spinner = ({ size = 18, color = "#1a2744" }) => (
  <span className="spin" style={{
    display: "inline-block", width: size, height: size,
    border: `2px solid rgba(26,39,68,0.12)`, borderTopColor: color,
    borderRadius: "50%", flexShrink: 0
  }} />
);

export const PageLoader = ({ message = "데이터를 불러오는 중..." }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 9000,
    background: "rgba(245,244,240,0.9)", backdropFilter: "blur(6px)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18
  }}>
    <div style={{ position: "relative", width: 56, height: 56 }}>
      <span className="spin" style={{ display: "block", width: 56, height: 56, border: "3px solid rgba(26,39,68,0.12)", borderTopColor: "#1a2744", borderRadius: "50%" }} />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏠</span>
    </div>
    <p style={{ fontSize: 14, color: "#8a8a9a", fontWeight: 600 }}>{message}</p>
  </div>
);

export const InlineLoader = ({ rows = 3 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{
        height: 52, borderRadius: 12,
        background: "linear-gradient(90deg, #f0efe9 25%, #e8e6e0 50%, #f0efe9 75%)",
        backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite"
      }} />
    ))}
  </div>
);

export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
      padding: "10px 14px", boxShadow: "0 8px 30px rgba(26,39,68,0.12)"
    }}>
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
          {p.name}: {p.value}만원
        </p>
      ))}
    </div>
  );
};

export const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="search-box" style={{
    display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
    borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--surface)",
    boxShadow: "0 1px 4px rgba(26,39,68,0.04)"
  }}>
    <span style={{ fontSize: 14, opacity: 0.35 }}>🔍</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "검색..."}
      style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13 }}
    />
    {value && (
      <button onClick={() => onChange("")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
    )}
  </div>
);

export const EmptyState = ({ icon, title, desc, action, onAction }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
    <div className="empty-bounce" style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>{icon || "📭"}</div>
    <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{title || "데이터가 없습니다"}</p>
    <p style={{ fontSize: 13, color: C.muted, marginBottom: action ? 18 : 0, maxWidth: 280, lineHeight: 1.5 }}>{desc || ""}</p>
    {action && (
      <button onClick={onAction} className="btn-primary" style={{
        padding: "10px 22px", borderRadius: 12,
        background: "linear-gradient(135deg, #1a2744, #2d4270)",
        border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
      }}>{action}</button>
    )}
  </div>
);

export const ConfirmDialog = ({ open, title, desc, onConfirm, onCancel, danger }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(26,39,68,0.4)", backdropFilter: "blur(8px)", animation: "modal-bg .25s ease"
    }} onClick={onCancel}>
      <div style={{
        width: 380, background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 20, padding: "28px", animation: "modal-card .3s cubic-bezier(.22,1,.36,1)",
        boxShadow: "0 30px 80px rgba(26,39,68,0.2)"
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 22, lineHeight: 1.5 }}>{desc}</p>
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "11px", borderRadius: 12,
            background: "var(--surface2)", border: "1px solid var(--border)",
            color: "#7a7a8a", fontWeight: 600, fontSize: 13, cursor: "pointer"
          }}>취소</button>
          <button onClick={onConfirm} className="btn-primary" style={{
            flex: 1, padding: "11px", borderRadius: 12,
            background: danger ? "linear-gradient(135deg, #e8445a, #c4243f)" : "linear-gradient(135deg, #1a2744, #2d4270)",
            border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
          }}>{danger ? "삭제" : "확인"}</button>
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
    success: { bg: `rgba(15,165,115,0.08)`, border: `rgba(15,165,115,0.25)`, icon: "✓", c: "#0fa573" },
    error:   { bg: `rgba(232,68,90,0.08)`,  border: `rgba(232,68,90,0.25)`,  icon: "✗", c: "#e8445a" },
    warning: { bg: `rgba(232,150,10,0.08)`, border: `rgba(232,150,10,0.25)`, icon: "!", c: "#e8960a" },
  };

  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => {
        const col = colors[t.type] || colors.success;
        return (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            borderRadius: 14, background: "var(--surface)",
            border: `1px solid ${col.border}`,
            boxShadow: "0 8px 30px rgba(26,39,68,0.12)",
            animation: "toast-in .3s ease", minWidth: 260
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: col.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: col.c, fontSize: 13, fontWeight: 800, flexShrink: 0
            }}>{col.icon}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
};

export const Modal = ({ open, onClose, children, width }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: "rgba(26,39,68,0.4)", backdropFilter: "blur(8px)",
      animation: "modal-bg .25s ease", overflowY: "auto",
      display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 20px"
    }} onClick={onClose}>
      <div style={{
        width: width || 480, maxWidth: "min(calc(100vw - 40px), 100%)",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 22, padding: "32px",
        boxShadow: "0 40px 100px rgba(26,39,68,0.2)",
        animation: "modal-card .3s cubic-bezier(.22,1,.36,1)", flexShrink: 0
      }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const AuthInput = ({ label, type, placeholder, value, onChange, error, icon }) => {
  const [show, setShow] = useState(false);
  const t = type || "text";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7a8a", letterSpacing: ".5px", textTransform: "uppercase" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4, pointerEvents: "none" }}>{icon}</span>}
        <input
          type={t === "password" ? (show ? "text" : "password") : t}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="auth-input"
          style={{
            width: "100%", padding: `12px ${t === "password" ? "44px" : "14px"} 12px ${icon ? "40px" : "14px"}`,
            fontSize: 14, color: "var(--text)", background: "var(--input-bg)",
            border: `1.5px solid ${error ? "#e8445a" : "var(--border)"}`, borderRadius: 12
          }}
        />
        {t === "password" && (
          <button type="button" onClick={() => setShow((s) => !s)} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: 4
          }}>{show ? "Hide" : "Show"}</button>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: "#e8445a", fontWeight: 600 }}>{error}</p>}
    </div>
  );
};

export const SortButton = ({ label, active, dir, onClick }) => (
  <button onClick={onClick} style={{
    padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
    border: `1.5px solid ${active ? "#1a2744" : "var(--border)"}`,
    background: active ? "rgba(26,39,68,0.07)" : "var(--surface)",
    color: active ? "var(--text)" : C.muted, transition: "all .15s",
    display: "flex", alignItems: "center", gap: 3
  }}>
    {label} {active && <span style={{ fontSize: 9 }}>{dir === "asc" ? "▲" : "▼"}</span>}
  </button>
);

export const toast = (msg, type) => {
  if (_addToast) _addToast(msg, type);
};
