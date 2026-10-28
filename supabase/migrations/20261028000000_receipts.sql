-- Public bucket: receipt photos need to be viewable via a plain URL (e.g. pasted
-- into a WhatsApp message to a customer), not just by authenticated app sessions.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "Authenticated can upload receipts"
on storage.objects for insert
to authenticated
with check (bucket_id = 'receipts');

create policy "Authenticated can view receipts"
on storage.objects for select
to authenticated
using (bucket_id = 'receipts');

create policy "Authenticated can replace receipts"
on storage.objects for update
to authenticated
using (bucket_id = 'receipts')
with check (bucket_id = 'receipts');

create policy "Authenticated can delete receipts"
on storage.objects for delete
to authenticated
using (bucket_id = 'receipts');

alter table transactions add column if not exists receipt_url text;

-- Adding a new parameter changes the function's signature, so "create or replace"
-- does NOT replace the existing 7-argument version in place — it creates a second
-- overload instead, and any caller that omits the new argument then gets
-- "function record_transaction(...) is not unique". Drop the old signature first.
drop function if exists record_transaction(uuid, text, numeric, text, text, text, timestamptz);

create or replace function record_transaction(
  p_customer_id uuid,
  p_type text,
  p_amount numeric,
  p_note text default null,
  p_payment_method text default null,
  p_recorded_by text default null,
  p_date timestamptz default now(),
  p_receipt_url text default null
) returns transactions
language plpgsql
as $$
declare
  v_txn transactions;
  v_delta numeric;
begin
  insert into transactions (customer_id, type, amount, note, payment_method, recorded_by, performed_by, date, receipt_url)
  values (p_customer_id, p_type, p_amount, p_note, p_payment_method, p_recorded_by, auth.uid(), p_date, p_receipt_url)
  returning * into v_txn;

  v_delta := case when p_type = 'credit' then p_amount else -p_amount end;

  update customers
  set balance = balance + v_delta, updated_at = now()
  where id = p_customer_id;

  return v_txn;
end;
$$;
