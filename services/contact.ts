import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";

/**
 * Contact messages and newsletter signups.
 *
 * Both forms previously called preventDefault and did nothing else, which
 * mattered more than it sounds: sixteen links across the site funnel into
 * /contact — every "Talk to an Expert", "Request Consultation", "Get a
 * Quote", the contractor sidebar's "Help & Support", the customer portal's
 * "Send a message", and the terminal step of both paid New Construction
 * tiers and the repair expert path.
 *
 * Anonymous writes are allowed by the schema-08 policies, because the
 * contact page is public and reaching us must not require an account.
 */

export interface ContactMessage {
  id: string;
  reference: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface SendContactMessageInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Which CTA sent them here, so the team sees what was being asked. */
  source?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(
  input: SendContactMessageInput,
): Promise<ServiceResult<ContactMessage>> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();

  if (!name) return fail("Enter your name.");
  if (!EMAIL_PATTERN.test(email)) return fail("Enter a valid email address.");
  if (message.length < 10) {
    return fail("Tell us a little more — at least a sentence.");
  }

  const supabase = createClient();

  // Attach the sender when we know them, so they can see their own
  // messages back. Signed-out visitors still get through.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      reference: `MSG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      user_id: user?.id ?? null,
      name,
      email,
      subject: input.subject?.trim() ?? "",
      message,
      source: input.source ?? "contact",
    })
    .select("id, reference, name, email, subject, message, created_at")
    .single();

  if (error || !data) {
    console.error("[sendContactMessage]", error);
    return fail(toUserMessage(error, "We couldn't send that message."));
  }

  return ok({
    id: data.id as string,
    reference: data.reference as string,
    name: data.name as string,
    email: data.email as string,
    subject: (data.subject as string) ?? "",
    message: data.message as string,
    createdAt: data.created_at as string,
  });
}

/**
 * Subscribing twice is not an error the subscriber should ever see, and
 * the insert-only policy means we cannot read the list to check first —
 * so the unique-violation IS the "already subscribed" answer.
 */
export async function subscribeToNewsletter(
  rawEmail: string,
): Promise<ServiceResult<{ alreadySubscribed: boolean }>> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    return fail("Enter a valid email address.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  if (error?.code === "23505") {
    return ok({ alreadySubscribed: true });
  }

  if (error) {
    console.error("[subscribeToNewsletter]", error);
    return fail(toUserMessage(error, "We couldn't sign you up just now."));
  }

  return ok({ alreadySubscribed: false });
}
