import type { Metadata } from "next";
import Link from "next/link";
import { AuthSplitShell } from "@/components/auth/auth-split-shell";
import { SignupForm } from "@/components/auth/signup-form";
import type { UserRole } from "@/lib/types";

export const metadata: Metadata = { title: "Sign Up — CareBy Supplies" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const { role, next } = await searchParams;
  const initialRole: UserRole =
    role === "contractor" ? "contractor" : "homeowner";

  return (
    <AuthSplitShell
      heading="Create your account"
      subheading="Materials, planning and expert support — in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm initialRole={initialRole} next={next} />
    </AuthSplitShell>
  );
}
