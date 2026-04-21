-- Phase 3: Building entity + tenants.building_id
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rubgztlhnlhglpyppurk/sql

-- 1) buildings 테이블
create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  address text not null,
  address_norm text,
  built_year int,
  total_floors int,
  parking_spots int,
  land_area numeric,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists buildings_user_id_idx on public.buildings(user_id);
create index if not exists buildings_address_norm_idx on public.buildings(address_norm);

-- 2) RLS
alter table public.buildings enable row level security;

drop policy if exists "buildings_select_own" on public.buildings;
drop policy if exists "buildings_insert_own" on public.buildings;
drop policy if exists "buildings_update_own" on public.buildings;
drop policy if exists "buildings_delete_own" on public.buildings;

create policy "buildings_select_own" on public.buildings
  for select using (auth.uid() = user_id);
create policy "buildings_insert_own" on public.buildings
  for insert with check (auth.uid() = user_id);
create policy "buildings_update_own" on public.buildings
  for update using (auth.uid() = user_id);
create policy "buildings_delete_own" on public.buildings
  for delete using (auth.uid() = user_id);

-- 3) tenants.building_id 외래키 (nullable — 기존 데이터 영향 없음)
alter table public.tenants
  add column if not exists building_id uuid references public.buildings(id) on delete set null;

create index if not exists tenants_building_id_idx on public.tenants(building_id);

-- 4) updated_at 자동 갱신 트리거
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists buildings_set_updated_at on public.buildings;
create trigger buildings_set_updated_at
  before update on public.buildings
  for each row execute function public.set_updated_at();

-- 완료 확인용
select 'buildings table ready' as status,
  (select count(*) from information_schema.columns where table_name = 'buildings') as building_columns,
  (select count(*) from information_schema.columns where table_name = 'tenants' and column_name = 'building_id') as tenant_fk;
