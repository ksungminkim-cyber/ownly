-- 2026-09-30 새 기능 — 추가 전용 (기존 데이터·컬럼 변경 없음, 여러 번 실행해도 안전)
-- 전세·보증금 위험 / 등록임대사업자 / 입주·퇴실 점검 / 캘린더 구독(ICS) / 읽기 전용 공유 링크

-- 1) 물건별 위험 관리 정보
alter table public.tenants add column if not exists market_value bigint;                 -- 현재 시세 추정(만원) — 전세가율 계산용, 사용자 입력
alter table public.tenants add column if not exists guarantee_insurance_until date;      -- 임대보증금 보증보험 만기일 (없으면 미가입으로 간주)
alter table public.tenants add column if not exists registered_rental boolean default false; -- 등록임대사업자 물건 여부
alter table public.tenants add column if not exists registered_at date;                  -- 임대사업자 등록일
alter table public.tenants add column if not exists mandatory_until date;                -- 의무임대기간 종료일
alter table public.tenants add column if not exists rent_report_filed_at date;           -- 등록임대 임대차계약 신고(렌트홈) 완료일

-- 2) 입주·퇴실 점검 기록 (사진은 비공개 버킷 tenant-files 경로만 저장)
create table if not exists public.move_inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  tenant_name text,
  kind text not null check (kind in ('move_in', 'move_out')),
  inspected_on date not null default current_date,
  items jsonb not null default '[]'::jsonb,   -- [{ area, condition: 'good'|'worn'|'damaged', note, photos: [path] }]
  memo text,
  created_at timestamptz not null default now()
);
alter table public.move_inspections enable row level security;
drop policy if exists "move_inspections_select_own" on public.move_inspections;
drop policy if exists "move_inspections_insert_own" on public.move_inspections;
drop policy if exists "move_inspections_update_own" on public.move_inspections;
drop policy if exists "move_inspections_delete_own" on public.move_inspections;
create policy "move_inspections_select_own" on public.move_inspections for select using (auth.uid() = user_id);
create policy "move_inspections_insert_own" on public.move_inspections for insert with check (auth.uid() = user_id);
create policy "move_inspections_update_own" on public.move_inspections for update using (auth.uid() = user_id);
create policy "move_inspections_delete_own" on public.move_inspections for delete using (auth.uid() = user_id);
create index if not exists move_inspections_user_idx on public.move_inspections(user_id, tenant_id, inspected_on desc);

-- 3) 캘린더 구독 토큰 (ICS URL 에 들어가는 비밀값 — 조회는 서버 service role 만)
create table if not exists public.calendar_feeds (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);
alter table public.calendar_feeds enable row level security;
drop policy if exists "calendar_feeds_select_own" on public.calendar_feeds;
drop policy if exists "calendar_feeds_insert_own" on public.calendar_feeds;
drop policy if exists "calendar_feeds_update_own" on public.calendar_feeds;
drop policy if exists "calendar_feeds_delete_own" on public.calendar_feeds;
create policy "calendar_feeds_select_own" on public.calendar_feeds for select using (auth.uid() = user_id);
create policy "calendar_feeds_insert_own" on public.calendar_feeds for insert with check (auth.uid() = user_id);
create policy "calendar_feeds_update_own" on public.calendar_feeds for update using (auth.uid() = user_id);
create policy "calendar_feeds_delete_own" on public.calendar_feeds for delete using (auth.uid() = user_id);

-- 4) 읽기 전용 공유 링크 (세무사·가족에게 연간 보고서 공유 — 조회는 서버 service role 만)
create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  scope text not null default 'annual_report' check (scope in ('annual_report')),
  year integer not null,
  label text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.share_links enable row level security;
drop policy if exists "share_links_select_own" on public.share_links;
drop policy if exists "share_links_insert_own" on public.share_links;
drop policy if exists "share_links_update_own" on public.share_links;
drop policy if exists "share_links_delete_own" on public.share_links;
create policy "share_links_select_own" on public.share_links for select using (auth.uid() = user_id);
create policy "share_links_insert_own" on public.share_links for insert with check (auth.uid() = user_id);
create policy "share_links_update_own" on public.share_links for update using (auth.uid() = user_id);
create policy "share_links_delete_own" on public.share_links for delete using (auth.uid() = user_id);
create index if not exists share_links_user_idx on public.share_links(user_id, created_at desc);
