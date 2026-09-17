import type { Metadata } from "next";
import Link from "next/link";
import { AuthSplitShell } from "@/components/auth/auth-split-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "New Password — CareBy Canada",
};

/**
 * Reached from the emailed recovery link. Deliberately NOT listed in the
 * middleware's AUTH_PAGES: the recovery link signs the user in, and an
 * "already logged in" redirect would bounce them away before they could
 * set a new password.
 */
export default function ResetPasswordPage() {
  return (
    <AuthSplitShell
      heading="Choose a new password"
      subheading="Pick something you haven't used before."
      footer={
        <>
          Need a new link?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            Start over
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthSplitShell>
  );
}
