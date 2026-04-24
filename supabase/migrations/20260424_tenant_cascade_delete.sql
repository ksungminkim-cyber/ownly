-- 세입자 삭제 시 연관 레코드 자동 정리 (FK cascade 재설정)
-- 문제: tenants 삭제 시 contacts/payments/contracts/repairs FK가 막아서 삭제 불가
-- 해결: 모든 tenant_id FK를 ON DELETE CASCADE로 변경 (ledger는 보존용이므로 SET NULL)

-- 1. contacts (연락처) — cascade
alter table public.contacts drop constraint if exists contacts_tenant_id_fkey;
alter table public.contacts
  add constraint contacts_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;

-- 2. payments (수금) — cascade
alter table public.payments drop constraint if exists payments_tenant_id_fkey;
alter table public.payments
  add constraint payments_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;

-- 3. contracts (계약서) — cascade
alter table public.contracts drop constraint if exists contracts_tenant_id_fkey;
alter table public.contracts
  add constraint contracts_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;

-- 4. repairs (수리 기록) — cascade
alter table public.repairs drop constraint if exists repairs_tenant_id_fkey;
alter table public.repairs
  add constraint repairs_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;

-- 5. ledger (장부) — SET NULL (삭제된 세입자의 수입/지출 이력은 보존)
alter table public.ledger drop constraint if exists ledger_tenant_id_fkey;
alter table public.ledger
  add constraint ledger_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete set null;

-- 확인
select tc.table_name, tc.constraint_name, rc.delete_rule
from information_schema.table_constraints tc
join information_schema.referential_constraints rc on tc.constraint_name = rc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.constraint_name like '%tenant_id_fkey'
order by tc.table_name;
