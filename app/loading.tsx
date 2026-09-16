import Masthead from "@/components/Masthead";
import Skeleton from "@/components/Skeleton";

/**
 * Shown the moment a link to this route is clicked, before any of the page's
 * Supabase round trips have returned.
 *
 * The masthead here is the real one, not a placeholder: it needs no data, so
 * the title block and the tab bar can be correct immediately — including the
 * active-tab highlight, since this file belongs to the destination segment.
 * Everything below it mirrors the block order and heights of `Dashboard`, so
 * the real content lands in the same places the placeholders occupied.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-14">
      <Masthead title="J&S Fundos ⩖" />

      <p role="status" className="sr-only">
        Carregando o fundo…
      </p>

      <div className="space-y-6">
        {/* BalanceHeader */}
        <section className="card overflow-hidden">
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="mt-3 h-10 w-56 sm:h-14 sm:w-72" />
            </div>
            <Skeleton className="size-10 shrink-0" />
          </div>
        </section>

        {/* BalanceChart */}
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-[3px] border-line bg-surface-soft px-5 py-4">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-44" />
          </div>
          <div className="p-5">
            <Skeleton className="h-56 w-full" />
          </div>
        </section>

        {/* DepositForm */}
        <section className="card overflow-hidden">
          <div className="border-b-[3px] border-line bg-surface-soft px-5 py-4">
            <Skeleton className="h-3.5 w-36" />
          </div>
          <div className="space-y-4 p-5">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="mt-1 h-12 w-full" />
          </div>
        </section>

        {/* DepositList */}
        <section className="card overflow-hidden">
          <div className="flex items-baseline justify-between gap-3 border-b-[3px] border-line bg-surface-soft px-5 py-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <ul className="divide-y-[3px] divide-line">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                <Skeleton className="size-8 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
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
