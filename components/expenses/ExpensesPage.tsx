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
import { btnGhost, btnQuiet } from "@/components/ui";
import MonthlyChart from "./MonthlyChart";
import CategoryBreakdown from "./CategoryBreakdown";
import ExpenseForm from "./ExpenseForm";
import ExpenseList, { type Upcoming } from "./ExpenseList";
import RecurringDialog from "./RecurringDialog";
import type { Expense, RecurringExpense } from "@/app/despesas/page";
import type { Fund } from "@/app/page";

export default function ExpensesPage({
  fund,
  month,
  months,
  expenses,
  recurring,
}: {
  fund: Fund;
  month: MonthKey;
  months: MonthKey[];
  expenses: Expense[];
  recurring: RecurringExpense[];
}) {
  const router = useRouter();
  const [recurringOpen, setRecurringOpen] = useState(false);

  // Generating occurrences is a write, and a server component must not mutate
  // while rendering — so it happens here, once per mount, and only refreshes
  // when something was actually created.
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    syncRecurring().then(({ created }) => {
      if (created > 0) router.refresh();
    });
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
            <Link
              href={`/despesas?mes=${previous}`}
              className={btnQuiet + " px-4"}
              aria-label="Mês anterior"
            >
              ←
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

            <button
              onClick={() => setRecurringOpen(true)}
              className={btnGhost + " shrink-0"}
            >
              Fixas
            </button>
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
          monthTotal={monthTotal}
          fund={fund}
        />
        <ExpenseForm currency={fund.currency} />
        <ExpenseList expenses={monthExpenses} upcoming={upcoming} fund={fund} />
      </div>

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
