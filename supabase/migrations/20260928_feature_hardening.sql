-- 2026-09-28 기능 보완 — 모두 "추가"만 하는 마이그레이션 (기존 데이터·컬럼 변경 없음, 여러 번 실행해도 안전)
-- Supabase SQL Editor 에서 한 번 실행

-- 1) 세입자(물건) 확장
alter table public.tenants add column if not exists report_filed_at date;         -- 전월세(임대차) 신고 완료일
alter table public.tenants add column if not exists purchase_price bigint;         -- 매입가(만원) — 포트폴리오 수익률 계산용
alter table public.tenants add column if not exists maintenance_items jsonb;       -- 관리비 항목 상세 (예전엔 브라우저 localStorage 에만 저장)

-- 2) 장부 영수증 (비공개 버킷 tenant-files 의 경로)
alter table public.ledger add column if not exists receipt_path text;

-- 3) 계약 갱신 기록
alter table public.contracts add column if not exists renewal_right_used boolean; -- 계약갱신청구권 사용 여부
alter table public.contracts add column if not exists prev_rent integer;          -- 갱신 전 월세(만원) — 5% 상한 확인용
alter table public.contracts add column if not exists prev_deposit integer;       -- 갱신 전 보증금(만원)

-- 4) 보증금 반환 정산서 (예전엔 저장되지 않는 계산기)
create table if not exists public.deposit_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  tenant_name text,
  deposit integer not null default 0,          -- 만원
  deductions jsonb not null default '[]'::jsonb, -- [{ label, amount(만원) }]
  refund integer not null default 0,           -- 만원
  memo text,
  created_at timestamptz not null default now()
);
alter table public.deposit_settlements enable row level security;
drop policy if exists "deposit_settlements_select_own" on public.deposit_settlements;
drop policy if exists "deposit_settlements_insert_own" on public.deposit_settlements;
drop policy if exists "deposit_settlements_update_own" on public.deposit_settlements;
drop policy if exists "deposit_settlements_delete_own" on public.deposit_settlements;
create policy "deposit_settlements_select_own" on public.deposit_settlements for select using (auth.uid() = user_id);
create policy "deposit_settlements_insert_own" on public.deposit_settlements for insert with check (auth.uid() = user_id);
create policy "deposit_settlements_update_own" on public.deposit_settlements for update using (auth.uid() = user_id);
create policy "deposit_settlements_delete_own" on public.deposit_settlements for delete using (auth.uid() = user_id);
create index if not exists deposit_settlements_user_idx on public.deposit_settlements(user_id, created_at desc);

-- 5) 세금계산서 요청: 본인 것만 조회 (API 는 service role 이지만, 클라이언트 직접 조회 대비)
alter table public.tax_invoice_requests enable row level security;
drop policy if exists "tax_invoice_requests_select_own" on public.tax_invoice_requests;
create policy "tax_invoice_requests_select_own" on public.tax_invoice_requests for select using (auth.uid() = user_id);

-- 6) 비공개 파일 버킷 (계약서·신분증·영수증 등). 접근은 서버 라우트 /api/files 가 소유자 확인 후 서명 URL 발급
insert into storage.buckets (id, name, public) values ('tenant-files', 'tenant-files', false)
on conflict (id) do update set public = false;
