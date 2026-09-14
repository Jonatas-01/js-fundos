/**
 * The fixed vocabulary for expenses. The form, the breakdown, the list and the
 * server-side validation all read these, and 0003_expenses.sql carries the same
 * values as check constraints — so a value the UI cannot offer is also a value
 * the database will not store.
 *
 * Adding one means editing this file and the matching constraint.
 */

export const CATEGORIES = [
  { value: "moradia", label: "Moradia" },
  { value: "mercado", label: "Mercado" },
  { value: "restaurante", label: "Restaurante/Delivery" },
  { value: "transporte", label: "Transporte" },
  { value: "saude", label: "Saúde" },
  { value: "lazer", label: "Lazer" },
  { value: "assinaturas", label: "Assinaturas" },
  { value: "outros", label: "Outros" },
] as const;

export const METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "boleto", label: "Boleto" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
export type MethodValue = (typeof METHODS)[number]["value"];

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as readonly string[];
const METHOD_VALUES = METHODS.map((m) => m.value) as readonly string[];

export function isCategory(value: string): value is CategoryValue {
  return CATEGORY_VALUES.includes(value);
}

export function isMethod(value: string): value is MethodValue {
  return METHOD_VALUES.includes(value);
}

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function methodLabel(value: string): string {
  return METHODS.find((m) => m.value === value)?.label ?? value;
}

/**
 * A fixed colour per category so the breakdown and any chart agree, and so a
 * category keeps its colour as the ranking reorders month to month.
 */
export const CATEGORY_COLOR: Record<string, string> = {
  moradia: "var(--goal)",
  mercado: "var(--success)",
  restaurante: "var(--chart-blue)",
  transporte: "var(--chart-carried)",
  saude: "var(--danger)",
  lazer: "var(--accent-hover)",
  assinaturas: "var(--goal-soft)",
  outros: "var(--muted)",
};
