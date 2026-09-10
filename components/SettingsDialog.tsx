"use client";

import { useActionState } from "react";
import { updateFund, setDisplayName, type ActionState } from "@/app/actions";
import { centsToInputValue } from "@/lib/money";
import Dialog from "./Dialog";
import { CheckIcon } from "./icons";
import { btnGhost, btnPrimary, inputClass, labelClass } from "./ui";
import type { Fund } from "@/app/page";

const LOCALES = [
  ["pt-BR", "Português (Brasil)"],
  ["en-US", "English (US)"],
  ["en-GB", "English (UK)"],
  ["es-ES", "Español"],
  ["de-DE", "Deutsch"],
  ["fr-FR", "Français"],
];

const CURRENCIES = ["BRL", "USD", "EUR", "GBP", "CAD", "AUD", "CHF"];

export default function SettingsDialog({
  fund,
  displayName,
  onClose,
}: {
  fund: Fund;
  displayName: string;
  onClose: () => void;
}) {
  const [fundState, fundAction, fundPending] = useActionState<ActionState, FormData>(
    updateFund,
    {},
  );
  const [nameState, nameAction, namePending] = useActionState<ActionState, FormData>(
    setDisplayName,
    {},
  );

  return (
    <Dialog title="Configurações" onClose={onClose}>
      <form action={fundAction} className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="goal">
            Meta de economia
          </label>
          <input
            id="goal"
            name="goal"
            type="text"
            inputMode="decimal"
            required
            defaultValue={centsToInputValue(fund.goal_cents, fund.locale)}
            className={`${inputClass} mt-1.5 tabular-nums`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="currency">
              Moeda
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue={fund.currency}
              className={`${inputClass} mt-1.5`}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="locale">
              Formato
            </label>
            <select
              id="locale"
              name="locale"
              defaultValue={fund.locale}
              className={`${inputClass} mt-1.5`}
            >
              {LOCALES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <FormFeedback state={fundState} okText="Meta salva." />

        <button type="submit" disabled={fundPending} className={btnPrimary}>
          {fundPending ? "Salvando…" : "Salvar meta"}
        </button>
      </form>

      <hr className="my-6 border-0 border-t-[3px] border-line-soft" />

      <form action={nameAction} className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="display_name">
            Seu nome no histórico
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            maxLength={40}
            defaultValue={displayName}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <FormFeedback state={nameState} okText="Nome salvo." />

        <button type="submit" disabled={namePending} className={btnGhost}>
          {namePending ? "Salvando…" : "Salvar nome"}
        </button>
      </form>
    </Dialog>
  );
}

function FormFeedback({ state, okText }: { state: ActionState; okText: string }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="border-[3px] border-line bg-danger-soft px-3 py-2 text-sm font-bold text-danger"
      >
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p
        role="status"
        className="flex items-center gap-1.5 border-[3px] border-line bg-success-soft px-3 py-2 text-sm font-bold text-success"
      >
        <CheckIcon className="size-4" />
        {okText}
      </p>
    );
  }
  return null;
}
