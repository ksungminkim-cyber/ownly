-- notification_logs: 알림 발송 히스토리 (재발송·오류 추적 포함)
create table if not exists public.notification_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  tenant_id           uuid references public.tenants(id) on delete set null,
  type                text not null, -- unpaid | expiry | deposit | monthly | kakao | manual
  channel             text not null default 'kakao', -- kakao | email | sms
  template_key        text,
  message             text,
  status              text not null default 'pending', -- success | sent | failed | pending
  error_message       text,
  provider_message_id text,
  sent_at             timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index if not exists notification_logs_user_sent_idx
  on public.notification_logs(user_id, sent_at desc);
create index if not exists notification_logs_tenant_idx
  on public.notification_logs(tenant_id);

alter table public.notification_logs enable row level security;

drop policy if exists "notification_logs_select_own" on public.notification_logs;
create policy "notification_logs_select_own"
  on public.notification_logs for select
  using (auth.uid() = user_id);

drop policy if exists "notification_logs_insert_own" on public.notification_logs;
create policy "notification_logs_insert_own"
  on public.notification_logs for insert
  with check (auth.uid() = user_id);
