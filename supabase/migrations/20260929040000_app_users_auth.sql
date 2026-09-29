-- Staff accounts allowed to use the app. Supabase Auth (auth.users) handles
-- credentials/sessions; this table is the allowlist + profile (name, admin flag)
-- and the thing RLS checks against. Deleting a row here does not delete the
-- underlying auth.users row by itself — the admin-delete-user edge function
-- does both together via the Auth Admin API.
create table if not exists app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Hard cap enforced in the database, not just in app code, so it holds even if
-- called directly via the service role.
create or replace function enforce_max_app_users()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from app_users) >= 6 then
    raise exception 'Maximum of 6 staff users already exist.';
  end if;
  return new;
end;
$$;

create trigger app_users_max_six
before insert on app_users
for each row execute function enforce_max_app_users();

alter table app_users enable row level security;

-- Any logged-in staff member can see the full (small) roster — needed so the
-- app can list "everyone else" for notifications and show the admin panel.
-- No insert/update/delete policy exists on purpose: all writes go through the
-- admin-create-user / admin-delete-user edge functions (service role), which
-- verify the caller is an admin before touching this table.
create policy "Authenticated can read app_users" on app_users
  for select to authenticated using (true);

-- Now that real login exists, tighten customers/transactions to require a
-- logged-in session instead of allowing the bare publishable/anon key.
drop policy if exists "Allow anon full access to customers" on customers;
drop policy if exists "Allow anon full access to transactions" on transactions;

create policy "Authenticated full access to customers" on customers
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access to transactions" on transactions
  for all to authenticated using (true) with check (true);
