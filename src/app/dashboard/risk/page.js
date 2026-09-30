"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "../../../context/AppContext";
import { SectionLabel, EmptyState, InlineLoader, toast } from "../../../components/shared";
import { isSampleTenant } from "../../../lib/sampleData";
import { jeonseRatio, insuranceStatus, returnSchedule, registeredRentalChecks, summarizeRisk, RISK_BASIS, RISK_DISCLAIMER, RATIO_DANGER, RATIO_CAUTION, URGENT_RETURN_DAYS } from "../../../lib/depositRisk";

/* 만원 → "1.2억" / "3,000만" */
function fmtMan(v) {
  const n = Number(v) || 0;
  if (n >= 10000) return `${(Math.round(n / 1000) / 10).toLocaleString()}억`;
  return `${n.toLocaleString()}만`;
}
const LEVEL_CHIP = { danger: "chip-danger", caution: "chip-warn", good: "chip-success", warn: "chip-warn", ok: "chip-success", info: "chip-info" };
const RATIO_LABEL = { danger: "위험", caution: "주의", good: "양호" };
const INS_LABEL = { none: ["해당 없음", ""], missing: ["미가입·미입력", "chip-danger"], expired: ["만기 지남", "chip-danger"], expiring: ["만기 임박", "chip-warn"], short: ["계약보다 짧음", "chip-warn"], ok: ["가입", "chip-success"] };
const LEVEL_ICON = { danger: "⛔", warn: "⚠️", info: "ℹ️", ok: "✅" };

function SampleChip({ t }) {
  return isSampleTenant(t) ? <span className="chip" style={{ fontSize: 10, padding: "1px 7px", marginLeft: 6 }}>샘플</span> : null;
}

