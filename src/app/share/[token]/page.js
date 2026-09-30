"use client";
// 읽기 전용 공유 보고서 — 임대인이 세무사·가족에게 보낸 링크. 로그인 없이 /api/share/[token] 요약만 보여준다.
// 인쇄 친화(버튼·안내 숨김), 검색 노출 금지(robots noindex meta — React 19 가 <head> 로 올린다).
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const fmt = (n) => `${Math.round(Number(n) || 0).toLocaleString("ko-KR")}만원`;
const cell = (n) => (Number(n) ? Math.round(n).toLocaleString("ko-KR") : "·");
const date = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }); };
const dateTime = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); };

const ERR = {
  expired: "공유 기간이 끝난 링크입니다. 임대인에게 새 링크를 요청해 주세요.",
  revoked: "임대인이 공유를 해지한 링크입니다.",
  not_found: "존재하지 않는 링크입니다. 주소를 다시 확인해 주세요.",
};

const th = { textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", padding: "8px 6px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
const td = { fontSize: 12, color: "var(--text)", padding: "8px 6px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };

function Section({ title, sub, children }) {
  return (
    <section className="surface-card share-block" style={{ padding: 20, marginBottom: 16 }}>
      <p className="section-eyebrow" style={{ margin: 0 }}>{title}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "4px 0 0", lineHeight: 1.6 }}>{sub}</p>}
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

export default function SharedReportPage() {
  const params = useParams();
  const token = params?.token;
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(token)}`, { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) setState({ loading: false, data: null, error: ERR[body.error] || "보고서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." });
        else setState({ loading: false, data: body, error: null });
      } catch {
        if (!cancelled) setState({ loading: false, data: null, error: "네트워크 오류로 보고서를 불러오지 못했습니다." });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const d = state.data;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "28px 16px 60px" }}>
      <meta name="robots" content="noindex, nofollow" />
      <style>{`@media print { .no-print { display: none !important; } main { padding: 0 !important; background: #fff !important; } .share-block { box-shadow: none !important; break-inside: avoid; } }`}</style>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <span className="chip chip-info">임대인이 공유한 읽기 전용 보고서 · 온리</span>
          {d && <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>인쇄 / PDF 저장</button>}
        </div>

        {!token || state.loading ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{token ? "보고서를 불러오는 중…" : "링크 주소가 올바르지 않습니다."}</p>
        ) : state.error ? (
          <div className="surface-card" style={{ padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>보고서를 열 수 없습니다</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "8px 0 0", lineHeight: 1.7 }}>{state.error}</p>
          </div>
        ) : (
          <>
            <h1 className="section-title" style={{ margin: "0 0 6px" }}>{d.year}년 임대 수입·지출 요약</h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 18px", lineHeight: 1.7 }}>
              {d.label ? <>공유 대상: {d.label} · </> : null}기준 시각 {dateTime(d.generated_at)} · 링크 만료 {date(d.expires_at)} · 단위 만원
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div className="stat"><p className="stat-label">월세 수입 (납부 기록)</p><p className="stat-value num">{fmt(d.rentTotal)}</p></div>
              <div className="stat"><p className="stat-label">장부 수입 합계</p><p className="stat-value num">{fmt(d.ledgerIncomeTotal)}</p></div>
              <div className="stat"><p className="stat-label">장부 지출 합계</p><p className="stat-value num">{fmt(d.ledgerExpenseTotal)}</p></div>
              <div className="stat"><p className="stat-label">수리비 합계</p><p className="stat-value num">{fmt(d.repairTotal)}</p><p className="stat-sub">{d.repairCount}건</p></div>
            </div>

            <Section title="물건별 월세 수입" sub="임대인이 온리에 입력한 납부 기록(완납·부분납부) 금액 기준입니다. 세입자 이름은 가려서 표시합니다.">
              {d.rentIncome.length ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={th}>물건</th>{Array.from({ length: 12 }, (_, i) => <th key={i} style={{ ...th, textAlign: "right" }}>{i + 1}월</th>)}<th style={{ ...th, textAlign: "right" }}>합계</th></tr></thead>
                    <tbody>
                      {d.rentIncome.map((r, i) => (
                        <tr key={i}>
                          <td style={td}>{r.property}<span style={{ color: "var(--text-faint)" }}> · {r.tenant}</span></td>
                          {r.months.map((v, m) => <td key={m} className="num" style={{ ...td, textAlign: "right" }}>{cell(v)}</td>)}
                          <td className="num" style={{ ...td, textAlign: "right", fontWeight: 700 }}>{cell(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{d.year}년 납부 기록이 없습니다.</p>}
            </Section>

            <Section title="장부 카테고리별 합계" sub="장부의 '월세수입'에는 납부 기록이 자동으로 옮겨진 금액이 포함될 수 있으니, 위 월세 수입 표와 더하지 마세요.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                {[["수입", d.ledger.income, d.ledgerIncomeTotal], ["지출", d.ledger.expense, d.ledgerExpenseTotal]].map(([name, rows, total]) => (
                  <div key={name}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>{name}</p>
                    {rows.length ? (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          {rows.map((c) => <tr key={c.category}><td style={td}>{c.category}</td><td className="num" style={{ ...td, textAlign: "right" }}>{fmt(c.amount)}</td></tr>)}
                          <tr><td style={{ ...td, fontWeight: 700 }}>합계</td><td className="num" style={{ ...td, textAlign: "right", fontWeight: 700 }}>{fmt(total)}</td></tr>
                        </tbody>
                      </table>
                    ) : <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>기록 없음</p>}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="보증금 현황" sub="공유 링크를 연 시점에 등록된 보증금입니다(공실·퇴거 물건 제외). 연말 기준 잔액과 다를 수 있습니다.">
              {d.deposits.length ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {d.deposits.map((r, i) => <tr key={i}><td style={td}>{r.property}<span style={{ color: "var(--text-faint)" }}> · {r.tenant}</span></td><td className="num" style={{ ...td, textAlign: "right" }}>{fmt(r.deposit)}</td></tr>)}
                    <tr><td style={{ ...td, fontWeight: 700 }}>합계</td><td className="num" style={{ ...td, textAlign: "right", fontWeight: 700 }}>{fmt(d.depositTotal)}</td></tr>
                  </tbody>
                </table>
              ) : <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>등록된 보증금이 없습니다.</p>}
            </Section>

            <p style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.7, margin: "8px 0 0" }}>
              이 보고서는 임대인이 온리에 직접 입력한 기록을 모은 <b>세무 신고용 참고 자료</b>이며, 공적 증빙이 아닙니다.
              계약서·입금 내역·영수증 등 원본 증빙은 임대인에게 요청해 주세요. 읽기 전용 화면으로, 이 링크로는 어떤 정보도 수정할 수 없습니다.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
