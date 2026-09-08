-- 2026-09-08 성장 루프 5종
--  1) events: 익명 도구 이벤트(tool_*) 허용 + 관리자 퍼널 RPC
--  2) certified_credits / credit_purchases: 내용증명 건당 결제(추가 발급권)
--  3) consume_certified_credit(): 발급권 1장 원자적 차감
-- 실행: Supabase SQL Editor (20260709_events_tracking.sql 이후)

-- ─── 1) 익명 도구 이벤트 ─────────────────────────────────────────
-- 무료 도구(/tools/*, /diagnose)는 로그인 전이므로 user_id null 로 기록.
-- event 이름이 tool_ 로 시작하는 경우만 익명 insert 허용 (남용 방지).
drop policy if exists "events_insert_anon_tool" on public.events;
create policy "events_insert_anon_tool" on public.events
  for insert to anon
  with check (user_id is null and event like 'tool\_%');

-- ─── 1-b) 관리자 퍼널 RPC ────────────────────────────────────────
-- 관리자 이메일만 호출 가능 (SECURITY DEFINER 이므로 함수 내부에서 직접 검사)
create or replace function public.get_admin_funnel(p_days int default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', '');
  v_from timestamptz := now() - make_interval(days => greatest(p_days, 1));
  v_result json;
begin
  if v_email not in ('k.sungminkim@gmail.com') then
    raise exception 'forbidden';
  end if;

  select json_build_object(
    -- 이벤트별 총계 (로그인 유저 수 + 익명 브라우저 수)
    'events', (
      select coalesce(json_agg(row_to_json(e)), '[]'::json) from (
        select event,
               count(*)::int as cnt,
               count(distinct user_id)::int as users,
               count(distinct props->>'anon_id') filter (where user_id is null)::int as anon
        from public.events
        where created_at > v_from
        group by event
        order by cnt desc
      ) e
    ),
    -- 주간 활성 유저 (dashboard_view 기준, 최근 12주)
    'weekly', (
      select coalesce(json_agg(row_to_json(w)), '[]'::json) from (
        select to_char(date_trunc('week', created_at), 'MM/DD') as week,
               count(distinct user_id)::int as users
        from public.events
        where event = 'dashboard_view' and created_at > now() - interval '12 weeks'
        group by date_trunc('week', created_at)
        order by date_trunc('week', created_at)
      ) w
    ),
    -- 유입 경로별 가입 → 물건 등록 전환
    'sources', (
      select coalesce(json_agg(row_to_json(s)), '[]'::json) from (
        select coalesce(nullif(props->>'utm_source', ''), '(직접)') as source,
               coalesce(nullif(props->>'utm_campaign', ''), '-') as campaign,
               coalesce(nullif(props->>'landing', ''), '/') as landing,
               count(*)::int as signups,
               count(*) filter (where exists (
                 select 1 from public.events p
                 where p.user_id = e.user_id and p.event = 'property_added'
               ))::int as activated
        from public.events e
        where event = 'signup_source' and created_at > v_from
        group by 1, 2, 3
        order by signups desc
        limit 30
      ) s
    ),
    -- 도구별 조회 → CTA 클릭 (익명 브라우저 기준)
    'tools', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select coalesce(props->>'tool', '?') as tool,
               count(distinct coalesce(props->>'anon_id', user_id::text)) filter (where event = 'tool_view')::int as views,
               count(distinct coalesce(props->>'anon_id', user_id::text)) filter (where event = 'tool_cta_click')::int as cta
        from public.events
        where event in ('tool_view', 'tool_cta_click') and created_at > v_from
        group by 1
        order by views desc
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_admin_funnel(int) from public;
grant execute on function public.get_admin_funnel(int) to authenticated;

-- ─── 2) 내용증명 추가 발급권 ──────────────────────────────────────
create table if not exists public.certified_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
alter table public.certified_credits enable row level security;
drop policy if exists "certified_credits_select_own" on public.certified_credits;
create policy "certified_credits_select_own" on public.certified_credits
  for select using (auth.uid() = user_id);
-- insert/update 는 service role(결제 승인 API·초대 보상) 과 아래 RPC 만 수행

create table if not exists public.credit_purchases (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'certified',
  qty integer not null check (qty > 0),
  amount integer not null,                -- 원 단위
  status text not null default 'pending', -- pending | paid | failed
  order_id text not null unique,
  kakao_tid text,
  kakao_aid text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists credit_purchases_user_idx on public.credit_purchases (user_id, created_at desc);
alter table public.credit_purchases enable row level security;
drop policy if exists "credit_purchases_select_own" on public.credit_purchases;
create policy "credit_purchases_select_own" on public.credit_purchases
  for select using (auth.uid() = user_id);

-- ─── 3) 발급권 차감 (호출자 본인, 원자적) ─────────────────────────
-- 반환: 차감 후 잔액. 잔액 0 이면 예외.
create or replace function public.consume_certified_credit()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_balance integer;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  update public.certified_credits
     set balance = balance - 1, updated_at = now()
   where user_id = v_uid and balance > 0
  returning balance into v_balance;
  if v_balance is null then
    raise exception 'no_credit';
  end if;
  return v_balance;
end;
$$;

revoke all on function public.consume_certified_credit() from public;
grant execute on function public.consume_certified_credit() to authenticated;

select 'growth_loop ready' as status;
