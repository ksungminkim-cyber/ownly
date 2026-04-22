-- 수리/민원 워크플로 컬럼 추가 (기존 repairs 테이블 확장)
alter table public.repairs
  add column if not exists status        text default 'done',       -- open | in_progress | done
  add column if not exists priority      text default 'normal',     -- normal | urgent
  add column if not exists source        text default 'landlord',   -- landlord | tenant
  add column if not exists response_memo text,
  add column if not exists completed_at  timestamptz,
  add column if not exists created_at    timestamptz not null default now();

-- 인덱스: 오픈 티켓 빠른 조회
create index if not exists repairs_user_status_idx on public.repairs(user_id, status);
