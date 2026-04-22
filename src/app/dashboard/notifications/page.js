"use client"; import { useState, useEffect } from "react"; import { useRouter } from "next/navigation"; import { SectionLabel, toast } from "../../../components/shared"; import { C, daysLeft } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; import { supabase } from "../../../lib/supabase";

const TYPE_CONFIG = {
  unpaid:   { icon:"💰", label:"미납 알림",     color:"#e8445a",  bg:"rgba(232,68,90,0.08)" },
  expiry:   { icon:"📅", label:"만료 알림",     color:"#e8960a",  bg:"rgba(232,150,10,0.08)" },
  deposit:  { icon:"💜", label:"보증금 반환",   color:"#7c3aed",  bg:"rgba(124,58,237,0.08)" },
  monthly:  { icon:"📊", label:"월간 리포트",   color:"#1a2744",  bg:"rgba(26,39,68,0.06)" },
  kakao:    { icon:"💬", label:"카카오 알림톡", color:"#f5c52e",  bg:"rgba(245,197,46,0.12)" },
  manual:   { icon:"✉️", label:"직접 발송",     color:"#3b5bdb",  bg:"rgba(59,91,219,0.08)" },
};

const TEMPLATE_LABELS = {
  unpaid: "미납",
  unpaid_with_mgt: "미납+관리비",
  upcoming: "납부예정",
  upcoming_with_mgt: "납부예정+관리비",
  expiring: "만료임박",
};

const TEMPLATE_TO_TAB = {
  unpaid: "unpaid",
  unpaid_with_mgt: "unpaid",
  upcoming: "upcoming",
  upcoming_with_mgt: "upcoming",
  expiring: "expiring",
};

