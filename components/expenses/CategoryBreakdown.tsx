"use client";

import { useState } from "react";
import { formatCents, formatDate } from "@/lib/money";
import { CATEGORY_COLOR, categoryLabel, methodLabel } from "@/lib/expenses";
import { ChevronDownIcon } from "@/components/icons";
import type { Expense } from "@/app/despesas/page";
import type { Fund } from "@/app/page";

export type CategoryTotal = { category: string; total: number };

/**
 * Where the month went, biggest first. A ranked list rather than a pie: the
 * question is "what is taking the money", and rank plus a proportional bar
 * answers it faster than comparing wedge angles.
 *
 * Each row opens to show the expenses behind its number, because the next
 * question after "Mercado took 40%" is always "on what". One row at a time:
 * the point of the ranking is comparing rows, and several open panels push the
 * ones below off the screen.
 */
export default function CategoryBreakdown({
  totals,
  expenses,
  monthTotal,
  fund,
}: {
  totals: CategoryTotal[];
  expenses: Expense[];
  monthTotal: number;
  fund: Fund;
}) {
  const [opened, setOpened] = useState<string | null>(null);

  if (totals.length === 0) return null;

  // Derived rather than cleared in an effect: changing month replaces `totals`,
  // and a category the new month has nothing in would otherwise stay open over
  // an empty panel.
  const open = opened && totals.some((t) => t.category === opened) ? opened : null;

  // Shares are of the month's own total, so they always sum to 100%.
  const share = (cents: number) => (monthTotal > 0 ? (cents / monthTotal) * 100 : 0);

  return (
    <section className="card overflow-hidden" aria-labelledby="categories-heading">
      <div className="border-b-[3px] border-line bg-surface-soft px-5 py-4">
        <h2 id="categories-heading" className="eyebrow">
          Por categoria
        </h2>
      </div>

      <ul className="divide-y-[3px] divide-line">
        {totals.map((t) => {
          const isOpen = open === t.category;
          const rows = expenses.filter((e) => e.category === t.category);

          return (
            <li key={t.category}>
              <button
                type="button"
                onClick={() => setOpened(isOpen ? null : t.category)}
                aria-expanded={isOpen}
                aria-controls={`category-panel-${t.category}`}
                className="block w-full px-5 py-3 text-left transition-colors duration-100 hover:bg-surface-soft"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <ChevronDownIcon
                      className={`size-4 shrink-0 self-center text-muted transition-transform duration-150 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                    <span className="truncate text-sm font-bold">
                      {categoryLabel(t.category)}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm font-bold tabular-nums">
                    {formatCents(t.total, fund.currency, fund.locale)}
                    <span className="ml-2 text-xs font-semibold text-muted">
                      {share(t.total).toFixed(0)}%
                    </span>
                  </span>
                </div>

                <div className="mt-2 h-3 border-[3px] border-line bg-surface">
                  <div
                    className="h-full"
                    style={{
                      width: `${share(t.total)}%`,
                      background: CATEGORY_COLOR[t.category] ?? "var(--muted)",
                    }}
                  />
                </div>
              </button>

              {/* Read-only on purpose: editing and deleting stay in "Despesas
                  do mês", so there is one place a row can be changed. */}
              <div id={`category-panel-${t.category}`} hidden={!isOpen}>
                <ul className="divide-y-[3px] divide-line border-t-[3px] border-line bg-surface-soft/60">
                  {rows.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-start justify-between gap-3 py-2 pl-10 pr-5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">
                          {e.name}
                        </span>
                        <span className="block truncate text-xs font-semibold text-muted">
                          {formatDate(e.occurred_on, fund.locale)} ·{" "}
                          {methodLabel(e.method)}
                          {e.recurring_id ? " · fixa" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-sm font-bold tabular-nums">
                        {formatCents(e.amount_cents, fund.currency, fund.locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
