"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";
import { LogOutIcon } from "./icons";
import { btnGhost } from "./ui";

const TABS = [
  { href: "/", label: "Fundo" },
  { href: "/despesas", label: "Despesas" },
];

/**
 * The page masthead, shared by both sections. On this design a title sitting
 * loose on the ground would be the only element without an outline, so it is a
 * block like everything else.
 */
export default function Masthead({ title }: { title: string }) {
  const pathname = usePathname();

  return (
    <header className="mb-6 space-y-3">
      <div className="flex items-stretch justify-between gap-3">
        <div className="card min-w-0 flex-1 bg-accent px-4 py-3">
          <p className="eyebrow">Fundo compartilhado</p>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight uppercase sm:text-3xl">
            {title}
          </h1>
        </div>

        <form action={signOut} className="shrink-0">
          <button type="submit" className={btnGhost + " h-full"}>
            <LogOutIcon className="size-4" />
            <span className="hidden sm:inline">Sair</span>
            <span className="sr-only sm:hidden">Sair</span>
          </button>
        </form>
      </div>

      {/* Two destinations, so they are laid out as one split block rather than
          as links floating above the page. */}
      <nav aria-label="Seções" className="card grid grid-cols-2 divide-x-[3px] divide-line">
        {TABS.map(({ href, label }) => {
          const current = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              className={`px-4 py-3 text-center text-sm font-extrabold tracking-wide uppercase transition-colors duration-100 ${
                current
                  ? "bg-accent text-on-accent"
                  : "bg-surface text-muted hover:bg-surface-soft hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
