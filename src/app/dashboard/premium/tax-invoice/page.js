"use client";
// 세무사 연결 — 사전 신청 (준비 중인 서비스)
// 온리는 전자세금계산서를 직접 발행하지 않는다. 신청을 저장·운영자에게 전달하고, 운영자가 확인 후 직접 연락한다.
// (2026-09-28 이전 화면의 제휴 세무사 3곳·평점·리뷰 수·"1시간 내 연락"은 실재하지 않는 정보라 제거)
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import { supabase } from "../../../../lib/supabase";
import { toast } from "../../../../components/shared";

const ISSUE_TYPES = [
  { key: "rent", label: "월세 세금계산서" },
  { key: "mgt", label: "관리비 세금계산서" },
  { key: "vat", label: "부가세 신고 상담" },
  { key: "other", label: "기타 임대 세무 상담" },
];
const STATUS = { pending: "접수", processing: "확인 중", done: "연락 완료", cancelled: "취소" };

async function authFetch(url, opts = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } });
}

export default function TaxInvoiceRequestPage() {
  const router = useRouter();
  const { tenants } = useApp();
  const [issueType, setIssueType] = useState("rent");
  const [tenantId, setTenantId] = useState("");
  const [supplyAmt, setSupplyAmt] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 7));
  const [bizNo, setBizNo] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await authFetch("/api/tax-invoice").catch(() => null);
      const json = res && res.ok ? await res.json().catch(() => ({})) : {};
      if (!cancelled) setHistory(json.data || []);
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const submit = async () => {
    const tenant = tenants.find((t) => t.id === tenantId);
    setSubmitting(true);
    try {
      const res = await authFetch("/api/tax-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType, issueTypeLabel: ISSUE_TYPES.find((t) => t.key === issueType)?.label,
          tenantId: tenant?.id || null, tenantName: tenant?.name || null,
          supplyAmt: Number(supplyAmt) || 0, issueDate, bizNo, memo,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "신청 실패");
      toast("신청이 접수됐어요. 운영자가 확인 후 영업일 1~2일 안에 연락드립니다.");
      setSupplyAmt(""); setMemo(""); setBizNo("");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const input = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" };
  const label = { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 640 }}>
      <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }}>← 돌아가기</button>
      <p className="section-eyebrow">사전 신청 · 준비 중</p>
      <h1 className="section-title" style={{ marginBottom: 10 }}>세무사 연결 신청</h1>

      <div className="surface-card" style={{ padding: "14px 16px", marginBottom: 16, background: "var(--accent-light)", border: "1px solid var(--accent-border)" }}>
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.75, margin: 0 }}>
          세무사 연결은 아직 <b>준비 중인 서비스</b>입니다. 신청을 남기시면 <b>운영자가 내용을 직접 확인한 뒤 영업일 기준 1~2일 안에</b> 이메일로 연락드리고, 가능한 세무사를 안내해 드립니다.
          온리는 전자세금계산서를 직접 발행하지 않으며, 세무사 수수료는 연결되는 세무사와 직접 정하시게 됩니다. 직접 발행은 국세청 홈택스(전자세금계산서)에서 할 수 있습니다.
        </p>
      </div>

      <div className="surface-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <span style={label}>요청 유형</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ISSUE_TYPES.map((t) => (
              <button key={t.key} type="button" onClick={() => setIssueType(t.key)} className={`chip${issueType === t.key ? " is-active" : ""}`}>{t.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={label}>관련 세입자 (선택)</label>
          <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} style={input}>
            <option value="">선택 안 함</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.addr}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
          <div>
            <label style={label}>공급가액 (원, 선택)</label>
            <input value={supplyAmt} onChange={(e) => setSupplyAmt(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="예: 1000000" style={input} />
            {Number(supplyAmt) > 0 && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>부가세 10% {Math.round(Number(supplyAmt) * 0.1).toLocaleString()}원 · 합계 {Math.round(Number(supplyAmt) * 1.1).toLocaleString()}원</p>}
          </div>
          <div>
            <label style={label}>대상 연월</label>
            <input type="month" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} style={input} />
          </div>
          <div>
            <label style={label}>임차인 사업자번호 (선택)</label>
            <input value={bizNo} onChange={(e) => setBizNo(e.target.value)} placeholder="000-00-00000" style={input} />
          </div>
        </div>
        <div>
          <label style={label}>요청 내용</label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="예: 매월 상가 월세 세금계산서 발행을 맡길 세무사를 찾고 있어요" style={{ ...input, resize: "vertical" }} />
        </div>
        <button onClick={submit} disabled={submitting} className="btn btn-fill" style={{ opacity: submitting ? 0.7 : 1 }}>
          {submitting ? "접수 중..." : "사전 신청하기"}
        </button>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <p className="section-eyebrow" style={{ marginBottom: 8 }}>내 신청 내역</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((h) => (
              <div key={h.id} className="surface-card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{h.issue_type_label || "세무 상담"}{h.tenant_name ? ` · ${h.tenant_name}` : ""}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>{String(h.created_at).slice(0, 10)} 신청 · 대상 {h.issue_date}{h.supply_amt ? ` · 공급가액 ${Number(h.supply_amt).toLocaleString()}원` : ""}</p>
                </div>
                <span className={`chip ${h.status === "done" ? "chip-success" : "chip-info"}`}>{STATUS[h.status] || h.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
