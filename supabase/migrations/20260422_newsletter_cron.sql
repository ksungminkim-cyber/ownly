-- 주간 뉴스레터 자동 발송 (매주 월요일 오전 9시 KST = UTC 00:00)
-- 실행 위치: https://supabase.com/dashboard/project/rubgztlhnlhglpyppurk/sql
-- 주의: pg_cron extension이 활성화돼 있어야 함 (Database → Extensions → pg_cron)

-- 1) pg_cron extension (이미 활성화돼 있으면 무해)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) 기존 동일 job 제거
do $$
begin
  if exists (select 1 from cron.job where jobname = 'weekly_newsletter') then
    perform cron.unschedule('weekly_newsletter');
  end if;
end $$;

-- 3) 스케줄 등록 (매주 월요일 00:00 UTC = KST 월요일 09:00)
-- ⚠️ 아래 SERVICE_ROLE_KEY 자리에 실제 키를 넣거나, Supabase Dashboard의 Functions → Settings → Secrets 에서 환경변수로 처리하세요
select cron.schedule(
  'weekly_newsletter',
  '0 0 * * 1',
  $$
  select net.http_post(
    url := 'https://rubgztlhnlhglpyppurk.supabase.co/functions/v1/send-weekly-newsletter',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 확인
select jobid, schedule, jobname, active from cron.job where jobname = 'weekly_newsletter';
