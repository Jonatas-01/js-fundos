"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addRecurring,
  deactivateRecurring,
  updateRecurring,
  type ActionState,
} from "@/app/despesas/actions";
import { centsToInputValue, formatCents } from "@/lib/money";
import { CATEGORIES, METHODS, categoryLabel } from "@/lib/expenses";
import Dialog from "@/components/Dialog";
import FormFeedback from "@/components/FormFeedback";
import { TrashIcon } from "@/components/icons";
import { btnGhost, btnPrimary, btnQuiet, inputClass, labelClass } from "@/components/ui";
import type { RecurringExpense } from "@/app/despesas/page";
import type { Fund } from "@/app/page";

/**
 * Managing the rules, not the expenses they produce. Editing a rule changes
 * what future months generate; months already recorded keep what was paid.
 */
export default function RecurringDialog({
  recurring,
  fund,
  onClose,
}: {
  recurring: RecurringExpense[];
  fund: Fund;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<RecurringExpense | null>(null);

  return (
    <Dialog title="Despesas fixas" onClose={onClose}>
      {editing ? (
        <RecurringForm
          key={editing.id}
          fund={fund}
          existing={editing}
          onDone={() => setEditing(null)}
        />
      ) : (
        <div className="space-y-5">
          {recurring.length === 0 ? (
            <p className="text-sm font-semibold text-muted">
              Nenhuma despesa fixa ainda. Aluguel, contas e débitos automáticos
              entram aqui uma vez e aparecem todo mês.
            </p>
          ) : (
            <ul className="divide-y-[3px] divide-line border-[3px] border-line">
              {recurring.map((r) => (
                // Name and amount on top, controls beneath: four things across
                // one row squeezes the description down to "Todo d…" on a phone.
                <li key={r.id} className="px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-bold">{r.name}</p>
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums">
                      {formatCents(r.amount_cents, fund.currency, fund.locale)}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs font-semibold text-muted">
                      Todo dia {r.day_of_month} · {categoryLabel(r.category)}
                    </p>

                    <span className="flex shrink-0">
                      <button
                        onClick={() => setEditing(r)}
                        className={btnQuiet + " text-xs"}
                        aria-label={`Editar ${r.name}`}
                      >
                        Editar
                      </button>
                      <form
                        action={deactivateRecurring}
                        onSubmit={(event) => {
                          if (
                            !confirm(
                              `Parar "${r.name}"? Os meses já lançados continuam no histórico.`,
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className={btnQuiet}
                          aria-label={`Parar ${r.name}`}
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </form>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <RecurringForm fund={fund} />
        </div>
      )}
    </Dialog>
  );
}

function RecurringForm({
  fund,
  existing,
  onDone,
}: {
  fund: Fund;
  existing?: RecurringExpense;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    existing ? updateRecurring : addRecurring,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    if (onDone) onDone();
    else formRef.current?.reset();
  }, [state, onDone]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <h3 className="eyebrow">{existing ? "Editar fixa" : "Nova despesa fixa"}</h3>

      {existing && <input type="hidden" name="id" value={existing.id} />}

      <div>
        <label className={labelClass} htmlFor="name">
          Descrição
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={existing?.name ?? ""}
          placeholder="Aluguel, internet…"
          className={`${inputClass} mt-1.5`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="amount">
            Valor ({fund.currency})
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            required
            defaultValue={
              existing ? centsToInputValue(existing.amount_cents, fund.locale) : ""
            }
            placeholder="1.500,00"
            className={`${inputClass} mt-1.5 tabular-nums`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="day_of_month">
            Dia do mês
          </label>
          <input
            id="day_of_month"
            name="day_of_month"
            type="number"
            min={1}
            max={31}
            required
            defaultValue={existing?.day_of_month ?? 5}
            className={`${inputClass} mt-1.5 tabular-nums`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="category">
            Categoria
          </label>
          <select
            id="category"
            name="category"
            defaultValue={existing?.category ?? "moradia"}
            className={`${inputClass} mt-1.5`}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="method">
            Pagamento
          </label>
          <select
            id="method"
            name="method"
            defaultValue={existing?.method ?? "debito"}
            className={`${inputClass} mt-1.5`}
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs font-semibold text-muted">
        Dia 31 cai no último dia em meses mais curtos. Alterar aqui vale para os
        próximos meses; os já lançados não mudam.
      </p>

      <FormFeedback state={state} okText="Despesa fixa salva." />

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Salvando…" : existing ? "Salvar" : "Adicionar fixa"}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className={btnGhost}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
