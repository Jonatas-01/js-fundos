import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExpensesPage from "@/components/expenses/ExpensesPage";
import {
  currentMonthKey,
  isMonthKey,
  monthEnd,
  monthStart,
  monthWindow,
} from "@/lib/month";
import type { Fund } from "@/app/page";

export type Expense = {
  id: string;
  name: string;
  amount_cents: number;
  category: string;
  method: string;
  occurred_on: string;
  recurring_id: string | null;
};

export type RecurringExpense = {
  id: string;
  name: string;
  amount_cents: number;
  category: string;
  method: string;
  day_of_month: number;
};

/** How many months the overview chart covers, ending at the viewed month. */
export const WINDOW_MONTHS = 4;

export default async function Despesas({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect("/");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { mes } = await searchParams;
  // A hand-edited or stale ?mes= falls back to now rather than erroring.
  const month = mes && isMonthKey(mes) ? mes : currentMonthKey();
  const months = monthWindow(month, WINDOW_MONTHS);

  // Currency and locale are the fund's — the only formatting settings the app
  // has. The expenses themselves are private; only the display format is
  // shared.
  const [{ data: fund }, { data: expenses }, { data: recurring }] = await Promise.all([
    supabase.from("fund").select("id, name, currency, locale").limit(1).single(),
    // RLS already restricts this to the signed-in user; the explicit filter
    // states the intent at the call site too.
    supabase
      .from("expense")
      .select("id, name, amount_cents, category, method, occurred_on, recurring_id")
      .eq("user_id", user.id)
      .gte("occurred_on", monthStart(months[0]))
      .lte("occurred_on", monthEnd(month))
      .order("occurred_on", { ascending: false }),
    supabase
      .from("recurring_expense")
      .select("id, name, amount_cents, category, method, day_of_month")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("day_of_month", { ascending: true }),
  ]);

  const display: Fund = fund ?? {
    id: "none",
    name: "J&S Fundos",
    currency: "BRL",
    locale: "pt-BR",
  };

  return (
    <ExpensesPage
      fund={display}
      month={month}
      months={months}
      expenses={(expenses ?? []) as Expense[]}
      recurring={(recurring ?? []) as RecurringExpense[]}
    />
  );
}
