"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PasswordInput } from "@/components/auth/password-input";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "homeowner", label: "Homeowner" },
  { value: "contractor", label: "Contractor" },
];

/** Only same-origin paths, so `next` can't be used as an open redirect. */
function safeNext(next?: string): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function SignupForm({
  initialRole = "homeowner",
  next,
}: {
  initialRole?: UserRole;
  /** Where to land after signup — set by the guided flow router. */
  next?: string;
}) {
  const router = useRouter();
  const [role, setRole] = React.useState<UserRole>(initialRole);
  const destination = safeNext(next);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [checkEmail, setCheckEmail] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role } },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Email confirmation is enabled on this project, so signUp succeeds
    // without creating a session until the link is clicked.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    router.push(
      destination ?? (role === "contractor" ? "/contractor" : "/dashboard"),
    );
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-8 text-center">
        <MailCheck className="size-8 text-primary" />
        <h3 className="font-semibold">Check your email</h3>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a confirmation link. Click it to activate your
          account, then come back and sign in.
        </p>
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
        <Label>I am a...</Label>
        <ToggleGroup
          value={[role]}
          onValueChange={(values) => {
            const next = values[0];
            if (next) setRole(next as UserRole);
          }}
          className="flex flex-wrap justify-start gap-2"
        >
          {ROLE_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              variant="outline"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input id="signup-name" name="name" placeholder="Jordan Smith" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          placeholder="you@email.com"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-password">Password</Label>
        <PasswordInput id="signup-password" name="password" required />
      </div>
      <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Create account <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
