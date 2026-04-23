-- 관리자 패널용 RPC 업데이트 — 소셜 로그인 provider 정보 포함
-- Supabase OAuth 는 raw_app_meta_data.provider 에, 네이버는 raw_user_meta_data.provider 에 저장됨
-- RETURNS TABLE 시그니처 변경 시 DROP 후 CREATE 필요 (Postgres 42P13)

drop function if exists public.get_admin_users();

create or replace function public.get_admin_users()
returns table (
  id uuid,
  email text,
  full_name text,
  nickname text,
  phone text,
  provider text,            -- "email" | "google" | "kakao" | "naver" | ...
  providers text[],         -- 다중 연결 시
  created_at timestamptz,
  last_sign_in_at timestamptz,
  tenant_count bigint,
  building_count bigint
)
language plpgsql
security definer
as $$
begin
  -- 관리자만 호출 허용
  if auth.jwt() ->> 'email' not in ('k.sungminkim@gmail.com') then
    raise exception 'forbidden';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'nickname'
    )::text as full_name,
    (u.raw_user_meta_data->>'nickname')::text as nickname,
    (u.raw_user_meta_data->>'phone')::text as phone,
    -- provider 우선순위: app_meta_data.provider (OAuth 네이티브) > user_meta_data.provider (네이버 커스텀) > email
    coalesce(
      nullif(u.raw_app_meta_data->>'provider', ''),
      nullif(u.raw_user_meta_data->>'provider', ''),
      'email'
    )::text as provider,
    case
      when u.raw_app_meta_data->'providers' is not null
        then array(select jsonb_array_elements_text(u.raw_app_meta_data->'providers'))
      else array[]::text[]
    end as providers,
    u.created_at,
    u.last_sign_in_at,
    coalesce(tc.cnt, 0)::bigint as tenant_count,
    coalesce(bc.cnt, 0)::bigint as building_count
  from auth.users u
  left join (
    select user_id, count(*) as cnt from public.tenants group by user_id
  ) tc on tc.user_id = u.id
  left join (
    select user_id, count(*) as cnt from public.buildings group by user_id
  ) bc on bc.user_id = u.id
  order by u.created_at desc;
end;
$$;

grant execute on function public.get_admin_users() to authenticated;
