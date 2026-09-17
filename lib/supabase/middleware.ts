import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole, homeForRole } from "@/lib/supabase/profile";

const HOMEOWNER_PREFIXES = [
  "/dashboard",
  "/new",
  "/new-construction",
  "/repair",
  "/renovation",
  "/premium-request",
  "/estimate",
  "/report",
];
const CONTRACTOR_PREFIXES = ["/contractor"];
const ADMIN_PREFIXES = ["/admin"];
/** Logged in is enough — every role needs these. */
const SHARED_PREFIXES = ["/account"];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not remove — refreshes the session token and must run
  // before any routing decision below.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isHomeownerPath = HOMEOWNER_PREFIXES.some((p) => path.startsWith(p));
  const isContractorPath = CONTRACTOR_PREFIXES.some((p) => path.startsWith(p));
  const isAdminPath = ADMIN_PREFIXES.some((p) => path.startsWith(p));
  const isSharedPath = SHARED_PREFIXES.some((p) => path.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));
  const isGuarded =
    isHomeownerPath || isContractorPath || isAdminPath || isSharedPath;

  function redirectTo(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && isGuarded) {
    return redirectTo("/login");
  }

  if (user && (isGuarded || isAuthPage)) {
    // Authoritative role, read from the database.
    const role = await getUserRole(supabase, user.id);
    const home = homeForRole(role);

    if (isAuthPage) return redirectTo(home);

    // Admins can inspect every surface; everyone else stays in their lane.
    // This is routing convenience — RLS is what actually protects data.
    if (role !== "admin") {
      if (isAdminPath) return redirectTo(home);
      if (isContractorPath && role !== "contractor") return redirectTo(home);
      if (isHomeownerPath && role !== "homeowner") return redirectTo(home);
    }
  }

  return supabaseResponse;
}
