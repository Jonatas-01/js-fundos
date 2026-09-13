"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseAmountToCents } from "@/lib/money";

export type ActionState = { error?: string; ok?: boolean };

/** The fund is a single row; everything that writes needs its locale. */
async function loadFund() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fund")
    .select("id, currency, locale")
    .limit(1)
    .single();
  return { supabase, fund: data };
}

function validDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // One day of slack so timezone differences never block a same-day entry.
  return iso <= tomorrow.toISOString().slice(0, 10);
}

export async function addDeposit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, fund } = await loadFund();
  if (!fund) return { error: "Nenhum fundo encontrado. Rode a migração primeiro." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você não está conectado." };

  const cents = parseAmountToCents(String(formData.get("amount") ?? ""));
  if (cents === null) return { error: "Informe um valor maior que zero." };

  const occurredOn = String(formData.get("occurred_on") ?? "");
  if (!validDate(occurredOn)) return { error: "Escolha uma data que não esteja no futuro." };

  const note = String(formData.get("note") ?? "").trim() || null;

  const { error } = await supabase.from("deposit").insert({
    fund_id: fund.id,
    user_id: user.id,
    amount_cents: cents,
    occurred_on: occurredOn,
    note,
  });
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function updateDeposit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, fund } = await loadFund();
  if (!fund) return { error: "Nenhum fundo encontrado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Depósito não encontrado." };

  const cents = parseAmountToCents(String(formData.get("amount") ?? ""));
  if (cents === null) return { error: "Enter an amount greater than zero." };

  const occurredOn = String(formData.get("occurred_on") ?? "");
  if (!validDate(occurredOn)) return { error: "Pick a date that is not in the future." };

  const note = String(formData.get("note") ?? "").trim() || null;

  // user_id is matched here as well as in RLS — belt and braces.
  const { error } = await supabase
    .from("deposit")
    .update({
      amount_cents: cents,
      occurred_on: occurredOn,
      note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function deleteDeposit(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("deposit")
    .delete()
    .eq("id", String(formData.get("id") ?? ""))
    .eq("user_id", user.id);

  revalidatePath("/");
}

export async function updateFund(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, fund } = await loadFund();
  if (!fund) return { error: "No fund found." };

  const currency = String(formData.get("currency") ?? "BRL").toUpperCase();
  const locale = String(formData.get("locale") ?? "pt-BR");

  if (!/^[A-Z]{3}$/.test(currency)) return { error: "A moeda deve ter 3 letras." };

  const { error } = await supabase
    .from("fund")
    .update({ currency, locale })
    .eq("id", fund.id);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function setDisplayName(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const name = String(formData.get("display_name") ?? "").trim();
  if (!name) return { error: "Informe um nome." };

  const { error } = await supabase
    .from("profile")
    .upsert({ user_id: user.id, display_name: name.slice(0, 40) });
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
