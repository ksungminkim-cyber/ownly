-- 핵심 비즈니스 테이블 RLS 보강 (2026-05-20)
-- 이 마이그레이션은 운영 중인 핵심 테이블들에 RLS 정책을 코드로 명시·고정합니다.
--
-- 두 가지 패턴을 자동 분기:
--   (A) user_id 컬럼이 있는 테이블 → auth.uid() = user_id
--   (B) tenant_id 만 있는 테이블 → tenants 조인으로 본인 소유 tenant 의 데이터만 접근
--
-- 컬럼 존재 여부를 information_schema 로 점검 후 적절한 정책을 동적으로 생성합니다.

-- ──────────────────────────────────────────────────────────
-- 헬퍼 함수: user_id 컬럼 있으면 일반 정책, 없으면 tenant_id 조인 정책
-- ──────────────────────────────────────────────────────────
do $$
declare
  t text;
  has_user_id boolean;
  has_tenant_id boolean;
  tbls text[] := array[
    'tenants', 'payments', 'contracts', 'ledger',
    'repairs', 'vacancies', 'contacts', 'ai_usage',
    'subscriptions', 'certified_mail'
  ];
begin
  foreach t in array tbls loop
    -- 테이블 자체가 없으면 skip
    if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      continue;
    end if;

    -- 컬럼 존재 여부 확인
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'user_id'
    ) into has_user_id;
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'tenant_id'
    ) into has_tenant_id;

    -- RLS 활성화
    execute format('alter table public.%I enable row level security', t);

    -- 기존 정책 정리
    execute format('drop policy if exists "%I_select_own" on public.%I', t, t);
    execute format('drop policy if exists "%I_insert_own" on public.%I', t, t);
    execute format('drop policy if exists "%I_update_own" on public.%I', t, t);
    execute format('drop policy if exists "%I_delete_own" on public.%I', t, t);

    if has_user_id then
      -- (A) user_id 직접 매칭
      execute format('create policy "%I_select_own" on public.%I for select using (auth.uid() = user_id)', t, t);
      execute format('create policy "%I_insert_own" on public.%I for insert with check (auth.uid() = user_id)', t, t);
      execute format('create policy "%I_update_own" on public.%I for update using (auth.uid() = user_id)', t, t);
      execute format('create policy "%I_delete_own" on public.%I for delete using (auth.uid() = user_id)', t, t);
    elsif has_tenant_id then
      -- (B) tenant_id 조인 — 본인 소유 tenant 의 데이터만 접근
      execute format(
        'create policy "%I_select_own" on public.%I for select using (exists (select 1 from public.tenants t where t.id = %I.tenant_id and t.user_id = auth.uid()))',
        t, t, t
      );
      execute format(
        'create policy "%I_insert_own" on public.%I for insert with check (exists (select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid()))',
        t, t
      );
      execute format(
        'create policy "%I_update_own" on public.%I for update using (exists (select 1 from public.tenants t where t.id = %I.tenant_id and t.user_id = auth.uid()))',
        t, t, t
      );
      execute format(
        'create policy "%I_delete_own" on public.%I for delete using (exists (select 1 from public.tenants t where t.id = %I.tenant_id and t.user_id = auth.uid()))',
        t, t, t
      );
    else
      -- user_id 도 tenant_id 도 없으면 안전 차단 (모두 거부)
      execute format('create policy "%I_deny_all" on public.%I for all using (false)', t, t);
    end if;

  end loop;
end $$;

-- ──────────────────────────────────────────────────────────
-- 커뮤니티 테이블 (공개 select + 본인만 작성/수정/삭제)
-- 컬럼명이 author_id 또는 user_id 둘 다 가능하므로 자동 감지
-- ──────────────────────────────────────────────────────────
do $$
declare
  t text;
  short text;
  owner_col text;
  ctables text[][] := array[
    ['community_posts',         'posts'],
    ['community_comments',      'comments'],
    ['community_likes',         'likes'],
    ['community_comment_likes', 'comment_likes']
  ];
  pair text[];
begin
  foreach pair slice 1 in array ctables loop
    t := pair[1];
    short := pair[2];

    if not exists (select 1 from information_schema.tables where table_schema='public' and table_name=t) then
      continue;
    end if;

    -- 소유자 컬럼: author_id 우선, 없으면 user_id, 둘 다 없으면 스킵
    select column_name into owner_col
    from information_schema.columns
    where table_schema='public' and table_name=t and column_name in ('author_id','user_id')
    order by case column_name when 'author_id' then 0 else 1 end
    limit 1;

    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "%I_select_public" on public.%I', short, t);
    execute format('drop policy if exists "%I_insert_own"    on public.%I', short, t);
    execute format('drop policy if exists "%I_update_own"    on public.%I', short, t);
    execute format('drop policy if exists "%I_delete_own"    on public.%I', short, t);

    -- 공개 select (커뮤니티 게시물은 누구나 조회)
    execute format('create policy "%I_select_public" on public.%I for select using (true)', short, t);

    if owner_col is not null then
      execute format('create policy "%I_insert_own" on public.%I for insert with check (auth.uid() = %I)', short, t, owner_col);
      execute format('create policy "%I_update_own" on public.%I for update using (auth.uid() = %I)', short, t, owner_col);
      execute format('create policy "%I_delete_own" on public.%I for delete using (auth.uid() = %I)', short, t, owner_col);
    end if;
    -- 소유자 컬럼이 없는 likes 류는 select 만 가능 (insert/delete 는 app 측 RPC 로 처리 가정)

    owner_col := null;
  end loop;
end $$;

-- ──────────────────────────────────────────────────────────
-- 검증용 출력 — 각 테이블의 RLS 활성화 여부 + 사용된 컬럼
-- ──────────────────────────────────────────────────────────
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name=c.relname and column_name='user_id') then 'user_id 직접'
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name=c.relname and column_name='tenant_id') then 'tenant_id 조인'
    else '(컬럼 없음 — 차단)'
  end as policy_pattern
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'tenants','payments','contracts','ledger','repairs','vacancies','contacts',
    'ai_usage','subscriptions','certified_mail',
    'community_posts','community_comments','community_likes','community_comment_likes'
  )
order by c.relname;
