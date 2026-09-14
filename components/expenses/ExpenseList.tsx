"use client";

import { useState } from "react";
import { deleteExpense } from "@/app/despesas/actions";
import { formatCents, formatDate } from "@/lib/money";
import { CATEGORY_COLOR, categoryLabel, methodLabel } from "@/lib/expenses";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { btnQuiet } from "@/components/ui";
import EditExpenseDialog from "./EditExpenseDialog";
import type { Expense } from "@/app/despesas/page";
import type { Fund } from "@/app/page";

export type Upcoming = {
  id: string;
  name: string;
  amount_cents: number;
  category: string;
  method: string;
  occurred_on: string;
};

export default function ExpenseList({
  expenses,
  upcoming,
  fund,
}: {
  expenses: Expense[];
  upcoming: Upcoming[];
  fund: Fund;
}) {
  const [editing, setEditing] = useState<Expense | null>(null);

  const money = (cents: number) => formatCents(cents, fund.currency, fund.locale);

  // Newest first, then grouped under one heading per day so a heavy shopping
  // day reads as one trip rather than as unrelated rows.
  const days = groupByDate(expenses);

  return (
    <section className="card overflow-hidden" aria-labelledby="expenses-heading">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-[3px] border-line bg-surface-soft px-5 py-4">
        <h2 id="expenses-heading" className="eyebrow">
          Despesas do mês
        </h2>
        <p className="text-xs font-bold text-muted">
          {expenses.length} {expenses.length === 1 ? "lançamento" : "lançamentos"}
        </p>
      </div>

      {days.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm font-semibold text-muted">
          Nenhuma despesa neste mês ainda.
        </p>
      ) : (
        days.map(([date, rows]) => (
          <div key={date}>
            <h3 className="border-b-[3px] border-line bg-surface-soft/60 px-5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
              {formatDate(date, fund.locale)}
            </h3>
            <ul className="divide-y-[3px] divide-line">
              {rows.map((e) => (
                <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 size-3 shrink-0 border-2 border-line"
                    style={{ background: CATEGORY_COLOR[e.category] ?? "var(--muted)" }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{e.name}</p>
                    <p className="truncate text-xs font-semibold text-muted">
                      {categoryLabel(e.category)} · {methodLabel(e.method)}
                      {e.recurring_id ? " · fixa" : ""}
                    </p>
                  </div>

                  {/* Amount over the controls: side by side, a phone has to
                      truncate one of them, and it is always the name. */}
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="font-mono text-sm font-bold tabular-nums">
                      {money(e.amount_cents)}
                    </span>
                    <span className="flex">
                      <button
                        onClick={() => setEditing(e)}
                        aria-label={`Editar ${e.name}`}
                        className={btnQuiet}
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <form
                        action={deleteExpense}
                        onSubmit={(event) => {
                          if (!confirm(`Excluir "${e.name}"?`)) event.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          aria-label={`Excluir ${e.name}`}
                          className={btnQuiet}
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </form>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {/* Not yet due, so deliberately outside the list and outside the total.
          Shown anyway because knowing what is still coming is half the reason
          to look at the month at all. */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="border-y-[3px] border-line bg-surface-soft px-5 py-2 text-[11px] font-extrabold uppercase tracking-wide text-muted">
            Previstos — ainda não contam no total
          </h3>
          <ul className="divide-y-[3px] divide-line">
            {upcoming.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 px-4 py-3 text-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{u.name}</p>
                  <p className="truncate text-xs font-semibold">
                    {formatDate(u.occurred_on, fund.locale)} ·{" "}
                    {categoryLabel(u.category)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold tabular-nums">
                  {money(u.amount_cents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && (
        <EditExpenseDialog
          expense={editing}
          currency={fund.currency}
          locale={fund.locale}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function groupByDate(expenses: Expense[]): [string, Expense[]][] {
  const byDate = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = byDate.get(e.occurred_on);
    if (list) list.push(e);
    else byDate.set(e.occurred_on, [e]);
  }
  return [...byDate.entries()].sort(([a], [b]) => b.localeCompare(a));
}
