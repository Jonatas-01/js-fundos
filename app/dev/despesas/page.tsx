import { notFound } from "next/navigation";
import ExpensesPage from "@/components/expenses/ExpensesPage";
import {
  currentMonthKey,
  isMonthKey,
  monthWindow,
  occurrenceDate,
  shiftMonth,
} from "@/lib/month";
import type { Expense, RecurringExpense } from "@/app/despesas/page";
import type { Fund } from "@/app/page";

/**
 * The expenses page rendered from fixed sample data, so it can be looked at
 * without signing in. The month arrows and every form still point at the real
 * routes and actions, which reject an unauthenticated caller — nothing here can
 * reach live data. Never reachable on a deployed build.
 */
export default async function DespesasPreview({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  // The month arrows link to the real (signed-in) route, so pass ?mes= here
  // directly to exercise a different month: /dev/despesas?mes=2026-07
  const { mes } = await searchParams;
  const month = mes && isMonthKey(mes) ? mes : THIS_MONTH;

  return (
    <ExpensesPage
      fund={FUND}
      month={month}
      months={monthWindow(month, 4)}
      expenses={EXPENSES}
      recurring={RECURRING}
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

const THIS_MONTH = currentMonthKey();

const RECURRING: RecurringExpense[] = [
  {
    id: "r1",
    name: "Aluguel",
    amount_cents: 150000,
    category: "moradia",
    method: "debito",
    day_of_month: 5,
  },
  {
    id: "r2",
    name: "Internet",
    amount_cents: 12000,
    category: "moradia",
    method: "boleto",
    day_of_month: 25,
  },
];

/** `[monthsAgo, day, name, cents, category, method, recurringId]` */
const ROWS: [number, number, string, number, string, string, string | null][] = [
  [3, 5, "Aluguel", 150000, "moradia", "debito", "r1"],
  [3, 12, "Mercado do mês", 48000, "mercado", "credito", null],
  [3, 20, "Gasolina", 22000, "transporte", "credito", null],
  [2, 5, "Aluguel", 150000, "moradia", "debito", "r1"],
  [2, 9, "Farmácia", 8700, "saude", "pix", null],
  [2, 18, "Mercado", 39000, "mercado", "debito", null],
  [2, 27, "Cinema", 9000, "lazer", "pix", null],
  [1, 5, "Aluguel", 150000, "moradia", "debito", "r1"],
  [1, 14, "Mercado", 51000, "mercado", "credito", null],
  [1, 16, "Uber", 3400, "transporte", "pix", null],
  [1, 22, "Streaming", 5590, "assinaturas", "credito", null],
  [0, 5, "Aluguel", 150000, "moradia", "debito", "r1"],
  [0, 8, "Mercado", 43500, "mercado", "debito", null],
  [0, 11, "Padaria", 2800, "mercado", "dinheiro", null],
  [0, 11, "iFood", 6700, "restaurante", "credito", null],
  [1, 19, "Pizzaria", 9800, "restaurante", "pix", null],
  [2, 21, "Delivery", 5400, "restaurante", "credito", null],
  [0, 12, "Gasolina", 25000, "transporte", "credito", null],
];

const EXPENSES: Expense[] = ROWS.map(
  ([ago, day, name, amount_cents, category, method, recurring_id], i) => ({
    id: `e${i}`,
    name,
    amount_cents,
    category,
    method,
    occurred_on: occurrenceDate(shiftMonth(THIS_MONTH, -ago), day),
    recurring_id,
  }),
);
