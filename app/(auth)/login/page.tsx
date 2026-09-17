import type { Metadata } from "next";
import Link from "next/link";
import { AuthSplitShell } from "@/components/auth/auth-split-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log In — CareBy Canada" };

export default function LoginPage() {
  return (
    <AuthSplitShell
      heading="Welcome back"
      subheading="Sign in to continue to your projects."
      footer={
        <>
          New to CareBy?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthSplitShell>
  );
}
