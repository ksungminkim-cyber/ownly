-- 2026-09-10 초대 보상 중복 지급 방지 — 동시 요청 2건이 모두 통과하던 경쟁 조건 차단
create unique index if not exists invite_rewards_invitee_unique on public.invite_rewards (invitee_id);
select 'invite_unique ready' as status;
