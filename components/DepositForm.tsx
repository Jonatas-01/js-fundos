"use client";

import { useActionState, useEffect, useRef } from "react";
import { addDeposit, type ActionState } from "@/app/actions";
import DepositFields from "./DepositFields";
import { btnPrimary } from "./ui";

export default function DepositForm({ currency }: { currency: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    addDeposit,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="card overflow-hidden"
      aria-labelledby="add-deposit-heading"
    >
      <h2
        id="add-deposit-heading"
        className="eyebrow border-b-[3px] border-line bg-surface-soft px-5 py-4"
      >
        Novo depósito
      </h2>

      <div className="p-5">
        <DepositFields currency={currency} />

        {/* Errors sit directly above the submit button, inside the form, so
            the message is never scrolled away from the control that made it. */}
        {state.error && (
          <p
            role="alert"
            className="mt-4 border-[3px] border-line bg-danger-soft px-3 py-2 text-sm font-bold text-danger"
          >
            {state.error}
          </p>
        )}

        <div className="mt-5">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "Salvando…" : "Adicionar depósito"}
          </button>
        </div>
      </div>
    </form>
  );
}
