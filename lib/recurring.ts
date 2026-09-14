import { occurrenceDate, shiftMonth } from "./month";

export type RecurringRule = {
  day_of_month: number;
  starts_on: string;
  ends_on: string | null;
  materialized_through: string | null;
};

/**
 * Which dates a monthly rule owes, given what has already been generated.
 *
 * Kept pure and separate from the database call because this is where the
 * awkward cases live — month lengths, catch-up after a gap, a rule that has
 * ended — and they are worth testing without a Supabase round trip.
 *
 * Two properties matter most:
 *
 * - Nothing after `today` is ever returned. That is what makes a month's total
 *   mean "spent so far" rather than "committed".
 * - Nothing at or before `materialized_through` is ever returned, so a month
 *   the user deleted stays deleted instead of reappearing on the next visit.
 */
export function dueOccurrences(rule: RecurringRule, today: string): string[] {
  const startMonth = rule.materialized_through
    ? shiftMonth(rule.materialized_through.slice(0, 7), 1)
    : rule.starts_on.slice(0, 7);

  const thisMonth = today.slice(0, 7);
  const dates: string[] = [];

  let cursor = startMonth;
  // The bound is a safety stop, not a limit anyone should reach: 240 months is
  // twenty years of catch-up in one visit.
  for (let i = 0; i < 240 && cursor <= thisMonth; i++) {
    const date = occurrenceDate(cursor, rule.day_of_month);

    if (date > today) break;

    const started = date >= rule.starts_on;
    const notEnded = !rule.ends_on || date <= rule.ends_on;
    const notAlreadyDone =
      !rule.materialized_through || date > rule.materialized_through;

    if (started && notEnded && notAlreadyDone) dates.push(date);

    cursor = shiftMonth(cursor, 1);
  }

  return dates;
}
