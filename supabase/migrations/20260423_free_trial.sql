-- 14일 무료 Plus 트라이얼 자동 적용
-- 신규 가입 시 subscriptions 테이블에 plan='plus', status='trial' 레코드 자동 생성

create or replace function public.start_trial_on_signup()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status, current_period_end)
  values (NEW.id, 'plus', 'trial', NOW() + interval '14 days')
  on conflict (user_id) do nothing;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_trial on auth.users;
create trigger on_auth_user_created_trial
  after insert on auth.users
  for each row execute function public.start_trial_on_signup();

-- 기존 유저(현재 무료 플랜)에게도 회고 적용 옵션 (필요 시 수동 실행)
-- insert into public.subscriptions (user_id, plan, status, current_period_end)
-- select id, 'plus', 'trial', NOW() + interval '14 days'
-- from auth.users
-- where id not in (select user_id from public.subscriptions);
