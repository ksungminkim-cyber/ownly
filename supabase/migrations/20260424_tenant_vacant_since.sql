-- 세입자 테이블에 공실 시작일 컬럼 추가
-- 용도: status='공실'인 물건의 누적 손실 계산 기준일
-- (기존엔 start_date를 fallback으로 써서 부정확했음)

alter table public.tenants
  add column if not exists vacant_since date;

-- 인덱스 (공실 관리 페이지 쿼리 최적화)
create index if not exists tenants_vacant_since_idx
  on public.tenants(user_id, status, vacant_since)
  where status = '공실';
