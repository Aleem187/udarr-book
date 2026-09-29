-- Who actually performed the action (the authenticated staff session), captured
-- server-side from auth.uid() inside record_transaction() — never trust a
-- client-supplied name for this, since recorded_by is free text (who physically
-- handled the cash, which can differ from who is logged in). Nullable because
-- rows inserted directly (not through record_transaction) have no session.
alter table transactions add column if not exists performed_by uuid references app_users(id) on delete set null;

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
  insert into transactions (customer_id, type, amount, note, payment_method, recorded_by, performed_by, date)
  values (p_customer_id, p_type, p_amount, p_note, p_payment_method, p_recorded_by, auth.uid(), p_date)
  returning * into v_txn;

  v_delta := case when p_type = 'credit' then p_amount else -p_amount end;

  update customers
  set balance = balance + v_delta, updated_at = now()
  where id = p_customer_id;

  return v_txn;
end;
$$;
