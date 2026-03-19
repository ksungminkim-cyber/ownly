// src/app/dashboard/premium/kakao-alert/page.js
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { daysLeft } from "../../../../lib/constants";

const C = {
  navy:"#1a2744", amber:"#e8960a", rose:"#e8445a", emerald:"#0fa573",
  surface:"var(--surface)", border:"var(--border)", muted:"var(--text-muted)", faint:"var(--surface2)"
};
const KAKAO = "#FEE500";

const TAB_ITEMS = [
  { key: "unpaid",   label: "\ubbf8\ub0a9 \uc54c\ub9bc",        icon: "\u26a0\ufe0f" },
  { key: "upcoming", label: "\ub0a9\ubd80\uc77c \uc608\uc815 \uc54c\ub9bc", icon: "\ud83d\udd14" },
  { key: "expiring", label: "\uacc4\uc57d \ub9cc\ub8cc \uc54c\ub9bc",  icon: "\ud83d\udcc5" },
];

// \uad00\ub9ac\ube44\ub97c \uc784\ub300\uc778\uc774 \uc218\ub839\ud558\ub294\uc9c0 \ud310\ub2e8
function isOwnerMgt(t) {
  if (t.pType === "\uc0c1\uac00") return true;
  if (t.pType === "\uc8fc\uac70") return !["\uc544\ud30c\ud2b8", "\uc624\ud53c\uc2a4\ud154"].includes(t.sub);
  return false;
}

