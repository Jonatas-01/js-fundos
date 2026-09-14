-- Private expense tracking.
--
-- Unlike `deposit`, which both partners read, nothing here is shared: every
-- policy below is owner-only, including select. One person's expenses are
-- invisible to the other.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- A cost that repeats every month: aluguel, contas, débito automático.
-- It is a rule, not an expense — it generates real expense rows as each due
-- date arrives.
create table if not exists recurring_expense (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users(id) on delete cascade,
  name                 text        not null check (length(btrim(name)) > 0),
  amount_cents         bigint      not null check (amount_cents > 0),
  category             text        not null check (category in
                         ('moradia','mercado','transporte','saude','lazer','assinaturas','outros')),
  method               text        not null check (method in
                         ('dinheiro','pix','debito','credito','boleto')),
  day_of_month         smallint    not null check (day_of_month between 1 and 31),
  starts_on            date        not null default current_date,
  ends_on              date,
  -- Date of the last occurrence generated. Generation only ever moves forward
  -- from here, which is what makes deleting a single month stick instead of
  -- the row reappearing on the next visit.
  materialized_through date,
  active               boolean     not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create table if not exists expense (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null check (length(btrim(name)) > 0),
  amount_cents bigint      not null check (amount_cents > 0),
  category     text        not null check (category in
                 ('moradia','mercado','transporte','saude','lazer','assinaturas','outros')),
  method       text        not null check (method in
                 ('dinheiro','pix','debito','credito','boleto')),
  occurred_on  date        not null default current_date,
  -- Set when this row came from a template. `on delete set null` keeps the
  -- historical expense if the rule is later removed: it was still money spent.
  recurring_id uuid        references recurring_expense(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists expense_user_date_idx on expense (user_id, occurred_on);
create index if not exists recurring_user_idx on recurring_expense (user_id, active);

-- Belt and braces against double generation when two devices open the same
-- month at once: one template yields at most one row per calendar month.
create unique index if not exists expense_recurring_month_idx
  on expense (recurring_id, (date_trunc('month', occurred_on)))
  where recurring_id is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security — owner-only, every verb, both tables.
--
-- `using` decides which rows can be seen and changed; `with check` stops a row
-- being written under someone else's id.
-- ---------------------------------------------------------------------------

alter table expense           enable row level security;
alter table recurring_expense enable row level security;

drop policy if exists "own expenses"  on expense;
drop policy if exists "own recurring" on recurring_expense;

create policy "own expenses" on expense for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own recurring" on recurring_expense for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
