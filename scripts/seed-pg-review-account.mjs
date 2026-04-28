// 카카오페이/네이버페이 비즈 심사용 테스트 계정 생성
// 사용법:
//   1. 프로젝트 루트에 .env.local 또는 환경변수에 다음 두 개 설정:
//      - NEXT_PUBLIC_SUPABASE_URL
//      - SUPABASE_SERVICE_ROLE_KEY
//   2. 실행: node scripts/seed-pg-review-account.mjs
//
// 동작:
//   - kakaopay-review@ownly.kr 계정 생성 (이메일 인증 자동 완료)
//   - naverpay-review@ownly.kr 계정 생성
//   - 비밀번호: review2026!
//   - 이미 존재하면 비밀번호만 재설정

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 파일이 있으면 자동 로드
try {
  const envPath = join(__dirname, "..", ".env.local");
  const env = readFileSync(envPath, "utf-8");
  env.split("\n").forEach(line => {
    const [k, ...rest] = line.split("=");
    if (k && rest.length) {
      const v = rest.join("=").trim().replace(/^["']|["']$/g, "");
      if (!process.env[k.trim()]) process.env[k.trim()] = v;
    }
  });
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  console.error("   .env.local 파일에 두 변수를 넣거나 export 후 다시 실행하세요.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const ACCOUNTS = [
  {
    email: "kakaopay-review@ownly.kr",
    password: "review2026!",
    metadata: { name: "카카오페이 심사", purpose: "PG_REVIEW", company: "KakaoPay" },
  },
  {
    email: "naverpay-review@ownly.kr",
    password: "review2026!",
    metadata: { name: "네이버페이 심사", purpose: "PG_REVIEW", company: "NaverPay" },
  },
];

async function upsertUser({ email, password, metadata }) {
  // 기존 유저 검색 (admin.listUsers)
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;

  const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    // 기존 유저 → 비밀번호·메타 업데이트
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, ...metadata },
    });
    if (error) throw error;
    return { action: "updated", user: data.user };
  }

  // 신규 생성 (이메일 인증 자동 완료)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  return { action: "created", user: data.user };
}

async function main() {
  console.log("🌱 PG 심사용 테스트 계정 생성 시작...\n");

  for (const acc of ACCOUNTS) {
    try {
      const { action, user } = await upsertUser(acc);
      console.log(`✅ [${action.toUpperCase()}] ${acc.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   비밀번호: ${acc.password}`);
      console.log(`   확인됨: ${user.email_confirmed_at ? "✓" : "✗"}\n`);
    } catch (e) {
      console.error(`❌ ${acc.email} 처리 실패:`, e.message);
    }
  }

  console.log("\n📋 회신 메일에 사용할 계정:");
  console.log("─────────────────────────────");
  console.log("URL:        https://www.ownly.kr/login");
  console.log("이메일:     kakaopay-review@ownly.kr");
  console.log("비밀번호:   review2026!");
  console.log("─────────────────────────────\n");
  console.log("✨ 완료! 이제 위 계정으로 로그인 테스트 가능합니다.");
}

main().catch(err => {
  console.error("❌ 스크립트 오류:", err);
  process.exit(1);
});
