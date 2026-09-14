"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Segment, useReducedMotion } from "@/components/chart";
import { formatCents } from "@/lib/money";
import { CATEGORIES, CATEGORY_COLOR, categoryLabel } from "@/lib/expenses";
import { monthLabel, monthShortLabel, type MonthKey } from "@/lib/month";
import type { Expense } from "@/app/despesas/page";
import type { Fund } from "@/app/page";

/** One row per month: the total, plus a key per category holding its cents. */
type MonthRow = {
  month: MonthKey;
  label: string;
  total: number;
} & Record<string, number | string>;

/**
 * One column per month across the window, split into the categories that made
 * it up — so a heavy month shows *what* made it heavy rather than only that it
 * was heavy.
 *
 * Tapping a column opens that month's full breakdown. Click rather than hover:
 * the chart is read on phones, where there is no hover.
 */
export default function MonthlyChart({
  expenses,
  months,
  month,
  fund,
}: {
  expenses: Expense[];
  months: MonthKey[];
  month: MonthKey;
  fund: Fund;
}) {
  const reducedMotion = useReducedMotion();

  const { data, categories } = useMemo(() => {
    const present = new Set<string>();

    const rows = months.map((m) => {
      const row: MonthRow = {
        month: m,
        label: monthShortLabel(m, fund.locale),
        total: 0,
      };
      for (const c of CATEGORIES) row[c.value] = 0;

      for (const e of expenses) {
        if (!e.occurred_on.startsWith(m)) continue;
        row[e.category] = ((row[e.category] as number) ?? 0) + e.amount_cents;
        row.total += e.amount_cents;
        present.add(e.category);
      }

      return row;
    });

    // Only categories actually spent on, kept in the fixed CATEGORIES order so
    // a category holds its position in the stack as the months change.
    return {
      data: rows,
      categories: CATEGORIES.filter((c) => present.has(c.value)).map((c) => c.value),
    };
  }, [expenses, months, fund.locale]);

  // Recharts' click-triggered tooltip stays open by design, so visibility is
  // driven here: opened by the chart's onClick, closed by a click outside or
  // by Escape.
  const [detailOpen, setDetailOpen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!detailOpen) return;

    // pointerdown fires before the chart's own click handler, so moving from
    // one column straight to another reopens rather than staying shut.
    const onPointerDown = (event: PointerEvent) => {
      if (!chartRef.current?.contains(event.target as Node)) setDetailOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [detailOpen]);

  const peak = Math.max(...data.map((d) => d.total), 0);
  // A window with no spending at all would otherwise give Recharts [0, 0].
  const max = peak > 0 ? peak * 1.25 : 100;

  const compact = new Intl.NumberFormat(fund.locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <section className="card overflow-hidden" aria-labelledby="months-heading">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-[3px] border-line bg-surface-soft px-5 py-4">
        <h2 id="months-heading" className="eyebrow">
          Últimos {months.length} meses
        </h2>
        <p className="text-xs font-bold text-muted">Toque numa coluna</p>
      </div>

      {/* The columns encode the totals; this table is the same reading for
          anyone who cannot see them. */}
      <div className="sr-only">
        <table>
        <caption>Total gasto por mês e por categoria.</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            {categories.map((c) => (
              <th key={c} scope="col">
                {categoryLabel(c)}
              </th>
            ))}
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{d.label}</th>
              {categories.map((c) => (
                <td key={c}>
                  {formatCents((d[c] as number) ?? 0, fund.currency, fund.locale)}
                </td>
              ))}
              <td>{formatCents(d.total, fund.currency, fund.locale)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <div className="p-5">
        <div className="h-52 w-full" aria-hidden="true" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 24, right: 8, bottom: 0, left: 0 }}
              onClick={() => setDetailOpen(true)}
              // Recharts' accessibility layer puts tabIndex=0 on the <svg>, so
              // clicking focused it and the browser drew a ring around the whole
              // plot. The chart is aria-hidden and the table above is its
              // accessible equivalent, so nothing is lost by dropping it — and a
              // focusable node inside aria-hidden could not be described anyway.
              accessibilityLayer={false}
            >
              <CartesianGrid stroke="var(--line)" strokeOpacity={0.25} vertical={false} />

              <XAxis
                dataKey="label"
                tick={(props: unknown) => {
                  // Recharts types a tick's x/y as string | number; narrow once
                  // here rather than letting it leak into MonthTick.
                  const p = props as {
                    x?: number | string;
                    y?: number | string;
                    payload?: { index?: number; value?: string };
                  };
                  return (
                    <MonthTick
                      x={Number(p.x)}
                      y={Number(p.y)}
                      payload={p.payload}
                      selected={month}
                      data={data}
                    />
                  );
                }}
                tickLine={false}
                axisLine={{ stroke: "var(--line)", strokeWidth: 3 }}
              />
              <YAxis
                domain={[0, max]}
                width={60}
                tick={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => compact.format(v / 100)}
              />

              <Tooltip
                trigger="click"
                active={detailOpen}
                // No highlight band behind the column: the panel already names
                // the month it is describing.
                cursor={false}
                content={<Breakdown fund={fund} categories={categories} />}
              />

              {categories.map((c, i) => (
                <Bar
                  key={c}
                  dataKey={c}
                  stackId="month"
                  fill={CATEGORY_COLOR[c] ?? "var(--muted)"}
                  maxBarSize={64}
                  isAnimationActive={!reducedMotion}
                  shape={<Segment stacked />}
                >
                  {/* The running total belongs above the column, so it goes on
                      the topmost series rather than on every one. */}
                  {i === categories.length - 1 && (
                    <LabelList
                      position="top"
                      offset={8}
                      fontSize={11}
                      fontWeight={800}
                      fill="var(--foreground)"
                      valueAccessor={(entry: unknown) => {
                        const total =
                          (entry as { payload?: MonthRow })?.payload?.total ?? 0;
                        return total > 0 ? compact.format(total / 100) : "";
                      }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

/**
 * The viewed month is always the rightmost column, but it is also the one the
 * rest of the page describes — so its label is marked rather than left to be
 * inferred from position. Colour now belongs to the categories, so it cannot
 * do this job any more.
 */
function MonthTick(props: {
  x?: number;
  y?: number;
  payload?: { index?: number; value?: string };
  selected: MonthKey;
  data: MonthRow[];
}) {
  const { x = 0, y = 0, payload, selected, data } = props;
  const row = data[payload?.index ?? -1];
  const current = row?.month === selected;

  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      fontSize={11}
      fontWeight={current ? 900 : 700}
      fill={current ? "var(--foreground)" : "var(--muted)"}
      textDecoration={current ? "underline" : undefined}
    >
      {payload?.value}
    </text>
  );
}

type BreakdownProps = {
  active?: boolean;
  payload?: { payload: MonthRow }[];
  fund: Fund;
  categories: string[];
};

/** The month's categories, biggest first, with the total ruled off beneath. */
function Breakdown({ active, payload, fund, categories }: BreakdownProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  const lines = categories
    .map((c) => ({ category: c, cents: (row[c] as number) ?? 0 }))
    .filter((l) => l.cents > 0)
    .sort((a, b) => b.cents - a.cents);

  return (
    <div
      className="border-[3px] border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground"
      style={{ boxShadow: "var(--shadow-hard-sm)" }}
    >
      <p className="mb-1.5 font-bold uppercase">{monthLabel(row.month, fund.locale)}</p>

      {lines.length === 0 ? (
        <p className="text-muted">Nada gasto neste mês.</p>
      ) : (
        <dl className="space-y-1">
          {lines.map((l) => (
            <div key={l.category} className="flex items-center justify-between gap-6">
              <dt className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 border-2 border-line"
                  style={{ background: CATEGORY_COLOR[l.category] ?? "var(--muted)" }}
                />
                {categoryLabel(l.category)}
              </dt>
              <dd className="tabular-nums">
                {formatCents(l.cents, fund.currency, fund.locale)}
              </dd>
            </div>
          ))}

          <div className="flex justify-between gap-6 border-t-2 border-line pt-1 font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">
              {formatCents(row.total, fund.currency, fund.locale)}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
