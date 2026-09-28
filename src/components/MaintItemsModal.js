"use client";
import { useState, useEffect } from "react";
import { C } from "../lib/constants";
import { toast } from "./shared";
import { useApp } from "../context/AppContext";

// 기본 관리비 항목
const DEFAULT_ITEMS = [
  { id: "electric", label: "전기료", icon: "⚡", amount: 0, paid: false },
  { id: "water", label: "수도료", icon: "💧", amount: 0, paid: false },
  { id: "gas", label: "가스비", icon: "🔥", amount: 0, paid: false },
  { id: "clean", label: "청소비", icon: "🧹", amount: 0, paid: false },
  { id: "parking", label: "주차비", icon: "🚗", amount: 0, paid: false },
  { id: "elevator", label: "승강기유지비", icon: "🛗", amount: 0, paid: false },
  { id: "etc", label: "기타", icon: "📦", amount: 0, paid: false },
];

// 저장 위치: tenants.maintenance_items (jsonb) = { "2026-9": [항목...], ... } — 월별 키 `${year}-${month}`
// 예전엔 브라우저 localStorage(maint_items_{tenantId}_{year}_{month})에만 있었음 → 발견 시 DB 로 1회 이전 후 삭제
const LS_PREFIX = (tenantId) => `maint_items_${tenantId}_`;
const STORAGE_KEY = (tenantId, year, month) => `${LS_PREFIX(tenantId)}${year}_${month}`;
const MONTH_KEY = (year, month) => `${year}-${month}`;

/** 이 세입자의 localStorage 관리비 항목 전부 → { "연-월": items } */
function readLocal(tenantId) {
  const out = {};
  if (typeof window === "undefined") return out;
  try {
    const prefix = LS_PREFIX(tenantId);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const [y, m] = k.slice(prefix.length).split("_");
      try { const v = JSON.parse(localStorage.getItem(k)); if (Array.isArray(v)) out[MONTH_KEY(y, m)] = v; } catch {}
    }
  } catch {}
  return out;
}

function removeLocal(tenantId, monthKeys) {
  try { for (const mk of monthKeys) { const [y, m] = mk.split("-"); localStorage.removeItem(STORAGE_KEY(tenantId, y, m)); } } catch {}
}

const dbMapOf = (t) => (t?.maintenance_items && typeof t.maintenance_items === "object" && !Array.isArray(t.maintenance_items) ? t.maintenance_items : {});

// 같은 세입자에 대해 이전 작업이 겹치거나(요약 버튼·모달 동시 마운트) 실패 시 무한 재시도하지 않도록
const migrating = new Set();
const migrateFailed = new Set();

