-- 커뮤니티 품질 강화: AI 답변 플래그 + 답변 채택 시스템

-- 1. community_comments
alter table public.community_comments
  add column if not exists is_ai       boolean default false,
  add column if not exists is_accepted boolean default false;

-- 2. community_posts - 채택된 답변 연결
alter table public.community_posts
  add column if not exists accepted_comment_id uuid;

-- 3. 채택 API용 인덱스
create index if not exists community_comments_post_accepted_idx
  on public.community_comments(post_id, is_accepted);

create index if not exists community_posts_accepted_idx
  on public.community_posts(accepted_comment_id) where accepted_comment_id is not null;
