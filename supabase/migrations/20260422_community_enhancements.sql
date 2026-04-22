-- Phase P1: 커뮤니티 강화 — 활동 알림 + 북마크
-- 실행 위치: https://supabase.com/dashboard/project/rubgztlhnlhglpyppurk/sql

-- 1) 내 글/댓글에 대한 타인의 반응 기록 (활동 알림용)
create table if not exists public.community_activity (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  actor_name text,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  kind text not null check (kind in ('comment','reply','like','post_like','comment_like')),
  snippet text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_activity_recipient_idx on public.community_activity(recipient_id, is_read, created_at desc);

alter table public.community_activity enable row level security;
drop policy if exists "activity_select_own" on public.community_activity;
drop policy if exists "activity_insert_any" on public.community_activity;
drop policy if exists "activity_update_own" on public.community_activity;
drop policy if exists "activity_delete_own" on public.community_activity;
create policy "activity_select_own" on public.community_activity for select using (auth.uid() = recipient_id);
create policy "activity_insert_any" on public.community_activity for insert with check (auth.uid() = actor_id);
create policy "activity_update_own" on public.community_activity for update using (auth.uid() = recipient_id);
create policy "activity_delete_own" on public.community_activity for delete using (auth.uid() = recipient_id);

-- 2) 북마크 (나중에 볼 글 저장)
create table if not exists public.community_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists community_bookmarks_user_idx on public.community_bookmarks(user_id, created_at desc);

alter table public.community_bookmarks enable row level security;
drop policy if exists "bookmarks_select_own" on public.community_bookmarks;
drop policy if exists "bookmarks_insert_own" on public.community_bookmarks;
drop policy if exists "bookmarks_delete_own" on public.community_bookmarks;
create policy "bookmarks_select_own" on public.community_bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.community_bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.community_bookmarks for delete using (auth.uid() = user_id);

-- 3) 트리거: 댓글 작성 시 자동 알림 생성
create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer
as $$
declare
  post_owner uuid;
  parent_owner uuid;
begin
  -- 게시글 작성자
  select user_id into post_owner from public.community_posts where id = new.post_id;

  -- 답글이면 상위 댓글 작성자에게도 알림
  if new.parent_id is not null then
    select user_id into parent_owner from public.community_comments where id = new.parent_id;
    if parent_owner is not null and parent_owner <> new.user_id then
      insert into public.community_activity (recipient_id, actor_id, actor_name, post_id, comment_id, kind, snippet)
      values (parent_owner, new.user_id, new.author_name, new.post_id, new.id, 'reply', left(coalesce(new.content, ''), 100));
    end if;
  end if;

  -- 게시글 작성자에게 알림 (답글이 아니거나, 답글이지만 답 대상자와 다른 경우)
  if post_owner is not null and post_owner <> new.user_id and (parent_owner is null or post_owner <> parent_owner) then
    insert into public.community_activity (recipient_id, actor_id, actor_name, post_id, comment_id, kind, snippet)
    values (post_owner, new.user_id, new.author_name, new.post_id, new.id,
            case when new.parent_id is null then 'comment' else 'reply' end,
            left(coalesce(new.content, ''), 100));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_post_comment on public.community_comments;
create trigger trg_notify_post_comment
  after insert on public.community_comments
  for each row execute function public.notify_post_comment();

-- 완료 확인
select 'community P1 ready' as status,
  (select count(*) from information_schema.tables where table_name = 'community_activity' and table_schema = 'public') as activity_table,
  (select count(*) from information_schema.tables where table_name = 'community_bookmarks' and table_schema = 'public') as bookmarks_table,
  (select count(*) from information_schema.triggers where trigger_name = 'trg_notify_post_comment') as trigger_count;
