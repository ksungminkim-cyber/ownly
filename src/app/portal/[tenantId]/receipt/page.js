"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

// 세입자용 월세 납부내역 확인서 — 연말정산 월세 세액공제 증빙 참고용
// 브라우저 인쇄(PDF 저장) 방식. 로그인 불필요 (포털과 동일하게 tenantId UUID가 토큰 역할).

export default function PaymentReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(null);

  useEffect(() => {
    fetch(`/api/portal/${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const years = useMemo(() => {
    const ys = new Set((data?.payments || []).filter(p => p.status === "paid").map(p => p.year));
    return [...ys].sort((a, b) => b - a);
  }, [data]);

  const activeYear = year ?? years[0] ?? new Date().getFullYear();

  const rows = useMemo(() => {
    return (data?.payments || [])
      .filter(p => p.status === "paid" && p.year === activeYear)
      .sort((a, b) => a.month - b.month);
  }, [data, activeYear]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7f4", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <p style={{ color: "#8a8a9a" }}>불러오는 중...</p>
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7f4", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2744", marginBottom: 6 }}>페이지를 찾을 수 없습니다</h2>
        <p style={{ fontSize: 13, color: "#8a8a9a", lineHeight: 1.7 }}>임대인에게 포털 링크를 다시 요청해주세요.</p>
      </div>
    </div>
  );

  const t = data.tenant;
  const landlord = data.landlord || {};
  const total = rows.reduce((s, p) => s + (p.amount || t.rent || 0), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", background: "#f0efe9", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: "24px 16px 60px" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: #fff !important; }
          .receipt-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: none !important; }
        }
      `}</style>

      {/* 컨트롤 (인쇄 시 숨김) */}
      <div className="no-print" style={{ maxWidth: 640, margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => router.push(`/portal/${tenantId}`)} style={{ background: "none", border: "none", color: "#8a8a9a", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>← 포털로 돌아가기</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {years.length > 1 && years.map(y => (
            <button key={y} onClick={() => setYear(y)}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid " + (y === activeYear ? "#1a2744" : "#d8d6d0"), background: y === activeYear ? "#1a2744" : "#fff", color: y === activeYear ? "#fff" : "#6a6a7a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {y}년
            </button>
          ))}
          <button onClick={() => window.print()} style={{ padding: "9px 20px", borderRadius: 10, background: "#1a2744", color: "#fff", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            🖨️ 인쇄 / PDF 저장
          </button>
        </div>
      </div>

      {/* 확인서 본문 */}
      <div className="receipt-sheet" style={{ maxWidth: 640, margin: "0 auto", background: "#fff", border: "1px solid #e0ded8", borderRadius: 4, padding: "44px 40px", boxShadow: "0 4px 20px rgba(26,39,68,0.08)", color: "#1a1a2e" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, textAlign: "center", letterSpacing: "6px", marginBottom: 6 }}>월세 납부내역 확인서</h1>
        <p style={{ fontSize: 11, color: "#8a8a9a", textAlign: "center", marginBottom: 28 }}>({activeYear}년 귀속 · 연말정산 월세 세액공제 증빙 참고용)</p>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 22, fontSize: 13 }}>
          <tbody>
            {[
              ["임차인 성명", t.name || "—"],
              ["임차 주택 주소", t.address || "—"],
              ["주택 유형", [t.pType, t.sub].filter(Boolean).join(" / ") || "—"],
              ["임대인 성명", landlord.name || "—"],
              ...(landlord.businessNo ? [["사업자등록번호", landlord.businessNo]] : []),
              ["임대차 기간", `${t.start_date || "—"} ~ ${t.contract_end || "—"}`],
              ["보증금", `${(t.deposit || 0).toLocaleString()}만원`],
              ["월 임대료", `${(t.rent || 0).toLocaleString()}만원 (매월 ${t.pay_day}일)`],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ width: 140, padding: "9px 12px", background: "#f7f6f3", border: "1px solid #e5e3dd", fontWeight: 700, color: "#5a5a6a", fontSize: 12 }}>{label}</td>
                <td style={{ padding: "9px 12px", border: "1px solid #e5e3dd", fontWeight: 600 }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{activeYear}년 납부 내역</p>
        {rows.length === 0 ? (
          <div style={{ border: "1px solid #e5e3dd", borderRadius: 4, padding: 28, textAlign: "center", marginBottom: 22 }}>
            <p style={{ fontSize: 13, color: "#8a8a9a" }}>{activeYear}년 납부 완료 기록이 없습니다</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 22, fontSize: 13 }}>
            <thead>
              <tr>
                {["납부 월", "금액", "납부일"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", background: "#f7f6f3", border: "1px solid #e5e3dd", fontWeight: 700, color: "#5a5a6a", fontSize: 12, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={`${p.year}-${p.month}`}>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e3dd", fontWeight: 600 }}>{p.year}년 {p.month}월</td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e3dd", fontWeight: 700 }}>{(p.amount || t.rent || 0).toLocaleString()}만원</td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e3dd", color: "#5a5a6a" }}>{p.paid_date || "—"}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "9px 12px", border: "1px solid #e5e3dd", background: "#f7f6f3", fontWeight: 900 }}>합계 ({rows.length}개월)</td>
                <td colSpan={2} style={{ padding: "9px 12px", border: "1px solid #e5e3dd", background: "#f7f6f3", fontWeight: 900 }}>{total.toLocaleString()}만원</td>
              </tr>
            </tbody>
          </table>
        )}

        <p style={{ fontSize: 12, lineHeight: 1.9, color: "#4a4a5a", marginBottom: 26 }}>
          위 내역은 임대 관리 플랫폼 온리(ownly.kr)에 기록된 납부 데이터를 기반으로 발급되었음을 확인합니다.
        </p>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>발급일: {today}</p>
          <p style={{ fontSize: 14, fontWeight: 800 }}>임대인: {landlord.name || "____________"} (서명 또는 인)</p>
        </div>

        <div style={{ borderTop: "1px solid #e5e3dd", paddingTop: 14 }}>
          <p style={{ fontSize: 10, color: "#9a9aa8", lineHeight: 1.8, margin: 0 }}>
            ※ 본 확인서는 참고용이며, 월세 세액공제의 최종 인정 여부·필요 서류(임대차계약서 사본, 계좌이체 증빙 등)는 국세청 연말정산 기준을 따릅니다.<br />
            ※ 발급 경로: ownly.kr 세입자 포털 · 문의는 임대인에게 연락해주세요.
          </p>
        </div>
      </div>

      {/* 세입자 → 임대인 전환 CTA (인쇄 시 숨김) */}
      <div className="no-print" style={{ maxWidth: 640, margin: "20px auto 0", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 8 }}>혹시 임대 중인 부동산이 있으신가요?</p>
        <a href="/login?mode=signup" style={{ display: "inline-block", padding: "10px 22px", borderRadius: 10, background: "#1a2744", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          온리로 무료 임대 관리 시작하기 →
        </a>
      </div>
    </div>
  );
}
