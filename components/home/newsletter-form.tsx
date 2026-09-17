"use client";

import * as React from "react";
import { CircleCheck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast";
import { subscribeToNewsletter } from "@/services/contact";

export function NewsletterForm() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    const result = await subscribeToNewsletter(email);
    setSubmitting(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    setDone(true);
    toast(
      result.data.alreadySubscribed
        ? "You're already on the list"
        : "You're subscribed",
    );
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm text-success">
        <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
        Thanks — we&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form className="flex w-full max-w-sm gap-2" onSubmit={handleSubmit} noValidate>
      <Input
        type="email"
        placeholder="you@email.com"
        aria-label="Email address"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Subscribe"
        )}
      </Button>
    </form>
  );
}
