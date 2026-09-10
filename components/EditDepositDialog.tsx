"use client";

import { useActionState, useEffect } from "react";
import { updateDeposit, type ActionState } from "@/app/actions";
import { centsToInputValue } from "@/lib/money";
import DepositFields from "./DepositFields";
import Dialog from "./Dialog";
import { btnGhost, btnPrimary } from "./ui";
import type { Deposit } from "@/app/page";

type Props = {
  deposit: Deposit;
  currency: string;
  locale: string;
  onClose: () => void;
};

export default function EditDepositDialog({
  deposit,
  currency,
  locale,
  onClose,
}: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateDeposit,
    {},
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  return (
    <Dialog title="Editar depósito" onClose={onClose}>
      <form action={action}>
        <input type="hidden" name="id" value={deposit.id} />

        <DepositFields
          currency={currency}
          autoFocus
          defaultAmount={centsToInputValue(deposit.amount_cents, locale)}
          defaultDate={deposit.occurred_on}
          defaultNote={deposit.note ?? ""}
        />

        {state.error && (
          <p
            role="alert"
            className="mt-4 border-[3px] border-line bg-danger-soft px-3 py-2 text-sm font-bold text-danger"
          >
            {state.error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "Salvando…" : "Salvar alterações"}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
        </div>
      </form>
    </Dialog>
  );
}
