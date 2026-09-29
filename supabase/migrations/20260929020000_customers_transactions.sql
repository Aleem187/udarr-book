create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  currency text not null default 'KZT' check (currency in ('KZT', 'USD')),
  balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(12,2) not null,
  note text,
  payment_method text check (payment_method in ('cash', 'account', 'card')),
  recorded_by text,
  date timestamptz not null default now()
);

create index if not exists transactions_customer_id_idx on transactions(customer_id);
create index if not exists customers_name_lower_idx on customers (lower(name));

alter table customers enable row level security;
alter table transactions enable row level security;

-- This app has no login/auth system — it's a small internal tool where any of the
-- 4 operators can act as anyone. That means the publishable/anon key (embedded in
-- the frontend bundle, publicly visible) needs full read/write access to function.
-- Anyone holding that key could read or write all customer data directly via the
-- Supabase REST API. Acceptable for now; revisit with real Supabase Auth + per-row
-- policies if that ever needs to change.
create policy "Allow anon full access to customers" on customers
  for all to anon, authenticated using (true) with check (true);

create policy "Allow anon full access to transactions" on transactions
  for all to anon, authenticated using (true) with check (true);

-- Lets other open tabs/devices see changes live via Supabase Realtime.
alter publication supabase_realtime add table customers, transactions;

-- Atomically inserts a transaction and adjusts the customer's balance in one
-- DB transaction, so two staff recording payments for the same customer at the
-- same time can't race and silently drop one update (a read-then-write from the
-- client could).
create or replace function record_transaction(
  p_customer_id uuid,
  p_type text,
  p_amount numeric,
  p_note text default null,
  p_payment_method text default null,
  p_recorded_by text default null,
  p_date timestamptz default now()
) returns transactions
language plpgsql
as $$
declare
  v_txn transactions;
  v_delta numeric;
begin
  insert into transactions (customer_id, type, amount, note, payment_method, recorded_by, date)
  values (p_customer_id, p_type, p_amount, p_note, p_payment_method, p_recorded_by, p_date)
  returning * into v_txn;

  v_delta := case when p_type = 'credit' then p_amount else -p_amount end;

  update customers
  set balance = balance + v_delta, updated_at = now()
  where id = p_customer_id;

  return v_txn;
end;
$$;

-- Atomically deletes a transaction and reverses its effect on the balance.
create or replace function delete_transaction(p_transaction_id uuid)
returns void
language plpgsql
as $$
declare
  v_txn transactions;
  v_delta numeric;
begin
  select * into v_txn from transactions where id = p_transaction_id;
  if not found then
    return;
  end if;

  delete from transactions where id = p_transaction_id;

  v_delta := case when v_txn.type = 'credit' then -v_txn.amount else v_txn.amount end;

  update customers
  set balance = balance + v_delta, updated_at = now()
  where id = v_txn.customer_id;
end;
$$;
