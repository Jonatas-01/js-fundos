/**
 * The class strings every form in the app shares. One definition keeps the
 * border weight, hard shadow and press behaviour identical everywhere.
 *
 * Every control clears 44px of height so it stays a comfortable touch target.
 */

export const inputClass =
  "w-full rounded-none border-[3px] border-line bg-surface px-3 py-2.5 text-base font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted/70 focus:bg-surface-soft";

export const labelClass = "eyebrow";

/**
 * The one yellow control on a screen — whatever that screen is for. Uppercase
 * because at this weight lowercase reads as body copy sitting inside a box.
 */
export const btnPrimary =
  "pressable inline-flex h-11 items-center justify-center gap-2 rounded-none border-[3px] border-line bg-accent px-5 text-sm font-extrabold tracking-wide uppercase text-on-accent hover:bg-accent-hover";

export const btnGhost =
  "pressable inline-flex h-11 items-center justify-center gap-2 rounded-none border-[3px] border-line bg-surface px-5 text-sm font-extrabold tracking-wide uppercase text-foreground hover:bg-surface-soft";

/**
 * Tertiary actions — row buttons and icon controls. It carries the black
 * outline like everything else but no shadow, so a row of them does not
 * compete with the block they sit in. Still 44px square to stay tappable.
 */
export const btnQuiet =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-none border-[3px] border-transparent px-2.5 text-sm font-bold text-foreground transition-colors duration-100 hover:border-line hover:bg-surface-soft";
