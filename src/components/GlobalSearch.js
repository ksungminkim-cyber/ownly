"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";

const C = {
  navy: "#1a2744", indigo: "#3b5bdb", purple: "#5b4fcf",
  emerald: "#0fa573", rose: "#e8445a", amber: "#e8960a",
  border: "#ebe9e3", surface: "#ffffff", muted: "#8a8a9a", faint: "#f8f7f4"
};

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: C.indigo + "30", color: C.indigo, borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function GlobalSearch() {
  const router = useRouter();
  const { tenants, repairs, ledger } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // ✅ Cmd+K / Ctrl+K 단축키
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery("");
        setCursor(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // 열릴 때 input 포커스
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // 검색 결과 구성
  const results = useCallback(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items = [];

    // 바로가기 메뉴
    const shortcuts = [
      { label: "수금 현황", sub: "이번 달 납부 상황 확인", icon: "💰", path: "/dashboard/payments" },
      { label: "물건 관리", sub: "임대 물건 목록", icon: "🏠", path: "/dashboard/properties" },
      { label: "간편 장부", sub: "수입·지출 내역", icon: "📒", path: "/dashboard/ledger" },
      { label: "세금 시뮬레이터", sub: "종합소득세 추정", icon: "🧾", path: "/dashboard/tax" },
      { label: "수리 이력", sub: "수리·유지보수 기록", icon: "🔨", path: "/dashboard/repairs" },
      { label: "캘린더", sub: "납부일·만료일 일정", icon: "📅", path: "/dashboard/calendar" },
      { label: "공실 관리", sub: "빈 호실 현황", icon: "🚪", path: "/dashboard/vacancy" },
      { label: "리포트", sub: "수익 분석·PDF 출력", icon: "📊", path: "/dashboard/reports" },
      { label: "내용증명", sub: "법적 통보 문서 작성", icon: "📨", path: "/dashboard/certified" },
      { label: "커뮤니티", sub: "임대인 정보 공유", icon: "💬", path: "/dashboard/community" },
    ];
    shortcuts.filter(s =>
      s.label.includes(q) || s.sub.toLowerCase().includes(q)
    ).slice(0, 3).forEach(s => items.push({ ...s, type: "shortcut" }));

    // 세입자 검색
    (tenants || []).filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.addr?.toLowerCase().includes(q) ||
      t.phone?.includes(q)
    ).slice(0, 5).forEach(t => items.push({
      type: "tenant",
      label: t.name,
      sub: t.addr + (t.phone ? " · " + t.phone : ""),
      icon: t.pType === "상가" ? "🏪" : t.pType === "토지" ? "🌱" : "🏠",
      path: "/dashboard/tenants",
      color: t.color,
      statusColor: t.status === "미납" ? C.rose : t.status === "공실" ? C.amber : C.emerald,
      status: t.status,
    }));

    // 장부 검색
    (ledger || []).filter(l =>
      l.memo?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q)
    ).slice(0, 3).forEach(l => items.push({
      type: "ledger",
      label: l.memo || l.category,
      sub: `${l.type === "income" ? "수입" : "지출"} · ${l.amount?.toLocaleString()}만원 · ${l.date}`,
      icon: l.type === "income" ? "💰" : "💸",
      path: "/dashboard/ledger",
    }));

    // 수리 이력 검색
    (repairs || []).filter(r =>
      r.category?.toLowerCase().includes(q) ||
      r.memo?.toLowerCase().includes(q) ||
      r.vendor?.toLowerCase().includes(q)
    ).slice(0, 3).forEach(r => items.push({
      type: "repair",
      label: r.category + (r.memo ? " — " + r.memo : ""),
      sub: `${r.date} · ${(r.cost || 0).toLocaleString()}만원${r.vendor ? " · " + r.vendor : ""}`,
      icon: "🔨",
      path: "/dashboard/repairs",
    }));

    return items;
  }, [query, tenants, repairs, ledger])();

  // 키보드 네비게이션
  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) {
      router.push(results[cursor].path);
      setOpen(false);
      setQuery("");
    }
  };

  // cursor 따라 스크롤
  useEffect(() => {
    const el = listRef.current?.children[cursor];
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return (
    // ✅ 사이드바 하단에 검색 힌트 버튼 (데스크톱)
    <div
      onClick={() => { setOpen(true); setQuery(""); }}
      style={{
        display: "none", // CSS에서 desktop-sidebar 내부에서만 표시
        alignItems: "center", gap: 8, padding: "7px 10px",
        borderRadius: 9, border: "1px solid #ebe9e3",
        background: C.faint, cursor: "pointer", margin: "0 10px 8px",
        fontSize: 12, color: C.muted, fontWeight: 600,
      }}
      className="global-search-hint"
    >
      <span>🔍</span>
      <span style={{ flex: 1 }}>검색...</span>
      <kbd style={{
        fontSize: 10, fontWeight: 700, color: "#aaa",
        background: "#fff", border: "1px solid #ddd",
        borderRadius: 4, padding: "1px 5px",
      }}>⌘K</kbd>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(10,10,20,0.55)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "12vh",
        backdropFilter: "blur(4px)",
      }}
      onClick={() => { setOpen(false); setQuery(""); }}
    >
      <div
        style={{
          width: "min(560px, 94vw)",
          background: C.surface,
          borderRadius: 18,
          boxShadow: "0 24px 80px rgba(26,39,68,0.22), 0 2px 12px rgba(26,39,68,0.1)",
          overflow: "hidden",
          animation: "search-in .15s ease",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 검색 입력 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={handleKey}
            placeholder="세입자 이름, 주소, 메뉴 검색..."
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 16, color: C.navy, background: "transparent",
              fontFamily: "inherit",
            }}
          />
          <kbd
            onClick={() => { setOpen(false); setQuery(""); }}
            style={{
              fontSize: 11, color: C.muted, background: C.faint,
              border: `1px solid ${C.border}`, borderRadius: 6,
              padding: "2px 8px", cursor: "pointer", fontFamily: "inherit",
            }}
          >ESC</kbd>
        </div>

        {/* 결과 목록 */}
        <div ref={listRef} style={{ maxHeight: 380, overflowY: "auto" }}>
          {!query.trim() ? (
            // 빈 상태 — 최근 바로가기
            <div style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>빠른 이동</p>
              {[
                { label: "수금 현황", icon: "💰", path: "/dashboard/payments" },
                { label: "세입자 관리", icon: "👤", path: "/dashboard/tenants" },
                { label: "캘린더", icon: "📅", path: "/dashboard/calendar" },
                { label: "간편 장부", icon: "📒", path: "/dashboard/ledger" },
                { label: "세금 시뮬레이터", icon: "🧾", path: "/dashboard/tax" },
              ].map(item => (
                <div
                  key={item.path}
                  onClick={() => { router.push(item.path); setOpen(false); setQuery(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 10px", borderRadius: 10, cursor: "pointer",
                    marginBottom: 2, transition: "background .1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.faint}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: 17 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{item.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>→</span>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: "32px 18px", textAlign: "center" }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
              <p style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>"{query}" 검색 결과 없음</p>
              <p style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>세입자 이름, 주소, 메뉴명으로 검색하세요</p>
            </div>
          ) : (
            <>
              {/* 타입별 섹션 헤더 */}
              {["shortcut", "tenant", "ledger", "repair"].map(type => {
                const group = results.filter(r => r.type === type);
                if (group.length === 0) return null;
                const labels = { shortcut: "메뉴", tenant: "세입자", ledger: "장부", repair: "수리 이력" };
                return (
                  <div key={type}>
                    <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", padding: "12px 18px 6px" }}>{labels[type]}</p>
                    {group.map((item, gi) => {
                      const globalIdx = results.indexOf(item);
                      const isActive = globalIdx === cursor;
                      return (
                        <div
                          key={gi}
                          onClick={() => { router.push(item.path); setOpen(false); setQuery(""); }}
                          onMouseEnter={() => setCursor(globalIdx)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 18px", cursor: "pointer",
                            background: isActive ? C.indigo + "12" : "transparent",
                            borderLeft: `3px solid ${isActive ? C.indigo : "transparent"}`,
                            transition: "all .1s",
                          }}
                        >
                          <div style={{
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: type === "tenant" ? (item.color || C.indigo) + "20" : C.faint,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16,
                          }}>{item.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {highlight(item.label, query)}
                            </p>
                            <p style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {highlight(item.sub, query)}
                            </p>
                          </div>
                          {type === "tenant" && item.status && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, flexShrink: 0,
                              color: item.statusColor, background: item.statusColor + "18",
                              padding: "2px 8px", borderRadius: 20,
                            }}>{item.status}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* 하단 힌트 */}
        <div style={{
          display: "flex", gap: 16, padding: "10px 18px",
          borderTop: `1px solid ${C.border}`,
          fontSize: 11, color: C.muted,
        }}>
          <span>↑↓ 이동</span>
          <span>↵ 이동</span>
          <span>ESC 닫기</span>
          <span style={{ marginLeft: "auto" }}>⌘K로 다시 열기</span>
        </div>
      </div>

      <style>{`
        @keyframes search-in {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .global-search-hint { display: flex !important; }
        @media (max-width: 768px) {
          .global-search-hint { display: none !important; }
        }
      `}</style>
    </div>
  );
}
