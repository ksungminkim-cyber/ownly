-- 2026-09-08 임대인 본인 미납 문자 알림 옵트인
-- 설정 > 뉴스레터 카드의 "미납 발생 시 내 휴대폰으로 문자" 토글 (src/app/dashboard/settings/page.js)
-- 발송: /api/notify 일일 크론이 미납 이메일을 보낼 때 sms_unpaid=true 이고 프로필 전화번호가 있으면 Solapi 문자 1통 추가
alter table public.newsletter_subscribers
  add column if not exists sms_unpaid boolean not null default false;

select 'landlord_sms ready' as status,
  (select count(*) from information_schema.columns where table_name = 'newsletter_subscribers' and column_name = 'sms_unpaid') as col;
