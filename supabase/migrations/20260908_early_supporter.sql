-- 2026-09-08 얼리 서포터 구독 (단건 결제 → 정기결제 상품으로 전환)
--  - subscriptions: 구독자별 청구 기준가·주기·가격 고정 만료일 (갱신 크론 /api/billing/kakao/subscription 이 사용)
--  - certified_credits 는 친구 초대 보너스 발급권으로 계속 사용
--  - credit_purchases(단건 결제용, 20260908_growth_loop.sql) 는 더 이상 쓰지 않음. 비어 있으며 필요 시 수동 drop.

alter table public.subscriptions
  add column if not exists billing_cycle text not null default 'monthly',   -- 'monthly' | 'annual'
  add column if not exists monthly_amount integer,                          -- 이 구독의 월 기준가 (원). null 이면 플랜 정식가
  add column if not exists price_locked_until timestamptz;                  -- 얼리 서포터 가격 고정 만료일

select 'early_supporter ready' as status,
  (select count(*) from information_schema.columns where table_name = 'subscriptions' and column_name in ('billing_cycle','monthly_amount','price_locked_until')) as sub_cols;
