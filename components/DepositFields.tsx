"use client";

import { todayISO } from "@/lib/money";
import { inputClass, labelClass } from "./ui";

type Props = {
  currency: string;
  defaultAmount?: string;
  defaultDate?: string;
  defaultNote?: string;
  autoFocus?: boolean;
};

/**
 * The three fields shared by "add" and "edit". The date is always visible and
 * defaults to today — forgetting to log a transfer for a few days is normal,
 * so back-dating must not be buried behind a toggle.
 */
export default function DepositFields({
  currency,
  defaultAmount = "",
  defaultDate,
  defaultNote = "",
  autoFocus,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
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
          autoFocus={autoFocus}
          defaultValue={defaultAmount}
          placeholder="250,00"
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

      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="note">
          Observação <span className="lowercase">(opcional)</span>
        </label>
        <input
          id="note"
          name="note"
          type="text"
          maxLength={120}
          defaultValue={defaultNote}
          placeholder="Bônus, vendi a bike antiga…"
          className={`${inputClass} mt-1.5`}
        />
      </div>
    </div>
  );
}
