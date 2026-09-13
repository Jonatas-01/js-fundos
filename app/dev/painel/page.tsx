import { notFound } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import type { Deposit, Fund } from "@/app/page";

/**
 * The whole dashboard, rendered from fixed sample data so it can be looked at
 * without signing in — every magic link spends one of Supabase's rate-limited
 * test emails, and the real page is behind auth.
 *
 * Read-only in practice: the forms still post to the real server actions, which
 * reject an unauthenticated caller, so nothing here can touch live data.
 * Never reachable on a deployed build.
 */
export default function PainelPreview() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Dashboard
      fund={FUND}
      deposits={DEPOSITS}
      userId="u1"
      displayName="Jonatas"
    />
  );
}

const FUND: Fund = {
  id: "preview",
  name: "J&S Fundos",
  currency: "BRL",
  locale: "pt-BR",
};

/** `days` ago in local time — the same basis buildColumns uses. */
function daysAgo(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
}

const ROWS: [number, number, string, string | null][] = [
  [23, 40000, "u1", "Primeiro depósito"],
  [21, 25000, "u2", null],
  [16, 60000, "u1", "Bônus"],
  [11, 30000, "u2", "Vendi a bike antiga"],
  [6, 45000, "u1", null],
  [2, 13000, "u2", null],
  [0, 20000, "u1", null],
];

const DEPOSITS: Deposit[] = ROWS.map(([ago, cents, user, note], i) => ({
  id: `p${i}`,
  user_id: user,
  amount_cents: cents,
  occurred_on: daysAgo(ago),
  note,
  depositor: user === "u1" ? "Jonatas" : "Sarah",
}));
