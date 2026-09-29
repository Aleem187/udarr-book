-- Staff recipients: internal people who get emailed + logged on every successful card payment.
-- They never log into the app; add more later with a plain INSERT, no code changes needed.
create table if not exists staff_recipients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references staff_recipients(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  related_payment_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_id_idx on notifications(recipient_id);

-- RLS on with no policies: only the service-role key (used by the stripe-webhook edge function)
-- can read/write these tables. The frontend's publishable/anon key gets nothing.
alter table staff_recipients enable row level security;
alter table notifications enable row level security;

insert into staff_recipients (name, email)
values ('Wajid', 'aleemyaseen39@gmail.com')
on conflict (email) do nothing;
