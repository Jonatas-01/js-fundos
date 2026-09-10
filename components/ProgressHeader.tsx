"use client";

import { formatCents } from "@/lib/money";
import { SettingsIcon } from "./icons";
import { btnQuiet } from "./ui";
import type { Fund } from "@/app/page";

export default function ProgressHeader({
  fund,
  totalCents,
  onEditGoal,
}: {
  fund: Fund;
  totalCents: number;
  onEditGoal: () => void;
}) {
  const pct = Math.min(100, (totalCents / fund.goal_cents) * 100);
  const remaining = Math.max(0, fund.goal_cents - totalCents);
  const reached = remaining === 0;

  const money = (cents: number) => formatCents(cents, fund.currency, fund.locale);

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
            {money(totalCents)}
          </p>
          <p className="mt-2 text-sm font-semibold text-muted">
            meta de {money(fund.goal_cents)}
          </p>
        </div>

        <button onClick={onEditGoal} className={btnQuiet} aria-label="Abrir configurações">
          <SettingsIcon className="size-4" />
        </button>
      </div>

      {/* A thick outlined track with a flat yellow fill — the same block
          language as the cards, laid on its side. */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div
          className="h-6 overflow-hidden border-[3px] border-line bg-surface-soft"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${pct.toFixed(1)} por cento da meta de ${money(fund.goal_cents)}`}
        >
          <div
            className="h-full border-r-[3px] border-line bg-accent transition-[width] duration-300 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Three cells walled off by full-height rules and dropped onto the
          block's bottom edge, so the strip reads as part of the frame rather
          than as a caption floating under it. */}
      <dl className="grid grid-cols-3 border-t-[3px] border-line divide-x-[3px] divide-line">
        <Cell label="Progresso" value={`${pct.toFixed(1)}%`} />
        <Cell
          label={reached ? "Situação" : "Falta"}
          value={reached ? "Meta atingida" : money(remaining)}
          tone={reached ? "success" : undefined}
        />
        <Cell label="Meta" value={money(fund.goal_cents)} />
      </dl>
    </section>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div
      className={`px-2 py-3 text-center ${
        tone === "success" ? "bg-success-soft" : "bg-surface-soft"
      }`}
    >
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm font-bold tabular-nums">{value}</dd>
    </div>
  );
}
