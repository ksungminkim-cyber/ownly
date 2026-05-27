-- certified_mail 발송 상태 추적
-- 작성(drafted) → 발송(sent) → 수령(received) → 완료(completed) 흐름을 기록합니다.

alter table public.certified_mail
  add column if not exists status text not null default 'drafted',
  add column if not exists sent_at date,
  add column if not exists tracking_no text,
  add column if not exists received_at date,
  add column if not exists post_method text;  -- 'postal' | 'epost' | 'other'

create index if not exists certified_mail_status_idx on public.certified_mail(status);

select 'certified_mail status columns ready' as status,
  (select count(*) from information_schema.columns where table_name='certified_mail' and column_name in ('status','sent_at','tracking_no','received_at','post_method')) as added_cols;
