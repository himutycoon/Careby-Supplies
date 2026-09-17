import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account/account-settings";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/profile";

export const metadata: Metadata = { title: "Account — CareBy Canada" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getUserRole(supabase, user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl">Account</h1>
        <p className="mt-1 text-muted-foreground">
          Your details, and how we reach you about jobs and orders.
        </p>
      </div>
      <AccountSettings role={role} />
    </div>
  );
}
