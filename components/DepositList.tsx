"use client";

import { useState } from "react";
import { deleteDeposit } from "@/app/actions";
import { formatCents, formatDate } from "@/lib/money";
import EditDepositDialog from "./EditDepositDialog";
import { PencilIcon, TrashIcon } from "./icons";
import { btnQuiet } from "./ui";
import type { Deposit, Fund } from "@/app/page";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function DepositList({
  deposits,
  fund,
  userId,
}: {
  deposits: Deposit[];
  fund: Fund;
  userId: string;
}) {
  const [editing, setEditing] = useState<Deposit | null>(null);

  // Newest first for reading; the chart uses the chronological order instead.
  const rows = [...deposits].reverse();

  return (
    <section className="card overflow-hidden" aria-labelledby="history-heading">
      <div className="flex items-baseline justify-between gap-3 border-b-[3px] border-line bg-surface-soft px-5 py-4">
        <h2 id="history-heading" className="eyebrow">
          Histórico
        </h2>
        <span className="text-xs font-bold text-foreground tabular-nums">
          {rows.length} {rows.length === 1 ? "depósito" : "depósitos"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-base font-bold uppercase tracking-wide">Nada por aqui ainda</p>
          <p className="mt-1 text-sm text-muted">
            Adicione o primeiro depósito acima e o gráfico aparece.
          </p>
        </div>
      ) : (
        <ul className="divide-y-[3px] divide-line">
          {rows.map((d) => {
            const mine = d.user_id === userId;
            const amount = formatCents(d.amount_cents, fund.currency, fund.locale);
            const when = formatDate(d.occurred_on, fund.locale);

            return (
              <li
                key={d.id}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors duration-100 hover:bg-surface-hover sm:px-4"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center border-[3px] border-line bg-goal-soft text-[11px] font-extrabold"
                >
                  {initials(d.depositor)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm">
                    <span className="truncate font-bold">{d.depositor}</span>
                    {mine && (
                      <span className="eyebrow shrink-0 border-2 border-line bg-accent px-1.5 py-px">
                        Você
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {when}
                    {d.note && ` · ${d.note}`}
                  </p>
                </div>

                <span className="shrink-0 font-display text-base font-bold tabular-nums">
                  {amount}
                </span>

                {/* Own rows only. RLS is the real enforcement; this is courtesy.
                    Kept always visible rather than revealed on hover — there is
                    no hover on a phone. */}
                {mine && (
                  <span className="flex shrink-0 items-center">
                    <button
                      onClick={() => setEditing(d)}
                      aria-label={`Editar depósito de ${amount} em ${when}`}
                      className={btnQuiet}
                    >
                      <PencilIcon className="size-4" />
                    </button>
                    <form
                      action={deleteDeposit}
                      onSubmit={(e) => {
                        if (!confirm("Excluir este depósito?")) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        type="submit"
                        aria-label={`Excluir depósito de ${amount} em ${when}`}
                        className={`${btnQuiet} hover:bg-danger-soft hover:text-danger`}
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </form>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <EditDepositDialog
          deposit={editing}
          currency={fund.currency}
          locale={fund.locale}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
