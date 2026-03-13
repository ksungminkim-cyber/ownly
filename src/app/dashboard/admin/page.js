"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../context/AppContext";
import { toast } from "../../../components/shared";

// ── 관리자 이메일 화이트리스트 ──────────────────────
const ADMIN_EMAILS = ["k.sungminkim@gmail.com"];

const PLAN_META = {
  free:         { label: "무료",     color: "#8a8a9a", bg: "#f0efe9" },
  starter:      { label: "스타터",   color: "#3b6bca", bg: "#dce6f5" },
  starter_plus: { label: "스타터+",  color: "#0fa573", bg: "#d0f0e6" },
  pro:          { label: "프로",     color: "#c9920a", bg: "#fdf0cc" },
};

const STATUS_META = {
  active:    { label: "활성",   color: "#0fa573", bg: "#d0f0e6" },
  inactive:  { label: "비활성", color: "#8a8a9a", bg: "#f0efe9" },
  cancelled: { label: "취소됨", color: "#e8445a", bg: "#fde8ec" },
  trial:     { label: "체험",   color: "#5b4fcf", bg: "#eeeaff" },
};

export default function AdminPage() {
  const router = useRouter();
  const { user } = useApp();
  const [authorized, setAuthorized] = useState(false);
  const [checking,   setChecking]   = useState(true);

  // 관리자 권한 확인
  useEffect(() => {
    if (!user) return;
    if (ADMIN_EMAILS.includes(user.email)) {
      setAuthorized(true);
    }
    setChecking(false);
  }, [user]);

  if (checking) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <p style={{ color: "#8a8a9a", fontSize: 14 }}>권한 확인 중...</p>
    </div>
  );

  if (!authorized) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <p style={{ fontSize: 18, fontWeight: 800, color: "#1a2744" }}>접근 권한이 없습니다</p>
      <p style={{ fontSize: 13, color: "#8a8a9a" }}>관리자 계정으로 로그인하세요</p>
      <button onClick={() => router.push("/dashboard")} style={{ padding: "10px 22px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>대시보드로</button>
    </div>
  );

  return <AdminContent currentUser={user} />;
}

