/**
 * Month arithmetic on plain "YYYY-MM" keys and "YYYY-MM-DD" dates.
 *
 * Everything here stays in local calendar terms and never builds a Date from a
 * bare ISO string — `new Date("2026-09-01")` parses as UTC midnight, which is
 * the previous day in Brazil and would silently shift a month boundary.
 */

export type MonthKey = string; // "YYYY-MM"

const pad = (n: number) => String(n).padStart(2, "0");

export function monthKeyOf(date: Date): MonthKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(new Date());
}

export function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function parts(key: MonthKey): [number, number] {
  const [y, m] = key.split("-").map(Number);
  return [y, m];
}

/** Days in the month, handling leap years. Day 0 of the next month. */
export function daysInMonth(key: MonthKey): number {
  const [y, m] = parts(key);
  return new Date(y, m, 0).getDate();
}

export function monthStart(key: MonthKey): string {
  return `${key}-01`;
}

export function monthEnd(key: MonthKey): string {
  return `${key}-${pad(daysInMonth(key))}`;
}

/** `delta` may be negative. Rolls the year over correctly. */
export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const [y, m] = parts(key);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

/** The `count` months ending at `key`, oldest first. */
export function monthWindow(key: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(key, i - (count - 1)));
}

export function monthLabel(key: MonthKey, locale: string): string {
  const [y, m] = parts(key);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1),
  );
}

export function monthShortLabel(key: MonthKey, locale: string): string {
  const [y, m] = parts(key);
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(y, m - 1, 1));
}

/**
 * The date a "day N every month" rule falls on in a given month, clamped to the
 * last day. Without the clamp a rule for day 31 would skip February entirely
 * rather than landing on the 28th.
 */
export function occurrenceDate(key: MonthKey, dayOfMonth: number): string {
  return `${key}-${pad(Math.min(dayOfMonth, daysInMonth(key)))}`;
}

/** Today as "YYYY-MM-DD" in local time. */
export function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
