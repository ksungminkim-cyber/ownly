"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = { navy:"#1a2744", amber:"#e8960a", rose:"#e8445a", emerald:"#0fa573", surface:"#ffffff", border:"#e8e6e0", muted:"#8a8a9a", faint:"#f8f7f4" };
const KAKAO = "#FEE500";

export default function KakaoAlertPage() {
  const router = useRouter();
  const { tenants } = useApp();
  const unpaid  = tenants.filter(t => t.status === "미납");
  const [sent, setSent] = useState({});
  const [preview, setPreview] = useState(null);

  const send = (t) => {
    setSent(s => ({ ...s, [t.id]: true }));
    setPreview(null);
  };

  const getMessage = (t) => `[온리 수금 알림]
안녕하세요, ${t.tenant || "임차인"}님.

${t.addr || "해당 물건"}의 이번 달 월세가 아직 미납 상태입니다.

• 미납 금액: ${(t.rent || 0).toLocaleString()}만원
• 요청 기한: ${new Date().toLocaleDateString("ko-KR")}

빠른 시일 내 납부 부탁드립니다.
문의: inquiry@mclean21.com

온리(Ownly) - 임대 관리 앱`;

  return (
    <div className="page-in page-padding" style={{ maxWidth:720, fontFamily:"'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()}
        style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:14, padding:0 }}>
        ← 대시보드로
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${KAKAO},#e6ce00)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>💬</div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, letterSpacing:"-.4px" }}>카카오 수금 알림</h1>
            <span style={{ fontSize:10, fontWeight:800, color:C.amber, background:"rgba(232,150,10,0.12)", padding:"3px 8px", borderRadius:6 }}>PRO</span>
          </div>
          <p style={{ fontSize:13, color:C.muted }}>미납 세입자에게 카카오 알림톡으로 수금 요청을 발송합니다</p>
        </div>
      </div>

      {/* 미납 현황 */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:24, marginBottom:20, boxShadow:"0 2px 12px rgba(26,39,68,0.06)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <p style={{ fontSize:14, fontWeight:800, color:C.navy }}>미납 세입자</p>
          <span style={{ fontSize:13, fontWeight:800, color:unpaid.length>0?C.rose:C.emerald, background:(unpaid.length>0?"rgba(232,68,90,0.1)":"rgba(15,165,115,0.1)"), padding:"4px 12px", borderRadius:8 }}>
            {unpaid.length}건
          </span>
        </div>

        {unpaid.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <p style={{ fontSize:40, marginBottom:12 }}>🎉</p>
            <p style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:6 }}>미납 건이 없어요!</p>
            <p style={{ fontSize:13, color:C.muted }}>모든 세입자가 정상 납부 중입니다</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {unpaid.map(t => (
              <div key={t.id} style={{ border:`1px solid ${sent[t.id] ? C.emerald+"40" : C.border}`, borderRadius:16, padding:18,
                background: sent[t.id] ? "rgba(15,165,115,0.03)" : C.faint, transition:"all .3s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div>
                    <p style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:3 }}>{t.tenant || "이름 없음"}</p>
                    <p style={{ fontSize:12, color:C.muted }}>{t.addr || "주소 미등록"}</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:17, fontWeight:900, color:C.rose }}>{(t.rent||0).toLocaleString()}만원</p>
                    <p style={{ fontSize:11, color:C.muted }}>미납</p>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setPreview(preview?.id===t.id ? null : t)}
                    style={{ flex:1, padding:"10px 0", borderRadius:10, background:C.surface, border:`1px solid ${C.border}`,
                      color:C.navy, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    미리보기
                  </button>
                  <button onClick={() => send(t)} disabled={sent[t.id]}
                    style={{ flex:2, padding:"10px 0", borderRadius:10,
                      background: sent[t.id] ? C.emerald : KAKAO,
                      color: sent[t.id] ? "#fff" : "#1a1a1a",
                      border:"none", fontSize:13, fontWeight:800, cursor:sent[t.id]?"not-allowed":"pointer", transition:"all .2s" }}>
                    {sent[t.id] ? "✅ 발송 완료" : "💬 카카오 알림 발송"}
                  </button>
                </div>
                {preview?.id === t.id && (
                  <div style={{ marginTop:12, background:"#fff", border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:8, letterSpacing:"1px" }}>알림 메시지 미리보기</p>
                    <pre style={{ fontSize:12, color:C.navy, lineHeight:1.8, whiteSpace:"pre-wrap", fontFamily:"inherit" }}>{getMessage(t)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background:"rgba(254,229,0,0.08)", border:`1px solid ${KAKAO}40`, borderRadius:14, padding:"14px 18px" }}>
        <p style={{ fontSize:12, fontWeight:700, color:"#b8a000", marginBottom:4 }}>💡 카카오 알림톡 연동 안내</p>
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.7 }}>
          실제 카카오 알림톡 발송을 위해서는 카카오 비즈니스 채널 등록이 필요합니다.<br/>
          현재는 미리보기 기능만 제공되며, 실제 발송 기능은 순차적으로 오픈됩니다.
        </p>
      </div>
    </div>
  );
}
