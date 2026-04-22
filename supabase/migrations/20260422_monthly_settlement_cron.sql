-- 매월 1일 KST 09:00 (UTC 00:00) 월간 결산 리포트 자동 발송
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'monthly_settlement') then
    perform cron.unschedule('monthly_settlement');
  end if;
end $$;

-- 매월 1일 00:00 UTC = KST 1일 09:00
select cron.schedule(
  'monthly_settlement',
  '0 0 1 * *',
  $$
  select net.http_post(
    url := 'https://rubgztlhnlhglpyppurk.supabase.co/functions/v1/send-monthly-settlement',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

select jobid, schedule, jobname, active from cron.job where jobname = 'monthly_settlement';
