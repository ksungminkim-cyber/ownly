"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { isSampleTenant } from "../lib/sampleData";
import { track } from "../lib/track";
import { toast } from "./shared";

// 첫 물건 등록 이후 "다음 단계" 3개 — 완료되면(3/3) 또는 닫으면 더 이상 표시하지 않는다.
//  ① 물건 등록        : 샘플이 아닌 물건 1개 이상
//  ② 이번 달 납부 기록 : 이번 달 paid 납부 1건 이상
//  ③ 세입자 포털 공유  : 포털 링크를 한 번이라도 복사 (여기서 바로 복사 가능, tenants 페이지 복사도 인정)
const PORTAL_SHARED_KEY = "ownly_portal_shared";
const DISMISS_KEY = "ownly_checklist_dismissed";
const DONE_KEY = "ownly_checklist_done";

function readFlag(key) { try { return !!localStorage.getItem(key); } catch { return false; } }

export default function SetupChecklist() {
  const router = useRouter();
  const { tenants, payments } = useApp();
  const [dismissed, setDismissed] = useState(() => readFlag(DISMISS_KEY) || readFlag(DONE_KEY));
  const [portalShared, setPortalShared] = useState(() => readFlag(PORTAL_SHARED_KEY));

  const real = tenants.filter(t => !isSampleTenant(t));
  const now = new Date();
  const realIds = new Set(real.map(t => t.id)); const paidThisMonth = payments.some(p => realIds.has(p.tid) && p.status === "paid" && (p.year || now.getFullYear()) === now.getFullYear() && p.month === now.getMonth() + 1);
  const stepsDone = [real.length > 0, paidThisMonth, portalShared];
  const doneCount = stepsDone.filter(Boolean).length;
  const allDone = real.length > 0 && doneCount === stepsDone.length;

  // 3/3 도달 시 1회 기록 (렌더 중 부수효과 금지 → effect)
  useEffect(() => {
    if (!allDone || readFlag(DONE_KEY)) return;
    try { localStorage.setItem(DONE_KEY, "1"); } catch {}
    track("checklist_done");
  }, [allDone]);

  if (dismissed || real.length === 0) return null;

  const copyPortal = () => {
    const t = real[0];
    const url = `${window.location.origin}/portal/${t.id}`;
    const after = () => {
      try { localStorage.setItem(PORTAL_SHARED_KEY, "1"); } catch {}
      setPortalShared(true);
      track("portal_link_copied", { from: "checklist" });
      toast(`${t.name}님 포털 링크를 복사했어요 — 카톡으로 보내면 세입자가 바로 열어볼 수 있습니다`);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(after, () => toast(url));
    else toast(url);
  };

  const close = () => { try { localStorage.setItem(DISMISS_KEY, "1"); } catch {} setDismissed(true); };

  const steps = [
    { id: "property", label: "첫 물건 등록", done: stepsDone[0], hint: `${real.length}개 등록됨` },
    { id: "payment", label: "이번 달 납부 기록", done: stepsDone[1], hint: "입금 문자를 붙여넣으면 금액·날짜를 자동 인식", go: () => router.push("/dashboard/payments") },
    { id: "portal", label: "세입자에게 포털 링크 보내기", done: stepsDone[2], hint: "세입자가 납부 이력·수리 요청을 직접 확인", go: copyPortal },
  ];

  if (allDone) {
    return (
      <div className="card-in" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 16, borderRadius: 12, background: "rgba(15,165,115,0.06)", border: "1px solid rgba(15,165,115,0.2)" }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <p style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>기본 설정 완료 — 이제 미납·만료·정책 변화는 온리가 대신 지켜봅니다</p>
        <button onClick={close} aria-label="닫기" style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 16, cursor: "pointer" }}>×</button>
      </div>
    );
  }

  return (
    <div className="card-in surface-card" style={{ padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <p className="section-eyebrow" style={{ margin: 0 }}>시작하기</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: "2px 0 0" }}>3단계만 끝내면 매달 할 일이 사라집니다 <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{doneCount}/{steps.length}</span></p>
        </div>
        <button onClick={close} aria-label="닫기" style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 16, cursor: "pointer" }}>×</button>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: "var(--surface3, #f0efe9)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${(doneCount / steps.length) * 100}%`, background: "var(--accent)", transition: "width var(--t-med) var(--ease)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((s, i) => (
          <div key={s.id} onClick={() => !s.done && s.go && s.go()} role={s.done ? undefined : "button"}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, cursor: s.done ? "default" : "pointer", background: s.done ? "transparent" : "var(--surface2, #faf9f6)", transition: "background var(--t-fast) var(--ease)" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, background: s.done ? "#0fa573" : "var(--surface3, #f0efe9)", color: s.done ? "#fff" : "var(--text-muted)" }}>{s.done ? "✓" : i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: s.done ? "var(--text-muted)" : "var(--text)", margin: 0, textDecoration: s.done ? "line-through" : "none" }}>{s.label}</p>
              <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "1px 0 0" }}>{s.hint}</p>
            </div>
            {!s.done && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", whiteSpace: "nowrap" }}>{s.id === "portal" ? "링크 복사" : "바로가기"} →</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
