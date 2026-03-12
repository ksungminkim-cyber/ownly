"use client";
import { useState } from "react";
import { SectionLabel, EmptyState, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

export default function CertifiedPage() {
  const { tenants } = useApp();
  const [selectedTenant, setSelectedTenant] = useState("");
  const [reason, setReason]                 = useState("미납");
  const [content, setContent]               = useState("");
  const [senderName, setSenderName]         = useState("");
  const [senderAddr, setSenderAddr]         = useState("");
  const [history, setHistory]               = useState([]);
  const [generating, setGenerating]         = useState(false);

  const REASONS = ["미납", "퇴거 요청", "계약 위반", "재계약 거절", "기타"];
  const TEMPLATES = {
    "미납": `안녕하십니까.\n\n본 내용증명은 임대차 계약에 따른 월 임대료 미납에 관하여 통보드리는 바입니다.\n\n귀하는 현재 임대료를 납부하지 않고 계십니다. 본 통보를 수령하신 날로부터 7일 이내에 미납 임대료 전액을 납부하여 주시기 바랍니다.\n\n기한 내 납부가 이루어지지 않을 경우, 관련 법령에 따른 법적 조치를 취할 것임을 알려드립니다.`,
    "퇴거 요청": `안녕하십니까.\n\n본 내용증명은 임대차 계약 만료에 따른 퇴거를 요청드리는 문서입니다.\n\n귀하와의 임대차 계약이 만료될 예정이며, 계약 갱신 의사가 없음을 통보드립니다. 계약 만료일까지 임차 목적물을 원상복구하시고 명도하여 주시기 바랍니다.\n\n협조해 주셔서 감사합니다.`,
    "계약 위반": `안녕하십니까.\n\n본 내용증명은 임대차 계약 위반 사항에 대하여 통보드리는 문서입니다.\n\n귀하는 임대차 계약서 상의 의무를 위반하고 있습니다. 본 통보 수령일로부터 14일 이내에 위반 사항을 시정하여 주시기 바랍니다.\n\n시정이 이루어지지 않을 경우 계약 해지 및 법적 조치를 진행할 수 있음을 알려드립니다.`,
    "재계약 거절": `안녕하십니까.\n\n본 내용증명은 임대차 계약 만료에 따른 재계약 거절을 통보드리는 문서입니다.\n\n현 임대차 계약이 만료되는 시점에 재계약을 진행하지 않을 예정임을 정중히 알려드립니다. 계약 만료일까지 임차 목적물을 반환하여 주시기 바랍니다.\n\n감사합니다.`,
    "기타": "",
  };

  const tenant = tenants.find((t) => String(t.id) === selectedTenant);

  const generatePDF = async (item) => {
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");

    const container = document.createElement("div");
    container.style.cssText = `position:fixed;left:-9999px;top:0;width:794px;background:white;padding:60px;font-family:'Noto Sans KR','Apple SD Gothic Neo','맑은 고딕',sans-serif;font-size:14px;line-height:1.8;color:#1a1a1a;`;
    container.innerHTML = `
      <div style="border-top:4px solid #3c3cd4;padding-top:30px;">
        <h1 style="text-align:center;font-size:28px;font-weight:900;letter-spacing:12px;margin-bottom:10px;color:#1a1a1a;">내 용 증 명</h1>
        <hr style="border:none;border-top:2px solid #3c3cd4;margin-bottom:30px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f8f8fc;">
          <tr>
            <td style="width:50%;padding:18px 22px;border:1px solid #e0e0ee;vertical-align:top;">
              <div style="font-size:11px;font-weight:700;color:#8888aa;letter-spacing:2px;margin-bottom:10px;">발 신 인</div>
              <div style="font-weight:700;font-size:16px;margin-bottom:6px;">${item.senderName}</div>
              <div style="color:#666;font-size:13px;">${item.senderAddr || "—"}</div>
            </td>
            <td style="width:50%;padding:18px 22px;border:1px solid #e0e0ee;vertical-align:top;">
              <div style="font-size:11px;font-weight:700;color:#8888aa;letter-spacing:2px;margin-bottom:10px;">수 신 인</div>
              <div style="font-weight:700;font-size:16px;margin-bottom:6px;">${item.tenantName}</div>
              <div style="color:#666;font-size:13px;">${item.tenantAddr || "—"}</div>
            </td>
          </tr>
        </table>
        <div style="display:flex;gap:24px;margin-bottom:24px;font-size:13px;color:#555;">
          <span>발송일: <strong>${item.date}</strong></span>
          <span>발송 사유: <strong>${item.reason}</strong></span>
        </div>
        <hr style="border:none;border-top:1px solid #ddd;margin-bottom:20px;">
        <div style="font-weight:800;font-size:15px;margin-bottom:16px;">[ 내 용 ]</div>
        <div style="font-size:14px;line-height:2;white-space:pre-wrap;color:#2a2a2a;min-height:180px;">${item.content}</div>
        <hr style="border:none;border-top:1px solid #ddd;margin-top:32px;margin-bottom:16px;">
        <div style="font-size:11px;color:#999;line-height:1.7;margin-bottom:32px;">본 내용증명은 「우편법」 제15조에 의거하여 발송되는 법적 효력이 있는 문서입니다. 수신인은 본 내용증명 수령 후 7일 이내에 서면으로 답변하시기 바랍니다.</div>
        <div style="background:#f8f8fc;border:1px solid #e0e0ee;padding:24px;text-align:center;">
          <div style="font-size:12px;color:#888;margin-bottom:20px;font-weight:600;">발신인 서명</div>
          <div style="border-bottom:1px solid #aaa;width:160px;margin:0 auto 8px;"></div>
          <div style="font-size:11px;color:#bbb;">(서명 또는 날인)</div>
        </div>
        <div style="text-align:center;margin-top:40px;font-size:11px;color:#bbb;">Ownly · 스마트 임대 관리 플랫폼 · by McLean</div>
      </div>`;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = 210, pageH = 297;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfW, pdfH);
      while (pdfH - Math.abs(position) > pageH) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfW, pdfH);
      }
      pdf.save(`내용증명_${item.tenantName}_${item.date}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleCreate = async () => {
    if (!selectedTenant || !content.trim()) { toast("세입자와 내용을 입력하세요", "error"); return; }
    if (!senderName.trim()) { toast("발신인 이름을 입력하세요", "error"); return; }
    setGenerating(true);
    try {
      const item = {
        id: Date.now(),
        tenantName: tenant?.name || "알수없음",
        tenantAddr: tenant?.addr || "—",
        reason, content, senderName, senderAddr,
        date: new Date().toISOString().slice(0, 10),
      };
      await generatePDF(item);
      setHistory((prev) => [item, ...prev]);
      toast("내용증명 PDF가 다운로드되었습니다");
      setContent(""); setSelectedTenant(""); setSenderName(""); setSenderAddr(""); setReason("미납");
    } catch (e) {
      toast("PDF 생성 오류: " + e.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  const inp = (val, set, ph) => (
    <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
      style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: C.text, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
  );

  const label = (txt) => (
    <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>{txt}</p>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* ── 왼쪽: 작성 폼 (고정) ── */}
      <div style={{ width: 480, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "28px 28px 0" }}>
          <SectionLabel>CERTIFIED MAIL</SectionLabel>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 20 }}>내용증명 작성</h1>
        </div>

        <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 발신인 */}
          <div style={{ background: C.surface, borderRadius: 12, padding: "16px", border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 11, color: C.indigo, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 12 }}>발신인 정보</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                {label("이름 *")}
                {inp(senderName, setSenderName, "홍길동")}
              </div>
              <div>
                {label("주소")}
                {inp(senderAddr, setSenderAddr, "서울시 마포구...")}
              </div>
            </div>
          </div>

          {/* 수신인 */}
          <div>
            {label("수신인 (세입자) *")}
            <select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}
              style={{ width: "100%", padding: "10px 13px", fontSize: 13, color: selectedTenant ? C.text : C.muted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, outline: "none" }}>
              <option value="">선택하세요</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.addr}</option>)}
            </select>
          </div>

          {/* 사유 */}
          <div>
            {label("발송 사유")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {REASONS.map((r) => (
                <button key={r} onClick={() => { setReason(r); if (TEMPLATES[r]) setContent(TEMPLATES[r]); }}
                  style={{ padding: "6px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${reason === r ? C.rose : C.border}`, background: reason === r ? C.rose + "20" : "transparent", color: reason === r ? C.rose : C.muted }}>
                  {r}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>* 사유 선택 시 템플릿이 자동 입력됩니다</p>
          </div>

          {/* 본문 */}
          <div>
            {label("본문 내용 *")}
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10}
              placeholder="내용증명 본문을 입력하세요..."
              style={{ width: "100%", padding: "12px 13px", fontSize: 13, color: C.text, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, resize: "vertical", outline: "none", lineHeight: 1.7, boxSizing: "border-box" }} />
          </div>

          {/* 버튼 */}
          <button onClick={handleCreate} disabled={generating}
            style={{ width: "100%", padding: "13px", borderRadius: 11, background: `linear-gradient(135deg,${C.rose},#dc2626)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1 }}>
            {generating ? "PDF 생성 중..." : "📥 PDF 생성 & 다운로드"}
          </button>
        </div>
      </div>

      {/* ── 오른쪽: 발송 내역 ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <SectionLabel>HISTORY</SectionLabel>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>발송 내역</h2>
          </div>
          <span style={{ fontSize: 13, color: C.muted }}>총 {history.length}건</span>
        </div>

        {history.length === 0 ? (
          <EmptyState icon="📨" title="발송 내역이 없습니다" desc="왼쪽 폼에서 내용증명을 작성하고 PDF를 생성하세요" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((h) => (
              <div key={h.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: C.rose + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📨</div>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{h.tenantName}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.rose, background: C.rose + "18", padding: "2px 8px", borderRadius: 5 }}>{h.reason}</span>
                      </div>
                      <p style={{ fontSize: 12, color: C.muted }}>{h.date} · {h.senderName}</p>
                    </div>
                  </div>
                  <button onClick={() => generatePDF(h)}
                    style={{ padding: "7px 14px", borderRadius: 9, background: C.indigo + "18", border: `1px solid ${C.indigo}40`, color: C.indigo, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    📥 재다운로드
                  </button>
                </div>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                  {h.content.slice(0, 150)}{h.content.length > 150 ? "..." : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