export default function KakaoAlertPage() {
  const router = useRouter();
  const { tenants } = useApp();
  const [tab, setTab]       = useState("unpaid");
  const [sent, setSent]     = useState({});
  const [sending, setSending] = useState({});
  const [error, setError]   = useState({});
  const [preview, setPreview] = useState(null);

  const today    = new Date().getDate();
  const unpaid   = tenants.filter(t => t.status === "\ubbf8\ub0a9");
  const upcoming = tenants.filter(t => today >= 2 && today <= 5 && t.status !== "\ubbf8\ub0a9");
  const expiring = tenants.filter(t => { const dl = daysLeft(t.end_date || t.end || ""); return dl > 0 && dl <= 30; });
  const counts   = { unpaid: unpaid.length, upcoming: upcoming.length, expiring: expiring.length };
  const getList  = () => tab === "unpaid" ? unpaid : tab === "upcoming" ? upcoming : expiring;

  // \uc2e4\uc81c \uc194\ub77c\ud53c API \ud638\ucd9c
  const send = async (t) => {
    const key = tab + "_" + t.id;
    if (!t.phone) {
      setError(e => ({ ...e, [key]: "\uc804\ud654\ubc88\ud638\uac00 \uc5c6\uc2b5\ub2c8\ub2e4. \ubb3c\uac74 \uad00\ub9ac\uc5d0\uc11c \uc785\ub825\ud574\uc8fc\uc138\uc694." }));
      return;
    }
    setSending(s => ({ ...s, [key]: true }));
    setError(e => ({ ...e, [key]: null }));
    try {
      const dl = daysLeft(t.end_date || t.end || "");
      const res = await fetch("/api/kakao/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab,
          tenant: { ...t, daysLeft: dl, payDay: "5" },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(e => ({ ...e, [key]: data.error || "\ubc1c\uc1a1 \uc2e4\ud328" }));
      } else {
        setSent(s => ({ ...s, [key]: true }));
        setPreview(null);
      }
    } catch (err) {
      setError(e => ({ ...e, [key]: err.message }));
    }
    setSending(s => ({ ...s, [key]: false }));
  };

  // \ubbf8\ub9ac\ubcf4\uae30 \uba54\uc2dc\uc9c0
  const getPreviewMsg = (t) => {
    const dl   = daysLeft(t.end_date || t.end || "");
    const rent = (t.rent || 0).toLocaleString();
    const mgt  = (t.maintenance || 0).toLocaleString();
    const total = ((t.rent || 0) + (t.maintenance || 0)).toLocaleString();
    const hasMgt = isOwnerMgt(t) && (t.maintenance || 0) > 0;
    const addr = t.addr || "\ud574\ub2f9 \ubb3c\uac74";
    const today = new Date().toLocaleDateString("ko-KR");

    if (tab === "unpaid") {
      if (hasMgt) return `[\uc628\ub9ac \uc218\uae08 \uc54c\ub9bc]\n\n${t.name}\ub2d8, \uc548\ub155\ud558\uc138\uc694.\n\uc628\ub9ac(Ownly) \uc784\ub300\uad00\ub9ac \uc11c\ube44\uc2a4\uc785\ub2c8\ub2e4.\n\n\uc774\ubc88 \ub2ec \uc6d4\uc138 \ubc0f \uad00\ub9ac\ube44\uac00 \ubbf8\ub0a9 \uc0c1\ud0dc\uc785\ub2c8\ub2e4.\n\n\u25a0 \uc784\ub300 \uc8fc\uc18c: ${addr}\n\u25a0 \uc6d4\uc138: ${rent}\ub9cc\uc6d0\n\u25a0 \uad00\ub9ac\ube44: ${mgt}\ub9cc\uc6d0\n\u25a0 \ud569\uacc4: ${total}\ub9cc\uc6d0\n\u25a0 \ub0a9\ubd80 \uc694\uccad\uc77c: ${today}\uae4c\uc9c0`;
      return `[\uc628\ub9ac \uc218\uae08 \uc54c\ub9bc]\n\n${t.name}\ub2d8, \uc548\ub155\ud558\uc138\uc694.\n\uc628\ub9ac(Ownly) \uc784\ub300\uad00\ub9ac \uc11c\ube44\uc2a4\uc785\ub2c8\ub2e4.\n\n\uc774\ubc88 \ub2ec \uc6d4\uc138\uac00 \ubbf8\ub0a9 \uc0c1\ud0dc\uc785\ub2c8\ub2e4.\n\n\u25a0 \uc784\ub300 \uc8fc\uc18c: ${addr}\n\u25a0 \ubbf8\ub0a9 \uae08\uc561: ${rent}\ub9cc\uc6d0\n\u25a0 \ub0a9\ubd80 \uc694\uccad\uc77c: ${today}\uae4c\uc9c0`;
    }
    if (tab === "upcoming") {
      if (hasMgt) return `[\uc628\ub9ac \ub0a9\ubd80 \uc548\ub0b4]\n\n${t.name}\ub2d8, \uc548\ub155\ud558\uc138\uc694.\n\uc628\ub9ac(Ownly) \uc784\ub300\uad00\ub9ac \uc11c\ube44\uc2a4\uc785\ub2c8\ub2e4.\n\n\uc6d4\uc138 \ubc0f \uad00\ub9ac\ube44 \ub0a9\ubd80\uc77c\uc774 ${5 - today + 1}\uc77c \ub0a8\uc558\uc2b5\ub2c8\ub2e4.\n\n\u25a0 \uc784\ub300 \uc8fc\uc18c: ${addr}\n\u25a0 \uc6d4\uc138: ${rent}\ub9cc\uc6d0\n\u25a0 \uad00\ub9ac\ube44: ${mgt}\ub9cc\uc6d0\n\u25a0 \ud569\uacc4: ${total}\ub9cc\uc6d0\n\u25a0 \ub0a9\ubd80 \uc608\uc815\uc77c: \ub9e4\uc6d4 5\uc77c`;
      return `[\uc628\ub9ac \ub0a9\ubd80 \uc548\ub0b4]\n\n${t.name}\ub2d8, \uc548\ub155\ud558\uc138\uc694.\n\uc628\ub9ac(Ownly) \uc784\ub300\uad00\ub9ac \uc11c\ube44\uc2a4\uc785\ub2c8\ub2e4.\n\n\uc6d4\uc138 \ub0a9\ubd80\uc77c\uc774 ${5 - today + 1}\uc77c \ub0a8\uc558\uc2b5\ub2c8\ub2e4.\n\n\u25a0 \uc784\ub300 \uc8fc\uc18c: ${addr}\n\u25a0 \ub0a9\ubd80 \uae08\uc561: ${rent}\ub9cc\uc6d0\n\u25a0 \ub0a9\ubd80 \uc608\uc815\uc77c: \ub9e4\uc6d4 5\uc77c`;
    }
    return `[\uc628\ub9ac \uacc4\uc57d \ub9cc\ub8cc \uc548\ub0b4]\n\n${t.name}\ub2d8, \uc548\ub155\ud558\uc138\uc694.\n\uc628\ub9ac(Ownly) \uc784\ub300\uad00\ub9ac \uc11c\ube44\uc2a4\uc785\ub2c8\ub2e4.\n\n\uc784\ub300\ucc28 \uacc4\uc57d \ub9cc\ub8cc\uc77c\uc774 ${dl}\uc77c \ub0a8\uc558\uc2b5\ub2c8\ub2e4.\n\n\u25a0 \uc784\ub300 \uc8fc\uc18c: ${addr}\n\u25a0 \uacc4\uc57d \ub9cc\ub8cc\uc77c: ${t.end_date || t.end || "\ubbf8\uc815"}\n\u25a0 \uc794\uc5ec\uc77c: ${dl}\uc77c`;
  };

  const list = getList();

  return (
    <div className="page-in page-padding" style={{ maxWidth: 720, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        {"\u2190 \ub300\uc2dc\ubcf4\ub4dc\ub85c"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${KAKAO},#e6ce00)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{"\ud83d\udcac"}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.4px" }}>{"\uce74\uce74\uc624 \uc54c\ub9bc \ubc1c\uc1a1"}</h1>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.amber, background: "rgba(232,150,10,0.12)", padding: "3px 8px", borderRadius: 6 }}>PRO</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>{"\ubbf8\ub0a9\xb7\ub0a9\ubd80\uc608\uc815\xb7\uacc4\uc57d\ub9cc\ub8cc \uc138\uc785\uc790\uc5d0\uac8c \uce74\uce74\uc624 \uc54c\ub9bc\ud1a1\uc744 \ubc1c\uc1a1\ud569\ub2c8\ub2e4"}</p>
        </div>
      </div>

      {/* \ud0ed */}
      <div className="tab-scroll" style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TAB_ITEMS.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setPreview(null); }}
            style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 36, whiteSpace: "nowrap",
              border: `1px solid ${tab === tb.key ? C.navy : "var(--border)"}`,
              background: tab === tb.key ? C.navy : "transparent",
              color: tab === tb.key ? "#fff" : C.muted,
              display: "flex", alignItems: "center", gap: 6 }}>
            <span>{tb.icon}</span>
            <span>{tb.label}</span>
            {counts[tb.key] > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, background: tab === tb.key ? "rgba(255,255,255,0.2)" : C.rose + "20", color: tab === tb.key ? "#fff" : C.rose, padding: "1px 6px", borderRadius: 20 }}>
                {counts[tb.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* \ub9ac\uc2a4\ud2b8 */}
      <div style={{ background: C.surface, border: "1px solid var(--border)", borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(26,39,68,0.06)" }}>
        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>{tab === "unpaid" ? "\ud83c\udf89" : "\u2705"}</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
              {tab === "unpaid" ? "\ubbf8\ub0a9 \uac74\uc774 \uc5c6\uc5b4\uc694!" : tab === "upcoming" ? "\ub0a9\ubd80 \uc608\uc815 \uc138\uc785\uc790 \uc5c6\uc74c" : "\ub9cc\ub8cc \uc784\ubc15 \uacc4\uc57d \uc5c6\uc74c"}
            </p>
            <p style={{ fontSize: 13, color: C.muted }}>{tab === "unpaid" ? "\ubaa8\ub4e0 \uc138\uc785\uc790\uac00 \uc815\uc0c1 \ub0a9\ubd80 \uc911\uc785\ub2c8\ub2e4" : ""}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map(t => {
              const key    = tab + "_" + t.id;
              const isSent = sent[key];
              const isSending = sending[key];
              const errMsg = error[key];
              const dl     = daysLeft(t.end_date || t.end || "");
              const hasMgt = isOwnerMgt(t) && (t.maintenance || 0) > 0;

              return (
                <div key={t.id} style={{ border: `1px solid ${isSent ? C.emerald + "40" : "var(--border)"}`, borderRadius: 16, padding: 18, background: isSent ? "rgba(15,165,115,0.04)" : C.faint, transition: "all .3s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{t.name}</p>
                        {hasMgt && <span style={{ fontSize: 10, fontWeight: 700, color: "#5b4fcf", background: "rgba(91,79,207,0.1)", padding: "2px 6px", borderRadius: 5 }}>{"관리비포함"}</span>}
                        {!t.phone && <span style={{ fontSize: 10, fontWeight: 700, color: C.rose, background: "rgba(232,68,90,0.1)", padding: "2px 6px", borderRadius: 5 }}>{"번호없음"}</span>}
                      </div>
                      <p style={{ fontSize: 12, color: C.muted }}>{t.sub} {"\xb7"} {t.addr}</p>
                      {t.phone && <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t.phone}</p>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 17, fontWeight: 900, color: tab === "expiring" ? C.amber : C.rose }}>
                        {tab === "expiring" ? `D-${dl}` : `${((t.rent||0)+(hasMgt?t.maintenance||0:0)).toLocaleString()}\ub9cc\uc6d0`}
                      </p>
                      <p style={{ fontSize: 11, color: C.muted }}>{tab === "expiring" ? "\ub9cc\ub8cc\uae4c\uc9c0" : tab === "unpaid" ? "\ubbf8\ub0a9" : "\ub0a9\ubd80\uc608\uc815"}</p>
                    </div>
                  </div>

                  {errMsg && (
                    <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(232,68,90,0.08)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 8 }}>
                      <p style={{ fontSize: 12, color: C.rose, fontWeight: 600 }}>{"\u26a0\ufe0f "}{errMsg}</p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setPreview(preview?.id === t.id && preview?.tab === tab ? null : { ...t, tab })}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: C.surface, border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 40 }}>
                      {"\ubbf8\ub9ac\ubcf4\uae30"}
                    </button>
                    <button onClick={() => send(t)} disabled={isSent || isSending || !t.phone}
                      style={{ flex: 2, padding: "10px 0", borderRadius: 10, minHeight: 40,
                        background: isSent ? C.emerald : isSending ? "#94a3b8" : !t.phone ? "#e5e7eb" : KAKAO,
                        color: isSent || isSending ? "#fff" : !t.phone ? "#9ca3af" : "#1a1a1a",
                        border: "none", fontSize: 13, fontWeight: 800,
                        cursor: isSent || !t.phone ? "not-allowed" : "pointer", transition: "all .2s" }}>
                      {isSent ? "\u2705 \ubc1c\uc1a1 \uc644\ub8cc" : isSending ? "\ubc1c\uc1a1 \uc911..." : !t.phone ? "\uc804\ud654\ubc88\ud638 \uc5c6\uc74c" : "\ud83d\udcac \uce74\uce74\uc624 \uc54c\ub9bc \ubc1c\uc1a1"}
                    </button>
                  </div>

                  {preview?.id === t.id && preview?.tab === tab && (
                    <div style={{ marginTop: 12, background: C.surface, border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, letterSpacing: "1px" }}>{"알림 메시지 미리보기"}</p>
                      <pre style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{getPreviewMsg(t)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* \uc548\ub0b4 */}
      <div style={{ background: "rgba(254,229,0,0.08)", border: `1px solid ${KAKAO}40`, borderRadius: 14, padding: "14px 18px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#b8a000", marginBottom: 4 }}>{"\ud83d\udca1 \uc194\ub77c\ud53c \uc54c\ub9bc\ud1a1 \uc5f0\ub3d9"}</p>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          {"\uc54c\ub9bc\ud1a1 \ubc1c\uc1a1 \uc2e4\ud328 \uc2dc SMS\ub85c \ub300\uccb4 \ubc1c\uc1a1\ub429\ub2c8\ub2e4. \uc138\uc785\uc790 \uc804\ud654\ubc88\ud638\uac00 \uc5c6\ub294 \uacbd\uc6b0 \ubb3c\uac74 \uad00\ub9ac\uc5d0\uc11c \uba3c\uc800 \uc785\ub825\ud574\uc8fc\uc138\uc694."}
        </p>
      </div>
    </div>
  );
}
