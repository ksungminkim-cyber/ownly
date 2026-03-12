"use client";
import { useState, useCallback } from "react";
import { C } from "../lib/constants";

let _addToast = null;

export const Badge = ({ label, map }) => {
  const s = (map || {})[label] || { c: C.muted, bg: C.faint };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.c, background: s.bg, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
};

export const SectionLabel = ({ children }) => (
  <p style={{ fontSize: 11, color: C.indigo, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 6 }}>
    {children}
  </p>
);

export const Spinner = ({ size = 18, color = "#fff" }) => (
  <span
    className="spin"
    style={{ display: "inline-block", width: size, height: size, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: "50%", flexShrink: 0 }}
  />
);

// 전체 화면 로딩 오버레이
export const PageLoader = ({ message = "데이터를 불러오는 중..." }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(7,7,14,0.85)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
    <div style={{ position: "relative", width: 56, height: 56 }}>
      <span className="spin" style={{ display: "block", width: 56, height: 56, border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%" }} />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏠</span>
    </div>
    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{message}</p>
  </div>
);

// 인라인 로딩 (섹션용)
export const InlineLoader = ({ rows = 3 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ height: 52, borderRadius: 12, background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
    ))}
  </div>
);

export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: "#13131f", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
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
  <div className="search-box" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.faint }}>
    <span style={{ fontSize: 14, opacity: 0.4 }}>🔍</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "검색..."}
      style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 13 }}
    />
    {value && (
      <button onClick={() => onChange("")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 0 }}>
        ✕
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon, title, desc, action, onAction }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
    <div className="empty-bounce" style={{ fontSize: 48, marginBottom: 16, opacity: 0.25 }}>{icon || "📭"}</div>
    <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title || "데이터가 없습니다"}</p>
    <p style={{ fontSize: 13, color: C.muted, marginBottom: action ? 18 : 0, maxWidth: 280, lineHeight: 1.5 }}>{desc || ""}</p>
    {action && (
      <button onClick={onAction} className="btn-primary" style={{ padding: "9px 20px", borderRadius: 10, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
        {action}
      </button>
    )}
  </div>
);

export const ConfirmDialog = ({ open, title, desc, onConfirm, onCancel, danger }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)", animation: "modal-bg .25s ease" }} onClick={onCancel}>
      <div style={{ width: 380, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: "28px", animation: "modal-card .3s cubic-bezier(.22,1,.36,1)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 22, lineHeight: 1.5 }}>{desc}</p>
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
          <button onClick={onConfirm} className="btn-primary" style={{ flex: 1, padding: "11px", borderRadius: 10, background: danger ? `linear-gradient(135deg,${C.rose},#dc2626)` : `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {danger ? "삭제" : "확인"}
          </button>
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

  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12,
            background: t.type === "success" ? `${C.emerald}22` : t.type === "error" ? `${C.rose}22` : `${C.amber}22`,
            border: `1px solid ${t.type === "success" ? C.emerald : t.type === "error" ? C.rose : C.amber}44`,
            backdropFilter: "blur(12px)", animation: "toast-in .3s ease", boxShadow: "0 8px 30px rgba(0,0,0,.4)", minWidth: 260,
          }}
        >
          <span style={{ fontSize: 16 }}>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : "!"}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

export const Modal = ({ open, onClose, children, width }) => {
  if (!open) return null;
  return (
    <div
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", animation: "modal-bg .25s ease", overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 20px" }}
      onClick={onClose}
    >
      <div
        style={{ width: width || 480, maxWidth: "min(calc(100vw - 40px), 100%)", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 22, padding: "32px", boxShadow: "0 40px 100px rgba(0,0,0,.7)", animation: "modal-card .3s cubic-bezier(.22,1,.36,1)", flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
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
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: ".5px", textTransform: "uppercase" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.45, pointerEvents: "none" }}>{icon}</span>}
        <input
          type={t === "password" ? (show ? "text" : "password") : t}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="auth-input"
          style={{ width: "100%", padding: `12px ${t === "password" ? "44px" : "14px"} 12px ${icon ? "40px" : "14px"}`, fontSize: 14, color: C.text, background: C.faint, border: `1px solid ${error ? C.rose : C.border}`, borderRadius: 12 }}
        />
        {t === "password" && (
          <button type="button" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: 4 }}>
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: C.rose, fontWeight: 600 }}>{error}</p>}
    </div>
  );
};

export const SortButton = ({ label, active, dir, onClick }) => (
  <button onClick={onClick} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? C.indigo : C.border}`, background: active ? `${C.indigo}20` : "transparent", color: active ? C.indigo : C.muted, transition: "all .15s", display: "flex", alignItems: "center", gap: 3 }}>
    {label} {active && <span style={{ fontSize: 9 }}>{dir === "asc" ? "▲" : "▼"}</span>}
  </button>
);

export const toast = (msg, type) => {
  if (_addToast) _addToast(msg, type);
};
