-- Phase P2: 태그 + Q&A 채택 + 익명 모드 + 뉴스레터 구독
-- 실행 위치: https://supabase.com/dashboard/project/rubgztlhnlhglpyppurk/sql

-- 1) 태그 배열 · Q&A 채택 · 익명 모드 컬럼 추가
alter table public.community_posts
  add column if not exists tags text[] default '{}',
  add column if not exists accepted_comment_id uuid references public.community_comments(id) on delete set null,
  add column if not exists anonymous boolean not null default false;

create index if not exists community_posts_tags_idx on public.community_posts using gin(tags);

-- 2) 뉴스레터 구독 (사용자 설정)
create table if not exists public.newsletter_subscribers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  weekly_digest boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
drop policy if exists "newsletter_select_own" on public.newsletter_subscribers;
drop policy if exists "newsletter_upsert_own" on public.newsletter_subscribers;
drop policy if exists "newsletter_update_own" on public.newsletter_subscribers;
drop policy if exists "newsletter_delete_own" on public.newsletter_subscribers;
create policy "newsletter_select_own" on public.newsletter_subscribers for select using (auth.uid() = user_id);
create policy "newsletter_upsert_own" on public.newsletter_subscribers for insert with check (auth.uid() = user_id);
create policy "newsletter_update_own" on public.newsletter_subscribers for update using (auth.uid() = user_id);
create policy "newsletter_delete_own" on public.newsletter_subscribers for delete using (auth.uid() = user_id);

-- 완료 확인
select 'community P2 ready' as status,
  (select count(*) from information_schema.columns where table_name = 'community_posts' and column_name in ('tags','accepted_comment_id','anonymous')) as post_columns,
  (select count(*) from information_schema.tables where table_name = 'newsletter_subscribers' and table_schema = 'public') as newsletter_table;
