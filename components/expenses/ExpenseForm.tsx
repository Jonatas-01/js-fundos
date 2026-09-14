"use client";

import { useActionState, useEffect, useRef } from "react";
import { addExpense, type ActionState } from "@/app/despesas/actions";
import FormFeedback from "@/components/FormFeedback";
import { btnPrimary } from "@/components/ui";
import ExpenseFields from "./ExpenseFields";

export default function ExpenseForm({ currency }: { currency: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addExpense, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="card overflow-hidden" aria-labelledby="new-expense-heading">
      <div className="border-b-[3px] border-line bg-surface-soft px-5 py-4">
        <h2 id="new-expense-heading" className="eyebrow">
          Nova despesa
        </h2>
      </div>

      <form ref={formRef} action={action} className="space-y-4 p-5">
        <ExpenseFields currency={currency} />

        <FormFeedback state={state} okText="Despesa adicionada." />

        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Salvando…" : "Adicionar despesa"}
        </button>
      </form>
    </section>
  );
}
