"use client";

import * as React from "react";
import { Copy, Link2, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast";

/**
 * Hand the selection link to the customer.
 *
 * Nothing on this site sends email, so the contractor sends this
 * themselves — which is what the client found when he went looking for
 * it in his inbox. What was here was a bare URL and "Copy link", so it
 * arrived in a customer's chat with no idea what it was or what to do
 * with it.
 *
 * The buttons below open the contractor's own WhatsApp or mail client
 * with the message already written. We are not sending anything on their
 * behalf and this does not pretend to: it saves them typing the same
 * three sentences every time.
 */

function firstName(full: string): string {
  const name = full.trim().split(/\s+/)[0] ?? "";
  return name || "there";
}

/** Digits only, which is what wa.me expects. Empty opens the chooser. */
function waNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function SharePackage({
  url,
  packageName,
  customerName,
  customerEmail,
  customerPhone,
}: {
  url: string;
  packageName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}) {
  const { toast } = useToast();

  const message = [
    `Hi ${firstName(customerName)},`,
    "",
    `Here are the finishes to choose for ${packageName}.`,
    "Open the link, pick what you'd like for each item, and send it back to me when you're done. You can stop part-way and come back to it.",
    "",
    url,
  ].join("\n");

  function copy(text: string, said: string) {
    navigator.clipboard.writeText(text).then(
      () => toast(said),
      () => toast("Couldn't copy — select it and copy by hand", "error"),
    );
  }

  const whatsapp = `https://wa.me/${waNumber(customerPhone)}?text=${encodeURIComponent(message)}`;
  const mail =
    `mailto:${encodeURIComponent(customerEmail)}` +
    `?subject=${encodeURIComponent(`Your selections for ${packageName}`)}` +
    `&body=${encodeURIComponent(message)}`;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link2
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <code className="min-w-0 flex-1 truncate text-sm">{url}</code>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => copy(message, "Message copied — paste it to your customer")}
        >
          <Copy className="size-3.5" /> Copy message
        </Button>

        <Button
          size="sm"
          variant="outline"
          render={
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-3.5" /> WhatsApp
            </a>
          }
        />

        <Button
          size="sm"
          variant="outline"
          render={
            <a href={mail}>
              <Mail className="size-3.5" /> Email
            </a>
          }
        />

        <Button
          size="sm"
          variant="ghost"
          onClick={() => copy(url, "Link copied")}
        >
          Copy link only
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        We don&apos;t email your customer — you send this, so it comes from
        you. WhatsApp and Email open with the message already written.
      </p>
    </section>
  );
}
