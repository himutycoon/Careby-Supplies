import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";

/**
 * Reads the authoritative role from the profiles table.
 *
 * Role is never taken from the client. Middleware uses this for routing
 * convenience; the real enforcement is the RLS policies (and is_admin())
 * in the database, which apply no matter how a request arrives.
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRole> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const role = data?.role as UserRole | undefined;
  return role ?? "homeowner";
}

export function homeForRole(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "contractor") return "/contractor";
  return "/dashboard";
}