function InputHint({ children }) {
  return (
    <div className="surface-card" style={{ padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{children}</p>
      <Link href="/dashboard/properties" className="btn btn-soft btn-sm">물건 관리에서 시세·보증보험 입력 →</Link>
    </div>
  );
}

function DepositTab({ list, today }) {
  const sched = useMemo(() => returnSchedule(list, today), [list, today]);
  const rows = useMemo(() => list.filter((t) => t.status !== "공실").map((t) => ({ t, r: jeonseRatio(t), ins: insuranceStatus(t, today) })), [list, today]);
  const withDep = rows.filter((x) => x.r.deposit > 0);
  const missingInput = withDep.filter((x) => x.r.reason === "no_base" || x.ins.status === "missing").length;
  const maxMonth = Math.max(1, ...sched.months.map((m) => m.total));

  return (
    <div>
      {missingInput > 0 && <InputHint>보증금이 있는 물건 중 {missingInput}건은 시세(기준가) 또는 보증보험 만기일이 비어 있어 점검이 불완전해요.</InputHint>}

      <p className="section-eyebrow" style={{ marginBottom: 8 }}>물건별 보증금 위험</p>
      {withDep.length === 0 ? (
        <EmptyState icon="🏦" title="보증금이 있는 물건이 없습니다" desc="물건 관리에서 보증금을 입력하면 전세가율과 보증보험을 점검합니다" />
      ) : (
        <div className="surface-card" style={{ padding: 0, overflowX: "auto", marginBottom: 8 }}>
          <div style={{ minWidth: 680 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr .8fr 1fr 1fr 1fr .9fr", gap: 8, padding: "10px 16px", background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
              {["물건", "보증금", "기준가", "전세가율", "보증보험", "만료일"].map((h) => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>{h}</span>)}
            </div>
            {withDep.map(({ t, r, ins }) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1.6fr .8fr 1fr 1fr 1fr .9fr", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border)", alignItems: "center", fontSize: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.addr || "(주소 없음)"}<SampleChip t={t} /></p>
                  <p style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.name || "-"}</p>
                </div>
                <span className="num" style={{ fontWeight: 700 }}>{fmtMan(r.deposit)}</span>
                <div>
                  {r.base ? <><span className="num">{fmtMan(r.base)}</span><p style={{ fontSize: 10, color: r.basis === "public" ? "#c9920a" : "var(--text-faint)", lineHeight: 1.4 }}>{r.basisLabel}</p></> : <span style={{ color: "var(--text-faint)" }}>미입력</span>}
                </div>
                <div>{r.ratio != null ? <span className={`chip ${LEVEL_CHIP[r.level]}`} style={{ fontSize: 11 }}><span className="num">{r.ratio}%</span>&nbsp;{RATIO_LABEL[r.level]}</span> : <span style={{ color: "var(--text-faint)" }}>—</span>}</div>
                <div>
                  <span className={`chip ${INS_LABEL[ins.status][1]}`} style={{ fontSize: 11 }}>{INS_LABEL[ins.status][0]}</span>
                  {ins.until && <p className="num" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>~{ins.until}</p>}
                </div>
                <span className="num" style={{ color: "var(--text-muted)" }}>{t.end_date || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6, marginBottom: 22 }}>
        전세가율 = 보증금 ÷ 기준가(시세 추정 → 매입가 → 공시가격 순). {RATIO_DANGER}% 이상 위험 · {RATIO_CAUTION}~{RATIO_DANGER}% 주의는 흔히 쓰는 참고 기준이며 법정 기준이 아닙니다. 선순위 근저당 등 등기부상 권리관계는 반영하지 않습니다. 보증보험은 입력한 만기일 기준(만기 60일 이내·계약 만료보다 이른 만기는 주의).
      </p>

      <p className="section-eyebrow" style={{ marginBottom: 8 }}>12개월 보증금 반환 일정</p>
      {sched.items.length === 0 ? (
        <EmptyState icon="📅" title="12개월 내 만료되는 보증금이 없습니다" desc="계약 만료일이 입력된 물건 기준입니다" />
      ) : (
        <div className="surface-card" style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 96, marginBottom: 6 }}>
            {sched.months.map((m) => (
              <div key={m.key} title={`${m.year}년 ${m.label} ${fmtMan(m.total)}원`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                {m.total > 0 && <span className="num" style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>{fmtMan(m.total)}</span>}
                <div style={{ width: "100%", height: `${(m.total / maxMonth) * 64}px`, minHeight: m.total > 0 ? 3 : 0, borderRadius: "4px 4px 0 0", background: m.items.some((i) => i.urgent) ? "#e8445a" : "var(--accent)", opacity: m.items.some((i) => i.urgent) ? 0.85 : 0.6 }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {sched.months.map((m) => <span key={m.key} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "var(--text-faint)" }}>{m.label}</span>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sched.items.map((i) => (
              <div key={i.tenant.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: i.urgent ? "rgba(232,68,90,0.06)" : "var(--surface2)", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600, minWidth: 0 }}>{i.tenant.addr}<SampleChip t={i.tenant} /></span>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`chip ${i.urgent ? "chip-danger" : ""}`} style={{ fontSize: 11 }}>D-{i.daysLeft}</span>
                  <span className="num" style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{fmtMan(i.deposit)}원</span>
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 10 }}>빨간색은 {URGENT_RETURN_DAYS}일 이내 반환 예정. 갱신되면 반환하지 않을 수 있습니다 (공실 물건 제외).</p>
        </div>
      )}
    </div>
  );
}

function RegisteredTab({ list, today, updateTenant }) {
  const [savingId, setSavingId] = useState(null);
  const regs = useMemo(() => list.map((t) => ({ t, rc: registeredRentalChecks(t, today) })).filter((x) => x.rc), [list, today]);

  const markFiled = async (t) => {
    setSavingId(t.id);
    try {
      const d = new Date();
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      await updateTenant(t.id, { rent_report_filed_at: ymd });
      toast("렌트홈 신고 완료로 표시했어요 (실제 신고일은 물건 관리에서 수정할 수 있어요)");
    } catch (e) {
      toast(`저장 실패: ${e?.message || "알 수 없는 오류"}`, "error");
    } finally {
      setSavingId(null);
    }
  };

  if (regs.length === 0) {
    return (
      <div>
        <EmptyState icon="🏛️" title="등록임대 물건이 없습니다" desc="임대사업자로 등록한 물건이라면 물건 관리 → 수정 → '위험 관리(선택)'에서 등록임대주택을 체크하세요" />
        <div style={{ textAlign: "center", marginTop: 10 }}><Link href="/dashboard/properties" className="btn btn-soft btn-sm">물건 관리로 이동 →</Link></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {regs.map(({ t, rc }) => {
        const report = rc.checks.find((c) => c.key === "report");
        return (
          <div key={t.id} className="surface-card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{t.addr}<SampleChip t={t} /></p>
                <p style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.name || "-"}{t.registered_at ? ` · 등록일 ${t.registered_at}` : ""}</p>
              </div>
              <span className={`chip ${rc.needsAttention ? "chip-warn" : "chip-success"}`} style={{ fontSize: 11 }}>{rc.needsAttention ? "점검 필요" : "이상 없음"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rc.checks.map((c) => (
                <div key={c.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 12px", borderRadius: 10, background: "var(--surface2)" }}>
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>{LEVEL_ICON[c.level]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{c.label} <span className={`chip ${LEVEL_CHIP[c.level]}`} style={{ fontSize: 10, padding: "1px 7px", marginLeft: 4 }}>{c.level === "danger" ? "확인 필요" : c.level === "warn" ? "주의" : c.level === "ok" ? "완료" : "안내"}</span></p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55, marginTop: 2 }}>{c.text}</p>
                  </div>
                  {c.key === "report" && !report.filed && (
                    <button onClick={() => markFiled(t)} disabled={savingId === t.id} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>{savingId === t.id ? "저장 중..." : "신고 완료 표시"}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RiskPage() {
  const { tenants, loading, updateTenant } = useApp();
  const [tab, setTab] = useState("deposit");
  const [today] = useState(() => new Date());
  const list = useMemo(() => tenants || [], [tenants]);
  const s = useMemo(() => summarizeRisk(list, today), [list, today]);

  if (loading) return <div className="page-in page-padding" style={{ maxWidth: 920 }}><InlineLoader rows={4} /></div>;

  const kpis = [
    { l: "전세가율 위험·주의", v: `${s.danger + s.caution}건`, sub: `위험 ${s.danger} · 주의 ${s.caution}${s.missingBase ? ` · 기준가 미입력 ${s.missingBase}` : ""}`, c: s.danger ? "#e8445a" : s.caution ? "#c9920a" : "#0fa573" },
    { l: "12개월 내 반환 보증금", v: `${fmtMan(s.returnTotal)}원`, sub: s.urgentReturnTotal ? `${URGENT_RETURN_DAYS}일 내 ${fmtMan(s.urgentReturnTotal)}원` : `${URGENT_RETURN_DAYS}일 내 없음`, c: s.urgentReturnTotal ? "#e8445a" : "var(--text-muted)" },
    { l: "보증보험 미가입", v: `${s.insuranceMissing}건`, sub: "보증금 있는 물건 · 만기일 미입력 포함", c: s.insuranceMissing ? "#c9920a" : "#0fa573" },
    { l: "등록임대 점검 필요", v: `${s.registeredAttention}건`, sub: `등록임대 ${s.registeredCount}건 중`, c: s.registeredAttention ? "#c9920a" : "#0fa573" },
  ];

  return (
    <div className="page-in page-padding" style={{ maxWidth: 920 }}>
      <div style={{ marginBottom: 18 }}>
        <SectionLabel>RISK CHECK</SectionLabel>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-.4px" }}>보증금·등록임대 위험 관리</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>전세가율·보증금 반환 일정·보증보험·등록임대사업자 의무를 한 화면에서 점검합니다 · {RISK_BASIS}</p>
      </div>

      {list.length === 0 ? (
        <div>
          <EmptyState icon="🛡️" title="등록된 물건이 없습니다" desc="물건을 등록하고 시세·보증보험 만기일을 입력하면 위험을 점검해 드려요" />
          <div style={{ textAlign: "center", marginTop: 10 }}><Link href="/dashboard/properties" className="btn btn-fill btn-sm">물건 관리에서 시세·보증보험 입력 →</Link></div>
        </div>
      ) : (
        <>
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, marginBottom: 18 }}>
            {kpis.map((k) => (
              <div key={k.l} className="stat">
                <p className="stat-label">{k.l}</p>
                <p className="num stat-value">{k.v}</p>
                <p className="stat-sub" style={{ color: k.c, fontWeight: 700 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[{ k: "deposit", l: "🏦 보증금 위험" }, { k: "registered", l: `🏛️ 등록임대사업자${s.registeredCount ? ` (${s.registeredCount})` : ""}` }].map((x) => (
              <button key={x.k} onClick={() => setTab(x.k)} className={`chip ${tab === x.k ? "is-active" : ""}`}>{x.l}</button>
            ))}
          </div>

          {tab === "deposit" ? <DepositTab list={list} today={today} /> : <RegisteredTab list={list} today={today} updateTenant={updateTenant} />}
        </>
      )}

      <p style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6, marginTop: 24, padding: "10px 14px", borderRadius: 10, background: "var(--surface2)" }}>
        ⓘ {RISK_DISCLAIMER} 이 화면은 입력하신 값으로 계산한 참고용 점검이며 법률·세무 자문이 아닙니다. 렌트홈 신고 기한은 계약 체결일 대신 계약 시작일로 추정합니다.
      </p>
    </div>
  );
}
