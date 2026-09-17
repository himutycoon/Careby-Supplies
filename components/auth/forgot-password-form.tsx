"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
          <MailCheck className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-2xl">Check your email</h2>
        {/* Deliberately not confirming whether the address has an account —
            that would let anyone enumerate registered users. */}
        <p className="text-muted-foreground">
          If that address has a CareBy account, we&apos;ve sent a link to reset
          your password. The link expires in an hour.
        </p>
        <Button
          variant="outline"
          className="press mt-2 w-full"
          render={<Link href="/login">Back to sign in</Link>}
        />
      </div>
    );
  }

  /*
   * method="post" matters even though onSubmit does the real work: if
   * the form is submitted before React hydrates, the browser falls back
   * to a native submit, and a GET would put the password in the URL —
   * and so into history, server logs and the Referer header. A POST
   * keeps credentials in the request body.
   */
  return (
    <form
      method="post"
      className="flex flex-col gap-5"
      onSubmit={handleSubmit}
    >
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          required
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="press mt-1 w-full"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Send reset link <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
