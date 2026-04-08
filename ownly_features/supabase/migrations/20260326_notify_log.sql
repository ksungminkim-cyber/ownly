-- notify_log: 중복 발송 방지 로그
create table if not exists public.notify_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null, -- unpaid | expiring | checklist
  sent_date   date not null,
  created_at  timestamptz default now()
);
create index if not exists notify_log_user_type_date on public.notify_log(user_id, type, sent_date);
alter table public.notify_log enable row level security;
create policy "본인만 조회" on public.notify_log for select using (auth.uid() = user_id);
