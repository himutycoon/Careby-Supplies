import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { CONTACT_INFO, FOOTER_COLUMNS, WHATSAPP_URL } from "@/data/mock";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:gap-8 md:grid-cols-6">
          <div className="col-span-2 flex flex-col gap-3 sm:gap-4">
            <Logo size="h-10" />
            {/* Word-for-word the hero subhead. On a phone it is three
                wasted lines a thumb has to travel past; on desktop it
                balances the column, so it only stands down below sm. */}
            <p className="hidden max-w-xs text-sm leading-relaxed text-muted-foreground sm:block">
              Quality products, expert guidance, project planning and
              construction support — all from one platform.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Mail className="size-4" /> {CONTACT_INFO.email}
              </a>
              {/* WhatsApp, not tel: — this is the number we actually
                  answer, and a tap should open the chat rather than
                  dial a line nobody picks up. */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <MessageCircle className="size-4" /> {CONTACT_INFO.phone}
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="size-4" /> {CONTACT_INFO.address}
              </span>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-2.5 sm:gap-3">
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <div>
            <h3 className="text-sm font-semibold">Stay in the loop</h3>
            <p className="text-sm text-muted-foreground">
              Renovation tips and product updates, no spam.
            </p>
          </div>
          <NewsletterForm />
        </div>

        {/* Two stacked lines cost a phone 20px to say what fits on one.
            The full wording returns from sm up, where there is a spare
            half-row for it anyway. */}
        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <p>
            © {new Date().getFullYear()} CareBy Canada.
            <span className="hidden sm:inline"> All rights reserved.</span>
            <span className="sm:hidden"> Mississauga, ON.</span>
          </p>
          <p className="hidden sm:block">Serving Mississauga, Ontario.</p>
        </div>
      </div>
    </footer>
  );
}
