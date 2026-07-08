// ⚠️ 운영 배포 시 제거 권장 — Claude MCP 자동화 헬퍼
// localhost dev 서버에서 마이그레이션 SQL 파일을 평문으로 반환 (CORS 허용).
// Supabase 대시보드 페이지에서 fetch("http://localhost:3000/api/_internal/sql/...") 로 끌어쓰기 위함.

import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "20260520_core_tables_rls.sql",
  "20260520_billing_waitlist.sql",
  "20260520_certified_mail_status.sql",
  "20260520_vacancy_action_steps.sql",
  "20260527_kakaopay_subscription.sql",
]);

export async function GET(req, { params }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }
  const { name } = await params;
  if (!ALLOWED.has(name)) {
    return NextResponse.json({ error: "not allowed" }, { status: 404 });
  }
  const filePath = path.join(process.cwd(), "supabase", "migrations", name);
  try {
    const sql = await fs.readFile(filePath, "utf-8");
    return new NextResponse(sql, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}
