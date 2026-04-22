"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "./shared";

const TYPE_CONFIG = {
  call:      { icon: "📞", label: "전화",    color: "#3b5bdb", bg: "rgba(59,91,219,0.08)" },
  visit:     { icon: "🚶", label: "방문",    color: "#0fa573", bg: "rgba(15,165,115,0.08)" },
  negotiate: { icon: "🤝", label: "협상",    color: "#5b4fcf", bg: "rgba(91,79,207,0.08)" },
  complaint: { icon: "⚠️", label: "민원",    color: "#e8445a", bg: "rgba(232,68,90,0.08)" },
  memo:      { icon: "📝", label: "메모",    color: "#8a8a9a", bg: "rgba(138,138,154,0.08)" },
  other:     { icon: "•",  label: "기타",    color: "#8a8a9a", bg: "rgba(138,138,154,0.08)" },
};

export default function TenantNotes({ tenantId, userId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: "call", title: "", content: "", occurred_at: new Date().toISOString().slice(0, 16) });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenant_notes")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("occurred_at", { ascending: false })
      .limit(50);
    if (!error) setNotes(data || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);

  const handleAdd = async () => {
    if (!form.content.trim()) { toast("내용을 입력하세요", "error"); return; }
    setSaving(true);
    const { error } = await supabase.from("tenant_notes").insert({
      tenant_id: tenantId,
      user_id: userId,
      type: form.type,
      title: form.title.trim() || null,
      content: form.content.trim(),
      occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : new Date().toISOString(),
    });
    setSaving(false);
    if (error) { toast("저장 실패: " + error.message, "error"); return; }
    toast("✅ 기록이 저장됐습니다");
    setForm({ type: "call", title: "", content: "", occurred_at: new Date().toISOString().slice(0, 16) });
    setAdding(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("이 기록을 삭제할까요?")) return;
    const { error } = await supabase.from("tenant_notes").delete().eq("id", id);
    if (error) { toast("삭제 실패: " + error.message, "error"); return; }
    toast("삭제됐습니다", "warning");
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px" }}>
          📋 교류 이력 {notes.length > 0 && `(${notes.length})`}
        </p>
        {!adding && (
          <button onClick={() => setAdding(true)}
            style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #ebe9e3", background: "transparent", color: "#1a2744", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            + 기록 추가
          </button>
        )}
      </div>

      {adding && (
        <div style={{ background: "#f8f7f4", border: "1px solid #ebe9e3", borderRadius: 10, padding: "12px", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
            {Object.entries(TYPE_CONFIG).filter(([k]) => k !== "other").map(([key, cfg]) => (
              <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))}
                style={{ padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${form.type === key ? cfg.color : "#ebe9e3"}`, background: form.type === key ? cfg.bg : "transparent", color: form.type === key ? cfg.color : "#8a8a9a" }}>
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>
          <input type="datetime-local" value={form.occurred_at} onChange={(e) => setForm(f => ({ ...f, occurred_at: e.target.value }))}
            style={{ width: "100%", padding: "6px 10px", fontSize: 12, color: "#1a2744", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 6, marginBottom: 6 }} />
          <input placeholder="제목 (선택)" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ width: "100%", padding: "6px 10px", fontSize: 12, color: "#1a2744", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 6, marginBottom: 6 }} />
          <textarea placeholder="대화 내용·협상 조건·방문 결과 등" rows={3} value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, color: "#1a2744", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 6, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
            <button onClick={() => setAdding(false)}
              style={{ flex: 1, padding: "7px", borderRadius: 7, border: "1px solid #ebe9e3", background: "#fff", color: "#8a8a9a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>취소</button>
            <button onClick={handleAdd} disabled={saving}
              style={{ flex: 2, padding: "7px", borderRadius: 7, border: "none", background: "#1a2744", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 11, color: "#a0a0b0", textAlign: "center", padding: 14 }}>불러오는 중...</p>
      ) : notes.length === 0 ? (
        <p style={{ fontSize: 11, color: "#a0a0b0", textAlign: "center", padding: 14, background: "#f8f7f4", borderRadius: 8 }}>
          교류 이력이 없습니다. 전화·방문·협상 내용을 기록해두면 분쟁 시 증거가 됩니다.
        </p>
      ) : (
        <div style={{ maxHeight: 280, overflowY: "auto", background: "#fff", border: "1px solid #ebe9e3", borderRadius: 10 }}>
          {notes.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.memo;
            const when = new Date(n.occurred_at).toLocaleString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
            return (
              <div key={n.id} style={{ padding: "10px 12px", borderBottom: i < notes.length - 1 ? "1px solid #f4f3f0" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, background: cfg.bg, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {n.title && <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2744" }}>{n.title}</span>}
                    <span style={{ fontSize: 10, color: "#a0a0b0" }}>{when}</span>
                  </div>
                  <button onClick={() => handleDelete(n.id)}
                    style={{ padding: "2px 6px", background: "transparent", border: "none", color: "#c0c0cc", fontSize: 11, cursor: "pointer" }}>×</button>
                </div>
                <p style={{ fontSize: 12, color: "#3a3a4e", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{n.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
