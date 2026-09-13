"use client";

import { formatCents } from "@/lib/money";
import { SettingsIcon } from "./icons";
import { btnQuiet } from "./ui";
import type { Fund } from "@/app/page";

export default function BalanceHeader({
  fund,
  totalCents,
  onOpenSettings,
}: {
  fund: Fund;
  totalCents: number;
  onOpenSettings: () => void;
}) {
  return (
    <section className="card overflow-hidden" aria-labelledby="balance-heading">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 id="balance-heading" className="eyebrow">
            Guardado até agora
          </h2>
          {/* The one figure the page exists to show, so it is the loudest
              thing on it — display face, full weight, no competition. */}
          <p className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums sm:text-6xl">
            {formatCents(totalCents, fund.currency, fund.locale)}
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className={btnQuiet}
          aria-label="Abrir configurações"
        >
          <SettingsIcon className="size-4" />
        </button>
      </div>
    </section>
  );
}
