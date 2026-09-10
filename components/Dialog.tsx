"use client";

import { useEffect, useId } from "react";
import { CloseIcon } from "./icons";
import { btnQuiet } from "./ui";

/**
 * The modal shell both dialogs shared as copied markup. Pulling it out also
 * fixed what the copies were missing: a dialog role, aria-modal, a labelled
 * title, and a close control big enough to hit on a phone.
 *
 * Mobile-first placement: sheets sit at the bottom edge where thumbs are, and
 * centre once there is room for it.
 */
export default function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-goal/30 p-3 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card max-h-[90dvh] w-full max-w-md overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* A filled, ruled-off title bar — the dialog gets the same banner
            treatment as the page masthead so the two read as one system. */}
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-line bg-accent px-5 py-3">
          <h2 id={titleId} className="text-lg font-bold uppercase tracking-tight">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Fechar" className={btnQuiet}>
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
