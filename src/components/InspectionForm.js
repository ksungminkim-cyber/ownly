"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { uploadPrivateFile, privateFileUrl, openPrivateFile, deletePrivateFile } from "../lib/files";
import { CONDITIONS, templateFor } from "../lib/inspections";
import { toast } from "./shared";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_SIDE = 1600;

// 브라우저 canvas 로 긴 변 1600px JPEG 압축. 디코딩 못 하는 형식(HEIC 등)은 원본 그대로 올린다
async function compressImage(file) {
  if (!/^image\//.test(file.type) || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** 비공개 사진 썸네일 — 렌더될 때만 10분 서명 URL 을 요청, 실패하면 "열기" 버튼 */
export function PhotoThumb({ path, onRemove, size = 72 }) {
  const [state, setState] = useState({ url: null, failed: false });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = await privateFileUrl(path);
        if (!cancelled) setState({ url, failed: false });
      } catch {
        if (!cancelled) setState({ url: null, failed: true });
      }
    })();
    return () => { cancelled = true; };
  }, [path]);

  const open = () => openPrivateFile(path).catch(e => toast(e?.message || "파일을 열 수 없습니다", "error"));
  const box = { width: size, height: size, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface2)", overflow: "hidden", position: "relative", flexShrink: 0 };
  return (
    <div style={box}>
      {state.url ? (
        <button type="button" onClick={open} title="원본 열기" style={{ padding: 0, border: "none", background: "none", cursor: "zoom-in", width: "100%", height: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 10분 서명 URL 이라 next/image 최적화 대상 아님 */}
          <img src={state.url} alt="점검 사진" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </button>
      ) : (
        <button type="button" onClick={open} className="btn btn-ghost btn-sm" style={{ width: "100%", height: "100%", fontSize: 11, padding: 0 }}>
          {state.failed ? "열기" : "…"}
        </button>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="사진 빼기"
          style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: 10, border: "none", background: "rgba(26,39,68,0.7)", color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: "20px", padding: 0 }}>✕</button>
      )}
    </div>
  );
}

let keySeq = 0;
const withKey = (it) => ({ note: "", photos: [], ...it, _k: ++keySeq }); // 화면용 안정 키 (저장 시 제외)
const photosOf = (items) => (items || []).flatMap(it => (Array.isArray(it.photos) ? it.photos : []));

