-- =====================================================
-- Supabase SQL Editor에서 실행하세요
-- ownly.kr → Supabase Dashboard → SQL Editor
-- =====================================================

create table if not exists public.tax_invoice_requests (
  id              bigserial primary key,
  created_at      timestamptz default now(),

  -- 신청인
  user_id         uuid references auth.users(id) on delete set null,
  user_email      text,

  -- 발행 내용
  issue_type      text not null,          -- rent | mgt | deposit | contract
  issue_type_label text not null,
  tenant_name     text,
  tenant_id       bigint,
  supply_amt      bigint not null,        -- 공급가액 (원)
  tax_amt         bigint not null,        -- 부가세 (원)
  total_amt       bigint not null,        -- 합계 (원)
  issue_date      text not null,          -- YYYY-MM
  biz_no          text,                   -- 세입자 사업자번호
  memo            text,

  -- 세무사
  partner_id      int not null,
  partner_name    text not null,
  partner_fee     int not null,

  -- 상태
  status          text default 'pending'  -- pending | processing | done | cancelled
);

-- RLS 설정
alter table public.tax_invoice_requests enable row level security;

-- 본인 데이터만 읽기 가능
create policy "users can read own requests"
  on public.tax_invoice_requests for select
  using (auth.uid() = user_id);

-- 삽입은 service role(API route)만 가능 → RLS 우회
-- (SUPABASE_SERVICE_ROLE_KEY로 insert 하므로 별도 policy 불필요)

-- 인덱스
create index if not exists idx_tax_invoice_user_id on public.tax_invoice_requests(user_id);
create index if not exists idx_tax_invoice_status  on public.tax_invoice_requests(status);

-- 확인
select * from public.tax_invoice_requests limit 5;