export function MaintItemsModal({ tenant, year, month, onClose }) {
  const { tenants, updateTenant } = useApp();
  const mk = MONTH_KEY(year, month);
  // DB 값 우선, DB 에 없는 달은 아직 이전 안 된 localStorage 값으로 보충
  const [all, setAll] = useState(() => ({ ...readLocal(tenant.id), ...dbMapOf(tenants.find(t => t.id === tenant.id) || tenant) }));
  const [newLabel, setNewLabel] = useState("");
  const items = all[mk] || DEFAULT_ITEMS;

  const persist = async (updated) => {
    const next = { ...all, [mk]: updated };
    setAll(next);
    try {
      await updateTenant(tenant.id, { maintenance_items: next });
      removeLocal(tenant.id, Object.keys(next));
    } catch (e) {
      // DB 저장 실패(예: 마이그레이션 전) 시 이 브라우저에라도 남겨 데이터 유실 방지
      try { localStorage.setItem(STORAGE_KEY(tenant.id, year, month), JSON.stringify(updated)); } catch {}
      console.warn("[maint_items] DB 저장 실패 — 브라우저에 임시 저장:", e?.message);
      toast("관리비 항목을 서버에 저장하지 못해 이 브라우저에만 임시 저장했습니다", "warning");
    }
  };
  const save = (updated) => { persist(updated); };

  // 금액 입력은 타이핑마다 저장하지 않고 입력칸을 벗어날 때(onBlur) 저장
  const updateAmount = (id, val) => {
    setAll(a => ({ ...a, [mk]: (a[mk] || DEFAULT_ITEMS).map(i => i.id === id ? { ...i, amount: Number(val) || 0 } : i) }));
  };

  const togglePaid = (id) => {
    save(items.map(i => i.id === id ? { ...i, paid: !i.paid } : i));
  };

  const addItem = () => {
    if (!newLabel.trim()) return;
    save([...items, { id: "custom_" + Date.now(), label: newLabel.trim(), icon: "📌", amount: 0, paid: false }]);
    setNewLabel("");
  };

  const removeItem = (id) => {
    save(items.filter(i => i.id !== id));
  };

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);
  const paidTotal = items.filter(i => i.paid).reduce((s, i) => s + (i.amount || 0), 0);
  const allPaid = items.filter(i => i.amount > 0).every(i => i.paid);

  const markAllPaid = () => {
    save(items.map(i => i.amount > 0 ? { ...i, paid: true } : i));
    toast("✅ 관리비 전체 항목 납부처리 완료");
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 3 }}>
          🏢 관리비 항목 상세
        </h3>
        <p style={{ fontSize: 12, color: "#8a8a9a" }}>
          {tenant.name} · {year}년 {month}월 · 기준 관리비 {Number(tenant.maintenance || 0).toLocaleString()}만원
        </p>
      </div>

      {/* 합계 바 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "#f8f7f4", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 3 }}>총 청구액</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744" }}>{total.toLocaleString()}만원</p>
        </div>
        <div style={{ flex: 1, background: "rgba(15,165,115,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(15,165,115,0.2)" }}>
          <p style={{ fontSize: 10, color: "#0fa573", fontWeight: 700, marginBottom: 3 }}>수금 완료</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#0fa573" }}>{paidTotal.toLocaleString()}만원</p>
        </div>
        <div style={{ flex: 1, background: "rgba(232,68,90,0.05)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(232,68,90,0.15)" }}>
          <p style={{ fontSize: 10, color: "#e8445a", fontWeight: 700, marginBottom: 3 }}>미수금</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#e8445a" }}>{(total - paidTotal).toLocaleString()}만원</p>
        </div>
      </div>

      {/* 항목 리스트 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            background: item.paid ? "rgba(15,165,115,0.04)" : "#fff",
            border: `1px solid ${item.paid ? "rgba(15,165,115,0.25)" : "#ebe9e3"}`,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2744", width: 80, flexShrink: 0 }}>{item.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
              <input
                type="number"
                value={item.amount || ""}
                onChange={e => updateAmount(item.id, e.target.value)}
                onBlur={() => save(items)}
                placeholder="0"
                style={{
                  width: "100%", padding: "6px 10px", borderRadius: 8,
                  border: "1px solid #ebe9e3", fontSize: 13, fontWeight: 700,
                  color: "#1a2744", background: "#f8f7f4", textAlign: "right"
                }}
              />
              <span style={{ fontSize: 12, color: "#8a8a9a", flexShrink: 0 }}>만원</span>
            </div>
            <button
              onClick={() => togglePaid(item.id)}
              disabled={!item.amount}
              style={{
                padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: item.amount ? "pointer" : "default",
                border: `1px solid ${item.paid ? "rgba(15,165,115,0.4)" : "#ebe9e3"}`,
                background: item.paid ? "rgba(15,165,115,0.1)" : "transparent",
                color: item.paid ? "#0fa573" : "#8a8a9a",
                flexShrink: 0, opacity: item.amount ? 1 : 0.4,
              }}
            >
              {item.paid ? "✅ 완료" : "미납"}
            </button>
            {item.id.startsWith("custom_") && (
              <button
                onClick={() => removeItem(item.id)}
                style={{ padding: "4px 7px", borderRadius: 6, border: "none", background: "transparent", color: "#ccc", cursor: "pointer", fontSize: 13, flexShrink: 0 }}
              >✕</button>
            )}
          </div>
        ))}
      </div>

      {/* 항목 추가 */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="항목 직접 추가 (예: 인터넷비)"
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 9,
            border: "1px dashed #d0cfc8", fontSize: 13, color: "#1a2744",
            background: "#fafaf8", outline: "none"
          }}
        />
        <button
          onClick={addItem}
          style={{
            padding: "9px 14px", borderRadius: 9, border: "none",
            background: "#1a2744", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer"
          }}
        >+ 추가</button>
      </div>

      {/* 전체 납부처리 */}
      {!allPaid && total > 0 && (
        <button
          onClick={markAllPaid}
          style={{
            width: "100%", padding: "11px", borderRadius: 10, marginBottom: 10,
            background: "linear-gradient(135deg,#0fa573,#059669)", border: "none",
            color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
          }}
        >
          ✅ 전체 항목 납부처리 ({total.toLocaleString()}만원)
        </button>
      )}

      <button
        onClick={onClose}
        style={{
          width: "100%", padding: "11px", borderRadius: 10,
          background: "transparent", border: "1px solid #ebe9e3",
          color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer"
        }}
      >닫기</button>
    </div>
  );
}

// 수금 현황 카드에서 관리비 항목 요약 표시용
export function MaintItemsSummary({ tenant, year, month, onClick }) {
  const { tenants, updateTenant } = useApp();
  const dbMap = dbMapOf(tenants.find(t => t.id === tenant.id) || tenant);
  const mk = MONTH_KEY(year, month);
  const items = dbMap[mk] || readLocal(tenant.id)[mk] || [];

  // 최초 로드 시 localStorage 에 남은 예전 항목을 DB 로 1회 이전 (DB 값이 있는 달은 DB 우선) 후 localStorage 삭제
  useEffect(() => {
    const local = readLocal(tenant.id);
    const keys = Object.keys(local);
    if (!keys.length || migrating.has(tenant.id) || migrateFailed.has(tenant.id)) return;
    migrating.add(tenant.id);
    (async () => {
      try {
        await updateTenant(tenant.id, { maintenance_items: { ...local, ...dbMap } });
        removeLocal(tenant.id, keys);
      } catch (e) {
        migrateFailed.add(tenant.id);
        console.warn("[maint_items] localStorage → DB 이전 실패:", e?.message);
      } finally {
        migrating.delete(tenant.id);
      }
    })();
  }, [tenant.id, dbMap, updateTenant]);

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);
  const paidTotal = items.filter(i => i.paid).reduce((s, i) => s + (i.amount || 0), 0);
  const hasItems = total > 0;

  if (!hasItems) {
    return (
      <button
        onClick={onClick}
        style={{
          padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700,
          cursor: "pointer", border: "1px dashed #d0cfc8",
          background: "transparent", color: "#8a8a9a"
        }}
      >📋 항목 입력</button>
    );
  }

  const allPaid = items.filter(i => i.amount > 0).every(i => i.paid);
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700,
        cursor: "pointer",
        border: `1px solid ${allPaid ? "rgba(15,165,115,0.35)" : "rgba(232,150,10,0.35)"}`,
        background: allPaid ? "rgba(15,165,115,0.08)" : "rgba(232,150,10,0.08)",
        color: allPaid ? "#0fa573" : "#e8960a",
      }}
    >
      {allPaid ? `✅ ${paidTotal.toLocaleString()}만` : `${paidTotal.toLocaleString()}/${total.toLocaleString()}만`}
    </button>
  );
}
