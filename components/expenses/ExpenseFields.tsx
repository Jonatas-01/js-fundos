"use client";

import { todayISO } from "@/lib/money";
import { CATEGORIES, METHODS } from "@/lib/expenses";
import { inputClass, labelClass } from "@/components/ui";

type Props = {
  currency: string;
  defaultName?: string;
  defaultAmount?: string;
  defaultDate?: string;
  defaultCategory?: string;
  defaultMethod?: string;
  autoFocus?: boolean;
};

/**
 * The five fields shared by adding and editing an expense.
 *
 * Name and amount lead because they are what you actually remember about a
 * purchase; category and method sit together on one row since both are single
 * taps from a fixed list.
 */
export default function ExpenseFields({
  currency,
  defaultName = "",
  defaultAmount = "",
  defaultDate,
  defaultCategory = "mercado",
  defaultMethod = "pix",
  autoFocus,
}: Props) {
  return (
    <div className="space-y-3">
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
          autoFocus={autoFocus}
          defaultValue={defaultName}
          placeholder="Mercado do mês, gasolina…"
          className={`${inputClass} mt-1.5`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="amount">
            Valor ({currency})
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            required
            defaultValue={defaultAmount}
            placeholder="120,00"
            className={`${inputClass} mt-1.5 tabular-nums`}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="occurred_on">
            Data
          </label>
          <input
            id="occurred_on"
            name="occurred_on"
            type="date"
            required
            max={todayISO()}
            defaultValue={defaultDate ?? todayISO()}
            className={`${inputClass} mt-1.5`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="category">
            Categoria
          </label>
          <select
            id="category"
            name="category"
            defaultValue={defaultCategory}
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
            defaultValue={defaultMethod}
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
    </div>
  );
}
