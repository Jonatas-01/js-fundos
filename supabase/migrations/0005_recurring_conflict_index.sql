-- Makes the recurring-occurrence unique index usable as an ON CONFLICT target.
--
-- 0003 created it as a partial index (`where recurring_id is not null`).
-- Postgres will only infer a *partial* unique index when the statement repeats
-- the predicate in its own `ON CONFLICT ... WHERE` clause, and PostgREST emits
-- nothing more than the column list that `onConflict` names. So the upsert in
-- syncRecurring could never match an arbiter index and failed every single time
-- with 42P10 — "there is no unique or exclusion constraint matching the ON
-- CONFLICT specification" — which the action then swallowed. The result was
-- that no recurring expense was ever generated, silently.
--
-- Dropping the predicate loses nothing. Under the default NULLS DISTINCT rule
-- every manually entered expense (recurring_id is null) still counts as unique,
-- exactly as it did while the index was partial.

-- Nothing should have got through while the upsert was broken, but a unique
-- index will not build over duplicates, so clear any first: keep the oldest row
-- of each (recurring_id, occurred_on) pair and drop the rest.
delete from expense e
using expense keeper
where e.recurring_id is not null
  and e.recurring_id = keeper.recurring_id
  and e.occurred_on  = keeper.occurred_on
  and (keeper.created_at, keeper.id) < (e.created_at, e.id);

drop index if exists expense_recurring_date_idx;

create unique index if not exists expense_recurring_date_idx
  on expense (recurring_id, occurred_on);
