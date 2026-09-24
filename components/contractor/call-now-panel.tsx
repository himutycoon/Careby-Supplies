import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO, WHATSAPP_URL } from "@/data/mock";

/**
 * Ring the ordering desk now, rather than booking a slot.
 *
 * Scheduling was the only way to reach a person here, which assumed a
 * contractor plans their day around a calendar. They do not — they call
 * from the van between jobs, and a booking form three days out is no use
 * to someone who needs material tomorrow morning. Booking still exists
 * below this, for the orders big enough to be worth sitting down for.
 *
 * `tel:` and `wa.me` both open the dialer or the chat straight from a
 * phone, so neither route costs a form.
 */
export function CallNowPanel() {
  return (
    <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Need it now? Call the desk.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Straight through to someone who can price and place the order.
            Monday to Saturday, 7am–6pm.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            className="press w-full sm:w-auto"
            render={
              <a href={`tel:${CONTACT_INFO.whatsappNumber}`}>
                <Phone className="size-4" aria-hidden="true" />
                Call {CONTACT_INFO.phone}
              </a>
            }
          />
          <Button
            size="lg"
            variant="outline"
            className="press w-full sm:w-auto"
            render={
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp
              </a>
            }
          />
        </div>
      </div>
    </div>
  );
}