function AdminContent({ currentUser }) {
  const router = useRouter();
  const [users,       setUsers]       = useState([]);
  const [subs,        setSubs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(null);   // userId
  const [editModal,   setEditModal]   = useState(null);   // { userId, email, plan, status }
  const [tab,         setTab]         = useState("users"); // users | logs
  const [search,      setSearch]      = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // subscriptions 전체 조회
      const { data: subData, error: subErr } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (subErr) throw subErr;
      setSubs(subData || []);

      // auth.users는 service_role 키 필요 → 대신 profiles 또는 tenants에서 이메일 추출
      // subscriptions의 user_id 기반으로 유저 목록 구성
      const userMap = {};
      (subData || []).forEach((s) => {
        userMap[s.user_id] = {
          id: s.user_id,
          email: s.email || s.customer_email || "—",
          plan: s.plan || "free",
          status: s.status || "inactive",
          billing_key: s.billing_key,
          toss_order_id: s.toss_order_id,
          current_period_end: s.current_period_end,
          created_at: s.created_at,
        };
      });
      setUsers(Object.values(userMap));
    } catch (err) {
      console.error(err);
      toast("데이터 로딩 실패: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 플랜 즉시 변경
  const updatePlan = async ({ userId, plan, status }) => {
    setSaving(userId);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan,
          status,
          current_period_end: null,   // 기간 제한 해제
        })
        .eq("user_id", userId);

      if (error) throw error;
      toast(`✅ ${plan.toUpperCase()} · ${status} 로 변경 완료`, "success");
      setEditModal(null);
      await loadData();
    } catch (err) {
      toast("변경 실패: " + err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  // 구독 행이 없는 유저에게 생성
  const createSub = async (userId, plan, status) => {
    setSaving(userId);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .upsert({ user_id: userId, plan, status, current_period_end: null }, { onConflict: "user_id" });
      if (error) throw error;
      toast("구독 레코드 생성/업데이트 완료", "success");
      await loadData();
    } catch (err) {
      toast("실패: " + err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  const filtered = users.filter((u) =>
    !search ||
    u.id.includes(search) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.plan.includes(search)
  );

  const planCount = (p) => subs.filter((s) => s.plan === p).length;
  const activeCount = subs.filter((s) => s.status === "active").length;

  return (
    <div style={{ fontFamily: "'Pretendard','DM Sans',sans-serif", padding: "28px 32px", maxWidth: 1100, minHeight: "100vh" }}>

      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>ADMIN</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-.4px" }}>관리자 패널</h1>
          <p style={{ fontSize: 12, color: "#8a8a9a", marginTop: 3 }}>유저 플랜 관리 · 구독 상태 제어 · 테스트</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadData} style={{ padding: "8px 16px", borderRadius: 10, background: "#f0efe9", border: "1px solid #ebe9e3", color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            🔄 새로고침
          </button>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "8px 16px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            대시보드 →
          </button>
        </div>
      </div>

      {/* KPI 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { l: "전체 유저",   v: users.length,          c: "#1a2744", bg: "#f0f2f8" },
          { l: "활성 구독",   v: activeCount,            c: "#0fa573", bg: "#edfaf5" },
          { l: "무료",        v: planCount("free"),      c: "#8a8a9a", bg: "#f8f7f4" },
          { l: "스타터·스타터+", v: planCount("starter") + planCount("starter_plus"), c: "#3b6bca", bg: "#eef3fd" },
          { l: "프로",        v: planCount("pro"),       c: "#c9920a", bg: "#fdf6e3" },
        ].map((k) => (
          <div key={k.l} style={{ background: k.bg, border: "1px solid " + k.c + "22", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{k.l}</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {[{ k: "users", l: "👥 유저 관리" }, { k: "sql", l: "🛠️ SQL 가이드" }].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${tab === t.k ? "#1a2744" : "#ebe9e3"}`, background: tab === t.k ? "#1a2744" : "transparent", color: tab === t.k ? "#fff" : "#8a8a9a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── 유저 관리 탭 ── */}
      {tab === "users" && (
        <>
          {/* 검색 */}
          <div style={{ marginBottom: 14 }}>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="이메일 · UID · 플랜명으로 검색..."
              style={{ width: "100%", padding: "10px 14px", fontSize: 13, color: "#1a2744", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#8a8a9a" }}>로딩 중...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
              <p style={{ color: "#8a8a9a", fontSize: 14 }}>구독 데이터가 없습니다<br/>아래 SQL 가이드를 참고해 직접 추가하세요</p>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f7f4", borderBottom: "2px solid #ebe9e3" }}>
                    {["UID", "이메일", "플랜", "상태", "만료일", "결제키", "액션"].map((h) => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, color: "#8a8a9a", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const pm = PLAN_META[u.plan] || PLAN_META.free;
                    const sm = STATUS_META[u.status] || STATUS_META.inactive;
                    const isMe = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f0efe9", background: isMe ? "rgba(15,165,115,0.03)" : "transparent" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#8a8a9a", background: "#f8f7f4", padding: "3px 7px", borderRadius: 5 }}>
                            {u.id.slice(0, 8)}...
                          </span>
                          {isMe && <span style={{ fontSize: 9, fontWeight: 800, color: "#0fa573", marginLeft: 5 }}>나</span>}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#1a2744", fontWeight: 600 }}>{u.email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: pm.color, background: pm.bg, padding: "3px 10px", borderRadius: 20 }}>
                            {pm.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: "3px 10px", borderRadius: 20 }}>
                            {sm.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: u.current_period_end ? "#e8445a" : "#0fa573" }}>
                          {u.current_period_end ? new Date(u.current_period_end).toLocaleDateString("ko-KR") : "무제한"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 10, color: "#8a8a9a" }}>
                          {u.billing_key ? "✅ 등록됨" : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => setEditModal({ userId: u.id, email: u.email, plan: u.plan, status: u.status })}
                            disabled={saving === u.id}
                            style={{ padding: "6px 14px", borderRadius: 8, background: "#1a2744", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: saving === u.id ? 0.6 : 1 }}>
                            {saving === u.id ? "처리 중..." : "✏️ 편집"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 빠른 플랜 적용 — 현재 로그인 유저 기준 */}
          <div style={{ marginTop: 24, background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(15,165,115,0.04))", border: "1px solid #e0ede8", borderRadius: 16, padding: "20px 24px" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>⚡ 내 계정 빠른 플랜 변경 (테스트용)</p>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 16 }}>현재 로그인: <strong>{currentUser?.email}</strong> · 클릭 즉시 반영, 새로고침 필요</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(PLAN_META).map(([planId, meta]) => (
                <button key={planId}
                  onClick={() => createSub(currentUser.id, planId, "active")}
                  disabled={!!saving}
                  style={{ padding: "9px 18px", borderRadius: 10, border: `2px solid ${meta.color}40`, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 800, cursor: "pointer", opacity: saving ? 0.6 : 1, transition: "all .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = meta.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = meta.color + "40"; }}>
                  {saving ? "..." : meta.label + " 적용"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── SQL 가이드 탭 ── */}
      {tab === "sql" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "#8a8a9a" }}>Supabase SQL Editor에서 직접 실행할 수 있는 쿼리 모음입니다.</p>

          {[
            {
              title: "① 현재 구독 상태 전체 조회",
              sql: `SELECT user_id, plan, status, current_period_end, billing_key\nFROM public.subscriptions\nORDER BY created_at DESC;`,
            },
            {
              title: "② 특정 유저 → 프로 업그레이드",
              sql: `UPDATE public.subscriptions\nSET plan = 'pro',\n    status = 'active',\n    current_period_end = NULL\nWHERE user_id = 'YOUR_USER_ID';`,
            },
            {
              title: "③ 특정 유저 → 스타터+ 설정",
              sql: `UPDATE public.subscriptions\nSET plan = 'starter_plus',\n    status = 'active',\n    current_period_end = NULL\nWHERE user_id = 'YOUR_USER_ID';`,
            },
            {
              title: "④ 구독 레코드 없는 유저에게 생성",
              sql: `INSERT INTO public.subscriptions (user_id, plan, status)\nVALUES ('YOUR_USER_ID', 'pro', 'active')\nON CONFLICT (user_id) DO UPDATE\nSET plan = EXCLUDED.plan, status = EXCLUDED.status, current_period_end = NULL;`,
            },
            {
              title: "⑤ 무료 플랜으로 초기화 (테스트 후 복구)",
              sql: `UPDATE public.subscriptions\nSET plan = 'free',\n    status = 'inactive'\nWHERE user_id = 'YOUR_USER_ID';`,
            },
            {
              title: "⑥ 전체 유저 UID 조회 (auth 테이블 접근 필요)",
              sql: `-- Supabase 대시보드 Authentication > Users 에서 직접 확인\n-- 또는 아래 쿼리 (service_role 키 필요)\nSELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;`,
            },
          ].map(({ title, sql }) => (
            <div key={title} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", background: "#f8f7f4", borderBottom: "1px solid #ebe9e3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>{title}</p>
                <button onClick={() => { navigator.clipboard.writeText(sql); toast("복사됨!"); }}
                  style={{ padding: "4px 12px", borderRadius: 7, background: "#1a2744", color: "#fff", border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>복사</button>
              </div>
              <pre style={{ margin: 0, padding: "14px 18px", fontSize: 12, color: "#1a2744", background: "#fafafa", overflowX: "auto", lineHeight: 1.7, fontFamily: "monospace" }}>{sql}</pre>
            </div>
          ))}

          {/* UID 바로 표시 */}
          <div style={{ background: "#edfaf5", border: "1px solid #0fa57330", borderRadius: 14, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#0fa573", marginBottom: 8 }}>📋 현재 로그인 유저 UID (복사해서 쿼리에 사용)</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <code style={{ fontSize: 13, color: "#1a2744", background: "#fff", padding: "8px 14px", borderRadius: 8, border: "1px solid #ebe9e3", flex: 1, wordBreak: "break-all" }}>
                {currentUser?.id || "—"}
              </code>
              <button onClick={() => { navigator.clipboard.writeText(currentUser?.id || ""); toast("UID 복사됨!"); }}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#0fa573", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>복사</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 편집 모달 ── */}
      {editModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px 32px", width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: "#1a2744", marginBottom: 4 }}>플랜 편집</h3>
            <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 20 }}>
              <code style={{ fontSize: 11, background: "#f0efe9", padding: "2px 7px", borderRadius: 5 }}>{editModal.userId.slice(0, 16)}...</code>
            </p>

            {/* 플랜 선택 */}
            <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>플랜</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
              {Object.entries(PLAN_META).map(([planId, meta]) => (
                <button key={planId}
                  onClick={() => setEditModal((m) => ({ ...m, plan: planId }))}
                  style={{ padding: "10px", borderRadius: 10, border: `2px solid ${editModal.plan === planId ? meta.color : "#ebe9e3"}`, background: editModal.plan === planId ? meta.bg : "transparent", color: editModal.plan === planId ? meta.color : "#8a8a9a", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  {meta.label}
                </button>
              ))}
            </div>

            {/* 상태 선택 */}
            <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>구독 상태</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
              {Object.entries(STATUS_META).map(([stId, meta]) => (
                <button key={stId}
                  onClick={() => setEditModal((m) => ({ ...m, status: stId }))}
                  style={{ padding: "9px", borderRadius: 10, border: `2px solid ${editModal.status === stId ? meta.color : "#ebe9e3"}`, background: editModal.status === stId ? meta.bg : "transparent", color: editModal.status === stId ? meta.color : "#8a8a9a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {meta.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditModal(null)}
                style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
              <button
                onClick={() => updatePlan({ userId: editModal.userId, plan: editModal.plan, status: editModal.status })}
                disabled={saving === editModal.userId}
                style={{ flex: 2, padding: "12px", borderRadius: 11, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "저장 중..." : "✅ 저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
