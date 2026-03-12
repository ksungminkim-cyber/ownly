"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge, SectionLabel, SearchBox, EmptyState, Modal, ConfirmDialog, toast } from "../../../components/shared";
import { C, STATUS_MAP, INTENT_MAP, daysLeft } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

export default function TenantsPage() {
  const router = useRouter();
  const { tenants, updateTenantIntent, addContact, loadContacts, deleteContact } = useApp();
  const [selected, setSelected]         = useState(null);
  const [filter, setFilter]             = useState("전체");
  const [search, setSearch]             = useState("");
  const [showContact, setShowContact]   = useState(false);
  const [contactNote, setContactNote]   = useState({ type: "납부확인", note: "" });
  const [deleteTarget, setDeleteTarget] = useState(null); // { contactId, tenantId }
  const [saving, setSaving]             = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const filtered = useMemo(() => {
    let list = [...tenants];
    if      (filter === "만료임박") list = list.filter((t) => daysLeft(t.end_date) <= 90);
    else if (filter === "미납")     list = list.filter((t) => t.status === "미납");
    else if (filter === "주거")     list = list.filter((t) => t.p_type === "주거");
    else if (filter === "상가")     list = list.filter((t) => t.p_type === "상가");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name?.toLowerCase().includes(q) || t.addr?.toLowerCase().includes(q));
    }
    return list;
  }, [tenants, filter, search]);

  const sel = selected ? tenants.find((t) => t.id === selected.id) : null;

  // 세입자 선택 시 contacts DB에서 불러오기
  const handleSelect = async (t) => {
    setSelected(t);
    if (!t.contacts || t.contacts.length === 0) {
      setLoadingContacts(true);
      try { await loadContacts(t.id); }
      catch { /* silent */ }
      finally { setLoadingContacts(false); }
    }
  };

  const handleAddContact = async () => {
    if (!sel || !contactNote.note.trim()) { toast("내용을 입력하세요", "error"); return; }
    setSaving(true);
    try {
      await addContact(sel.id, {
        date: new Date().toISOString().slice(0, 10),
        type: contactNote.type,
        note: contactNote.note,
      });
      toast("연락 기록이 저장되었습니다");
      setShowContact(false);
      setContactNote({ type: "납부확인", note: "" });
    } catch (e) {
      toast("저장 오류: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContact(deleteTarget.contactId, deleteTarget.tenantId);
      toast("연락 기록이 삭제되었습니다");
    } catch (e) {
      toast("삭제 오류: " + e.message, "error");
    }
    setDeleteTarget(null);
  };

  const handleUpdateIntent = async (intent) => {
    if (!sel) return;
    try {
      await updateTenantIntent(sel.id, intent);
      toast("갱신 의향이 변경되었습니다");
    } catch {
      toast("변경 중 오류가 발생했습니다", "error");
    }
  };

  const CONTACT_TYPES = ["납부확인", "수리요청", "갱신협의", "미납독촉", "기타"];
  const TYPE_COLORS = {
    "납부확인": C.emerald, "수리요청": C.amber,
    "갱신협의": C.indigo,  "미납독촉": C.rose, "기타": C.muted,
  };

  return (
    <div className="page-in tenant-split" style={{ display: "flex", height: "100%", minHeight: "calc(100vh - 0px)" }}>
      {/* ── 왼쪽 목록 ── */}
      <div className="tenant-list-panel" style={{ width: 320, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "26px 18px 14px", borderBottom: `1px solid ${C.border}` }}>
          <SectionLabel>TENANT MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>세입자 관리</h1>
          <div style={{ marginTop: 10 }}><SearchBox value={search} onChange={setSearch} placeholder="이름, 주소 검색..." /></div>
        </div>
        <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 5, flexWrap: "wrap" }}>
          {["전체", "주거", "상가", "만료임박", "미납"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "4px 10px", borderRadius: 13, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter === f ? C.indigo : C.border}`, background: filter === f ? C.indigo + "20" : "transparent", color: filter === f ? C.indigo : C.muted }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <EmptyState icon="👤" title={search ? "검색 결과 없음" : "세입자가 없습니다"} desc={search ? "다른 키워드로 검색해보세요" : ""} />
          ) : filtered.map((t) => {
            const isSelected = sel?.id === t.id;
            const dl = daysLeft(t.end_date);
            return (
              <div key={t.id} onClick={() => handleSelect(t)}
                style={{ padding: "13px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", borderLeft: "3px solid " + (isSelected ? C.indigo : "transparent"), background: isSelected ? C.faint : "transparent", transition: "all .15s" }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = C.surfaceHover; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: (t.color || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: t.color || C.indigo, flexShrink: 0 }}>
                    {t.name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.name}</p>
                      <Badge label={t.status} map={STATUS_MAP} />
                    </div>
                    <p style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.sub} · {t.addr}</p>
                    <div style={{ display: "flex", gap: 10, marginTop: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{t.rent}만원/월</span>
                      <span style={{ fontSize: 12, color: dl <= 60 ? C.rose : dl <= 90 ? C.amber : C.muted }}>D-{dl}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 오른쪽 상세 ── */}
      {!sel ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EmptyState icon="👤" title="세입자를 선택하세요" desc="왼쪽 목록에서 세입자를 클릭하면 상세 정보를 볼 수 있습니다" />
        </div>
      ) : (
        <div style={{ flex: 1, padding: "26px 32px", overflowY: "auto" }}>
          {/* 헤더 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: (sel.color || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: sel.color || C.indigo }}>
                {sel.name?.[0]}
              </div>
              <div>
                <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{sel.name}</h2>
                  <Badge label={sel.status} map={STATUS_MAP} />
                  <Badge label={sel.intent} map={INTENT_MAP} />
                </div>
                <p style={{ fontSize: 13, color: C.muted }}>{sel.sub} · {sel.addr} · {sel.phone}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setShowContact(true)}
                style={{ padding: "8px 14px", borderRadius: 9, background: C.indigo + "18", border: `1px solid ${C.indigo}40`, color: C.indigo, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                + 연락 기록
              </button>
              <button onClick={() => router.push("/dashboard/certified")}
                style={{ padding: "8px 14px", borderRadius: 9, background: C.rose + "18", border: `1px solid ${C.rose}40`, color: C.rose, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                📨 내용증명
              </button>
              {daysLeft(sel.end_date) <= 90 && (
                <select onChange={(e) => { if (e.target.value) { handleUpdateIntent(e.target.value); e.target.value = ""; } }} defaultValue=""
                  style={{ padding: "8px 14px", borderRadius: 9, background: C.amber + "18", border: `1px solid ${C.amber}40`, color: C.amber, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <option value="" disabled>갱신 의향 변경</option>
                  {["갱신의향 있음", "협의중", "갱신의향 없음", "미확인"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* 계약 정보 + 연락기록 2단 */}
          <div className="detail-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
            {/* 계약 정보 */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px" }}>
              <SectionLabel>CONTRACT INFO</SectionLabel>
              {[
                ["보증금",  (Number(sel.dep || 0) / 10000).toFixed(1) + "억원", undefined],
                ["월세",    sel.rent + "만원",              C.emerald],
                ["만료일",  sel.end_date || "—",            daysLeft(sel.end_date) <= 90 ? C.amber : undefined],
                ["잔여일",  "D-" + daysLeft(sel.end_date),  daysLeft(sel.end_date) <= 60 ? C.rose : C.emerald],
                ["유형",    sel.p_type + " · " + sel.sub,   undefined],
              ].map(([l, v, a]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.muted }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: a || C.text }}>{v}</span>
                </div>
              ))}
            </div>

            {/* 연락 기록 */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <SectionLabel>CONTACT HISTORY</SectionLabel>
                <span style={{ fontSize: 12, color: C.muted }}>{(sel.contacts || []).length}건</span>
              </div>
              {loadingContacts ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>불러오는 중...</div>
              ) : !sel.contacts || sel.contacts.length === 0 ? (
                <EmptyState icon="📝" title="연락 기록 없음" desc="+ 연락 기록 버튼으로 추가해보세요" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
                  {sel.contacts.map((ct) => (
                    <div key={ct.id} style={{ padding: "11px 13px", background: C.faint, borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLORS[ct.type] || C.muted, background: (TYPE_COLORS[ct.type] || C.muted) + "18", padding: "2px 8px", borderRadius: 5 }}>
                            {ct.type}
                          </span>
                          <span style={{ fontSize: 11, color: C.muted }}>{ct.date}</span>
                        </div>
                        <button onClick={() => setDeleteTarget({ contactId: ct.id, tenantId: sel.id })}
                          style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = C.rose)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}>
                          ✕
                        </button>
                      </div>
                      <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{ct.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 연락 기록 추가 모달 ── */}
      <Modal open={showContact} onClose={() => setShowContact(false)} width={440}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 16 }}>연락 기록 추가</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>연락 유형</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {CONTACT_TYPES.map((t) => (
                <button key={t} onClick={() => setContactNote((n) => ({ ...n, type: t }))}
                  style={{ padding: "6px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${contactNote.type === t ? TYPE_COLORS[t] : C.border}`, background: contactNote.type === t ? (TYPE_COLORS[t] + "20") : "transparent", color: contactNote.type === t ? TYPE_COLORS[t] : C.muted }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>내용</p>
            <textarea value={contactNote.note} onChange={(e) => setContactNote((n) => ({ ...n, note: e.target.value }))}
              placeholder="연락 내용을 입력하세요..." rows={4}
              style={{ width: "100%", padding: "12px 14px", fontSize: 14, color: C.text, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, resize: "vertical", outline: "none", lineHeight: 1.6 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowContact(false)}
              style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              취소
            </button>
            <button onClick={handleAddContact} disabled={saving} className="btn-primary"
              style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 연락 기록 삭제 확인 ── */}
      <ConfirmDialog open={!!deleteTarget} title="연락 기록 삭제"
        desc="이 연락 기록을 삭제하시겠습니까? 되돌릴 수 없습니다."
        onConfirm={handleDeleteContact} onCancel={() => setDeleteTarget(null)} danger />
    </div>
  );
}
