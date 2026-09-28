"use client";
// 계약서 사진 → AI 추출 → 사용자가 확인·수정 → onConfirm(fields)
// 저장은 하지 않는다. 호출자(물건 관리)가 기존 등록 모달을 이 값으로 채워 열고, 사용자가 그 모달에서 저장한다.
import { useState, useRef } from "react";
import { Modal } from "./shared";
import { supabase } from "../lib/supabase";

const MAX_SIDE = 1600; // 긴 변 기준 축소 — 계약서 글자 판독엔 충분. 이미지 토큰을 줄여 Groq 분당 한도(ITPM) 여유 확보

// 브라우저에서 JPEG 로 다시 그려 용량을 줄이고 HEIC 등도 (브라우저가 열 수 있으면) JPEG 로 바꾼다
async function toJpeg(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob) throw new Error("encode");
    return blob;
  } finally { URL.revokeObjectURL(url); }
}

const toForm = (f) => ({
  address: f.address || "",
  property_type: f.property_type || "주거",
  sub_type: f.sub_type || "",
  deposit_manwon: f.deposit_manwon ?? "",
  monthly_rent_manwon: f.monthly_rent_manwon ?? "",
  maintenance_manwon: f.maintenance_manwon ?? "",
  start_date: f.start_date || "",
  end_date: f.end_date || "",
  pay_day: f.pay_day ? String(f.pay_day) : "",
  tenant_name: f.tenant_name || "",
  tenant_phone: f.tenant_phone || "",
  area_m2: f.area_m2 ?? "",
});

const label = { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, display: "block" };
const input = { width: "100%", padding: "10px 12px", fontSize: 13, color: "var(--text)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", boxSizing: "border-box" };

function Field({ name, text, type = "text", value, onChange, hint, missing }) {
  return (
    <label style={{ display: "block" }}>
      <span style={label}>{text}{missing && <span style={{ color: "var(--text-faint)", fontWeight: 500 }}> · 읽지 못함</span>}</span>
      <input type={type} value={value} onChange={(e) => onChange(name, e.target.value)} inputMode={type === "number" ? "decimal" : undefined} style={{ ...input, borderColor: missing ? "var(--border)" : "var(--accent-border)" }} />
      {hint && <span style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3, display: "block" }}>{hint}</span>}
    </label>
  );
}

/**
 * @param {{ open: boolean, onOpenChange: (v:boolean)=>void, onConfirm: (fields:object)=>void, hideTrigger?: boolean }} props
 */
