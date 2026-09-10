import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";

export type Fund = {
  id: string;
  name: string;
  goal_cents: number;
  currency: string;
  locale: string;
};

export type Deposit = {
  id: string;
  user_id: string;
  amount_cents: number;
  occurred_on: string;
  note: string | null;
  depositor: string;
};

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: fund } = await supabase
    .from("fund")
    .select("id, name, goal_cents, currency, locale")
    .limit(1)
    .single();

  if (!fund) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-16">
        <div className="card p-6">
          <h1 className="text-2xl font-bold tracking-tight uppercase">Nenhum fundo ainda</h1>
          <p className="mt-2 text-sm text-muted">
            Rode{" "}
            <code className="rounded-none border-2 border-line bg-surface-soft px-1.5 py-0.5 font-mono text-xs font-semibold">
              supabase/migrations/0001_init.sql
            </code>{" "}
            no editor SQL do Supabase e recarregue a página.
          </p>
        </div>
      </main>
    );
  }

  // Two queries instead of a join: deposit.user_id points at auth.users, so
  // PostgREST cannot infer a relationship to profile. With two people the
  // profile table is two rows — stitching them in JS costs nothing.
  const [{ data: deposits }, { data: profiles }] = await Promise.all([
    supabase
      .from("deposit")
      .select("id, user_id, amount_cents, occurred_on, note")
      .eq("fund_id", fund.id)
      .order("occurred_on", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("profile").select("user_id, display_name"),
  ]);

  const names = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

  const rows: Deposit[] = (deposits ?? []).map((d) => ({
    ...d,
    depositor: names.get(d.user_id) ?? "Alguém",
  }));

  return (
    <Dashboard
      fund={fund}
      deposits={rows}
      userId={user.id}
      displayName={names.get(user.id) ?? user.email?.split("@")[0] ?? "Você"}
    />
  );
}