/** 새 점검 작성 / 기존 점검 수정. 저장·취소 시 쓰이지 않게 된 사진은 비공개 저장소에서 지운다 */
export default function InspectionForm({ tenant, initial, userId, onSaved, onCancel }) {
  const [kind, setKind] = useState(() => initial?.kind || "move_in");
  const [date, setDate] = useState(() => initial?.inspected_on || new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState(() => (initial?.items?.length ? initial.items : templateFor(tenant)).map(withKey));
  const [memo, setMemo] = useState(() => initial?.memo || "");
  const [uploading, setUploading] = useState({}); // _k → 업로드 중 장수
  const [saving, setSaving] = useState(false);
  const [newArea, setNewArea] = useState("");
  const sessionUploads = useRef(new Set());
  const originalPhotos = useRef(new Set(photosOf(initial?.items)));
  const busy = Object.values(uploading).some(n => n > 0);

  const update = (k, patch) => setItems(list => list.map(it => (it._k === k ? { ...it, ...patch } : it)));

  const handleFiles = async (k, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(u => ({ ...u, [k]: (u[k] || 0) + files.length }));
    for (const f of files) {
      try {
        const small = await compressImage(f);
        if (small.size > MAX_BYTES) throw new Error(`${f.name}: 10MB 이하 사진만 올릴 수 있어요`);
        const { path } = await uploadPrivateFile(small, "inspections");
        sessionUploads.current.add(path);
        setItems(list => list.map(it => (it._k === k ? { ...it, photos: [...(it.photos || []), path] } : it)));
      } catch (e) {
        toast(e?.message || "사진 업로드 실패", "error");
      } finally {
        setUploading(u => ({ ...u, [k]: Math.max(0, (u[k] || 1) - 1) }));
      }
    }
  };

  const cleanup = (keep) => {
    const drop = [...originalPhotos.current, ...sessionUploads.current].filter(p => !keep.has(p));
    drop.forEach(p => deletePrivateFile(p).catch(() => {}));
  };

  const handleCancel = () => {
    // 저장하지 않은 새 사진만 지우고, 원래 기록의 사진은 그대로 둔다
    cleanup(originalPhotos.current);
    onCancel();
  };

  const handleSave = async () => {
    if (!userId) { toast("로그인 후 저장할 수 있습니다", "error"); return; }
    const clean = items.filter(it => String(it.area || "").trim()).map(it => ({
      area: String(it.area).trim(), condition: it.condition || "good", note: it.note || "", photos: it.photos || [],
    }));
    if (!clean.length) { toast("점검 항목이 하나 이상 필요합니다", "error"); return; }
    setSaving(true);
    try {
      const row = { kind, inspected_on: date, items: clean, memo: memo || null, tenant_id: tenant.id, tenant_name: tenant.name || "" };
      const q = initial?.id
        ? supabase.from("move_inspections").update(row).eq("id", initial.id).eq("user_id", userId)
        : supabase.from("move_inspections").insert([{ ...row, user_id: userId }]);
      const { data, error } = await q.select().single();
      if (error) throw error;
      cleanup(new Set(photosOf(clean)));
      toast(initial?.id ? "점검 기록을 수정했습니다" : "점검 기록을 저장했습니다");
      onSaved(data);
    } catch (e) {
      console.error("[inspections.save]", e);
      toast(`저장 실패: ${e?.message || "알 수 없는 오류"}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const input = { padding: "9px 11px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text)", background: "var(--surface2)", width: "100%" };

  return (
    <div className="surface-card" style={{ padding: "18px 20px" }}>
      <p className="section-eyebrow" style={{ marginBottom: 12 }}>{initial?.id ? "점검 기록 수정" : "새 점검"} · {tenant.name}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["move_in", "입주 점검"], ["move_out", "퇴실 점검"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={`chip${kind === k ? " is-active" : ""}`}>{l}</button>
          ))}
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...input, width: 170 }} />
      </div>

      {items.map(it => (
        <div key={it._k} style={{ borderTop: "1px solid var(--border)", padding: "12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <input value={it.area} onChange={e => update(it._k, { area: e.target.value })} aria-label="공간 이름"
              style={{ ...input, width: 140, fontWeight: 700, background: "transparent" }} />
            <div style={{ display: "flex", gap: 6, flex: 1 }}>
              {CONDITIONS.map(c => (
                <button key={c.key} type="button" onClick={() => update(it._k, { condition: c.key })}
                  className={`chip${it.condition === c.key ? ` ${c.chip} is-active` : ""}`}>{c.label}</button>
              ))}
            </div>
            <button type="button" onClick={() => setItems(list => list.filter(x => x._k !== it._k))} className="btn btn-ghost btn-sm" style={{ color: "var(--text-faint)" }}>항목 삭제</button>
          </div>
          <input value={it.note || ""} onChange={e => update(it._k, { note: e.target.value })} placeholder="메모 (예: 벽지 모서리 찢김 5cm, 계량기 수치 01234)" style={{ ...input, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {(it.photos || []).map(p => (
              <PhotoThumb key={p} path={p} onRemove={() => update(it._k, { photos: it.photos.filter(x => x !== p) })} />
            ))}
            {uploading[it._k] > 0 && <span className="chip chip-info">업로드 중 {uploading[it._k]}장…</span>}
            <label className="btn btn-soft btn-sm" style={{ cursor: "pointer" }}>
              + 사진
              <input type="file" accept="image/*" multiple hidden onChange={e => { handleFiles(it._k, e.target.files); e.target.value = ""; }} />
            </label>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>
        <input value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="공간 추가 (예: 드레스룸)" style={input} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
          if (!newArea.trim()) return;
          setItems(list => [...list, withKey({ area: newArea.trim(), condition: "good" })]);
          setNewArea("");
        }}>추가</button>
      </div>
      <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={2} placeholder="전체 메모 (예: 세입자와 함께 확인, 열쇠 2개 인계)" style={{ ...input, resize: "vertical", marginBottom: 8 }} />
      <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 14 }}>
        사진은 긴 변 1600px JPEG 로 줄여서 올립니다 (장당 10MB 이하). 압축할 수 없는 형식은 원본 그대로 올라갑니다.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={handleCancel} className="btn btn-ghost" style={{ flex: 1 }} disabled={saving}>취소</button>
        <button type="button" onClick={handleSave} className="btn btn-fill" style={{ flex: 2 }} disabled={saving || busy}>
          {saving ? "저장 중..." : busy ? "사진 업로드 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
