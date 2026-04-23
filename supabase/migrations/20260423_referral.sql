-- 친구 초대 레퍼럴 시스템
-- 초대 성공 시 양쪽 모두 Plus 트라이얼 기간 +30일 연장

-- 1. 유저별 고유 초대 코드
create table if not exists public.user_invite_codes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  code       text unique not null,
  created_at timestamptz default now()
);
create index if not exists user_invite_codes_code_idx on public.user_invite_codes(code);

-- 2. 초대 성공 보상 이력
create table if not exists public.invite_rewards (
  id          uuid primary key default gen_random_uuid(),
  inviter_id  uuid references auth.users(id) on delete set null,
  invitee_id  uuid references auth.users(id) on delete set null unique,
  reward_days integer default 30,
  rewarded_at timestamptz default now()
);
create index if not exists invite_rewards_inviter_idx on public.invite_rewards(inviter_id);

alter table public.user_invite_codes enable row level security;
alter table public.invite_rewards enable row level security;

drop policy if exists "invite_codes_read_own" on public.user_invite_codes;
create policy "invite_codes_read_own" on public.user_invite_codes
  for select using (auth.uid() = user_id);

-- 초대 코드 조회는 공개 (코드 유효성 확인용 - 서버에서만 쓰지만 혹시나)
drop policy if exists "invite_codes_public_lookup" on public.user_invite_codes;
create policy "invite_codes_public_lookup" on public.user_invite_codes
  for select using (true);

drop policy if exists "rewards_read_own" on public.invite_rewards;
create policy "rewards_read_own" on public.invite_rewards
  for select using (auth.uid() = inviter_id or auth.uid() = invitee_id);

-- 3. 신규 유저 생성 시 자동 코드 발급
create or replace function public.create_invite_code_on_signup()
returns trigger as $$
declare
  new_code text;
  tries integer := 0;
begin
  loop
    -- UUID 해시에서 8자 추출 (충돌 시 random salt로 재시도)
    new_code := upper(substr(md5(NEW.id::text || random()::text || tries::text), 1, 8));
    begin
      insert into public.user_invite_codes (user_id, code) values (NEW.id, new_code);
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries >= 5 then raise; end if;
    end;
  end loop;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_invite on auth.users;
create trigger on_auth_user_created_invite
  after insert on auth.users
  for each row execute function public.create_invite_code_on_signup();

-- 4. 기존 유저에게 회고 적용
insert into public.user_invite_codes (user_id, code)
select
  id,
  upper(substr(md5(id::text || random()::text), 1, 8))
from auth.users
where id not in (select user_id from public.user_invite_codes)
on conflict do nothing;
