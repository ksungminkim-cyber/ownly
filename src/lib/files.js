// 비공개 파일 업로드·열람 (서버 라우트 /api/files 경유 — 버킷 tenant-files 는 비공개)
import { supabase } from "./supabase";

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("로그인이 필요합니다");
  return { Authorization: `Bearer ${token}` };
}

/** kind: "notes" | "receipts" | "contracts" → { path, name, type } */
export async function uploadPrivateFile(file, kind) {
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);
  const res = await fetch("/api/files", { method: "POST", headers: await authHeader(), body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "업로드 실패");
  return json;
}

/** 저장된 경로 → 10분 유효 URL. 예전 공개 URL(http…)은 그대로 돌려준다 */
export async function privateFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`, { headers: await authHeader() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "파일을 열 수 없습니다");
  return json.url;
}

/** 새 창으로 열기 — 팝업 차단을 피하려고 클릭 시점에 창을 먼저 연다 */
export async function openPrivateFile(path) {
  const w = window.open("", "_blank");
  try {
    const url = await privateFileUrl(path);
    if (w) w.location.href = url; else window.location.href = url;
  } catch (e) {
    if (w) w.close();
    throw e;
  }
}

export async function deletePrivateFile(path) {
  if (!path || /^https?:\/\//.test(path)) return;
  await fetch(`/api/files?path=${encodeURIComponent(path)}`, { method: "DELETE", headers: await authHeader() });
}
