"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

// 공실 매물 안내문 (중개사무소 배포용) — 공실 페이지의 "안내문 인쇄"에서 진입
// 데이터는 localStorage(ownly_vacancy_flyer) 경유, 인쇄 후 브라우저 인쇄→PDF 저장

export default function VacancyFlyerPage() {
  const router = useRouter();
  const { user } = useApp();
  const [v] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ownly_vacancy_flyer") || "null"); } catch { return null; }
  });

  if (!v) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Pretendard',sans-serif" }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1a2744" }}>안내문 데이터가 없습니다</p>
      <button onClick={() => router.push("/dashboard/vacancy")} className="btn btn-fill btn-sm">공실 관리로 돌아가기</button>
    </div>
  );

  const phone = user?.user_metadata?.phone || "";
  const name = user?.user_metadata?.landlord_name || user?.user_metadata?.nickname || "";
  const rent = Number(v.rent || 0);
  const dep = Number(v.dep || 0);
  const maint = Number(v.maintenance || 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", background: "#f0efe9", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: "24px 16px 60px" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: #fff !important; }
          .flyer-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: none !important; }
          @page { margin: 16mm; size: A4 portrait; }
        }
      `}</style>

      <div className="no-print" style={{ maxWidth: 640, margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <button onClick={() => router.push("/dashboard/vacancy")} style={{ background: "none", border: "none", color: "#8a8a9a", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>← 공실 관리로</button>
        <button onClick={() => window.print()} style={{ padding: "9px 20px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>🖨️ 인쇄 / PDF 저장</button>
      </div>
      <p className="no-print" style={{ maxWidth: 640, margin: "0 auto 14px", fontSize: 12, color: "#8a8a9a", lineHeight: 1.7 }}>
        💡 출력해서 인근 중개사무소 3~5곳에 전달하거나, PDF로 저장해 문자·카톡으로 보내세요. 연락처는 설정 &gt; 프로필에서 수정할 수 있습니다.
      </p>

      <div className="flyer-sheet" style={{ maxWidth: 640, margin: "0 auto", background: "#fff", border: "1px solid #e0ded8", borderRadius: 4, padding: "44px 40px", boxShadow: "0 4px 20px rgba(26,39,68,0.08)", color: "#1a1a2e" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#c9920a", letterSpacing: 4, textAlign: "center", marginBottom: 6 }}>임 대 매 물 안 내</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, textAlign: "center", marginBottom: 4, letterSpacing: "-0.3px" }}>
          {v.sub || v.pType || "임대"} 세입자를 찾습니다
        </h1>
        <p style={{ fontSize: 12, color: "#8a8a9a", textAlign: "center", marginBottom: 28 }}>중개 의뢰드립니다 · {today}</p>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 22, fontSize: 13.5 }}>
          <tbody>
            {[
              ["소재지", v.addr || "—"],
              ["유형", [v.pType, v.sub].filter(Boolean).join(" · ") || "—"],
              ["보증금", dep > 0 ? `${dep.toLocaleString()}만원` : "협의"],
              ["월 임대료", rent > 0 ? `${rent.toLocaleString()}만원${maint > 0 ? ` (관리비 ${maint.toLocaleString()}만원 별도)` : ""}` : "협의"],
              ["입주 가능일", "즉시 입주 가능"],
              ...(v.note ? [["특이사항", v.note]] : []),
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ width: 120, padding: "12px 14px", background: "#f7f6f3", border: "1px solid #e5e3dd", fontWeight: 800, color: "#5a5a6a", fontSize: 12.5 }}>{label}</td>
                <td style={{ padding: "12px 14px", border: "1px solid #e5e3dd", fontWeight: 600 }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ background: "#f7f6f3", border: "1px solid #e5e3dd", borderRadius: 6, padding: "16px 18px", marginBottom: 24 }}>
          <p style={{ fontSize: 12.5, fontWeight: 800, color: "#5a5a6a", marginBottom: 6 }}>조건 협의 가능</p>
          <p style={{ fontSize: 12.5, color: "#4a4a5a", lineHeight: 1.9, margin: 0 }}>
            임대 조건(보증금·월세 비율, 렌트프리 등)은 협의 가능합니다. 좋은 임차인을 소개해 주시면 감사하겠습니다.
          </p>
        </div>

        <div style={{ textAlign: "center", border: "2px solid #1a2744", borderRadius: 8, padding: "16px 18px" }}>
          <p style={{ fontSize: 12, color: "#8a8a9a", fontWeight: 700, marginBottom: 4 }}>임대인 연락처</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: "#1a2744", margin: 0 }}>
            {name && <span style={{ marginRight: 10 }}>{name}</span>}{phone || "010-____-____"}
          </p>
        </div>

        <p style={{ fontSize: 10, color: "#9a9aa8", textAlign: "center", marginTop: 20, margin: "20px 0 0" }}>
          본 안내문은 온리(ownly.kr) 임대 관리 서비스에서 생성되었습니다.
        </p>
      </div>
    </div>
  );
}
