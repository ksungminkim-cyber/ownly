"use client";
import { useEffect, useState } from "react";

export default function ContractExportPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ownly_contract_print");
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (data) setTimeout(() => window.print(), 600);
  }, [data]);

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "white", fontFamily: "'Malgun Gothic','Apple SD Gothic Neo',sans-serif" }}>
      <p style={{ color: "#8a8a9a" }}>문서를 불러오는 중...</p>
    </div>
  );

  const c = data.contract || {};
  const t = data.tenant || {};
  const landlord = data.landlord || {};
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const blank = (n = 10) => "\u3000".repeat(n);
  const fmtMoney = (n) => Number(n || 0).toLocaleString() + "만원";
  const propertyType = t.sub || t.pType || "—";
  const payDay = t.pay_day || 5;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 44px 80px", fontFamily: "'Malgun Gothic','Apple SD Gothic Neo','Pretendard',sans-serif", color: "#1a1a2e", background: "white", minHeight: "100vh", lineHeight: 1.7 }}>
      {/* 제목 */}
      <div style={{ textAlign: "center", borderBottom: "3px double #1a2744", paddingBottom: 24, marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: 10, color: "#1a2744", marginBottom: 4 }}>임 대 차 계 약 서</h1>
        <p style={{ fontSize: 11, color: "#8a8a9a" }}>본 계약서는 임대인과 임차인 간의 합의에 따라 작성되며, 서명 후 각 1부씩 보관합니다.</p>
      </div>

      {/* 1. 부동산 표시 */}
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 8, borderLeft: "4px solid #1a2744", paddingLeft: 10 }}>제1조 부동산의 표시</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <tbody>
            <tr style={{ borderTop: "1px solid #b0b0c0", borderBottom: "1px solid #d0d0d8" }}>
              <td style={{ padding: "9px 12px", background: "#f8f7f4", width: 100, fontWeight: 700, borderRight: "1px solid #d0d0d8" }}>소재지</td>
              <td style={{ padding: "9px 14px" }}>{t.addr || blank(30)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #b0b0c0" }}>
              <td style={{ padding: "9px 12px", background: "#f8f7f4", fontWeight: 700, borderRight: "1px solid #d0d0d8" }}>물건 종류</td>
              <td style={{ padding: "9px 14px" }}>{propertyType}{t.biz ? ` · 상호: ${t.biz}` : ""}{t.area_pyeong ? ` · ${t.area_pyeong}평` : ""}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 2. 계약 내용 */}
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 8, borderLeft: "4px solid #1a2744", paddingLeft: 10 }}>제2조 계약 내용</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <tbody>
            <tr style={{ borderTop: "1px solid #b0b0c0", borderBottom: "1px solid #d0d0d8" }}>
              <td style={{ padding: "9px 12px", background: "#f8f7f4", width: 100, fontWeight: 700, borderRight: "1px solid #d0d0d8" }}>보증금</td>
              <td style={{ padding: "9px 14px", fontWeight: 700 }}>금 {fmtMoney(c.deposit || t.dep)}정 (₩{Number((c.deposit || t.dep || 0) * 10000).toLocaleString()})</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #d0d0d8" }}>
              <td style={{ padding: "9px 12px", background: "#f8f7f4", fontWeight: 700, borderRight: "1px solid #d0d0d8" }}>월 차임</td>
              <td style={{ padding: "9px 14px", fontWeight: 700 }}>금 {fmtMoney(c.rent || t.rent)}정 · 매월 {payDay}일 지급</td>
            </tr>
            {(t.maintenance || 0) > 0 && (
              <tr style={{ borderBottom: "1px solid #d0d0d8" }}>
                <td style={{ padding: "9px 12px", background: "#f8f7f4", fontWeight: 700, borderRight: "1px solid #d0d0d8" }}>관리비</td>
                <td style={{ padding: "9px 14px" }}>월 {fmtMoney(t.maintenance)}</td>
              </tr>
            )}
            <tr style={{ borderBottom: "1px solid #b0b0c0" }}>
              <td style={{ padding: "9px 12px", background: "#f8f7f4", fontWeight: 700, borderRight: "1px solid #d0d0d8" }}>계약 기간</td>
              <td style={{ padding: "9px 14px" }}>{c.start_date || t.start_date || blank(6)} &nbsp;~&nbsp; {c.end_date || t.end_date || blank(6)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 3. 특약사항 */}
      <section style={{ marginBottom: 26 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 8, borderLeft: "4px solid #1a2744", paddingLeft: 10 }}>제3조 특약사항</h2>
        <div style={{ border: "1px solid #b0b0c0", padding: "14px 16px", minHeight: 90, fontSize: 12.5, whiteSpace: "pre-wrap", lineHeight: 1.9, background: "#fafaf8" }}>
          {c.special_terms || "— 해당 없음 —"}
        </div>
      </section>

      {/* 4. 법적 고지 */}
      <section style={{ marginBottom: 30, padding: "12px 14px", background: "#f8f7f4", borderRadius: 6, fontSize: 11, color: "#6a6a7a", lineHeight: 1.8 }}>
        ※ 본 계약은 「주택임대차보호법」 또는 「상가건물 임대차보호법」의 적용을 받으며, 계약 갱신 요구권·임차권등기명령 등 임차인의 법정 권리는 법률에 따라 보호됩니다.
      </section>

      {/* 5. 당사자 */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a2744", marginBottom: 10, borderLeft: "4px solid #1a2744", paddingLeft: 10 }}>제4조 당사자</h2>
        {[
          { label: "임 대 인", name: landlord.name, addr: landlord.addr, phone: landlord.phone, reg: landlord.reg, signature: landlord.signature },
          { label: "임 차 인", name: t.name || c.tenant_name, addr: t.addr, phone: t.phone, reg: "" },
        ].map((p, i) => (
          <table key={i} style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 10 }}>
            <tbody>
              <tr style={{ borderTop: "1px solid #b0b0c0" }}>
                <td rowSpan={3} style={{ padding: "16px 12px", background: "#1a2744", color: "#fff", width: 90, fontWeight: 800, textAlign: "center", letterSpacing: 3, fontSize: 12, verticalAlign: "middle" }}>{p.label}</td>
                <td style={{ padding: "8px 12px", background: "#f8f7f4", width: 80, fontWeight: 700, borderRight: "1px solid #d0d0d8", borderBottom: "1px solid #d0d0d8" }}>성명</td>
                <td style={{ padding: "8px 14px", borderBottom: "1px solid #d0d0d8" }}>
                  {p.name || blank(14)}
                  {p.signature ? (
                    <img src={p.signature} alt="직인" style={{ marginLeft: 16, width: 48, height: 48, objectFit: "contain", verticalAlign: "middle" }} />
                  ) : (
                    <span style={{ marginLeft: 20, color: "#8a8a9a" }}>(인)</span>
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", background: "#f8f7f4", fontWeight: 700, borderRight: "1px solid #d0d0d8", borderBottom: "1px solid #d0d0d8" }}>주소</td>
                <td style={{ padding: "8px 14px", borderBottom: "1px solid #d0d0d8" }}>{p.addr || blank(30)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #b0b0c0" }}>
                <td style={{ padding: "8px 12px", background: "#f8f7f4", fontWeight: 700, borderRight: "1px solid #d0d0d8" }}>연락처</td>
                <td style={{ padding: "8px 14px" }}>{p.phone || blank(14)}{p.reg ? ` · 사업자 ${p.reg}` : ""}</td>
              </tr>
            </tbody>
          </table>
        ))}
      </section>

      {/* 날짜 */}
      <div style={{ textAlign: "center", marginTop: 36, fontSize: 14, fontWeight: 700, color: "#1a2744" }}>
        {today}
      </div>

      {/* 인쇄 전용 스타일 */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 18mm 16mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
