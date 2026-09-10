import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link landing point. Swaps the one-time code for a session cookie,
 * then makes sure the user has a display name to show in the history.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=expired`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await supabase
      .from("profile")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      // Default to the part before the @; editable later from the dashboard.
      const fallback = (user.email ?? "Alguém").split("@")[0];
      await supabase
        .from("profile")
        .insert({ user_id: user.id, display_name: fallback });
    }
  }

  return NextResponse.redirect(origin);
}
