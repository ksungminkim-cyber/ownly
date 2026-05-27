-- 핵심 비즈니스 테이블 RLS 보강 (2026-05-20)
-- 이 마이그레이션은 이미 운영되고 있을 가능성이 있는 핵심 테이블들에
-- user_id 기반 Row Level Security 정책을 코드로 명시·고정합니다.
--
-- 가정: 각 테이블에 user_id uuid 컬럼이 존재합니다 (AppContext.js 에서 .eq("user_id", uid) 로 조회 중).
-- 만약 컬럼명이 다른 테이블이 있다면 Supabase SQL Editor 에서 해당 정책만 별도 조정해 주세요.

-- ──────────────────────────────────────────────────────────
-- 임대 운영 핵심 테이블 (사용자 본인 데이터만 접근)
-- ──────────────────────────────────────────────────────────
do $$
declare
  t text;
  tbls text[] := array[
    'tenants', 'payments', 'contracts', 'ledger',
    'repairs', 'vacancies', 'contacts', 'ai_usage',
    'subscriptions', 'certified_mail'
  ];
begin
  foreach t in array tbls loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security', t);

      execute format('drop policy if exists "%I_select_own" on public.%I', t, t);
      execute format('drop policy if exists "%I_insert_own" on public.%I', t, t);
      execute format('drop policy if exists "%I_update_own" on public.%I', t, t);
      execute format('drop policy if exists "%I_delete_own" on public.%I', t, t);

      execute format('create policy "%I_select_own" on public.%I for select using (auth.uid() = user_id)', t, t);
      execute format('create policy "%I_insert_own" on public.%I for insert with check (auth.uid() = user_id)', t, t);
      execute format('create policy "%I_update_own" on public.%I for update using (auth.uid() = user_id)', t, t);
      execute format('create policy "%I_delete_own" on public.%I for delete using (auth.uid() = user_id)', t, t);
    end if;
  end loop;
end $$;

-- ──────────────────────────────────────────────────────────
-- 커뮤니티 테이블 (공개 select + 본인만 작성/수정/삭제)
-- ──────────────────────────────────────────────────────────
-- community_posts: author_id 컬럼 사용한다고 가정 (community_comments 도 동일)
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
-- 검증용 출력
-- ──────────────────────────────────────────────────────────
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'tenants','payments','contracts','ledger','repairs','vacancies','contacts',
    'ai_usage','subscriptions','certified_mail',
    'community_posts','community_comments','community_likes','community_comment_likes'
  )
order by c.relname;
