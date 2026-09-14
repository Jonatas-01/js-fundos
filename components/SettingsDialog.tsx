"use client";

import { useActionState } from "react";
import { updateFund, setDisplayName, type ActionState } from "@/app/actions";
import Dialog from "./Dialog";
import FormFeedback from "./FormFeedback";
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

        <FormFeedback state={fundState} okText="Configurações salvas." />

        <button type="submit" disabled={fundPending} className={btnPrimary}>
          {fundPending ? "Salvando…" : "Salvar"}
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
