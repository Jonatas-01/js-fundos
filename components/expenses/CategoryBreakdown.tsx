"use client";

import { formatCents } from "@/lib/money";
import { CATEGORY_COLOR, categoryLabel } from "@/lib/expenses";
import type { Fund } from "@/app/page";

export type CategoryTotal = { category: string; total: number };

/**
 * Where the month went, biggest first. A ranked list rather than a pie: the
 * question is "what is taking the money", and rank plus a proportional bar
 * answers it faster than comparing wedge angles.
 */
export default function CategoryBreakdown({
  totals,
  monthTotal,
  fund,
}: {
  totals: CategoryTotal[];
  monthTotal: number;
  fund: Fund;
}) {
  if (totals.length === 0) return null;

  // Shares are of the month's own total, so they always sum to 100%.
  const share = (cents: number) => (monthTotal > 0 ? (cents / monthTotal) * 100 : 0);

  return (
    <section className="card overflow-hidden" aria-labelledby="categories-heading">
      <div className="border-b-[3px] border-line bg-surface-soft px-5 py-4">
        <h2 id="categories-heading" className="eyebrow">
          Por categoria
        </h2>
      </div>

      <dl className="divide-y-[3px] divide-line">
        {totals.map((t) => (
          <div key={t.category} className="px-5 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="truncate text-sm font-bold">
                {categoryLabel(t.category)}
              </dt>
              <dd className="shrink-0 font-mono text-sm font-bold tabular-nums">
                {formatCents(t.total, fund.currency, fund.locale)}
                <span className="ml-2 text-xs font-semibold text-muted">
                  {share(t.total).toFixed(0)}%
                </span>
              </dd>
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
          </div>
        ))}
      </dl>
    </section>
  );
}