export default function ContractScan({ open, onOpenChange, onConfirm, hideTrigger = false }) {
  const [phase, setPhase] = useState("pick"); // pick | loading | review
  const [error, setError] = useState("");
  const [meta, setMeta] = useState(null); // { confidence, notes, provider }
  const [form, setForm] = useState(null);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  const reset = () => { setPhase("pick"); setError(""); setMeta(null); setForm(null); };
  const close = () => { reset(); onOpenChange(false); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const analyze = async (file) => {
    if (!file) return;
    setError("");
    setPhase("loading");
    try {
      let blob;
      try { blob = await toJpeg(file); }
      catch { throw new Error("이 사진 형식을 브라우저에서 열지 못했어요. JPG·PNG로 저장한 뒤 다시 선택해주세요 (아이폰은 설정 › 카메라 › 포맷 › '높은 호환성')."); }
      if (blob.size > 8 * 1024 * 1024) throw new Error("사진이 너무 커요. 8MB 이하로 다시 찍어주세요.");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
      const fd = new FormData();
      fd.append("image", blob, "contract.jpg");
      const res = await fetch("/api/contract-scan", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 413) throw new Error("사진 용량이 너무 커요. 다시 찍어주세요.");
        throw new Error(data.error || `분석에 실패했어요 (오류 ${res.status}). 잠시 후 다시 시도해주세요.`);
      }
      setForm(toForm(data.fields || {}));
      setMeta({ confidence: data.fields?.confidence, notes: data.fields?.notes, provider: data.provider });
      setPhase("review");
    } catch (e) {
      setError(e?.message || "분석에 실패했어요. 잠시 후 다시 시도해주세요.");
      setPhase("pick");
    }
  };

  const onPick = (e) => { const f = e.target.files?.[0]; e.target.value = ""; analyze(f); };

  const confirm = () => {
    const num = (v) => (v === "" || v == null ? null : Number(v));
    onConfirm({
      address: form.address.trim() || null,
      property_type: form.property_type,
      sub_type: form.sub_type.trim() || null,
      deposit_manwon: num(form.deposit_manwon),
      monthly_rent_manwon: num(form.monthly_rent_manwon),
      maintenance_manwon: num(form.maintenance_manwon),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      pay_day: num(form.pay_day),
      tenant_name: form.tenant_name.trim() || null,
      tenant_phone: form.tenant_phone.trim() || null,
      area_m2: num(form.area_m2),
    });
    reset();
    onOpenChange(false);
  };

  const pyeong = form && Number(form.area_m2) > 0 ? Math.round((Number(form.area_m2) / 3.3058) * 10) / 10 : null;
  const lowConf = meta?.confidence != null && meta.confidence < 0.6;
  const miss = (k) => form && (form[k] === "" || form[k] == null);

  return (
    <>
      {!hideTrigger && (
        <button type="button" onClick={() => onOpenChange(true)} className="btn btn-soft" style={{ padding: "10px 16px", borderRadius: 11, fontSize: 13, fontWeight: 700 }}>📷 계약서 사진으로 등록</button>
      )}

      <Modal open={open} onClose={close} width={520}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div>
            <p className="section-eyebrow" style={{ marginBottom: 4 }}>AI 계약서 읽기 <span className="chip chip-info" style={{ marginLeft: 6, fontSize: 10, padding: "1px 7px" }}>Beta</span></p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>{phase === "review" ? "읽은 내용을 확인해주세요" : "계약서 사진으로 등록"}</h2>
          </div>
          <button type="button" onClick={close} aria-label="닫기" className="btn btn-ghost btn-sm">✕</button>
        </div>

        {phase !== "review" && (
          <>
            <ul style={{ margin: "0 0 16px", padding: "12px 14px 12px 30px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.75 }}>
              <li>사진은 AI 분석에만 사용되고 저장되지 않습니다</li>
              <li><b style={{ color: "var(--text)" }}>주민등록번호 등 민감 정보는 가리고</b> 찍어주세요</li>
              <li>AI 가 잘못 읽을 수 있으니 저장 전 꼭 확인하세요</li>
              <li style={{ color: "var(--text-faint)" }}>계약서 첫 장(소재지·보증금·차임·기간)이 잘 보이게 · 하루 10회까지</li>
            </ul>

            {error && <p role="alert" style={{ fontSize: 12.5, color: "#e8445a", background: "rgba(232,68,90,0.06)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: "var(--radius-sm)", padding: "10px 12px", marginBottom: 14, lineHeight: 1.6 }}>{error}</p>}

            {phase === "loading" ? (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <p style={{ fontSize: 26, margin: 0 }}>🔎</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginTop: 8 }}>계약서를 읽는 중이에요…</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>보통 10~30초 걸립니다</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button type="button" onClick={() => cameraRef.current?.click()} className="btn btn-accent" style={{ padding: "14px 10px" }}>📷 카메라로 찍기</button>
                <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost" style={{ padding: "14px 10px" }}>🖼️ 사진·파일 선택</button>
              </div>
            )}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} style={{ display: "none" }} />
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={onPick} style={{ display: "none" }} />
          </>
        )}

        {phase === "review" && form && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: lowConf ? "rgba(232,150,10,0.08)" : "var(--accent-light)", border: `1px solid ${lowConf ? "rgba(232,150,10,0.3)" : "var(--accent-border)"}`, color: "var(--text)" }}>
              {lowConf ? "⚠️ 사진이 흐리거나 일부만 읽혔어요. 값을 하나씩 계약서와 대조해주세요." : "AI 가 읽은 값입니다. 계약서와 대조해 틀린 곳을 고쳐주세요."}
              {meta?.notes && <span style={{ display: "block", color: "var(--text-muted)", marginTop: 4 }}>메모: {meta.notes}</span>}
            </p>

            <Field name="address" text="소재지(주소)" value={form.address} onChange={set} missing={miss("address")} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "block" }}>
                <span style={label}>유형</span>
                <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} style={input}>
                  {["주거", "상가", "토지"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <Field name="sub_type" text="세부 유형" value={form.sub_type} onChange={set} missing={miss("sub_type")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field name="deposit_manwon" text="보증금(만원)" type="number" value={form.deposit_manwon} onChange={set} missing={miss("deposit_manwon")} />
              <Field name="monthly_rent_manwon" text="월세(만원)" type="number" value={form.monthly_rent_manwon} onChange={set} missing={miss("monthly_rent_manwon")} hint="전세는 0" />
              <Field name="maintenance_manwon" text="관리비(만원)" type="number" value={form.maintenance_manwon} onChange={set} missing={miss("maintenance_manwon")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field name="start_date" text="계약 시작일" type="date" value={form.start_date} onChange={set} missing={miss("start_date")} />
              <Field name="end_date" text="계약 만료일" type="date" value={form.end_date} onChange={set} missing={miss("end_date")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field name="pay_day" text="납부일(매월)" type="number" value={form.pay_day} onChange={set} missing={miss("pay_day")} hint="말일은 99" />
              <Field name="area_m2" text="전용면적(㎡)" type="number" value={form.area_m2} onChange={set} missing={miss("area_m2")} hint={pyeong ? `약 ${pyeong}평` : null} />
              <div />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field name="tenant_name" text="임차인 이름" value={form.tenant_name} onChange={set} missing={miss("tenant_name")} />
              <Field name="tenant_phone" text="임차인 연락처" value={form.tenant_phone} onChange={set} missing={miss("tenant_phone")} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button type="button" onClick={reset} className="btn btn-ghost" style={{ flex: 1 }}>다시 찍기</button>
              <button type="button" onClick={confirm} className="btn btn-fill" style={{ flex: 2 }}>이 내용으로 등록 화면 열기 →</button>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0, textAlign: "center" }}>아직 저장되지 않았어요 · 다음 화면에서 한 번 더 확인 후 등록합니다</p>
          </div>
        )}
      </Modal>
    </>
  );
}
