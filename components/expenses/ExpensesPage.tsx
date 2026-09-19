"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { syncRecurring } from "@/app/despesas/actions";
import { formatCents } from "@/lib/money";
import {
  currentMonthKey,
  monthLabel,
  occurrenceDate,
  shiftMonth,
  todayDate,
  type MonthKey,
} from "@/lib/month";
import Masthead from "@/components/Masthead";
import LinkPending from "@/components/LinkPending";
import { SettingsIcon } from "@/components/icons";
import { btnGhost, btnQuiet } from "@/components/ui";
import MonthlyChart from "./MonthlyChart";
import CategoryBreakdown from "./CategoryBreakdown";
import ExpenseForm from "./ExpenseForm";
import ExpenseList, { type Upcoming } from "./ExpenseList";
import RecurringDialog from "./RecurringDialog";
import SettingsDialog from "@/components/SettingsDialog";
import type { Expense, RecurringExpense } from "@/app/despesas/page";
import type { Fund } from "@/app/page";

export default function ExpensesPage({
  fund,
  month,
  months,
  expenses,
  recurring,
  displayName,
}: {
  fund: Fund;
  month: MonthKey;
  months: MonthKey[];
  expenses: Expense[];
  recurring: RecurringExpense[];
  displayName: string;
}) {
  const router = useRouter();
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Generating occurrences is a write, and a server component must not mutate
  // while rendering — so it happens here, and only refreshes when something
  // was actually created.
  //
  // Once per *day* rather than once per mount. This page is kept open: on a
  // phone it is a tab that survives for weeks, on a desktop it sits in a
  // window overnight. Syncing only at mount meant a rule due on the 17th
  // stayed invisible until the user happened to reload.
  const syncedFor = useRef<string | null>(null);
  useEffect(() => {
    // The date, not a flag: waking up on a day already synced must do nothing,
    // and waking up three days later must catch all three up. dueOccurrences
    // handles the gap, so this only has to notice that there is one.
    function sync() {
      const today = todayDate();
      const previous = syncedFor.current;
      if (previous === today) return;
      syncedFor.current = today;

      syncRecurring().then(({ created }) => {
        // On a day that actually rolled over, refresh even if nothing was
        // generated: the month heading, the "previstos" list and the disabled
        // → arrow are all derived from today and went stale at midnight too.
        if (created > 0 || previous !== null) router.refresh();
      });
    }

    // Becoming visible is the only trigger: a phone asleep in a pocket throttles
    // background timers or never runs them at all, so a page nobody is looking
    // at is a page that does not need to be up to date yet. It catches up as it
    // is looked at.
    function onVisible() {
      if (document.visibilityState === "visible") sync();
    }

    sync();
    document.addEventListener("visibilitychange", onVisible);

    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.occurred_on.startsWith(month)),
    [expenses, month],
  );

  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount_cents, 0);

  const categoryTotals = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const e of monthExpenses) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount_cents);
    }
    return [...byCategory.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses]);

  // Rules whose day has not arrived yet. Derived for display only: never
  // stored, never counted, and gone from this list the moment the row is
  // generated for real.
  const upcoming = useMemo<Upcoming[]>(() => {
    if (month !== currentMonthKey()) return [];
    const today = todayDate();
    const generated = new Set(
      monthExpenses.map((e) => e.recurring_id).filter(Boolean) as string[],
    );

    return recurring
      .filter((r) => !generated.has(r.id))
      .map((r) => ({ ...r, occurred_on: occurrenceDate(month, r.day_of_month) }))
      .filter((r) => r.occurred_on > today)
      .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
  }, [month, monthExpenses, recurring]);

  const isCurrent = month === currentMonthKey();
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-14">
      <Masthead title="J&S Fundos ⩖" />

      <div className="space-y-6">
        <section className="card overflow-hidden" aria-labelledby="month-heading">
          <div className="flex items-stretch justify-between border-b-[3px] border-line bg-surface-soft">
            {/* A month change only swaps ?mes=, so the segment never unmounts
                and the route's loading.tsx may not re-fire — the dot is the
                feedback for that case. */}
            <Link
              href={`/despesas?mes=${previous}`}
              className={btnQuiet + " px-4"}
              aria-label="Mês anterior"
            >
              ←
              <LinkPending />
            </Link>
            <h2
              id="month-heading"
              className="self-center px-2 text-center text-sm font-extrabold uppercase tracking-wide"
            >
              {monthLabel(month, fund.locale)}
            </h2>
            {/* No navigating past the present: a future month can only ever be
                empty, since nothing is recorded before its date arrives. */}
            {isCurrent ? (
              <span className={btnQuiet + " px-4 opacity-30"} aria-hidden="true">
                →
              </span>
            ) : (
              <Link
                href={`/despesas?mes=${next}`}
                className={btnQuiet + " px-4"}
                aria-label="Próximo mês"
              >
                →
                <LinkPending />
              </Link>
            )}
          </div>

          <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0">
              <p className="eyebrow">Gasto no mês</p>
              <p className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                {formatCents(monthTotal, fund.currency, fund.locale)}
              </p>
            </div>

            {/* Settings lives here as well as on the Fundo page: currency and
                format apply to both, and having to cross to the other page to
                change them is a dead end. */}
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => setRecurringOpen(true)} className={btnGhost}>
                Fixas
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className={btnQuiet}
                aria-label="Abrir configurações"
              >
                <SettingsIcon className="size-4" />
              </button>
            </div>
          </div>
        </section>

        <MonthlyChart
          expenses={expenses}
          months={months}
          month={month}
          fund={fund}
        />
        <CategoryBreakdown
          totals={categoryTotals}
          expenses={monthExpenses}
          monthTotal={monthTotal}
          fund={fund}
        />
        <ExpenseForm currency={fund.currency} />
        <ExpenseList expenses={monthExpenses} upcoming={upcoming} fund={fund} />
      </div>

      {settingsOpen && (
        <SettingsDialog
          fund={fund}
          displayName={displayName}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {recurringOpen && (
        <RecurringDialog
          recurring={recurring}
          fund={fund}
          onClose={() => setRecurringOpen(false)}
        />
      )}
    </main>
  );
}
