"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 8;

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [hasSession, setHasSession] = React.useState(false);

  // Following the emailed link signs the user in with a short-lived
  // recovery session. No session means the link was stale or reused.
  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setChecking(false);
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Middleware routes to the right home for this account's role.
    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-2xl">This link has expired</h2>
        <p className="text-muted-foreground">
          Password reset links can only be used once, and expire after an hour.
          Request a fresh one and we&apos;ll email it straight over.
        </p>
        <Button
          className="press mt-2 w-full"
          render={<Link href="/forgot-password">Request a new link</Link>}
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
        <Label htmlFor="reset-password">New password</Label>
        <PasswordInput
          id="reset-password"
          name="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">
          At least {MIN_LENGTH} characters.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-confirm">Confirm new password</Label>
        <PasswordInput
          id="reset-confirm"
          name="confirm"
          autoComplete="new-password"
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
            Set new password <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
