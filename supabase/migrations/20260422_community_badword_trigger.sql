-- 커뮤니티 욕설·비속어 서버측 차단 (클라이언트 우회 방지)

create or replace function public.check_community_badword()
returns trigger as $$
declare
  bad_words text[] := ARRAY[
    '씨발','시발','씨팔','ㅅㅂ','개새끼','개새','놈팡이','지랄',
    '병신','미친놈','미친년','썅','쌍년','쌍놈','개년','개놈',
    '보지','자지','음란','섹스','누드','포르노','야설',
    'fuck','shit','bitch','asshole','nigger','faggot',
    '창녀','매춘','윤락','원조교제','조건만남','성매매'
  ];
  w text;
  haystack text;
begin
  -- content + title(있으면) 을 lowercase + 공백제거 하여 검사
  haystack := regexp_replace(lower(coalesce(new.content, '') || ' ' || coalesce(new.title, '')), '\s', '', 'g');
  foreach w in array bad_words loop
    if position(lower(w) in haystack) > 0 then
      raise exception '커뮤니티 정책 위반: 부적절한 단어가 포함되어 있습니다 (%)', w
        using hint = '글 내용을 수정 후 다시 시도해주세요';
    end if;
  end loop;
  return new;
end;
$$ language plpgsql;

drop trigger if exists community_posts_badword_check on public.community_posts;
create trigger community_posts_badword_check
before insert or update on public.community_posts
for each row execute function public.check_community_badword();

drop trigger if exists community_comments_badword_check on public.community_comments;
create trigger community_comments_badword_check
before insert or update on public.community_comments
for each row execute function public.check_community_badword();
