"use client";

import { useActionState, useEffect } from "react";
import { updateExpense, type ActionState } from "@/app/despesas/actions";
import { centsToInputValue } from "@/lib/money";
import Dialog from "@/components/Dialog";
import FormFeedback from "@/components/FormFeedback";
import { btnPrimary } from "@/components/ui";
import ExpenseFields from "./ExpenseFields";
import type { Expense } from "@/app/despesas/page";

export default function EditExpenseDialog({
  expense,
  currency,
  locale,
  onClose,
}: {
  expense: Expense;
  currency: string;
  locale: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateExpense,
    {},
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  return (
    <Dialog title="Editar despesa" onClose={onClose}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={expense.id} />

        <ExpenseFields
          currency={currency}
          autoFocus
          defaultName={expense.name}
          defaultAmount={centsToInputValue(expense.amount_cents, locale)}
          defaultDate={expense.occurred_on}
          defaultCategory={expense.category}
          defaultMethod={expense.method}
        />

        {/* Only this month changes. The rule that generated it is untouched,
            so next month still comes from the template. */}
        {expense.recurring_id && (
          <p className="border-[3px] border-line bg-surface-soft px-3 py-2 text-sm font-semibold text-muted">
            Esta despesa veio de uma despesa fixa. A alteração vale só para este
            mês.
          </p>
        )}

        <FormFeedback state={state} okText="Despesa salva." />

        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>
    </Dialog>
  );
}
