-- 커뮤니티 댓글 좋아요 — 코드(dashboard/community)는 community_comment_likes 를 읽고 쓰지만 테이블이 없어
-- 좋아요가 저장되지 않았다(화면에서만 숫자가 바뀌고 새로고침하면 사라짐).
-- 좋아요 수는 이 테이블의 행 수로 계산한다 (community_comments 에 집계 컬럼을 두지 않음).

create table if not exists public.community_comment_likes (
  id          uuid primary key default gen_random_uuid(),
  comment_id  uuid not null references public.community_comments(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists community_comment_likes_comment_idx on public.community_comment_likes (comment_id);

alter table public.community_comment_likes enable row level security;

-- 좋아요 수 집계를 위해 로그인 사용자는 전체 조회, 추가·삭제는 본인 것만
drop policy if exists comment_likes_select on public.community_comment_likes;
create policy comment_likes_select on public.community_comment_likes
  for select to authenticated using (true);

drop policy if exists comment_likes_insert on public.community_comment_likes;
create policy comment_likes_insert on public.community_comment_likes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists comment_likes_delete on public.community_comment_likes;
create policy comment_likes_delete on public.community_comment_likes
  for delete to authenticated using (auth.uid() = user_id);
