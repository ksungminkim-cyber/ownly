"use client";
import { useState, useMemo } from "react";
import { Badge, SectionLabel, SearchBox, EmptyState, ConfirmDialog, Modal, AuthInput, SortButton, toast, InlineLoader } from "../../../components/shared";
import { C, STATUS_MAP, COLORS, daysLeft } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

export default function PropertiesPage() {
  const { tenants, addTenant, updateTenant, deleteTenant, loading, canUse, getPlanLimit } = useApp();
  const [filter, setFilter]             = useState("전체");
  const [search, setSearch]             = useState("");
  const [sort, setSort]                 = useState({ key: "rent", dir: "desc" });
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [form, setForm] = useState({ pType: "주거", sub: "아파트", addr: "", rent: "", dep: "", name: "", phone: "", end: "" });

  const resetForm = () => setForm({ pType: "주거", sub: "아파트", addr: "", rent: "", dep: "", name: "", phone: "", end: "" });

  const filtered = useMemo(() => {
    let list = [...tenants];
    if (filter !== "전체") list = list.filter((t) => t.pType === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name?.toLowerCase().includes(q) || t.addr?.toLowerCase().includes(q) || t.sub?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let va, vb;
      if      (sort.key === "rent")  { va = a.rent;          vb = b.rent; }
      else if (sort.key === "dLeft") { va = daysLeft(a.end_date); vb = daysLeft(b.end_date); }
      else if (sort.key === "dep")   { va = a.dep;           vb = b.dep; }
      else                           { va = a.name;          vb = b.name; }
      if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sort.dir === "asc" ? va - vb : vb - va;
    });
    return list;
  }, [tenants, filter, search, sort]);

  const toggleSort = (key) => setSort(sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });

  const openEdit = (t) => {
    setEditTarget(t);
    setForm({ pType: t.pType, sub: t.sub, addr: t.addr, rent: String(t.rent), dep: String(t.dep), name: t.name, phone: t.phone || "", end: t.end_date || "" });
    setShowModal(true);
  };

  const saveTenant = async () => {
    if (!form.addr || !form.rent || !form.name) { toast("필수 항목을 입력하세요", "error"); return; }
    setSaving(true);
    try {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const payload = {
        name: form.name, phone: form.phone || "", p_type: form.pType, sub: form.sub,
        addr: form.addr, dep: Number(form.dep || 0), rent: Number(form.rent),
        end_date: form.end || "2026-12-31", status: "정상", color, intent: "미확인",
        biz: null, contacts: [],
      };
      if (editTarget) {
        await updateTenant(editTarget.id, payload);
        toast("물건 정보가 수정되었습니다");
      } else {
        await addTenant(payload);
        toast("새 물건이 등록되었습니다");
      }
      setShowModal(false); resetForm(); setEditTarget(null);
    } catch (e) {
      toast("저장 중 오류가 발생했습니다", "error");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTenant(deleteTarget.id);
      toast(deleteTarget.name + "님 물건이 삭제되었습니다");
    } catch {
      toast("삭제 중 오류가 발생했습니다", "error");
    }
    setDeleteTarget(null);
  };

  // Supabase 컬럼명 맞추기 (end_date vs end)
  const getEnd = (t) => t.end_date || t.end || "";

  return (
    <div className="page-in page-padding" style={{ maxWidth: 920 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionLabel>PROPERTY MANAGEMENT</SectionLabel>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2744", letterSpacing: "-.4px" }}>물건 관리</h1>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 3 }}>
            총 {tenants.length}개 · 주거 {tenants.filter((t) => t.pType === "주거").length} · 상가 {tenants.filter((t) => t.pType === "상가").length} · 토지 {tenants.filter((t) => t.pType === "토지").length}
          </p>
        </div>
        <button onClick={() => {
            const limit = getPlanLimit("properties");
            if (limit !== Infinity && tenants.length >= limit) {
              alert(`현재 플랜에서는 물건을 최대 ${limit}개까지 등록할 수 있어요.\n업그레이드하면 더 많이 등록할 수 있어요!`);
              window.location.href = "/dashboard/pricing";
              return;
            }
            resetForm(); setEditTarget(null); setShowModal(true);
          }} className="btn-primary"
          style={{ padding: "10px 20px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + 물건 추가
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 7 }}>
          {["전체", "주거", "상가", "토지"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 16px", borderRadius: 18, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter === f ? C.indigo : "#ebe9e3"}`, background: filter === f ? C.indigo + "20" : "transparent", color: filter === f ? C.indigo : C.muted }}>{f}</button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <SearchBox value={search} onChange={setSearch} placeholder="이름, 주소, 유형 검색..." />
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <SortButton label="월세"   active={sort.key === "rent"}  dir={sort.dir} onClick={() => toggleSort("rent")} />
          <SortButton label="만료일" active={sort.key === "dLeft"} dir={sort.dir} onClick={() => toggleSort("dLeft")} />
          <SortButton label="이름"   active={sort.key === "name"}  dir={sort.dir} onClick={() => toggleSort("name")} />
        </div>
      </div>

      {loading ? <InlineLoader rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon="🏠" title={search ? "검색 결과가 없습니다" : "등록된 물건이 없습니다"} desc={search ? "다른 키워드로 검색해보세요" : "첫 물건을 추가해보세요"} action={!search ? "+ 물건 추가" : null} onAction={() => { resetForm(); setShowModal(true); }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {filtered.map((t) => {
            const dl = daysLeft(getEnd(t));
            return (
              <div key={t.id} className="hover-lift" style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "17px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", gap: 13, alignItems: "center", flex: 1, minWidth: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: (t.color || t.c || C.indigo) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
                      {t.pType === "상가" ? "🏪" : t.pType === "토지" ? "🌱" : "🏠"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: t.pType === "상가" ? C.amber : t.pType === "토지" ? "#0d9488" : C.indigo, background: t.pType === "상가" ? C.amber + "18" : t.pType === "토지" ? "#0d948818" : C.indigo + "18", padding: "2px 7px", borderRadius: 5 }}>{t.sub}</span>
                        <Badge label={t.status} map={STATUS_MAP} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>서울 {t.addr}</p>
                      <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>👤 {t.name} · {t.phone}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: "#1a2744" }}>{t.rent}만원<span style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 400 }}>/월</span></p>
                      <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 2 }}>보증금 {(t.dep / 10000).toFixed(1)}억</p>
                      <p style={{ fontSize: 11, color: dl <= 60 ? C.amber : C.muted, marginTop: 3, fontWeight: 600 }}>만료 D-{dl}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <button onClick={() => openEdit(t)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #ebe9e3", background: "transparent", color: "#1a2744" }}>수정</button>
                      <button onClick={() => setDeleteTarget(t)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${C.rose}33`, background: "transparent", color: "#e8445a" }}>삭제</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a2744" }}>{editTarget ? "물건 수정" : "물건 추가"}</h2>
          <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 4 }}>{editTarget ? "물건 정보를 수정합니다" : "새 임대 물건 정보를 입력하세요"}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { type: "주거", icon: "🏠", defaultSub: "아파트" },
              { type: "상가", icon: "🏪", defaultSub: "1층 상가" },
              { type: "토지", icon: "🌱", defaultSub: "전·답" },
            ].map(({ type, icon, defaultSub }) => (
              <button key={type} onClick={() => setForm((f) => ({ ...f, pType: type, sub: defaultSub }))}
                style={{ flex: 1, padding: "11px", borderRadius: 10,
                  border: `2px solid ${form.pType === type ? (type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo) : "#ebe9e3"}`,
                  background: form.pType === type ? (type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo) + "18" : "transparent",
                  color: form.pType === type ? (type === "상가" ? C.amber : type === "토지" ? "#0d9488" : C.indigo) : C.muted,
                  fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {icon} {type}
              </button>
            ))}
          </div>

          {/* 세부 유형 선택 */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a9a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>세부 유형</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(form.pType === "주거"
                ? ["아파트", "빌라", "오피스텔", "단독주택", "다세대"]
                : form.pType === "상가"
                ? ["1층 상가", "2층 이상", "지하", "사무실", "창고·물류"]
                : ["전·답", "임야", "대지", "잡종지", "기타 토지"]
              ).map((s) => (
                <button key={s} onClick={() => setForm((f) => ({ ...f, sub: s }))}
                  style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                    background: form.sub === s
                      ? (form.pType === "상가" ? C.amber : form.pType === "토지" ? "#0d9488" : C.indigo)
                      : "#f0efe9",
                    color: form.sub === s ? "#fff" : "#8a8a9a", transition: "all .15s" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label="세입자 이름 *" placeholder="홍길동"       value={form.name}  onChange={(e) => setForm((f) => ({ ...f, name:  e.target.value }))} icon="👤" />
            <AuthInput label="연락처"         placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} icon="📞" />
          </div>
          <AuthInput label="주소 *" placeholder="마포구 합정동 123" value={form.addr} onChange={(e) => setForm((f) => ({ ...f, addr: e.target.value }))} icon="📍" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AuthInput label={form.pType === "토지" ? "토지 가액 (만원)" : "보증금 (만원)"} placeholder={form.pType === "토지" ? "100000" : "50000"} value={form.dep}  onChange={(e) => setForm((f) => ({ ...f, dep:  e.target.value }))} icon="💵" />
            <AuthInput label={form.pType === "토지" ? "월 임대료 (만원)" : "월세 (만원) *"} placeholder={form.pType === "토지" ? "50" : "120"}   value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} icon="💰" />
          </div>
          <AuthInput label="계약 만료일" type="date" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} />
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button onClick={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid #ebe9e3", color: "#8a8a9a", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>취소</button>
            <button onClick={saveTenant} disabled={saving} className="btn-primary"
              style={{ flex: 2, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${C.indigo},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "저장 중..." : editTarget ? "저장하기" : "등록하기"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="물건 삭제"
        desc={deleteTarget ? `${deleteTarget.name}님의 ${deleteTarget.addr} 물건을 삭제하시겠습니까?` : ""}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />
    </div>
  );
}
