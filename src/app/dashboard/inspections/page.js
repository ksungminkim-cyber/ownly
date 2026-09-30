"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";
import { deletePrivateFile } from "../../../lib/files";
import { CONDITIONS, conditionLabel, latestPair, compareInspections } from "../../../lib/inspections";
import { PageHeader, toast } from "../../../components/shared";
import InspectionForm, { PhotoThumb } from "../../../components/InspectionForm";

const KIND_LABEL = { move_in: "입주 점검", move_out: "퇴실 점검" };
const chipOf = (c) => CONDITIONS.find(x => x.key === c)?.chip || "";

function ConditionChip({ condition }) {
  return <span className={`chip ${chipOf(condition)}`} style={{ padding: "2px 10px", fontSize: 11 }}>{conditionLabel(condition)}</span>;
}

// 기록 상세 — 펼친 기록의 사진만 서명 URL 을 요청한다
function RecordDetail({ record }) {
  return (
    <div style={{ marginTop: 10 }}>
      {(record.items || []).map((it, i) => (
        <div key={i} style={{ borderTop: "1px solid var(--border)", padding: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: it.note || it.photos?.length ? 6 : 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", minWidth: 90 }}>{it.area}</span>
            <ConditionChip condition={it.condition} />
          </div>
          {it.note && <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{it.note}</p>}
          {it.photos?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{it.photos.map(p => <PhotoThumb key={p} path={p} />)}</div>
          )}
        </div>
      ))}
      {record.memo && <p style={{ fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>메모: {record.memo}</p>}
    </div>
  );
}

function CompareCell({ item }) {
  if (!item) return <p style={{ fontSize: 12, color: "var(--text-faint)" }}>기록 없음</p>;
  return (
    <div>
      <ConditionChip condition={item.condition} />
      {item.note && <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0" }}>{item.note}</p>}
      {item.photos?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{item.photos.map(p => <PhotoThumb key={p} path={p} size={60} />)}</div>
      )}
    </div>
  );
}

export default function InspectionsPage() {
  const router = useRouter();
  const { tenants, user } = useApp();
  const [rows, setRows] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ok | error
  const [tenantId, setTenantId] = useState("");
  const [editing, setEditing] = useState(null); // null | { record } (record 없으면 새 점검)
  const [openId, setOpenId] = useState(null);
  const [comparing, setComparing] = useState(false);

  const tid = tenantId || tenants[0]?.id || "";
  const tenant = tenants.find(t => t.id === tid);
  const list = useMemo(() => rows.filter(r => r.tenant_id === tid)
    .sort((a, b) => String(b.inspected_on).localeCompare(String(a.inspected_on))), [rows, tid]);
  const pair = useMemo(() => latestPair(list), [list]);
  const comparison = useMemo(() => (pair.moveIn && pair.moveOut ? compareInspections(pair.moveIn, pair.moveOut) : []), [pair]);
  const worseCount = comparison.filter(r => r.worsened).length;

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("move_inspections").select("*").eq("user_id", user.id).order("inspected_on", { ascending: false });
      if (cancelled) return;
      if (error) { console.error("[inspections.load]", error); setLoadState("error"); return; }
      setRows(data || []);
      setLoadState("ok");
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const pickTenant = (id) => { setTenantId(id); setEditing(null); setOpenId(null); setComparing(false); };

  const handleSaved = (row) => {
    setRows(rs => [row, ...rs.filter(r => r.id !== row.id)]);
    setEditing(null);
    setOpenId(row.id);
  };

  const handleDelete = async (rec) => {
    if (!window.confirm(`${rec.inspected_on} ${KIND_LABEL[rec.kind]} 기록과 사진을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const { error } = await supabase.from("move_inspections").delete().eq("id", rec.id).eq("user_id", user.id);
    if (error) { toast(`삭제 실패: ${error.message}`, "error"); return; }
    (rec.items || []).flatMap(it => it.photos || []).forEach(p => deletePrivateFile(p).catch(() => {}));
    setRows(rs => rs.filter(r => r.id !== rec.id));
    toast("점검 기록을 삭제했습니다");
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 860 }}>
      <PageHeader label="MOVE-IN · MOVE-OUT" title="입주·퇴실 점검"
        sub="공간별 상태와 사진을 남겨 두고, 퇴실 때 입주 기록과 비교하세요" />

      <div className="surface-card" style={{ padding: "14px 18px", marginBottom: 16, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
        · 사진은 비공개 저장소에 보관되며 로그인한 본인만 열람할 수 있습니다.<br />
        · 점검 기록은 분쟁 시 참고용 증빙 자료이며, 법적 효력을 보장하지 않습니다.<br />
        · 입주 때 세입자와 함께 확인하고, 기록(사진 포함)을 문자·메일 등으로 공유해 두시길 권합니다.
      </div>

      {tenants.length === 0 ? (
        <div className="surface-card" style={{ padding: "28px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 12 }}>먼저 세입자(물건)를 등록해 주세요.</p>
          <button className="btn btn-fill btn-sm" onClick={() => router.push("/dashboard/tenants")}>세입자 등록하기</button>
        </div>
      ) : (
        <>
          <div className="surface-card" style={{ padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select value={tid} onChange={e => pickTenant(e.target.value)}
              style={{ flex: 1, minWidth: 220, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 14, color: "var(--text)", background: "var(--surface2)" }}>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name} — {t.addr || ""}{t.pType ? ` (${t.pType})` : ""}</option>)}
            </select>
            <button className="btn btn-fill btn-sm" disabled={!tenant || loadState !== "ok" || !!editing}
              onClick={() => { setEditing({ record: null }); setComparing(false); }}>+ 새 점검</button>
          </div>

          {editing && tenant && (
            <div style={{ marginBottom: 16 }}>
              <InspectionForm key={editing.record?.id || "new"} tenant={tenant} initial={editing.record} userId={user?.id}
                onSaved={handleSaved} onCancel={() => setEditing(null)} />
            </div>
          )}

          {loadState === "loading" && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>불러오는 중...</p>}
          {loadState === "error" && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>점검 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}

          {loadState === "ok" && pair.moveIn && pair.moveOut && (
            <div className="surface-card" style={{ padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <p style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>
                입주({pair.moveIn.inspected_on})·퇴실({pair.moveOut.inspected_on}) 기록이 모두 있습니다.
                {worseCount > 0 && <b style={{ color: "#e8445a" }}> 상태가 나빠진 항목 {worseCount}개</b>}
              </p>
              <button className="btn btn-soft btn-sm" onClick={() => setComparing(c => !c)}>{comparing ? "비교 닫기" : "입주·퇴실 비교"}</button>
            </div>
          )}

          {comparing && pair.moveIn && pair.moveOut && (
            <div className="surface-card" style={{ padding: "16px 18px", marginBottom: 16 }}>
              <p className="section-eyebrow" style={{ marginBottom: 4 }}>입주 vs 퇴실 비교</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                가장 최근 퇴실 기록({pair.moveOut.inspected_on})과 그 이전 입주 기록({pair.moveIn.inspected_on})을 공간 이름으로 맞춰 비교합니다. 한쪽에만 있는 공간은 비교하지 않습니다.
                통상적인 사용에 따른 마모는 세입자에게 원상복구를 청구하기 어려울 수 있습니다.
              </p>
              {comparison.map(r => (
                <div key={r.area} style={{ display: "grid", gridTemplateColumns: "minmax(80px,120px) 1fr 1fr", gap: 10, padding: "10px 10px", marginBottom: 6,
                  borderRadius: "var(--radius-sm)", border: `1px solid ${r.worsened ? "rgba(232,68,90,0.45)" : "var(--border)"}`, background: r.worsened ? "rgba(232,68,90,0.05)" : "transparent" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{r.area}</p>
                    {r.worsened && <span className="chip chip-danger" style={{ padding: "1px 8px", fontSize: 10, marginTop: 4 }}>나빠짐</span>}
                  </div>
                  <div><p style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 4 }}>입주</p><CompareCell item={r.before} /></div>
                  <div><p style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 4 }}>퇴실</p><CompareCell item={r.after} /></div>
                </div>
              ))}
              <button className="btn btn-accent" style={{ width: "100%", marginTop: 10 }}
                onClick={() => router.push(`/dashboard/deposit-return?tenant=${encodeURIComponent(tid)}&from=inspection`)}>
                보증금 정산에 반영 {worseCount > 0 ? `(후보 ${worseCount}개)` : ""}
              </button>
            </div>
          )}

          {loadState === "ok" && (
            list.length === 0 ? (
              <div className="surface-card" style={{ padding: "24px 20px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                아직 점검 기록이 없습니다. 입주 때 &ldquo;새 점검&rdquo;으로 공간별 상태와 사진을 남겨 두세요.
              </div>
            ) : list.map(rec => {
              const counts = CONDITIONS.map(c => ({ ...c, n: (rec.items || []).filter(it => it.condition === c.key).length }));
              const photoN = (rec.items || []).reduce((s, it) => s + (it.photos?.length || 0), 0);
              const open = openId === rec.id;
              return (
                <div key={rec.id} className="surface-card" style={{ padding: "14px 18px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className={`chip ${rec.kind === "move_out" ? "chip-warn" : "chip-info"}`} style={{ padding: "2px 10px", fontSize: 11 }}>{KIND_LABEL[rec.kind]}</span>
                    <span className="num" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{rec.inspected_on}</span>
                    <span style={{ flex: 1, fontSize: 12, color: "var(--text-muted)" }}>
                      {counts.filter(c => c.n > 0).map(c => `${c.label} ${c.n}`).join(" · ")} · 사진 {photoN}장
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setOpenId(open ? null : rec.id)}>{open ? "접기" : "보기"}</button>
                    <button className="btn btn-ghost btn-sm" disabled={!!editing} onClick={() => { setEditing({ record: rec }); setOpenId(null); }}>수정</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "#e8445a" }} onClick={() => handleDelete(rec)}>삭제</button>
                  </div>
                  {open && <RecordDetail record={rec} />}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
