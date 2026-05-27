-- billing_waitlist — 카카오페이 정기결제 PG 심사 통과 전 사전 등록자
-- 심사 통과 후 안내 이메일을 발송할 대상자를 보관합니다.

create table if not exists public.billing_waitlist (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  customer_name text,
  customer_phone text,
  plan text not null,
  cycle text not null default 'monthly',
  pg text not null default 'kakao',
  status text not null default 'waiting', -- waiting | notified | converted | cancelled
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_waitlist_plan_idx on public.billing_waitlist(plan);
create index if not exists billing_waitlist_status_idx on public.billing_waitlist(status);

alter table public.billing_waitlist enable row level security;

drop policy if exists "billing_waitlist_select_own" on public.billing_waitlist;
drop policy if exists "billing_waitlist_insert_own" on public.billing_waitlist;
drop policy if exists "billing_waitlist_update_own" on public.billing_waitlist;
drop policy if exists "billing_waitlist_delete_own" on public.billing_waitlist;

create policy "billing_waitlist_select_own" on public.billing_waitlist
  for select using (auth.uid() = user_id);
create policy "billing_waitlist_insert_own" on public.billing_waitlist
  for insert with check (auth.uid() = user_id);
create policy "billing_waitlist_update_own" on public.billing_waitlist
  for update using (auth.uid() = user_id);
create policy "billing_waitlist_delete_own" on public.billing_waitlist
  for delete using (auth.uid() = user_id);

-- updated_at 자동 갱신 (buildings 마이그레이션에서 만든 함수 재사용)
drop trigger if exists billing_waitlist_set_updated_at on public.billing_waitlist;
create trigger billing_waitlist_set_updated_at
  before update on public.billing_waitlist
  for each row execute function public.set_updated_at();

select 'billing_waitlist ready' as status,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'billing_waitlist') as table_exists;
