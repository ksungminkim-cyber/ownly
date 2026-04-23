-- 주간 커뮤니티 Top 10 이메일 자동 발송 (매주 월요일 09:00 KST = UTC 00:05)
-- 실행 위치: https://supabase.com/dashboard/project/rubgztlhnlhglpyppurk/sql
-- 전제: pg_cron, pg_net extension 활성화 (뉴스레터 마이그레이션에서 이미 처리)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 기존 동일 job 제거
do $$
begin
  if exists (select 1 from cron.job where jobname = 'weekly_top_posts') then
    perform cron.unschedule('weekly_top_posts');
  end if;
end $$;

-- 스케줄 등록 (매주 월요일 00:05 UTC = KST 월요일 09:05)
-- 뉴스레터(00:00)와 5분 차이를 둬서 부하 분산
select cron.schedule(
  'weekly_top_posts',
  '5 0 * * 1',
  $$
  select net.http_post(
    url := 'https://rubgztlhnlhglpyppurk.supabase.co/functions/v1/send-weekly-top-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 확인
select jobid, schedule, jobname, active from cron.job where jobname = 'weekly_top_posts';
