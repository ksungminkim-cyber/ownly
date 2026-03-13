"use client";
import { useState, useEffect } from "react";
import { SectionLabel, EmptyState, Modal, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";
import PlanGate from "../../../components/PlanGate";

export default function CertifiedPage() {
  return <PlanGate feature="certified"><CertifiedContent /></PlanGate>;
}

function CertifiedContent() {
  const { tenants, user } = useApp();
  const [showModal, setShowModal]         = useState(false);
  const [showDetail, setShowDetail]       = useState(null);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [reason, setReason]               = useState("미납");
  const [content, setContent]             = useState("");
  const [history, setHistory]             = useState([]);
  const [loading, setLoading]             = useState(true);

  const REASONS = ["미납", "퇴거 요청", "계약 위반", "재계약 거절", "기타"];

  // Supabase에서 불러오기
  useEffect(() => {
    if (!user) return;
    supabase
      .from("certified_mail")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setHistory(data);
        setLoading(false);
      });
  }, [user]);

  // 저장
  const send = async () => {
    if (!selectedTenant || !content.trim()) { toast("내용을 입력하세요", "error"); return; }
    const tenant = tenants.find((t) => String(t.id) === selectedTenant);
    const row = {
      user_id:     user.id,
      tenant_id:   tenant?.id || null,
      tenant_name: tenant?.name || "알수없음",
      reason,
      content,
    };
    const { data, error } = await supabase.from("certified_mail").insert(row).select().single();
    if (error) { toast("저장 오류: " + error.message, "error"); return; }
    setHistory((prev) => [data, ...prev]);
    toast("내용증명이 저장되었습니다");
    setShowModal(false);
    setContent("");
    setSelectedTenant("");
    setReason("미납");
  };

  // PDF 다운로드
  const downloadPDF = (h) => {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>내용증명</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  body { font-family: 'Pretendard', sans-serif; max-width: 680px; margin: 60px auto; padding: 0 40px; color: #1a1a2e; }
  .header { text-align: center; border-bottom: 3px double #1a2744; padding-bottom: 24px; margin-bottom: 32px; }
  .title { font-size: 28px; font-weight: 900; letter-spacing: 8px; color: #1a2744; margin-bottom: 6px; }
  .subtitle { font-size: 13px; color: #8a8a9a; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 28px; gap: 20px; }
  .meta-box { flex: 1; border: 1px solid #e8e6e0; border-radius: 10px; padding: 14px 18px; }
  .meta-label { font-size: 10px; font-weight: 700; color: #8a8a9a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .meta-value { font-size: 14px; font-weight: 700; color: #1a2744; }
  .badge { display: inline-block; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; margin-top: 4px; }
  .content-box { border: 1px solid #e8e6e0; border-radius: 12px; padding: 28px 32px; min-height: 260px; line-height: 2; font-size: 14px; color: #1a2744; white-space: pre-wrap; }
  .footer { margin-top: 48px; text-align: right; }
  .footer p { font-size: 13px; color: #8a8a9a; margin-bottom: 4px; }
  .stamp-area { display: flex; justify-content: flex-end; gap: 40px; margin-top: 20px; }
  .stamp { text-align: center; }
  .stamp-label { font-size: 12px; color: #8a8a9a; margin-bottom: 6px; }
  .stamp-box { width: 80px; height: 80px; border: 1px solid #ddd; border-radius: 8px; margin: 0 auto; }
  @media print { body { margin: 0; } }
</style>
</head><body>
<div class="header">
  <div class="title">내 용 증 명</div>
  <div class="subtitle">작성일: ${new Date(h.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</div>
</div>
<div class="meta">
  <div class="meta-box">
    <div class="meta-label">수신인 (세입자)</div>
    <div class="meta-value">${h.tenant_name}</div>
  </div>
  <div class="meta-box">
    <div class="meta-label">발송 사유</div>
    <div class="meta-value">${h.reason}</div>
    <div class="badge">${h.reason}</div>
  </div>
</div>
<div class="content-box">${h.content}</div>
<div class="footer">
  <p>위와 같이 내용을 증명합니다.</p>
  <p>${new Date(h.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</p>
  <div class="stamp-area">
    <div class="stamp"><div class="stamp-label">발신인 (임대인)</div><div class="stamp-box"></div></div>
  </div>
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body></html>`);
    w.document.close();
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>CERTIFIED MAIL</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744" }}>내용증명</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>총 {history.length}건 저장</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + 내용증명 작성
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>불러오는 중...</div>
      ) : history.length === 0 ? (
        <EmptyState icon="📨" title="작성된 내용증명이 없습니다" desc="내용증명 작성 버튼으로 첫 문서를 작성하세요" action="+ 내용증명 작성" onAction={() => setShowModal(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {history.map((h) => (
            <div key={h.id} className="hover-lift" style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "17px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{h.tenant_name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.rose, background: C.rose + "18", padding: "2px 8px", borderRadius: 5 }}>{h.reason}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#8a8a9a" }}>{new Date(h.created_at).toLocaleDateString("ko-KR")}</span>
                  <button onClick={() => setShowDetail(h)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, border: `1px solid #ebe9e3`, background: "transparent", color: C.muted, cursor: "pointer" }}>보기</button>
                  <button onClick={() => downloadPDF(h)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, border: `1px solid ${C.indigo}`, background: C.indigo + "10", color: C.indigo, cursor: "pointer", fontWeight: 700 }}>📄 PDF</button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.6, marginTop: 8 }}>{h.content.slice(0, 120)}{h.content.length > 120 ? "..." : ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* 작성 모달 */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a2744", marginBottom: 16 }}>내용증명 작성</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>수신인 (세입자)</p>
            <select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} style={{ width: "100%", padding: "11px 14px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, outline: "none" }}>
              <option value="">선택하세요</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.addr}</option>)}
            </select>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>발송 사유</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${reason === r ? C.rose : "#ebe9e3"}`, background: reason === r ? C.rose + "20" : "transparent", color: reason === r ? C.rose : C.muted }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>내용</p>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용증명 본문을 입력하세요..." rows={6}
              style={{ width: "100%", padding: "11px 13px", fontSize: 13, color: "#1a2744", background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, resize: "vertical", outline: "none", lineHeight: 1.7 }} />
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ fontSize: 12, color: "#166534" }}>✅ 작성 후 저장되며, PDF로 출력하여 직접 우편 발송하시면 됩니다.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={send} style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${C.rose},#dc2626)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>저장하기</button>
          </div>
        </div>
      </Modal>

      {/* 상세 보기 모달 */}
      {showDetail && (
        <Modal open={!!showDetail} onClose={() => setShowDetail(null)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a2744" }}>내용증명 상세</h2>
            <button onClick={() => downloadPDF(showDetail)} style={{ padding: "8px 16px", borderRadius: 9, background: C.indigo, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📄 PDF 출력</button>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", background: "#f5f4f0", padding: "6px 12px", borderRadius: 8 }}>수신: {showDetail.tenant_name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.rose, background: C.rose + "15", padding: "6px 12px", borderRadius: 8 }}>{showDetail.reason}</span>
          </div>
          <div style={{ background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 12, padding: "20px", minHeight: 160, fontSize: 14, lineHeight: 1.8, color: "#1a2744", whiteSpace: "pre-wrap" }}>
            {showDetail.content}
          </div>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 12, textAlign: "right" }}>{new Date(showDetail.created_at).toLocaleString("ko-KR")}</p>
        </Modal>
      )}
    </div>
  );
}
