-- 2026-09-10 보안 정리 (전수 QA 반영)
-- 1) subscriptions: 로그인 유저의 직접 insert/update/delete 정책 제거
--    쓰기는 전부 서비스 롤 API 라우트(ready/approve/subscription/cancel/invite)만 수행하므로 클라이언트 쓰기 정책이 필요 없고,
--    남겨 두면 브라우저 콘솔에서 스스로 plan='pro', status='active' 를 부여할 수 있다. select 정책만 유지.
drop policy if exists "subscriptions_insert_own" on public.subscriptions;
drop policy if exists "subscriptions_update_own" on public.subscriptions;
drop policy if exists "subscriptions_delete_own" on public.subscriptions;

-- 2) 구 Toss 갱신 pg_cron(billing_renewal) 제거 — 카카오 구독(billing_key 없음)을 만기일에 past_due 로 뒤집을 수 있음.
--    카카오 갱신은 Vercel Cron(/api/billing/kakao/subscription)이 담당.
--    daily-notify pg_cron 도 Vercel Cron(/api/notify)과 같은 시각에 중복 실행되므로 제거.
select cron.unschedule(jobid) from cron.job where jobname in ('billing_renewal', 'daily-notify');

select 'security_hardening ready' as status,
  (select string_agg(policyname, ', ') from pg_policies where tablename = 'subscriptions') as sub_policies,
  (select string_agg(jobname, ', ') from cron.job) as remaining_cron_jobs;
