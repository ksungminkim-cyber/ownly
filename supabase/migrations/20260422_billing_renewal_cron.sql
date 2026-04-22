-- 구독 자동 갱신 크론 (매일 00:00 UTC = 09:00 KST)
-- 실행 위치: Supabase SQL Editor
-- 주의: pg_cron / pg_net extension 활성화 필요 (이미 뉴스레터 마이그레이션에서 활성화됨)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 기존 동일 job 제거
do $$
begin
  if exists (select 1 from cron.job where jobname = 'billing_renewal') then
    perform cron.unschedule('billing_renewal');
  end if;
end $$;

-- 매일 00:00 UTC (KST 09:00)에 실행
-- current_period_end <= now() 인 active 구독을 Toss billing_key 로 재결제
select cron.schedule(
  'billing_renewal',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://rubgztlhnlhglpyppurk.supabase.co/functions/v1/billing-renewal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 확인
select jobid, schedule, jobname, active from cron.job where jobname = 'billing_renewal';
