"use client";

import { useState } from "react";
import { signOut } from "@/app/actions";
import BalanceHeader from "./BalanceHeader";
import BalanceChart from "./BalanceChart";
import DepositForm from "./DepositForm";
import DepositList from "./DepositList";
import SettingsDialog from "./SettingsDialog";
import { LogOutIcon } from "./icons";
import { btnGhost } from "./ui";
import type { Deposit, Fund } from "@/app/page";

export default function Dashboard({
  fund,
  deposits,
  userId,
  displayName,
}: {
  fund: Fund;
  deposits: Deposit[];
  userId: string;
  displayName: string;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const totalCents = deposits.reduce((sum, d) => sum + d.amount_cents, 0);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-14">
      {/* The masthead is a block like everything else — on this design the
          page title sitting loose on the ground would be the only element
          without an outline. */}
      <header className="mb-6 flex items-stretch justify-between gap-3">
        <div className="card min-w-0 flex-1 bg-accent px-4 py-3">
          <p className="eyebrow">Fundo compartilhado</p>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight uppercase sm:text-3xl">
            J&S Fundos ⩖
          </h1>
        </div>

        <form action={signOut} className="shrink-0">
          <button type="submit" className={btnGhost + " h-full"}>
            <LogOutIcon className="size-4" />
            <span className="hidden sm:inline">Sair</span>
            <span className="sr-only sm:hidden">Sair</span>
          </button>
        </form>
      </header>

      <div className="space-y-6">
        <BalanceHeader
          fund={fund}
          totalCents={totalCents}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <BalanceChart deposits={deposits} fund={fund} />
        <DepositForm currency={fund.currency} />
        <DepositList deposits={deposits} fund={fund} userId={userId} />
      </div>

      {settingsOpen && (
        <SettingsDialog
          fund={fund}
          displayName={displayName}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}
