-- 세입자(물건) 테이블에 공시가격 컬럼 추가
-- 용도: 보유세 시뮬레이터에서 자동 합산 (재산세 + 종합부동산세 계산)
-- 단위: 만원 (예: 80000 = 8억)

alter table public.tenants
  add column if not exists public_price numeric default 0;

-- 인덱스 (보유세 계산 시 user_id별 합산 쿼리 최적화)
create index if not exists tenants_user_public_price_idx
  on public.tenants(user_id)
  where public_price > 0;
