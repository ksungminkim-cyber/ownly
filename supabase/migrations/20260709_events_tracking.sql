-- 퍼널 이벤트 트래킹 테이블
-- 목적: 가입 후 재로그인·물건등록·결제진입 여부를 데이터로 확인 (활성화 퍼널 계측)
-- 기록: src/lib/track.js (로그인 유저만, fire-and-forget)
-- 조회: Supabase SQL Editor — docs/analytics-events.md 쿼리 참고

create table if not exists public.events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  path text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- 본인 이벤트만 insert 가능 (조회 정책 없음 — 조회는 service role/SQL Editor 전용)
drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert to authenticated
  with check (auth.uid() = user_id);

create index if not exists events_event_created_idx on public.events (event, created_at desc);
create index if not exists events_user_created_idx on public.events (user_id, created_at desc);
