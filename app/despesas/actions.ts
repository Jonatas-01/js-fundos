"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAmountToCents } from "@/lib/money";
import { isCategory, isMethod } from "@/lib/expenses";
import { monthKeyOf, todayDate } from "@/lib/month";
import { dueOccurrences } from "@/lib/recurring";
import type { ActionState } from "@/app/actions";

export type { ActionState };

/**
 * Every write re-reads the user server-side and never takes user_id from the
 * form. RLS enforces ownership as well; this is the belt to its braces.
 */
async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

type Parsed =
  | { ok: true; name: string; cents: number; category: string; method: string }
  | { ok: false; error: string };

function parseShared(formData: FormData): Parsed {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Dê um nome à despesa." };

  const cents = parseAmountToCents(String(formData.get("amount") ?? ""));
  if (cents === null) return { ok: false, error: "Informe um valor maior que zero." };

  const category = String(formData.get("category") ?? "");
  if (!isCategory(category)) return { ok: false, error: "Escolha uma categoria." };

  const method = String(formData.get("method") ?? "");
  if (!isMethod(method)) return { ok: false, error: "Escolha uma forma de pagamento." };

  return { ok: true, name: name.slice(0, 80), cents, category, method };
}

function validDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // A day of slack so a device an hour ahead cannot reject today's date.
  return iso <= tomorrow.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// One-off expenses
// ---------------------------------------------------------------------------

export async function addExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Você não está conectado." };

  const parsed = parseShared(formData);
  if (!parsed.ok) return { error: parsed.error };

  const occurredOn = String(formData.get("occurred_on") ?? "");
  if (!validDate(occurredOn)) return { error: "Escolha uma data que não seja futura." };

  const { error } = await supabase.from("expense").insert({
    user_id: user.id,
    name: parsed.name,
    amount_cents: parsed.cents,
    category: parsed.category,
    method: parsed.method,
    occurred_on: occurredOn,
  });
  if (error) return { error: error.message };

  revalidatePath("/despesas");
  return { ok: true };
}

export async function updateExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Você não está conectado." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Despesa não encontrada." };

  const parsed = parseShared(formData);
  if (!parsed.ok) return { error: parsed.error };

  const occurredOn = String(formData.get("occurred_on") ?? "");
  if (!validDate(occurredOn)) return { error: "Escolha uma data que não seja futura." };

  // Editing a generated row changes that month only: recurring_id is left
  // alone and the template is not touched.
  const { error } = await supabase
    .from("expense")
    .update({
      name: parsed.name,
      amount_cents: parsed.cents,
      category: parsed.category,
      method: parsed.method,
      occurred_on: occurredOn,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/despesas");
  return { ok: true };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  if (!user) return;

  await supabase
    .from("expense")
    .delete()
    .eq("id", String(formData.get("id") ?? ""))
    .eq("user_id", user.id);

  revalidatePath("/despesas");
}

// ---------------------------------------------------------------------------
// Recurring templates
// ---------------------------------------------------------------------------

function parseDay(formData: FormData): number | null {
  const day = Number(formData.get("day_of_month"));
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  return day;
}

export async function addRecurring(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Você não está conectado." };

  const parsed = parseShared(formData);
  if (!parsed.ok) return { error: parsed.error };

  const day = parseDay(formData);
  if (day === null) return { error: "Escolha um dia entre 1 e 31." };

  // Starting at the first of the current month means this month's occurrence
  // is generated if its day has already passed, rather than waiting a month.
  const startsOn = `${monthKeyOf(new Date())}-01`;

  const { error } = await supabase.from("recurring_expense").insert({
    user_id: user.id,
    name: parsed.name,
    amount_cents: parsed.cents,
    category: parsed.category,
    method: parsed.method,
    day_of_month: day,
    starts_on: startsOn,
  });
  if (error) return { error: error.message };

  revalidatePath("/despesas");
  return { ok: true };
}

export async function updateRecurring(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Você não está conectado." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Despesa fixa não encontrada." };

  const parsed = parseShared(formData);
  if (!parsed.ok) return { error: parsed.error };

  const day = parseDay(formData);
  if (day === null) return { error: "Escolha um dia entre 1 e 31." };

  // Only future generations change. Months already recorded keep what was
  // actually paid, which is the point of keeping them.
  const { error } = await supabase
    .from("recurring_expense")
    .update({
      name: parsed.name,
      amount_cents: parsed.cents,
      category: parsed.category,
      method: parsed.method,
      day_of_month: day,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/despesas");
  return { ok: true };
}

/**
 * Stops future generation without deleting anything already recorded — the
 * expenses it produced were still real money.
 */
export async function deactivateRecurring(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  if (!user) return;

  await supabase
    .from("recurring_expense")
    .update({
      active: false,
      ends_on: todayDate(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("id") ?? ""))
    .eq("user_id", user.id);

  revalidatePath("/despesas");
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

/**
 * Creates the occurrences that have come due since the last run.
 *
 * Only dates that have actually arrived are written, so a month's total means
 * "spent so far" rather than "committed"; anything later in the month is
 * derived for display and never stored.
 *
 * `materialized_through` only moves forward, which is what makes deleting one
 * month stick instead of the row reappearing on the next visit.
 */
export async function syncRecurring(): Promise<{ created: number }> {
  const { supabase, user } = await currentUser();
  if (!user) return { created: 0 };

  const { data: templates } = await supabase
    .from("recurring_expense")
    .select(
      "id, name, amount_cents, category, method, day_of_month, starts_on, ends_on, materialized_through",
    )
    .eq("user_id", user.id)
    .eq("active", true);

  if (!templates?.length) return { created: 0 };

  const today = todayDate();
  const rows: Record<string, unknown>[] = [];
  const advanced: { id: string; through: string }[] = [];

  for (const t of templates) {
    // The date arithmetic lives in lib/recurring.ts so it can be tested
    // without a database: month lengths, catch-up and end dates all bite here.
    const dates = dueOccurrences(
      {
        day_of_month: t.day_of_month,
        starts_on: String(t.starts_on),
        ends_on: t.ends_on ? String(t.ends_on) : null,
        materialized_through: t.materialized_through
          ? String(t.materialized_through)
          : null,
      },
      today,
    );

    for (const date of dates) {
      rows.push({
        user_id: user.id,
        name: t.name,
        amount_cents: t.amount_cents,
        category: t.category,
        method: t.method,
        occurred_on: date,
        recurring_id: t.id,
      });
    }

    if (dates.length) advanced.push({ id: t.id, through: dates[dates.length - 1] });
  }

  if (!rows.length) return { created: 0 };

  // ignoreDuplicates leans on expense_recurring_month_idx: if two devices open
  // the same month at once, the loser inserts nothing rather than erroring.
  const { error } = await supabase
    .from("expense")
    .upsert(rows, { onConflict: "recurring_id,occurred_on", ignoreDuplicates: true });
  if (error) return { created: 0 };

  for (const a of advanced) {
    await supabase
      .from("recurring_expense")
      .update({ materialized_through: a.through })
      .eq("id", a.id)
      .eq("user_id", user.id);
  }

  revalidatePath("/despesas");
  return { created: rows.length };
}
