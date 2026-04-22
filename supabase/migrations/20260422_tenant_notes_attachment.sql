-- tenant_notes: 파일 첨부 (카톡 스샷·녹취록·사진 등 증거 자료)
alter table public.tenant_notes
  add column if not exists file_url  text,
  add column if not exists file_name text,
  add column if not exists file_type text; -- image | pdf | other
