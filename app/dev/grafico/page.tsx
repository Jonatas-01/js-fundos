import { notFound } from "next/navigation";
import BalanceChart from "@/components/BalanceChart";
import type { Deposit, Fund } from "@/app/page";

/**
 * Local-only preview of the growth chart, so it can be checked without
 * signing in (magic links cost a Supabase email each). Never reachable on
 * a deployed build.
 */
export default function GraficoPreview() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
      {SCENARIOS.map(({ title, note, deposits }) => (
        <section key={title} className="space-y-2">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight">{title}</h2>
            <p className="text-sm text-muted">{note}</p>
          </div>
          <BalanceChart deposits={deposits} fund={FUND} />
        </section>
      ))}
    </main>
  );
}

const FUND: Fund = {
  id: "preview",
  name: "J&S Fundos",
  currency: "BRL",
  locale: "pt-BR",
};

/** `days` ago, in local time — the same basis the chart uses. */
function daysAgo(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
}

function mk(rows: [number, number][]): Deposit[] {
  return rows.map(([ago, cents], i) => ({
    id: `p${i}`,
    user_id: i % 2 === 0 ? "u1" : "u2",
    amount_cents: cents,
    occurred_on: daysAgo(ago),
    note: null,
    depositor: i % 2 === 0 ? "Jonatas" : "Sarah",
  }));
}

const SCENARIOS = [
  {
    title: "Seus dois depósitos",
    note: "R$ 130,00 ontem e R$ 200,00 hoje — era isto que aparecia como uma única coluna em 7 de set.",
    deposits: mk([
      [1, 13000],
      [0, 20000],
    ]),
  },
  {
    title: "Com intervalo sem depósito",
    note: "Os dias parados aparecem como colunas planas, carregando o saldo.",
    deposits: mk([
      [12, 35000],
      [11, 15000],
      [4, 60000],
      [0, 20000],
    ]),
  },
  {
    title: "Histórico longo (100 dias)",
    note: "A janela mostra só os últimos 40 dias; o que veio antes vira o saldo acumulado da primeira coluna.",
    deposits: mk([
      [99, 80000],
      [70, 40000],
      [38, 30000],
      [20, 45000],
      [5, 25000],
      [0, 15000],
    ]),
  },
];
