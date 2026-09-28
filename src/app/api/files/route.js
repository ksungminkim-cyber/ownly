// src/app/api/files/route.js
// 비공개 파일(계약서·신분증·영수증 등) — 버킷 tenant-files(비공개). 경로는 항상 "<user_id>/..." 로 시작하고,
// 본인 경로인지 서버가 확인한 뒤에만 업로드·서명 URL(10분)·삭제를 허용한다.
// (예전 세입자 메모 첨부는 공개 버킷 community-images 에 올라가 URL 만 알면 누구나 열람 가능했다)
import { createClient } from "@supabase/supabase-js";

const BUCKET = "tenant-files";
const MAX_BYTES = 10 * 1024 * 1024;
const KINDS = new Set(["notes", "receipts", "contracts"]);

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function userFrom(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : data?.user || null;
}

const own = (user, path) => typeof path === "string" && path.startsWith(`${user.id}/`) && !path.includes("..");

export async function POST(req) {
  const user = await userFrom(req);
  if (!user) return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") || "notes");
  if (!file || typeof file === "string") return Response.json({ error: "파일이 없습니다" }, { status: 400 });
  if (!KINDS.has(kind)) return Response.json({ error: "잘못된 분류" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "10MB 이하 파일만 올릴 수 있어요" }, { status: 400 });
  if (!/^(image\/|application\/pdf$)/.test(file.type || "")) return Response.json({ error: "이미지 또는 PDF 만 올릴 수 있어요" }, { status: 400 });

  const ext = (file.name.match(/\.[a-z0-9]{1,5}$/i)?.[0] || "").toLowerCase();
  const path = `${user.id}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const { error } = await admin().storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return Response.json({ error: "업로드 실패: " + error.message }, { status: 500 });
  return Response.json({ path, name: file.name, type: file.type });
}

// ?path=... → { url } (10분 유효 서명 URL)
export async function GET(req) {
  const user = await userFrom(req);
  if (!user) return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const path = new URL(req.url).searchParams.get("path");
  if (!own(user, path)) return Response.json({ error: "접근 권한이 없습니다" }, { status: 403 });
  const { data, error } = await admin().storage.from(BUCKET).createSignedUrl(path, 600);
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json({ url: data.signedUrl });
}

export async function DELETE(req) {
  const user = await userFrom(req);
  if (!user) return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const path = new URL(req.url).searchParams.get("path");
  if (!own(user, path)) return Response.json({ error: "접근 권한이 없습니다" }, { status: 403 });
  const { error } = await admin().storage.from(BUCKET).remove([path]);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
