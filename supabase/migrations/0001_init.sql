-- J&S Fundos — initial schema
-- Money is stored as integer cents everywhere. Never floats.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Exactly one row for v1: the shared pot.
create table if not exists fund (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null default 'J&S Fundos',
  goal_cents bigint      not null default 500000 check (goal_cents > 0),
  currency   text        not null default 'BRL',
  locale     text        not null default 'pt-BR',
  created_at timestamptz not null default now()
);

create table if not exists deposit (
  id           uuid        primary key default gen_random_uuid(),
  fund_id      uuid        not null references fund(id) on delete cascade,
  user_id      uuid        not null references auth.users(id),
  amount_cents bigint      not null check (amount_cents > 0),
  occurred_on  date        not null default current_date,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists deposit_fund_date_idx on deposit (fund_id, occurred_on);

-- auth.users only carries an email; this is the name shown in the history.
create table if not exists profile (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Both partners see everything; each may only change their own deposits.
-- ---------------------------------------------------------------------------

alter table fund    enable row level security;
alter table deposit enable row level security;
alter table profile enable row level security;

drop policy if exists "read fund"     on fund;
drop policy if exists "update fund"   on fund;
drop policy if exists "read deposits" on deposit;
drop policy if exists "insert own"    on deposit;
drop policy if exists "update own"    on deposit;
drop policy if exists "delete own"    on deposit;
drop policy if exists "read profiles" on profile;
drop policy if exists "upsert own"    on profile;

create policy "read fund"   on fund for select to authenticated using (true);
create policy "update fund" on fund for update to authenticated
  using (true) with check (true);

create policy "read deposits" on deposit for select to authenticated using (true);
create policy "insert own"    on deposit for insert to authenticated
  with check (user_id = auth.uid());
create policy "update own"    on deposit for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own"    on deposit for delete to authenticated
  using (user_id = auth.uid());

create policy "read profiles" on profile for select to authenticated using (true);
create policy "upsert own"    on profile for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed the single fund row
-- ---------------------------------------------------------------------------

insert into fund (name, goal_cents, currency, locale)
select 'J&S Fundos', 500000, 'BRL', 'pt-BR'
where not exists (select 1 from fund);
