"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MailIcon } from "@/components/icons";
import { btnPrimary, inputClass, labelClass } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setStatus("idle");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="card overflow-hidden">
        <div className="border-b-[3px] border-line bg-accent px-6 py-5">
          <h1 className="text-3xl font-bold uppercase tracking-tight">J&S Fundos ⩖</h1>
          <p className="mt-1.5 text-sm font-semibold">
            Nossas economias em um só lugar. Entre com seu e-mail — sem senha.
          </p>
        </div>

        <div className="p-6">
          {status === "sent" ? (
            <div
              role="status"
              className="flex gap-2.5 border-[3px] border-line bg-success-soft p-3 text-sm font-medium text-foreground"
            >
              <MailIcon className="mt-0.5 size-4 shrink-0" />
              <p>
                Link enviado para{" "}
                <strong className="font-semibold">{email}</strong>. Abra o link
                neste mesmo dispositivo para concluir o acesso.
              </p>
            </div>
          ) : (
            <form onSubmit={send} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  aria-describedby={error ? "login-error" : undefined}
                  className={`${inputClass} mt-1.5`}
                />
              </div>

              {error && (
                <p
                  id="login-error"
                  role="alert"
                  className="border-[3px] border-line bg-danger-soft px-3 py-2 text-sm font-bold text-danger"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className={`${btnPrimary} w-full`}
              >
                {status === "sending" ? "Enviando…" : "Enviar link de acesso"}
              </button>
            </form>
          )}
        </div>
      </div>

    </main>
  );
}
