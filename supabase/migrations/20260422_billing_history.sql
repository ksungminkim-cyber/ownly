-- billing_history: 결제 이력 (영수증·환불·실패 추적)
create table if not exists public.billing_history (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  plan              text not null,          -- plus | pro | starter
  amount            integer not null,       -- KRW
  status            text not null default 'paid', -- paid | failed | refunded | cancelled
  method            text default 'card',
  toss_payment_key  text,
  toss_order_id     text,
  receipt_url       text,
  paid_at           timestamptz,
  error_message     text,
  created_at        timestamptz not null default now()
);

create index if not exists billing_history_user_paid_idx
  on public.billing_history(user_id, paid_at desc);

alter table public.billing_history enable row level security;

drop policy if exists "billing_history_select_own" on public.billing_history;
create policy "billing_history_select_own"
  on public.billing_history for select
  using (auth.uid() = user_id);

-- 구독 취소 처리 보조 컬럼 (cancelled_at, cancel_reason)
alter table public.subscriptions
  add column if not exists cancelled_at  timestamptz,
  add column if not exists cancel_reason text;
