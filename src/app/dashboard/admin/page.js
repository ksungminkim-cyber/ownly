"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../context/AppContext";
import { toast } from "../../../components/shared";

const ADMIN_EMAILS = ["k.sungminkim@gmail.com"];

const PLAN_META = {
  free:         { label: "무료",    color: "#8a8a9a", bg: "#f0efe9" },
  
  plus: { label: "플러스", color: "#4f46e5", bg: "#e5e4fd" },
  pro:          { label: "프로",    color: "#c9920a", bg: "#fdf0cc" },
};

const STATUS_META = {
  active:    { label: "활성",   color: "#0fa573", bg: "#d0f0e6" },
  inactive:  { label: "비활성", color: "#8a8a9a", bg: "#f0efe9" },
  cancelled: { label: "취소됨", color: "#e8445a", bg: "#fde8ec" },
  trial:     { label: "체험",   color: "#5b4fcf", bg: "#eeeaff" },
};

export default function AdminPage() {
  const { user } = useApp();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
    setAuthorized(ADMIN_EMAILS.includes(user.email));
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
  const [users,     setUsers]     = useState([]);
  const [subs,      setSubs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [tab,       setTab]       = useState("users");
  const [search,    setSearch]    = useState("");
  const [rpcReady,  setRpcReady]  = useState(true);

  const SQL_GUIDES = [
    {
      title: "⭐ [필수·최초 1회] 관리자 조회 RPC 생성 (가입자 정보 + 집계)",
      sql: "CREATE OR REPLACE FUNCTION get_admin_users()\nRETURNS TABLE(\n  id uuid,\n  email text,\n  created_at timestamptz,\n  last_sign_in_at timestamptz,\n  full_name text,\n  phone text,\n  nickname text,\n  tenant_count bigint,\n  building_count bigint\n)\nLANGUAGE sql\nSECURITY DEFINER\nAS $$\n  SELECT\n    u.id,\n    u.email,\n    u.created_at,\n    u.last_sign_in_at,\n    u.raw_user_meta_data->>'full_name' AS full_name,\n    u.raw_user_meta_data->>'phone' AS phone,\n    u.raw_user_meta_data->>'nickname' AS nickname,\n    (SELECT count(*) FROM public.tenants t WHERE t.user_id = u.id) AS tenant_count,\n    (SELECT count(*) FROM public.buildings b WHERE b.user_id = u.id) AS building_count\n  FROM auth.users u\n  ORDER BY u.created_at DESC;\n$$;\n\n-- 이전 버전 호환용\nCREATE OR REPLACE FUNCTION get_user_emails()\nRETURNS TABLE(id uuid, email text)\nLANGUAGE sql\nSECURITY DEFINER\nAS $$\n  SELECT id, email FROM auth.users ORDER BY created_at DESC;\n$$;",
    },
    {
      title: "① 현재 구독 상태 전체 조회",
      sql: "SELECT user_id, plan, status, current_period_end, billing_key\nFROM public.subscriptions\nORDER BY created_at DESC;",
    },
    {
      title: "② 특정 유저 → 프로 업그레이드",
      sql: "UPDATE public.subscriptions\nSET plan = 'pro',\n    status = 'active',\n    current_period_end = NULL\nWHERE user_id = 'YOUR_USER_ID';",
    },
    {
      title: "③ 특정 유저 → 플러스 설정",
      sql: "UPDATE public.subscriptions\nSET plan = 'plus',\n    status = 'active',\n    current_period_end = NULL\nWHERE user_id = 'YOUR_USER_ID';",
    },
    {
      title: "④ 구독 레코드 없는 유저에게 생성",
      sql: "INSERT INTO public.subscriptions (user_id, plan, status)\nVALUES ('YOUR_USER_ID', 'pro', 'active')\nON CONFLICT (user_id) DO UPDATE\nSET plan = EXCLUDED.plan,\n    status = EXCLUDED.status,\n    current_period_end = NULL;",
    },
    {
      title: "⑤ 무료 플랜으로 초기화 (테스트 후 복구)",
      sql: "UPDATE public.subscriptions\nSET plan = 'free',\n    status = 'inactive'\nWHERE user_id = 'YOUR_USER_ID';",
    },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: subData, error: subErr } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (subErr) throw subErr;
      setSubs(subData || []);

      // 신규 RPC 우선 시도 → 실패 시 구 버전 fallback
      let authUsers = [];
      let hasFullDetails = false;
      try {
        const { data: rich, error: rErr } = await supabase.rpc("get_admin_users");
        if (!rErr && rich) {
          authUsers = rich;
          hasFullDetails = true;
          setRpcReady(true);
        } else {
          throw rErr || new Error("no_rich_rpc");
        }
      } catch {
        try {
          const { data: basic, error: bErr } = await supabase.rpc("get_user_emails");
          if (!bErr && basic) {
            authUsers = basic.map(r => ({ id: r.id, email: r.email }));
            setRpcReady(true);
          } else {
            setRpcReady(false);
          }
        } catch { setRpcReady(false); }
      }

      const subMap = {};
      (subData || []).forEach(s => { subMap[s.user_id] = s; });

      // auth.users 전체 기준으로 목록 구성 (구독 없는 가입자 포함)
      const userMap = {};
      authUsers.forEach(u => {
        const s = subMap[u.id] || {};
        userMap[u.id] = {
          id: u.id,
          email: u.email || s.email || s.customer_email || null,
          full_name: u.full_name || null,
          phone: u.phone || null,
          nickname: u.nickname || null,
          created_at: u.created_at || null,
          last_sign_in_at: u.last_sign_in_at || null,
          tenant_count: hasFullDetails ? (u.tenant_count || 0) : null,
          building_count: hasFullDetails ? (u.building_count || 0) : null,
          plan: s.plan || "free",
          status: s.status || "inactive",
          billing_key: s.billing_key || null,
          current_period_end: s.current_period_end || null,
          has_subscription: !!subMap[u.id],
        };
      });

      // RPC 실패했어도 구독자는 표시
      (subData || []).forEach(s => {
        if (!userMap[s.user_id]) {
          userMap[s.user_id] = {
            id: s.user_id,
            email: s.email || s.customer_email || null,
            plan: s.plan || "free",
            status: s.status || "inactive",
            billing_key: s.billing_key,
            current_period_end: s.current_period_end,
            created_at: null, last_sign_in_at: null,
            full_name: null, phone: null, nickname: null,
            tenant_count: null, building_count: null,
            has_subscription: true,
          };
        }
      });

      setUsers(Object.values(userMap));
    } catch (err) {
      toast("로딩 실패: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updatePlan = async ({ userId, plan, status }) => {
    setSaving(userId);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan, status, current_period_end: null })
        .eq("user_id", userId);
      if (error) throw error;
      toast("변경 완료: " + PLAN_META[plan].label + " / " + STATUS_META[status].label);
      setEditModal(null);
      await loadData();
    } catch (err) {
      toast("변경 실패: " + err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  const quickPlan = async (planId) => {
    setSaving(currentUser.id);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .upsert({ user_id: currentUser.id, plan: planId, status: "active", current_period_end: null }, { onConflict: "user_id" });
      if (error) throw error;
      toast("✅ " + PLAN_META[planId].label + " 적용! F5로 새로고침하세요.");
      await loadData();
    } catch (err) {
      toast("실패: " + err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.id.includes(search) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.nickname || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search) ||
    u.plan.includes(search)
  );

  // 이번 주·달 신규 가입 수
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisWeek = users.filter(u => u.created_at && new Date(u.created_at) >= weekAgo).length;
  const newThisMonth = users.filter(u => u.created_at && new Date(u.created_at) >= monthAgo).length;

  // 상대 시간 표시 헬퍼
  const relTime = (iso) => {
    if (!iso) return "—";
    const diff = (now - new Date(iso)) / 1000;
    if (diff < 60) return "방금";
    if (diff < 3600) return Math.floor(diff / 60) + "분 전";
    if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
    if (diff < 604800) return Math.floor(diff / 86400) + "일 전";
    return new Date(iso).toLocaleDateString("ko-KR");
  };

  return (
    <div style={{ fontFamily: "'Pretendard','DM Sans',sans-serif", padding: "28px 32px", maxWidth: 1100 }}>

      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>ADMIN</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-.4px" }}>관리자 패널</h1>
          <p style={{ fontSize: 12, color: "#8a8a9a", marginTop: 3 }}>유저 플랜 관리 · 구독 상태 제어 · 테스트</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadData} style={{ padding: "8px 16px", borderRadius: 10, background: "#f0efe9", border: "1px solid #ebe9e3", color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔄 새로고침</button>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "8px 16px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>대시보드 →</button>
        </div>
      </div>

      {/* RPC 경고 */}
      {!rpcReady && (
        <div style={{ background: "rgba(232,150,10,0.08)", border: "1px solid rgba(232,150,10,0.3)", borderRadius: 12, padding: "12px 18px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#c97a00", marginBottom: 2 }}>⚠️ 관리자 조회 RPC 함수가 없습니다</p>
            <p style={{ fontSize: 11, color: "#8a8a9a" }}>SQL 가이드 탭의 ⭐ 쿼리를 실행하면 가입일·이름·전화·물건수가 모두 표시됩니다</p>
          </div>
          <button onClick={() => setTab("sql")} style={{ padding: "7px 14px", borderRadius: 8, background: "#e8960a", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>SQL 가이드 →</button>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 22 }}>
        {[
          { l: "전체 유저", v: users.length, c: "#1a2744", bg: "#f0f2f8" },
          { l: "이번 주 신규", v: newThisWeek, c: "#0fa573", bg: "#edfaf5" },
          { l: "이번 달 신규", v: newThisMonth, c: "#3b5bdb", bg: "#e8ecfb" },
          { l: "활성 구독", v: subs.filter(s => s.status === "active").length, c: "#0fa573", bg: "#edfaf5" },
          { l: "무료", v: users.filter(u => u.plan === "free").length, c: "#8a8a9a", bg: "#f8f7f4" },
          { l: "플러스", v: users.filter(u => u.plan === "plus").length, c: "#4f46e5", bg: "#eeeefe" },
          { l: "프로", v: users.filter(u => u.plan === "pro").length, c: "#c9920a", bg: "#fdf6e3" },
        ].map(k => (
          <div key={k.l} style={{ background: k.bg, border: "1px solid " + k.c + "22", borderRadius: 14, padding: "14px 16px" }}>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{k.l}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {[{ k: "users", l: "👥 유저 관리" }, { k: "sql", l: "🛠️ SQL 가이드" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid " + (tab === t.k ? "#1a2744" : "#ebe9e3"), background: tab === t.k ? "#1a2744" : "transparent", color: tab === t.k ? "#fff" : "#8a8a9a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* 유저 관리 탭 */}
      {tab === "users" && (
        <>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="이메일 · 이름 · 닉네임 · 전화 · UID · 플랜으로 검색..."
            style={{ width: "100%", padding: "10px 14px", fontSize: 13, color: "#1a2744", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#8a8a9a" }}>로딩 중...</div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
                <thead>
                  <tr style={{ background: "#f8f7f4", borderBottom: "2px solid #ebe9e3" }}>
                    {["유저", "이메일", "전화", "가입일", "마지막 접속", "보유", "플랜", "상태", "만료일", "액션"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: "#8a8a9a", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".5px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const pm = PLAN_META[u.plan] || PLAN_META.free;
                    const sm = STATUS_META[u.status] || STATUS_META.inactive;
                    const isMe = u.id === currentUser?.id;
                    const displayName = u.full_name || u.nickname || "—";
                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f0efe9", background: isMe ? "rgba(15,165,115,0.03)" : "transparent" }}>
                        <td style={{ padding: "10px 14px", fontSize: 12 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontWeight: 700, color: "#1a2744" }}>
                              {displayName}{isMe && <span style={{ fontSize: 9, fontWeight: 800, color: "#0fa573", marginLeft: 5 }}>나</span>}
                            </span>
                            <span style={{ fontSize: 9, fontFamily: "monospace", color: "#a0a0b0" }}>{u.id.slice(0, 8)}...</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: u.email ? "#1a2744" : "#c0c0cc" }}>
                          {u.email || <span style={{ color: "#e8960a", fontSize: 11 }}>⚠️ RPC 필요</span>}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: u.phone ? "#1a2744" : "#c0c0cc", fontFamily: "monospace" }}>
                          {u.phone || "—"}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#8a8a9a", whiteSpace: "nowrap" }}>
                          {u.created_at ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              <span style={{ color: "#1a2744", fontWeight: 600 }}>{new Date(u.created_at).toLocaleDateString("ko-KR")}</span>
                              <span style={{ fontSize: 10 }}>{relTime(u.created_at)}</span>
                            </div>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#8a8a9a", whiteSpace: "nowrap" }}>
                          {relTime(u.last_sign_in_at)}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#1a2744", whiteSpace: "nowrap" }}>
                          {u.tenant_count != null ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span>🚪 {u.tenant_count}</span>
                              {u.building_count > 0 && <span style={{ color: "#5b4fcf" }}>🏢 {u.building_count}</span>}
                            </div>
                          ) : <span style={{ color: "#c0c0cc" }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: pm.color, background: pm.bg, padding: "3px 9px", borderRadius: 20 }}>{pm.label}</span>
                        </td>
                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: "3px 9px", borderRadius: 20 }}>{sm.label}</span>
                          {!u.has_subscription && <span style={{ fontSize: 9, color: "#c0c0cc", marginLeft: 4 }}>(없음)</span>}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: u.current_period_end ? "#e8445a" : "#0fa573", whiteSpace: "nowrap" }}>
                          {u.current_period_end ? new Date(u.current_period_end).toLocaleDateString("ko-KR") : "무제한"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={() => setEditModal({ userId: u.id, email: u.email, plan: u.plan, status: u.status })}
                            disabled={saving === u.id}
                            style={{ padding: "6px 12px", borderRadius: 8, background: "#1a2744", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            ✏️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 빠른 변경 */}
          <div style={{ marginTop: 22, background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(15,165,115,0.04))", border: "1px solid #e0ede8", borderRadius: 16, padding: "20px 24px" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>⚡ 내 계정 빠른 플랜 변경 (테스트용)</p>
            <p style={{ fontSize: 11, color: "#8a8a9a", marginBottom: 14 }}>현재: <strong>{currentUser?.email}</strong> · 적용 후 F5 새로고침</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(PLAN_META).map(([planId, meta]) => (
                <button key={planId} onClick={() => quickPlan(planId)} disabled={!!saving}
                  style={{ padding: "9px 20px", borderRadius: 10, border: "2px solid " + meta.color + "50", background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = meta.color + "50"; }}>
                  {meta.label} 적용
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* SQL 가이드 탭 */}
      {tab === "sql" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13, color: "#8a8a9a" }}>Supabase SQL Editor에서 실행할 수 있는 쿼리 모음입니다. ⭐ 표시 쿼리를 먼저 실행하세요.</p>
          {SQL_GUIDES.map(({ title, sql }) => (
            <div key={title} style={{ background: "#fff", border: "1px solid " + (title.startsWith("⭐") ? "#e8960a40" : "#ebe9e3"), borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", background: title.startsWith("⭐") ? "rgba(232,150,10,0.06)" : "#f8f7f4", borderBottom: "1px solid #ebe9e3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: title.startsWith("⭐") ? "#c97a00" : "#1a2744" }}>{title}</p>
                <button onClick={() => { navigator.clipboard.writeText(sql); toast("복사됨!"); }}
                  style={{ padding: "4px 12px", borderRadius: 7, background: "#1a2744", color: "#fff", border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>복사</button>
              </div>
              <pre style={{ margin: 0, padding: "14px 18px", fontSize: 12, color: "#1a2744", background: "#fafafa", overflowX: "auto", lineHeight: 1.8, fontFamily: "monospace" }}>{sql}</pre>
            </div>
          ))}
          <div style={{ background: "#edfaf5", border: "1px solid #0fa57330", borderRadius: 14, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#0fa573", marginBottom: 8 }}>📋 내 UID (복사해서 YOUR_USER_ID 자리에 붙여넣기)</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <code style={{ fontSize: 13, color: "#1a2744", background: "#fff", padding: "8px 14px", borderRadius: 8, border: "1px solid #ebe9e3", flex: 1, wordBreak: "break-all" }}>{currentUser?.id}</code>
              <button onClick={() => { navigator.clipboard.writeText(currentUser?.id || ""); toast("UID 복사됨!"); }}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#0fa573", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>복사</button>
            </div>
          </div>
        </div>
      )}

      {/* 편집 모달 */}
      {editModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px 32px", width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: "#1a2744", marginBottom: 4 }}>플랜 편집</h3>
            <p style={{ fontSize: 12, color: "#1a2744", fontWeight: 600, marginBottom: 2 }}>{editModal.email || "이메일 없음"}</p>
            <p style={{ fontSize: 10, color: "#8a8a9a", fontFamily: "monospace", marginBottom: 20 }}>{editModal.userId}</p>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>플랜</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
              {Object.entries(PLAN_META).map(([planId, meta]) => (
                <button key={planId} onClick={() => setEditModal(m => ({ ...m, plan: planId }))}
                  style={{ padding: "10px", borderRadius: 10, border: "2px solid " + (editModal.plan === planId ? meta.color : "#ebe9e3"), background: editModal.plan === planId ? meta.bg : "transparent", color: editModal.plan === planId ? meta.color : "#8a8a9a", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  {meta.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>구독 상태</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
              {Object.entries(STATUS_META).map(([stId, meta]) => (
                <button key={stId} onClick={() => setEditModal(m => ({ ...m, status: stId }))}
                  style={{ padding: "9px", borderRadius: 10, border: "2px solid " + (editModal.status === stId ? meta.color : "#ebe9e3"), background: editModal.status === stId ? meta.bg : "transparent", color: editModal.status === stId ? meta.color : "#8a8a9a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {meta.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditModal(null)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
              <button onClick={() => updatePlan({ userId: editModal.userId, plan: editModal.plan, status: editModal.status })}
                disabled={saving === editModal.userId}
                style={{ flex: 2, padding: "12px", borderRadius: 11, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                {saving ? "저장 중..." : "✅ 저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
