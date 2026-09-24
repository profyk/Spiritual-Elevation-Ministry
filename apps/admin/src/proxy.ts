import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request, per the @supabase/ssr
 * Next.js pattern. Required for admin sessions to stay valid across server
 * components.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Never let a missing/unreachable/misconfigured Supabase project take
  // down every route on the site — fail open on session refresh and let
  // each page's own auth/data checks handle the absence of a session.
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            response = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      }
    );

    await supabase.auth.getUser();
  } catch (error) {
    console.error("proxy: session refresh failed", error);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
