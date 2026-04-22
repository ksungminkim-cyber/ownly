-- 세입자 메모·이력 — 전화·방문·협상 기록으로 분쟁 대응 증거 확보
create table if not exists public.tenant_notes (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null default 'memo',  -- call | visit | negotiate | memo | complaint | other
  title        text,
  content      text not null,
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists tenant_notes_tenant_idx on public.tenant_notes(tenant_id, occurred_at desc);
create index if not exists tenant_notes_user_idx on public.tenant_notes(user_id, occurred_at desc);

alter table public.tenant_notes enable row level security;

drop policy if exists "tenant_notes_select_own" on public.tenant_notes;
create policy "tenant_notes_select_own"
  on public.tenant_notes for select
  using (auth.uid() = user_id);

drop policy if exists "tenant_notes_insert_own" on public.tenant_notes;
create policy "tenant_notes_insert_own"
  on public.tenant_notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "tenant_notes_update_own" on public.tenant_notes;
create policy "tenant_notes_update_own"
  on public.tenant_notes for update
  using (auth.uid() = user_id);

drop policy if exists "tenant_notes_delete_own" on public.tenant_notes;
create policy "tenant_notes_delete_own"
  on public.tenant_notes for delete
  using (auth.uid() = user_id);