export default function NotificationsPage() {
  const { user, tenants } = useApp();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("전체");
  const [page, setPage] = useState(0);
  const [resending, setResending] = useState({});
  const PAGE_SIZE = 20;

  const resend = async (log) => {
    if (!log || !log.tenant_id || !log.template_key) { toast("재발송에 필요한 정보가 부족합니다", "error"); return; }
    const tenant = tenants.find(t => t.id === log.tenant_id);
    if (!tenant) { toast("세입자를 찾을 수 없습니다 (삭제되었을 수 있음)", "error"); return; }
    if (!tenant.phone) { toast("세입자 전화번호가 없습니다", "error"); return; }
    const tab = TEMPLATE_TO_TAB[log.template_key] || "unpaid";
    setResending(s => ({ ...s, [log.id]: true }));
    try {
      const dl = daysLeft(tenant.end_date || tenant.end || "");
      const today = new Date().getDate();
      const res = await fetch("/api/kakao/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab, tenant: { ...tenant, daysLeft: dl, daysUntilPay: (tenant.pay_day || 5) - today }, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast("재발송 실패: " + (data.error || "알 수 없는 오류"), "error"); }
      else { toast(tenant.name + "님 재발송 완료 ✓"); loadLogs(); }
    } catch (err) {
      toast("재발송 중 오류: " + err.message, "error");
    } finally {
      setResending(s => ({ ...s, [log.id]: false }));
    }
  };

  useEffect(() => {
    if (!user) return;
    loadLogs();
  }, [user, filter, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from("notification_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filter !== "전체") q = q.eq("type", filter);
      const { data, error } = await q;
      if (error) throw error;
      setLogs(data || []);
    } catch {
      // notification_logs 테이블이 없을 수 있음 — 빈 배열로 처리
      setLogs([]);
    }
    setLoading(false);
  };

  const timeAgo = (dt) => {
    if (!dt) return "";
    const d = (Date.now() - new Date(dt)) / 1000;
    if (d < 60) return "방금";
    if (d < 3600) return Math.floor(d / 60) + "분 전";
    if (d < 86400) return Math.floor(d / 3600) + "시간 전";
    if (d < 86400 * 30) return Math.floor(d / 86400) + "일 전";
    return new Date(dt).toLocaleDateString("ko-KR");
  };

  const getStatusBadge = (status) => {
    if (status === "success" || status === "sent") return { label:"발송 완료", color:"#0fa573", bg:"rgba(15,165,115,0.1)" };
    if (status === "failed") return { label:"발송 실패", color:"#e8445a", bg:"rgba(232,68,90,0.1)" };
    return { label:"처리중", color:"#8a8a9a", bg:"rgba(138,138,154,0.1)" };
  };

  const filterTabs = ["전체", ...Object.keys(TYPE_CONFIG)];

  // 통계
  const totalSent = logs.filter(l => l.status === "success" || l.status === "sent").length;
  const totalFailed = logs.filter(l => l.status === "failed").length;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>NOTIFICATION HISTORY</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>알림 발송 히스토리</h1>
        <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>세입자에게 발송된 알림 기록을 확인합니다</p>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { l: "전체 발송", v: logs.length + "건", c: "#1a2744" },
          { l: "발송 완료", v: totalSent + "건", c: "#0fa573" },
          { l: "발송 실패", v: totalFailed + "건", c: totalFailed > 0 ? "#e8445a" : "#8a8a9a" },
        ].map(k => (
          <div key={k.l} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{k.l}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* 필터 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {filterTabs.map(t => (
          <button key={t} onClick={() => { setFilter(t); setPage(0); }} style={{ padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter===t?"#1a2744":"#ebe9e3"}`, background: filter===t?"#1a2744":"transparent", color: filter===t?"#fff":"#8a8a9a" }}>
            {t !== "전체" && TYPE_CONFIG[t] ? TYPE_CONFIG[t].icon + " " : ""}{t !== "전체" && TYPE_CONFIG[t] ? TYPE_CONFIG[t].label : t}
          </button>
        ))}
      </div>

      {/* 로그 목록 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#8a8a9a" }}>불러오는 중...</div>
      ) : logs.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🔔</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a2744", marginBottom: 6 }}>
            {filter === "전체" ? "아직 발송된 알림이 없습니다" : `${TYPE_CONFIG[filter]?.label || filter} 기록이 없습니다`}
          </p>
          <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.7 }}>
            미납 알림, 계약 만료 알림, 월간 리포트 등을 발송하면<br/>이 곳에 기록됩니다.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <button onClick={() => router.push("/dashboard/payments")} style={{ padding: "10px 20px", borderRadius: 11, background: "rgba(232,68,90,0.1)", border: "1px solid rgba(232,68,90,0.2)", color: "#e8445a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💰 수금 현황 가기</button>
            <button onClick={() => router.push("/dashboard/tenants")} style={{ padding: "10px 20px", borderRadius: 11, background: "rgba(26,39,68,0.06)", border: "1px solid rgba(26,39,68,0.15)", color: "#1a2744", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>👤 세입자 관리 가기</button>
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}>
          {logs.map((log, i) => {
            const tc = TYPE_CONFIG[log.type] || TYPE_CONFIG.manual;
            const st = getStatusBadge(log.status);
            const tenant = tenants.find(t => t.id === log.tenant_id);
            return (
              <div key={log.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 20px", borderBottom: i < logs.length - 1 ? "1px solid #f0efe9" : "none" }}>
                {/* 아이콘 */}
                <div style={{ width: 38, height: 38, borderRadius: 11, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {tc.icon}
                </div>
                {/* 내용 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{tc.label}</span>
                      {log.template_key && TEMPLATE_LABELS[log.template_key] && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#5b4fcf", background: "rgba(91,79,207,0.1)", padding: "1px 7px", borderRadius: 4 }}>{TEMPLATE_LABELS[log.template_key]}</span>
                      )}
                      {tenant && <span style={{ fontSize: 12, color: "#8a8a9a" }}>→ {tenant.name}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: "2px 8px", borderRadius: 20 }}>{st.label}</span>
                      <span style={{ fontSize: 11, color: "#a0a0b0" }}>{timeAgo(log.sent_at)}</span>
                    </div>
                  </div>
                  {log.message && <p style={{ fontSize: 12, color: "#6a6a7a", lineHeight: 1.6, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.message}</p>}
                  {log.error_message && (
                    <p style={{ fontSize: 11, color: "#e8445a", marginTop: 4, background: "rgba(232,68,90,0.06)", padding: "4px 8px", borderRadius: 6, lineHeight: 1.5 }}>⚠️ {log.error_message}</p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    {log.channel && <p style={{ fontSize: 11, color: "#a0a0b0", margin: 0 }}>채널: {log.channel === "kakao" ? "카카오 알림톡" : log.channel === "email" ? "이메일" : log.channel === "sms" ? "문자" : log.channel}</p>}
                    {log.channel === "kakao" && log.template_key && log.tenant_id && (
                      <button onClick={() => resend(log)} disabled={resending[log.id]}
                        style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: resending[log.id] ? "not-allowed" : "pointer", border: `1px solid ${C.indigo}40`, background: resending[log.id] ? "#f0efe9" : "rgba(26,39,68,0.06)", color: C.indigo, opacity: resending[log.id] ? 0.7 : 1 }}>
                        {resending[log.id] ? "재발송 중..." : "↻ 재발송"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {logs.length === PAGE_SIZE && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => setPage(p => p + 1)} style={{ padding: "10px 24px", borderRadius: 11, border: "1px solid #ebe9e3", background: "#fff", color: "#1a2744", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            더 보기
          </button>
        </div>
      )}

      {/* 안내 */}
      <div style={{ marginTop: 20, background: "rgba(26,39,68,0.04)", borderRadius: 12, padding: "14px 18px" }}>
        <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.8, margin: 0 }}>
          💡 알림 발송 기록은 세입자와의 분쟁 시 증거로 활용될 수 있습니다. 알림을 보낸 일시와 내용이 자동으로 저장됩니다.
        </p>
      </div>
    </div>
  );
}
