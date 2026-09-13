-- The fund no longer has a savings target: the app stopped reading, writing and
-- displaying this column before this migration shipped, so it can be run at any
-- time — including well after the deploy — without the app noticing.
--
-- Deposits are untouched; the target was only ever a property of the fund row.

alter table fund drop column if exists goal_cents;
