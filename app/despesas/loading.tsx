import Masthead from "@/components/Masthead";
import Skeleton from "@/components/Skeleton";

/**
 * The Despesas counterpart of `app/loading.tsx` — same reasoning, mirroring the
 * block order and heights of `ExpensesPage` so nothing moves when the real
 * month lands.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-14">
      <Masthead title="J&S Fundos ⩖" />

      <p role="status" className="sr-only">
        Carregando as despesas…
      </p>

      <div className="space-y-6">
        {/* Month header: the arrow strip keeps its real height, so the row of
            controls does not jump when the month label arrives. */}
        <section className="card overflow-hidden">
          <div className="flex h-11 items-center justify-between border-b-[3px] border-line bg-surface-soft px-4">
            <Skeleton className="size-5" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="size-5" />
          </div>
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="mt-3 h-10 w-48 sm:h-12 sm:w-60" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="h-10 w-16" />
              <Skeleton className="size-10" />
            </div>
          </div>
        </section>

        {/* MonthlyChart */}
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-[3px] border-line bg-surface-soft px-5 py-4">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <div className="p-5">
            <Skeleton className="h-52 w-full" />
          </div>
        </section>

        {/* CategoryBreakdown */}
        <section className="card overflow-hidden">
          <div className="border-b-[3px] border-line bg-surface-soft px-5 py-4">
            <Skeleton className="h-3.5 w-32" />
          </div>
          <div className="divide-y-[3px] divide-line">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-24 shrink-0" />
                </div>
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            ))}
          </div>
        </section>

        {/* ExpenseForm */}
        <section className="card overflow-hidden">
          <div className="border-b-[3px] border-line bg-surface-soft px-5 py-4">
            <Skeleton className="h-3.5 w-32" />
          </div>
          <div className="space-y-4 p-5">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </section>

        {/* ExpenseList */}
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-[3px] border-line bg-surface-soft px-5 py-4">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <ul className="divide-y-[3px] divide-line">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <Skeleton className="mt-1 size-3 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20 shrink-0" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
