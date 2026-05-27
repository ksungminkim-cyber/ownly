-- 카카오페이 정기결제 연동 (2026-05-27 PG 심사 통과 · CID CT75680604)
-- subscriptions 테이블에 카카오페이 식별자·결제 메타 컬럼 추가.

alter table public.subscriptions
  add column if not exists pg text default 'kakao',                 -- 'kakao' | 'toss' | 'manual'
  add column if not exists kakao_cid text,                          -- 정기결제 CID (CT75680604)
  add column if not exists kakao_tid text,                          -- 최초 결제 준비 시 받은 거래 ID
  add column if not exists kakao_sid text,                          -- 정기결제 빌링키(Subscription ID)
  add column if not exists last_payment_at timestamptz,             -- 마지막 자동 청구 시각
  add column if not exists next_payment_at timestamptz,             -- 다음 자동 청구 예정 시각
  add column if not exists payment_method_label text;               -- 예: "신용카드 신한 ****-1234"

create index if not exists subscriptions_kakao_sid_idx on public.subscriptions(kakao_sid);
create index if not exists subscriptions_next_payment_idx on public.subscriptions(next_payment_at);

-- billing_history 에도 카카오페이 메타 추가 (있으면 통합 조회)
alter table public.billing_history
  add column if not exists pg text default 'kakao',
  add column if not exists kakao_tid text,
  add column if not exists kakao_aid text;                          -- 결제 승인 ID (refund 시 사용)

create index if not exists billing_history_kakao_tid_idx on public.billing_history(kakao_tid);

select 'kakaopay subscription schema ready' as status,
  (select count(*) from information_schema.columns where table_name='subscriptions' and column_name in ('kakao_sid','kakao_tid','kakao_cid','pg','last_payment_at','next_payment_at','payment_method_label')) as sub_cols,
  (select count(*) from information_schema.columns where table_name='billing_history' and column_name in ('kakao_tid','kakao_aid','pg')) as hist_cols;
