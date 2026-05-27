-- vacancies.action_steps — 공실 액션 플랜 체크 상태 영속화
-- {"photo": true, "copy": false, ...} 형태의 단계별 완료 여부를 jsonb 로 저장합니다.

alter table public.vacancies
  add column if not exists action_steps jsonb not null default '{}'::jsonb;

-- tenants 테이블의 공실 행도 같은 컬럼 사용 (status='공실' 인 세입자 = 공실 호실)
alter table public.tenants
  add column if not exists vacancy_action_steps jsonb not null default '{}'::jsonb;

select 'vacancy_action_steps ready' as status,
  (select count(*) from information_schema.columns where table_name='vacancies' and column_name='action_steps') as vacancies_col,
  (select count(*) from information_schema.columns where table_name='tenants' and column_name='vacancy_action_steps') as tenants_col;
