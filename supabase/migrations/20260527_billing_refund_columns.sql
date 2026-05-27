-- billing_history 에 환불 추적 컬럼 추가
-- /api/billing/kakao/refund 라우트가 status='refunded', refunded_at, refund_reason 을 갱신합니다.

alter table public.billing_history
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_reason text;

create index if not exists billing_history_status_idx on public.billing_history(status);

select 'billing_history refund columns ready' as status,
  (select count(*) from information_schema.columns where table_name='billing_history' and column_name in ('refunded_at','refund_reason')) as cols;
