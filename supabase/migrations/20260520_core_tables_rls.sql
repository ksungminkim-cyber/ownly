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
-- ──────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_posts') then
    alter table public.community_posts enable row level security;

    drop policy if exists "posts_select_public" on public.community_posts;
    drop policy if exists "posts_insert_own" on public.community_posts;
    drop policy if exists "posts_update_own" on public.community_posts;
    drop policy if exists "posts_delete_own" on public.community_posts;

    create policy "posts_select_public" on public.community_posts for select using (true);
    create policy "posts_insert_own" on public.community_posts for insert with check (auth.uid() = author_id);
    create policy "posts_update_own" on public.community_posts for update using (auth.uid() = author_id);
    create policy "posts_delete_own" on public.community_posts for delete using (auth.uid() = author_id);
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_comments') then
    alter table public.community_comments enable row level security;

    drop policy if exists "comments_select_public" on public.community_comments;
    drop policy if exists "comments_insert_own" on public.community_comments;
    drop policy if exists "comments_update_own" on public.community_comments;
    drop policy if exists "comments_delete_own" on public.community_comments;

    create policy "comments_select_public" on public.community_comments for select using (true);
    create policy "comments_insert_own" on public.community_comments for insert with check (auth.uid() = author_id);
    create policy "comments_update_own" on public.community_comments for update using (auth.uid() = author_id);
    create policy "comments_delete_own" on public.community_comments for delete using (auth.uid() = author_id);
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_likes') then
    alter table public.community_likes enable row level security;

    drop policy if exists "likes_select_public" on public.community_likes;
    drop policy if exists "likes_insert_own" on public.community_likes;
    drop policy if exists "likes_delete_own" on public.community_likes;

    create policy "likes_select_public" on public.community_likes for select using (true);
    create policy "likes_insert_own" on public.community_likes for insert with check (auth.uid() = user_id);
    create policy "likes_delete_own" on public.community_likes for delete using (auth.uid() = user_id);
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_comment_likes') then
    alter table public.community_comment_likes enable row level security;

    drop policy if exists "comment_likes_select_public" on public.community_comment_likes;
    drop policy if exists "comment_likes_insert_own" on public.community_comment_likes;
    drop policy if exists "comment_likes_delete_own" on public.community_comment_likes;

    create policy "comment_likes_select_public" on public.community_comment_likes for select using (true);
    create policy "comment_likes_insert_own" on public.community_comment_likes for insert with check (auth.uid() = user_id);
    create policy "comment_likes_delete_own" on public.community_comment_likes for delete using (auth.uid() = user_id);
  end if;
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
