import { redirect } from "next/navigation";
import { AppTopNav } from "@/components/app-shell/top-nav";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, homeForRole } from "@/lib/supabase/profile";

/**
 * Account lives outside the role route groups on purpose: homeowners,
 * contractors and admins all need it, and each group's layout carries a
 * role-specific sidebar that would be wrong for the other two.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getUserRole(supabase, user.id);

  return (
    <>
      <AppTopNav links={[]} homeHref={homeForRole(role)} />
      <main className="min-w-0 flex-1 bg-muted/20 pb-tabbar lg:pb-10">
        {children}
      </main>
    </>
  );
}
