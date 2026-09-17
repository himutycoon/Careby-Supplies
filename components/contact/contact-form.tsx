"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CircleCheck, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/shared/toast";
import { sendContactMessage } from "@/services/contact";

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

/**
 * Every "Talk to an Expert" and "Request Consultation" on the site ends
 * here, so the form links through `?about=` to say which one — the team
 * gets that context instead of guessing from the message body.
 */
const SUBJECT_PRESETS: Record<string, string> = {
  estimate: "Question about my estimate",
  consultation: "Consultation request",
  repair: "Help with a repair",
  package: "Question about a package",
  support: "Support request",
  quote: "Project quote request",
};

export function ContactForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const about = searchParams.get("about") ?? "";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  // null = the field has not been edited, so it shows the preset below.
  const [subjectInput, setSubjectInput] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [sentReference, setSentReference] = React.useState<string | null>(null);

  /*
   * Prefilled from the CTA that linked here, but never fighting the user
   * for the field once they have typed in it.
   *
   * Derived during render rather than synced by an effect: an effect
   * would render once with the stale value and then again with the
   * preset, which is the cascading-render pattern React now warns about.
   * Here the first render is already correct.
   */
  const preset = SUBJECT_PRESETS[about] ?? "";
  const subject = subjectInput ?? preset;

  if (sentReference) {
    return (
      <div className="flex flex-col items-start gap-3 py-6">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
          <CircleCheck className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-xl">Message received</h2>
        <p className="text-muted-foreground">
          Your reference is{" "}
          <strong className="font-semibold text-foreground">
            {sentReference}
          </strong>
          . We reply within one business day, to {email}.
        </p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => {
            setSentReference(null);
            setSubjectInput(null);
            setMessage("");
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (message.trim().length < 10) {
      next.message = "Tell us a little more — at least a sentence.";
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await sendContactMessage({
      name,
      email,
      subject,
      message,
      source: about || "contact",
    });
    setSubmitting(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    setSentReference(result.data.reference);
    toast(`Message ${result.data.reference} sent`);
  }

  function errorFor(key: keyof FieldErrors) {
    const error = errors[key];
    if (!error) return null;
    return (
      <p
        id={`contact-${key}-error`}
        className="flex items-center gap-1.5 text-xs text-destructive"
      >
        <AlertCircle className="size-3" aria-hidden="true" />
        {error}
      </p>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            placeholder="Jordan Smith"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            required
          />
          {errorFor("name")}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            required
          />
          {errorFor("email")}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          name="subject"
          placeholder="Question about pricing"
          value={subject}
          onChange={(e) => {
            setSubjectInput(e.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          placeholder="Tell us a bit about your project..."
          rows={5}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message) setErrors({ ...errors, message: undefined });
          }}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          required
        />
        {errorFor("message")}
      </div>

      <Button type="submit" size="lg" className="w-fit" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="size-4" /> Send message
          </>
        )}
      </Button>
    </form>
  );
}
