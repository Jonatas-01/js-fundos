import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every matched request (Next 16's replacement for middleware).
 * Refreshes the Supabase auth cookie so the session doesn't silently expire
 * and bounce you to /login mid-use.
 */
// NEXT_PUBLIC_* values are inlined at BUILD time. If the host built without
// them, they are baked in as undefined and no redeploy-free fix exists.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Refreshing the session is best-effort. It must never be able to 500 every
  // route in the app, which is exactly what an unset env var used to do.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      "[proxy] Supabase env vars missing from this build. Set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your " +
        "hosting provider, then trigger a REBUILD (not just a restart).",
    );
    return response;
  }

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  try {
    await supabase.auth.getUser();
  } catch (err) {
    // Supabase unreachable or misconfigured: let the request through and let
    // the page decide what to render, rather than failing the whole site.
    console.error("[proxy] session refresh failed:", err);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|webp)$).*)"],
};
