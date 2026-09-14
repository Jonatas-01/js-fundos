"use client";

import { useState } from "react";
import Masthead from "./Masthead";
import BalanceHeader from "./BalanceHeader";
import BalanceChart from "./BalanceChart";
import DepositForm from "./DepositForm";
import DepositList from "./DepositList";
import SettingsDialog from "./SettingsDialog";
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
      <Masthead title="J&S Fundos ⩖" />

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
