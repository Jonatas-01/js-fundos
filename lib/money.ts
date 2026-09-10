/**
 * The single place where money crosses between text and storage.
 *
 * Storage is always integer cents. Nothing outside this file should call
 * toFixed(2), divide by 100, or do arithmetic on a float amount.
 */

function decimalSeparator(locale: string): string {
  const part = new Intl.NumberFormat(locale)
    .formatToParts(1.1)
    .find((p) => p.type === "decimal");
  return part?.value ?? ".";
}

/**
 * Parse user input into cents, tolerating both "1.234,56" and "1,234.56".
 *
 * The rule: whichever of "." or "," appears last, if it is followed by one or
 * two digits, is the decimal separator. Everything else is a group separator.
 * That reads either locale's convention correctly without being told which one
 * is in use, so this deliberately takes no locale argument.
 *
 * Returns null for anything that isn't a positive amount.
 */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  const lastSep = Math.max(lastDot, lastComma);

  let whole: string;
  let frac: string;

  const trailing = cleaned.length - lastSep - 1;
  if (lastSep !== -1 && (trailing === 1 || trailing === 2)) {
    whole = cleaned.slice(0, lastSep);
    frac = cleaned.slice(lastSep + 1);
  } else {
    whole = cleaned;
    frac = "";
  }

  whole = whole.replace(/[.,]/g, "");
  if (!whole && !frac) return null;
  if (/[.,]/.test(frac)) return null;

  const cents = Number(whole || "0") * 100 + Number(frac.padEnd(2, "0") || "0");
  if (!Number.isFinite(cents) || cents <= 0) return null;
  return Math.round(cents);
}

/** Cents -> "R$ 1.234,56" (or whatever the fund's currency and locale say). */
export function formatCents(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** Cents -> a bare editable string for prefilling the edit form. */
export function centsToInputValue(cents: number, locale: string): string {
  const sep = decimalSeparator(locale);
  const whole = Math.floor(cents / 100);
  const frac = String(cents % 100).padStart(2, "0");
  return `${whole}${sep}${frac}`;
}

/** "2026-09-10" -> "10/09/2026" in the fund's locale. */
export function formatDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(y, m - 1, d),
  );
}

/** Today as "YYYY-MM-DD" in the *browser's* timezone, for the date input. */
export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
